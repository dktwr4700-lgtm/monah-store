import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// عداد بسيط لزيارات صفحة التسجيل (#start) — يستخدمه الأدمن لمعرفة نسبة
// التحويل (زيارات مقابل تسجيلات فعلية). أفضل-جهد فقط: أي فشل هنا ما يوقف
// عرض صفحة التسجيل نفسها للزائر.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    await db.collection("siteStats").doc("startPage").set({
      visits: FieldValue.increment(1),
    }, { merge: true });
  } catch (error) {
    console.error("track-start-visit failed", error);
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(204).end();
}
