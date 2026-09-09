import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";

const styles = `
  .pr-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F3EC;padding:20px;font-family:'Cairo',sans-serif;color:#16233F}
  .pr-card{width:100%;max-width:400px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:30px 24px;text-align:center;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .pr-title{font-family:'Almarai',sans-serif;font-size:16px;font-weight:800;margin-bottom:10px}
  .pr-copy{font-size:12.5px;line-height:1.85;color:#625F55}
  .pr-btn{display:inline-block;margin-top:18px;border:0;border-radius:100px;padding:12px 20px;background:#16233F;color:#fff;font:700 13px 'Cairo',sans-serif;text-decoration:none;cursor:pointer}
`;

async function verifyRequest(orderId) {
  await ensureAnonymousAuth();
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ action: "verify_card_charge", orderId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر التحقق من الدفع الآن.");
  return data;
}

export default function PayResult({ orderId }) {
  const [state, setState] = useState("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    verifyRequest(orderId)
      .then((data) => {
        if (cancelled) return;
        setState(data.paid ? "paid" : "pending");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError.message);
        setState("error");
      });
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="pr-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="pr-card">
        {state === "checking" && <>
          <div className="pr-title">جاري التحقق من عملية الدفع...</div>
          <div className="pr-copy">لحظات ونؤكد لك حالة الدفع.</div>
        </>}
        {state === "paid" && <>
          <div className="pr-title">تم الدفع بنجاح 🎉</div>
          <div className="pr-copy">طلبك جاهز الآن. تقدر تفتح "طلباتي" وتنزّل منتجك مباشرة.</div>
          <a className="pr-btn" href="#purchases">فتح طلباتي</a>
        </>}
        {state === "pending" && <>
          <div className="pr-title">لم تكتمل عملية الدفع</div>
          <div className="pr-copy">يبدو إن الدفع ما تم أو لسا قيد المعالجة. تقدر ترجع تحاول الدفع بالبطاقة مرة ثانية، أو تستخدم التحويل اليدوي.</div>
          <a className="pr-btn" href="#purchases">فتح طلباتي</a>
        </>}
        {state === "error" && <>
          <div className="pr-title">تعذر التحقق من الدفع</div>
          <div className="pr-copy">{error}</div>
          <a className="pr-btn" href="#purchases">فتح طلباتي</a>
        </>}
      </main>
    </div>
  );
}
