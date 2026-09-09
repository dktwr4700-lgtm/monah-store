import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
}

const db = getFirestore();
const FIREBASE_WEB_API_KEY = "AIzaSyCxpS_TMBc9mpJPjwK-TcRDfge-uCaO2Cc";
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
    return res.status(400).json({ error: "طلب غير واضح." });
  } catch (error) {
    if (error instanceof SignupError) return res.status(error.code).json({ error: error.message });
    console.error("merchant signup endpoint error:", error?.message || "unknown");
    return res.status(500).json({ error: "تعذر تنفيذ العملية الآن. حاول مرة ثانية." });
  }
}
