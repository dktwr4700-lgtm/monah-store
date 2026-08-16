import React, { useState } from "react";
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";

const styles = `
  .auth-page{ min-height:100vh; display:flex; align-items:center; justify-content:center; background:#F7F6F2; padding:20px; font-family:'Cairo', sans-serif; }
  .auth-card{ width:100%; max-width:380px; background:#fff; border:1px solid #DFDCD1; border-radius:14px; padding:28px 24px; }
  .auth-brand{ font-family:'Almarai', sans-serif; font-weight:800; font-size:19px; color:#16233F; text-align:center; margin-bottom:6px; }
  .auth-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:17px; text-align:center; margin-bottom:20px; color:#16181D; }
  .auth-field{ margin-bottom:14px; }
  .auth-field label{ display:block; font-size:12.5px; font-weight:700; margin-bottom:6px; color:#66655C; }
  .auth-field input{ width:100%; padding:12px 14px; border:1px solid #DFDCD1; border-radius:9px; font-family:'Cairo'; font-size:13.5px; }
  .auth-btn{ width:100%; background:#16233F; color:#fff; font-weight:700; font-size:14.5px; padding:13px; border:none; border-radius:9px; cursor:pointer; margin-top:6px; }
  .auth-btn:disabled{ opacity:.6; }
  .auth-error{ background:#F6E9E5; color:#B24C3A; font-size:12.5px; padding:10px 12px; border-radius:8px; margin-bottom:14px; }
  .auth-switch{ text-align:center; font-size:12.5px; color:#66655C; margin-top:16px; }
  .auth-switch a{ color:#16233F; font-weight:700; text-decoration:none; }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.hash = "dashboard";
    } catch (err) {
      setError("البريد أو كلمة المرور غير صحيحة.");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-brand">Monah</div>
        <div className="auth-title">تسجيل الدخول</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
