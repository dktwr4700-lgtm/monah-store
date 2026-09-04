import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'pantry-app-148a7.firebasestorage.app',
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();
const auth = getAuth();

// صلاحية الرابط الموقّع نفسه: قصيرة جدًا عمدًا (10 دقايق)
// هذا مختلف عن صلاحية "unlock" الأطول (30 يوم) — كل ضغطة على "تحميل" تولّد رابط جديد
const SIGNED_URL_TTL_MS = 10 * 60 * 1000;
const MAX_FILE_DOWNLOADS = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId } = req.body || {};
  if (!productId) {
    return res.status(400).json({ error: 'productId مطلوب.' });
  }

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: 'غير مصرّح — سجّل دخولك وحاول مرة ثانية.' });
  }

  let uid;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    return res.status(401).json({ error: 'جلستك غير صالحة، حاول مرة ثانية.' });
  }

  try {
    const productSnap = await db.collection('products').doc(productId).get();
    if (!productSnap.exists) {
      return res.status(404).json({ error: 'المنتج غير موجود.' });
    }
    const product = productSnap.data();
    if (!product.filePath) {
      return res.status(404).json({ error: 'ما فيه ملف مرتبط بهذا المنتج.' });
    }
    if (product.suspended) {
      return res.status(403).json({ error: 'هذا المنتج غير متاح حاليًا.' });
    }

    // المسار (أ): المستخدم هو مالك المنتج (تاجر يعيد إرسال التسليم)
    const isOwner = product.ownerId === uid;

    // المسار (ب): المستخدم مشترٍ عنده تصريح unlock صالح لهذا المنتج بالذات،
    // ولسه ما تجاوز الحد الأقصى لعدد مرات التنزيل. العدّ يتم داخل معاملة (transaction)
    // عشان ضغطتين متزامنتين ما تفوتان الحد.
    let hasValidUnlock = false;
    if (!isOwner) {
      const unlockRef = db.collection('unlocks').doc(`${uid}_${productId}`);
      try {
        await db.runTransaction(async (transaction) => {
          const unlockSnap = await transaction.get(unlockRef);
          if (!unlockSnap.exists) throw new Error('NO_UNLOCK');
          const unlock = unlockSnap.data();
          const expiresAt = unlock.expiresAt && unlock.expiresAt.toDate
            ? unlock.expiresAt.toDate()
            : new Date(unlock.expiresAt);
          if (expiresAt <= new Date()) throw new Error('EXPIRED');
          const downloadCount = Number(unlock.downloadCount || 0);
          if (downloadCount >= MAX_FILE_DOWNLOADS) throw new Error('LIMIT_REACHED');
          transaction.update(unlockRef, {
            downloadCount: downloadCount + 1,
            lastDownloadAt: FieldValue.serverTimestamp(),
          });
        });
        hasValidUnlock = true;
      } catch (transactionError) {
        if (transactionError.message === 'LIMIT_REACHED') {
          return res.status(403).json({
            error: `وصلت للحد الأقصى لعدد مرات تنزيل هذا الملف (${MAX_FILE_DOWNLOADS} مرات). تواصل مع التاجر لو تحتاج نسخة إضافية.`,
          });
        }
        hasValidUnlock = false;
      }
    }

    if (!isOwner && !hasValidUnlock) {
      return res.status(403).json({ error: 'ما عندك صلاحية تحميل هذا الملف. تأكد إنك أتممت الشراء.' });
    }

    const file = bucket.file(product.filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'تعذر إيجاد ملف المنتج على السيرفر.' });
    }

    const safeFileName = String(product.filePath.split('/').pop() || 'product').replace(/["\\]/g, '_');
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
      responseDisposition: `attachment; filename="${safeFileName}"`,
    });

    return res.status(200).json({ url: signedUrl });
  } catch (err) {
    console.error('download endpoint error:', err);
    return res.status(500).json({ error: 'صار خطأ، حاول مرة ثانية.' });
  }
}
