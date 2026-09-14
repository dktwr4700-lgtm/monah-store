import React, { useEffect, useState } from "react";
import { auth } from "./firebase.js";
import { useLang, LangToggle } from "./i18n.jsx";

const styles = `
  .pr-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F3EC;padding:20px;font-family:'Cairo',sans-serif;color:#16233F;position:relative}
  .pr-lang{position:absolute;top:18px;inset-inline-end:18px;border:1px solid #E4E0D3;background:#fff;color:#16233F;border-radius:999px;padding:9px 13px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}
  .pr-card{width:100%;max-width:400px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:30px 24px;text-align:center;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .pr-title{font-family:'Almarai',sans-serif;font-size:16px;font-weight:800;margin-bottom:10px}
  .pr-copy{font-size:12.5px;line-height:1.85;color:#625F55}
  .pr-btn{display:inline-block;margin-top:18px;border:0;border-radius:100px;padding:12px 20px;background:#16233F;color:#fff;font:700 13px 'Cairo',sans-serif;text-decoration:none;cursor:pointer}
`;

const VERIFY_ACTIONS = {
  domain: "verify_domain_charge",
  addon: "verify_addon_charge",
  renew: "verify_renewal_charge",
  signup: "verify_card_charge",
};

const SPR_T = {
  ar: {
    connectionError: "تعذر الاتصال بالخادم. جاري إعادة المحاولة...", verifyError: "تعذر التحقق من الدفع الآن.",
    loginFirst: "سجّل دخولك أولًا ثم افتح هذا الرابط.",
    checkingTitle: "جاري التحقق من عملية الدفع...", checkingCopy: "لحظات ونؤكد لك حالة الدفع.",
    domainActivatedTitle: "تم تفعيل دومينك الفرعي 🎉",
    domainActivatedCopy: (slug) => `${slug ? `متجرك الآن على ${slug}.monah-app.com` : "دومينك الجديد"} شغال، ويتجدد تلقائيًا مع اشتراكك الشهري.`,
    addonActivatedTitle: "تم تفعيل الإضافات 🎉", addonActivatedCopy: "الإضافات اللي اخترتها شغالة الآن، ودخلت ضمن مبلغ تجديدك الشهري القادم.",
    renewActivatedTitle: "تم تجديد اشتراكك 🎉", renewActivatedCopy: "اشتراكك فعّال الآن لمدة 30 يوم إضافية.",
    signupActivatedTitle: "تم تفعيل متجرك 🎉", signupActivatedCopy: "اشتراكك فعّال الآن لمدة 30 يوم. تقدر تبدأ تضيف منتجاتك من لوحة التاجر.",
    openDashboard: "فتح لوحة التاجر",
    pendingTitle: "لم تكتمل عملية الدفع",
    pendingDomainCopy: "يبدو إن دفع الدومين ما تم أو لسا قيد المعالجة. تقدر ترجع تحاول من لوحة التاجر.",
    pendingGenericCopy: "يبدو إن الدفع ما تم أو لسا قيد المعالجة. تقدر ترجع تحاول من لوحة التاجر.",
    pendingSignupCopy: "يبدو إن الدفع ما تم أو لسا قيد المعالجة. لو تأكدت إن مبلغك انخصم فعلاً، لا تدفع مرة ثانية — تواصل معنا أو جرب تسجل دخول من جديد بعد شوي، لأن الموقع يعيد التحقق تلقائيًا كل ما تسجل دخول.",
    backToDashboard: "الرجوع للوحة التاجر",
    errorTitle: "تعذر التحقق من الدفع", login: "تسجيل الدخول",
  },
  en: {
    connectionError: "Couldn't connect to the server. Retrying...", verifyError: "Couldn't verify the payment right now.",
    loginFirst: "Log in first, then open this link.",
    checkingTitle: "Verifying your payment...", checkingCopy: "One moment while we confirm the payment status.",
    domainActivatedTitle: "Your subdomain is activated 🎉",
    domainActivatedCopy: (slug) => `${slug ? `Your store is now live at ${slug}.monah-app.com` : "Your new domain"} is working, and renews automatically with your monthly subscription.`,
    addonActivatedTitle: "Add-ons activated 🎉", addonActivatedCopy: "The add-ons you chose are working now, and were added to your next monthly renewal amount.",
    renewActivatedTitle: "Your subscription is renewed 🎉", renewActivatedCopy: "Your subscription is active now for another 30 days.",
    signupActivatedTitle: "Your store is activated 🎉", signupActivatedCopy: "Your subscription is active now for 30 days. You can start adding your products from the seller dashboard.",
    openDashboard: "Open seller dashboard",
    pendingTitle: "The payment didn't complete",
    pendingDomainCopy: "It looks like the domain payment didn't go through, or it's still processing. You can try again from the seller dashboard.",
    pendingGenericCopy: "It looks like the payment didn't go through, or it's still processing. You can try again from the seller dashboard.",
    pendingSignupCopy: "It looks like the payment didn't go through, or it's still processing. If you're sure the amount was deducted, don't pay again — contact us, or try logging in again shortly, since the site automatically re-checks every time you log in.",
    backToDashboard: "Back to seller dashboard",
    errorTitle: "Couldn't verify the payment", login: "Log in",
  },
};

