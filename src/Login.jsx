import React, { useState, useEffect } from "react";
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import useRunawayButton from "./useRunawayButton.js";

const ADMIN_EMAIL = "k1997551@gmail.com";
const CTA_WIDTH = 190;

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
  .auth-google{ width:100%; display:flex; align-items:center; justify-content:center; gap:9px; background:#fff; color:#0B0B0C; font-weight:700; font-size:13.5px; padding:12px; border:1px solid #EDEAE0; border-radius:100px; cursor:pointer; margin-bottom:16px; }
  .auth-google:disabled{ opacity:.6; }
  .auth-divider{ display:flex; align-items:center; gap:10px; color:#B0AC9C; font-size:11px; margin-bottom:16px; }
  .auth-divider::before,.auth-divider::after{ content:""; flex:1; height:1px; background:#EDEAE0; }

  .auth-page button{ transition:transform 100ms ease-out; }
  .auth-page button:active{ transform:scale(0.96); }
  .auth-cta-track{display:flex;justify-content:center;padding:2px 0}
  .auth-cta-track .auth-btn{width:${CTA_WIDTH}px;transform:translateX(var(--cta-offset,0px));transition:transform 320ms cubic-bezier(.22,1,.36,1)}
  .auth-cta-track .auth-btn:active{transform:translateX(var(--cta-offset,0px)) scale(.96)}
  .auth-cta-track .auth-btn.fleeing{transition:transform 190ms cubic-bezier(.3,1.4,.6,1)}
  .auth-cta-track .auth-btn.ready{background:#163F2E;box-shadow:0 0 0 3px rgba(55,114,75,.18)}
  .auth-cta-hint{text-align:center;font-size:11px;color:#8A8677;margin-top:9px}
  .auth-cta-hint.ready{color:#37724B;font-weight:700}
  @media (prefers-reduced-motion: reduce){.auth-cta-track .auth-btn,.auth-cta-track .auth-btn.fleeing{transform:none!important;transition:background 200ms ease}}
`;

const AUTH_TIMEOUT_MS = 8000;

// بعض متصفحات الجوال تعلّق الاتصال بصمت (لا ينجح ولا يفشل) — بدون هذي المهلة،
// زر "تسجيل الدخول" يضل يدور للأبد بدون أي رسالة، فيحس المستخدم إن الزر "ما يستجيب".
function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS)),
  ]);
}

const POPUP_UNAVAILABLE_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/operation-not-allowed",
]);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const ctaFieldsReady = email.trim().length > 0 && password.length > 0;
  const { trackRef: ctaTrackRef, btnRef: ctaBtnRef, offsetX: ctaOffsetX, fleeing: ctaFleeing } = useRunawayButton(ctaFieldsReady);

  function afterLogin(user) {
    if (user.email === ADMIN_EMAIL) {
      window.location.hash = "admin";
    } else {
      window.location.hash = "dashboard";
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) { afterLogin(result.user); return; }
        // بعض متصفحات الجوال (سامسونج إنترنت خصوصًا) تفقد حالة الدخول عبر جوجل بعد
        // التحويل، فترجع الصفحة بدون نتيجة ولا أي رسالة. لو كان فيه محاولة معلّقة
        // فعلاً (العلامة اللي نحطها قبل التحويل)، نوضح السبب بدل السكوت.
        if (sessionStorage.getItem("monah_google_signin_pending")) {
          sessionStorage.removeItem("monah_google_signin_pending");
          setError("تعذر إكمال الدخول بحساب جوجل على هذا المتصفح. جرّبي «بريدك الإلكتروني وكلمة المرور» بدلها.");
        }
      } catch (err) {
        sessionStorage.removeItem("monah_google_signin_pending");
        setError("تعذّر الدخول بحساب جوجل الآن. حاول مرة ثانية.");
      }
    })();
  }, []);

  // النافذة المنبثقة (popup) لدخول جوجل أوثق من التحويل الكامل (redirect) — ما
  // تعتمد على حفظ حالة الدخول عبر تحميل صفحة جديدة. نجرب النافذة المنبثقة أولًا،
  // ونرجع للتحويل الكامل فقط لو المتصفح يمنعها فعليًا (متصفحات داخل تطبيقات زي
  // واتساب مثلًا).
  async function handleGoogleSignIn() {
    setError("");
    setResetMsg("");
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      afterLogin(cred.user);
      return;
    } catch (popupError) {
      if (popupError.code === "auth/popup-closed-by-user" || popupError.code === "auth/cancelled-popup-request") {
        setGoogleLoading(false);
        return;
      }
      if (!POPUP_UNAVAILABLE_CODES.has(popupError.code)) {
        setError("تعذّر الدخول بحساب جوجل الآن. حاول مرة ثانية.");
        setGoogleLoading(false);
        return;
      }
    }
    try {
      sessionStorage.setItem("monah_google_signin_pending", "1");
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err) {
      sessionStorage.removeItem("monah_google_signin_pending");
      setError("تعذّر الدخول بحساب جوجل الآن. حاول مرة ثانية.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResetMsg("");
    setLoading(true);
    try {
      const cred = await withTimeout(signInWithEmailAndPassword(auth, email, password), "تعذر تسجيل الدخول الآن. تأكد من اتصالك بالإنترنت وحاول مرة ثانية.");
      afterLogin(cred.user);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("ما فيه حساب بهذا البريد. تأكد من الإيميل أو أنشئ حساب جديد.");
      } else if (err.code === "auth/wrong-password") {
        setError("كلمة المرور غير صحيحة. تقدر تضغط \"نسيت كلمة المرور؟\" تحت.");
      } else if (err.code === "auth/invalid-credential") {
        setError("البريد أو كلمة المرور غير صحيحة. تأكد منهما، أو اضغط \"نسيت كلمة المرور؟\" تحت.");
      } else if (!err.code) {
        setError(err.message || "تعذر تسجيل الدخول الآن. حاول مرة ثانية.");
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

        <button type="button" className="auth-google" onClick={handleGoogleSignIn} disabled={googleLoading}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9A8.75 8.75 0 0017.64 9.2z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.55-1.84.87-3.06.87-2.36 0-4.36-1.6-5.07-3.75H.9v2.35A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 013.64 9c0-.58.1-1.15.29-1.68V4.97H.9A9 9 0 000 9c0 1.45.35 2.83.9 4.03l3.03-2.35z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.9 4.97l3.03 2.35C4.64 5.18 6.64 3.58 9 3.58z"/></svg>
          {googleLoading ? "جاري الدخول..." : "متابعة بحساب جوجل"}
        </button>
        <div className="auth-divider">أو</div>

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
          <div className="auth-cta-track" ref={ctaTrackRef}>
            <button
              ref={ctaBtnRef}
              className={"auth-btn" + (ctaFleeing ? " fleeing" : "") + (ctaFieldsReady ? " ready" : "")}
              type="submit"
              disabled={loading}
              style={{ "--cta-offset": `${ctaOffsetX}px` }}
            >
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </div>
          <div className={"auth-cta-hint" + (ctaFieldsReady ? " ready" : "")}>
            {ctaFieldsReady ? "جاهز، اضغط للدخول." : "عبّي البريد وكلمة المرور أولًا."}
          </div>
        </form>

        <div className="auth-switch">
          ما عندك حساب؟ <a href="#start-store">افتح متجرك الحين</a>
        </div>
      </div>
    </div>
  );
}
