import React, { useEffect, useMemo, useState } from "react";
import { db } from "./firebase.js";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

/*
  MONAH CUSTOMER STORE PAGE — DROP-IN REPLACEMENT
  هذا الملف يحافظ على نفس تكامل Firestore في الكود السابق:
  stores/{sellerId} أو البحث باستخدام stores.slug
  products where ownerId == sellerId
*/

const styles = `
  .mc-page{min-height:100vh;background:#FFFFFF;color:#0B0B0C;font-family:'Cairo',sans-serif;}
  .mc-page *{box-sizing:border-box}.mc-mono{font-family:'JetBrains Mono',monospace}.mc-display{font-family:'Almarai',sans-serif}
  .mc-top{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid #EDEAE0}
  .mc-top-in{max-width:860px;margin:auto;padding:13px 20px;display:flex;align-items:center;justify-content:space-between}.mc-wordmark{display:flex;align-items:center;gap:9px;font-weight:800;font-size:13px}.mc-monah-mark{width:31px;height:31px;display:flex;align-items:center;justify-content:center;background:#0B0B0C;border-radius:10px;color:#fff;font-family:'Almarai',sans-serif;font-weight:900}.mc-gold-dot{width:5px;height:5px;border-radius:50%;background:#B9832F;display:inline-block}.mc-top-actions{display:flex;gap:8px}.mc-icon-btn{width:34px;height:34px;border-radius:100px;border:1px solid #EDEAE0;background:#fff;color:#0B0B0C;display:flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer}
  .mc-shell{max-width:860px;margin:auto;padding:22px 20px 38px}.mc-store{background:#0B0B0C;color:#fff;border-radius:22px;padding:23px 22px;position:relative;overflow:hidden;box-shadow:0 18px 35px rgba(11,11,12,.14)}.mc-store:before{content:"";position:absolute;width:210px;height:210px;border:1px solid rgba(255,255,255,.11);border-radius:50%;top:-100px;left:-60px}.mc-store:after{content:"";position:absolute;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.05);bottom:-72px;right:-35px}.mc-store-content{position:relative;z-index:1;display:flex;align-items:center;gap:14px}.mc-logo{width:60px;height:60px;border-radius:18px;overflow:hidden;background:#fff;color:#0B0B0C;display:flex;align-items:center;justify-content:center;font-size:22px;font-family:'Almarai',sans-serif;font-weight:800;box-shadow:0 9px 18px rgba(0,0,0,.16);flex-shrink:0}.mc-logo img{width:100%;height:100%;object-fit:cover}.mc-store-name{font-family:'Almarai',sans-serif;font-size:18px;font-weight:800}.mc-store-tagline{font-size:11.5px;color:rgba(255,255,255,.72);margin-top:6px;line-height:1.7}.mc-store-socials{display:flex;gap:7px;margin-top:11px}.mc-social{width:31px;height:31px;border-radius:10px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;text-decoration:none}.mc-social svg{width:15px;height:15px}
  .mc-assurances{display:grid;grid-template-columns:repeat(3,1fr);background:#fff;border:1px solid #EDEAE0;border-radius:16px;margin:-10px 15px 0;position:relative;z-index:2;box-shadow:0 11px 20px rgba(11,11,12,.06)}.mc-assurance{padding:11px 6px;text-align:center;border-inline-start:1px solid #EDEAE0}.mc-assurance:first-child{border-inline-start:0}.mc-assurance strong{font-size:12px;display:block}.mc-assurance span{font-size:9.5px;color:#8A8677;display:block;margin-top:3px}
  .mc-catalog-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:30px 0 12px}.mc-eyebrow{font-size:10px;color:#B9832F;font-weight:800}.mc-title{font-size:17px;font-family:'Almarai',sans-serif;font-weight:800;margin:5px 0 0;line-height:1.7}.mc-count{font-size:11px;color:#8A8677;white-space:nowrap}.mc-tools{display:flex;gap:8px;padding:12px 0;border-top:1px solid #EDEAE0;border-bottom:1px solid #EDEAE0;align-items:center}.mc-search{position:relative;flex:1}.mc-search input{width:100%;border:1px solid #EDEAE0;border-radius:100px;background:#FBFAF7;color:#0B0B0C;padding:10px 35px 10px 11px;font-family:inherit;font-size:12px;outline:none}.mc-search svg{position:absolute;right:11px;top:50%;transform:translateY(-50%)}.mc-filter{border:1px solid #EDEAE0;background:#fff;color:#0B0B0C;border-radius:100px;padding:10px 11px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer}.mc-categories{display:flex;gap:7px;overflow-x:auto;padding:13px 0 3px}.mc-category{border:1px solid #EDEAE0;background:#fff;color:#5B6B60;border-radius:100px;padding:8px 13px;font-family:inherit;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer}.mc-category.active{background:#0B0B0C;color:#fff;border-color:#0B0B0C}
  .mc-section{margin-top:25px}.mc-section-head{display:flex;align-items:center;gap:9px;margin-bottom:10px}.mc-section-title{font-family:'Almarai',sans-serif;font-size:13px;font-weight:800}.mc-section-line{height:1px;background:#EDEAE0;flex:1}.mc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.mc-product{display:block;background:#fff;border:1px solid #EDEAE0;border-radius:16px;padding:10px;text-decoration:none;color:#0B0B0C;box-shadow:0 9px 22px rgba(11,11,12,.04);transition:transform .18s ease,box-shadow .18s ease}.mc-product:hover{transform:translateY(-2px);box-shadow:0 15px 28px rgba(11,11,12,.09)}.mc-product-img{height:128px;border-radius:12px;background:#EAF0EB;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center}.mc-product-img img{width:100%;height:100%;object-fit:cover}.mc-file-card{width:55%;height:72%;background:#FFFDF8;box-shadow:0 10px 18px rgba(11,11,12,.12);border-radius:10px;transform:rotate(-6deg);padding:10px}.mc-file-card b{display:block;width:65%;height:6px;border-radius:8px;background:#B9832F}.mc-file-card i{display:block;height:4px;background:#EDEAE0;border-radius:7px;margin-top:8px}.mc-file-card i:nth-child(3){width:80%}.mc-file-card i:nth-child(4){width:92%}.mc-file-card em{display:block;height:19px;background:#EAF0EB;border-radius:6px;margin-top:11px}.mc-product-type{font-size:9.5px;color:#B9832F;font-weight:800;margin-top:10px}.mc-product-name{font-size:12px;font-weight:800;margin-top:3px;line-height:1.6}.mc-product-desc{font-size:10px;color:#8A8677;line-height:1.6;margin-top:2px;min-height:31px}.mc-product-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.mc-price{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:800}.mc-view{font-size:10px;color:#0B0B0C;font-weight:800;background:#F1F0EA;border-radius:100px;padding:6px 8px}
  .mc-empty{background:#fff;border:1px solid #EDEAE0;border-radius:20px;padding:35px 22px;text-align:center;margin-top:18px}.mc-empty-icon{width:54px;height:54px;border-radius:16px;background:#EAF0EB;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}.mc-empty-title{font-family:'Almarai',sans-serif;font-size:14px;font-weight:800}.mc-empty-sub{font-size:12px;color:#8A8677;line-height:1.9;max-width:320px;margin:8px auto 18px}.mc-empty-cta{display:inline-flex;gap:7px;align-items:center;border-radius:100px;padding:11px 16px;background:#0B0B0C;color:#fff;text-decoration:none;font-size:12px;font-weight:800}
  .mc-reassurance{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #EDEAE0;background:#fff;border-radius:16px;overflow:hidden;margin-top:28px}.mc-reassurance div{padding:12px 9px;border-inline-start:1px solid #EDEAE0}.mc-reassurance div:first-child{border-inline-start:0}.mc-reassurance b{font-size:10.5px;display:block}.mc-reassurance span{display:block;font-size:9.5px;color:#8A8677;line-height:1.55;margin-top:4px}.mc-footer{text-align:center;color:#B0AC9C;font-size:10px;margin-top:27px}.mc-footer b{color:#0B0B0C}
  @media(min-width:680px){.mc-shell{padding-top:34px}.mc-store{padding:30px}.mc-logo{width:72px;height:72px}.mc-store-name{font-size:21px}.mc-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.mc-product-img{height:150px}.mc-product{padding:12px}.mc-reassurance{max-width:680px}.mc-assurances{margin-left:25px;margin-right:25px}.mc-tools{max-width:520px}.mc-catalog-head{margin-top:38px}}

  .mc-page button{ transition:transform 100ms ease-out; }
  .mc-page button:active{ transform:scale(0.96); }
`;

