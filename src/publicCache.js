// ذاكرة بسيطة للصفحات العامة: المتجر ومنتجاته ينحفظون أول ما ينقرون،
// فلما الزبون يفتح منتج ويرجع للمتجر (أو العكس) يطلع كل شي على طول بدون انتظار،
// والصفحة تحدّث البيانات من وراه بهدوء.
const stores = new Map();
const products = new Map();

export function rememberStore(keys, entry) {
  for (const key of keys) if (key) stores.set(String(key), entry);
  for (const product of entry.products || []) {
    products.set(product.id, { product, store: entry.store, siblings: entry.products });
  }
}

export const recallStore = (key) => stores.get(String(key || "")) || null;
export const recallProduct = (id) => products.get(String(id || "")) || null;

export function rememberProduct(product, store) {
  const old = products.get(product.id);
  products.set(product.id, { product, store, siblings: old?.siblings || [] });
}
