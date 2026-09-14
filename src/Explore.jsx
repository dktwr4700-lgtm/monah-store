import React, { useEffect, useMemo, useState } from "react";
import { db } from "./firebase.js";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

/*
  صفحة تصفح مركزية تجمع منتجات كل تجار مونة بمكان واحد — قبلها ما كان فيه
  طريقة يكتشف فيها زائر متاجر/منتجات غير اللي وصله رابطها مباشرة، فكل متجر
  كان معزول عن البقية بدون أي احتكاك أو اكتشاف بينهم.
*/

const MAX_PRODUCTS = 90;

const styles = `
  .ex-page{--ex-brand:#163F2E;min-height:100vh;background:#F7F6F1;color:#112018;font-family:'Cairo',sans-serif}
  .ex-page *{box-sizing:border-box}
  .ex-top{position:sticky;top:0;z-index:20;background:rgba(247,246,241,.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(17,32,24,.08)}
  .ex-top-in{max-width:980px;margin:auto;padding:13px 20px;display:flex;align-items:center;justify-content:space-between}
  .ex-wordmark{display:flex;align-items:center;gap:9px;font-weight:800;font-size:13px;color:var(--ex-brand);text-decoration:none}
  .ex-mark{width:31px;height:31px;border-radius:10px;overflow:hidden;display:block}
  .ex-mark img{width:100%;height:100%;object-fit:cover}
  .ex-shell{max-width:980px;margin:auto;padding:24px 20px 50px}
  .ex-head{margin-bottom:18px}
  .ex-eyebrow{font-size:10px;color:#C28B3B;font-weight:800}
  .ex-title{font-family:'Almarai',sans-serif;font-size:22px;font-weight:800;margin:6px 0 8px;line-height:1.5}
  .ex-sub{font-size:12.5px;color:#748178;line-height:1.85;max-width:520px}
  .ex-tools{display:flex;gap:8px;padding:14px 0;border-top:1px solid rgba(17,32,24,.1);border-bottom:1px solid rgba(17,32,24,.1);align-items:center;margin-top:16px}
  .ex-search{position:relative;flex:1}
  .ex-search input{width:100%;border:1px solid rgba(17,32,24,.11);border-radius:100px;background:#fff;color:#112018;padding:11px 35px 11px 14px;font-family:inherit;font-size:12px;outline:none}
  .ex-search input:focus{border-color:var(--ex-brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--ex-brand) 12%,transparent)}
  .ex-search svg{position:absolute;right:12px;top:50%;transform:translateY(-50%)}
  .ex-categories{display:flex;gap:7px;overflow-x:auto;padding:13px 0 3px}
  .ex-category{border:1px solid rgba(17,32,24,.11);background:#fff;color:#5b6b60;border-radius:100px;padding:8px 13px;font-family:inherit;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer}
  .ex-category.active{background:var(--ex-brand);color:#fff;border-color:var(--ex-brand)}
  .ex-count{font-size:11px;color:#748178;margin:14px 2px}
  .ex-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .ex-product{display:block;background:#fff;border:1px solid rgba(17,32,24,.1);border-radius:18px;padding:10px;text-decoration:none;color:#112018;box-shadow:0 10px 24px rgba(11,11,12,.04);transition:transform .18s ease,box-shadow .18s ease}
  .ex-product:hover{transform:translateY(-3px);box-shadow:0 16px 30px rgba(11,11,12,.09)}
  .ex-product-img{height:132px;border-radius:13px;background:#EAF0EB;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center}
  .ex-product-img img{width:100%;height:100%;object-fit:cover}
  .ex-file-card{width:55%;height:72%;background:#FFFDF8;box-shadow:0 10px 18px rgba(11,11,12,.12);border-radius:10px;transform:rotate(-6deg);padding:10px}
  .ex-file-card b{display:block;width:65%;height:6px;border-radius:8px;background:#C28B3B}
  .ex-file-card i{display:block;height:4px;background:#EDEAE0;border-radius:7px;margin-top:8px}
  .ex-file-card i:nth-child(3){width:80%}.ex-file-card i:nth-child(4){width:92%}
  .ex-file-card em{display:block;height:19px;background:#EAF0EB;border-radius:6px;margin-top:11px}
  .ex-product-store{font-size:9.5px;color:#9C6D1F;font-weight:800;margin-top:10px;display:flex;align-items:center;gap:4px}
  .ex-store-dot{width:5px;height:5px;border-radius:50%;background:#D6A450;flex-shrink:0}
  .ex-product-name{font-size:12px;font-weight:800;margin-top:4px;line-height:1.6}
  .ex-product-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
  .ex-price{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:800;color:var(--ex-brand)}
  .ex-view{font-size:10px;color:var(--ex-brand);font-weight:800;background:color-mix(in srgb,var(--ex-brand) 9%,#fff);border-radius:100px;padding:6px 8px}
  .ex-empty{background:#fff;border:1px solid rgba(17,32,24,.1);border-radius:22px;padding:38px 22px;text-align:center;margin-top:18px}
  .ex-empty-title{font-family:'Almarai',sans-serif;font-size:14px;font-weight:800}
  .ex-empty-sub{font-size:12px;color:#748178;line-height:1.9;max-width:320px;margin:8px auto 0}
  .ex-loading{min-height:60vh;display:flex;align-items:center;justify-content:center;color:#748178;font-size:12.5px}
  @media(min-width:680px){.ex-shell{padding-top:36px}.ex-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.ex-product-img{height:158px}.ex-product{padding:12px}.ex-tools{max-width:540px}}
  .ex-page button{transition:transform 100ms ease-out}.ex-page button:active{transform:scale(.96)}
`;

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#748178" strokeWidth="2" /><path d="M20 20L16.65 16.65" stroke="#748178" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function createdAtMillis(product) {
  const value = product?.createdAt;
  if (value?.toMillis) return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

