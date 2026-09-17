import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";
import { useLang, LangToggle } from "./i18n.jsx";

const styles = `
  .pr-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FFFFFF;padding:20px;font-family:'Cairo',sans-serif;color:#16233F;position:relative}
  .pr-lang{position:absolute;top:18px;inset-inline-end:18px;border:1px solid #E4E0D3;background:#fff;color:#16233F;border-radius:999px;padding:9px 13px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}
  .pr-card{width:100%;max-width:400px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:30px 24px;text-align:center;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .pr-title{font-family:'Almarai',sans-serif;font-size:16px;font-weight:800;margin-bottom:10px}
  .pr-copy{font-size:12.5px;line-height:1.85;color:#625F55}
  .pr-btn{display:inline-block;margin-top:18px;border:0;border-radius:100px;padding:12px 20px;background:#16233F;color:#fff;font:700 13px 'Cairo',sans-serif;text-decoration:none;cursor:pointer}
`;

const PR_T = {
  ar: {
    connectionError: "تعذر الاتصال بالخادم. جاري إعادة المحاولة...", verifyError: "تعذر التحقق من الدفع الآن.",
    checkingTitle: "جاري التحقق من عملية الدفع...", checkingCopy: "لحظات ونؤكد لك حالة الدفع.",
    paidTitle: "تم الدفع بنجاح 🎉", paidCopy: "طلبك جاهز الآن. تقدر تفتح \"طلباتي\" وتنزّل منتجك مباشرة.",
    pendingTitle: "لم تكتمل عملية الدفع",
    pendingCopy: "يبدو إن الدفع ما تم أو لسا قيد المعالجة. لو تأكدت إن مبلغك انخصم فعلاً، لا تدفع مرة ثانية — الموقع يتحقق تلقائيًا من أي دفعة سابقة قبل ما يفتح لك دفعة جديدة، فقط جرّب تفتح \"طلباتي\" بعد شوي.",
    errorTitle: "تعذر التحقق من الدفع",
    openOrders: "فتح طلباتي",
  },
  en: {
    connectionError: "Couldn't connect to the server. Retrying...", verifyError: "Couldn't verify the payment right now.",
    checkingTitle: "Verifying your payment...", checkingCopy: "One moment while we confirm the payment status.",
    paidTitle: "Payment successful 🎉", paidCopy: "Your order is ready now. Open \"My orders\" to download your product directly.",
    pendingTitle: "The payment didn't complete",
    pendingCopy: "It looks like the payment didn't go through, or it's still processing. If you're sure the amount was deducted, don't pay again — the site automatically checks for a prior payment before starting a new one. Just try opening \"My orders\" again shortly.",
    errorTitle: "Couldn't verify the payment",
    openOrders: "Open my orders",
  },
};

const REQUEST_TIMEOUT_MS = 6000;

async function verifyRequest(orderId, t) {
  await ensureAnonymousAuth();
  const idToken = await auth.currentUser.getIdToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ action: "verify_card_charge", orderId }),
      signal: controller.signal,
    });
  } catch (fetchError) {
    // بعض متصفحات الجوال أحيانًا تعلّق الاتصال بصمت (لا ينجح ولا يفشل) — بدون
    // هذا المهلة، صفحة "جاري التحقق" تضل عالقة للأبد. المهلة تخلي المحاولة
    // تفشل بوضوح فتنتقل تلقائيًا للمحاولة التالية بدل ما تعلّق إلى الأبد.
    throw new Error(t.connectionError);
  } finally {
    clearTimeout(timeoutId);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t.verifyError);
  return data;
}

const POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2500;

// تسوية الدفع عند البنك ممكن تاخذ ثوانٍ بعد رجوع العميل من صفحة الدفع، فأول
// استعلام أحيانًا يرجع "لسا ما تأكد" حتى لو الدفع نجح فعليًا. نعيد المحاولة
// تلقائيًا لين نتأكد، بدل ما نعرض "لم يكتمل الدفع" على عميل دفع فعلاً.
async function verifyWithRetry(orderId, isCancelled, t) {
  let lastData = null;
  let lastError = null;
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    if (isCancelled()) return null;
    try {
      const data = await verifyRequest(orderId, t);
      if (data.paid) return { data };
      lastData = data;
      lastError = null;
    } catch (requestError) {
      lastError = requestError;
    }
    if (attempt < POLL_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
  if (lastData) return { data: lastData };
  return { error: lastError };
}

export default function PayResult({ orderId }) {
  const [lang, setLang] = useLang();
  const t = PR_T[lang];
  const [state, setState] = useState("checking");
  const [error, setError] = useState("");
  const [rawStatus, setRawStatus] = useState("");
  const [ownerId, setOwnerId] = useState("");

  useEffect(() => {
    let cancelled = false;
    verifyWithRetry(orderId, () => cancelled, t).then((result) => {
      if (cancelled || !result) return;
      if (result.error) { setError(result.error.message); setState("error"); return; }
      if (result.data.status) setRawStatus(result.data.status);
      if (result.data.ownerId) setOwnerId(result.data.ownerId);
      setState(result.data.paid ? "paid" : "pending");
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div className="pr-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <LangToggle lang={lang} onChange={setLang} className="pr-lang" />
      <main className="pr-card">
        {state === "checking" && <>
          <div className="pr-title">{t.checkingTitle}</div>
          <div className="pr-copy">{t.checkingCopy}</div>
        </>}
        {state === "paid" && <>
          <div className="pr-title">{t.paidTitle}</div>
          <div className="pr-copy">{t.paidCopy}</div>
          <a className="pr-btn" href={`#purchases/${ownerId}`}>{t.openOrders}</a>
        </>}
        {state === "pending" && <>
          <div className="pr-title">{t.pendingTitle}</div>
          <div className="pr-copy">{t.pendingCopy}</div>
          {rawStatus && <div className="pr-copy" style={{ marginTop: 8, fontFamily: "monospace", direction: "ltr", color: "#B0AC9C" }}>status: {rawStatus}</div>}
          <a className="pr-btn" href={`#purchases/${ownerId}`}>{t.openOrders}</a>
        </>}
        {state === "error" && <>
          <div className="pr-title">{t.errorTitle}</div>
          <div className="pr-copy">{error}</div>
          <a className="pr-btn" href="#purchases">{t.openOrders}</a>
        </>}
      </main>
    </div>
  );
}
