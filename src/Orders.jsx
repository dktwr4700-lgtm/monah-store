import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase.js";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const styles = `
  .ord-wrap{padding:4px 0}.mono{font-family:'JetBrains Mono',monospace}.ord-top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:10px}.ord-title{font-family:'Almarai',sans-serif;font-weight:800;color:#0b0b0c;font-size:18px}.ord-title-en{color:#5A5648;font-size:11px;letter-spacing:.04em;text-transform:uppercase;margin-top:2px}.ord-count{background:#0b0b0c;color:#fff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:100px}.ord-stalled{position:relative;padding:2px 0 2px 4px;padding-right:14px;margin-bottom:20px;border-right:3px solid #9c6d1f}.ord-stalled b{display:block;font-size:13px;font-weight:700;color:#0b0b0c;margin-bottom:3px}.ord-stalled p{font-size:11.5px;color:#5A5648;line-height:1.8;margin:0 0 12px}.ord-stalled-list{border-top:1px solid #edeae0}.ord-stalled-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid #edeae0}.ord-stalled-row:last-child{border-bottom:0}.ord-wa-btn{border:1px solid #edeae0;background:none;color:#163f2e;font-family:'Cairo',sans-serif;font-weight:800;font-size:10.5px;padding:8px 13px;border-radius:100px;cursor:pointer;white-space:nowrap}.ord-settings{background:#fff8e9;border:1px solid #efd9ab;border-radius:16px;padding:15px;margin-bottom:14px}.ord-settings b{display:block;font-family:'Almarai',sans-serif;font-size:13px;margin-bottom:5px}.ord-settings p{font-size:11px;line-height:1.8;color:#735817;margin:0 0 9px}.ord-settings textarea{box-sizing:border-box;width:100%;min-height:82px;border:1px solid #dfd3b4;border-radius:10px;background:#fff;font-family:'Cairo',sans-serif;font-size:12px;padding:10px}.ord-settings button,.ord-confirm-btn,.ord-proof-btn,.ord-deliver-btn{border:0;border-radius:999px;background:#0b0b0c;color:#fff;font-family:'Cairo',sans-serif;font-size:11.5px;font-weight:800;padding:10px 14px;cursor:pointer;margin-top:8px}.ord-settings button:disabled,.ord-confirm-btn:disabled{opacity:.6;cursor:not-allowed}.ord-list{background:#fff;border:1px solid #edeae0;border-radius:16px;padding:0 18px;margin-bottom:12px}.ord-card{padding:18px 0;border-top:1px dashed #edeae0}.ord-card:first-child{border-top:none}.ord-card.pending{border-right:3px solid #e8bd69;padding-right:13px}.ord-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:8px}.ord-id{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#5A5648}.ord-badge{font-size:10.5px;font-weight:700;padding:4px 11px;border-radius:100px;white-space:nowrap}.ord-badge.done{background:#eaf0eb;color:#4b6152}.ord-badge.pending{background:#fce9c6;color:#7a5a17}.ord-product{font-weight:700;color:#0b0b0c;font-size:14.5px;margin-bottom:2px}.ord-meta{display:flex;align-items:center;gap:6px;color:#5A5648;font-size:12px;margin-top:10px}.ord-meta a{color:#163f2e;font-weight:700;text-decoration:none}.ord-footer{display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:12px;border-top:1px dashed #edeae0}.ord-date{color:#5A5648;font-size:11.5px}.ord-price{font-family:'JetBrains Mono',monospace;font-weight:700;color:#0b0b0c;font-size:14.5px}.ord-confirm-row{margin-top:12px;padding-top:12px;border-top:1px dashed #edeae0}.ord-confirm-note{color:#7a5a17;font-size:11.5px;line-height:1.8;margin-bottom:8px}.ord-proof-btn{background:#fff;border:1px solid #d8d4c8;color:#163f2e;margin-left:7px}.ord-deliver-btn{background:#25D366;margin-left:7px}.ord-action-note{color:#4b6152;font-size:11px;margin-top:8px;line-height:1.7}.ord-action-error{color:#b24c3a;font-size:11px;margin-top:8px;line-height:1.7}.ord-empty{text-align:center;padding:50px 20px;color:#7A766A}.ord-empty b{display:block;color:#0b0b0c;font-family:'Almarai',sans-serif;font-size:14px;margin-bottom:6px}.ord-empty span{font-size:12.5px}.ord-empty-btn{display:inline-flex;align-items:center;gap:6px;background:#0b0b0c;color:#fff;border:none;padding:11px 20px;border-radius:100px;font-weight:700;font-size:12.5px;cursor:pointer;margin-top:16px;font-family:'Cairo',sans-serif}.ord-error{background:#f6e9e5;color:#b24c3a;padding:12px 16px;border-radius:12px;font-size:12.5px;margin-bottom:14px;line-height:1.7}.ord-wrap button{transition:transform 100ms ease-out}.ord-wrap button:active{transform:scale(.96)}@media(max-width:480px){.ord-top{align-items:center;margin-bottom:14px}.ord-list{padding:0 14px}.ord-card{padding:15px 0}.ord-card-top{gap:8px}.ord-product{line-height:1.6}.ord-meta{align-items:flex-start;line-height:1.7;word-break:break-word}.ord-footer{gap:10px}.ord-confirm-btn,.ord-proof-btn,.ord-deliver-btn{width:100%;margin-left:0;min-height:42px}.ord-settings textarea{font-size:13px}}
`;

const ORD_T = {
  ar: {
    title: "الطلبات",
    genericOperationError: "تعذر تنفيذ العملية الآن.",
    loadOrdersError: "تعذر تحميل الطلبات الآن.",
    openProofError: "تعذر فتح الإيصال.",
    confirmError: "تعذر تأكيد استلام المبلغ.",
    copyLinkError: "تعذر نسخ الرابط. انسخه يدويًا.",
    deliveryReadyMessage: (productName, storeSuffix) => `طلبك "${productName}"${storeSuffix} في مُونَة جاهز! اضغط الرابط عشان تستلمه:\n`,
    yourProduct: "منتجك",
    fromStore: (storeName) => ` من ${storeName}`,
    nudgeMessage: (productName, storeSuffix) => `مرحبًا! لاحظت انك بديت تطلب "${productName}"${storeSuffix} ولسا ما اكتملت العملية. إذا واجهتك أي مشكلة أو عندك سؤال، تواصل معي وأساعدك تكمل طلبك.`,
    productFallback: "منتج",
    stalledOrders: (n) => `طلبات متوقفة (${n})`,
    stalledOrdersHint: "عملاء بدأوا الطلب وما أكملوا الدفع أو رفع الإثبات. تواصل معهم يمكن يحتاجون مساعدة.",
    whatsapp: "واتساب",
    pendingReviewCount: (n) => `عندك ${n} طلب بانتظار مراجعة التحويل. افتح الإيصال، راجع وصول المبلغ بنفسك، ثم أكّد.`,
    noCompletedOrdersTitle: "ما عندك طلبات مكتملة الإرسال الآن",
    noCompletedOrdersText: "بعد أن يرفع العميل إثبات التحويل، يظهر الطلب هنا للمراجعة.",
    addProductBtn: "+ أضف منتج",
    deliveryOpened: "تم فتح التسليم",
    awaitingReview: "بانتظار مراجعة التحويل",
    confirmTransferNote: "تأكد من وصول التحويل من وسيلتك البنكية. هذا التأكيد يفتح التنزيل للعميل داخل مُونَة، ولا يرسل المنتج يدويًا.",
    openProofFor5Min: "فتح الإيصال لمدة 5 دقائق",
    showProofBtn: "عرض إثبات التحويل",
    confirmingEllipsis: "جاري التأكيد...",
    confirmAndOpenDownload: "تأكيد استلام المبلغ وفتح التنزيل",
    deliveryOpenedNote: "تم فتح التسليم لهذا العميل داخل مُونَة.",
    viewInvoice: "عرض الفاتورة",
    sendDeliveryOnWhatsapp: "إرسال رابط الاستلام عبر واتساب",
    linkCopied: "تم نسخ الرابط",
    copyDeliveryLink: "نسخ رابط الاستلام",
    interactiveProductNote: "هذا الطلب فيه منتج تفاعلي (يشتغل من داخل الموقع). العميل يضغط \"العب الآن\" من صفحة \"طلباتي\" ويشغّله مباشرة، بدون ما يحتاج ينزّل أي ملف.",
  },
  en: {
    title: "Orders",
    genericOperationError: "Couldn't complete the operation right now.",
    loadOrdersError: "Couldn't load orders right now.",
    openProofError: "Couldn't open the receipt.",
    confirmError: "Couldn't confirm receiving the payment.",
    copyLinkError: "Couldn't copy the link. Copy it manually.",
    deliveryReadyMessage: (productName, storeSuffix) => `Your order "${productName}"${storeSuffix} on Monah is ready! Click the link to receive it:\n`,
    yourProduct: "your product",
    fromStore: (storeName) => ` from ${storeName}`,
    nudgeMessage: (productName, storeSuffix) => `Hi! I noticed you started ordering "${productName}"${storeSuffix} but didn't finish. If you ran into any issue or have a question, reach out and I'll help you complete your order.`,
    productFallback: "product",
    stalledOrders: (n) => `Stalled orders (${n})`,
    stalledOrdersHint: "Customers started an order but didn't complete payment or upload proof. Reach out — they might need help.",
    whatsapp: "WhatsApp",
    pendingReviewCount: (n) => `You have ${n} order(s) awaiting transfer review. Open the receipt, verify the amount arrived yourself, then confirm.`,
    noCompletedOrdersTitle: "You don't have any submitted orders yet",
    noCompletedOrdersText: "Once a customer uploads proof of transfer, the order will appear here for review.",
    addProductBtn: "+ Add product",
    deliveryOpened: "Delivery opened",
    awaitingReview: "Awaiting transfer review",
    confirmTransferNote: "Make sure the transfer arrived through your banking method. This confirmation opens the download for the customer inside Monah, and doesn't send the product manually.",
    openProofFor5Min: "Open the receipt for 5 minutes",
    showProofBtn: "Show proof of transfer",
    confirmingEllipsis: "Confirming...",
    confirmAndOpenDownload: "Confirm receipt and open download",
    deliveryOpenedNote: "Delivery was opened for this customer inside Monah.",
    viewInvoice: "View invoice",
    sendDeliveryOnWhatsapp: "Send pickup link via WhatsApp",
    linkCopied: "Link copied",
    copyDeliveryLink: "Copy pickup link",
    interactiveProductNote: "This order includes an interactive product (runs inside the site). The customer clicks \"Play now\" from the \"My orders\" page to run it directly, without needing to download any file.",
  },
};

function formatDate(ts, lang) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleDateString(lang === "en" ? "en-GB" : "ar-OM", { day: "numeric", month: "short", year: "numeric" });
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function deliveryLink(order) {
  return `${window.location.origin}/#deliver/${order.id}/${order.deliveryToken}`;
}

