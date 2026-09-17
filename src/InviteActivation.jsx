import React, { useEffect, useState } from "react";
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import useRunawayButton from "./useRunawayButton.js";
import { useLang, LangToggle } from "./i18n.jsx";

const CTA_WIDTH = 190;

const STORE_TYPE_LABELS = {
  ar: { books: "كتب رقمية", videos: "فيديوهات ودورات", codes: "أكواد وتراخيص", files: "ملفات وقوالب" },
  en: { books: "Digital books", videos: "Videos & courses", codes: "Codes & licenses", files: "Files & templates" },
};

const styles = `
  .invite-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FFFFFF;padding:20px;font-family:'Cairo',sans-serif;color:#16233F}
  .invite-card{width:100%;max-width:400px;background:#fff;border:1px solid #E4E0D3;border-radius:20px;padding:28px 24px;box-shadow:0 16px 34px rgba(22,35,63,.07)}
  .invite-lang{display:block;margin:0 auto 12px;border:1px solid #E4E0D3;background:#fff;color:#403D35;border-radius:100px;padding:6px 12px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}
  .invite-brand{font-family:'Almarai',sans-serif;font-size:19px;font-weight:800;text-align:center;margin-bottom:8px}.invite-title{font-family:'Almarai',sans-serif;font-size:17px;font-weight:800;text-align:center;margin-bottom:8px}.invite-text{font-size:12.5px;line-height:1.85;color:#403D35;text-align:center;margin:0 0 18px}.invite-summary{background:#F7F7F2;border:1px solid #EDEAE0;border-radius:13px;padding:13px;margin-bottom:16px}.invite-summary b{display:block;font-size:14px}.invite-summary span{display:block;color:#403D35;font-size:11.5px;margin-top:4px}.invite-field{margin-bottom:14px}.invite-field label{display:block;font-size:12px;font-weight:800;color:#403D35;margin-bottom:6px}.invite-field input{box-sizing:border-box;width:100%;padding:12px 13px;border:1px solid #E4E0D3;border-radius:10px;background:#FBFAF7;font:13px 'Cairo',sans-serif}.invite-btn{width:100%;border:0;border-radius:100px;padding:13px;background:#16233F;color:#fff;font:700 13.5px 'Cairo',sans-serif;cursor:pointer}.invite-btn:disabled{opacity:.6}.invite-message{border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.7;margin-bottom:14px}.invite-message.error{background:#F6E9E5;color:#A34839}.invite-message.loading{background:#F3EBDD;color:#8A5B18}.invite-back{display:block;text-align:center;margin-top:16px;font-size:12px;font-weight:800;color:#16233F;text-decoration:none}.invite-page button{transition:transform 100ms ease-out}.invite-page button:active{transform:scale(.96)}
  .invite-cta-track{display:flex;justify-content:center;padding:2px 0}
  .invite-cta-track .invite-btn{width:${CTA_WIDTH}px;transform:translateX(var(--cta-offset,0px));transition:transform 320ms cubic-bezier(.22,1,.36,1)}
  .invite-cta-track .invite-btn:active{transform:translateX(var(--cta-offset,0px)) scale(.96)}
  .invite-cta-track .invite-btn.fleeing{transition:transform 190ms cubic-bezier(.3,1.4,.6,1)}
  .invite-cta-track .invite-btn.ready{background:#163F2E;box-shadow:0 0 0 3px rgba(55,114,75,.18)}
  .invite-cta-hint{text-align:center;font-size:11px;color:#5A5648;margin-top:9px}
  .invite-cta-hint.ready{color:#37724B;font-weight:700}
  @media (prefers-reduced-motion: reduce){.invite-cta-track .invite-btn,.invite-cta-track .invite-btn.fleeing{transform:none!important;transition:background 200ms ease}}
`;

