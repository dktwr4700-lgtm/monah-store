import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isValidOrderId(value) {
  return /^[A-Za-z0-9_-]{8,160}$/.test(cleanText(value, 160));
}

// هذا الإندبوينت يُستدعى من داخل ملف المنتج نفسه (مثلاً لعبة HTML مستقلة يفتحها المشتري
// من جهازه، بدون أي صلة بتطبيق مُونة أو تسجيل دخول) — فلازم يكون عام بالكامل بدون توكن مصادقة،
// ويسمح بطلبات من أي أصل (CORS مفتوح). الحماية الوحيدة هنا هي تطابق رقم الطلب + الكود،
// والتأكد إن كل كود يُستخدم مرة وحدة بس عبر معاملة Firestore ذرية.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "الطريقة غير مدعومة." });
  }

  const orderId = cleanText(req.body?.orderId, 160);
  const code = cleanText(req.body?.code, 40).toUpperCase();
  if (!isValidOrderId(orderId) || !code) {
    return res.status(400).json({ ok: false, error: "أدخل رقم الطلب والكود كاملين." });
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(orderRef);
      if (!snap.exists) return { error: "لم نجد هذا الطلب. تأكد من رقم الطلب." };
      const order = snap.data();
      if (order.status !== "confirmed" || !order.activationRequired || !order.activationCode) {
        return { error: "هذا الطلب لا يحتاج تفعيل، أو لم يتم تأكيده بعد." };
      }
      if (order.activationCode !== code) {
        return { error: "الكود غير صحيح." };
      }
      if (order.activationUsed) {
        return { error: "هذا الكود مُفعَّل مسبقًا على جهاز آخر." };
      }
      transaction.update(orderRef, { activationUsed: true, activationUsedAt: FieldValue.serverTimestamp() });
      return { ok: true };
    });
    if (result.error) return res.status(409).json({ ok: false, error: result.error });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("activate-code endpoint error:", error?.message || "unknown");
    return res.status(500).json({ ok: false, error: "تعذر التفعيل الآن. حاول مرة ثانية." });
  }
}