export default function Explore() {
  const [products, setProducts] = useState([]);
  const [storesById, setStoresById] = useState({});
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        // نفلتر hidden بس بالاستعلام (فهرس فردي متوفر تلقائيًا)، ونستثني
        // suspended من جهة العميل — تفاديًا لحاجة فهرس مركّب جديد يحتاج نشر يدوي.
        const [productSnap, storeSnap] = await Promise.all([
          getDocs(query(collection(db, "products"), where("hidden", "==", false), limit(MAX_PRODUCTS))),
          getDocs(collection(db, "stores")),
        ]);
        if (cancelled) return;
        const allProducts = productSnap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => !item.suspended);
        allProducts.sort((a, b) => Number(b.featured) - Number(a.featured) || createdAtMillis(b) - createdAtMillis(a));
        const stores = {};
        storeSnap.docs.forEach((item) => { stores[item.id] = item.data(); });
        setProducts(allProducts);
        setStoresById(stores);
        setStatus("ready");
      } catch (error) {
        console.error("Unable to load explore feed", error);
        if (!cancelled) setStatus("error");
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => ["الكل", ...Array.from(new Set(products.map((product) => product.category || "عام")))], [products]);
  const shownProducts = useMemo(() => products.filter((product) => {
    const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    const matchSearch = text.includes(search.trim().toLowerCase());
    const matchCategory = activeCategory === "الكل" || (product.category || "عام") === activeCategory;
    return matchSearch && matchCategory;
  }), [products, search, activeCategory]);

  return (
    <div className="ex-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <header className="ex-top">
        <div className="ex-top-in">
          <a className="ex-wordmark" href="#">
            <span className="ex-mark"><img src="/monah-mark-512.png" alt="" /></span>
            <span>مُونة</span>
          </a>
        </div>
      </header>

      <main className="ex-shell">
        <div className="ex-head">
          <div className="ex-eyebrow">تصفح مونة</div>
          <h1 className="ex-title">اكتشف منتجات من كل تجار مونة</h1>
          <p className="ex-sub">مكان واحد يجمع منتجات رقمية من متاجر مستقلة مختلفة — دوّر، قارن، وادخل مباشرة لصفحة أي منتج يعجبك.</p>
        </div>

        <div className="ex-tools">
          <div className="ex-search">
            <SearchIcon />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المنتج" />
          </div>
        </div>
        {categories.length > 1 && (
          <div className="ex-categories">
            {categories.map((category) => (
              <button key={category} className={`ex-category ${activeCategory === category ? "active" : ""}`} onClick={() => setActiveCategory(category)} type="button">
                {category}
              </button>
            ))}
          </div>
        )}

        {status === "loading" && <div className="ex-loading">جاري تجهيز المنتجات…</div>}

        {status !== "loading" && (
          shownProducts.length ? (
            <>
              <div className="ex-count">{shownProducts.length} منتج</div>
              <div className="ex-grid">
                {shownProducts.map((product) => {
                  const store = storesById[product.ownerId];
                  const storeName = store?.name || "متجر مونة";
                  return (
                    <a className="ex-product" href={`#product/${product.id}`} key={product.id}>
                      <div className="ex-product-img">
                        {product.images?.[0]
                          ? <img src={product.images[0]} alt={product.name || "منتج رقمي"} />
                          : <div className="ex-file-card"><b></b><i></i><i></i><i></i><em></em></div>}
                      </div>
                      <div className="ex-product-store"><span className="ex-store-dot" />{storeName}</div>
                      <div className="ex-product-name">{product.name || "منتج رقمي"}</div>
                      <div className="ex-product-bottom">
                        <span className="ex-price">{Number(product.price || 0).toFixed(2)} ر.ع</span>
                        <span className="ex-view">عرض المنتج</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="ex-empty">
              <div className="ex-empty-title">ما فيه منتجات تطابق بحثك</div>
              <p className="ex-empty-sub">جرب كلمة بحث مختلفة أو اختر "الكل" لعرض كل المنتجات المتاحة.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
