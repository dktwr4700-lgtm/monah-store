import admin from "firebase-admin";

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!rawServiceAccount) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is required");
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(rawServiceAccount)) });
}

const db = admin.firestore();
const products = await db.collection("products").get();
let batch = db.batch();
let count = 0;
let updated = 0;

for (const document of products.docs) {
  if (typeof document.data().suspended === "boolean") continue;
  batch.update(document.ref, { suspended: false });
  count += 1;
  updated += 1;
  if (count === 450) {
    await batch.commit();
    batch = db.batch();
    count = 0;
  }
}

if (count) await batch.commit();
console.log(`Updated ${updated} product documents with suspended: false.`);
