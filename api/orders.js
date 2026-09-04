import { randomBytes } from "crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { isAllowedProof, canSellerConfirmOrder } from "./order-policy.js";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";
const UNLOCK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DELIVERY_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TAP_API_BASE = "https://api.tap.company/v2";
export const MAX_FILE_DOWNLOADS = 5;

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
}

const db = getFirestore();
const auth = getAuth();
const bucket = getStorage().bucket();

class OrderError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function requireActiveSeller(sellerSnap) {
  if (!sellerSnap.exists) return {};
  const seller = sellerSnap.data();
  if (seller.disabled) throw new OrderError(409, "هذا المتجر متوقف حاليًا. تواصل مع التاجر.");
  if (seller.subscriptionExpiresAt && new Date(seller.subscriptionExpiresAt) < new Date()) {
    throw new OrderError(409, "اشتراك هذا المتجر منتهي حاليًا. تواصل مع التاجر.");
  }
  return seller;
}

function cleanPhone(value) {
  return String(value || "").replace(/[^\d+]/g, "").slice(0, 20);
}

function validPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function isValidId(value) {
  return /^[A-Za-z0-9_-]{8,160}$/.test(cleanText(value, 160));
}

function safeProofPath(uid, orderId, proofPath) {
  const prefix = `payment-proofs/${uid}/${orderId}/`;
  const normalized = cleanText(proofPath, 360);
  return normalized.startsWith(prefix) && normalized.length > prefix.length && !normalized.includes("..") ? normalized : "";
}

async function authenticatedAccount(req) {
  const header = String(req.headers.authorization || "");
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) throw new OrderError(401, "سجّل دخولك أولًا ثم حاول مرة ثانية.");
  try {
    return await auth.verifyIdToken(idToken);
  } catch {
    throw new OrderError(401, "جلستك غير صالحة. حدّث الصفحة وحاول مرة ثانية.");
  }
}

async function requireSeller(uid) {
  const sellerSnap = await db.collection("sellers").doc(uid).get();
  if (!sellerSnap.exists) throw new OrderError(403, "هذه العملية خاصة بصاحب المتجر.");
}

function unlockView(unlock, confirmed) {
  const isFile = !unlock || unlock.type !== "code";
  const downloadsRemaining = isFile && unlock
    ? Math.max(0, MAX_FILE_DOWNLOADS - Number(unlock.downloadCount || 0))
    : null;
  return {
    downloadReady: confirmed && isFile && Boolean(unlock) && downloadsRemaining > 0,
    downloadsRemaining,
    maxDownloads: isFile ? MAX_FILE_DOWNLOADS : null,
    licenseCode: confirmed && unlock?.type === "code" ? (unlock.licenseCode || "") : "",
  };
}

function publicOrder(order, id, unlockData) {
  const confirmed = order.status === "confirmed";
  const base = {
    id,
    productId: order.productId,
    productName: order.productName,
    price: Number(order.price || 0),
    originalPrice: order.couponCode ? Number(order.originalPrice || order.price || 0) : null,
    couponCode: order.couponCode || "",
    status: order.status,
    createdAt: order.createdAt?.toDate?.().toISOString?.() || null,
    confirmedAt: order.confirmedAt?.toDate?.().toISOString?.() || null,
    paymentInstructions: order.paymentInstructions || "",
    proofSubmitted: Boolean(order.proofPath),
  };

  if (order.type === "bundle") {
    const productIds = Array.isArray(order.productIds) ? order.productIds : [];
    const productNames = Array.isArray(order.productNames) ? order.productNames : [];
    const unlocksByProductId = unlockData || {};
    return {
      ...base,
      type: "bundle",
      bundleId: order.bundleId,
      items: productIds.map((productId, index) => ({
        productId,
        productName: productNames[index] || "منتج رقمي",
        ...unlockView(unlocksByProductId[productId] || null, confirmed),
      })),
    };
  }

  return { ...base, type: order.type === "code" ? "code" : "file", ...unlockView(unlockData, confirmed) };
}

