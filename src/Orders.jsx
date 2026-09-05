import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase.js";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const styles = `
  .ord-wrap{padding:4px 0}.mono{font-family:'JetBrains Mono',monospace}.ord-top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:10px}.ord-title{font-family:'Almarai',sans-serif;font-weight:800;color:#0b0b0c;font-size:18px}.ord-title-en{color:#8a8677;font-size:11px;letter-spacing:.04em;text-transform:uppercase;margin-top:2px}.ord-count{background:#0b0b0c;color:#fff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:100px}.ord-stalled{position:relative;padding:2px 0 2px 4px;padding-right:14px;margin-bottom:20px;border-right:3px solid #9c6d1f}.ord-stalled b{display:block;font-size:13px;font-weight:700;color:#0b0b0c;margin-bottom:3px}.ord-stalled p{font-size:11.5px;color:#8a8677;line-height:1.8;margin:0 0 12px}.ord-stalled-list{border-top:1px solid #edeae0}.ord-stalled-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid #edeae0}.ord-stalled-row:last-child{border-bottom:0}.ord-wa-btn{border:1px solid #edeae0;background:none;color:#163f2e;font-family:'Cairo',sans-serif;font-weight:800;font-size:10.5px;padding:8px 13px;border-radius:100px;cursor:pointer;white-space:nowrap}.ord-settings{background:#fff8e9;border:1px solid #efd9ab;border-radius:16px;padding:15px;margin-bottom:14px}.ord-settings b{display:block;font-family:'Almarai',sans-serif;font-size:13px;margin-bottom:5px}.ord-settings p{font-size:11px;line-height:1.8;color:#735817;margin:0 0 9px}.ord-settings textarea{box-sizing:border-box;width:100%;min-height:82px;border:1px solid #dfd3b4;border-radius:10px;background:#fff;font-family:'Cairo',sans-serif;font-size:12px;padding:10px}.ord-settings button,.ord-confirm-btn,.ord-proof-btn,.ord-deliver-btn{border:0;border-radius:999px;background:#0b0b0c;color:#fff;font-family:'Cairo',sans-serif;font-size:11.5px;font-weight:800;padding:10px 14px;cursor:pointer;margin-top:8px}.ord-settings button:disabled,.ord-confirm-btn:disabled{opacity:.6;cursor:not-allowed}.ord-list{background:#fff;border:1px solid #edeae0;border-radius:16px;padding:0 18px;margin-bottom:12px}.ord-card{padding:18px 0;border-top:1px dashed #edeae0}.ord-card:first-child{border-top:none}.ord-card.pending{border-right:3px solid #e8bd69;padding-right:13px}.ord-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:8px}.ord-id{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#8a8677}.ord-badge{font-size:10.5px;font-weight:700;padding:4px 11px;border-radius:100px;white-space:nowrap}.ord-badge.done{background:#eaf0eb;color:#4b6152}.ord-badge.pending{background:#fce9c6;color:#7a5a17}.ord-product{font-weight:700;color:#0b0b0c;font-size:14.5px;margin-bottom:2px}.ord-meta{display:flex;align-items:center;gap:6px;color:#8a8677;font-size:12px;margin-top:10px}.ord-meta a{color:#163f2e;font-weight:700;text-decoration:none}.ord-footer{display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:12px;border-top:1px dashed #edeae0}.ord-date{color:#b0ac9c;font-size:11px}.ord-price{font-family:'JetBrains Mono',monospace;font-weight:700;color:#0b0b0c;font-size:14.5px}.ord-confirm-row{margin-top:12px;padding-top:12px;border-top:1px dashed #edeae0}.ord-confirm-note{color:#7a5a17;font-size:11.5px;line-height:1.8;margin-bottom:8px}.ord-proof-btn{background:#fff;border:1px solid #d8d4c8;color:#163f2e;margin-left:7px}.ord-deliver-btn{background:#25D366;margin-left:7px}.ord-action-note{color:#4b6152;font-size:11px;margin-top:8px;line-height:1.7}.ord-action-error{color:#b24c3a;font-size:11px;margin-top:8px;line-height:1.7}.ord-empty{text-align:center;padding:50px 20px;color:#b0ac9c}.ord-empty b{display:block;color:#0b0b0c;font-family:'Almarai',sans-serif;font-size:14px;margin-bottom:6px}.ord-empty span{font-size:12.5px}.ord-empty-btn{display:inline-flex;align-items:center;gap:6px;background:#0b0b0c;color:#fff;border:none;padding:11px 20px;border-radius:100px;font-weight:700;font-size:12.5px;cursor:pointer;margin-top:16px;font-family:'Cairo',sans-serif}.ord-error{background:#f6e9e5;color:#b24c3a;padding:12px 16px;border-radius:12px;font-size:12.5px;margin-bottom:14px;line-height:1.7}.ord-wrap button{transition:transform 100ms ease-out}.ord-wrap button:active{transform:scale(.96)}@media(max-width:390px){.ord-top{align-items:center;margin-bottom:14px}.ord-list{padding:0 14px}.ord-card{padding:15px 0}.ord-card-top{gap:8px}.ord-product{line-height:1.6}.ord-meta{align-items:flex-start;line-height:1.7;word-break:break-word}.ord-footer{gap:10px}.ord-confirm-btn,.ord-proof-btn,.ord-deliver-btn{width:100%;margin-left:0;min-height:42px}.ord-settings textarea{font-size:13px}}
`;

function formatDate(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleDateString("ar-OM", { day: "numeric", month: "short", year: "numeric" });
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function deliveryLink(order) {
  return `${window.location.origin}/#deliver/${order.id}/${order.deliveryToken}`;
}

