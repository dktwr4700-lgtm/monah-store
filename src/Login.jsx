import React, { useState } from "react";
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

const ADMIN_EMAIL = "k1997551@gmail.com";

const styles = `
  .auth-page{ min-height:100vh; display:flex; align-items:center; justify-content:center; background:#FFFFFF; padding:20px; font-family:'Cairo', sans-serif; }
  .auth-card{ width:100%; max-width:380px; background:#fff; border:1px solid #EDEAE0; border-radius:20px; padding:28px 24px; }
  .auth-brand{ font-family:'Almarai', sans-serif; font-weight:800; font-size:19px; color:#0B0B0C; text-align:center; margin-bottom:6px; }
  .auth-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:17px; text-align:center; margin-bottom:20px; color:#0B0B0C; }
  .auth-field{ margin-bottom:14px; }
  .auth-field label{ display:block; font-size:12.5px; font-weight:700; margin-bottom:6px; color:#8A8677; }
  .auth-field input{ width:100%; padding:12px 14px; border:1px solid #EDEAE0; border-radius:10px; font-family:'Cairo'; font-size:13.5px; background:#FBFAF7; box-sizing:border-box; }
  .auth-btn{ width:100%; background:#0B0B0C; color:#fff; font-weight:700; font-size:14.5px; padding:13px; border:none; border-radius:100px; cursor:pointer; margin-top:6px; }
  .auth-btn:disabled{ opacity:.6; }
  .auth-error{ background:#F6E9E5; color:#B24C3A; font-size:12.5px; padding:10px 12px; border-radius:10px; margin-bottom:14px; }
  .auth-success{ background:#EAF0EB; color:#4B6152; font-size:12.5px; padding:10px 12px; border-radius:10px; margin-bottom:14px; }
  .auth-forgot{ text-align:left; margin-top:-6px; margin-bottom:14px; }
  .auth-forgot button{ background:none; border:none; color:#8A8677; font-size:12px; font-family:'Cairo'; cursor:pointer; text-decoration:underline; padding:0; }
  .auth-switch{ text-align:center; font-size:12.5px; color:#8A8677; margin-top:16px; }
  .auth-switch a{ color:#0B0B0C; font-weight:700; text-decoration:none; }

  .auth-page button{ transition:transform 100ms ease-out; }
  .auth-page button:active{ transform:scale(0.96); }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResetMsg("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred.user.email === ADMIN_EMAIL) {
        window.location.hash = "admin";
      } else {
        window.location.hash = "dashboard";
      }
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("ما فيه حساب بهذا البريد. تأكد من الإيميل أو أنشئ حساب جديد.");
      } else if (err.code === "auth/wrong-password") {
        setError("كلمة المرور غير صحيحة. تقدر تضغط \"نسيت كلمة المرور؟\" تحت.");
      } else if (err.code === "auth/invalid-credential") {
        setError("البريد أو كلمة المرور غير صحيحة. تأكد منهما، أو اضغط \"نسيت كلمة المرور؟\" تحت.");
      } else {
        setError("البريد أو كلمة المرور غير صحيحة.");
      }
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    setError("");
    setResetMsg("");
    if (!email || !email.includes("@")) {
      setError("اكتب بريدك الإلكتروني أول بخانة البريد فوق، وبعدين اضغط \"نسيت كلمة المرور؟\".");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("أرسلنا لك رابط تغيير كلمة المرور على بريدك. تأكد من صندوق الوارد (أو الرسائل غير المرغوبة).");
    } catch (err) {
      setError("تعذّر إرسال رابط الاستعادة. تأكد إن البريد صحيح وحاول مرة ثانية.");
    }
    setResetLoading(false);
  }

  return (
    <div className="auth-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-brand">Monah</div>
        <div className="auth-title">تسجيل الدخول</div>

        {error && <div className="auth-error">{error}</div>}
        {resetMsg && <div className="auth-success">{resetMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="auth-forgot">
            <button type="button" onClick={handleForgotPassword} disabled={resetLoading}>
              {resetLoading ? "جاري الإرسال..." : "نسيت كلمة المرور؟"}
            </button>
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="auth-switch">
          ما عندك حساب؟ <a href="#register">أنشئ حساب بائع</a>
        </div>
      </div>
    </div>
  );
}
