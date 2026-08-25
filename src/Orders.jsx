import React, { useState, useEffect } from "react";
import { db, storage } from "./firebase.js";
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp,
  getDoc, getDocs, limit,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const styles = `
  .ord-wrap{ padding:4px 0; }
  .mono{ font-family:'JetBrains Mono', monospace; }
  .ord-top{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; flex-wrap:wrap; gap:10px; }
  .ord-title{ font-family:'Almarai', sans-serif; font-weight:800; color:#0B0B0C; font-size:18px; }
  .ord-title-en{ color:#8A8677; font-size:11px; letter-spacing:.04em; text-transform:uppercase; margin-top:2px; }
  .ord-count{ background:#0B0B0C; color:#fff; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; }

  .ord-card{ background:#FFFFFF; border:1px solid #EDEAE0; border-radius:16px; padding:18px; margin-bottom:12px; }
  .ord-card.pending{ border:1.5px solid #E8BD69; }
  .ord-card-top{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .ord-id{ font-family:'JetBrains Mono', monospace; font-size:10.5px; color:#8A8677; }
  .ord-badge{ font-size:10.5px; font-weight:700; padding:4px 11px; border-radius:100px; }
  .ord-badge.done{ background:#EAF0EB; color:#4B6152; }
  .ord-badge.pending{ background:#FCE9C6; color:#7A5A17; }
  .ord-badge.cancelled{ background:#F6E9E5; color:#B24C3A; }

  .ord-product{ font-weight:700; color:#0B0B0C; font-size:14.5px; margin-bottom:2px; }
  .ord-product-en{ color:#B0AC9C; font-size:10px; }

  .ord-meta{ display:flex; align-items:center; gap:6px; color:#8A8677; font-size:12px; margin-top:10px; }
  .ord-meta svg{ flex-shrink:0; }

  .ord-footer{ display:flex; justify-content:space-between; align-items:center; padding-top:12px; margin-top:12px; border-top:1px dashed #EDEAE0; }
  .ord-date{ color:#B0AC9C; font-size:11px; }
  .ord-price{ font-family:'JetBrains Mono', monospace; font-weight:700; color:#0B0B0C; font-size:14.5px; }

  .ord-actions{ display:flex; gap:8px; margin-top:12px; padding-top:12px; border-top:1px dashed #EDEAE0; }
  .ord-action-btn{ flex:1; text-align:center; padding:8px; border-radius:100px; font-size:11px; font-weight:700; border:1px solid #EDEAE0; background:#FBFAF7; color:#3D4A66; cursor:pointer; font-family:'Cairo', sans-serif; }
  .ord-action-btn:disabled{ opacity:.6; }
  .ord-action-note{ color:#4B6152; font-size:11px; margin-top:8px; text-align:center; }
  .ord-action-error{ color:#B24C3A; font-size:11px; margin-top:8px; text-align:center; }

  .ord-confirm-row{ margin-top:12px; padding-top:12px; border-top:1px dashed #EDEAE0; }
  .ord-confirm-note{ color:#7A5A17; font-size:11.5px; line-height:1.7; margin-bottom:10px; }
  .ord-confirm-btn{ width:100%; background:#0B0B0C; color:#fff; border:none; padding:11px; border-radius:100px; font-weight:700; font-size:12.5px; cursor:pointer; font-family:'Cairo', sans-serif; }
  .ord-confirm-btn:disabled{ opacity:.6; }

  .ord-empty{ text-align:center; padding:50px 20px; color:#B0AC9C; }
  .ord-empty b{ display:block; color:#0B0B0C; font-family:'Almarai',sans-serif; font-size:14px; margin-bottom:6px; }
  .ord-empty span{ font-size:12.5px; }
  .ord-empty-btn{ display:inline-flex; align-items:center; gap:6px; background:#0B0B0C; color:#fff; border:none; padding:11px 20px; border-radius:100px; font-weight:700; font-size:12.5px; cursor:pointer; margin-top:16px; font-family:'Cairo', sans-serif; }
  .ord-error{ background:#F6E9E5; color:#B24C3A; padding:12px 16px; border-radius:12px; font-size:12.5px; margin-bottom:14px; line-height:1.7; }
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
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmError, setConfirmError] = useState({});
  const [copiedEmailId, setCopiedEmailId] = useState("");
  const [resendingId, setResendingId] = useState(null);
  const [resendResult, setResendResult] = useState({});

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

  async function confirmDelivered(orderId) {
    setConfirmingId(orderId);
    setConfirmError((prev) => ({ ...prev, [orderId]: "" }));
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "fulfilled",
        fulfilledAt: serverTimestamp(),
      });
    } catch (err) {
      setConfirmError((prev) => ({ ...prev, [orderId]: "تعذر التأكيد: " + (err.message || String(err)) }));
    }
    setConfirmingId(null);
  }

  function copyBuyerEmail(order) {
    navigator.clipboard.writeText(order.buyerEmail);
    setCopiedEmailId(order.id);
    setTimeout(() => setCopiedEmailId(""), 1500);
  }

  // يجهّز رابط تحميل الملف (أو الكود المخصص للمشتري) وينسخه، عشان التاجر يرسله يدويًا للعميل
  async function resendDelivery(order) {
    setResendingId(order.id);
    setResendResult((prev) => ({ ...prev, [order.id]: null }));
    try {
      if (order.type === "code") {
        const codesRef = collection(db, "products", order.productId, "codes");
        const q = query(codesRef, where("usedBy", "==", order.buyerEmail), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          setResendResult((prev) => ({ ...prev, [order.id]: { ok: false, msg: "ما لقينا كود مرتبط بهذا الطلب." } }));
        } else {
          const codeValue = snap.docs[0].data().code;
          navigator.clipboard.writeText(codeValue);
          setResendResult((prev) => ({ ...prev, [order.id]: { ok: true, msg: "تم نسخ الكود، الصقه بمحادثتك مع العميل." } }));
        }
      } else {
        const productSnap = await getDoc(doc(db, "products", order.productId));
        if (!productSnap.exists() || !productSnap.data().filePath) {
          setResendResult((prev) => ({ ...prev, [order.id]: { ok: false, msg: "تعذر إيجاد ملف هذا المنتج." } }));
        } else {
          const fileRef = ref(storage, productSnap.data().filePath);
          const url = await getDownloadURL(fileRef);
          navigator.clipboard.writeText(url);
          setResendResult((prev) => ({ ...prev, [order.id]: { ok: true, msg: "تم نسخ رابط التحميل، الصقه بمحادثتك مع العميل." } }));
        }
      }
    } catch (err) {
      setResendResult((prev) => ({ ...prev, [order.id]: { ok: false, msg: "صار خطأ، حاول مرة ثانية." } }));
    }
    setResendingId(null);
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length;

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

      {pendingCount > 0 && (
        <div className="ord-error" style={{ background: "#FCE9C6", color: "#7A5A17" }}>
          عندك {pendingCount} طلب بانتظار تأكيد الدفع — تأكد من التحويل وسلّم المنتج، ثم اضغط "تأكيد التسليم".
        </div>
      )}

      {status === "ready" && orders.length === 0 && !loadError && (
        <div className="ord-empty">
          <b>أول طلب لك قريب</b>
          <span>أضف منتجك وشارك رابطه على واتساب وإنستغرام لتبدأ استقبال المبيعات</span>
          {onAddProduct && (
            <button className="ord-empty-btn" onClick={onAddProduct}>+ أضف منتج</button>
          )}
        </div>
      )}

      {orders.map((o) => {
        const isPending = o.status === "pending";
        const result = resendResult[o.id];
        return (
          <div className={"ord-card" + (isPending ? " pending" : "")} key={o.id}>
            <div className="ord-card-top">
              <span className="ord-id">#{o.id.slice(0, 8).toUpperCase()}</span>
              {isPending ? (
                <span className="ord-badge pending">بانتظار تأكيد الدفع</span>
              ) : (
                <span className="ord-badge done">تم التسليم <span style={{ opacity: 0.7 }}>· Delivered</span></span>
              )}
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

            <div className="ord-actions">
              <button className="ord-action-btn" onClick={() => copyBuyerEmail(o)}>
                {copiedEmailId === o.id ? "تم النسخ ✓" : "نسخ بريد العميل"}
              </button>
              {!isPending && (
                <button className="ord-action-btn" disabled={resendingId === o.id} onClick={() => resendDelivery(o)}>
                  {resendingId === o.id ? "جاري التجهيز..." : "إعادة إرسال التسليم"}
                </button>
              )}
            </div>
            {result && (
              <div className={result.ok ? "ord-action-note" : "ord-action-error"}>{result.msg}</div>
            )}

            {isPending && (
              <div className="ord-confirm-row">
                <div className="ord-confirm-note">
                  تأكد من وصول التحويل عبر واتساب، وسلّم العميل منتجه (ملف أو كود) بنفسك، ثم أكّد هنا.
                </div>
                <button
                  className="ord-confirm-btn"
                  disabled={confirmingId === o.id}
                  onClick={() => confirmDelivered(o.id)}
                >
                  {confirmingId === o.id ? "جاري التأكيد..." : "تأكيد التسليم"}
                </button>
                {confirmError[o.id] && (
                  <div style={{ color: "#B24C3A", fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>{confirmError[o.id]}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
