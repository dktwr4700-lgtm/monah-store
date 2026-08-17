import React, { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const styles = `
  .st-page{ min-height:100vh; background:#F6F3EC; font-family:'Cairo', sans-serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }

  .st-cover{ padding:44px 24px 26px; text-align:center; position:relative; overflow:hidden; }
  .st-cover::before{ content:""; position:absolute; inset:0; opacity:.08; background-image: radial-gradient(circle, #fff 1.5px, transparent 1.5px); background-size:18px 18px; }
  .st-logo{ width:58px; height:58px; border-radius:16px; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:22px; background:#fff; position:relative; z-index:1; }
  .st-brand{ font-family:'Almarai', sans-serif; font-weight:800; font-size:19px; color:#fff; position:relative; z-index:1; }
  .st-sub{ color:rgba(255,255,255,0.75); font-size:12px; margin-top:6px; position:relative; z-index:1; }
  .st-social{ display:flex; justify-content:center; gap:10px; margin-top:16px; position:relative; z-index:1; }
  .st-social a{ width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; text-decoration:none; }

  .st-stats{ display:flex; background:#FFFFFF; margin:-16px 20px 0; border-radius:12px; border:1px solid #E4E0D3; position:relative; z-index:2; box-shadow:0 8px 20px rgba(22,35,63,0.08); }
  .st-stat{ flex:1; text-align:center; padding:14px 6px; border-inline-start:1px solid #E4E0D3; }
  .st-stat:first-child{ border-inline-start:none; }
  .st-stat b{ display:block; font-family:'JetBrains Mono',monospace; font-weight:700; color:#16233F; font-size:15px; }
  .st-stat span{ display:block; color:#8A8677; font-size:9.5px; margin-top:3px; }

  .st-wrap{ max-width:520px; margin:0 auto; padding:22px 20px 28px; }

  .st-section{ margin-bottom:28px; }
  .st-section-head{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .st-section-title{ font-family:'Almarai', sans-serif; font-weight:800; font-size:14px; color:#16233F; }
  .st-section-count{ color:#B0AC9C; font-size:11px; font-family:'JetBrains Mono', monospace; }
  .st-section-line{ flex:1; height:1px; background:#E4E0D3; }

  .st-item{ display:flex; align-items:center; gap:12px; text-decoration:none; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:12px; padding:14px 16px; margin-bottom:10px; }
  .st-item-icon{ width:38px; height:38px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .st-item-body{ flex:1; min-width:0; }
  .st-item-name{ font-weight:700; color:#16233F; font-size:13.5px; margin-bottom:2px; }
  .st-item-price{ color:#B9832F; font-weight:800; font-size:12.5px; font-family:'JetBrains Mono',monospace; }
  .st-item-desc{ color:#8A8677; font-size:11px; margin-top:4px; line-height:1.6; }

  .st-empty{ text-align:center; color:#8A8677; font-size:13px; padding:60px 20px; }
  .st-footer{ text-align:center; padding:20px; color:#B0AC9C; font-size:10.5px; }
`;

function FileIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#4B6152" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="#4B6152" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export default function StorePage({ sellerId }) {
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function fetchData() {
      try {
        let storeData = null;
        let resolvedOwnerId = sellerId;

        const directSnap = await getDoc(doc(db, "stores", sellerId));
        if (directSnap.exists()) {
          storeData = directSnap.data();
        } else {
          const q = query(collection(db, "stores"), where("slug", "==", sellerId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            storeData = snap.docs[0].data();
            resolvedOwnerId = snap.docs[0].id;
          }
        }

        setStore(storeData);

        const q2 = query(collection(db, "products"), where("ownerId", "==", resolvedOwnerId));
        const snap2 = await getDocs(q2);
        setProducts(snap2.docs.map((d) => ({ id: d.id, ...d.data() })));
        setStatus("ready");
      } catch (err) {
        setStatus("ready");
      }
    }
    fetchData();
  }, [sellerId]);

  const brandColor = (store && store.color) || "#16233F";
  const brandName = (store && store.name) || "متجر رقمي";
  const tagline = (store && store.tagline) || "منتجات رقمية عبر Monah";
  const whatsapp = store && store.whatsapp;
  const instagram = store && store.instagram;
  const initial = brandName.charAt(0);

  const groups = {};
  products.forEach((p) => {
    const cat = p.category || "عام";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  const categoryNames = Object.keys(groups);

  return (
    <div className="st-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="st-cover" style={{ background: brandColor }}>
        <div className="st-logo">{initial}</div>
        <div className="st-brand">{brandName}</div>
        <div className="st-sub">{tagline}</div>

        {(whatsapp || instagram) && (
          <div className="st-social">
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" title="واتساب">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 14c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.3z" fill="#fff"/><path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" stroke="#fff" strokeWidth="1.3"/></svg>
              </a>
            )}
            {instagram && (
              <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" title="إنستغرام">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="st-stats">
        <div className="st-stat"><b className="mono">{products.length}</b><span>منتجات</span></div>
        <div className="st-stat"><b>فوري</b><span>تسليم الملف</span></div>
        <div className="st-stat"><b>٪0</b><span>رسوم إضافية</span></div>
      </div>

      <div className="st-wrap">
        {status === "ready" && products.length === 0 && (
          <div className="st-empty">هذا المتجر ما فيه منتجات معروضة حاليًا.</div>
        )}

        {categoryNames.map((cat) => (
          <div className="st-section" key={cat}>
            <div className="st-section-head">
              <span className="st-section-title">{cat}</span>
              <span className="st-section-count mono">{groups[cat].length}</span>
              <div className="st-section-line"></div>
            </div>
            {groups[cat].map((p) => (
              <a className="st-item" href={`#product/${p.id}`} key={p.id}>
                <div className="st-item-icon"><FileIcon /></div>
                <div className="st-item-body">
                  <div className="st-item-name">{p.name}</div>
                  <div className="st-item-price mono">{Number(p.price).toFixed(2)} ر.ع</div>
                  {p.description && <div className="st-item-desc">{p.description}</div>}
                </div>
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="st-footer">مدعوم عبر منصة Monah</div>
    </div>
  );
}
