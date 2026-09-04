import React, { useEffect, useState } from "react";
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";

const STORE_TYPE_LABELS = {
  books: "كتب رقمية",
  videos: "فيديوهات ودورات",
  codes: "أكواد وتراخيص",
  files: "ملفات وقوالب",
};

const styles = `
  .invite-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F3EC;padding:20px;font-family:'Cairo',sans-serif;color:#16233F}
  .invite-card{width:100%;max-width:400px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:28px 24px;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .invite-brand{font-family:'Almarai',sans-serif;font-size:19px;font-weight:800;text-align:center;margin-bottom:8px}.invite-title{font-family:'Almarai',sans-serif;font-size:17px;font-weight:800;text-align:center;margin-bottom:8px}.invite-text{font-size:12.5px;line-height:1.85;color:#625F55;text-align:center;margin:0 0 18px}.invite-summary{background:#F7F7F2;border:1px solid #EDEAE0;border-radius:13px;padding:13px;margin-bottom:16px}.invite-summary b{display:block;font-size:14px}.invite-summary span{display:block;color:#625F55;font-size:11.5px;margin-top:4px}.invite-field{margin-bottom:14px}.invite-field label{display:block;font-size:12px;font-weight:800;color:#625F55;margin-bottom:6px}.invite-field input{box-sizing:border-box;width:100%;padding:12px 13px;border:1px solid #E4E0D3;border-radius:10px;background:#FBFAF7;font:13px 'Cairo',sans-serif}.invite-btn{width:100%;border:0;border-radius:100px;padding:13px;background:#16233F;color:#fff;font:700 13.5px 'Cairo',sans-serif;cursor:pointer}.invite-btn:disabled{opacity:.6}.invite-message{border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.7;margin-bottom:14px}.invite-message.error{background:#F6E9E5;color:#A34839}.invite-message.loading{background:#F3EBDD;color:#8A5B18}.invite-back{display:block;text-align:center;margin-top:16px;font-size:12px;font-weight:800;color:#16233F;text-decoration:none}.invite-page button{transition:transform 100ms ease-out}.invite-page button:active{transform:scale(.96)}
`;

async function inviteRequest(action, payload, idToken = "") {
  const response = await fetch("/api/merchant-invites", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر فتح الدعوة الآن.");
  return data;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function InviteActivation({ token }) {
  const [status, setStatus] = useState("loading");
  const [invite, setInvite] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    inviteRequest("inspect", { token })
      .then((data) => {
        if (!cancelled) {
          setInvite(data.invite);
          setStatus("ready");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
          setStatus("invalid");
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  async function activate(event) {
    event.preventDefault();
    setError("");
    if (!validEmail(email)) return setError("اكتب بريدك الإلكتروني بشكل صحيح.");
    if (password.length < 6) return setError("اختر كلمة مرور من 6 أحرف أو أكثر.");
    setSaving(true);
    try {
      let credential;
      let isNewAccount = false;
      try {
        credential = await createUserWithEmailAndPassword(auth, email, password);
        isNewAccount = true;
      } catch (createError) {
        if (createError.code !== "auth/email-already-in-use") throw createError;
        credential = await signInWithEmailAndPassword(auth, email, password);
      }
      if (isNewAccount) {
        await sendEmailVerification(credential.user).catch(() => {});
      }
      const idToken = await credential.user.getIdToken(true);
      await inviteRequest("activate", { token }, idToken);
      window.location.hash = "dashboard";
    } catch (activationError) {
      await signOut(auth).catch(() => {});
      if (activationError.code === "auth/weak-password") setError("كلمة المرور ضعيفة، اختر كلمة أطول.");
      else if (activationError.code === "auth/invalid-email") setError("تعذر تفعيل الدعوة. اطلب رابطًا جديدًا من صاحب المنصة.");
      else setError(activationError.message || "تعذر تفعيل الدعوة الآن.");
    }
    setSaving(false);
  }

  return (
    <div className="invite-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="invite-card">
        <div className="invite-brand">مُونة</div>
        {status === "loading" && <div className="invite-message loading">جاري التحقق من رابط الدعوة...</div>}
        {status === "invalid" && <><div className="invite-title">رابط الدعوة غير متاح</div><div className="invite-message error">{error}</div><a className="invite-back" href="#login">تسجيل الدخول</a></>}
        {status === "ready" && invite && <>
          <div className="invite-title">فعّل متجرك الخاص</div>
          <p className="invite-text">هذه دعوة خاصة لك. اختر كلمة المرور بنفسك ثم أكمل ترتيب متجرك.</p>
          <div className="invite-summary"><b>{invite.storeName}</b><span>{STORE_TYPE_LABELS[invite.storeType] || "منتجات رقمية"}</span></div>
          {error && <div className="invite-message error">{error}</div>}
          <form onSubmit={activate}>
            <div className="invite-field"><label>بريدك الإلكتروني</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
            <div className="invite-field"><label>اختر كلمة المرور</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
            <button className="invite-btn" type="submit" disabled={saving}>{saving ? "جاري تفعيل المتجر..." : "تفعيل متجري"}</button>
          </form>
        </>}
      </main>
    </div>
  );
}