async function resolveCoupon(rawCode, productId, ownerId) {
  const code = cleanText(rawCode, 40).toUpperCase();
  if (!code) return { discountPercent: 0, couponCode: "" };
  const couponSnap = await db.collection("coupons")
    .where("code", "==", code)
    .where("ownerId", "==", ownerId)
    .where("active", "==", true)
    .limit(5)
    .get();
  const match = couponSnap.docs.find((item) => {
    const scope = item.data().productId;
    return scope === null || scope === undefined || scope === productId;
  });
  if (!match) {
    throw new OrderError(400, "كود الخصم غير صالح أو غير متاح لهذا المنتج.");
  }
  const discountPercent = Number(match.data().discountPercent || 0);
  return { discountPercent, couponCode: code };
}

async function createBundleOrder(req, res, account) {
  const bundleId = cleanText(req.body?.bundleId, 160);
  const buyerPhone = cleanPhone(req.body?.buyerPhone);
  if (!isValidId(bundleId)) throw new OrderError(400, "رابط الحزمة غير واضح.");
  if (!validPhone(buyerPhone)) throw new OrderError(400, "اكتب رقم واتسابك بشكل صحيح.");

  const bundleSnap = await db.collection("bundles").doc(bundleId).get();
  if (!bundleSnap.exists) throw new OrderError(404, "الحزمة غير موجودة.");
  const bundle = bundleSnap.data();
  if (bundle.hidden !== false || bundle.suspended) {
    throw new OrderError(409, "هذه الحزمة غير متاحة للطلب الآن.");
  }
  const productIds = Array.isArray(bundle.productIds) ? bundle.productIds : [];
  if (productIds.length < 2) throw new OrderError(409, "هذه الحزمة غير جاهزة للطلب الآن.");

  const productSnaps = await Promise.all(productIds.map((id) => db.collection("products").doc(id).get()));
  for (const snap of productSnaps) {
    if (!snap.exists) throw new OrderError(409, "أحد منتجات الحزمة لم يعد متاحًا.");
    const item = snap.data();
    if (item.suspended) throw new OrderError(409, "أحد منتجات الحزمة غير متاح حاليًا.");
    if (item.type === "file" && !item.filePath) throw new OrderError(409, "أحد ملفات الحزمة غير جاهز للتسليم الآن.");
    if (item.type === "code" && Number(item.codesCount || 0) < 1) throw new OrderError(409, "أحد أكواد الحزمة نفذ حاليًا.");
  }

  const sellerSnap = await db.collection("sellers").doc(bundle.ownerId).get();
  const seller = requireActiveSeller(sellerSnap);
  const paymentInstructions = cleanText(seller.paymentInstructions, 800);
  if (paymentInstructions.length < 6) {
    throw new OrderError(409, "صاحب المتجر لم يضف تعليمات التحويل لهذه الحزمة بعد.");
  }

  const draftSnap = await db.collection("orders")
    .where("buyerUid", "==", account.uid)
    .where("productId", "==", `bundle_${bundleId}`)
    .where("status", "==", "draft")
    .limit(1)
    .get();
  if (!draftSnap.empty) {
    const existing = draftSnap.docs[0].data();
    return res.status(200).json({ order: { id: draftSnap.docs[0].id, paymentInstructions: existing.paymentInstructions, price: Number(existing.price) } });
  }

  const orderRef = db.collection("orders").doc();
  await orderRef.set({
    ownerId: bundle.ownerId,
    buyerUid: account.uid,
    buyerPhone,
    bundleId,
    productId: `bundle_${bundleId}`,
    productIds,
    productNames: productSnaps.map((snap) => cleanText(snap.data().name, 160) || "منتج رقمي"),
    productName: cleanText(bundle.name, 160) || "حزمة منتجات",
    price: Number(bundle.price),
    type: "bundle",
    status: "draft",
    paymentInstructions,
    createdAt: FieldValue.serverTimestamp(),
  });
  return res.status(201).json({ order: { id: orderRef.id, paymentInstructions, price: Number(bundle.price) } });
}

