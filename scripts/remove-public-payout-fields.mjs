import admin from "firebase-admin";

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!rawServiceAccount) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is required");
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(rawServiceAccount)) });
}

const db = admin.firestore();
const stores = await db.collection("stores").get();
let batch = db.batch();
let count = 0;
let updated = 0;

for (const document of stores.docs) {
  const data = document.data();
  const hasPublicPayoutData = ["paymentMethod", "payoutInfo", "payoutWhatsapp"].some((field) => field in data);
  if (!hasPublicPayoutData) continue;

  batch.update(document.ref, {
    paymentMethod: admin.firestore.FieldValue.delete(),
    payoutInfo: admin.firestore.FieldValue.delete(),
    payoutWhatsapp: admin.firestore.FieldValue.delete(),
  });
  count += 1;
  updated += 1;

  if (count === 450) {
    await batch.commit();
    batch = db.batch();
    count = 0;
  }
}

if (count) await batch.commit();
console.log(`Removed public payout fields from ${updated} store documents.`);
