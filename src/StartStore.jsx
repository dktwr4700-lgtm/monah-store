import React, { useState, useEffect } from "react";
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import useRunawayButton from "./useRunawayButton.js";
import { ADD_ON_CATALOG, BASE_MONTHLY_PRICE } from "./subscriptionCatalog.js";

const CTA_WIDTH = 168;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

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
  .invite-cta-track{display:flex;justify-content:center;padding:2px 0}
  .invite-cta-track .invite-btn{width:${CTA_WIDTH}px;transform:translateX(var(--cta-offset,0px));transition:transform 320ms cubic-bezier(.22,1,.36,1)}
  .invite-cta-track .invite-btn:active{transform:translateX(var(--cta-offset,0px)) scale(.96)}
  .invite-cta-track .invite-btn.fleeing{transition:transform 190ms cubic-bezier(.3,1.4,.6,1)}
  .invite-cta-track .invite-btn.ready{background:#163F2E;box-shadow:0 0 0 3px rgba(55,114,75,.18)}
  .invite-cta-hint{text-align:center;font-size:11px;color:#8A8677;margin-top:9px}
  .invite-cta-hint.ready{color:#37724B;font-weight:700}
  @media (prefers-reduced-motion: reduce){.invite-cta-track .invite-btn,.invite-cta-track .invite-btn.fleeing{transform:none!important;transition:background 200ms ease}}
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
  const [selectedAddOns, setSelectedAddOns] = useState([]);
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
        if (!result?.user) return;
        setBusy(true);
        const savedStoreName = sessionStorage.getItem("monah_pending_store_name") || "";
        const savedStoreType = sessionStorage.getItem("monah_pending_store_type") || "files";
        sessionStorage.removeItem("monah_pending_store_name");
        sessionStorage.removeItem("monah_pending_store_type");
        const idToken = await result.user.getIdToken(true);
        await signupRequest("register", { storeName: savedStoreName.trim(), storeType: savedStoreType }, idToken);
        setStoreName(savedStoreName);
        setStoreType(savedStoreType);
        setStep("payment");
      } catch (redirectError) {
        await signOut(auth).catch(() => {});
        setError(redirectError.message || "تعذر إكمال تسجيل الدخول عبر جوجل.");
      }
      setBusy(false);
    })();
  }, []);

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
      sessionStorage.setItem("monah_pending_store_name", storeName.trim());
      sessionStorage.setItem("monah_pending_store_type", storeType);
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (submitError) {
      setError(submitError.message || "تعذر إنشاء الحساب الآن.");
      setBusy(false);
    }
  }

  function toggleAddOn(key) {
    setSelectedAddOns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  const addOnsTotal = selectedAddOns.reduce((sum, key) => sum + (ADD_ON_CATALOG.find((item) => item.key === key)?.price || 0), 0);
  const paymentTotal = Math.max(0.1, BASE_MONTHLY_PRICE + addOnsTotal - couponDiscount);

  async function checkCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setCouponMessage("");
    setCouponChecking(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const data = await signupRequest("check_signup_coupon", { code }, idToken);
      if (data.valid) {
        setCouponDiscount(Number(data.discountAmount) || 0);
        setCouponMessage(`تم تطبيق خصم ${Number(data.discountAmount).toFixed(2)} ر.ع ✓`);
      } else {
        setCouponDiscount(0);
        setCouponMessage(data.reason || "كود الخصم غير صحيح.");
      }
    } catch (requestError) {
      setCouponDiscount(0);
      setCouponMessage(requestError.message || "تعذر التحقق من الكود الآن.");
    }
    setCouponChecking(false);
  }

  async function payByCard() {
    setError("");
    setBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const data = await signupRequest("create_card_charge", { addOns: selectedAddOns, couponCode: couponCode.trim() }, idToken);
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
          <p className="invite-text">اكتب بيانات متجرك وبريدك. الاشتراك 5 ر.ع شهريًا.</p>
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
            <div className="invite-cta-track" ref={ctaTrackRef}>
              <button
                ref={ctaBtnRef}
                className={"invite-btn" + (ctaFleeing ? " fleeing" : "") + (ctaFieldsReady ? " ready" : "")}
                type="submit"
                disabled={busy}
                style={{ "--cta-offset": `${ctaOffsetX}px` }}
              >
                {busy ? "جاري الإنشاء..." : "متابعة"}
              </button>
            </div>
            <div className={"invite-cta-hint" + (ctaFieldsReady ? " ready" : "")}>
              {ctaFieldsReady
                ? "جاهز، اضغط للمتابعة."
                : emailReady || passwordReady
                  ? "بقي حقل وحد."
                  : "عبّي البريد وكلمة المرور أولًا."}
            </div>
          </form>
          <a className="invite-back" href="#login">عندك متجر بالفعل؟ سجّل الدخول</a>
        </>}

        {step === "payment" && <>
          <div className="invite-title">فعّل اشتراكك</div>
          <p className="invite-text">اشتراك متجرك الأساسي {BASE_MONTHLY_PRICE.toFixed(2)} ر.ع شهريًا. تقدر تضيف إضافات اختيارية الآن أو لاحقًا من لوحة التاجر.</p>
          {error && <div className="invite-message error">{error}</div>}
          <div className="invite-field">
            <label>إضافات اختيارية (تقدر تتخطاها الآن)</label>
            {ADD_ON_CATALOG.filter((item) => item.key !== "digitalSelling").map((item) => (
              <label key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, cursor: "pointer", fontWeight: 400 }}>
                <input type="checkbox" checked={selectedAddOns.includes(item.key)} onChange={() => toggleAddOn(item.key)} style={{ marginTop: 3, width: "auto", flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.7, flex: 1, minWidth: 0 }}>
                  <b>{item.title}</b> — <span style={{ color: "#625F55" }}>+{item.price.toFixed(2)} ر.ع/شهريًا</span>
                  <br /><span style={{ color: "#8A8677" }}>{item.desc}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="invite-field">
            <label>كود خصم (اختياري)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={couponCode}
                onChange={(event) => { setCouponCode(event.target.value); setCouponMessage(""); setCouponDiscount(0); }}
                placeholder="اكتب الكود هنا"
                style={{ flex: 1, direction: "ltr", textAlign: "right" }}
              />
              <button type="button" className="invite-btn" style={{ width: "auto", padding: "0 16px" }} onClick={checkCoupon} disabled={couponChecking || !couponCode.trim()}>
                {couponChecking ? "..." : "تحقق"}
              </button>
            </div>
            {couponMessage && <div style={{ fontSize: 11.5, marginTop: 6, color: couponDiscount > 0 ? "#37724B" : "#A34839", fontWeight: 700 }}>{couponMessage}</div>}
          </div>
          <div className="invite-message" style={{ background: "#F7F7F2", color: "#16233F", fontWeight: 700, textAlign: "center" }}>المجموع الشهري: {paymentTotal.toFixed(2)} ر.ع</div>
          <button className="invite-btn" type="button" onClick={payByCard} disabled={busy}>{busy ? "جاري التحويل لصفحة الدفع..." : `ادفع ${paymentTotal.toFixed(2)} ر.ع بالبطاقة`}</button>
        </>}
      </main>
    </div>
  );
}
