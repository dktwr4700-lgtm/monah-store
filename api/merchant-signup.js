import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { ompayRequest, ompayChargeSucceeded } from "../lib/ompay-client.js";
import { ADD_ON_CATALOG, BASE_MONTHLY_PRICE, CUSTOM_DOMAIN_MONTHLY_PRICE } from "../src/subscriptionCatalog.js";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
}

const db = getFirestore();
const FIREBASE_WEB_API_KEY = "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc";
const STORE_TYPES = new Set(["books", "videos", "codes", "files"]);
const MONTHLY_PLAN_PRICE = BASE_MONTHLY_PRICE;
const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const CUSTOM_DOMAIN_PRICE = CUSTOM_DOMAIN_MONTHLY_PRICE;
const DOMAIN_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;
const RESERVED_DOMAIN_SLUGS = new Set(["www", "api", "admin", "app", "store", "mail", "monah", "dashboard", "assets", "static"]);

class SignupError extends Error {
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

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function cleanDomainSlug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
}

async function domainSlugAvailable(slug, excludeUid) {
  if (!DOMAIN_SLUG_PATTERN.test(slug) || RESERVED_DOMAIN_SLUGS.has(slug)) return false;
  const existing = await db.collection("sellers").where("customDomainSlug", "==", slug).limit(1).get();
  return existing.empty || existing.docs[0].id === excludeUid;
}

function cleanAddOnKeys(value) {
  const requested = Array.isArray(value) ? value : [];
  const valid = new Set(ADD_ON_CATALOG.map((item) => item.key));
  return Array.from(new Set(requested.filter((key) => valid.has(key))));
}

function addOnsTotal(keys) {
  return keys.reduce((sum, key) => sum + (ADD_ON_CATALOG.find((item) => item.key === key)?.price || 0), 0);
}

async function resolveSignupCoupon(rawCode) {
  const code = cleanText(rawCode, 40).toUpperCase();
  if (!code) return { discountAmount: 0, couponCode: "" };
  const snap = await db.collection("signupCoupons").doc(code).get();
  if (!snap.exists || snap.data().active === false) {
    throw new SignupError(400, "كود الخصم غير صحيح أو غير مفعّل.");
  }
  const data = snap.data();
  const maxUses = data.maxUses;
  const usedCount = Number(data.usedCount || 0);
  if (typeof maxUses === "number" && usedCount >= maxUses) {
    throw new SignupError(400, "كود الخصم وصل الحد الأقصى للاستخدام.");
  }
  return { discountAmount: Number(data.discountAmount || 0), couponCode: code };
}

async function checkSignupCoupon(req, res) {
  await authenticatedAccount(req);
  try {
    const { discountAmount, couponCode } = await resolveSignupCoupon(req.body?.code);
    if (!couponCode) return res.status(200).json({ valid: false, reason: "اكتب كود الخصم." });
    return res.status(200).json({ valid: true, discountAmount });
  } catch (error) {
    return res.status(200).json({ valid: false, reason: error.message || "كود الخصم غير صحيح." });
  }
}

function chargeRedirectUrl(charge) {
  const url = charge?.redirect_url || charge?.redirectUrl || charge?.data?.redirect_url || charge?.data?.redirectUrl;
  if (!url) console.error("OmPay bank-hosted charge missing redirect_url. Raw response:", JSON.stringify(charge));
  return url;
}

async function verifiedAccount(idToken) {
  if (!idToken) return null;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;
  const account = (await response.json())?.users?.[0];
  return account?.localId && account?.email ? { uid: account.localId, email: cleanEmail(account.email) } : null;
}

async function authenticatedAccount(req) {
  const header = String(req.headers.authorization || "");
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  const account = await verifiedAccount(idToken);
  if (!account) throw new SignupError(401, "سجّل دخولك أولًا ثم حاول مرة ثانية.");
  return account;
}

