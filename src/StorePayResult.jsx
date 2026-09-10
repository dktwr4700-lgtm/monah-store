import React, { useEffect, useState } from "react";
import { auth } from "./firebase.js";

const styles = `
  .pr-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F3EC;padding:20px;font-family:'Cairo',sans-serif;color:#16233F}
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

function resultKind(param) {
  const value = String(param || "");
  if (value.startsWith("domain-")) return "domain";
  if (value.startsWith("addon-")) return "addon";
  if (value.startsWith("renew-")) return "renew";
  return "signup";
}

async function verifyRequest(kind) {
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/merchant-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ action: VERIFY_ACTIONS[kind] }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر التحقق من الدفع الآن.");
  return data;
}

const POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2500;

// تسوية الدفع عند البنك ممكن تاخذ ثوانٍ بعد رجوع العميل من صفحة الدفع، فأول
// استعلام أحيانًا يرجع "لسا ما تأكد" حتى لو الدفع نجح فعليًا. نعيد المحاولة
// تلقائيًا لين نتأكد، بدل ما نعرض "لم يكتمل الدفع" على عميل دفع فعلاً.
async function verifyWithRetry(kind, isCancelled) {
  let lastData = null;
  let lastError = null;
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    if (isCancelled()) return null;
    try {
      const data = await verifyRequest(kind);
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
  const kind = resultKind(param);
  const [state, setState] = useState("checking");
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [rawStatus, setRawStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (!cancelled) { setState("error"); setError("سجّل دخولك أولًا ثم افتح هذا الرابط."); }
        return;
      }
      verifyWithRetry(kind, () => cancelled).then((result) => {
        if (cancelled || !result) return;
        if (result.error) { setError(result.error.message); setState("error"); return; }
        const data = result.data;
        if (data.slug) setSlug(data.slug);
        if (data.status) setRawStatus(data.status);
        setState(data.paid ? "paid" : "pending");
      });
    });
    return () => { cancelled = true; unsub(); };
  }, [kind]);

  return (
    <div className="pr-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="pr-card">
        {state === "checking" && <>
          <div className="pr-title">جاري التحقق من عملية الدفع...</div>
          <div className="pr-copy">لحظات ونؤكد لك حالة الدفع.</div>
        </>}
        {state === "paid" && kind === "domain" && <>
          <div className="pr-title">تم تفعيل دومينك الفرعي 🎉</div>
          <div className="pr-copy">{slug ? `متجرك الآن على ${slug}.monah-app.com` : "دومينك الجديد"} شغال، ويتجدد تلقائيًا مع اشتراكك الشهري.</div>
          <a className="pr-btn" href="#dashboard/domain">فتح لوحة التاجر</a>
        </>}
        {state === "paid" && kind === "addon" && <>
          <div className="pr-title">تم تفعيل الإضافات 🎉</div>
          <div className="pr-copy">الإضافات اللي اخترتها شغالة الآن، ودخلت ضمن مبلغ تجديدك الشهري القادم.</div>
          <a className="pr-btn" href="#dashboard/subscription">فتح لوحة التاجر</a>
        </>}
        {state === "paid" && kind === "renew" && <>
          <div className="pr-title">تم تجديد اشتراكك 🎉</div>
          <div className="pr-copy">اشتراكك فعّال الآن لمدة 30 يوم إضافية.</div>
          <a className="pr-btn" href="#dashboard/subscription">فتح لوحة التاجر</a>
        </>}
        {state === "paid" && kind === "signup" && <>
          <div className="pr-title">تم تفعيل متجرك 🎉</div>
          <div className="pr-copy">اشتراكك فعّال الآن لمدة 30 يوم. تقدر تبدأ تضيف منتجاتك من لوحة التاجر.</div>
          <a className="pr-btn" href="#dashboard">فتح لوحة التاجر</a>
        </>}
        {state === "pending" && kind === "domain" && <>
          <div className="pr-title">لم تكتمل عملية الدفع</div>
          <div className="pr-copy">يبدو إن دفع الدومين ما تم أو لسا قيد المعالجة. تقدر ترجع تحاول من لوحة التاجر.</div>
          {rawStatus && <div className="pr-copy" style={{ marginTop: 8, fontFamily: "monospace", direction: "ltr", color: "#B0AC9C" }}>status: {rawStatus}</div>}
          <a className="pr-btn" href="#dashboard/domain">الرجوع للوحة التاجر</a>
        </>}
        {state === "pending" && (kind === "addon" || kind === "renew") && <>
          <div className="pr-title">لم تكتمل عملية الدفع</div>
          <div className="pr-copy">يبدو إن الدفع ما تم أو لسا قيد المعالجة. تقدر ترجع تحاول من لوحة التاجر.</div>
          {rawStatus && <div className="pr-copy" style={{ marginTop: 8, fontFamily: "monospace", direction: "ltr", color: "#B0AC9C" }}>status: {rawStatus}</div>}
          <a className="pr-btn" href="#dashboard/subscription">الرجوع للوحة التاجر</a>
        </>}
        {state === "pending" && kind === "signup" && <>
          <div className="pr-title">لم تكتمل عملية الدفع</div>
          <div className="pr-copy">يبدو إن الدفع ما تم أو لسا قيد المعالجة. لو تأكدت إن مبلغك انخصم فعلاً، لا تدفع مرة ثانية — تواصل معنا أو جرب تسجل دخول من جديد بعد شوي، لأن الموقع يعيد التحقق تلقائيًا كل ما تسجل دخول.</div>
          {rawStatus && <div className="pr-copy" style={{ marginTop: 8, fontFamily: "monospace", direction: "ltr", color: "#B0AC9C" }}>status: {rawStatus}</div>}
          <a className="pr-btn" href="#dashboard">الرجوع للوحة التاجر</a>
        </>}
        {state === "error" && <>
          <div className="pr-title">تعذر التحقق من الدفع</div>
          <div className="pr-copy">{error}</div>
          <a className="pr-btn" href="#login">تسجيل الدخول</a>
        </>}
      </main>
    </div>
  );
}
