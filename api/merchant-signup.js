import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { tapRequest } from "./tap-client.js";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
}

const db = getFirestore();
const bucket = getStorage().bucket();
const ADMIN_EMAIL = "k1997551@gmail.com";
const FIREBASE_WEB_API_KEY = "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc";
const MONTHLY_PLAN_PRICE = 5;
const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
const STORE_TYPES = new Set(["books", "videos", "codes", "files"]);

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

async function requireOwner(req) {
  const account = await authenticatedAccount(req);
  if (account.email !== ADMIN_EMAIL) throw new SignupError(403, "هذه العملية خاصة بمالك مُونَة.");
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
  const charge = await tapRequest("POST", "/charges/", {
    amount: MONTHLY_PLAN_PRICE,
    currency: "OMR",
    customer: {
      first_name: request.storeName || "تاجر مُونَة",
      email: account.email,
    },
    source: { id: "src_all" },
    threeDSecure: true,
    description: `اشتراك شهري - متجر ${request.storeName}`,
    reference: { order: account.uid },
    metadata: { uid: account.uid },
    redirect: { url: `${origin}/#store-pay-result/${account.uid}` },
  }).catch((error) => { throw new SignupError(error.code || 502, error.message); });

  if (!charge.id || !charge.transaction?.url) {
    throw new SignupError(502, "تعذر تجهيز صفحة الدفع الآن. جرب التحويل اليدوي.");
  }
  await requestRef.update({ tapChargeId: charge.id });
  return res.status(200).json({ url: charge.transaction.url });
}

async function verifyCardCharge(req, res) {
  const account = await authenticatedAccount(req);
  const requestRef = db.collection("merchantSignups").doc(account.uid);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) throw new SignupError(404, "ما فيه طلب تسجيل لهذا الحساب.");
  const request = requestSnap.data();
  if (request.status === "activated") return res.status(200).json({ paid: true });
  if (!request.tapChargeId) throw new SignupError(409, "لا توجد عملية دفع لهذا الطلب.");

  const charge = await tapRequest("GET", `/charges/${request.tapChargeId}`)
    .catch((error) => { throw new SignupError(error.code || 502, error.message); });
  if (charge.status !== "CAPTURED") {
    return res.status(200).json({ paid: false, status: charge.status || "unknown" });
  }
  await activateSeller(account.uid, request);
  return res.status(200).json({ paid: true });
}

async function submitManualProof(req, res) {
  const account = await authenticatedAccount(req);
  const proofPath = cleanText(req.body?.proofPath, 360);
  const proofName = cleanText(req.body?.proofName, 160);
  const prefix = `merchant-subscription-proofs/${account.uid}/`;
  if (!proofPath.startsWith(prefix) || proofPath.includes("..")) {
    throw new SignupError(400, "مسار الإثبات غير صالح.");
  }
  const requestRef = db.collection("merchantSignups").doc(account.uid);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) throw new SignupError(404, "ما فيه طلب تسجيل لهذا الحساب.");
  await requestRef.update({
    status: "pending_review",
    proofPath,
    proofName,
    proofSubmittedAt: FieldValue.serverTimestamp(),
  });
  return res.status(200).json({ ok: true });
}

async function paymentInstructions(req, res) {
  const settingsSnap = await db.collection("settings").doc("merchantSubscription").get();
  const text = settingsSnap.exists ? cleanText(settingsSnap.data().paymentInstructions, 800) : "";
  return res.status(200).json({ paymentInstructions: text, price: MONTHLY_PLAN_PRICE });
}

async function adminSaveInstructions(req, res) {
  await requireOwner(req);
  const text = cleanText(req.body?.paymentInstructions, 800);
  if (text.length < 6) return res.status(400).json({ error: "اكتب تعليمات التحويل بوضوح." });
  await db.collection("settings").doc("merchantSubscription").set({
    paymentInstructions: text,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return res.status(200).json({ ok: true, paymentInstructions: text });
}

async function adminListPending(req, res) {
  await requireOwner(req);
  const snapshot = await db.collection("merchantSignups").where("status", "==", "pending_review").limit(50).get();
  const rows = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  return res.status(200).json({
    requests: rows.map((row) => ({
      uid: row.uid,
      email: row.email,
      storeName: row.storeName,
      storeType: row.storeType,
      hasProof: Boolean(row.proofPath),
    })),
  });
}

async function adminProofUrl(req, res) {
  await requireOwner(req);
  const uid = cleanText(req.body?.uid, 160);
  const requestSnap = await db.collection("merchantSignups").doc(uid).get();
  if (!requestSnap.exists || !requestSnap.data().proofPath) throw new SignupError(404, "ما فيه إثبات لهذا الطلب.");
  const [url] = await bucket.file(requestSnap.data().proofPath).getSignedUrl({ action: "read", expires: Date.now() + 5 * 60 * 1000 });
  return res.status(200).json({ url });
}

async function adminApprove(req, res) {
  await requireOwner(req);
  const uid = cleanText(req.body?.uid, 160);
  const requestSnap = await db.collection("merchantSignups").doc(uid).get();
  if (!requestSnap.exists) throw new SignupError(404, "ما فيه طلب بهذا المعرف.");
  await activateSeller(uid, requestSnap.data());
  return res.status(200).json({ ok: true });
}

async function adminReject(req, res) {
  const owner = await requireOwner(req);
  const uid = cleanText(req.body?.uid, 160);
  const requestRef = db.collection("merchantSignups").doc(uid);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) throw new SignupError(404, "ما فيه طلب بهذا المعرف.");
  await requestRef.update({ status: "rejected", rejectedBy: owner.uid, rejectedAt: FieldValue.serverTimestamp() });
  return res.status(200).json({ ok: true });
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
    if (action === "submit_manual_proof") return await submitManualProof(req, res);
    if (action === "payment_instructions") return await paymentInstructions(req, res);
    if (action === "admin_save_instructions") return await adminSaveInstructions(req, res);
    if (action === "admin_list_pending") return await adminListPending(req, res);
    if (action === "admin_proof_url") return await adminProofUrl(req, res);
    if (action === "admin_approve") return await adminApprove(req, res);
    if (action === "admin_reject") return await adminReject(req, res);
    return res.status(400).json({ error: "طلب غير واضح." });
  } catch (error) {
    if (error instanceof SignupError) return res.status(error.code).json({ error: error.message });
    console.error("merchant signup endpoint error:", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تنفيذ العملية الآن. حاول مرة ثانية." });
  }
}
