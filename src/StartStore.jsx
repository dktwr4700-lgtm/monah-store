import React, { useState, useEffect } from "react";
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import useRunawayButton from "./useRunawayButton.js";
import { ADD_ON_CATALOG, BASE_MONTHLY_PRICE, PRO_MONTHLY_PRICE, BASE_PRODUCT_LIMIT, PRO_PRODUCT_LIMIT } from "./subscriptionCatalog.js";
import { useLang, LangToggle } from "./i18n.jsx";

const CTA_WIDTH = 168;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const STORE_TYPES = {
  ar: { books: "كتب رقمية", videos: "فيديوهات ودورات", codes: "أكواد وتراخيص", files: "ملفات وقوالب" },
  en: { books: "Digital books", videos: "Videos & courses", codes: "Codes & licenses", files: "Files & templates" },
};

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
  .invite-lang{display:block;margin:0 auto 12px;border:1px solid #E4E0D3;background:#fff;color:#625F55;border-radius:100px;padding:6px 12px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}
  .invite-divider{display:flex;align-items:center;gap:10px;color:#B0AC9C;font-size:11px;margin-bottom:16px}
  .invite-divider::before,.invite-divider::after{content:"";flex:1;height:1px;background:#E4E0D3}
  .invite-page button{transition:transform 100ms ease-out}.invite-page button:active{transform:scale(.96)}
  .invite-cta-track{display:flex;justify-content:center;padding:2px 0}
  .invite-cta-track .invite-btn{width:${CTA_WIDTH}px;transform:translateX(var(--cta-offset,0px));transition:transform 320ms cubic-bezier(.22,1,.36,1)}
  .invite-cta-track .invite-btn:active{transform:translateX(var(--cta-offset,0px)) scale(.96)}
  .invite-cta-track .invite-btn.fleeing{transition:transform 190ms cubic-bezier(.3,1.4,.6,1)}
  .invite-cta-track .invite-btn.ready{background:#163F2E;box-shadow:0 0 0 3px rgba(55,114,75,.18)}
  .invite-cta-hint{text-align:center;font-size:11px;color:#8A8677;margin-top:9px}
  .invite-cta-hint.ready{color:#37724B;font-weight:700}
  @media (prefers-reduced-motion: reduce){.invite-cta-track .invite-btn,.invite-cta-track .invite-btn.fleeing{transform:none!important;transition:background 200ms ease}}
`;

const REQUEST_TIMEOUT_MS = 8000;

const ST_T = {
  ar: {
    connectionError: "تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة ثانية.",
    genericError: "تعذر تنفيذ العملية الآن.",
    googleAuthError: "تعذر إكمال الدخول بحساب جوجل على هذا المتصفح. جرّبي «بريدك الإلكتروني وكلمة المرور» بدلها.",
    googleRedirectError: "تعذر إكمال تسجيل الدخول عبر جوجل.",
    writeStoreName: "اكتب اسم متجرك.",
    weakPasswordLength: "اختر كلمة مرور من 6 أحرف أو أكثر.",
    createAccountTimeout: "تعذر إنشاء الحساب الآن. تأكد من اتصالك بالإنترنت وحاول مرة ثانية.",
    loginTimeout: "تعذر تسجيل الدخول الآن. تأكد من اتصالك بالإنترنت وحاول مرة ثانية.",
    weakPassword: "كلمة المرور ضعيفة، اختر كلمة أطول.",
    invalidEmail: "اكتب بريدك الإلكتروني بشكل صحيح.",
    accountExists: "هذا البريد عنده حساب بالفعل وكلمة المرور غير صحيحة. لو نسيت كلمة المرور، سجّل الدخول من صفحة \"تسجيل الدخول\" واضغط \"نسيت كلمة المرور؟\"، أو استخدم بريدًا مختلفًا.",
    createAccountError: "تعذر إنشاء الحساب الآن.",
    writeStoreNameFirst: "اكتب اسم متجرك أولًا.",
    googleCreateError: "تعذر إنشاء الحساب عبر جوجل الآن.",
    couponApplied: (amount) => `تم تطبيق خصم ${amount} ر.ع ✓`,
    invalidCoupon: "كود الخصم غير صحيح.",
    couponCheckError: "تعذر التحقق من الكود الآن.",
    paymentStartError: "تعذر بدء الدفع الآن.",
    brand: "مُونة",
    formTitle: "افتح متجرك الرقمي الآن",
    formText: "اكتب بيانات متجرك وبريدك. الاشتراك 5 ر.ع شهريًا.",
    storeNameLabel: "اسم المتجر", storeNamePlaceholder: "مثال: متجر هند للتصاميم",
    whatDoYouSell: "ماذا تبيع؟",
    creating: "جاري الإنشاء...", continueWithGoogle: "متابعة بحساب جوجل",
    orWithEmail: "أو بالبريد وكلمة المرور",
    emailLabel: "بريدك الإلكتروني", choosePassword: "اختر كلمة المرور",
    continueBtn: "متابعة",
    readyContinue: "جاهز، اضغط للمتابعة.", oneFieldLeft: "بقي حقل وحد.", fillFirst: "عبّي البريد وكلمة المرور أولًا.",
    haveStoreLogin: "عندك متجر بالفعل؟ سجّل الدخول",
    activateStore: "فعّل متجرك",
    subscriptionIntro: (price) => `اشتراك متجرك الأساسي ${price} ر.ع شهريًا. تقدر تضيف إضافات اختيارية الآن أو لاحقًا من لوحة التاجر.`,
    choosePlan: "اختر باقتك",
    basicPlanOption: (price, limit) => `الأساسية — ${price} ر.ع شهريًا — حتى ${limit} منتج`,
    proPlanOption: (price, limit) => `برو — ${price} ر.ع شهريًا — حتى ${limit} منتج`,
    optionalAddOns: "إضافات اختيارية (تقدر تتخطاها الآن)",
    perMonth: "ر.ع/شهريًا",
    couponLabel: "كود خصم (اختياري)", couponPlaceholder: "اكتب الكود هنا", checking: "...", check: "تحقق",
    monthlyTotal: "المجموع الشهري:",
    redirectingToPayment: "جاري التحويل لصفحة الدفع...",
    payWithCard: (total) => `ادفع ${total} ر.ع بالبطاقة`,
  },
  en: {
    connectionError: "Couldn't connect to the server. Make sure you're online and try again.",
    genericError: "Couldn't complete the operation right now.",
    googleAuthError: "Couldn't complete Google sign-in on this browser. Try your email and password instead.",
    googleRedirectError: "Couldn't complete sign-in with Google.",
    writeStoreName: "Enter your store name.",
    weakPasswordLength: "Choose a password of 6 characters or more.",
    createAccountTimeout: "Couldn't create the account right now. Make sure you're online and try again.",
    loginTimeout: "Couldn't log in right now. Make sure you're online and try again.",
    weakPassword: "Weak password — choose a longer one.",
    invalidEmail: "Enter a valid email.",
    accountExists: "This email already has an account and the password is incorrect. If you forgot your password, log in from the \"Log in\" page and click \"Forgot password?\", or use a different email.",
    createAccountError: "Couldn't create the account right now.",
    writeStoreNameFirst: "Enter your store name first.",
    googleCreateError: "Couldn't create the account with Google right now.",
    couponApplied: (amount) => `${amount} OMR discount applied ✓`,
    invalidCoupon: "Invalid discount code.",
    couponCheckError: "Couldn't check the code right now.",
    paymentStartError: "Couldn't start the payment right now.",
    brand: "Monah",
    formTitle: "Open your digital store now",
    formText: "Enter your store details and email. Subscription is 5 OMR/month.",
    storeNameLabel: "Store name", storeNamePlaceholder: "e.g. Hind's Design Store",
    whatDoYouSell: "What do you sell?",
    creating: "Creating...", continueWithGoogle: "Continue with Google",
    orWithEmail: "Or with email and password",
    emailLabel: "Your email", choosePassword: "Choose a password",
    continueBtn: "Continue",
    readyContinue: "Ready, click to continue.", oneFieldLeft: "One field left.", fillFirst: "Fill in your email and password first.",
    haveStoreLogin: "Already have a store? Log in",
    activateStore: "Activate your store",
    subscriptionIntro: (price) => `Your base store subscription is ${price} OMR/month. You can add optional add-ons now or later from the seller dashboard.`,
    choosePlan: "Choose your plan",
    basicPlanOption: (price, limit) => `Basic — ${price} OMR/month — up to ${limit} products`,
    proPlanOption: (price, limit) => `Pro — ${price} OMR/month — up to ${limit} products`,
    optionalAddOns: "Optional add-ons (you can skip these for now)",
    perMonth: "OMR/month",
    couponLabel: "Discount code (optional)", couponPlaceholder: "Enter the code here", checking: "...", check: "Check",
    monthlyTotal: "Monthly total:",
    redirectingToPayment: "Redirecting to the payment page...",
    payWithCard: (total) => `Pay ${total} OMR by card`,
  },
};

// بعض متصفحات الجوال تعلّق الاتصال بصمت (لا ينجح ولا يفشل) — بدون هذي المهلة،
// زر "متابعة" يضل يدور للأبد بدون أي رسالة، فيحس المستخدم إن الزر "ما يستجيب".
function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)),
  ]);
}

async function signupRequest(action, payload, idToken = "", t) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch("/api/merchant-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
  } catch (fetchError) {
    throw new Error(t.connectionError);
  } finally {
    clearTimeout(timeoutId);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t.genericError);
  return data;
}

export default function StartStore() {
  const [lang, setLang] = useLang();
  const t = ST_T[lang];
  const [step, setStep] = useState("form");
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState("files");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [couponCode, setCouponCode] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");

  const emailReady = EMAIL_PATTERN.test(email.trim());
  const passwordReady = password.length >= 6;
  const ctaFieldsReady = emailReady && passwordReady;
  const { trackRef: ctaTrackRef, btnRef: ctaBtnRef, offsetX: ctaOffsetX, fleeing: ctaFleeing } = useRunawayButton(ctaFieldsReady || step !== "form");

  // متصفحات الجوال (خصوصًا داخل تطبيقات زي واتساب) كثير تمنع نافذة تسجيل الدخول المنبثقة
  // (popup) لجوجل، فنستخدم تحويل صفحة كامل (redirect) بدلها — يحتاج حفظ بيانات المتجر
  // مؤقتًا لأن الصفحة تعيد تحميل نفسها بعد رجوعها من جوجل.
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) {
          // بعض متصفحات الجوال (خصوصًا سامسونج إنترنت) أحيانًا تفقد حالة الدخول عبر
          // جوجل بعد التحويل، فترجع الصفحة بدون نتيجة ولا أي رسالة — كنا نسكت هنا
          // فيحس المستخدم إن الزر "رجّعه لنفس الصفحة" بدون سبب. لو كان فيه محاولة
          // دخول بجوجل معلّقة فعلاً، نوضح السبب بدل السكوت.
          if (sessionStorage.getItem("monah_pending_store_name") !== null) {
            sessionStorage.removeItem("monah_pending_store_name");
            sessionStorage.removeItem("monah_pending_store_type");
            setError(t.googleAuthError);
          }
          return;
        }
        setBusy(true);
        const savedStoreName = sessionStorage.getItem("monah_pending_store_name") || "";
        const savedStoreType = sessionStorage.getItem("monah_pending_store_type") || "files";
        sessionStorage.removeItem("monah_pending_store_name");
        sessionStorage.removeItem("monah_pending_store_type");
        const idToken = await result.user.getIdToken(true);
        await signupRequest("register", { storeName: savedStoreName.trim(), storeType: savedStoreType }, idToken, t);
        setStoreName(savedStoreName);
        setStoreType(savedStoreType);
        setStep("payment");
      } catch (redirectError) {
        await signOut(auth).catch(() => {});
        setError(redirectError.message || t.googleRedirectError);
      }
      setBusy(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // عداد بسيط لزيارات صفحة التسجيل يستخدمه الأدمن لمعرفة نسبة التحويل — مرة
  // وحدة بس بكل جلسة متصفح، بدون ما يعطّل الصفحة لو فشل الطلب.
  useEffect(() => {
    if (sessionStorage.getItem("monah_start_visit_tracked")) return;
    sessionStorage.setItem("monah_start_visit_tracked", "1");
    fetch("/api/track-start-visit", { method: "POST" }).catch(() => {});
  }, []);

  async function submitForm(event) {
    event.preventDefault();
    setError("");
    if (storeName.trim().length < 2) return setError(t.writeStoreName);
    if (password.length < 6) return setError(t.weakPasswordLength);
    setBusy(true);
    try {
      let credential;
      try {
        credential = await withTimeout(createUserWithEmailAndPassword(auth, email, password), t.createAccountTimeout);
      } catch (createError) {
        if (createError.code !== "auth/email-already-in-use") throw createError;
        credential = await withTimeout(signInWithEmailAndPassword(auth, email, password), t.loginTimeout);
      }
      const idToken = await credential.user.getIdToken(true);
      await signupRequest("register", { storeName: storeName.trim(), storeType }, idToken, t);
      setStep("payment");
    } catch (submitError) {
      await signOut(auth).catch(() => {});
      if (submitError.code === "auth/weak-password") setError(t.weakPassword);
      else if (submitError.code === "auth/invalid-email") setError(t.invalidEmail);
      else if (submitError.code === "auth/wrong-password" || submitError.code === "auth/invalid-credential") setError(t.accountExists);
      else setError(submitError.message || t.createAccountError);
    }
    setBusy(false);
  }

  // النافذة المنبثقة (popup) لدخول جوجل أوثق من التحويل الكامل (redirect) — ما تعتمد
  // على حفظ حالة الدخول عبر تحميل صفحة جديدة، وهذا بالضبط اللي كان يفشل بصمت على
  // بعض متصفحات الجوال (سامسونج إنترنت). نجرب النافذة المنبثقة أولًا، ونرجع للتحويل
  // الكامل فقط لو المتصفح يمنعها فعليًا (متصفحات داخل تطبيقات زي واتساب مثلًا).
  const POPUP_UNAVAILABLE_CODES = new Set([
    "auth/popup-blocked",
    "auth/operation-not-supported-in-this-environment",
    "auth/operation-not-allowed",
  ]);

  async function submitWithGoogle() {
    setError("");
    if (storeName.trim().length < 2) return setError(t.writeStoreNameFirst);
    setBusy(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credential.user.getIdToken(true);
      await signupRequest("register", { storeName: storeName.trim(), storeType }, idToken, t);
      setStep("payment");
      setBusy(false);
      return;
    } catch (popupError) {
      if (popupError.code === "auth/popup-closed-by-user" || popupError.code === "auth/cancelled-popup-request") {
        setBusy(false);
        return;
      }
      if (!POPUP_UNAVAILABLE_CODES.has(popupError.code)) {
        await signOut(auth).catch(() => {});
        setError(popupError.message || t.googleCreateError);
        setBusy(false);
        return;
      }
    }
    try {
      sessionStorage.setItem("monah_pending_store_name", storeName.trim());
      sessionStorage.setItem("monah_pending_store_type", storeType);
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (submitError) {
      setError(submitError.message || t.createAccountError);
      setBusy(false);
    }
  }

  function toggleAddOn(key) {
    setSelectedAddOns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  const addOnsTotal = selectedAddOns.reduce((sum, key) => sum + (ADD_ON_CATALOG.find((item) => item.key === key)?.price || 0), 0);
  const planPrice = selectedPlan === "pro" ? PRO_MONTHLY_PRICE : BASE_MONTHLY_PRICE;
  const paymentTotal = Math.max(0.1, planPrice + addOnsTotal - couponDiscount);

  async function checkCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setCouponMessage("");
    setCouponChecking(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const data = await signupRequest("check_signup_coupon", { code }, idToken, t);
      if (data.valid) {
        setCouponDiscount(Number(data.discountAmount) || 0);
        setCouponMessage(t.couponApplied(Number(data.discountAmount).toFixed(2)));
      } else {
        setCouponDiscount(0);
        setCouponMessage(data.reason || t.invalidCoupon);
      }
    } catch (requestError) {
      setCouponDiscount(0);
      setCouponMessage(requestError.message || t.couponCheckError);
    }
    setCouponChecking(false);
  }

  async function payByCard() {
    setError("");
    setBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const data = await signupRequest("create_card_charge", { addOns: selectedAddOns, plan: selectedPlan, couponCode: couponCode.trim() }, idToken, t);
      if (data.activated) {
        window.location.hash = "dashboard";
        return;
      }
      window.location.assign(data.url);
    } catch (requestError) {
      setError(requestError.message || t.paymentStartError);
      setBusy(false);
    }
  }

  return (
    <div className="invite-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <main className="invite-card">
        <LangToggle lang={lang} onChange={setLang} className="invite-lang" />
        <a className="invite-brand" href="#" style={{ display: "block", textDecoration: "none", color: "inherit" }}>{t.brand}</a>

        {step === "form" && <>
          <div className="invite-title">{t.formTitle}</div>
          <p className="invite-text">{t.formText}</p>
          {error && <div className="invite-message error">{error}</div>}
          <div className="invite-field"><label>{t.storeNameLabel}</label><input value={storeName} onChange={(event) => setStoreName(event.target.value)} placeholder={t.storeNamePlaceholder} required /></div>
          <div className="invite-field"><label>{t.whatDoYouSell}</label><select value={storeType} onChange={(event) => setStoreType(event.target.value)}>{Object.entries(STORE_TYPES[lang]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>

          <button type="button" className="invite-google" onClick={submitWithGoogle} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9A8.75 8.75 0 0017.64 9.2z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.55-1.84.87-3.06.87-2.36 0-4.36-1.6-5.07-3.75H.9v2.35A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 013.64 9c0-.58.1-1.15.29-1.68V4.97H.9A9 9 0 000 9c0 1.45.35 2.83.9 4.03l3.03-2.35z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.9 4.97l3.03 2.35C4.64 5.18 6.64 3.58 9 3.58z"/></svg>
            {busy ? t.creating : t.continueWithGoogle}
          </button>
          <div className="invite-divider">{t.orWithEmail}</div>

          <form onSubmit={submitForm}>
            <div className="invite-field"><label>{t.emailLabel}</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
            <div className="invite-field"><label>{t.choosePassword}</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
            <div className="invite-cta-track" ref={ctaTrackRef}>
              <button
                ref={ctaBtnRef}
                className={"invite-btn" + (ctaFleeing ? " fleeing" : "") + (ctaFieldsReady ? " ready" : "")}
                type="submit"
                disabled={busy}
                style={{ "--cta-offset": `${ctaOffsetX}px` }}
              >
                {busy ? t.creating : t.continueBtn}
              </button>
            </div>
            <div className={"invite-cta-hint" + (ctaFieldsReady ? " ready" : "")}>
              {ctaFieldsReady
                ? t.readyContinue
                : emailReady || passwordReady
                  ? t.oneFieldLeft
                  : t.fillFirst}
            </div>
          </form>
          <a className="invite-back" href="#login">{t.haveStoreLogin}</a>
        </>}

        {step === "payment" && <>
          <div className="invite-title">{t.activateStore}</div>
          {error && <div className="invite-message error">{error}</div>}
          <p className="invite-text">{t.subscriptionIntro(BASE_MONTHLY_PRICE.toFixed(2))}</p>
          <div className="invite-field">
            <label>{t.choosePlan}</label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, cursor: "pointer", fontWeight: 400 }}>
              <input type="radio" name="plan" checked={selectedPlan === "basic"} onChange={() => setSelectedPlan("basic")} style={{ marginTop: 3, width: "auto", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, lineHeight: 1.7 }}>{t.basicPlanOption(BASE_MONTHLY_PRICE.toFixed(2), BASE_PRODUCT_LIMIT)}</span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontWeight: 400 }}>
              <input type="radio" name="plan" checked={selectedPlan === "pro"} onChange={() => setSelectedPlan("pro")} style={{ marginTop: 3, width: "auto", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, lineHeight: 1.7 }}>{t.proPlanOption(PRO_MONTHLY_PRICE.toFixed(2), PRO_PRODUCT_LIMIT)}</span>
            </label>
          </div>
          <div className="invite-field">
            <label>{t.optionalAddOns}</label>
            {ADD_ON_CATALOG.filter((item) => item.key !== "digitalSelling").map((item) => (
              <label key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, cursor: "pointer", fontWeight: 400 }}>
                <input type="checkbox" checked={selectedAddOns.includes(item.key)} onChange={() => toggleAddOn(item.key)} style={{ marginTop: 3, width: "auto", flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.7, flex: 1, minWidth: 0 }}>
                  <b>{lang === "en" ? item.titleEn : item.title}</b> — <span style={{ color: "#625F55" }}>+{item.price.toFixed(2)} {t.perMonth}</span>
                  <br /><span style={{ color: "#8A8677" }}>{lang === "en" ? item.descEn : item.desc}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="invite-field">
            <label>{t.couponLabel}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={couponCode}
                onChange={(event) => { setCouponCode(event.target.value); setCouponMessage(""); setCouponDiscount(0); }}
                placeholder={t.couponPlaceholder}
                style={{ flex: 1, direction: "ltr", textAlign: "right" }}
              />
              <button type="button" className="invite-btn" style={{ width: "auto", padding: "0 16px" }} onClick={checkCoupon} disabled={couponChecking || !couponCode.trim()}>
                {couponChecking ? t.checking : t.check}
              </button>
            </div>
            {couponMessage && <div style={{ fontSize: 11.5, marginTop: 6, color: couponDiscount > 0 ? "#37724B" : "#A34839", fontWeight: 700 }}>{couponMessage}</div>}
          </div>
          <div className="invite-message" style={{ background: "#F7F7F2", color: "#16233F", fontWeight: 700, textAlign: "center" }}>{t.monthlyTotal} {paymentTotal.toFixed(2)} {lang === "ar" ? "ر.ع" : "OMR"}</div>
          <button className="invite-btn" type="button" onClick={payByCard} disabled={busy}>{busy ? t.redirectingToPayment : t.payWithCard(paymentTotal.toFixed(2))}</button>
        </>}
      </main>
    </div>
  );
}
