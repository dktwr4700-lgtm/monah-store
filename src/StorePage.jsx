import React, { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const styles = `
  .st-page{ min-height:100vh; background:#F6F3EC; font-family:'Cairo', sans-serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }
  .st-header{ padding:40px 24px 32px; text-align:center; }
  .st-logo{ width:52px; height:52px; border-radius:14px; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; font-family:'Almarai', sans-serif; font-weight:800; color:#fff; font-size:20px; }
  .st-brand{ font-family:'Almarai', sans-serif; font-weight:800; font-size:19px; color:#16233F; }
  .st-sub{ color:#8A8677; font-size:12px; margin-top:6px; }
  .st-wrap{ max-width:520px; margin:0 auto; padding:6px 20px 28px; }
  .st-item{ display:block; text-decoration:none; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:12px; padding:16px 18px; margin-bottom:10px; }
  .st-item-name{ font-weight:700; color:#16233F; font-size:14px; margin-bottom:6px; }
  .st-item-price{ color:#B9832F; font-weight:800; font-size:13px; font-family:'JetBrains Mono',monospace; }
  .st-empty{ text-align:center; color:#8A8677; font-size:13px; padding:60px 20px; }
  .st-footer{ text-align:center; padding:20px; color:#B0AC9C; font-size:10.5px; }
`;

export default function StorePage({ sellerId }) {
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function fetchData() {
      try {
        const storeSnap = await getDoc(doc(db, "stores", sellerId));
        if (storeSnap.exists()) setStore(storeSnap.data());

        const q = query(collection(db, "products"), where("ownerId", "==", sellerId));
        const snap = await getDocs(q);
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setStatus("ready");
      } catch (err) {
        setStatus("ready");
      }
    }
    fetchData();
  }, [sellerId]);

  const brandColor = (store && store.color) || "#16233F";
  const brandName = (store && store.name) || "متجر رقمي";
  const initial = brandName.charAt(0);

  return (
    <div className="st-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="st-header">
        <div className="st-logo" style={{ background: brandColor }}>{initial}</div>
        <div className="st-brand">{brandName}</div>
        <div className="st-sub">منتجات رقمية عبر Monah</div>
      </div>
      <div className="st-wrap">
        {status === "ready" && products.length === 0 && (
          <div className="st-empty">هذا المتجر ما فيه منتجات معروضة حاليًا.</div>
        )}
        {products.map((p) => (
          <a className="st-item" href={`#product/${p.id}`} key={p.id}>
            <div className="st-item-name">{p.name}</div>
            <div className="st-item-price mono">{Number(p.price).toFixed(2)} ر.ع</div>
          </a>
        ))}
      </div>
      <div className="st-footer">مدعوم عبر منصة Monah</div>
    </div>
  );
}
