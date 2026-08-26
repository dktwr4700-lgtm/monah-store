import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase.js";

const styles = `
  .pp-page{--pp-brand:#163f2e;min-height:100vh;background:#f7f6f1;color:#111;font-family:'Cairo',sans-serif;direction:rtl}.pp-shell{max-width:880px;margin:auto;padding:20px}.pp-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}.pp-back{display:inline-flex;align-items:center;gap:7px;border:1px solid #e7e3d8;border-radius:999px;padding:9px 13px;background:#fff;color:#111;text-decoration:none;font-size:12px;font-weight:700}.pp-brand{display:flex;align-items:center;gap:8px;font-family:'Almarai',sans-serif;font-size:14px;font-weight:800;color:var(--pp-brand)}.pp-brand-mark{width:30px;height:30px;border-radius:9px;background:var(--pp-brand);color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:13px}.pp-brand-mark img{width:100%;height:100%;object-fit:cover}.pp-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start}.pp-media{background:#eaf0eb;border-radius:22px;min-height:290px;overflow:hidden;position:relative}.pp-media img{width:100%;height:100%;min-height:290px;object-fit:cover;display:block}.pp-placeholder{min-height:290px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#4b6152;gap:12px}.pp-file{width:98px;height:126px;border-radius:16px;background:#fffdf8;box-shadow:0 15px 30px rgba(11,11,12,.12);padding:17px;transform:rotate(-5deg)}.pp-file b,.pp-file i{display:block;border-radius:99px}.pp-file b{height:8px;width:62%;background:#b9832f}.pp-file i{height:5px;background:#e8e4d9;margin-top:12px}.pp-file i:nth-child(3){width:78%}.pp-file i:nth-child(4){width:92%}.pp-file em{display:block;height:28px;border-radius:8px;background:#eaf0eb;margin-top:17px}.pp-thumbs{display:flex;gap:8px;margin-top:10px}.pp-thumb{width:58px;height:48px;border-radius:10px;border:2px solid transparent;object-fit:cover;cursor:pointer;background:#fff}.pp-thumb.active{border-color:var(--pp-brand)}.pp-card{background:#fff;border:1px solid #e7e3d8;border-radius:22px;padding:24px}.pp-category{display:inline-flex;background:#edf3ee;color:var(--pp-brand);border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800}.pp-title{font-family:'Almarai',sans-serif;font-size:24px;line-height:1.55;margin:13px 0 9px}.pp-store{font-size:12px;color:#777;line-height:1.7}.pp-price-row{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #eee9df;border-bottom:1px solid #eee9df;margin:20px 0;padding:16px 0}.pp-price-label{font-size:12px;color:#777}.pp-price{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:800;color:var(--pp-brand)}.pp-description{font-size:13px;line-height:2;color:#4d4b46;white-space:pre-line}.pp-contact{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:22px;border:0;border-radius:999px;padding:14px 17px;background:var(--pp-brand);color:#fff;text-decoration:none;font-family:inherit;font-size:13px;font-weight:800}.pp-contact.disabled{background:#d7d4cb;color:#777;cursor:not-allowed}.pp-actions{display:flex;gap:8px;margin-top:9px}.pp-share{flex:1;border:1px solid #d8d4c8;border-radius:999px;padding:10px 14px;background:#fff;color:var(--pp-brand);font-family:inherit;font-size:12px;font-weight:800;cursor:pointer}.pp-note{font-size:10.5px;line-height:1.7;color:#89857a;text-align:center;margin:10px 8px 0}.pp-info{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:22px;border:1px solid #e7e3d8;border-radius:16px;overflow:hidden;background:#e7e3d8}.pp-info div{background:#fff;padding:13px 8px;text-align:center}.pp-info b{font-size:11px;display:block}.pp-info span{font-size:9.5px;color:#777;display:block;margin-top:4px}.pp-powered{text-align:center;font-size:10.5px;color:#89857a;margin:22px 0 3px}.pp-powered a{color:var(--pp-brand);font-weight:800;text-decoration:none}.pp-state{min-height:72vh;display:flex;align-items:center;justify-content:center;padding:20px}.pp-state-card{max-width:430px;width:100%;text-align:center;background:#fff;border:1px solid #e7e3d8;border-radius:24px;padding:35px 25px}.pp-state-mark{width:58px;height:58px;background:#eaf0eb;color:#163f2e;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:23px}.pp-state h1{font-family:'Almarai',sans-serif;font-size:17px;margin:0 0 9px}.pp-state p{font-size:12.5px;line-height:1.9;color:#777;margin:0 0 18px}.pp-state a{display:inline-flex;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:11px 16px;font-size:12px;font-weight:800}.pp-page :focus-visible{outline:2px solid #b9832f;outline-offset:3px}@media(max-width:680px){.pp-shell{padding:16px}.pp-grid{grid-template-columns:1fr;gap:15px}.pp-media,.pp-media img,.pp-placeholder{min-height:230px}.pp-card{padding:20px}.pp-title{font-size:20px}.pp-top{margin-bottom:16px}}
`;

