import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase.js";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const styles = `
  .ord-wrap{padding:4px 0}.mono{font-family:'JetBrains Mono',monospace}.ord-top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:10px}.ord-title{font-family:'Almarai',sans-serif;font-weight:800;color:#0b0b0c;font-size:18px}.ord-title-en{color:#8a8677;font-size:11px;letter-spacing:.04em;text-transform:uppercase;margin-top:2px}.ord-count{background:#0b0b0c;color:#fff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:100px}.ord-settings{background:#fff8e9;border:1px solid #efd9ab;border-radius:16px;padding:15px;margin-bottom:14px}.ord-settings b{display:block;font-family:'Almarai',sans-serif;font-size:13px;margin-bottom:5px}.ord-settings p{font-size:11px;line-height:1.8;color:#735817;margin:0 0 9px}.ord-settings textarea{box-sizing:border-box;width:100%;min-height:82px;border:1px solid #dfd3b4;border-radius:10px;background:#fff;font-family:'Cairo',sans-serif;font-size:12px;padding:10px}.ord-settings button,.ord-confirm-btn,.ord-proof-btn{border:0;border-radius:999px;background:#0b0b0c;color:#fff;font-family:'Cairo',sans-serif;font-size:11.5px;font-weight:800;padding:10px 14px;cursor:pointer;margin-top:8px}.ord-settings button:disabled,.ord-confirm-btn:disabled{opacity:.6;cursor:not-allowed}.ord-card{background:#fff;border:1px solid #edeae0;border-radius:16px;padding:18px;margin-bottom:12px}.ord-card.pending{border:1.5px solid #e8bd69}.ord-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:8px}.ord-id{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#8a8677}.ord-badge{font-size:10.5px;font-weight:700;padding:4px 11px;border-radius:100px;white-space:nowrap}.ord-badge.done{background:#eaf0eb;color:#4b6152}.ord-badge.pending{background:#fce9c6;color:#7a5a17}.ord-product{font-weight:700;color:#0b0b0c;font-size:14.5px;margin-bottom:2px}.ord-meta{display:flex;align-items:center;gap:6px;color:#8a8677;font-size:12px;margin-top:10px}.ord-footer{display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:12px;border-top:1px dashed #edeae0}.ord-date{color:#b0ac9c;font-size:11px}.ord-price{font-family:'JetBrains Mono',monospace;font-weight:700;color:#0b0b0c;font-size:14.5px}.ord-confirm-row{margin-top:12px;padding-top:12px;border-top:1px dashed #edeae0}.ord-confirm-note{color:#7a5a17;font-size:11.5px;line-height:1.8;margin-bottom:8px}.ord-proof-btn{background:#fff;border:1px solid #d8d4c8;color:#163f2e;margin-left:7px}.ord-action-note{color:#4b6152;font-size:11px;margin-top:8px;line-height:1.7}.ord-action-error{color:#b24c3a;font-size:11px;margin-top:8px;line-height:1.7}.ord-empty{text-align:center;padding:50px 20px;color:#b0ac9c}.ord-empty b{display:block;color:#0b0b0c;font-family:'Almarai',sans-serif;font-size:14px;margin-bottom:6px}.ord-empty span{font-size:12.5px}.ord-empty-btn{display:inline-flex;align-items:center;gap:6px;background:#0b0b0c;color:#fff;border:none;padding:11px 20px;border-radius:100px;font-weight:700;font-size:12.5px;cursor:pointer;margin-top:16px;font-family:'Cairo',sans-serif}.ord-error{background:#f6e9e5;color:#b24c3a;padding:12px 16px;border-radius:12px;font-size:12.5px;margin-bottom:14px;line-height:1.7}.ord-wrap button{transition:transform 100ms ease-out}.ord-wrap button:active{transform:scale(.96)}@media(max-width:390px){.ord-top{align-items:center;margin-bottom:14px}.ord-card{padding:15px}.ord-card-top{gap:8px}.ord-product{line-height:1.6}.ord-meta{align-items:flex-start;line-height:1.7;word-break:break-word}.ord-footer{gap:10px}.ord-confirm-btn,.ord-proof-btn{width:100%;margin-left:0;min-height:42px}.ord-settings textarea{font-size:13px}}
`;

function formatDate(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleDateString("ar-OM", { day: "numeric", month: "short", year: "numeric" });
}

async function orderRequest(action, payload) {
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تنفيذ العملية الآن.");
  return data;
}

export default function Orders({ ownerId, onAddProduct, paymentInstructions, onPaymentInstructionsSaved }) {
  const [orders, setOrders] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [confirmError, setConfirmError] = useState({});
  const [proofUrl, setProofUrl] = useState({});
  const [instructions, setInstructions] = useState(paymentInstructions || "");
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => setInstructions(paymentInstructions || ""), [paymentInstructions]);
  useEffect(() => {
    if (!ownerId) return;
    const q = query(collection(db, "orders"), where("ownerId", "==", ownerId));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.status !== "draft");
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(list);
      setLoadError("");
    }, () => setLoadError("تعذر تحميل الطلبات الآن."));
  }, [ownerId]);

  async function saveInstructions() {
    setSavingInstructions(true);
    setSettingsMessage("");
    try {
      const data = await orderRequest("save_payment_instructions", { paymentInstructions: instructions });
      onPaymentInstructionsSaved?.(data.paymentInstructions);
      setSettingsMessage("تم حفظ تعليمات التحويل. تظهر للمشتري بعد بدء الطلب فقط.");
    } catch (requestError) {
      setSettingsMessage(requestError.message || "تعذر حفظ التعليمات الآن.");
    }
    setSavingInstructions(false);
  }

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

  const pendingCount = orders.filter((order) => order.status === "awaiting_seller_confirmation").length;
  return <div className="ord-wrap" dir="rtl" lang="ar"><style>{styles}</style><div className="ord-top"><div><div className="ord-title">الطلبات</div><div className="ord-title-en">Orders</div></div><div className="ord-count mono">{orders.length}</div></div><section className="ord-settings"><b>تعليمات التحويل لعملائك</b><p>اكتب بيانات التحويل التي تريد أن تظهر للمشتري داخل الطلب. لا تضع كلمة مرور أو رمز تحقق.</p><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="مثال: حوّل المبلغ إلى الحساب ... ثم ارفع إثبات التحويل هنا." maxLength={800} /><button type="button" disabled={savingInstructions} onClick={saveInstructions}>{savingInstructions ? "جاري الحفظ..." : "حفظ تعليمات التحويل"}</button>{settingsMessage && <div className={settingsMessage.startsWith("تم") ? "ord-action-note" : "ord-action-error"}>{settingsMessage}</div>}</section>{loadError && <div className="ord-error">{loadError}</div>}{pendingCount > 0 && <div className="ord-error" style={{ background: "#FCE9C6", color: "#7A5A17" }}>عندك {pendingCount} طلب بانتظار مراجعة التحويل. افتح الإيصال، راجع وصول المبلغ بنفسك، ثم أكّد.</div>}{orders.length === 0 && !loadError && <div className="ord-empty"><b>ما عندك طلبات مكتملة الإرسال الآن</b><span>بعد أن يرفع العميل إثبات التحويل، يظهر الطلب هنا للمراجعة.</span>{onAddProduct && <button className="ord-empty-btn" onClick={onAddProduct}>+ أضف منتج</button>}</div>}{orders.map((order) => { const pending = order.status === "awaiting_seller_confirmation"; const confirmed = order.status === "confirmed"; return <article className={`ord-card${pending ? " pending" : ""}`} key={order.id}><div className="ord-card-top"><span className="ord-id">#{order.id.slice(0, 8).toUpperCase()}</span><span className={`ord-badge ${confirmed ? "done" : "pending"}`}>{confirmed ? "تم فتح التسليم" : "بانتظار مراجعة التحويل"}</span></div><div className="ord-product">{order.productName}</div><div className="ord-meta"><span>{order.buyerEmail}</span></div><div className="ord-footer"><span className="ord-date">{formatDate(order.createdAt)}</span><span className="ord-price mono">{Number(order.price || 0).toFixed(2)} ر.ع</span></div>{pending && <div className="ord-confirm-row"><div className="ord-confirm-note">تأكد من وصول التحويل من وسيلتك البنكية. هذا التأكيد يفتح التنزيل للعميل داخل مُونَة، ولا يرسل المنتج يدويًا.</div>{proofUrl[order.id] ? <a className="ord-proof-btn" href={proofUrl[order.id]} target="_blank" rel="noopener noreferrer">فتح الإيصال لمدة 5 دقائق</a> : <button className="ord-proof-btn" type="button" onClick={() => showProof(order.id)}>عرض إثبات التحويل</button>}<button className="ord-confirm-btn" type="button" disabled={confirmingId === order.id} onClick={() => confirmPayment(order.id)}>{confirmingId === order.id ? "جاري التأكيد..." : "تأكيد استلام المبلغ وفتح التنزيل"}</button>{confirmError[order.id] && <div className="ord-action-error">{confirmError[order.id]}</div>}</div>}{confirmed && <div className="ord-action-note">تم فتح التسليم لهذا العميل فقط داخل مُونَة.</div>}</article>; })}</div>;
}