async function createOrder(req, res, account) {
  if (req.body?.bundleId) return createBundleOrder(req, res, account);
  const productId = cleanText(req.body?.productId, 160);
  const buyerPhone = cleanPhone(req.body?.buyerPhone);
  if (!isValidId(productId)) throw new OrderError(400, "رابط المنتج غير واضح.");
  if (!validPhone(buyerPhone)) throw new OrderError(400, "اكتب رقم واتسابك بشكل صحيح.");

  const productSnap = await db.collection("products").doc(productId).get();
  if (!productSnap.exists) throw new OrderError(404, "المنتج غير موجود.");
  const product = productSnap.data();
  if (product.hidden || product.suspended || Number(product.price) <= 0) {
    throw new OrderError(409, "هذا المنتج غير متاح للطلب الآن.");
  }
  if (product.type !== "file" && product.type !== "code") {
    throw new OrderError(409, "نوع هذا المنتج غير جاهز للطلب الآن.");
  }
  if (product.type === "file" && !product.filePath) {
    throw new OrderError(409, "ملف المنتج غير جاهز للتسليم الآن.");
  }
  if (product.type === "code" && Number(product.codesCount || 0) < 1) {
    throw new OrderError(409, "لا توجد أكواد متاحة لهذا المنتج الآن.");
  }

  const sellerSnap = await db.collection("sellers").doc(product.ownerId).get();
  const seller = requireActiveSeller(sellerSnap);
  const paymentInstructions = cleanText(seller.paymentInstructions, 800);
  if (paymentInstructions.length < 6) {
    throw new OrderError(409, "صاحب المتجر لم يضف تعليمات التحويل لهذا المنتج بعد.");
  }

  const originalPrice = Number(product.price);
  const { discountPercent, couponCode } = await resolveCoupon(req.body?.couponCode, productId, product.ownerId);
  const finalPrice = couponCode
    ? Math.max(0.01, Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100)
    : originalPrice;

  const draftSnap = await db.collection("orders")
    .where("buyerUid", "==", account.uid)
    .where("productId", "==", productId)
    .where("status", "==", "draft")
    .limit(1)
    .get();
  if (!draftSnap.empty) {
    const existing = draftSnap.docs[0].data();
    return res.status(200).json({
      order: {
        id: draftSnap.docs[0].id,
        paymentInstructions: existing.paymentInstructions,
        price: Number(existing.price),
        originalPrice: Number(existing.originalPrice),
        couponCode: existing.couponCode || "",
      },
    });
  }

  const orderRef = db.collection("orders").doc();
  await orderRef.set({
    ownerId: product.ownerId,
    buyerUid: account.uid,
    buyerPhone,
    productId,
    productName: cleanText(product.name, 160) || "منتج رقمي",
    price: finalPrice,
    originalPrice,
    couponCode,
    type: product.type,
    status: "draft",
    paymentInstructions,
    createdAt: FieldValue.serverTimestamp(),
  });
  return res.status(201).json({ order: { id: orderRef.id, paymentInstructions, price: finalPrice, originalPrice, couponCode } });
}

