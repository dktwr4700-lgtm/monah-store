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
  .mc-page{--mc-brand:#163F2E;--mc-brand-deep:#102B20;min-height:100vh;background:#F7F6F1;color:#112018;font-family:'Cairo',sans-serif;}
  .mc-page *{box-sizing:border-box}.mc-mono{font-family:'JetBrains Mono',monospace}.mc-display{font-family:'Almarai',sans-serif}
  .mc-top{position:sticky;top:0;z-index:20;background:rgba(247,246,241,.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(17,32,24,.08)}
  .mc-top-in{max-width:980px;margin:auto;padding:13px 20px;display:flex;align-items:center;justify-content:space-between}.mc-wordmark{display:flex;align-items:center;gap:9px;font-weight:800;font-size:13px;color:var(--mc-brand)}.mc-store-mark{width:31px;height:31px;display:flex;align-items:center;justify-content:center;background:var(--mc-brand);border-radius:10px;color:#fff;font-family:'Almarai',sans-serif;font-weight:900}.mc-gold-dot{width:5px;height:5px;border-radius:50%;background:#D6A450;display:inline-block}.mc-top-actions{display:flex;gap:8px}.mc-icon-btn{width:36px;height:36px;border-radius:100px;border:1px solid rgba(17,32,24,.12);background:#fff;color:var(--mc-brand);display:flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer;font-family:inherit}
  .mc-shell{max-width:980px;margin:auto;padding:24px 20px 42px}.mc-store{background:var(--mc-brand);color:#fff;border-radius:26px;padding:28px 26px;position:relative;overflow:hidden;box-shadow:0 20px 40px color-mix(in srgb,var(--mc-brand) 24%,transparent);isolation:isolate}.mc-store-cover{position:absolute;inset:0;opacity:.22;width:100%;height:100%;object-fit:cover;z-index:-1}.mc-store:before{content:"";position:absolute;width:250px;height:250px;border:1px solid rgba(255,255,255,.15);border-radius:50%;top:-125px;left:-70px}.mc-store:after{content:"";position:absolute;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.07);bottom:-85px;right:-40px}.mc-store-content{position:relative;z-index:1;display:flex;align-items:center;gap:15px}.mc-logo{width:66px;height:66px;border-radius:20px;overflow:hidden;background:#fff;color:var(--mc-brand);display:flex;align-items:center;justify-content:center;font-size:24px;font-family:'Almarai',sans-serif;font-weight:800;box-shadow:0 10px 20px rgba(0,0,0,.18);flex-shrink:0}.mc-logo img{width:100%;height:100%;object-fit:cover}.mc-store-name{font-family:'Almarai',sans-serif;font-size:20px;font-weight:800}.mc-store-tagline{font-size:12px;color:rgba(255,255,255,.8);margin-top:6px;line-height:1.8;max-width:480px}.mc-store-meta{font-size:10px;letter-spacing:.04em;color:rgba(255,255,255,.65);font-weight:800;margin-top:7px}.mc-store-socials{display:flex;gap:7px;margin-top:11px}.mc-social{width:31px;height:31px;border-radius:10px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;text-decoration:none}.mc-social svg{width:15px;height:15px}
  .mc-assurances{display:grid;grid-template-columns:repeat(3,1fr);background:#fff;border:1px solid rgba(17,32,24,.1);border-radius:17px;margin:-12px 18px 0;position:relative;z-index:2;box-shadow:0 12px 24px rgba(11,11,12,.06)}.mc-assurance{padding:12px 6px;text-align:center;border-inline-start:1px solid rgba(17,32,24,.09)}.mc-assurance:first-child{border-inline-start:0}.mc-assurance strong{font-size:12px;display:block;color:var(--mc-brand)}.mc-assurance span{font-size:9.5px;color:#748178;display:block;margin-top:3px}
  .mc-catalog-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:32px 0 12px}.mc-eyebrow{font-size:10px;color:#C28B3B;font-weight:800}.mc-title{font-size:18px;font-family:'Almarai',sans-serif;font-weight:800;margin:5px 0 0;line-height:1.7}.mc-count{font-size:11px;color:#748178;white-space:nowrap}.mc-tools{display:flex;gap:8px;padding:12px 0;border-top:1px solid rgba(17,32,24,.1);border-bottom:1px solid rgba(17,32,24,.1);align-items:center}.mc-search{position:relative;flex:1}.mc-search input{width:100%;border:1px solid rgba(17,32,24,.11);border-radius:100px;background:#fff;color:#112018;padding:11px 35px 11px 11px;font-family:inherit;font-size:12px;outline:none}.mc-search input:focus{border-color:var(--mc-brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc-brand) 12%,transparent)}.mc-search svg{position:absolute;right:11px;top:50%;transform:translateY(-50%)}.mc-filter{border:1px solid rgba(17,32,24,.11);background:#fff;color:var(--mc-brand);border-radius:100px;padding:10px 11px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer}.mc-categories{display:flex;gap:7px;overflow-x:auto;padding:13px 0 3px}.mc-category{border:1px solid rgba(17,32,24,.11);background:#fff;color:#5b6b60;border-radius:100px;padding:8px 13px;font-family:inherit;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer}.mc-category.active{background:var(--mc-brand);color:#fff;border-color:var(--mc-brand)}
  .mc-section{margin-top:25px}.mc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mc-product{display:block;background:#fff;border:1px solid rgba(17,32,24,.1);border-radius:18px;padding:10px;text-decoration:none;color:#112018;box-shadow:0 10px 24px rgba(11,11,12,.04);transition:transform .18s ease,box-shadow .18s ease}.mc-product:hover{transform:translateY(-3px);box-shadow:0 16px 30px rgba(11,11,12,.09)}.mc-product-img{height:132px;border-radius:13px;background:#EAF0EB;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center}.mc-product-img img{width:100%;height:100%;object-fit:cover}.mc-file-card{width:55%;height:72%;background:#FFFDF8;box-shadow:0 10px 18px rgba(11,11,12,.12);border-radius:10px;transform:rotate(-6deg);padding:10px}.mc-file-card b{display:block;width:65%;height:6px;border-radius:8px;background:#C28B3B}.mc-file-card i{display:block;height:4px;background:#EDEAE0;border-radius:7px;margin-top:8px}.mc-file-card i:nth-child(3){width:80%}.mc-file-card i:nth-child(4){width:92%}.mc-file-card em{display:block;height:19px;background:#EAF0EB;border-radius:6px;margin-top:11px}.mc-product-type{font-size:9.5px;color:#C28B3B;font-weight:800;margin-top:10px}.mc-product-name{font-size:12px;font-weight:800;margin-top:3px;line-height:1.6}.mc-product-desc{font-size:10px;color:#748178;line-height:1.6;margin-top:2px;min-height:31px}.mc-product-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.mc-price{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:800;color:var(--mc-brand)}.mc-view{font-size:10px;color:var(--mc-brand);font-weight:800;background:color-mix(in srgb,var(--mc-brand) 9%,#fff);border-radius:100px;padding:6px 8px}
  .mc-featured{margin-top:24px;background:color-mix(in srgb,var(--mc-brand) 8%,#fff);border:1px solid color-mix(in srgb,var(--mc-brand) 15%,#fff);border-radius:20px;padding:15px}.mc-featured-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.mc-featured-title{font-family:'Almarai',sans-serif;font-size:13px;font-weight:800;color:var(--mc-brand)}.mc-featured-note{font-size:10px;color:#748178}.mc-featured-card{display:flex;align-items:center;gap:10px;background:#fff;border-radius:13px;padding:9px;text-decoration:none;color:#112018}.mc-featured-card+.mc-featured-card{margin-top:7px}.mc-featured-image{width:50px;height:50px;border-radius:10px;overflow:hidden;background:#EAF0EB;display:flex;align-items:center;justify-content:center;flex-shrink:0}.mc-featured-image img{width:100%;height:100%;object-fit:cover}.mc-featured-name{font-size:11.5px;font-weight:800}.mc-featured-price{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--mc-brand);font-weight:800;margin-top:4px}.mc-featured-badge{display:inline-flex;font-size:9px;color:#9C6D1F;background:#F3EBDD;padding:4px 7px;border-radius:100px;margin-right:auto;vertical-align:middle}
  .mc-about{margin-top:28px;background:#fff;border:1px solid rgba(17,32,24,.1);border-radius:18px;padding:18px}.mc-about-title{font-family:'Almarai',sans-serif;font-size:14px;font-weight:800;color:var(--mc-brand);margin-bottom:8px}.mc-about-text{font-size:12px;color:#53635A;line-height:2;white-space:pre-line}.mc-faq{margin-top:14px}.mc-faq details{background:#fff;border:1px solid rgba(17,32,24,.1);border-radius:13px;padding:12px 14px;margin-top:8px}.mc-faq summary{cursor:pointer;font-size:11.5px;font-weight:800;color:#22372C}.mc-faq p{font-size:11px;line-height:1.9;color:#748178;margin:9px 0 0}
  .mc-empty{background:#fff;border:1px solid rgba(17,32,24,.1);border-radius:22px;padding:38px 22px;text-align:center;margin-top:18px}.mc-empty-icon{width:56px;height:56px;border-radius:18px;background:color-mix(in srgb,var(--mc-brand) 10%,#fff);display:flex;align-items:center;justify-content:center;margin:0 auto 14px}.mc-empty-title{font-family:'Almarai',sans-serif;font-size:14px;font-weight:800}.mc-empty-sub{font-size:12px;color:#748178;line-height:1.9;max-width:320px;margin:8px auto 18px}.mc-empty-cta{display:inline-flex;gap:7px;align-items:center;border-radius:100px;padding:11px 16px;background:var(--mc-brand);color:#fff;text-decoration:none;font-size:12px;font-weight:800}
  .mc-reassurance{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid rgba(17,32,24,.1);background:#fff;border-radius:17px;overflow:hidden;margin-top:30px}.mc-reassurance div{padding:13px 9px;border-inline-start:1px solid rgba(17,32,24,.1)}.mc-reassurance div:first-child{border-inline-start:0}.mc-reassurance b{font-size:10.5px;display:block;color:var(--mc-brand)}.mc-reassurance span{display:block;font-size:9.5px;color:#748178;line-height:1.55;margin-top:4px}.mc-footer{text-align:center;color:#8b968f;font-size:10.5px;margin-top:29px}.mc-footer a{color:var(--mc-brand);font-weight:800;text-decoration:none}.mc-footer b{color:#112018}
  @media(min-width:680px){.mc-shell{padding-top:36px}.mc-store{padding:34px}.mc-logo{width:76px;height:76px}.mc-store-name{font-size:22px}.mc-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.mc-product-img{height:158px}.mc-product{padding:12px}.mc-reassurance{max-width:700px}.mc-assurances{margin-left:28px;margin-right:28px}.mc-tools{max-width:540px}.mc-catalog-head{margin-top:40px}}

  .mc-page button{ transition:transform 100ms ease-out; }
  .mc-page button:active{ transform:scale(0.96); }
`;

function SearchIcon(){return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="#7B7A74" strokeWidth="1.7"/><path d="M16 16l4 4" stroke="#7B7A74" strokeWidth="1.7" strokeLinecap="round"/></svg>}
function CartIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2 11h10l2-8H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1" fill="currentColor"/><circle cx="17" cy="20" r="1" fill="currentColor"/></svg>}
function WhatsappIcon(){return <svg viewBox="0 0 24 24" fill="none"><path d="M17 14c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/><path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" stroke="#fff" strokeWidth="1.3"/></svg>}
function InstagramIcon(){return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="1.6"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.6"/><circle cx="17.5" cy="6.5" r="1.1" fill="#fff"/></svg>}
function FileIcon(){return <svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#4B6152" strokeWidth="1.6"/><path d="M14 2v6h6M9 15l2 2 4-4" stroke="#4B6152" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function ShareIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}

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
        if (!storeData) {
          setStatus("missing");
          return;
        }
        setStore(storeData);
        const productQuery = query(
          collection(db, "products"),
          where("ownerId", "==", resolvedOwnerId),
          where("hidden", "==", false),
          where("suspended", "==", false)
        );
        const productSnap = await getDocs(productQuery);
        const allProducts = productSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
        allProducts.sort((a, b) => Number(b.featured) - Number(a.featured) || (a.sortOrder || 0) - (b.sortOrder || 0));
        setProducts(allProducts);
      } catch (error) {
        console.error("Unable to load store", error);
        setStatus("missing");
      } finally {
        setStatus((current) => current === "loading" ? "ready" : current);
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
  const coverUrl = store?.coverUrl;
  const storeAbout = store?.about || "";
  const storeFaqs = Array.isArray(store?.faqs) ? store.faqs.filter((faq) => faq?.question && faq?.answer) : [];
  const categories = useMemo(() => ["الكل", ...Array.from(new Set(products.map((product) => product.category || "عام")))], [products]);
  const shownProducts = useMemo(() => products.filter((product) => {
    const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    const matchSearch = text.includes(search.trim().toLowerCase());
    const matchCategory = activeCategory === "الكل" || (product.category || "عام") === activeCategory;
    return matchSearch && matchCategory;
  }), [products, search, activeCategory]);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);

  async function shareStore() {
    const shareData = { title: brandName, text: `تصفح منتجات ${brandName}`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      if (error?.name !== "AbortError") console.error("Unable to share store", error);
    }
  }

  return (
    <div className="mc-page" dir="rtl" lang="ar" style={{ "--mc-brand": brandColor }}>
      <style>{styles}</style>
      <header className="mc-top">
        <div className="mc-top-in">
          <div className="mc-wordmark"><span className="mc-store-mark">{logoUrl ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : brandName.charAt(0)}</span><span>{brandName}</span><span className="mc-gold-dot" /></div>
          <div className="mc-top-actions">
            <button className="mc-icon-btn" type="button" onClick={shareStore} title="مشاركة المتجر" aria-label="مشاركة المتجر"><ShareIcon /></button>
            <a className="mc-icon-btn" href="#products" title="المنتجات"><SearchIcon /></a>
            <a className="mc-icon-btn" href="#products" title="المشتريات"><CartIcon /></a>
          </div>
        </div>
      </header>

      <main className="mc-shell">
        <section className="mc-store">
          {coverUrl && <img className="mc-store-cover" src={coverUrl} alt="" />}
          <div className="mc-store-content">
            <div className="mc-logo">{logoUrl ? <img src={logoUrl} alt={`شعار ${brandName}`} /> : brandName.charAt(0)}</div>
            <div>
              <div className="mc-store-name">{brandName}</div>
              <div className="mc-store-tagline">{tagline}</div>
              <div className="mc-store-meta">متجر رقمي مستقل</div>
              {(whatsappUrl || instagramUrl) && <div className="mc-store-socials">
                {whatsappUrl && <a className="mc-social" href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="واتساب"><WhatsappIcon /></a>}
                {instagramUrl && <a className="mc-social" href={instagramUrl} target="_blank" rel="noopener noreferrer" title="إنستغرام"><InstagramIcon /></a>}
              </div>}
            </div>
          </div>
        </section>

        <section className="mc-assurances" aria-label="مزايا الشراء">
          <div className="mc-assurance"><strong className="mc-mono">{products.length}</strong><span>منتجات رقمية</span></div>
          <div className="mc-assurance"><strong>مرتب</strong><span>تصفح وفئات واضحة</span></div>
          <div className="mc-assurance"><strong>مباشر</strong><span>تواصل مع التاجر</span></div>
        </section>

        {featuredProducts.length > 0 && <section className="mc-featured">
          <div className="mc-featured-head"><div className="mc-featured-title">اختيارات التاجر</div><div className="mc-featured-note">منتجات يرشحها لك</div></div>
          {featuredProducts.map((product) => <a className="mc-featured-card" href={`#product/${product.id}`} key={product.id}>
            <div className="mc-featured-image">{product.images?.[0] ? <img src={product.images[0]} alt="" /> : <FileIcon />}</div>
            <div><div className="mc-featured-name">{product.name || "منتج رقمي"}</div><div className="mc-featured-price">{Number(product.price || 0).toFixed(2)} ر.ع</div></div>
            <span className="mc-featured-badge">مميز</span>
          </a>)}
        </section>}

        {status === "loading" ? <div className="mc-empty"><div className="mc-empty-icon"><FileIcon /></div><div className="mc-empty-title">نجهّز لك المتجر</div><div className="mc-empty-sub">لحظات ونظهر المنتجات المتاحة.</div></div> : status === "missing" ? <section className="mc-empty"><div className="mc-empty-icon"><FileIcon /></div><div className="mc-empty-title">لم نجد هذا المتجر</div><div className="mc-empty-sub">تأكد من الرابط أو ارجع إلى صفحة مُونَة الرئيسية.</div><a className="mc-empty-cta" href="#">العودة إلى مُونَة</a></section> : <>
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
                <div className="mc-product-name">{product.name || "منتج رقمي"}{product.featured && <span className="mc-featured-badge" style={{ marginRight: 5 }}>مميز</span>}</div>
                <div className="mc-product-desc">{product.description || "منتج رقمي من هذا المتجر."}</div>
                <div className="mc-product-bottom"><span className="mc-price">{Number(product.price || 0).toFixed(2)} ر.ع</span><span className="mc-view">عرض المنتج</span></div>
              </a>)}</div> : <div className="mc-empty"><div className="mc-empty-title">ما وجدنا منتجاً بهذا الاسم.</div><div className="mc-empty-sub">جرّب كلمة مختلفة أو ارجع لكل المنتجات.</div><button className="mc-filter" onClick={() => {setSearch(""); setActiveCategory("الكل");}}>عرض الكل</button></div>}
            </section>
          </>}
        </>}

        {(storeAbout || storeFaqs.length > 0) && <section className="mc-about">
          {storeAbout && <><div className="mc-about-title">عن {brandName}</div><div className="mc-about-text">{storeAbout}</div></>}
          {storeFaqs.length > 0 && <div className="mc-faq">
            <div className="mc-about-title">أسئلة شائعة</div>
            {storeFaqs.map((faq, index) => <details key={`${faq.question}-${index}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
          </div>}
        </section>}

        <section className="mc-reassurance" aria-label="معلومات الشراء">
          <div><b>عرض منظم</b><span>تصفح المنتجات والفئات بسهولة.</span></div>
          <div><b>سعر واضح</b><span>السعر ظاهر قبل التواصل.</span></div>
          <div><b>دعم مباشر</b><span>راسل التاجر إذا احتجت مساعدة.</span></div>
        </section>
        <footer className="mc-footer">متجر <b>{brandName}</b> · <a href="/" aria-label="زيارة موقع مُونَة">مدعوم من مُونَة</a></footer>
      </main>
    </div>
  );
}
