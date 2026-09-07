const OMPAY_API_BASE = process.env.OMPAY_BASE_URL || "https://api.truepay.ompay.om";

export async function ompayRequest(method, path, body) {
  const apiKey = process.env.OMPAY_API_KEY;
  const apiSecret = process.env.OMPAY_API_SECRET;
  if (!apiKey || !apiSecret) {
    const error = new Error("الدفع عبر OmPay غير مفعّل حاليًا.");
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
    console.error("OmPay API error:", data?.error || data?.message || data);
    const error = new Error("تعذر الاتصال ببوابة الدفع الآن. جرب طريقة ثانية.");
    error.code = 502;
    throw error;
  }
  return data;
}

export async function startBankHostedPayment({ amount, currency = "OMR", returnUrl, referenceNumber }) {
  return ompayRequest("POST", "/api/v1/transactions/bank-hosted", {
    amount,
    currency,
    return_url: returnUrl,
    reference_number: referenceNumber,
  });
}
