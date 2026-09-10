const OMPAY_API_BASE = "https://api.truepay.ompay.om";

export async function ompayRequest(method, path, body, credentialsOverride) {
  const apiKey = credentialsOverride?.apiKey || process.env.OMPAY_API_KEY;
  const apiSecret = credentialsOverride?.apiSecret || process.env.OMPAY_API_SECRET;
  if (!apiKey || !apiSecret) {
    const error = new Error("الدفع بالبطاقة غير مفعّل حاليًا. استخدم التحويل اليدوي.");
    error.code = 409;
    throw error;
  }
  const response = await fetch(`${OMPAY_API_BASE}${path}`, {
    method,
    headers: {
      "OMPAY-API-Key": apiKey,
      "OMPAY-API-Secret": apiSecret,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
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

// نفس مشكلة redirect_url سابقًا: اسم/مكان حقل الحالة برد OmPay مو موحّد دايمًا.
// هذي الدالة تفحص كل الأماكن المحتملة وتقبل أي مرادف معروف للنجاح، وتسجّل الرد
// الخام لو ما لقت تطابق، عشان ما نرفض دفعة نجحت فعليًا عند العميل والبنك.
export function ompayChargeSucceeded(result) {
  const status = result?.status || result?.data?.status
    || result?.transaction_status || result?.transactionStatus
    || result?.data?.transaction_status || result?.data?.transactionStatus;
  const normalized = String(status || "").trim().toUpperCase();
  const succeeded = SUCCESS_STATUSES.has(normalized);
  if (!succeeded) console.error("OmPay inquiry not recognized as successful. Raw response:", JSON.stringify(result));
  return { succeeded, status: status || "unknown" };
}
