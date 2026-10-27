// ذاكرة الصفحات العامة: المتجر ومنتجاته ينحفظون أول ما ينقرون (في الذاكرة وفي جوال الزبون)،
// فلما الزبون يفتح منتج ويرجع للمتجر أو يرجع للمتجر بكرا يطلع كل شي على طول،
// والصفحة تحدّث البيانات من وراه بهدوء.
const stores = new Map();
const products = new Map();
const STORAGE_KEY = "monah_public_cache_v1";
const MAX_SAVED_STORES = 5;

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    for (const entry of Array.isArray(saved) ? saved : []) index(entry);
  } catch {
    // الحفظ في الجوال اختياري: لو ممنوع نكمل بالذاكرة بس
  }
}

function persist(entry) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter((x) => x?.ownerId !== entry.ownerId);
    saved.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, MAX_SAVED_STORES)));
  } catch {
    // مساحة الجوال ممتلئة أو التخزين ممنوع: عادي
  }
}

function index(entry) {
  if (!entry?.ownerId || !entry.store) return;
  for (const key of entry.keys || []) if (key) stores.set(String(key), entry);
  for (const product of entry.products || []) {
    products.set(product.id, { product, store: entry.store, siblings: entry.products });
  }
}

loadSaved();

export function rememberStore(keys, { store, ownerId, products: list }) {
  const entry = { keys: [...new Set([...keys, ownerId, store?.slug].filter(Boolean).map(String))], store, ownerId, products: list || [] };
  index(entry);
  persist(entry);
}

export const recallStore = (key) => stores.get(String(key || "")) || null;
export const recallProduct = (id) => products.get(String(id || "")) || null;

export function rememberProduct(product, store) {
  const old = products.get(product.id);
  products.set(product.id, { product, store, siblings: old?.siblings || [] });
}

// طلب واحد لسيرفرنا يرجع المتجر ومنتجاته (أو المنتج ومتجره). أسرع من الاتصال بقاعدة البيانات
export async function fetchPublic(params) {
  const res = await fetch(`/api/link-preview?type=data&${new URLSearchParams(params)}`);
  const data = await res.json().catch(() => null);
  if (!data || (data.status === "error")) throw new Error("public data failed");
  return data;
}