function resultKind(param) {
  const value = String(param || "");
  if (value.startsWith("domain-")) return "domain";
  if (value.startsWith("addon-")) return "addon";
  if (value.startsWith("renew-")) return "renew";
  return "signup";
}

const REQUEST_TIMEOUT_MS = 6000;

async function verifyRequest(kind, t) {
  const idToken = await auth.currentUser.getIdToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch("/api/merchant-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ action: VERIFY_ACTIONS[kind] }),
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
async function verifyWithRetry(kind, isCancelled, t) {
  let lastData = null;
  let lastError = null;
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    if (isCancelled()) return null;
    try {
      const data = await verifyRequest(kind, t);
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

export default function StorePayResult({ param }) {
  const [lang, setLang] = useLang();
  const t = SPR_T[lang];
  const kind = resultKind(param);
  const [state, setState] = useState("checking");
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [rawStatus, setRawStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (!cancelled) { setState("error"); setError(t.loginFirst); }
        return;
      }
      verifyWithRetry(kind, () => cancelled, t).then((result) => {
        if (cancelled || !result) return;
        if (result.error) { setError(result.error.message); setState("error"); return; }
        const data = result.data;
        if (data.slug) setSlug(data.slug);
        if (data.status) setRawStatus(data.status);
        setState(data.paid ? "paid" : "pending");
      });
    });
    return () => { cancelled = true; unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return (
    <div className="pr-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <LangToggle lang={lang} onChange={setLang} className="pr-lang" />
      <main className="pr-card">
        {state === "checking" && <>
          <div className="pr-title">{t.checkingTitle}</div>
          <div className="pr-copy">{t.checkingCopy}</div>
        </>}
        {state === "paid" && kind === "domain" && <>
          <div className="pr-title">{t.domainActivatedTitle}</div>
          <div className="pr-copy">{t.domainActivatedCopy(slug)}</div>
          <a className="pr-btn" href="#dashboard/domain">{t.openDashboard}</a>
        </>}
        {state === "paid" && kind === "addon" && <>
          <div className="pr-title">{t.addonActivatedTitle}</div>
          <div className="pr-copy">{t.addonActivatedCopy}</div>
          <a className="pr-btn" href="#dashboard/subscription">{t.openDashboard}</a>
        </>}
        {state === "paid" && kind === "renew" && <>
          <div className="pr-title">{t.renewActivatedTitle}</div>
          <div className="pr-copy">{t.renewActivatedCopy}</div>
          <a className="pr-btn" href="#dashboard/subscription">{t.openDashboard}</a>
        </>}
        {state === "paid" && kind === "signup" && <>
          <div className="pr-title">{t.signupActivatedTitle}</div>
          <div className="pr-copy">{t.signupActivatedCopy}</div>
          <a className="pr-btn" href="#dashboard">{t.openDashboard}</a>
        </>}
        {state === "pending" && kind === "domain" && <>
          <div className="pr-title">{t.pendingTitle}</div>
          <div className="pr-copy">{t.pendingDomainCopy}</div>
          {rawStatus && <div className="pr-copy" style={{ marginTop: 8, fontFamily: "monospace", direction: "ltr", color: "#B0AC9C" }}>status: {rawStatus}</div>}
          <a className="pr-btn" href="#dashboard/domain">{t.backToDashboard}</a>
        </>}
        {state === "pending" && (kind === "addon" || kind === "renew") && <>
          <div className="pr-title">{t.pendingTitle}</div>
          <div className="pr-copy">{t.pendingGenericCopy}</div>
          {rawStatus && <div className="pr-copy" style={{ marginTop: 8, fontFamily: "monospace", direction: "ltr", color: "#B0AC9C" }}>status: {rawStatus}</div>}
          <a className="pr-btn" href="#dashboard/subscription">{t.backToDashboard}</a>
        </>}
        {state === "pending" && kind === "signup" && <>
          <div className="pr-title">{t.pendingTitle}</div>
          <div className="pr-copy">{t.pendingSignupCopy}</div>
          {rawStatus && <div className="pr-copy" style={{ marginTop: 8, fontFamily: "monospace", direction: "ltr", color: "#B0AC9C" }}>status: {rawStatus}</div>}
          <a className="pr-btn" href="#dashboard">{t.backToDashboard}</a>
        </>}
        {state === "error" && <>
          <div className="pr-title">{t.errorTitle}</div>
          <div className="pr-copy">{error}</div>
          <a className="pr-btn" href="#login">{t.login}</a>
        </>}
      </main>
    </div>
  );
}
