import React, { useState, useEffect } from "react";
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import useRunawayButton from "./useRunawayButton.js";
import { useLang, LangToggle } from "./i18n.jsx";

const LOGIN_T = {
  ar: {
    login: "تسجيل الدخول", loggingIn: "جاري الدخول...", continueWithGoogle: "متابعة بحساب جوجل", or: "أو",
    email: "البريد الإلكتروني", password: "كلمة المرور",
    sending: "جاري الإرسال...", forgotPassword: "نسيت كلمة المرور؟",
    ready: "جاهز، اضغط للدخول.", fillFirst: "عبّي البريد وكلمة المرور أولًا.",
    noAccount: "ما عندك حساب؟", openStore: "افتح متجرك الحين",
    googleTimeoutError: "تعذر إكمال الدخول بحساب جوجل على هذا المتصفح. جرّبي «بريدك الإلكتروني وكلمة المرور» بدلها.",
    googleGenericError: "تعذّر الدخول بحساب جوجل الآن. حاول مرة ثانية.",
    loginTimeoutError: "تعذر تسجيل الدخول الآن. تأكد من اتصالك بالإنترنت وحاول مرة ثانية.",
    userNotFound: "ما فيه حساب بهذا البريد. تأكد من الإيميل أو أنشئ حساب جديد.",
    wrongPassword: "كلمة المرور غير صحيحة. تقدر تضغط \"نسيت كلمة المرور؟\" تحت.",
    invalidCredential: "البريد أو كلمة المرور غير صحيحة. تأكد منهما، أو اضغط \"نسيت كلمة المرور؟\" تحت.",
    genericLoginError: "تعذر تسجيل الدخول الآن. حاول مرة ثانية.",
    wrongCredentials: "البريد أو كلمة المرور غير صحيحة.",
    enterEmailFirst: "اكتب بريدك الإلكتروني أول بخانة البريد فوق، وبعدين اضغط \"نسيت كلمة المرور؟\".",
    resetSent: "أرسلنا لك رابط تغيير كلمة المرور على بريدك. تأكد من صندوق الوارد (أو الرسائل غير المرغوبة).",
    resetFailed: "تعذّر إرسال رابط الاستعادة. تأكد إن البريد صحيح وحاول مرة ثانية.",
  },
  en: {
    login: "Log in", loggingIn: "Logging in...", continueWithGoogle: "Continue with Google", or: "or",
    email: "Email", password: "Password",
    sending: "Sending...", forgotPassword: "Forgot your password?",
    ready: "Ready, click to log in.", fillFirst: "Fill in your email and password first.",
    noAccount: "Don't have an account?", openStore: "Open your store now",
    googleTimeoutError: "Couldn't complete Google sign-in on this browser. Try your email and password instead.",
    googleGenericError: "Couldn't sign in with Google right now. Try again.",
    loginTimeoutError: "Couldn't log in right now. Check your internet connection and try again.",
    userNotFound: "No account with this email. Check the address, or create a new account.",
    wrongPassword: "Incorrect password. You can click \"Forgot your password?\" below.",
    invalidCredential: "Incorrect email or password. Double-check them, or click \"Forgot your password?\" below.",
    genericLoginError: "Couldn't log in right now. Try again.",
    wrongCredentials: "Incorrect email or password.",
    enterEmailFirst: "Enter your email in the field above first, then click \"Forgot your password?\".",
    resetSent: "We sent a password reset link to your email. Check your inbox (or spam folder).",
    resetFailed: "Couldn't send the reset link. Make sure the email is correct and try again.",
  },
};

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
  const [lang, setLang] = useLang();
  const t = LOGIN_T[lang];
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
          setError(t.googleTimeoutError);
        }
      } catch (err) {
        sessionStorage.removeItem("monah_google_signin_pending");
        setError(t.googleGenericError);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setError(t.googleGenericError);
        setGoogleLoading(false);
        return;
      }
    }
    try {
      sessionStorage.setItem("monah_google_signin_pending", "1");
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err) {
      sessionStorage.removeItem("monah_google_signin_pending");
      setError(t.googleGenericError);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResetMsg("");
    setLoading(true);
    try {
      const cred = await withTimeout(signInWithEmailAndPassword(auth, email, password), t.loginTimeoutError);
      afterLogin(cred.user);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError(t.userNotFound);
      } else if (err.code === "auth/wrong-password") {
        setError(t.wrongPassword);
      } else if (err.code === "auth/invalid-credential") {
        setError(t.invalidCredential);
      } else if (!err.code) {
        setError(err.message || t.genericLoginError);
      } else {
        setError(t.wrongCredentials);
      }
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    setError("");
    setResetMsg("");
    if (!email || !email.includes("@")) {
      setError(t.enterEmailFirst);
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg(t.resetSent);
    } catch (err) {
      setError(t.resetFailed);
    }
    setResetLoading(false);
  }

  return (
    <div className="auth-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <div className="auth-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <LangToggle lang={lang} onChange={setLang} className="auth-forgot" style={{ background: "none", border: "1px solid #EDEAE0", borderRadius: 100, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#8A8677" }} />
        </div>
        <a className="auth-brand" href="#" style={{ display: "block", textDecoration: "none" }}>Monah</a>
        <div className="auth-title">{t.login}</div>

        {error && <div className="auth-error">{error}</div>}
        {resetMsg && <div className="auth-success">{resetMsg}</div>}

        <button type="button" className="auth-google" onClick={handleGoogleSignIn} disabled={googleLoading}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9A8.75 8.75 0 0017.64 9.2z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.55-1.84.87-3.06.87-2.36 0-4.36-1.6-5.07-3.75H.9v2.35A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 013.64 9c0-.58.1-1.15.29-1.68V4.97H.9A9 9 0 000 9c0 1.45.35 2.83.9 4.03l3.03-2.35z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.9 4.97l3.03 2.35C4.64 5.18 6.64 3.58 9 3.58z"/></svg>
          {googleLoading ? t.loggingIn : t.continueWithGoogle}
        </button>
        <div className="auth-divider">{t.or}</div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>{t.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="auth-forgot">
            <button type="button" onClick={handleForgotPassword} disabled={resetLoading}>
              {resetLoading ? t.sending : t.forgotPassword}
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
              {loading ? t.loggingIn : t.login}
            </button>
          </div>
          <div className={"auth-cta-hint" + (ctaFieldsReady ? " ready" : "")}>
            {ctaFieldsReady ? t.ready : t.fillFirst}
          </div>
        </form>

        <div className="auth-switch">
          {t.noAccount} <a href="#start-store">{t.openStore}</a>
        </div>
      </div>
    </div>
  );
}