async function submitProof(req, res, account) {
  const orderId = cleanText(req.body?.orderId, 160);
  const proofPath = safeProofPath(account.uid, orderId, req.body?.proofPath);
  const proofName = cleanText(req.body?.proofName, 160);
  if (!isValidId(orderId) || !proofPath || !proofName) {
    throw new OrderError(400, "بيانات إثبات التحويل غير مكتملة.");
  }

  const orderRef = db.collection("orders").doc(orderId);
  const [orderSnap, metadata] = await Promise.all([
    orderRef.get(),
    bucket.file(proofPath).getMetadata().then(([data]) => data).catch(() => null),
  ]);
  if (!orderSnap.exists || orderSnap.data().buyerUid !== account.uid) {
    throw new OrderError(403, "لا تملك هذا الطلب.");
  }
  const order = orderSnap.data();
  if (order.status !== "draft") {
    throw new OrderError(409, "تم إرسال إثبات هذا الطلب مسبقًا.");
  }
  const size = Number(metadata?.size || 0);
  const contentType = String(metadata?.contentType || "").toLowerCase();
  if (!metadata || !isAllowedProof({ size, contentType })) {
    throw new OrderError(400, "الإيصال يجب أن يكون JPG أو PNG أو WEBP أو PDF وبحجم أقل من 5 م.ب.");
  }

  await orderRef.update({
    status: "awaiting_seller_confirmation",
    proofPath,
    proofName,
    proofContentType: contentType,
    proofSize: size,
    proofSubmittedAt: FieldValue.serverTimestamp(),
  });
  return res.status(200).json({ ok: true, status: "awaiting_seller_confirmation" });
}

async function unlockOneProduct(transaction, { productId, buyerUid, buyerPhone, orderId, ownerId }) {
  const productRef = db.collection("products").doc(productId);
  const productSnap = await transaction.get(productRef);
  if (!productSnap.exists || productSnap.data().ownerId !== ownerId || productSnap.data().suspended) {
    throw new OrderError(409, "أحد المنتجات لم يعد متاحًا للتسليم الآن.");
  }
  const product = productSnap.data();
  let codeDoc = null;
  if (product.type === "code") {
    const availableCodes = await transaction.get(productRef.collection("codes").where("used", "==", false).limit(1));
    if (availableCodes.empty) throw new OrderError(409, "لا توجد أكواد غير مستخدمة لأحد منتجات هذا الطلب الآن.");
    codeDoc = availableCodes.docs[0];
    if (!codeDoc.data().code) throw new OrderError(409, "تعذر تجهيز كود لأحد منتجات هذا الطلب.");
  } else if (!product.filePath) {
    throw new OrderError(409, "ملف أحد منتجات هذا الطلب غير جاهز للتسليم الآن.");
  }

  return () => {
    const unlockRef = db.collection("unlocks").doc(`${buyerUid}_${productId}`);
    const unlockPayload = {
      uid: buyerUid,
      productId,
      orderId,
      ownerId,
      type: product.type === "code" ? "code" : "file",
      downloadCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + UNLOCK_TTL_MS)),
    };
    if (codeDoc) {
      transaction.update(codeDoc.ref, {
        used: true,
        usedBy: buyerPhone,
        usedByUid: buyerUid,
        usedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(productRef, { codesCount: Math.max(0, Number(product.codesCount || 0) - 1) });
      unlockPayload.licenseCode = codeDoc.data().code;
    }
    transaction.set(unlockRef, unlockPayload, { merge: true });
  };
}

// يشترك فيها تأكيد التاجر اليدوي وتأكيد الدفع التلقائي ببطاقة عبر Tap.
// كل قراءات المنتجات والأكواد لازم تنتهي قبل أي كتابة داخل نفس المعاملة،
// فنجهّز دوال الكتابة أولًا (unlockOneProduct) ثم ننفذها كلها بعدين.
async function markOrderConfirmed(orderRef, orderId, confirmedBy) {
  return await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) throw new OrderError(404, "لم نجد هذا الطلب.");
    const order = orderSnap.data();
    if (order.status === "confirmed") return { alreadyConfirmed: true, type: order.type };

    const productIds = order.type === "bundle" ? order.productIds : [order.productId];
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new OrderError(409, "بيانات هذا الطلب غير مكتملة.");
    }
    const applyUnlocks = [];
    for (const productId of productIds) {
      applyUnlocks.push(await unlockOneProduct(transaction, {
        productId,
        buyerUid: order.buyerUid,
        buyerPhone: order.buyerPhone,
        orderId,
        ownerId: order.ownerId,
      }));
    }
    applyUnlocks.forEach((apply) => apply());

    const deliveryToken = randomBytes(24).toString("hex");
    transaction.update(orderRef, {
      status: "confirmed",
      confirmedAt: FieldValue.serverTimestamp(),
      confirmedBy,
      deliveryToken,
      deliveryTokenExpiresAt: Timestamp.fromDate(new Date(Date.now() + DELIVERY_TOKEN_TTL_MS)),
    });
    return { alreadyConfirmed: false, type: order.type };
  });
}