function publicSignup(data) {
  return {
    status: data.status,
    storeName: data.storeName,
    storeType: data.storeType,
    hasPendingPayment: Boolean(data.ompayReferenceNumber),
  };
}

async function activateSeller(uid, request) {
  const sellerRef = db.collection("sellers").doc(uid);
  const requestRef = db.collection("merchantSignups").doc(uid);
  await db.runTransaction(async (transaction) => {
    const sellerSnap = await transaction.get(sellerRef);
    if (sellerSnap.exists) return;
    transaction.set(sellerRef, {
      storeName: request.storeName,
      email: request.email,
      storeType: request.storeType,
      createdAt: FieldValue.serverTimestamp(),
      plan: "basic",
      subscriptionExpiresAt: isoDate(new Date(Date.now() + SUBSCRIPTION_PERIOD_MS)),
      activeAddOns: cleanAddOnKeys(request.selectedAddOns),
    });
    transaction.update(requestRef, { status: "activated", activatedAt: FieldValue.serverTimestamp() });
  });
}

async function register(req, res) {
  const account = await authenticatedAccount(req);
  const storeName = cleanText(req.body?.storeName, 80);
  const storeType = STORE_TYPES.has(req.body?.storeType) ? req.body.storeType : "files";
  if (storeName.length < 2) return res.status(400).json({ error: "اكتب اسم المتجر." });

  const sellerSnap = await db.collection("sellers").doc(account.uid).get();
  if (sellerSnap.exists) return res.status(409).json({ error: "عندك متجر مفعّل بالفعل." });
  const existingSeller = await db.collection("sellers").where("email", "==", account.email).limit(1).get();
  if (!existingSeller.empty) return res.status(409).json({ error: "هذا البريد لديه متجر مفعّل بالفعل." });

  await db.collection("merchantSignups").doc(account.uid).set({
    uid: account.uid,
    email: account.email,
    storeName,
    storeType,
    status: "awaiting_payment",
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return res.status(200).json({ ok: true });
}

async function status(req, res) {
  const account = await authenticatedAccount(req);
  const sellerSnap = await db.collection("sellers").doc(account.uid).get();
  if (sellerSnap.exists) return res.status(200).json({ activated: true });
  const requestSnap = await db.collection("merchantSignups").doc(account.uid).get();
  if (!requestSnap.exists) return res.status(200).json({ activated: false, signup: null });
  return res.status(200).json({ activated: false, signup: publicSignup(requestSnap.data()) });
}

async function createCardCharge(req, res) {
  const account = await authenticatedAccount(req);
  const requestRef = db.collection("merchantSignups").doc(account.uid);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) throw new SignupError(404, "ما فيه طلب تسجيل لهذا الحساب.");
  const request = requestSnap.data();
  if (request.status === "activated") return res.status(200).json({ activated: true });

  // "البيع الرقمي" يحتاج بوابة دفع خاصة بالتاجر مربوطة، وما فيه متجر بعد وقت التسجيل
  // حتى يقدر يربطها — تُستثنى هنا وتُشترى لاحقًا من لوحة التاجر بعد ربط البوابة.
  const selectedAddOns = cleanAddOnKeys(req.body?.addOns).filter((key) => key !== "digitalSelling");
  const { discountAmount, couponCode } = await resolveSignupCoupon(req.body?.couponCode);
  const rawAmount = MONTHLY_PLAN_PRICE + addOnsTotal(selectedAddOns);
  const amount = Math.max(0.1, Number((rawAmount - discountAmount).toFixed(2)));
  const origin = `https://${req.headers.host || "monah-app.com"}`;
  const referenceNumber = `SUB-${account.uid}-${Date.now()}`;
  const charge = await ompayRequest("POST", "/api/v1/transactions/bank-hosted", {
    amount,
    currency: "OMR",
    return_url: `${origin}/#store-pay-result/${account.uid}`,
    reference_number: referenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });

  const redirectUrl = chargeRedirectUrl(charge);
  if (!redirectUrl) {
    throw new SignupError(502, "تعذر تجهيز صفحة الدفع الآن. حاول مرة ثانية.");
  }
  await requestRef.update({ ompayReferenceNumber: referenceNumber, selectedAddOns, signupCouponCode: couponCode || null });
  return res.status(200).json({ url: redirectUrl });
}

async function verifyCardCharge(req, res) {
  const account = await authenticatedAccount(req);
  const requestRef = db.collection("merchantSignups").doc(account.uid);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) throw new SignupError(404, "ما فيه طلب تسجيل لهذا الحساب.");
  const request = requestSnap.data();
  if (request.status === "activated") return res.status(200).json({ paid: true });
  if (!request.ompayReferenceNumber) throw new SignupError(409, "لا توجد عملية دفع لهذا الطلب.");

  const result = await ompayRequest("POST", "/api/v1/transactions/inquiry", {
    reference_number: request.ompayReferenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });
  const { succeeded, status } = await ompayChargeSucceeded(result, { kind: "signup", referenceNumber: request.ompayReferenceNumber, uid: account.uid });
  if (!succeeded) {
    return res.status(200).json({ paid: false, status });
  }
  await activateSeller(account.uid, request);
  if (request.signupCouponCode) {
    await db.collection("signupCoupons").doc(request.signupCouponCode).update({ usedCount: FieldValue.increment(1) }).catch(() => {});
  }
  return res.status(200).json({ paid: true });
}

