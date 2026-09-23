import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const STORAGE_BUCKET = "pantry-app-148a7.firebasestorage.app";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount), storageBucket: STORAGE_BUCKET });
}

const db = getFirestore();
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
const RESEND_TIMEOUT_MS = 6000;
const DAY_MS = 24 * 60 * 60 * 1000;

// كل نصيحة تُرسل مرة وحدة فقط لكل تاجر (نتتبعها بـ onboardingTipsSent على وثيقة
// sellers)، وتتحقق من الشرط الفعلي وقت الإرسال (مو بس الوقت المنقضي)، حتى لو
// التاجر أكمل الخطوة بين تشغيلتين ما توصله نصيحة ما تنفعه.
const TIP_STEPS = [
  {
    key: "addProduct",
    minDaysSinceSignup: 1,
    condition: (ctx) => ctx.productCount === 0,
    subject: "لسا ما ضفت أول منتج بمتجرك؟",
    heading: "خطوة وحدة بس تفصلك عن أول عملية بيع",
    body: `
      <p>لاحظنا إنك سجّلت بمُونة بس لسا ما ضفت أول منتج رقمي بمتجرك.</p>
      <p>الخطوات بسيطة: افتح لوحة التاجر، اضغط "أضف منتج جديد"، ارفع ملفك (PDF، صورة، فيديو، أو أكواد)، اكتب اسمه وسعره، ثم انشره — يصير جاهز للبيع خلال دقائق.</p>
    `,
    ctaLabel: "أضف منتجك الآن",
    ctaHash: "#dashboard/products",
  },
  {
    key: "storeInfo",
    minDaysSinceSignup: 3,
    condition: (ctx) => ctx.productCount > 0 && (!ctx.hasTagline || !ctx.hasContact),
    subject: "كمّل بيانات متجرك عشان يبين احترافي أكثر",
    heading: "متجرك شغّال، بس فيه شوي تفاصيل ناقصة",
    body: `
      <p>عندك منتج منشور — خطوة ممتازة! بس متجرك بعده ناقصه تفاصيل بسيطة تخليه يبين أكثر ثقة لعملائك:</p>
      <ul style="margin:0;padding-inline-start:20px;line-height:1.9">
        <li>جملة قصيرة تعرّف الزوار بمتجرك</li>
        <li>رقم واتساب أو حساب إنستغرام للتواصل المباشر</li>
      </ul>
      <p>تقدر تضيفها من "هوية المتجر" بلوحة التاجر خلال دقيقة.</p>
    `,
    ctaLabel: "كمّل بيانات متجرك",
    ctaHash: "#dashboard/design",
  },
];

async function fetchEligibleSellers() {
  const cutoff = new Date(Date.now() - TIP_STEPS[0].minDaysSinceSignup * DAY_MS);
  const snap = await db.collection("sellers").get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((seller) => seller.email && seller.createdAt?.toDate?.() && seller.createdAt.toDate() <= cutoff);
}

async function sendTipEmail(seller, step) {
  if (!RESEND_API_KEY) {
    console.error("sendTipEmail: skipped, RESEND_API_KEY is not set");
    return false;
  }
  const storeName = String(seller.storeName || "متجرك").trim();
  const html = `
    <div dir="rtl" style="font-family:sans-serif;line-height:1.8;color:#16233F;max-width:480px;margin:0 auto">
      <h2 style="margin:0 0 14px">${step.heading}</h2>
      ${step.body}
      <a href="https://monah-app.com/${step.ctaHash}" style="display:inline-block;margin-top:16px;padding:12px 22px;background:#163F2E;color:#fff;border-radius:100px;text-decoration:none;font-weight:700">${step.ctaLabel}</a>
      <p style="margin-top:24px;font-size:12px;color:#7A766A">وصلتك هذي الرسالة لأنك سجّلت متجر "${storeName}" في مُونة.</p>
    </div>`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "مُونة <notifications@monah-app.com>",
        to: [seller.email],
        subject: step.subject,
        html,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("sendTipEmail: Resend rejected the request", response.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendTipEmail failed", err);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req, res) {
  // Vercel يضيف هذا الترويسة تلقائيًا لما تكون CRON_SECRET معرّفة بإعدادات
  // المشروع — يمنع أي طرف خارجي من استدعاء هذا المسار وإرسال رسائل بالنيابة عنا.
  const authHeader = req.headers.authorization || "";
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sellers = await fetchEligibleSellers();
  const now = Date.now();
  let sentCount = 0;
  let checkedCount = 0;

  for (const seller of sellers) {
    const alreadySent = seller.onboardingTipsSent || {};
    const daysSinceSignup = (now - seller.createdAt.toDate().getTime()) / DAY_MS;

    // نختار أول نصيحة (بالترتيب) ما زالت ما انبعتت ولسا شرطها صحيح — خطوة
    // وحدة بالتشغيلة عشان ما نغرق التاجر برسائل متتالية بنفس اليوم.
    let productsSnap = null;
    let storeSnap = null;

    for (const step of TIP_STEPS) {
      if (alreadySent[step.key]) continue;
      if (daysSinceSignup < step.minDaysSinceSignup) continue;

      if (!productsSnap) {
        productsSnap = await db.collection("products").where("ownerId", "==", seller.id).get();
      }
      if (!storeSnap) {
        storeSnap = await db.collection("stores").doc(seller.id).get();
      }
      const storeData = storeSnap.exists ? storeSnap.data() : {};
      const ctx = {
        productCount: productsSnap.size,
        hasTagline: Boolean(storeData.tagline),
        hasContact: Boolean(storeData.whatsapp || storeData.instagram),
      };

      checkedCount++;
      if (!step.condition(ctx)) continue;

      const sent = await sendTipEmail(seller, step);
      if (sent) {
        await db.collection("sellers").doc(seller.id).update({
          [`onboardingTipsSent.${step.key}`]: true,
        });
        sentCount++;
      }
      break;
    }
  }

  return res.status(200).json({ ok: true, checked: checkedCount, sent: sentCount });
}
