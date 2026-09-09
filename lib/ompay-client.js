const OMPAY_API_BASE = "https://api.truepay.ompay.om";

export async function ompayRequest(method, path, body) {
  const apiKey = process.env.OMPAY_API_KEY;
  const apiSecret = process.env.OMPAY_API_SECRET;
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
