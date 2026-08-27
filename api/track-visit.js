import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const linkId = String(req.query?.link || "").trim();
  if (!linkId || linkId.length > 200) {
    return res.status(404).send("الرابط غير متاح.");
  }

  try {
    const linkRef = db.collection("campaignLinks").doc(linkId);
    const productId = await db.runTransaction(async (transaction) => {
      const linkSnap = await transaction.get(linkRef);
      if (!linkSnap.exists) return null;
      const link = linkSnap.data();
      if (!link?.productId || typeof link.productId !== "string") return null;

      const productSnap = await transaction.get(db.collection("products").doc(link.productId));
      if (!productSnap.exists) return null;
      const product = productSnap.data();
      if (product.hidden || product.suspended) return null;

      transaction.update(linkRef, {
        visits: (Number(link.visits) || 0) + 1,
        lastVisitedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return link.productId;
    });

    if (!productId) return res.status(404).send("الرابط غير متاح.");
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, `/#product/${encodeURIComponent(productId)}`);
  } catch (error) {
    console.error("tracked visit endpoint error:", error);
    return res.status(404).send("الرابط غير متاح.");
  }
}
