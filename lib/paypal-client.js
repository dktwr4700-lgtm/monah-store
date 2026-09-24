// عميل PayPal REST API — يستخدم مفاتيح PayPal الخاصة بكل تاجر (Client ID +
// Secret من حسابه هو على developer.paypal.com)، أبدًا مفاتيح مُونة، بنفس مبدأ
// عميل OmPay: مُونة ما تلمس فلوس مبيعات أي تاجر.
const PAYPAL_API_BASE = "https://api-m.paypal.com";

async function paypalAccessToken(clientId, clientSecret) {
  let response;
  try {
    response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  } catch (networkError) {
    console.error("PayPal auth network error:", networkError?.message, "| cause:", networkError?.cause?.code || networkError?.cause?.message || "unknown");
    const error = new Error("تعذر الاتصال ببوابة PayPal الآن. جرب التحويل اليدوي.");
    error.code = 502;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    console.error("PayPal auth error:", data);
    const error = new Error("تعذر تسجيل الدخول ببوابة PayPal الآن. تأكد من صحة مفاتيح PayPal المربوطة.");
    error.code = 502;
    throw error;
  }
  return data.access_token;
}

export async function paypalRequest(method, path, body, credentials) {
  const clientId = credentials?.clientId;
  const clientSecret = credentials?.clientSecret;
  if (!clientId || !clientSecret) {
    const error = new Error("الدفع عبر PayPal غير مفعّل حاليًا. استخدم التحويل اليدوي.");
    error.code = 409;
    throw error;
  }
  const accessToken = await paypalAccessToken(clientId, clientSecret);

  let response;
  try {
    response = await fetch(`${PAYPAL_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    console.error("PayPal network error:", networkError?.message, "| cause:", networkError?.cause?.code || networkError?.cause?.message || "unknown");
    const error = new Error("تعذر الاتصال ببوابة PayPal الآن. جرب التحويل اليدوي.");
    error.code = 502;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  // 422 على التقاط طلب سبق التقاطه فعليًا ليس خطأ حقيقي — يصير لو العميل عاد
  // لصفحة نتيجة الدفع بعد التقاط ناجح سابق (رجوع للخلف، تحديث الصفحة). رد
  // PayPal هنا شكل خطأ (name/details) بدون status، فلو رجّعناه كما هو بيفسّره
  // paypalOrderSucceeded كفشل رغم إن الفلوس وصلت فعليًا — نصنع رد نجاح مكافئ
  // بدلًا منه (نفس مبدأ inquiry بـOmPay اللي يتحقق من الحالة الفعلية).
  const alreadyCaptured = response.status === 422
    && (data?.details || []).some((d) => d.issue === "ORDER_ALREADY_CAPTURED");
  if (alreadyCaptured) {
    return { status: "COMPLETED" };
  }
  if (!response.ok) {
    console.error("PayPal API error:", data);
    const error = new Error("تعذر إتمام العملية عبر PayPal الآن. جرب التحويل اليدوي.");
    error.code = 502;
    throw error;
  }
  return data;
}

// "APPROVED" يعني العميل وافق بس الفلوس ما انسحبت بعد (لسا محتاجة Capture) —
// "COMPLETED" بس هو اللي يعني الفلوس فعليًا وصلت للتاجر.
const SUCCESS_STATUSES = new Set(["COMPLETED"]);

export function paypalOrderSucceeded(result) {
  const status = String(result?.status || "").trim().toUpperCase();
  return { succeeded: SUCCESS_STATUSES.has(status), status: status || "unknown" };
}

export function paypalApproveUrl(order) {
  const link = (order?.links || []).find((l) => l.rel === "approve" || l.rel === "payer-action");
  return link?.href || null;
}
