import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { hasActiveBuyerOrder, isAllowedProof, canSellerConfirmOrder } from "./order-policy.js";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";
const UNLOCK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
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

function cleanEmail(value) {
  return cleanText(value, 160).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function publicOrder(order, id, unlock) {
  const confirmed = order.status === "confirmed";
  const isFile = order.type !== "code";
  const downloadsRemaining = isFile && unlock
    ? Math.max(0, MAX_FILE_DOWNLOADS - Number(unlock.downloadCount || 0))
    : null;
  return {
    id,
    productId: order.productId,
    productName: order.productName,
    price: Number(order.price || 0),
    type: order.type === "code" ? "code" : "file",
    status: order.status,
    createdAt: order.createdAt?.toDate?.().toISOString?.() || null,
    confirmedAt: order.confirmedAt?.toDate?.().toISOString?.() || null,
    paymentInstructions: order.paymentInstructions || "",
    proofSubmitted: Boolean(order.proofPath),
    downloadReady: confirmed && isFile && Boolean(unlock) && downloadsRemaining > 0,
    downloadsRemaining,
    maxDownloads: isFile ? MAX_FILE_DOWNLOADS : null,
    licenseCode: confirmed && order.type === "code" ? (unlock?.licenseCode || "") : "",
  };
}

async function createOrder(req, res, account) {
  const productId = cleanText(req.body?.productId, 160);
  const buyerEmail = cleanEmail(req.body?.buyerEmail || account.email);
  if (!isValidId(productId)) throw new OrderError(400, "رابط المنتج غير واضح.");
  if (!validEmail(buyerEmail)) throw new OrderError(400, "اكتب بريدك الإلكتروني بشكل صحيح.");

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
  const paymentInstructions = cleanText(sellerSnap.exists ? sellerSnap.data().paymentInstructions : "", 800);
  if (paymentInstructions.length < 6) {
    throw new OrderError(409, "صاحب المتجر لم يضف تعليمات التحويل لهذا المنتج بعد.");
  }

  const orderRef = db.collection("orders").doc(`${account.uid}_${productId}`);
  await db.runTransaction(async (transaction) => {
    const existingOrder = await transaction.get(orderRef);
    if (existingOrder.exists && hasActiveBuyerOrder([existingOrder.data()], productId)) {
      throw new OrderError(409, "لديك طلب سابق لهذا المنتج على هذا الجهاز. افتح «طلباتي» للمتابعة.");
    }
    transaction.set(orderRef, {
      ownerId: product.ownerId,
      buyerUid: account.uid,
      buyerEmail,
      productId,
      productName: cleanText(product.name, 160) || "منتج رقمي",
      price: Number(product.price),
      type: product.type,
      status: "draft",
      paymentInstructions,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return res.status(201).json({ order: { id: orderRef.id, paymentInstructions } });
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

async function confirmPayment(req, res, account) {
  const orderId = cleanText(req.body?.orderId, 160);
  if (!isValidId(orderId)) throw new OrderError(400, "الطلب غير محدد.");
  await requireSeller(account.uid);

  const orderRef = db.collection("orders").doc(orderId);
  const result = await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) throw new OrderError(404, "لم نجد هذا الطلب.");
    const order = orderSnap.data();
    if (order.ownerId !== account.uid) throw new OrderError(403, "لا تملك هذا الطلب.");
    if (order.status === "confirmed") return { alreadyConfirmed: true, type: order.type };
    if (!canSellerConfirmOrder(order, account.uid)) {
      throw new OrderError(409, "هذا الطلب ليس جاهزًا لتأكيد التحويل.");
    }

    const productRef = db.collection("products").doc(order.productId);
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists || productSnap.data().ownerId !== account.uid || productSnap.data().suspended) {
      throw new OrderError(409, "المنتج غير متاح للتسليم الآن.");
    }
    const product = productSnap.data();
    const unlockRef = db.collection("unlocks").doc(`${order.buyerUid}_${order.productId}`);
    const unlockPayload = {
      uid: order.buyerUid,
      productId: order.productId,
      orderId,
      ownerId: account.uid,
      type: product.type === "code" ? "code" : "file",
      downloadCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + UNLOCK_TTL_MS)),
    };

    if (product.type === "code") {
      const availableCodes = await transaction.get(productRef.collection("codes").where("used", "==", false).limit(1));
      if (availableCodes.empty) throw new OrderError(409, "لا توجد أكواد غير مستخدمة لهذا المنتج الآن.");
      const codeDoc = availableCodes.docs[0];
      const code = codeDoc.data().code;
      if (!code) throw new OrderError(409, "تعذر تجهيز كود لهذا المنتج.");
      transaction.update(codeDoc.ref, {
        used: true,
        usedBy: order.buyerEmail,
        usedByUid: order.buyerUid,
        usedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(productRef, { codesCount: Math.max(0, Number(product.codesCount || 0) - 1) });
      unlockPayload.licenseCode = code;
    } else if (!product.filePath) {
      throw new OrderError(409, "ملف المنتج غير جاهز للتسليم الآن.");
    }

    transaction.set(unlockRef, unlockPayload, { merge: true });
    transaction.update(orderRef, {
      status: "confirmed",
      confirmedAt: FieldValue.serverTimestamp(),
      confirmedBy: account.uid,
    });
    return { alreadyConfirmed: false, type: unlockPayload.type };
  });
  return res.status(200).json({ ok: true, alreadyConfirmed: result.alreadyConfirmed, type: result.type });
}

async function listBuyerOrders(req, res, account) {
  const snap = await db.collection("orders").where("buyerUid", "==", account.uid).limit(100).get();
  const rows = await Promise.all(snap.docs.map(async (document) => {
    const order = document.data();
    const unlock = order.status === "confirmed"
      ? (await db.collection("unlocks").doc(`${account.uid}_${order.productId}`).get()).data()
      : null;
    return publicOrder(order, document.id, unlock);
  }));
  rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return res.status(200).json({ orders: rows });
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
    if (action === "list_buyer") return await listBuyerOrders(req, res, account);
    if (action === "proof_url") return await proofUrl(req, res, account);
    if (action === "save_payment_instructions") return await savePaymentInstructions(req, res, account);
    return res.status(400).json({ error: "طلب الطلبات غير واضح." });
  } catch (error) {
    if (error instanceof OrderError) return res.status(error.code).json({ error: error.message });
    console.error("orders endpoint error:", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تنفيذ الطلب الآن. حاول مرة ثانية." });
  }
}