async function checkDomainSlug(req, res) {
  const account = await authenticatedAccount(req);
  const slug = cleanDomainSlug(req.body?.slug);
  if (slug.length < 3) return res.status(200).json({ available: false, slug, reason: "اكتب اسمًا من 3 أحرف إنجليزية أو أرقام على الأقل." });
  const available = await domainSlugAvailable(slug, account.uid);
  return res.status(200).json({ available, slug, reason: available ? "" : "هذا الاسم محجوز، جرّب اسمًا آخر." });
}

async function createDomainCharge(req, res) {
  const account = await authenticatedAccount(req);
  const sellerRef = db.collection("sellers").doc(account.uid);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new SignupError(403, "لازم يكون متجرك مفعّلًا أولًا.");

  const slug = cleanDomainSlug(req.body?.slug);
  if (slug.length < 3) throw new SignupError(400, "اكتب اسم دومين من 3 أحرف إنجليزية أو أرقام على الأقل.");
  const available = await domainSlugAvailable(slug, account.uid);
  if (!available) throw new SignupError(409, "هذا الاسم محجوز، جرّب اسمًا آخر.");

  const origin = `https://${req.headers.host || "monah-app.com"}`;
  const referenceNumber = `DOM-${account.uid}-${Date.now()}`;
  const charge = await ompayRequest("POST", "/api/v1/transactions/bank-hosted", {
    amount: CUSTOM_DOMAIN_PRICE,
    currency: "OMR",
    return_url: `${origin}/#store-pay-result/domain-${account.uid}`,
    reference_number: referenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });

  const redirectUrl = chargeRedirectUrl(charge);
  if (!redirectUrl) {
    throw new SignupError(502, "تعذر تجهيز صفحة الدفع الآن. حاول مرة ثانية.");
  }
  await sellerRef.update({ pendingDomainSlug: slug, pendingDomainReferenceNumber: referenceNumber });
  return res.status(200).json({ url: redirectUrl });
}

