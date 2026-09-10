import { randomBytes } from "crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "pantry-app-148a7.firebasestorage.app",
  });
}

const db = getFirestore();

function cleanId(value) {
  return String(value || "").trim().slice(0, 160);
}

function cleanCode(value) {
  return String(value || "").trim().toUpperCase().slice(0, 20);
}

// هذا الـendpoint يُستدعى من داخل ملف HTML مستقل (اللعبة) مفتوح من جهاز
// المشتري مباشرة — أصله (origin) مختلف عن موقع مُونَة، فلازم CORS مفتوح له.
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const orderId = cleanId(req.body?.orderId);
  const code = cleanCode(req.body?.code);
  if (!orderId || !code) {
    return res.status(400).json({ error: "أدخل رقم الطلب وكود التفعيل كاملين." });
  }

  // الملف المستقل (اللعبة) ما يعرف productId بنفسه، فنبحث عن التفعيل بمعرف
  // الطلب فقط — كل طلب عادةً فيه منتج واحد يتطلب تفعيل، فأول تطابق يكفي.
  try {
    const token = await db.runTransaction(async (transaction) => {
      const candidates = await transaction.get(db.collection("activations").where("orderId", "==", orderId));
      const match = candidates.docs.find((doc) => doc.data().code === code);
      if (!match) throw new Error("NOT_FOUND");
      const data = match.data();
      const max = Number(data.maxActivations || 1);
      const count = Number(data.activationCount || 0);
      if (count >= max) throw new Error("LIMIT_REACHED");
      const newToken = randomBytes(16).toString("hex");
      transaction.update(match.ref, {
        activationCount: count + 1,
        lastActivatedAt: FieldValue.serverTimestamp(),
      });
      return newToken;
    });
    return res.status(200).json({ ok: true, token });
  } catch (err) {
    if (err.message === "LIMIT_REACHED") {
      return res.status(403).json({
        error: "هذا الكود مفعّل على جهاز آخر بالفعل. تواصل مع البائع لإعادة التفعيل.",
      });
    }
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "رقم الطلب أو كود التفعيل غير صحيح." });
    }
    console.error("activate-license endpoint error:", err);
    return res.status(500).json({ error: "صار خطأ، حاول مرة ثانية." });
  }
}
