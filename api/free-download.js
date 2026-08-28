import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "pantry-app-148a7.firebasestorage.app",
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();
const SIGNED_URL_TTL_MS = 10 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const productId = req.method === "POST" ? req.body?.productId : req.query?.productId;
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
      version: "v4",
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
      responseDisposition: `attachment; filename="${product.filePath.split("/").pop()}"`,
    });
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "GET") {
      return res.redirect(302, url);
    }
    return res.status(200).json({ url });
  } catch (error) {
    console.error("free download endpoint error:", error);
    return res.status(500).json({ error: "تعذر تجهيز التنزيل الآن. حاول مرة ثانية." });
  }
}
