import React, { useEffect, useState } from "react";

// تبديل اللغة للواجهات اللي يشوفها العميل (الرئيسية، المتجر، المنتج، الطلب...) —
// يحفظ التفضيل بمتصفح الزائر نفسه فيرجع نفس اللغة لو انتقل بين صفحات الموقع.
const STORAGE_KEY = "monah_lang";

export function useLang() {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });

  function setLang(next) {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // خصوصية متصفح تمنع localStorage — نكمل بدون حفظ، ما يوقف الميزة.
    }
  }

  return [lang, setLang];
}

export function toggleClassNames() {
  return "i18n-toggle";
}

export function LangToggle({ lang, onChange, className, style }) {
  return (
    <button
      type="button"
      className={className || "i18n-toggle"}
      style={style}
      onClick={() => onChange(lang === "ar" ? "en" : "ar")}
      title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}
