import React, { useState } from "react";
import { auth, ensureAnonymousAuth, storage } from "./firebase.js";
import { ref, uploadBytes } from "firebase/storage";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const styles = `
  .ppo-start{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:22px;border:0;border-radius:999px;padding:14px 17px;background:var(--pp-brand);color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer}.ppo-start:disabled{background:#d7d4cb;color:#777;cursor:not-allowed}.ppo-sheet{margin-top:18px;padding:16px;border:1px solid #e7e3d8;border-radius:16px;background:#fbfaf7}.ppo-step{font-size:10px;font-weight:800;color:var(--pp-brand);margin-bottom:7px}.ppo-title{font-family:'Almarai',sans-serif;font-size:14px;font-weight:800;color:#111;margin-bottom:7px}.ppo-copy{font-size:11.5px;line-height:1.85;color:#5b5750}.ppo-instructions{white-space:pre-line;background:#fff;border:1px dashed #d8d4c8;border-radius:12px;padding:11px;font-size:11.5px;line-height:1.9;color:#383630;margin:12px 0}.ppo-field{margin-top:12px}.ppo-field label{display:block;font-size:11px;color:#6e695f;font-weight:800;margin-bottom:6px}.ppo-field input{box-sizing:border-box;width:100%;border:1px solid #ddd8cc;border-radius:10px;padding:11px 12px;background:#fff;color:#111;font-family:inherit;font-size:12.5px}.ppo-file{display:block;width:100%;box-sizing:border-box;border:1px dashed #c9c3b5;border-radius:12px;background:#fff;padding:11px;font-family:inherit;font-size:11.5px}.ppo-actions{display:flex;gap:8px;margin-top:13px}.ppo-primary,.ppo-secondary{flex:1;border-radius:999px;padding:11px 12px;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer}.ppo-primary{border:0;background:#111;color:#fff}.ppo-secondary{border:1px solid #d8d4c8;background:#fff;color:#3d4a66}.ppo-primary:disabled,.ppo-secondary:disabled{opacity:.6;cursor:not-allowed}.ppo-error,.ppo-success{margin-top:11px;border-radius:10px;padding:9px 10px;font-size:11px;line-height:1.7}.ppo-error{background:#f6e9e5;color:#b24c3a}.ppo-success{background:#eaf0eb;color:#42634a}.ppo-small{font-size:10px;line-height:1.7;color:#89857a;margin:11px 2px 0}.ppo-orders-link{display:inline-block;margin-top:10px;color:var(--pp-brand);font-size:11px;font-weight:800;text-decoration:none}@media(max-width:680px){.ppo-actions{flex-direction:column}.ppo-primary,.ppo-secondary{min-height:42px}}
`;

async function orderRequest(action, payload) {
  const user = auth.currentUser;
  if (!user) throw new Error("تعذر بدء جلسة آمنة للطلب.");
  const idToken = await user.getIdToken();
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تنفيذ الطلب الآن.");
  return data;
}

function safeName(name) {
  return String(name || "receipt").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "receipt";
}

