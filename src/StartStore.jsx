import React, { useState } from "react";
import { auth, storage } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, uploadBytes } from "firebase/storage";

const STORE_TYPES = { books: "كتب رقمية", videos: "فيديوهات ودورات", codes: "أكواد وتراخيص", files: "ملفات وقوالب" };
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const styles = `
  .invite-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F3EC;padding:20px;font-family:'Cairo',sans-serif;color:#16233F}
  .invite-card{width:100%;max-width:420px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:28px 24px;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .invite-brand{font-family:'Almarai',sans-serif;font-size:19px;font-weight:800;text-align:center;margin-bottom:8px}.invite-title{font-family:'Almarai',sans-serif;font-size:17px;font-weight:800;text-align:center;margin-bottom:8px}.invite-text{font-size:12.5px;line-height:1.85;color:#625F55;text-align:center;margin:0 0 18px}
  .invite-field{margin-bottom:14px}.invite-field label{display:block;font-size:12px;font-weight:800;color:#625F55;margin-bottom:6px}.invite-field input,.invite-field select{box-sizing:border-box;width:100%;padding:12px 13px;border:1px solid #E4E0D3;border-radius:10px;background:#FBFAF7;font:13px 'Cairo',sans-serif}
  .invite-btn{width:100%;border:0;border-radius:100px;padding:13px;background:#16233F;color:#fff;font:700 13.5px 'Cairo',sans-serif;cursor:pointer}.invite-btn:disabled{opacity:.6}
  .invite-btn.outline{background:#fff;border:1px solid #16233F;color:#16233F}
  .invite-message{border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.7;margin-bottom:14px}.invite-message.error{background:#F6E9E5;color:#A34839}.invite-message.success{background:#EAF0EB;color:#37724B}
  .invite-divider{text-align:center;color:#89857A;font-size:11px;margin:16px 0}
  .invite-instructions{white-space:pre-line;background:#F7F7F2;border:1px dashed #E4E0D3;border-radius:10px;padding:11px;font-size:12px;line-height:1.85;color:#383630;margin-bottom:12px}
  .invite-back{display:block;text-align:center;margin-top:16px;font-size:12px;font-weight:800;color:#16233F;text-decoration:none}
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

function safeName(name) {
  return String(name || "receipt").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "receipt";
}

export default function StartStore() {
  const [step, setStep] = useState("form");
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState("files");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [proofFile, setProofFile] = useState(null);

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

  async function loadInstructions() {
    setError("");
    setBusy(true);
    try {
      const data = await signupRequest("payment_instructions", {});
      setInstructions(data.paymentInstructions || "لم يضع صاحب مُونَة تعليمات تحويل بعد. تواصل معه مباشرة.");
      setStep("manual");
    } catch (requestError) {
      setError(requestError.message || "تعذر تحميل تعليمات التحويل الآن.");
    }
    setBusy(false);
  }

  function chooseProof(event) {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    if (!nextFile) return setProofFile(null);
    if (!ACCEPTED_TYPES.includes(nextFile.type) || nextFile.size < 1 || nextFile.size >= MAX_PROOF_BYTES) {
      setProofFile(null);
      setError("اختر JPG أو PNG أو WEBP أو PDF بحجم أقل من 5 م.ب.");
      event.target.value = "";
      return;
    }
    setProofFile(nextFile);
  }

  async function submitProof() {
    if (!proofFile || !auth.currentUser) return setError("اختر إثبات التحويل أولًا.");
    setBusy(true);
    setError("");
    try {
      const filename = safeName(proofFile.name);
      const proofPath = `merchant-subscription-proofs/${auth.currentUser.uid}/${Date.now()}_${filename}`;
      await uploadBytes(ref(storage, proofPath), proofFile, { contentType: proofFile.type });
      const idToken = await auth.currentUser.getIdToken();
      await signupRequest("submit_manual_proof", { proofPath, proofName: filename }, idToken);
      setStep("pending");
    } catch (requestError) {
      setError(requestError.message || "تعذر رفع الإثبات الآن.");
    }
    setBusy(false);
  }

  return (
    <div className="invite-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="invite-card">
        <div className="invite-brand">مُونة</div>

        {step === "form" && <>
          <div className="invite-title">افتح متجرك الرقمي الآن</div>
          <p className="invite-text">اكتب بيانات متجرك وبريدك، وأنت تختار كلمة المرور بنفسك. الاشتراك 5 ر.ع شهريًا فقط.</p>
          {error && <div className="invite-message error">{error}</div>}
          <form onSubmit={submitForm}>
            <div className="invite-field"><label>اسم المتجر</label><input value={storeName} onChange={(event) => setStoreName(event.target.value)} placeholder="مثال: متجر هند للتصاميم" required /></div>
            <div className="invite-field"><label>ماذا تبيع؟</label><select value={storeType} onChange={(event) => setStoreType(event.target.value)}>{Object.entries(STORE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="invite-field"><label>بريدك الإلكتروني</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
            <div className="invite-field"><label>اختر كلمة المرور</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
            <button className="invite-btn" type="submit" disabled={busy}>{busy ? "جاري الإنشاء..." : "متابعة"}</button>
          </form>
          <a className="invite-back" href="#login">عندك متجر بالفعل؟ سجّل الدخول</a>
        </>}

        {step === "payment" && <>
          <div className="invite-title">فعّل اشتراكك</div>
          <p className="invite-text">اشتراك متجرك 5 ر.ع شهريًا. اختر طريقة الدفع.</p>
          {error && <div className="invite-message error">{error}</div>}
          <button className="invite-btn" type="button" onClick={payByCard} disabled={busy}>{busy ? "جاري التحويل لصفحة الدفع..." : "ادفع الآن بالبطاقة"}</button>
          <div className="invite-divider">— أو —</div>
          <button className="invite-btn outline" type="button" onClick={loadInstructions} disabled={busy}>حوّل يدويًا</button>
        </>}

        {step === "manual" && <>
          <div className="invite-title">التحويل اليدوي</div>
          {error && <div className="invite-message error">{error}</div>}
          <div className="invite-instructions">{instructions}</div>
          <div className="invite-field"><label>إثبات التحويل</label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={chooseProof} /></div>
          {proofFile && <div className="invite-message success">تم اختيار: {proofFile.name}</div>}
          <button className="invite-btn" type="button" onClick={submitProof} disabled={busy || !proofFile}>{busy ? "جاري الإرسال..." : "إرسال الإثبات"}</button>
        </>}

        {step === "pending" && <>
          <div className="invite-title">طلبك قيد المراجعة</div>
          <p className="invite-text">استلمنا إثبات التحويل. بنراجعه ونفعّل متجرك خلال وقت قصير. سجّل دخولك لاحقًا من نفس البريد لمتابعة الحالة.</p>
        </>}
      </main>
    </div>
  );
}
