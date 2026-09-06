import React, { useState } from "react";
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const STORE_TYPES = { books: "كتب رقمية", videos: "فيديوهات ودورات", codes: "أكواد وتراخيص", files: "ملفات وقوالب" };

const styles = `
  .invite-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F3EC;padding:20px;font-family:'Cairo',sans-serif;color:#16233F}
  .invite-card{width:100%;max-width:420px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:28px 24px;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .invite-brand{font-family:'Almarai',sans-serif;font-size:19px;font-weight:800;text-align:center;margin-bottom:8px}.invite-title{font-family:'Almarai',sans-serif;font-size:17px;font-weight:800;text-align:center;margin-bottom:8px}.invite-text{font-size:12.5px;line-height:1.85;color:#625F55;text-align:center;margin:0 0 18px}
  .invite-field{margin-bottom:14px}.invite-field label{display:block;font-size:12px;font-weight:800;color:#625F55;margin-bottom:6px}.invite-field input,.invite-field select{box-sizing:border-box;width:100%;padding:12px 13px;border:1px solid #E4E0D3;border-radius:10px;background:#FBFAF7;font:13px 'Cairo',sans-serif}
  .invite-btn{width:100%;border:0;border-radius:100px;padding:13px;background:#16233F;color:#fff;font:700 13.5px 'Cairo',sans-serif;cursor:pointer}.invite-btn:disabled{opacity:.6}
  .invite-message{border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.7;margin-bottom:14px}.invite-message.error{background:#F6E9E5;color:#A34839}
  .invite-back{display:block;text-align:center;margin-top:16px;font-size:12px;font-weight:800;color:#16233F;text-decoration:none}
  .invite-google{width:100%;display:flex;align-items:center;justify-content:center;gap:9px;background:#fff;color:#16233F;font:700 13px 'Cairo',sans-serif;padding:12px;border:1px solid #E4E0D3;border-radius:100px;cursor:pointer;margin-bottom:16px}
  .invite-google:disabled{opacity:.6}
  .invite-divider{display:flex;align-items:center;gap:10px;color:#B0AC9C;font-size:11px;margin-bottom:16px}
  .invite-divider::before,.invite-divider::after{content:"";flex:1;height:1px;background:#E4E0D3}
  .invite-page button{transition:transform 100ms ease-out}.invite-page button:active{transform:scale(.96)}
`;

async function signupRequest(action, payload, idToken = "") {
  const response = await fetch("/api/merchant-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تنفيذ العملية الآن.");
  return data;
}

export default function StartStore() {
  const [step, setStep] = useState("form");
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState("files");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitForm(event) {
    event.preventDefault();
    setError("");
    if (storeName.trim().length < 2) return setError("اكتب اسم متجرك.");
    if (password.length < 6) return setError("اختر كلمة مرور من 6 أحرف أو أكثر.");
    setBusy(true);
    try {
      let credential;
      try {
        credential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (createError) {
        if (createError.code !== "auth/email-already-in-use") throw createError;
        credential = await signInWithEmailAndPassword(auth, email, password);
      }
      const idToken = await credential.user.getIdToken(true);
      await signupRequest("register", { storeName: storeName.trim(), storeType }, idToken);
      setStep("payment");
    } catch (submitError) {
      await signOut(auth).catch(() => {});
      if (submitError.code === "auth/weak-password") setError("كلمة المرور ضعيفة، اختر كلمة أطول.");
      else if (submitError.code === "auth/invalid-email") setError("اكتب بريدك الإلكتروني بشكل صحيح.");
      else if (submitError.code === "auth/wrong-password") setError("كلمة المرور غير صحيحة لهذا البريد.");
      else setError(submitError.message || "تعذر إنشاء الحساب الآن.");
    }
    setBusy(false);
  }

  async function submitWithGoogle() {
    setError("");
    if (storeName.trim().length < 2) return setError("اكتب اسم متجرك أولًا.");
    setBusy(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credential.user.getIdToken(true);
      await signupRequest("register", { storeName: storeName.trim(), storeType }, idToken);
      setStep("payment");
    } catch (submitError) {
      if (submitError.code !== "auth/popup-closed-by-user" && submitError.code !== "auth/cancelled-popup-request") {
        await signOut(auth).catch(() => {});
        setError(submitError.message || "تعذر إنشاء الحساب الآن.");
      }
    }
    setBusy(false);
  }

  async function payByCard() {
    setError("");
    setBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const data = await signupRequest("create_card_charge", {}, idToken);
      window.location.assign(data.url);
    } catch (requestError) {
      setError(requestError.message || "تعذر بدء الدفع الآن.");
      setBusy(false);
    }
  }

  return (
    <div className="invite-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="invite-card">
        <div className="invite-brand">مُونة</div>

        {step === "form" && <>
          <div className="invite-title">افتح متجرك الرقمي الآن</div>
          <p className="invite-text">اكتب بيانات متجرك وبريدك، وأنت تختار كلمة المرور بنفسك. الاشتراك 5 ر.ع شهريًا بالبطاقة.</p>
          {error && <div className="invite-message error">{error}</div>}
          <div className="invite-field"><label>اسم المتجر</label><input value={storeName} onChange={(event) => setStoreName(event.target.value)} placeholder="مثال: متجر هند للتصاميم" required /></div>
          <div className="invite-field"><label>ماذا تبيع؟</label><select value={storeType} onChange={(event) => setStoreType(event.target.value)}>{Object.entries(STORE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>

          <button type="button" className="invite-google" onClick={submitWithGoogle} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9A8.75 8.75 0 0017.64 9.2z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.55-1.84.87-3.06.87-2.36 0-4.36-1.6-5.07-3.75H.9v2.35A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 013.64 9c0-.58.1-1.15.29-1.68V4.97H.9A9 9 0 000 9c0 1.45.35 2.83.9 4.03l3.03-2.35z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.9 4.97l3.03 2.35C4.64 5.18 6.64 3.58 9 3.58z"/></svg>
            {busy ? "جاري الإنشاء..." : "متابعة بحساب جوجل"}
          </button>
          <div className="invite-divider">أو بالبريد وكلمة المرور</div>

          <form onSubmit={submitForm}>
            <div className="invite-field"><label>بريدك الإلكتروني</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
            <div className="invite-field"><label>اختر كلمة المرور</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
            <button className="invite-btn" type="submit" disabled={busy}>{busy ? "جاري الإنشاء..." : "متابعة"}</button>
          </form>
          <a className="invite-back" href="#login">عندك متجر بالفعل؟ سجّل الدخول</a>
        </>}

        {step === "payment" && <>
          <div className="invite-title">فعّل اشتراكك</div>
          <p className="invite-text">اشتراك متجرك 5 ر.ع شهريًا. ادفع بالبطاقة الآن ليتفعّل متجرك فورًا.</p>
          {error && <div className="invite-message error">{error}</div>}
          <button className="invite-btn" type="button" onClick={payByCard} disabled={busy}>{busy ? "جاري التحويل لصفحة الدفع..." : "ادفع الآن بالبطاقة"}</button>
        </>}
      </main>
    </div>
  );
}