const extraStyles = `
  .pp-section{margin-top:22px;background:#fff;border:1px solid #e7e3d8;border-radius:18px;padding:17px}.pp-section-title{font-family:'Almarai',sans-serif;font-size:13px;font-weight:800;color:var(--pp-brand);margin-bottom:10px}.pp-related{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pp-related-card{border:1px solid #eee9df;border-radius:12px;padding:9px;color:#111;text-decoration:none}.pp-related-name{font-size:10.5px;font-weight:800;line-height:1.55}.pp-related-price{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--pp-brand);margin-top:5px}.pp-faq details{border-top:1px solid #eee9df;padding:10px 0}.pp-faq details:first-child{border-top:0}.pp-faq summary{font-size:11px;font-weight:800;cursor:pointer}.pp-faq p{font-size:10.5px;line-height:1.9;color:#777;margin:7px 0 0}.pp-preview-note{margin-top:10px;padding:9px 11px;border:1px solid #dfe9df;border-radius:12px;background:#f4f8f4;color:#42624c;font-size:10.5px;line-height:1.75}.pp-selling-points{margin-top:17px;border-top:1px solid #eee9df;padding-top:14px}.pp-selling-points b{display:block;font-size:11.5px;margin-bottom:7px;color:var(--pp-brand)}.pp-selling-points div{font-size:10.5px;line-height:1.85;color:#5d5a54}.pp-campaign-note{margin-top:9px;color:#6a756e;font-size:9.5px}@media(max-width:680px){.pp-related{grid-template-columns:repeat(2,1fr)}}
`;

function storeUrl(store, ownerId) {
  return `#store/${store?.slug || ownerId}`;
}

function whatsappUrl(number, productName) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  const message = encodeURIComponent(`مرحبًا، لدي استفسار عن منتج: ${productName}`);
  return `https://wa.me/${digits}?text=${message}`;
}

function LoadingState() {
  return <div className="pp-state"><div className="pp-state-card"><div className="pp-state-mark">…</div><h1>نجهّز تفاصيل المنتج</h1><p>لحظات ونظهر لك المعلومات المتاحة.</p></div></div>;
}

function MissingState({ unavailable }) {
  return <div className="pp-state"><div className="pp-state-card"><div className="pp-state-mark">{unavailable ? "−" : "؟"}</div><h1>{unavailable ? "هذا المنتج غير متاح حاليًا" : "لم نجد هذا المنتج"}</h1><p>{unavailable ? "تم إيقاف عرض هذا المنتج مؤقتًا. يمكنك الرجوع إلى المتجر لرؤية المنتجات المتاحة." : "قد يكون الرابط غير صحيح أو أن صاحب المتجر أزال المنتج."}</p><a href="#">العودة إلى الصفحة الرئيسية</a></div></div>;
}