async function confirmPayment(req, res, account) {
  const orderId = cleanText(req.body?.orderId, 160);
  if (!isValidId(orderId)) throw new OrderError(400, "الطلب غير محدد.");
  await requireSeller(account.uid);

  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new OrderError(404, "لم نجد هذا الطلب.");
  const order = orderSnap.data();
  if (order.ownerId !== account.uid) throw new OrderError(403, "لا تملك هذا الطلب.");
  if (order.status !== "confirmed" && !canSellerConfirmOrder(order, account.uid)) {
    throw new OrderError(409, "هذا الطلب ليس جاهزًا لتأكيد التحويل.");
  }

  const result = await markOrderConfirmed(orderRef, orderId, account.uid);
  return res.status(200).json({ ok: true, alreadyConfirmed: result.alreadyConfirmed, type: result.type });
}

// افتراض عملي: أرقام واتساب المشترين مكتوبة بدون كود الدولة (نفس افتراض بقية الموقع، مُونَة مخصصة لعُمان حاليًا).
function splitPhoneForTap(rawPhone) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  const local = digits.startsWith("968") && digits.length > 8 ? digits.slice(3) : digits;
  return { country_code: 968, number: Number(local) || 0 };
}

async function tapRequest(method, path, body) {
  const secretKey = process.env.TAP_SECRET_KEY;
  if (!secretKey) throw new OrderError(409, "الدفع بالبطاقة غير مفعّل حاليًا. استخدم التحويل اليدوي.");
  const response = await fetch(`${TAP_API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Tap API error:", data?.errors || data);
    throw new OrderError(502, "تعذر الاتصال ببوابة الدفع الآن. جرب التحويل اليدوي.");
  }
  return data;
}

async function createCardCharge(req, res, account) {
  const orderId = cleanText(req.body?.orderId, 160);
  if (!isValidId(orderId)) throw new OrderError(400, "الطلب غير محدد.");
  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists || orderSnap.data().buyerUid !== account.uid) {
    throw new OrderError(403, "لا تملك هذا الطلب.");
  }
  const order = orderSnap.data();
  if (order.status !== "draft") {
    throw new OrderError(409, "هذا الطلب لا يقبل الدفع الآن.");
  }

  const origin = `https://${req.headers.host || "monah-app.com"}`;
  const charge = await tapRequest("POST", "/charges/", {
    amount: Number(Number(order.price).toFixed(3)),
    currency: "OMR",
    customer: {
      first_name: "عميل مُونَة",
      email: `buyer-${account.uid}@monah-app.com`,
      phone: splitPhoneForTap(order.buyerPhone),
    },
    source: { id: "src_all" },
    threeDSecure: true,
    description: cleanText(order.productName, 160) || "طلب من مُونَة",
    reference: { order: orderId },
    metadata: { orderId },
    redirect: { url: `${origin}/#pay-result/${orderId}` },
  });

  if (!charge.id || !charge.transaction?.url) {
    throw new OrderError(502, "تعذر تجهيز صفحة الدفع الآن. جرب التحويل اليدوي.");
  }
  await orderRef.update({ tapChargeId: charge.id });
  return res.status(200).json({ url: charge.transaction.url });
}

async function verifyCardCharge(req, res, account) {
  const orderId = cleanText(req.body?.orderId, 160);
  if (!isValidId(orderId)) throw new OrderError(400, "الطلب غير محدد.");
  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists || orderSnap.data().buyerUid !== account.uid) {
    throw new OrderError(403, "لا تملك هذا الطلب.");
  }
  const order = orderSnap.data();
  if (order.status === "confirmed") {
    return res.status(200).json({ paid: true, type: order.type });
  }
  if (!order.tapChargeId) {
    throw new OrderError(409, "لا توجد عملية دفع بالبطاقة لهذا الطلب.");
  }

  const charge = await tapRequest("GET", `/charges/${order.tapChargeId}`);
  if (charge.status !== "CAPTURED") {
    return res.status(200).json({ paid: false, status: charge.status || "unknown" });
  }
  const result = await markOrderConfirmed(orderRef, orderId, "tap");
  return res.status(200).json({ paid: true, type: result.type });
}

