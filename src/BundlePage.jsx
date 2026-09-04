import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where, documentId } from "firebase/firestore";
import { db } from "./firebase.js";
import ProductOrderPanel from "./ProductOrderPanel.jsx";

const styles = `
  .bp-page{--pp-brand:#163f2e;min-height:100vh;background:#f7f6f1;color:#111;font-family:'Cairo',sans-serif;direction:rtl}
  .bp-shell{max-width:640px;margin:auto;padding:20px}
  .bp-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}
  .bp-back{display:inline-flex;align-items:center;gap:7px;border:1px solid #e7e3d8;border-radius:999px;padding:9px 13px;background:#fff;color:#111;text-decoration:none;font-size:12px;font-weight:700}
  .bp-brand{display:flex;align-items:center;gap:8px;font-family:'Almarai',sans-serif;font-size:14px;font-weight:800;color:var(--pp-brand)}
  .bp-brand-mark{width:30px;height:30px;border-radius:9px;background:var(--pp-brand);color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:13px}
  .bp-brand-mark img{width:100%;height:100%;object-fit:cover}
  .bp-card{background:#fff;border:1px solid #e7e3d8;border-radius:22px;padding:24px}
  .bp-badge{display:inline-flex;background:#edf3ee;color:var(--pp-brand);border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800}
  .bp-title{font-family:'Almarai',sans-serif;font-size:22px;line-height:1.55;margin:13px 0 9px}
  .bp-store{font-size:12px;color:#777;line-height:1.7}
  .bp-price-row{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #eee9df;border-bottom:1px solid #eee9df;margin:20px 0;padding:16px 0}
  .bp-price-label{font-size:12px;color:#777}
  .bp-price{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:800;color:var(--pp-brand)}
  .bp-description{font-size:13px;line-height:2;color:#4d4b46;white-space:pre-line}
  .bp-items{margin-top:18px;border:1px solid #eee9df;border-radius:14px;overflow:hidden}
  .bp-items-title{font-size:11px;font-weight:800;color:#6e695f;padding:11px 14px;background:#faf9f5}
  .bp-item{display:flex;align-items:center;gap:9px;padding:10px 14px;border-top:1px solid #eee9df;font-size:12.5px}
  .bp-item span{color:var(--pp-brand)}
  .bp-note{font-size:10.5px;line-height:1.7;color:#89857a;text-align:center;margin:14px 8px 0}
  .bp-state{min-height:72vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .bp-state-card{max-width:430px;width:100%;text-align:center;background:#fff;border:1px solid #e7e3d8;border-radius:24px;padding:35px 25px}
  .bp-state-mark{width:58px;height:58px;background:#eaf0eb;color:#163f2e;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:23px}
  .bp-state h1{font-family:'Almarai',sans-serif;font-size:17px;margin:0 0 9px}
  .bp-state p{font-size:12.5px;line-height:1.9;color:#777;margin:0 0 18px}
  .bp-state a{display:inline-flex;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:11px 16px;font-size:12px;font-weight:800}
  @media(max-width:680px){.bp-shell{padding:16px}.bp-card{padding:20px}.bp-title{font-size:19px}}
`;

function LoadingState() {
  return <div className="bp-state"><div className="bp-state-card"><div className="bp-state-mark">…</div><h1>نجهّز تفاصيل الحزمة</h1><p>لحظات ونظهر لك المعلومات المتاحة.</p></div></div>;
}

function MissingState() {
  return <div className="bp-state"><div className="bp-state-card"><div className="bp-state-mark">؟</div><h1>لم نجد هذه الحزمة</h1><p>قد يكون الرابط غير صحيح أو أن صاحب المتجر أخفى هذه الحزمة.</p><a href="#">العودة إلى الصفحة الرئيسية</a></div></div>;
}

export default function BundlePage({ bundleId }) {
  const [status, setStatus] = useState("loading");
  const [bundle, setBundle] = useState(null);
  const [items, setItems] = useState([]);
  const [store, setStore] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const bundleSnap = await getDoc(doc(db, "bundles", bundleId));
        if (!bundleSnap.exists()) { if (!cancelled) setStatus("missing"); return; }
        const bundleData = { id: bundleSnap.id, ...bundleSnap.data() };
        if (bundleData.hidden || bundleData.suspended) { if (!cancelled) setStatus("missing"); return; }

        const productIds = Array.isArray(bundleData.productIds) ? bundleData.productIds : [];
        const itemsSnap = productIds.length
          ? await getDocs(query(
              collection(db, "products"),
              where(documentId(), "in", productIds.slice(0, 25)),
              where("hidden", "==", false),
              where("suspended", "==", false)
            ))
          : { docs: [] };
        const itemsData = itemsSnap.docs.map((item) => ({ id: item.id, name: item.data().name || "منتج رقمي" }));

        let storeData = null;
        if (bundleData.ownerId) {
          const directStore = await getDoc(doc(db, "stores", bundleData.ownerId));
          if (directStore.exists()) storeData = directStore.data();
        }

        if (!cancelled) {
          setBundle(bundleData);
          setItems(itemsData);
          setStore(storeData);
          setStatus("ready");
        }
      } catch (error) {
        console.error("Unable to load bundle", error);
        if (!cancelled) setStatus("missing");
      }
    })();
    return () => { cancelled = true; };
  }, [bundleId]);

  if (status === "loading") return <div className="bp-page" dir="rtl" lang="ar"><style>{styles}</style><LoadingState /></div>;
  if (status === "missing") return <div className="bp-page" dir="rtl" lang="ar"><style>{styles}</style><MissingState /></div>;

  const storeName = store?.name || "صاحب المتجر";
  const storeColor = store?.color || "#163f2e";
  const storeLogo = store?.logoUrl;

  return (
    <div className="bp-page" dir="rtl" lang="ar" style={{ "--pp-brand": storeColor }}>
      <style>{styles}</style>
      <main className="bp-shell">
        <header className="bp-top">
          <a className="bp-back" href={`#store/${store?.slug || bundle.ownerId}`}>→ العودة إلى المتجر</a>
          <span className="bp-brand"><span className="bp-brand-mark">{storeLogo ? <img src={storeLogo} alt="" /> : storeName.charAt(0)}</span>{storeName}</span>
        </header>
        <section className="bp-card">
          <span className="bp-badge">حزمة منتجات</span>
          <h1 className="bp-title">{bundle.name}</h1>
          <div className="bp-store">من متجر <strong>{storeName}</strong></div>
          <div className="bp-price-row"><span className="bp-price-label">سعر الحزمة كاملة</span><span className="bp-price">{Number(bundle.price || 0).toFixed(2)} ر.ع</span></div>
          <div className="bp-description">{bundle.description || "لا يوجد وصف إضافي لهذه الحزمة حاليًا."}</div>
          <div className="bp-items">
            <div className="bp-items-title">تشمل {items.length} منتجات</div>
            {items.map((item) => <div className="bp-item" key={item.id}><span>✓</span>{item.name}</div>)}
          </div>
          <ProductOrderPanel bundle={bundle} sellerWhatsapp={store?.whatsapp} />
          <p className="bp-note">التحويل يُراجع يدويًا من التاجر، ولا يفتح تنزيل أي منتج من الحزمة إلا بعد تأكيده.</p>
        </section>
        <footer className="bp-note" style={{ marginTop: 22 }}><a href="/" style={{ color: "var(--pp-brand)", fontWeight: 800, textDecoration: "none" }}>مدعوم من مُونَة</a></footer>
      </main>
    </div>
  );
}
