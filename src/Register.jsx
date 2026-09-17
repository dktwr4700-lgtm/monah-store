import React from "react";
import { useLang, LangToggle } from "./i18n.jsx";

const styles = `
  .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FFFFFF;padding:20px;font-family:'Cairo',sans-serif}.auth-card{width:100%;max-width:380px;background:#fff;border:1px solid #EDEAE0;border-radius:20px;padding:28px 24px;text-align:center}.auth-brand{font-family:'Almarai',sans-serif;font-weight:800;font-size:19px;color:#0B0B0C;margin-bottom:8px}.auth-title{font-family:'Almarai',sans-serif;font-weight:800;font-size:17px;color:#0B0B0C;margin-bottom:10px}.auth-text{font-size:12.5px;line-height:1.9;color:#403D35;margin:0 auto 18px;max-width:290px}.auth-btn{display:block;background:#0B0B0C;color:#fff;font-weight:700;font-size:13px;padding:12px;border-radius:100px;text-decoration:none}.auth-back{display:block;margin-top:14px;color:#3D4A66;font-size:12px;font-weight:700;text-decoration:none}.auth-lang{display:block;margin:0 auto 12px;border:1px solid #EDEAE0;background:#fff;color:#5A5648;border-radius:100px;padding:6px 12px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}
`;

const REG_T = {
  ar: {
    title: "التسجيل بدعوة خاصة",
    text: "تُفعَّل متاجر التجار عبر رابط دعوة خاص يرسله لك صاحب المنصة. افتح الرابط الذي وصلك وحدد كلمة مرورك بنفسك.",
    haveAccount: "عندي حساب، تسجيل الدخول", backToSite: "العودة للموقع",
  },
  en: {
    title: "Registration by private invite",
    text: "Seller stores are activated through a private invite link sent to you by the platform owner. Open the link you received and set your own password.",
    haveAccount: "I have an account, log in", backToSite: "Back to the site",
  },
};

export default function Register() {
  const [lang, setLang] = useLang();
  const t = REG_T[lang];
  return (
    <div className="auth-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <main className="auth-card">
        <LangToggle lang={lang} onChange={setLang} className="auth-lang" />
        <div className="auth-brand">مُونة</div>
        <div className="auth-title">{t.title}</div>
        <p className="auth-text">{t.text}</p>
        <a className="auth-btn" href="#login">{t.haveAccount}</a>
        <a className="auth-back" href="#">{t.backToSite}</a>
      </main>
    </div>
  );
}
