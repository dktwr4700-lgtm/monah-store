const TAP_API_BASE = "https://api.tap.company/v2";

export async function tapRequest(method, path, body) {
  const secretKey = process.env.TAP_SECRET_KEY;
  if (!secretKey) {
    const error = new Error("الدفع بالبطاقة غير مفعّل حاليًا. استخدم التحويل اليدوي.");
    error.code = 409;
    throw error;
  }
  const response = await fetch(`${TAP_API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Tap API error:", data?.errors || data);
    const error = new Error("تعذر الاتصال ببوابة الدفع الآن. جرب التحويل اليدوي.");
    error.code = 502;
    throw error;
  }
  return data;
}

// افتراض عملي: أرقام واتساب/جوالات المستخدمين مكتوبة بدون كود الدولة (مُونَة مخصصة لعُمان حاليًا).
export function splitPhoneForTap(rawPhone) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  const local = digits.startsWith("968") && digits.length > 8 ? digits.slice(3) : digits;
  return { country_code: 968, number: Number(local) || 0 };
}
