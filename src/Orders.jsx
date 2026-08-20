import React, { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const styles = `
  .ord-wrap{ padding:4px 0; }
  .mono{ font-family:'JetBrains Mono', monospace; }
  .ord-top{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; flex-wrap:wrap; gap:10px; }
  .ord-title{ font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:18px; }
  .ord-title-en{ color:#8A8677; font-size:11px; letter-spacing:.04em; text-transform:uppercase; margin-top:2px; }
  .ord-count{ background:#16233F; color:#fff; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; }

  .ord-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:18px; margin-bottom:12px; }
  .ord-card-top{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .ord-id{ font-family:'JetBrains Mono', monospace; font-size:10.5px; color:#8A8677; }
  .ord-badge{ font-size:10.5px; font-weight:700; padding:4px 11px; border-radius:100px; }
  .ord-badge.done{ background:#EAF0EB; color:#4B6152; }
  .ord-badge.pending{ background:#FCE9C6; color:#7A5A17; }
  .ord-badge.cancelled{ background:#F6E9E5; color:#B24C3A; }

  .ord-product{ font-weight:700; color:#16233F; font-size:14.5px; margin-bottom:2px; }
  .ord-product-en{ color:#B0AC9C; font-size:10px; }

  .ord-meta{ display:flex; align-items:center; gap:6px; color:#8A8677; font-size:12px; margin-top:10px; }
  .ord-meta svg{ flex-shrink:0; }

  .ord-footer{ display:flex; justify-content:space-between; align-items:center; padding-top:12px; margin-top:12px; border-top:1px dashed #E4E0D3; }
  .ord-date{ color:#B0AC9C; font-size:11px; }
  .ord-price{ font-family:'JetBrains Mono', monospace; font-weight:700; color:#16233F; font-size:14.5px; }

  .ord-empty{ text-align:center; padding:50px 20px; color:#B0AC9C; }
  .ord-empty b{ display:block; color:#16233F; font-family:'Almarai',sans-serif; font-size:14px; margin-bottom:6px; }
  .ord-empty span{ font-size:12.5px; }
  .ord-empty-btn{ display:inline-flex; align-items:center; gap:6px; background:#16233F; color:#fff; border:none; padding:11px 20px; border-radius:10px; font-weight:700; font-size:12.5px; cursor:pointer; margin-top:16px; font-family:'Cairo', sans-serif; }
  .ord-error{ background:#F6E9E5; color:#B24C3A; padding:12px 16px; border-radius:10px; font-size:12.5px; margin-bottom:14px; line-height:1.7; }
`;

function formatDate(ts) {
  if (!ts || !ts.toDate) return "—";
  const d = ts.toDate();
  return d.toLocaleDateString("ar-OM", { day: "numeric", month: "short", year: "numeric" });
}

export default function Orders({ ownerId, onAddProduct }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!ownerId) return;
    // ملاحظة: بدون orderBy هنا عمدًا — نرتب النتائج يدويًا بالأسفل
    // عشان نتجنب الحاجة لإنشاء فهرس مركب (composite index) بلوحة Firebase
    const q = query(collection(db, "orders"), where("ownerId", "==", ownerId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        setOrders(list);
        setStatus("ready");
        setLoadError("");
      },
      (err) => {
        setStatus("ready");
        setLoadError("تعذر تحميل الطلبات: " + (err.message || String(err)));
      }
    );
    return () => unsub();
  }, [ownerId]);

  return (
    <div className="ord-wrap" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="ord-top">
        <div>
          <div className="ord-title">الطلبات</div>
          <div className="ord-title-en">Orders</div>
        </div>
        <div className="ord-count mono">{orders.length}</div>
      </div>

      {loadError && <div className="ord-error">{loadError}</div>}

      {status === "ready" && orders.length === 0 && !loadError && (
        <div className="ord-empty">
          <b>أول طلب لك قريب</b>
          <span>أضف منتجك وشارك رابطه على واتساب وإنستغرام لتبدأ استقبال المبيعات</span>
          {onAddProduct && (
            <button className="ord-empty-btn" onClick={onAddProduct}>+ أضف منتج</button>
          )}
        </div>
      )}

      {orders.map((o) => (
        <div className="ord-card" key={o.id}>
          <div className="ord-card-top">
            <span className="ord-id">#{o.id.slice(0, 8).toUpperCase()}</span>
            <span className="ord-badge done">تم التسليم <span style={{ opacity: 0.7 }}>· Delivered</span></span>
          </div>
          <div className="ord-product">{o.productName}</div>
          <div className="ord-product-en">Digital Product</div>
          <div className="ord-meta">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="#8A8677" strokeWidth="1.6"/><path d="M4 7l8 6 8-6" stroke="#8A8677" strokeWidth="1.6"/></svg>
            <span>{o.buyerEmail}</span>
          </div>
          <div className="ord-footer">
            <span className="ord-date">{formatDate(o.createdAt)}</span>
            <span className="ord-price mono">{Number(o.price).toFixed(2)} ر.ع</span>
          </div>
        </div>
      ))}
    </div>
  );
}
