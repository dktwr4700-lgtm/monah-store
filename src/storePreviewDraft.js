// المعاينة اللي جرّبها الزائر بالصفحة الرئيسية تنحفظ بمتصفحه، عشان تنتقل معه
// لصفحة التسجيل (اسم المتجر) ولوحة التاجر (منتجه الأول) بدون ما يعيد كتابتها.
const DRAFT_KEY = "monah_store_preview_draft";
const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function loadPreviewDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!draft || draft.v !== 1 || Date.now() - draft.createdAt > DRAFT_MAX_AGE_MS) return null;
    return draft;
  } catch {
    return null;
  }
}

export function savePreviewDraft(draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ v: 1, createdAt: Date.now(), ...draft }));
  } catch {
    // مساحة المتصفح ممتلئة أو التخزين محجوب — المعاينة تشتغل عادي بس ما تنتقل.
  }
}

export function clearPreviewDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // تجاهل
  }
}

export async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}
