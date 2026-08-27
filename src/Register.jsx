import React, { useState } from "react";
import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

const styles = `
  .auth-page{ min-height:100vh; display:flex; align-items:center; justify-content:center; background:#FFFFFF; padding:20px; font-family:'Cairo', sans-serif; }
  .auth-card{ width:100%; max-width:380px; background:#fff; border:1px solid #EDEAE0; border-radius:20px; padding:28px 24px; }
  .auth-brand{ font-family:'Almarai', sans-serif; font-weight:800; font-size:19px; color:#0B0B0C; text-align:center; margin-bottom:6px; }
  .auth-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:17px; text-align:center; margin-bottom:6px; color:#0B0B0C; }

  .auth-steps{ display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:22px; }
  .auth-step{ display:flex; align-items:center; gap:6px; }
  .auth-step-dot{ width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:700; font-family:'Cairo'; }
  .auth-step-dot.active{ background:#0B0B0C; color:#fff; }
  .auth-step-dot.pending{ background:#F1F0EA; color:#B0AC9C; }
  .auth-step-label{ font-size:9.5px; color:#8A8677; }
  .auth-step-line{ width:16px; height:1px; background:#EDEAE0; }

  .auth-field{ margin-bottom:14px; }
  .auth-field label{ display:block; font-size:12.5px; font-weight:700; margin-bottom:6px; color:#8A8677; }
  .auth-field input{ width:100%; padding:12px 14px; border:1px solid #EDEAE0; border-radius:10px; font-family:'Cairo'; font-size:13.5px; background:#FBFAF7; box-sizing:border-box; }
  .auth-btn{ width:100%; background:#0B0B0C; color:#fff; font-weight:700; font-size:14.5px; padding:13px; border:none; border-radius:100px; cursor:pointer; margin-top:6px; }
  .auth-btn:disabled{ opacity:.6; }
  .auth-error{ background:#F6E9E5; color:#B24C3A; font-size:12.5px; padding:10px 12px; border-radius:10px; margin-bottom:14px; }
  .auth-error a{ color:#B24C3A; font-weight:700; text-decoration:underline; }
  .auth-next-hint{ text-align:center; color:#8A8677; font-size:11px; line-height:1.8; margin-top:14px; }
  .auth-switch{ text-align:center; font-size:12.5px; color:#8A8677; margin-top:16px; }
  .auth-switch a{ color:#0B0B0C; font-weight:700; text-decoration:none; }
  .auth-draft{border:1px solid #DDE8DE;background:#F4F8F4;border-radius:13px;padding:12px;margin-bottom:16px}.auth-draft-kicker{font-size:10px;font-weight:800;color:#397049;margin-bottom:5px}.auth-draft-total{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:800;color:#14382B}.auth-draft-total span{font-family:'Cairo',sans-serif;font-size:10.5px;font-weight:400;color:#5F7667}.auth-draft-list{font-size:10.5px;color:#5F7667;line-height:1.8;margin-top:5px}.auth-draft-note{font-size:9.5px;color:#8A8677;line-height:1.7;margin-top:6px}

  .auth-page button{ transition:transform 100ms ease-out; }
  .auth-page button:active{ transform:scale(0.96); }
`;

const STEPS = [
  { n: "1", label: "اختياراتك" },
  { n: "2", label: "الحساب" },
  { n: "3", label: "المتجر" },
  { n: "4", label: "أول منتج" },
];

function readSubscriptionDraft() {
  try {
    const raw = window.sessionStorage.getItem("monah.subscriptionDraft");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Number.isFinite(parsed.monthlyTotal) ? parsed : null;
  } catch {
    return null;
  }
}

export default function Register() {
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft] = useState(readSubscriptionDraft);
  const draftSelections = Array.isArray(draft?.selections) ? draft.selections : [];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!storeName.trim()) return setError("اكتب اسم متجرك.");
    if (password.length < 6) return setError("كلمة المرور لازم تكون ٦ أحرف أو أكثر.");

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "sellers", cred.user.uid), {
        storeName: storeName.trim(),
        email,
        createdAt: new Date().toISOString(),
        plan: null,
      });
      await setDoc(doc(db, "stores", cred.user.uid), {
        ownerId: cred.user.uid,
        name: storeName.trim(),
        color: "#153A2C",
        tagline: "",
        whatsapp: "",
        instagram: "",
        slug: "",
        logoUrl: "",
        coverUrl: "",
        about: "",
        faqs: [],
        featureSelections: Object.fromEntries(draftSelections.map((feature) => [feature.key, true])),
        featureSelectionUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      window.sessionStorage.removeItem("monah.subscriptionDraft");
      window.location.hash = "dashboard";
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError(<>هذا البريد مسجّل من قبل. تبي <a href="#login">تسجّل دخولك</a> بدل كذا؟</>);
      } else if (err.code === "auth/invalid-email") {
        setError("البريد الإلكتروني غير صحيح، تأكد من كتابته صح.");
      } else if (err.code === "auth/weak-password") {
        setError("كلمة المرور ضعيفة، جرّب كلمة مرور أطول وأقوى.");
      } else {
        setError("صار خطأ غير متوقع، حاول مرة ثانية بعد شوي.");
      }
    }
    setLoading(false);
  }

  return (
    <div className="auth-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-brand">Monah</div>
        <div className="auth-title">إنشاء حساب بائع</div>

        <div className="auth-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="auth-step">
                <div className={"auth-step-dot " + (i === 1 ? "active" : "pending")}>{s.n}</div>
              </div>
              {i < STEPS.length - 1 && <div className="auth-step-line"></div>}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {draft && (
          <div className="auth-draft">
            <div className="auth-draft-kicker">اختياراتك المحفوظة</div>
            <div className="auth-draft-total">{Number(draft.monthlyTotal).toFixed(2)} <span>ر.ع / شهريًا</span></div>
            <div className="auth-draft-list">{draftSelections.length ? draftSelections.map((feature) => feature.title).join(" · ") : "متجر أساسي فقط"}</div>
            <div className="auth-draft-note">هذه مسودة فقط؛ لا يوجد دفع أو تحصيل حتى يجهز ربط ثواني ويُختبر.</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>اسم متجرك</label>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="مثال: متجر هند للتصاميم" />
          </div>
          <div className="auth-field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>

        <div className="auth-next-hint">
          بعد إنشاء الحساب: تظهر لك اختياراتك ← تضبط شكل متجرك ← ترفع أول منتج
        </div>

        <div className="auth-switch">
          عندك حساب؟ <a href="#login">سجّل دخولك</a>
        </div>
      </div>
    </div>
  );
}
