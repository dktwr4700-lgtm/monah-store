import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { ompayRequest } from "../lib/ompay-client.js";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
}

const db = getFirestore();
const FIREBASE_WEB_API_KEY = "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc";
const STORE_TYPES = new Set(["books", "videos", "codes", "files"]);
const MONTHLY_PLAN_PRICE = 5;
const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const CUSTOM_DOMAIN_PRICE = 2;
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

  const origin = `https://${req.headers.host || "monah-app.com"}`;
  const referenceNumber = `SUB-${account.uid}-${Date.now()}`;
  const charge = await ompayRequest("POST", "/api/v1/transactions/bank-hosted", {
    amount: MONTHLY_PLAN_PRICE,
    currency: "OMR",
    return_url: `${origin}/#store-pay-result/${account.uid}`,
    reference_number: referenceNumber,
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });

  if (!charge.redirect_url) {
    throw new SignupError(502, "تعذر تجهيز صفحة الدفع الآن. حاول مرة ثانية.");
  }
  await requestRef.update({ ompayReferenceNumber: referenceNumber });
  return res.status(200).json({ url: charge.redirect_url });
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
  if (result.status !== "SUCCESSFUL") {
    return res.status(200).json({ paid: false, status: result.status || "unknown" });
  }
  await activateSeller(account.uid, request);
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

  if (!charge.redirect_url) {
    throw new SignupError(502, "تعذر تجهيز صفحة الدفع الآن. حاول مرة ثانية.");
  }
  await sellerRef.update({ pendingDomainSlug: slug, pendingDomainReferenceNumber: referenceNumber });
  return res.status(200).json({ url: charge.redirect_url });
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
  if (result.status !== "SUCCESSFUL") {
    return res.status(200).json({ paid: false, status: result.status || "unknown" });
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
    if (action === "create_card_charge") return await createCardCharge(req, res);
    if (action === "verify_card_charge") return await verifyCardCharge(req, res);
    if (action === "check_domain_slug") return await checkDomainSlug(req, res);
    if (action === "create_domain_charge") return await createDomainCharge(req, res);
    if (action === "verify_domain_charge") return await verifyDomainCharge(req, res);
    return res.status(400).json({ error: "طلب غير واضح." });
  } catch (error) {
    if (error instanceof SignupError) return res.status(error.code).json({ error: error.message });
    console.error("merchant signup endpoint error:", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تنفيذ العملية الآن. حاول مرة ثانية." });
  }
}
