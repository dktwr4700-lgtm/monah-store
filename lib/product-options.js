// خيارات المنتج (مثل كميات أو مستويات بأسعار مختلفة) وسؤال يجاوبه المشتري قبل الدفع.
// نفس الدوال تشتغل في اللوحة (تنظيف قبل الحفظ) وفي السيرفر (السعر الحقيقي يُحسب من هنا وقت الطلب).

export const MAX_OPTIONS = 12;
export const MAX_OPTION_NAME = 40;
export const MAX_ASK_LABEL = 60;
export const MAX_ANSWER = 120;

// الأرقام العربية (٢٫٥) من كيبورد الجوال نحولها لأرقام عادية (2.5)
export const toNumber = (v) => Number(String(v ?? "").trim().replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫،,]/g, "."));
const round3 = (n) => Math.round(toNumber(n) * 1000) / 1000;
const text = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// يرجع قائمة الخيارات الصالحة بس. أقل من خيارين = المنتج بسعر واحد (قائمة فاضية).
export function cleanOptions(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const name = text(item?.name, MAX_OPTION_NAME);
    const price = round3(item?.price);
    if (!name || !(price > 0) || price > 100000) continue;
    let id = /^o\d{1,4}$/.test(String(item?.id || "")) ? String(item.id) : "";
    if (!id || seen.has(id)) { let n = out.length + 1; while (seen.has(`o${n}`)) n += 1; id = `o${n}`; }
    seen.add(id);
    out.push({ id, name, price });
    if (out.length >= MAX_OPTIONS) break;
  }
  return out.length >= 2 ? out : [];
}

// السعر اللي يطلع في المتجر: أرخص خيار ("من ...")
export const startingPrice = (options) => (options.length ? Math.min(...options.map((o) => o.price)) : 0);

export const hasOptions = (product) => Array.isArray(product?.options) && product.options.length >= 2;

export function pickOption(product, optionId) {
  if (!hasOptions(product)) return null;
  return product.options.find((o) => o.id === String(optionId || "")) || null;
}

export const cleanAskLabel = (v) => text(v, MAX_ASK_LABEL);
export const cleanAnswer = (v) => text(v, MAX_ANSWER);

// الأنواع اللي تنباع: ملف ينزل، كود من المخزون، أو خدمة يسلمها التاجر بنفسه (مثل الشحن)
export const SELLABLE_TYPES = ["file", "code", "service"];