async function listBuyerOrders(req, res, account) {
  const snap = await db.collection("orders").where("buyerUid", "==", account.uid).limit(100).get();
  const rows = await Promise.all(snap.docs.map(async (document) => {
    const order = document.data();
    if (order.status !== "confirmed") return publicOrder(order, document.id, null);
    if (order.type === "bundle") {
      const productIds = Array.isArray(order.productIds) ? order.productIds : [];
      const unlockSnaps = await Promise.all(
        productIds.map((productId) => db.collection("unlocks").doc(`${account.uid}_${productId}`).get())
      );
      const unlocksByProductId = {};
      productIds.forEach((productId, index) => { unlocksByProductId[productId] = unlockSnaps[index].data(); });
      return publicOrder(order, document.id, unlocksByProductId);
    }
    const unlock = (await db.collection("unlocks").doc(`${account.uid}_${order.productId}`).get()).data();
    return publicOrder(order, document.id, unlock);
  }));
  rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return res.status(200).json({ orders: rows });
}

function deliveryTokenValid(order, token) {
  if (!token || !order.deliveryToken || token !== order.deliveryToken) return false;
  const expiresAt = order.deliveryTokenExpiresAt?.toDate?.();
  return Boolean(expiresAt) && expiresAt > new Date();
}

async function deliverOrder(req, res) {
  const orderId = cleanText(req.body?.orderId, 160);
  const token = cleanText(req.body?.token, 80);
  if (!isValidId(orderId) || !token) throw new OrderError(400, "رابط التسليم غير صالح.");
  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) throw new OrderError(404, "لم نجد هذا الطلب.");
  const order = orderSnap.data();
  if (!deliveryTokenValid(order, token)) throw new OrderError(403, "رابط التسليم غير صالح أو منتهي.");
  if (order.status !== "confirmed") throw new OrderError(409, "هذا الطلب ليس جاهزًا للتسليم بعد.");

  if (order.type === "bundle") {
    const productIds = Array.isArray(order.productIds) ? order.productIds : [];
    const unlockSnaps = await Promise.all(
      productIds.map((productId) => db.collection("unlocks").doc(`${order.buyerUid}_${productId}`).get())
    );
    const unlocksByProductId = {};
    productIds.forEach((productId, index) => { unlocksByProductId[productId] = unlockSnaps[index].data(); });
    return res.status(200).json({ order: publicOrder(order, orderId, unlocksByProductId) });
  }
  const unlock = (await db.collection("unlocks").doc(`${order.buyerUid}_${order.productId}`).get()).data();
  return res.status(200).json({ order: publicOrder(order, orderId, unlock) });
}

