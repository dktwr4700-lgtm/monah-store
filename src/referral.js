// يحفظ رمز وكيل معمار لو الزائر جا من رابطه (?r=CODE)، عشان ينربط متجره فيه لما يسجّل.
const KEY = "monah_ref";
const REF = /^[A-Z0-9]{3,16}$/;
const norm = (v) => { const c = String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); return REF.test(c) ? c : ""; };

export function captureReferral() {
  try {
    const code = norm(new URLSearchParams(window.location.search).get("r"));
    if (code) window.localStorage.setItem(KEY, code);
  } catch {
    // المتصفح منع التخزين: عادي، الإحالة ما تنحسب بس
  }
}

export function storedReferral() {
  try {
    return norm(window.localStorage.getItem(KEY));
  } catch {
    return "";
  }
}