async function verifyDomainCharge(req, res) {
  const account = await authenticatedAccount(req);
  const sellerRef = db.collection("sellers").doc(account.uid);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new SignupError(403, "لازم يكون متجرك مفعّلًا أولًا.");
  const seller = sellerSnap.data();
  if (!seller.pendingDomainReferenceNumber || !seller.pendingDomainSlug) {
    if (seller.customDomainSlug) return res.status(200).json({ paid: true, slug: seller.customDomainSlug });
    throw new SignupError(409, "لا توجد عملية شراء دومين لهذا الحساب.");
  }

  const result = await ompayRequest("POST", "/api/v1/transactions/inquiry", {
    reference_number: seller.pendingDomainReferenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });
  const { succeeded, status } = await ompayChargeSucceeded(result, { kind: "domain", referenceNumber: seller.pendingDomainReferenceNumber, uid: account.uid });
  if (!succeeded) {
    return res.status(200).json({ paid: false, status });
  }

  const slug = seller.pendingDomainSlug;
  const available = await domainSlugAvailable(slug, account.uid);
  if (!available) {
    await sellerRef.update({ pendingDomainSlug: FieldValue.delete(), pendingDomainReferenceNumber: FieldValue.delete() });
    throw new SignupError(409, "للأسف صار هذا الاسم محجوزًا قبل ما نأكد دفعتك. تواصل معنا لاسترجاع المبلغ.");
  }
  await sellerRef.update({
    customDomainSlug: slug,
    customDomainExpiresAt: isoDate(new Date(Date.now() + SUBSCRIPTION_PERIOD_MS)),
    pendingDomainSlug: FieldValue.delete(),
    pendingDomainReferenceNumber: FieldValue.delete(),
  });
  return res.status(200).json({ paid: true, slug });
}

async function createAddOnCharge(req, res) {
  const account = await authenticatedAccount(req);
  const sellerRef = db.collection("sellers").doc(account.uid);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new SignupError(403, "لازم يكون متجرك مفعّلًا أولًا.");
  const seller = sellerSnap.data();

  const active = new Set(seller.activeAddOns || []);
  const requested = cleanAddOnKeys(req.body?.addOns);
  const newAddOns = requested.filter((key) => !active.has(key));
  if (newAddOns.length === 0) throw new SignupError(400, "اختر إضافة واحدة على الأقل غير مفعّلة عندك.");
  // "البيع الرقمي" ما ينفع تشتريه قبل ما تربط بوابة دفعك الخاصة — وإلا تدفع قيمته
  // وما تقدر تستخدمه لين تربطها لاحقًا.
  if (newAddOns.includes("digitalSelling") && seller.paymentGateway?.provider !== "ompay") {
    throw new SignupError(409, "اربط بوابة الدفع الخاصة بك أولًا من الإعدادات قبل تفعيل إضافة البيع الرقمي.");
  }
  const amount = addOnsTotal(newAddOns);

  const origin = `https://${req.headers.host || "monah-app.com"}`;
  const referenceNumber = `ADDON-${account.uid}-${Date.now()}`;
  const charge = await ompayRequest("POST", "/api/v1/transactions/bank-hosted", {
    amount,
    currency: "OMR",
    return_url: `${origin}/#store-pay-result/addon-${account.uid}`,
    reference_number: referenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });

  const redirectUrl = chargeRedirectUrl(charge);
  if (!redirectUrl) {
    throw new SignupError(502, "تعذر تجهيز صفحة الدفع الآن. حاول مرة ثانية.");
  }
  await sellerRef.update({ pendingAddOns: newAddOns, pendingAddOnReferenceNumber: referenceNumber });
  return res.status(200).json({ url: redirectUrl });
}

async function verifyAddOnCharge(req, res) {
  const account = await authenticatedAccount(req);
  const sellerRef = db.collection("sellers").doc(account.uid);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new SignupError(403, "لازم يكون متجرك مفعّلًا أولًا.");
  const seller = sellerSnap.data();
  if (!seller.pendingAddOnReferenceNumber || !Array.isArray(seller.pendingAddOns) || !seller.pendingAddOns.length) {
    throw new SignupError(409, "لا توجد عملية شراء إضافات لهذا الحساب.");
  }

  const result = await ompayRequest("POST", "/api/v1/transactions/inquiry", {
    reference_number: seller.pendingAddOnReferenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });
  const { succeeded, status } = await ompayChargeSucceeded(result, { kind: "addon", referenceNumber: seller.pendingAddOnReferenceNumber, uid: account.uid });
  if (!succeeded) {
    return res.status(200).json({ paid: false, status });
  }

  const activeAddOns = Array.from(new Set([...(seller.activeAddOns || []), ...seller.pendingAddOns]));
  await sellerRef.update({
    activeAddOns,
    pendingAddOns: FieldValue.delete(),
    pendingAddOnReferenceNumber: FieldValue.delete(),
  });
  return res.status(200).json({ paid: true, activeAddOns });
}

