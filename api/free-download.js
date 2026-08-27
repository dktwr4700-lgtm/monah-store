import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "pantry-app-148a7.firebasestorage.app",
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();
const SIGNED_URL_TTL_MS = 10 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productId } = req.body || {};
  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ error: "المنتج غير صالح." });
  }

  try {
    const productSnap = await db.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return res.status(404).json({ error: "هذا المنتج غير متاح حاليًا." });
    }

    const product = productSnap.data();
    const isFreePublicFile = Number(product.price) === 0
      && product.type === "file"
      && product.hidden === false
      && product.suspended !== true
      && typeof product.filePath === "string"
      && product.filePath.startsWith(`secure/${productId}/`);

    if (!isFreePublicFile) {
      return res.status(404).json({ error: "هذا المنتج غير متاح حاليًا." });
    }

    const file = bucket.file(product.filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: "تعذر إيجاد ملف المنتج." });
    }

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ url });
  } catch (error) {
    console.error("free download endpoint error:", error);
    return res.status(500).json({ error: "تعذر تجهيز التنزيل الآن. حاول مرة ثانية." });
  }
}
