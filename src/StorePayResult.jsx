import React, { useEffect, useState } from "react";
import { auth } from "./firebase.js";

const styles = `
  .pr-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F3EC;padding:20px;font-family:'Cairo',sans-serif;color:#16233F}
  .pr-card{width:100%;max-width:400px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:30px 24px;text-align:center;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .pr-title{font-family:'Almarai',sans-serif;font-size:16px;font-weight:800;margin-bottom:10px}
  .pr-copy{font-size:12.5px;line-height:1.85;color:#625F55}
  .pr-btn{display:inline-block;margin-top:18px;border:0;border-radius:100px;padding:12px 20px;background:#16233F;color:#fff;font:700 13px 'Cairo',sans-serif;text-decoration:none;cursor:pointer}
`;

async function verifyRequest() {
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/merchant-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ action: "verify_card_charge" }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر التحقق من الدفع الآن.");
  return data;
}

export default function StorePayResult() {
  const [state, setState] = useState("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (!cancelled) { setState("error"); setError("سجّل دخولك أولًا ثم افتح هذا الرابط."); }
        return;
      }
      verifyRequest()
        .then((data) => { if (!cancelled) setState(data.paid ? "paid" : "pending"); })
        .catch((requestError) => { if (!cancelled) { setError(requestError.message); setState("error"); } });
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  return (
    <div className="pr-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="pr-card">
        {state === "checking" && <>
          <div className="pr-title">جاري التحقق من عملية الدفع...</div>
          <div className="pr-copy">لحظات ونؤكد لك حالة الدفع.</div>
        </>}
        {state === "paid" && <>
          <div className="pr-title">تم تفعيل متجرك 🎉</div>
          <div className="pr-copy">اشتراكك فعّال الآن لمدة 30 يوم. تقدر تبدأ تضيف منتجاتك من لوحة التاجر.</div>
          <a className="pr-btn" href="#dashboard">فتح لوحة التاجر</a>
        </>}
        {state === "pending" && <>
          <div className="pr-title">لم تكتمل عملية الدفع</div>
          <div className="pr-copy">يبدو إن الدفع ما تم أو لسا قيد المعالجة. تقدر ترجع تحاول الدفع بالبطاقة مرة ثانية، أو تستخدم التحويل اليدوي.</div>
          <a className="pr-btn" href="#start-store">الرجوع لصفحة التسجيل</a>
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