const INV_T = {
  ar: {
    openInviteError: "تعذر فتح الدعوة الآن.",
    checkingInvite: "جاري التحقق من رابط الدعوة...",
    inviteUnavailable: "رابط الدعوة غير متاح", login: "تسجيل الدخول",
    activateTitle: "فعّل متجرك الخاص",
    activateText: "هذه دعوة خاصة لك. اختر كلمة المرور بنفسك ثم أكمل ترتيب متجرك.",
    genericProducts: "منتجات رقمية",
    invalidEmail: "اكتب بريدك الإلكتروني بشكل صحيح.", weakPasswordLength: "اختر كلمة مرور من 6 أحرف أو أكثر.",
    email: "بريدك الإلكتروني", choosePassword: "اختر كلمة المرور",
    activating: "جاري تفعيل المتجر...", activate: "تفعيل متجري",
    ready: "جاهز، اضغط للتفعيل.", fillFirst: "عبّي البريد وكلمة المرور أولًا.",
    weakPassword: "كلمة المرور ضعيفة، اختر كلمة أطول.",
    inviteInvalidEmail: "تعذر تفعيل الدعوة. اطلب رابطًا جديدًا من صاحب المنصة.",
    activationError: "تعذر تفعيل الدعوة الآن.",
  },
  en: {
    openInviteError: "Couldn't open the invite right now.",
    checkingInvite: "Verifying the invite link...",
    inviteUnavailable: "This invite link isn't available", login: "Log in",
    activateTitle: "Activate your own store",
    activateText: "This is a private invite for you. Choose your own password, then finish setting up your store.",
    genericProducts: "Digital products",
    invalidEmail: "Enter a valid email.", weakPasswordLength: "Choose a password of 6 characters or more.",
    email: "Your email", choosePassword: "Choose a password",
    activating: "Activating your store...", activate: "Activate my store",
    ready: "Ready, click to activate.", fillFirst: "Fill in your email and password first.",
    weakPassword: "Weak password — choose a longer one.",
    inviteInvalidEmail: "Couldn't activate the invite. Ask the platform owner for a new link.",
    activationError: "Couldn't activate the invite right now.",
  },
};

async function inviteRequest(action, payload, idToken = "", t) {
  const response = await fetch("/api/merchant-invites", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t.openInviteError);
  return data;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function InviteActivation({ token }) {
  const [lang, setLang] = useLang();
  const t = INV_T[lang];
  const [status, setStatus] = useState("loading");
  const [invite, setInvite] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ctaFieldsReady = validEmail(email) && password.length >= 6;
  const { trackRef: ctaTrackRef, btnRef: ctaBtnRef, offsetX: ctaOffsetX, fleeing: ctaFleeing } = useRunawayButton(ctaFieldsReady);

  useEffect(() => {
    let cancelled = false;
    inviteRequest("inspect", { token }, "", t)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function activate(event) {
    event.preventDefault();
    setError("");
    if (!validEmail(email)) return setError(t.invalidEmail);
    if (password.length < 6) return setError(t.weakPasswordLength);
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
      await inviteRequest("activate", { token }, idToken, t);
      window.location.hash = "dashboard";
    } catch (activationError) {
      await signOut(auth).catch(() => {});
      if (activationError.code === "auth/weak-password") setError(t.weakPassword);
      else if (activationError.code === "auth/invalid-email") setError(t.inviteInvalidEmail);
      else setError(activationError.message || t.activationError);
    }
    setSaving(false);
  }

  return (
    <div className="invite-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <main className="invite-card">
        <LangToggle lang={lang} onChange={setLang} className="invite-lang" />
        <div className="invite-brand">مُونة</div>
        {status === "loading" && <div className="invite-message loading">{t.checkingInvite}</div>}
        {status === "invalid" && <><div className="invite-title">{t.inviteUnavailable}</div><div className="invite-message error">{error}</div><a className="invite-back" href="#login">{t.login}</a></>}
        {status === "ready" && invite && <>
          <div className="invite-title">{t.activateTitle}</div>
          <p className="invite-text">{t.activateText}</p>
          <div className="invite-summary"><b>{invite.storeName}</b><span>{STORE_TYPE_LABELS[lang][invite.storeType] || t.genericProducts}</span></div>
          {error && <div className="invite-message error">{error}</div>}
          <form onSubmit={activate}>
            <div className="invite-field"><label>{t.email}</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
            <div className="invite-field"><label>{t.choosePassword}</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
            <div className="invite-cta-track" ref={ctaTrackRef}>
              <button
                ref={ctaBtnRef}
                className={"invite-btn" + (ctaFleeing ? " fleeing" : "") + (ctaFieldsReady ? " ready" : "")}
                type="submit"
                disabled={saving}
                style={{ "--cta-offset": `${ctaOffsetX}px` }}
              >
                {saving ? t.activating : t.activate}
              </button>
            </div>
            <div className={"invite-cta-hint" + (ctaFieldsReady ? " ready" : "")}>
              {ctaFieldsReady ? t.ready : t.fillFirst}
            </div>
          </form>
        </>}
      </main>
    </div>
  );
}