async function receipt(req, res, account) {
  const orderId = cleanText(req.body?.orderId, 160);
  const token = cleanText(req.body?.token, 80);
  if (!isValidId(orderId)) throw new OrderError(400, "الطلب غير محدد.");
  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) throw new OrderError(404, "لم نجد هذا الطلب.");
  const order = orderSnap.data();
  const canRead = deliveryTokenValid(order, token) || order.buyerUid === account.uid || order.ownerId === account.uid;
  if (!canRead) throw new OrderError(403, "لا تملك صلاحية رؤية هذه الفاتورة.");
  if (order.status !== "confirmed") throw new OrderError(409, "الفاتورة تظهر فقط بعد تأكيد التاجر استلام المبلغ.");

  const storeSnap = await db.collection("stores").doc(order.ownerId).get();
  const storeData = storeSnap.exists ? storeSnap.data() : {};
  const storeName = cleanText(storeData.name, 120) || "متجر مُونَة";
  const storeLogoUrl = cleanText(storeData.logoUrl, 500);

  return res.status(200).json({
    receipt: {
      orderId,
      receiptNumber: orderId.slice(0, 8).toUpperCase(),
      storeName,
      storeLogoUrl,
      productName: order.productName,
      items: order.type === "bundle" && Array.isArray(order.productNames) ? order.productNames : null,
      price: Number(order.price || 0),
      originalPrice: order.couponCode ? Number(order.originalPrice || order.price || 0) : null,
      couponCode: order.couponCode || "",
      buyerPhone: order.buyerPhone,
      confirmedAt: order.confirmedAt?.toDate?.().toISOString?.() || null,
    },
  });
}

async function proofUrl(req, res, account) {
  const orderId = cleanText(req.body?.orderId, 160);
  if (!isValidId(orderId)) throw new OrderError(400, "الطلب غير محدد.");
  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) throw new OrderError(404, "لم نجد هذا الطلب.");
  const order = orderSnap.data();
  const canRead = order.buyerUid === account.uid || order.ownerId === account.uid;
  if (!canRead || !order.proofPath) throw new OrderError(403, "لا تملك صلاحية رؤية هذا الإيصال.");
  const [url] = await bucket.file(order.proofPath).getSignedUrl({ action: "read", expires: Date.now() + 5 * 60 * 1000 });
  return res.status(200).json({ url });
}

async function savePaymentInstructions(req, res, account) {
  await requireSeller(account.uid);
  const paymentInstructions = cleanText(req.body?.paymentInstructions, 800);
  if (paymentInstructions.length < 6) {
    throw new OrderError(400, "اكتب تعليمات التحويل بوضوح قبل الحفظ.");
  }
  if (/\b(password|otp|رمز\s*تحقق|كلمة\s*مرور)\b/i.test(paymentInstructions)) {
    throw new OrderError(400, "لا تضع كلمة مرور أو رمز تحقق ضمن تعليمات التحويل.");
  }
  const sellerRef = db.collection("sellers").doc(account.uid);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new OrderError(409, "لم نجد متجرًا مفعّلًا لهذا الحساب.");
  await sellerRef.set({ paymentInstructions, paymentInstructionsUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return res.status(200).json({ ok: true, paymentInstructions });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "الطريقة غير مدعومة." });
  }
  try {
    const account = await authenticatedAccount(req);
    const action = cleanText(req.body?.action, 40);
    if (action === "create") return await createOrder(req, res, account);
    if (action === "submit_proof") return await submitProof(req, res, account);
    if (action === "confirm") return await confirmPayment(req, res, account);
    if (action === "create_card_charge") return await createCardCharge(req, res, account);
    if (action === "verify_card_charge") return await verifyCardCharge(req, res, account);
    if (action === "list_buyer") return await listBuyerOrders(req, res, account);
    if (action === "proof_url") return await proofUrl(req, res, account);
    if (action === "receipt") return await receipt(req, res, account);
    if (action === "deliver") return await deliverOrder(req, res);
    if (action === "save_payment_instructions") return await savePaymentInstructions(req, res, account);
    return res.status(400).json({ error: "طلب الطلبات غير واضح." });
  } catch (error) {
    if (error instanceof OrderError) return res.status(error.code).json({ error: error.message });
    console.error("orders endpoint error:", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تنفيذ الطلب الآن. حاول مرة ثانية." });
  }
}