async function orderRequest(action, payload) {
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تنفيذ العملية الآن.");
  return data;
}

const STALE_DRAFT_MS = 30 * 60 * 1000;

export default function Orders({ ownerId, onAddProduct, storeName }) {
  const [orders, setOrders] = useState([]);
  const [staleDrafts, setStaleDrafts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [confirmError, setConfirmError] = useState({});
  const [proofUrl, setProofUrl] = useState({});
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, "orders"), where("ownerId", "==", ownerId));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      const list = all.filter((item) => item.status !== "draft");
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(list);
      const now = Date.now();
      const drafts = all.filter((item) => {
        if (item.status !== "draft" || !item.buyerPhone) return false;
        const createdMs = item.createdAt?.toMillis?.();
        return createdMs && now - createdMs > STALE_DRAFT_MS;
      });
      drafts.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setStaleDrafts(drafts);
      setLoadError("");
    }, () => setLoadError("تعذر تحميل الطلبات الآن."));
  }, [ownerId]);

  async function showProof(orderId) {
    setConfirmError((current) => ({ ...current, [orderId]: "" }));
    try {
      const data = await orderRequest("proof_url", { orderId });
      setProofUrl((current) => ({ ...current, [orderId]: data.url }));
    } catch (requestError) {
      setConfirmError((current) => ({ ...current, [orderId]: requestError.message || "تعذر فتح الإيصال." }));
    }
  }

  async function confirmPayment(orderId) {
    setConfirmingId(orderId);
    setConfirmError((current) => ({ ...current, [orderId]: "" }));
    try {
      await orderRequest("confirm", { orderId });
    } catch (requestError) {
      setConfirmError((current) => ({ ...current, [orderId]: requestError.message || "تعذر تأكيد استلام المبلغ." }));
    }
    setConfirmingId("");
  }

  async function copyDeliveryLink(order) {
    try {
      await navigator.clipboard.writeText(deliveryLink(order));
      setCopiedId(order.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setConfirmError((current) => ({ ...current, [order.id]: "تعذر نسخ الرابط. انسخه يدويًا." }));
    }
  }

  function sendDeliveryOnWhatsApp(order) {
    const phone = digitsOnly(order.buyerPhone);
    const from = storeName ? ` من ${storeName}` : "";
    const message = `طلبك "${order.productName || "منتجك"}"${from} في مُونَة جاهز! اضغط الرابط عشان تستلمه:\n${deliveryLink(order)}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function nudgeAbandonedOrder(order) {
    const phone = digitsOnly(order.buyerPhone);
    const from = storeName ? ` من ${storeName}` : "";
    const message = `مرحبًا! لاحظت انك بديت تطلب "${order.productName || "منتج"}"${from} ولسا ما اكتملت العملية. إذا واجهتك أي مشكلة أو عندك سؤال، تواصل معي وأساعدك تكمل طلبك.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  const pendingCount = orders.filter((order) => order.status === "awaiting_seller_confirmation").length;

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
      {staleDrafts.length > 0 && (
        <section className="ord-stalled">
          <b>طلبات متوقفة ({staleDrafts.length})</b>
          <p>عملاء بدأوا الطلب وما أكملوا الدفع أو رفع الإثبات. تواصل معهم يمكن يحتاجون مساعدة.</p>
          <div className="ord-stalled-list">
            {staleDrafts.map((order) => (
              <div key={order.id} className="ord-stalled-row">
                <div>
                  <div className="ord-product">{order.productName}</div>
                  <div className="ord-meta"><span>{order.buyerPhone}</span><span className="ord-date">· {formatDate(order.createdAt)}</span></div>
                </div>
                <button className="ord-wa-btn" type="button" onClick={() => nudgeAbandonedOrder(order)}>واتساب</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {pendingCount > 0 && (
        <div className="ord-error" style={{ background: "#FCE9C6", color: "#7A5A17" }}>
          عندك {pendingCount} طلب بانتظار مراجعة التحويل. افتح الإيصال، راجع وصول المبلغ بنفسك، ثم أكّد.
        </div>
      )}
      {orders.length === 0 && !loadError && (
        <div className="ord-empty">
          <b>ما عندك طلبات مكتملة الإرسال الآن</b>
          <span>بعد أن يرفع العميل إثبات التحويل، يظهر الطلب هنا للمراجعة.</span>
          {onAddProduct && <button className="ord-empty-btn" onClick={onAddProduct}>+ أضف منتج</button>}
        </div>
      )}

      {orders.length > 0 && <div className="ord-list">
      {orders.map((order) => {
        const pending = order.status === "awaiting_seller_confirmation";
        const confirmed = order.status === "confirmed";
        return (
          <article className={`ord-card${pending ? " pending" : ""}`} key={order.id}>
            <div className="ord-card-top">
              <span className="ord-id">#{order.id.slice(0, 8).toUpperCase()}</span>
              <span className={`ord-badge ${confirmed ? "done" : "pending"}`}>{confirmed ? "تم فتح التسليم" : "بانتظار مراجعة التحويل"}</span>
            </div>
            <div className="ord-product">{order.productName}</div>
            <div className="ord-meta">
              {order.buyerPhone && <a href={`https://wa.me/${digitsOnly(order.buyerPhone)}`} target="_blank" rel="noopener noreferrer">{order.buyerPhone}</a>}
            </div>
            <div className="ord-footer">
              <span className="ord-date">{formatDate(order.createdAt)}</span>
              <span className="ord-price mono">{Number(order.price || 0).toFixed(2)} ر.ع</span>
            </div>

            {pending && (
              <div className="ord-confirm-row">
                <div className="ord-confirm-note">تأكد من وصول التحويل من وسيلتك البنكية. هذا التأكيد يفتح التنزيل للعميل داخل مُونَة، ولا يرسل المنتج يدويًا.</div>
                {proofUrl[order.id] ? (
                  <a className="ord-proof-btn" href={proofUrl[order.id]} target="_blank" rel="noopener noreferrer">فتح الإيصال لمدة 5 دقائق</a>
                ) : (
                  <button className="ord-proof-btn" type="button" onClick={() => showProof(order.id)}>عرض إثبات التحويل</button>
                )}
                <button className="ord-confirm-btn" type="button" disabled={confirmingId === order.id} onClick={() => confirmPayment(order.id)}>
                  {confirmingId === order.id ? "جاري التأكيد..." : "تأكيد استلام المبلغ وفتح التنزيل"}
                </button>
                {confirmError[order.id] && <div className="ord-action-error">{confirmError[order.id]}</div>}
              </div>
            )}

            {confirmed && (
              <div className="ord-action-note">
                تم فتح التسليم لهذا العميل داخل مُونَة. <a href={`#receipt/${order.id}`}>عرض الفاتورة</a>
                {order.deliveryToken && (
                  <div style={{ marginTop: 8 }}>
                    <button className="ord-deliver-btn" type="button" onClick={() => sendDeliveryOnWhatsApp(order)}>إرسال رابط الاستلام عبر واتساب</button>
                    <button className="ord-proof-btn" type="button" onClick={() => copyDeliveryLink(order)}>{copiedId === order.id ? "تم نسخ الرابط" : "نسخ رابط الاستلام"}</button>
                  </div>
                )}
              </div>
            )}
            {confirmError[order.id] && !pending && <div className="ord-action-error">{confirmError[order.id]}</div>}
          </article>
        );
      })}
      </div>}
    </div>
  );
}