export default function ProductOrderPanel({ product }) {
  const [open, setOpen] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [order, setOrder] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function startOrder() {
    setError("");
    const email = buyerEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("اكتب بريدك الإلكتروني بشكل صحيح.");
      return;
    }
    setBusy(true);
    try {
      await ensureAnonymousAuth();
      const data = await orderRequest("create", { productId: product.id, buyerEmail: email, couponCode: couponCode.trim() });
      setOrder(data.order);
    } catch (requestError) {
      setError(requestError.message || "تعذر بدء الطلب الآن.");
    }
    setBusy(false);
  }

  function chooseProof(event) {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    if (!nextFile) return setProofFile(null);
    if (!ACCEPTED_TYPES.includes(nextFile.type) || nextFile.size < 1 || nextFile.size >= MAX_PROOF_BYTES) {
      setProofFile(null);
      setError("اختر JPG أو PNG أو WEBP أو PDF بحجم أقل من 5 م.ب.");
      event.target.value = "";
      return;
    }
    setProofFile(nextFile);
  }

  async function uploadProof() {
    if (!order || !proofFile || !auth.currentUser) {
      setError("اختر إثبات التحويل أولًا.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const filename = safeName(proofFile.name);
      const proofPath = `payment-proofs/${auth.currentUser.uid}/${order.id}/${Date.now()}_${filename}`;
      await uploadBytes(ref(storage, proofPath), proofFile, { contentType: proofFile.type });
      await orderRequest("submit_proof", { orderId: order.id, proofPath, proofName: filename });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || "تعذر رفع الإثبات الآن.");
    }
    setBusy(false);
  }

  if (!open) {
    return <><style>{styles}</style><button type="button" className="ppo-start" onClick={() => setOpen(true)}>اطلب المنتج داخل مُونَة</button></>;
  }

  return (
    <section className="ppo-sheet" aria-live="polite">
      <style>{styles}</style>
      {complete ? <>
        <div className="ppo-step">تم إرسال الإثبات</div>
        <div className="ppo-title">طلبك بانتظار مراجعة التاجر</div>
        <div className="ppo-copy">عند تأكيد التاجر استلام التحويل، يفتح زر تنزيل المنتج هنا في مُونَة.</div>
        <div className="ppo-success">لا يتم تأكيد التحويل تلقائيًا. التاجر يراجعه بنفسه.</div>
        <a className="ppo-orders-link" href="#purchases">متابعة طلباتي</a>
      </> : !order ? <>
        <div className="ppo-step">1 من 2 · إنشاء الطلب</div>
        <div className="ppo-title">اكتب بريدك للطلب</div>
        <div className="ppo-copy">تستخدمه كتفاصيل للطلب لدى التاجر. لا تدخل كلمة مرور أو رمز تحقق.</div>
        <div className="ppo-field"><label htmlFor="buyer-email">البريد الإلكتروني</label><input id="buyer-email" type="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" /></div>
        <div className="ppo-field"><label htmlFor="coupon-code">كود الخصم (اختياري)</label><input id="coupon-code" type="text" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="اتركه فارغًا إذا ما عندك كود" /></div>
        {error && <div className="ppo-error">{error}</div>}
        <div className="ppo-actions"><button type="button" className="ppo-secondary" onClick={() => setOpen(false)} disabled={busy}>رجوع</button><button type="button" className="ppo-primary" onClick={startOrder} disabled={busy}>{busy ? "جاري التجهيز..." : "متابعة للتحويل"}</button></div>
        <div className="ppo-small">في نسخة التجربة، متابعة الطلب والتنزيل مرتبطة بهذا الجهاز والمتصفح.</div>
      </> : <>
        <div className="ppo-step">2 من 2 · التحويل ورفع الإثبات</div>
        <div className="ppo-title">تعليمات التحويل</div>
        {order.couponCode ? (
          <div className="ppo-success">تم تطبيق كوبون {order.couponCode}. المبلغ المطلوب تحويله: {order.price.toFixed(2)} ر.ع بدل {order.originalPrice.toFixed(2)} ر.ع.</div>
        ) : (
          <div className="ppo-copy">المبلغ المطلوب تحويله: <b>{order.price.toFixed(2)} ر.ع</b></div>
        )}
        <div className="ppo-instructions">{order.paymentInstructions}</div>
        <div className="ppo-copy">بعد التحويل، ارفع صورة أو PDF للإثبات. يظهر الإيصال للتاجر فقط لمراجعته.</div>
        <div className="ppo-field"><label htmlFor="payment-proof">إثبات التحويل</label><input id="payment-proof" className="ppo-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={chooseProof} /></div>
        {proofFile && <div className="ppo-small">تم اختيار: {proofFile.name}</div>}
        {error && <div className="ppo-error">{error}</div>}
        <div className="ppo-actions"><button type="button" className="ppo-secondary" onClick={() => setOpen(false)} disabled={busy}>أكمل لاحقًا</button><button type="button" className="ppo-primary" onClick={uploadProof} disabled={busy || !proofFile}>{busy ? "جاري رفع الإثبات..." : "إرسال الإثبات للتاجر"}</button></div>
        <div className="ppo-small">لا تضغط الإرسال إلا بعد إتمام التحويل. لا تطلب مُونَة كلمات المرور أو رموز التحقق.</div>
      </>}
    </section>
  );
}