async function orderRequest(action, payload, t) {
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t.genericOperationError);
  return data;
}

const STALE_DRAFT_MS = 30 * 60 * 1000;

export default function Orders({ ownerId, onAddProduct, storeName, lang = "ar" }) {
  const t = ORD_T[lang];
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
    }, () => setLoadError(t.loadOrdersError));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  async function showProof(orderId) {
    setConfirmError((current) => ({ ...current, [orderId]: "" }));
    try {
      const data = await orderRequest("proof_url", { orderId }, t);
      setProofUrl((current) => ({ ...current, [orderId]: data.url }));
    } catch (requestError) {
      setConfirmError((current) => ({ ...current, [orderId]: requestError.message || t.openProofError }));
    }
  }

  async function confirmPayment(orderId) {
    setConfirmingId(orderId);
    setConfirmError((current) => ({ ...current, [orderId]: "" }));
    try {
      await orderRequest("confirm", { orderId }, t);
    } catch (requestError) {
      setConfirmError((current) => ({ ...current, [orderId]: requestError.message || t.confirmError }));
    }
    setConfirmingId("");
  }

  async function copyDeliveryLink(order) {
    try {
      await navigator.clipboard.writeText(deliveryLink(order));
      setCopiedId(order.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setConfirmError((current) => ({ ...current, [order.id]: t.copyLinkError }));
    }
  }

  function sendDeliveryOnWhatsApp(order) {
    const phone = digitsOnly(order.buyerPhone);
    const from = storeName ? t.fromStore(storeName) : "";
    const message = t.deliveryReadyMessage(order.productName || t.yourProduct, from) + deliveryLink(order);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function nudgeAbandonedOrder(order) {
    const phone = digitsOnly(order.buyerPhone);
    const from = storeName ? t.fromStore(storeName) : "";
    const message = t.nudgeMessage(order.productName || t.productFallback, from);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  const pendingCount = orders.filter((order) => order.status === "awaiting_seller_confirmation").length;

  return (
    <div className="ord-wrap" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <div className="ord-top">
        <div>
          <div className="ord-title">{t.title}</div>
          <div className="ord-title-en">Orders</div>
        </div>
        <div className="ord-count mono">{orders.length}</div>
      </div>

      {loadError && <div className="ord-error">{loadError}</div>}
      {staleDrafts.length > 0 && (
        <section className="ord-stalled">
          <b>{t.stalledOrders(staleDrafts.length)}</b>
          <p>{t.stalledOrdersHint}</p>
          <div className="ord-stalled-list">
            {staleDrafts.map((order) => (
              <div key={order.id} className="ord-stalled-row">
                <div>
                  <div className="ord-product">{order.productName}</div>
                  <div className="ord-meta"><span>{order.buyerPhone}</span><span className="ord-date">· {formatDate(order.createdAt, lang)}</span></div>
                </div>
                <button className="ord-wa-btn" type="button" onClick={() => nudgeAbandonedOrder(order)}>{t.whatsapp}</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {pendingCount > 0 && (
        <div className="ord-error" style={{ background: "#FCE9C6", color: "#7A5A17" }}>
          {t.pendingReviewCount(pendingCount)}
        </div>
      )}
      {orders.length === 0 && !loadError && (
        <div className="ord-empty">
          <b>{t.noCompletedOrdersTitle}</b>
          <span>{t.noCompletedOrdersText}</span>
          {onAddProduct && <button className="ord-empty-btn" onClick={onAddProduct}>{t.addProductBtn}</button>}
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
              <span className={`ord-badge ${confirmed ? "done" : "pending"}`}>{confirmed ? t.deliveryOpened : t.awaitingReview}</span>
            </div>
            <div className="ord-product">{order.productName}</div>
            <div className="ord-meta">
              {order.buyerPhone && <a href={`https://wa.me/${digitsOnly(order.buyerPhone)}`} target="_blank" rel="noopener noreferrer">{order.buyerPhone}</a>}
            </div>
            <div className="ord-footer">
              <span className="ord-date">{formatDate(order.createdAt, lang)}</span>
              <span className="ord-price mono">{Number(order.price || 0).toFixed(2)} {lang === "ar" ? "ر.ع" : "OMR"}</span>
            </div>

            {pending && (
              <div className="ord-confirm-row">
                <div className="ord-confirm-note">{t.confirmTransferNote}</div>
                {proofUrl[order.id] ? (
                  <a className="ord-proof-btn" href={proofUrl[order.id]} target="_blank" rel="noopener noreferrer">{t.openProofFor5Min}</a>
                ) : (
                  <button className="ord-proof-btn" type="button" onClick={() => showProof(order.id)}>{t.showProofBtn}</button>
                )}
                <button className="ord-confirm-btn" type="button" disabled={confirmingId === order.id} onClick={() => confirmPayment(order.id)}>
                  {confirmingId === order.id ? t.confirmingEllipsis : t.confirmAndOpenDownload}
                </button>
                {confirmError[order.id] && <div className="ord-action-error">{confirmError[order.id]}</div>}
              </div>
            )}

            {confirmed && (
              <div className="ord-action-note">
                {t.deliveryOpenedNote} <a href={`#receipt/${order.id}`}>{t.viewInvoice}</a>
                {order.deliveryToken && (
                  <div style={{ marginTop: 8 }}>
                    <button className="ord-deliver-btn" type="button" onClick={() => sendDeliveryOnWhatsApp(order)}>{t.sendDeliveryOnWhatsapp}</button>
                    <button className="ord-proof-btn" type="button" onClick={() => copyDeliveryLink(order)}>{copiedId === order.id ? t.linkCopied : t.copyDeliveryLink}</button>
                  </div>
                )}
                {Array.isArray(order.activationRequiredProductIds) && order.activationRequiredProductIds.length > 0 && (
                  <div className="ord-confirm-note" style={{ marginTop: 8 }}>
                    {t.interactiveProductNote}
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