function SearchIcon(){return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="#7B7A74" strokeWidth="1.7"/><path d="M16 16l4 4" stroke="#7B7A74" strokeWidth="1.7" strokeLinecap="round"/></svg>}
function CartIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2 11h10l2-8H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1" fill="currentColor"/><circle cx="17" cy="20" r="1" fill="currentColor"/></svg>}
function WhatsappIcon(){return <svg viewBox="0 0 24 24" fill="none"><path d="M17 14c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/><path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" stroke="#fff" strokeWidth="1.3"/></svg>}
function InstagramIcon(){return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="1.6"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.6"/><circle cx="17.5" cy="6.5" r="1.1" fill="#fff"/></svg>}
function FileIcon(){return <svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#4B6152" strokeWidth="1.6"/><path d="M14 2v6h6M9 15l2 2 4-4" stroke="#4B6152" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}

function safeSocialUrl(value, type){
  if(!value) return "";
  const raw = String(value).trim();
  if(type === "whatsapp") return `https://wa.me/${raw.replace(/\D/g, "")}`;
  if(/^https?:\/\//i.test(raw)) return raw;
  return `https://instagram.com/${raw.replace(/^@/, "")}`;
}

export default function StorePage({ sellerId }) {
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");

  useEffect(() => {
    async function fetchData() {
      try {
        let storeData = null;
        let resolvedOwnerId = sellerId;
        const directSnap = await getDoc(doc(db, "stores", sellerId));
        if (directSnap.exists()) {
          storeData = directSnap.data();
        } else {
          const storeQuery = query(collection(db, "stores"), where("slug", "==", sellerId));
          const storeSnap = await getDocs(storeQuery);
          if (!storeSnap.empty) {
            storeData = storeSnap.docs[0].data();
            resolvedOwnerId = storeSnap.docs[0].id;
          }
        }
        setStore(storeData);
        const productQuery = query(collection(db, "products"), where("ownerId", "==", resolvedOwnerId));
        const productSnap = await getDocs(productQuery);
        const allProducts = productSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
        // نستبعد المنتجات اللي البائع أخفاها من لوحة تحكمه — ما تظهر للعميل هنا
        setProducts(allProducts.filter((product) => !product.hidden));
      } catch (error) {
        console.error("Unable to load store", error);
      } finally {
        setStatus("ready");
      }
    }
    fetchData();
  }, [sellerId]);

  const brandColor = store?.color || "#0B0B0C";
  const brandName = store?.name || "متجر رقمي";
  const tagline = store?.tagline || "منتجات رقمية جاهزة للتحميل";
  const logoUrl = store?.logoUrl;
  const whatsappUrl = safeSocialUrl(store?.whatsapp, "whatsapp");
  const instagramUrl = safeSocialUrl(store?.instagram, "instagram");
  const categories = useMemo(() => ["الكل", ...Array.from(new Set(products.map((product) => product.category || "عام")))], [products]);
  const shownProducts = useMemo(() => products.filter((product) => {
    const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    const matchSearch = text.includes(search.trim().toLowerCase());
    const matchCategory = activeCategory === "الكل" || (product.category || "عام") === activeCategory;
    return matchSearch && matchCategory;
  }), [products, search, activeCategory]);

  return (
    <div className="mc-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <header className="mc-top">
        <div className="mc-top-in">
          <div className="mc-wordmark"><span className="mc-monah-mark">م</span><span>{brandName}</span><span className="mc-gold-dot" /></div>
          <div className="mc-top-actions">
            <a className="mc-icon-btn" href="#products" title="المنتجات"><SearchIcon /></a>
            <a className="mc-icon-btn" href="#products" title="المشتريات"><CartIcon /></a>
          </div>
        </div>
      </header>

      <main className="mc-shell">
        <section className="mc-store" style={{ background: brandColor }}>
          <div className="mc-store-content">
            <div className="mc-logo">{logoUrl ? <img src={logoUrl} alt={`شعار ${brandName}`} /> : brandName.charAt(0)}</div>
            <div>
              <div className="mc-store-name">{brandName}</div>
              <div className="mc-store-tagline">{tagline}</div>
              {(whatsappUrl || instagramUrl) && <div className="mc-store-socials">
                {whatsappUrl && <a className="mc-social" href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="واتساب"><WhatsappIcon /></a>}
                {instagramUrl && <a className="mc-social" href={instagramUrl} target="_blank" rel="noopener noreferrer" title="إنستغرام"><InstagramIcon /></a>}
              </div>}
            </div>
          </div>
        </section>

        <section className="mc-assurances" aria-label="مزايا الشراء">
          <div className="mc-assurance"><strong className="mc-mono">{products.length}</strong><span>منتجات رقمية</span></div>
          <div className="mc-assurance"><strong>فوري</strong><span>تسليم بعد الدفع</span></div>
          <div className="mc-assurance"><strong>واضح</strong><span>بلا رسوم إضافية</span></div>
        </section>

        {status === "loading" ? <div className="mc-empty"><div className="mc-empty-icon"><FileIcon /></div><div className="mc-empty-title">نجهّز لك المتجر</div><div className="mc-empty-sub">لحظات ونظهر المنتجات المتاحة.</div></div> : <>
          {products.length === 0 ? <section className="mc-empty">
            <div className="mc-empty-icon"><FileIcon /></div>
            <div className="mc-empty-title">أول مجموعة رقمية في الطريق.</div>
            <div className="mc-empty-sub">صاحب المتجر يجهّز منتجاته الآن. تابع المتجر أو راسله لمعرفة وقت نزول المنتجات الجديدة.</div>
            {whatsappUrl ? <a className="mc-empty-cta" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><WhatsappIcon /> راسل التاجر</a> : <span className="mc-empty-cta" style={{opacity:.55}}>المنتجات قريباً</span>}
          </section> : <>
            <section className="mc-catalog-head" id="products">
              <div><div className="mc-eyebrow"><span className="mc-gold-dot" /> منتجات المتجر</div><h1 className="mc-title">اختر المنتج وابدأ شغلك اليوم.</h1></div>
              <div className="mc-count">{shownProducts.length} متاح الآن</div>
            </section>
            <div className="mc-tools"><div className="mc-search"><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم المنتج" /></div><button className="mc-filter" onClick={() => setActiveCategory("الكل")}>الكل</button></div>
            <div className="mc-categories">{categories.map((category) => <button key={category} className={`mc-category ${activeCategory === category ? "active" : ""}`} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
            <section className="mc-section">
              {shownProducts.length ? <div className="mc-grid">{shownProducts.map((product) => <a className="mc-product" href={`#product/${product.id}`} key={product.id}>
                <div className="mc-product-img">{product.images?.[0] ? <img src={product.images[0]} alt={product.name || "منتج رقمي"} /> : <div className="mc-file-card"><b></b><i></i><i></i><i></i><em></em></div>}</div>
                <div className="mc-product-type"><span className="mc-gold-dot" /> {product.category || "منتج رقمي"}</div>
                <div className="mc-product-name">{product.name || "منتج رقمي"}</div>
                <div className="mc-product-desc">{product.description || "ملف رقمي جاهز للتحميل فور إتمام الدفع."}</div>
                <div className="mc-product-bottom"><span className="mc-price">{Number(product.price || 0).toFixed(2)} ر.ع</span><span className="mc-view">عرض المنتج</span></div>
              </a>)}</div> : <div className="mc-empty"><div className="mc-empty-title">ما وجدنا منتجاً بهذا الاسم.</div><div className="mc-empty-sub">جرّب كلمة مختلفة أو ارجع لكل المنتجات.</div><button className="mc-filter" onClick={() => {setSearch(""); setActiveCategory("الكل");}}>عرض الكل</button></div>}
            </section>
          </>}
        </>}

        <section className="mc-reassurance" aria-label="معلومات الشراء">
          <div><b>تسليم فوري</b><span>رابط المنتج يصل بعد الدفع.</span></div>
          <div><b>سعر واضح</b><span>بدون رسوم مفاجئة.</span></div>
          <div><b>دعم قبل الشراء</b><span>راسل التاجر إذا احتجت مساعدة.</span></div>
        </section>
        <footer className="mc-footer">متجر <b>{brandName}</b> · مدعوم عبر <b>مُونَة</b></footer>
      </main>
    </div>
  );
}
