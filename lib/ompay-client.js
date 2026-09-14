import { FieldValue, getFirestore } from "firebase-admin/firestore";

const OMPAY_API_BASE = "https://api.truepay.ompay.om";

export async function ompayRequest(method, path, body, credentialsOverride) {
  const apiKey = credentialsOverride?.apiKey || process.env.OMPAY_API_KEY;
  const apiSecret = credentialsOverride?.apiSecret || process.env.OMPAY_API_SECRET;
  if (!apiKey || !apiSecret) {
    const error = new Error("الدفع بالبطاقة غير مفعّل حاليًا. استخدم التحويل اليدوي.");
    error.code = 409;
    throw error;
  }
  // fetch() نفسه يرمي استثناء خام (مثل "fetch failed") لو تعذر الوصول لبوابة
  // OmPay أصلاً (DNS، رفض اتصال، انتهاء مهلة)، قبل حتى ما يوصل لرد HTTP —
  // بدون هذا اللف، النص التقني الخام كان يطلع للعميل مباشرة بدل رسالة عربية مفهومة.
  let response;
  try {
    response = await fetch(`${OMPAY_API_BASE}${path}`, {
      method,
      headers: {
        "OMPAY-API-Key": apiKey,
        "OMPAY-API-Secret": apiSecret,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // fetch() يلف السبب الحقيقي (DNS فشل، رفض اتصال، شهادة TLS منتهية...) داخل
    // خاصية cause بدل الرسالة نفسها ("fetch failed" دايمًا) — نسجّله كامل هنا
    // عشان نشخّص السبب الفعلي من سجلات Vercel بدل ما نخمّن.
    console.error(
      "OmPay network error:",
      networkError?.message,
      "| cause:",
      networkError?.cause?.code || networkError?.cause?.message || networkError?.cause || "unknown"
    );
    const error = new Error("تعذر الاتصال ببوابة الدفع الآن. جرب التحويل اليدوي.");
    error.code = 502;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("OmPay API error:", data);
    const error = new Error("تعذر الاتصال ببوابة الدفع الآن. جرب التحويل اليدوي.");
    error.code = 502;
    throw error;
  }
  return data;
}

const SUCCESS_STATUSES = new Set(["SUCCESSFUL", "SUCCESS", "COMPLETED", "COMPLETE", "PAID", "APPROVED", "CAPTURED"]);

// نفس مشكلة redirect_url سابقًا: اسم/مكان حقل الحالة برد OmPay مو موحّد دايمًا،
// وأحيانًا الحالة تكون "قيد المعالجة" فعليًا لحظة أول استعلام (تسوية البنك تاخذ
// ثوانٍ) قبل ما تتأكد كنجاح — العميل بيعيد المحاولة تلقائيًا (انظر pollPaymentStatus
// بالواجهة). هذي الدالة تفحص كل الأماكن المحتملة وتقبل أي مرادف معروف للنجاح،
// وتسجّل الرد الخام في Firestore لو ما لقت تطابق، عشان نعرف بالضبط شكل رد OmPay
// الحقيقي بدل ما نخمّن، ونتأكد ما نرفض دفعة نجحت فعليًا عند العميل والبنك.
export async function ompayChargeSucceeded(result, context) {
  const status = result?.status || result?.data?.status
    || result?.transaction_status || result?.transactionStatus
    || result?.data?.transaction_status || result?.data?.transactionStatus;
  const normalized = String(status || "").trim().toUpperCase();
  const succeeded = SUCCESS_STATUSES.has(normalized);
  if (!succeeded) {
    console.error("OmPay inquiry not recognized as successful. Raw response:", JSON.stringify(result));
    try {
      await getFirestore().collection("paymentDebugLog").add({
        kind: context?.kind || "unknown",
        referenceNumber: context?.referenceNumber || null,
        uid: context?.uid || null,
        status: status || "unknown",
        raw: JSON.stringify(result).slice(0, 6000),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("failed to persist payment debug log:", logError?.message || logError);
    }
  }
  return { succeeded, status: status || "unknown" };
}