export default function ProductPage({ productId }) {
  const [status, setStatus] = useState("loading");
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      setStatus("loading");
      try {
        const productSnap = await getDoc(doc(db, "products", productId));
        if (!productSnap.exists()) {
          if (!cancelled) setStatus("missing");
          return;
        }
        const productData = { id: productSnap.id, ...productSnap.data() };
        if (productData.hidden || productData.suspended) {
          if (!cancelled) setStatus("unavailable");
          return;
        }

        let storeData = null;
        if (productData.ownerId) {
          const directStore = await getDoc(doc(db, "stores", productData.ownerId));
          if (directStore.exists()) {
            storeData = directStore.data();
          } else {
            const matchingStore = await getDocs(query(collection(db, "stores"), where("ownerId", "==", productData.ownerId)));
            if (!matchingStore.empty) storeData = matchingStore.docs[0].data();
          }
        }

        if (productData.ownerId) {
          const relatedSnap = await getDocs(query(collection(db, "products"), where("ownerId", "==", productData.ownerId), where("hidden", "==", false), where("suspended", "==", false)));
          const related = relatedSnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.id !== productData.id);
          related.sort((a, b) => Number(b.featured) - Number(a.featured) || (a.sortOrder || 0) - (b.sortOrder || 0));
          if (!cancelled) setRelatedProducts(related.slice(0, 3));
        }

        if (!cancelled) {
          setProduct(productData);
          setStore(storeData);
          setActiveImage(0);
          setStatus("ready");
        }
      } catch (error) {
        console.error("Unable to load product", error);
        if (!cancelled) setStatus("missing");
      }
    }
    if (productId) loadProduct();
    else setStatus("missing");
    return () => { cancelled = true; };
  }, [productId]);

  const images = useMemo(() => Array.isArray(product?.images) ? product.images.filter(Boolean) : [], [product]);
  if (status === "loading") return <div className="pp-page" dir="rtl" lang="ar"><style>{styles}</style><LoadingState /></div>;
  if (status === "missing" || status === "unavailable") return <div className="pp-page" dir="rtl" lang="ar"><style>{styles}</style><MissingState unavailable={status === "unavailable"} /></div>;

  const name = product?.name || "منتج رقمي";
  const contact = whatsappUrl(store?.whatsapp, name);
  const category = product?.category || "منتج رقمي";
  const isCode = product?.type === "code";
  const storeName = store?.name || "صاحب المتجر";
  const storeColor = store?.color || "#163f2e";
  const storeLogo = store?.logoUrl;
  const storeFaqs = Array.isArray(store?.faqs) ? store.faqs.filter((faq) => faq?.question && faq?.answer) : [];
  const smartSalesPageEnabled = store?.featureSelections?.smartSalesPage === true;
  const productPreviewEnabled = store?.featureSelections?.productPreview === true;
  const campaignSource = new URLSearchParams(window.location.search).get("src");

  async function shareProduct() {
    const shareData = { title: name, text: `شاهد ${name} من ${storeName}`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("تم نسخ الرابط");
      window.setTimeout(() => setShareStatus(""), 1800);
    } catch (error) {
      if (error?.name !== "AbortError") setShareStatus("تعذرت المشاركة، انسخ الرابط من المتصفح");
    }
  }

  return (
    <div className="pp-page" dir="rtl" lang="ar" style={{ "--pp-brand": storeColor }}>
      <style>{styles}{extraStyles}</style>
      <main className="pp-shell">
        <header className="pp-top">
          <a className="pp-back" href={storeUrl(store, product.ownerId)}>→ العودة إلى المتجر</a>
          <span className="pp-brand"><span className="pp-brand-mark">{storeLogo ? <img src={storeLogo} alt="" /> : storeName.charAt(0)}</span>{storeName}</span>
        </header>
        <div className="pp-grid">
          <section>
            <div className="pp-media">
              {images.length ? <img src={images[activeImage]} alt={`صورة ${name}`} /> : <div className="pp-placeholder"><div className="pp-file"><b></b><i></i><i></i><i></i><em></em></div><span>منتج رقمي</span></div>}
            </div>
            {images.length > 1 && <div className="pp-thumbs" aria-label="صور المنتج">{images.map((image, index) => <button key={image} type="button" className={`pp-thumb ${activeImage === index ? "active" : ""}`} onClick={() => setActiveImage(index)} aria-label={`عرض الصورة ${index + 1}`}><img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /></button>)}</div>}
            {productPreviewEnabled && images.length > 0 && <div className="pp-preview-note">هذه صور معاينة للمنتج فقط. ملف المنتج الكامل لا يظهر في صفحة المتجر.</div>}
          </section>
          <section className="pp-card">
            <span className="pp-category">{category}</span>
            <h1 className="pp-title">{name}</h1>
            <div className="pp-store">من متجر <strong>{storeName}</strong></div>
            <div className="pp-price-row"><span className="pp-price-label">السعر المعروض</span><span className="pp-price">{Number(product?.price || 0).toFixed(2)} ر.ع</span></div>
            <div className="pp-description">{product?.description || "لا يوجد وصف إضافي لهذا المنتج حاليًا."}</div>
            {smartSalesPageEnabled && <div className="pp-selling-points"><b>قبل ما تتواصل مع البائع</b><div>{images.length > 0 ? "تصفح صور المعاينة أولًا، ثم راجع الوصف والسعر المعروض." : "راجع وصف المنتج وسعره، ثم تواصل مع البائع لو تحتاج تفاصيل إضافية."}</div><div>طريقة الاستلام والدفع يؤكدها البائع حاليًا قبل إكمال الطلب.</div></div>}
            {contact ? <a className="pp-contact" href={contact} target="_blank" rel="noopener noreferrer">تواصل مع البائع قبل الشراء</a> : <span className="pp-contact disabled">بيانات التواصل غير متاحة حاليًا</span>}
            <div className="pp-actions"><button type="button" className="pp-share" onClick={shareProduct}>{shareStatus || "مشاركة رابط المنتج"}</button></div>
            <p className="pp-note">تواصل مع صاحب المتجر للاستفسار عن المنتج وطريقة الاستلام المتاحة.</p>
            {campaignSource && <p className="pp-campaign-note">فتحت هذا المنتج من رابط مشاركة: {campaignSource}</p>}
          </section>
        </div>
        <section className="pp-info" aria-label="معلومات المنتج">
          <div><b>{isCode ? "كود / ترخيص" : "ملف رقمي"}</b><span>نوع المنتج</span></div>
          <div><b>{images.length ? `${images.length} صورة` : "معاينة جاهزة"}</b><span>عرض المنتج</span></div>
          <div><b>{category}</b><span>التصنيف</span></div>
        </section>
        {relatedProducts.length > 0 && <section className="pp-section"><div className="pp-section-title">منتجات أخرى من {storeName}</div><div className="pp-related">{relatedProducts.map((item) => <a className="pp-related-card" href={`#product/${item.id}`} key={item.id}><div className="pp-related-name">{item.name || "منتج رقمي"}</div><div className="pp-related-price">{Number(item.price || 0).toFixed(2)} ر.ع</div></a>)}</div></section>}
        {storeFaqs.length > 0 && <section className="pp-section pp-faq"><div className="pp-section-title">أسئلة عن المتجر</div>{storeFaqs.map((faq, index) => <details key={`${faq.question}-${index}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}
        <footer className="pp-powered"><a href="/">مدعوم من مُونَة</a></footer>
      </main>
    </div>
  );
}