async function createRenewalCharge(req, res) {
  const account = await authenticatedAccount(req);
  const sellerRef = db.collection("sellers").doc(account.uid);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new SignupError(403, "لازم يكون متجرك مفعّلًا أولًا.");
  const seller = sellerSnap.data();
  const amount = MONTHLY_PLAN_PRICE + addOnsTotal(seller.activeAddOns || []);

  const origin = `https://${req.headers.host || "monah-app.com"}`;
  const referenceNumber = `RENEW-${account.uid}-${Date.now()}`;
  const charge = await ompayRequest("POST", "/api/v1/transactions/bank-hosted", {
    amount,
    currency: "OMR",
    return_url: `${origin}/#store-pay-result/renew-${account.uid}`,
    reference_number: referenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });

  const redirectUrl = chargeRedirectUrl(charge);
  if (!redirectUrl) {
    throw new SignupError(502, "تعذر تجهيز صفحة الدفع الآن. حاول مرة ثانية.");
  }
  await sellerRef.update({ pendingRenewalReferenceNumber: referenceNumber });
  return res.status(200).json({ url: redirectUrl });
}

async function verifyRenewalCharge(req, res) {
  const account = await authenticatedAccount(req);
  const sellerRef = db.collection("sellers").doc(account.uid);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new SignupError(403, "لازم يكون متجرك مفعّلًا أولًا.");
  const seller = sellerSnap.data();
  if (!seller.pendingRenewalReferenceNumber) throw new SignupError(409, "لا توجد عملية تجديد لهذا الحساب.");

  const result = await ompayRequest("POST", "/api/v1/transactions/inquiry", {
    reference_number: seller.pendingRenewalReferenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });
  const { succeeded, status } = await ompayChargeSucceeded(result, { kind: "renew", referenceNumber: seller.pendingRenewalReferenceNumber, uid: account.uid });
  if (!succeeded) {
    return res.status(200).json({ paid: false, status });
  }

  const subscriptionExpiresAt = isoDate(new Date(Date.now() + SUBSCRIPTION_PERIOD_MS));
  await sellerRef.update({ subscriptionExpiresAt, pendingRenewalReferenceNumber: FieldValue.delete() });
  return res.status(200).json({ paid: true, subscriptionExpiresAt });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "الطريقة غير مدعومة." });
  }
  try {
    const action = cleanText(req.body?.action, 40);
    if (action === "register") return await register(req, res);
    if (action === "status") return await status(req, res);
    if (action === "check_signup_coupon") return await checkSignupCoupon(req, res);
    if (action === "create_card_charge") return await createCardCharge(req, res);
    if (action === "verify_card_charge") return await verifyCardCharge(req, res);
    if (action === "check_domain_slug") return await checkDomainSlug(req, res);
    if (action === "create_domain_charge") return await createDomainCharge(req, res);
    if (action === "verify_domain_charge") return await verifyDomainCharge(req, res);
    if (action === "create_addon_charge") return await createAddOnCharge(req, res);
    if (action === "verify_addon_charge") return await verifyAddOnCharge(req, res);
    if (action === "create_renewal_charge") return await createRenewalCharge(req, res);
    if (action === "verify_renewal_charge") return await verifyRenewalCharge(req, res);
    return res.status(400).json({ error: "طلب غير واضح." });
  } catch (error) {
    if (error instanceof SignupError) return res.status(error.code).json({ error: error.message });
    console.error("merchant signup endpoint error:", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تنفيذ العملية الآن. حاول مرة ثانية." });
  }
}
