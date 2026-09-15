import React, { useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";
import { storage } from "./firebase-storage.js";
import { ref, uploadBytes } from "firebase/storage";

const PPO_T = {
  ar: {
    secureSessionError: "تعذر بدء جلسة آمنة للطلب.", genericActionError: "تعذر تنفيذ الطلب الآن.",
    invalidPhone: "اكتب رقم واتسابك بشكل صحيح.", invalidEmail: "اكتب إيميلك بشكل صحيح، أو اتركه فارغًا.",
    startOrderError: "تعذر بدء الطلب الآن.",
    invalidProof: "اختر JPG أو PNG أو WEBP أو PDF بحجم أقل من 5 م.ب.",
    cardPayError: "تعذر بدء الدفع بالبطاقة الآن.", chooseProofFirst: "اختر إثبات التحويل أولًا.",
    uploadProofError: "تعذر رفع الإثبات الآن.",
    soldOut: "نفذت الكمية حاليًا", orderNow: "أطلب الآن",
    proofSentStep: "تم إرسال الإثبات", proofSentTitle: "طلبك بانتظار مراجعة التاجر",
    proofSentCopy: "عند تأكيد التاجر استلام التحويل، يفتح زر تنزيل المنتج هنا في مُونَة.",
    proofSentSuccess: "لا يتم تأكيد التحويل تلقائيًا. التاجر يراجعه بنفسه.",
    notifySeller: "نبّه التاجر الآن عبر واتساب", myOrders: "متابعة طلباتي",
    step1: "1 من 2 · إنشاء الطلب", step1Title: "اكتب رقم واتسابك للطلب",
    step1Copy: "التاجر يرسل لك رابط استلام منتجك على هذا الرقم بعد ما يأكد استلام التحويل. لا تدخل كلمة مرور أو رمز تحقق.",
    whatsappLabel: "رقم واتساب", emailLabel: "إيميلك (اختياري)", emailPlaceholder: "لاستلام رابط التنزيل تلقائيًا بعد التأكيد",
    couponLabel: "كود الخصم (اختياري)", couponPlaceholder: "اتركه فارغًا إذا ما عندك كود",
    back: "رجوع", preparing: "جاري التجهيز...", continueToTransfer: "متابعة للتحويل",
    trialNote: "في نسخة التجربة، متابعة الطلب والتنزيل مرتبطة بهذا الجهاز والمتصفح، وتقدر أيضًا تستلم رابط منتجك على واتساب.",
    step2: "2 من 2 · الدفع",
    choosePaymentMethod: "اختر طريقة الدفع", payByCardTitle: "ادفع بالبطاقة", transferDirect: "حوّل المبلغ للتاجر مباشرة",
    couponApplied: (code, price, original) => `تم تطبيق كوبون ${code}. المبلغ المطلوب: ${price} ر.ع بدل ${original} ر.ع.`,
    amountDue: "المبلغ المطلوب:",
    payingByCard: "جاري التحويل لصفحة الدفع...", payByCardNow: "ادفع الآن بالبطاقة", orTransferManually: "— أو حوّل يدويًا —",
    bank: "البنك", accountHolder: "صاحب الحساب", accountNumber: "رقم الحساب", phoneNumber: "رقم الجوال",
    copied: "تم النسخ", copy: "نسخ",
    manualTransferNote: "بعد التحويل اليدوي، ارفع صورة أو PDF للإثبات. يظهر الإيصال للتاجر فقط لمراجعته.",
    proofLabel: "إثبات التحويل", proofChosen: (name) => `تم اختيار: ${name}`,
    finishLater: "أكمل لاحقًا", uploadingProof: "جاري رفع الإثبات...", sendProofToSeller: "إرسال الإثبات للتاجر",
    manualTransferWarning: "لا تضغط الإرسال إلا بعد إتمام التحويل. لا تطلب مُونَة كلمات المرور أو رموز التحقق.",
  },
  en: {
    secureSessionError: "Couldn't start a secure session for the order.", genericActionError: "Couldn't complete the order right now.",
    invalidPhone: "Enter a valid WhatsApp number.", invalidEmail: "Enter a valid email, or leave it blank.",
    startOrderError: "Couldn't start the order right now.",
    invalidProof: "Choose a JPG, PNG, WEBP, or PDF under 5 MB.",
    cardPayError: "Couldn't start the card payment right now.", chooseProofFirst: "Choose your proof of transfer first.",
    uploadProofError: "Couldn't upload the proof right now.",
    soldOut: "Currently out of stock", orderNow: "Order now",
    proofSentStep: "Proof sent", proofSentTitle: "Your order is awaiting seller review",
    proofSentCopy: "Once the seller confirms they received the transfer, the download button will unlock here on Monah.",
    proofSentSuccess: "Transfers aren't confirmed automatically — the seller reviews them personally.",
    notifySeller: "Notify the seller now via WhatsApp", myOrders: "Track my orders",
    step1: "Step 1 of 2 · Create order", step1Title: "Enter your WhatsApp number to order",
    step1Copy: "The seller will send your product link to this number once they confirm the transfer. Never enter a password or verification code.",
    whatsappLabel: "WhatsApp number", emailLabel: "Your email (optional)", emailPlaceholder: "To get your download link automatically once confirmed",
    couponLabel: "Discount code (optional)", couponPlaceholder: "Leave blank if you don't have one",
    back: "Back", preparing: "Preparing...", continueToTransfer: "Continue to payment",
    trialNote: "In this trial version, tracking your order and download is tied to this device and browser — you can also receive your product link on WhatsApp.",
    step2: "Step 2 of 2 · Payment",
    choosePaymentMethod: "Choose a payment method", payByCardTitle: "Pay by card", transferDirect: "Transfer directly to the seller",
    couponApplied: (code, price, original) => `Coupon ${code} applied. Amount due: ${price} OMR instead of ${original} OMR.`,
    amountDue: "Amount due:",
    payingByCard: "Redirecting to payment page...", payByCardNow: "Pay now by card", orTransferManually: "— or transfer manually —",
    bank: "Bank", accountHolder: "Account holder", accountNumber: "Account number", phoneNumber: "Phone number",
    copied: "Copied", copy: "Copy",
    manualTransferNote: "After the manual transfer, upload a photo or PDF as proof. The receipt is only shown to the seller for review.",
    proofLabel: "Proof of transfer", proofChosen: (name) => `Selected: ${name}`,
    finishLater: "Finish later", uploadingProof: "Uploading proof...", sendProofToSeller: "Send proof to seller",
    manualTransferWarning: "Only submit after completing the transfer. Monah never asks for passwords or verification codes.",
  },
};

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const styles = `
  .ppo-start{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:22px;border:0;border-radius:999px;padding:14px 17px;background:var(--pp-brand);color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer}.ppo-start:disabled{background:#d7d4cb;color:#777;cursor:not-allowed}.ppo-sheet{margin-top:18px;padding:16px;border:1px solid #e7e3d8;border-radius:16px;background:#fbfaf7}.ppo-step{font-size:10px;font-weight:800;color:var(--pp-brand);margin-bottom:7px}.ppo-title{font-family:'Almarai',sans-serif;font-size:14px;font-weight:800;color:#111;margin-bottom:7px}.ppo-copy{font-size:11.5px;line-height:1.85;color:#5b5750}.ppo-instructions{white-space:pre-line;background:#fff;border:1px dashed #d8d4c8;border-radius:12px;padding:11px;font-size:11.5px;line-height:1.9;color:#383630;margin:12px 0}.ppo-pay-card{background:#fff;border:1px solid #e7e3d8;border-radius:12px;padding:4px 12px;margin:12px 0}.ppo-pay-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #f0ede4}.ppo-pay-row:last-child{border-bottom:0}.ppo-pay-label{font-size:10.5px;color:#89857a;font-weight:700;flex-shrink:0}.ppo-pay-value{font-family:monospace;font-size:12.5px;color:#111;direction:ltr;text-align:left;word-break:break-all}.ppo-pay-copy{flex-shrink:0;border:1px solid #d8d4c8;background:#fbfaf7;color:#3d4a66;border-radius:100px;padding:5px 11px;font-family:inherit;font-size:10.5px;font-weight:800;cursor:pointer}.ppo-field{margin-top:12px}.ppo-field label{display:block;font-size:11px;color:#6e695f;font-weight:800;margin-bottom:6px}.ppo-field input{box-sizing:border-box;width:100%;border:1px solid #ddd8cc;border-radius:10px;padding:11px 12px;background:#fff;color:#111;font-family:inherit;font-size:12.5px}.ppo-file{display:block;width:100%;box-sizing:border-box;border:1px dashed #c9c3b5;border-radius:12px;background:#fff;padding:11px;font-family:inherit;font-size:11.5px}.ppo-actions{display:flex;gap:8px;margin-top:13px}.ppo-primary,.ppo-secondary{flex:1;border-radius:999px;padding:11px 12px;font-family:inherit;font-size:11.5px;font-weight:800;cursor:pointer}.ppo-primary{border:0;background:#111;color:#fff}.ppo-secondary{border:1px solid #d8d4c8;background:#fff;color:#3d4a66}.ppo-primary:disabled,.ppo-secondary:disabled{opacity:.6;cursor:not-allowed}.ppo-error,.ppo-success{margin-top:11px;border-radius:10px;padding:9px 10px;font-size:11px;line-height:1.7}.ppo-error{background:#f6e9e5;color:#b24c3a}.ppo-success{background:#eaf0eb;color:#42634a}.ppo-small{font-size:10px;line-height:1.7;color:#89857a;margin:11px 2px 0}.ppo-orders-link{display:inline-block;margin-top:10px;color:var(--pp-brand);font-size:11px;font-weight:800;text-decoration:none}@media(max-width:680px){.ppo-actions{flex-direction:column}.ppo-primary,.ppo-secondary{min-height:42px}}
`;

async function orderRequest(action, payload, t) {
  const user = auth.currentUser;
  if (!user) throw new Error(t.secureSessionError);
  const idToken = await user.getIdToken();
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t.genericActionError);
  return data;
}

function safeName(name) {
  return String(name || "receipt").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "receipt";
}

function notifySellerLink(sellerWhatsapp, itemName) {
  const digits = String(sellerWhatsapp || "").replace(/\D/g, "");
  if (!digits) return "";
  const message = `مرحبًا، طلبت "${itemName || "منتج"}" من متجرك على مُونَة وأرسلت إثبات التحويل. الرجاء مراجعة الطلب وتأكيده من لوحة التاجر.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function ProductOrderPanel({ product, bundle, sellerWhatsapp, lang = "ar" }) {
  const t = PPO_T[lang] || PPO_T.ar;
  const curr = lang === "ar" ? "ر.ع" : "OMR";
  const isBundle = Boolean(bundle);
  const item = isBundle ? bundle : product;
  const notifyLink = notifySellerLink(sellerWhatsapp, item?.name);
  const [open, setOpen] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [order, setOrder] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  function copyPaymentField(value, key) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(key);
      setTimeout(() => setCopiedField(""), 1500);
    });
  }

  async function startOrder() {
    setError("");
    const phone = buyerPhone.trim();
    if (phone.replace(/\D/g, "").length < 8) {
      setError(t.invalidPhone);
      return;
    }
    const email = buyerEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.invalidEmail);
      return;
    }
    setBusy(true);
    try {
      await ensureAnonymousAuth();
      const payload = isBundle
        ? { bundleId: item.id, buyerPhone: phone, buyerEmail: email }
        : { productId: item.id, buyerPhone: phone, buyerEmail: email, couponCode: couponCode.trim() };
      const data = await orderRequest("create", payload, t);
      setOrder(data.order);
    } catch (requestError) {
      setError(requestError.message || t.startOrderError);
    }
    setBusy(false);
  }

  function chooseProof(event) {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    if (!nextFile) return setProofFile(null);
    if (!ACCEPTED_TYPES.includes(nextFile.type) || nextFile.size < 1 || nextFile.size >= MAX_PROOF_BYTES) {
      setProofFile(null);
      setError(t.invalidProof);
      event.target.value = "";
      return;
    }
    setProofFile(nextFile);
  }

  async function payByCard() {
    setError("");
    setBusy(true);
    try {
      const data = await orderRequest("create_card_charge", { orderId: order.id }, t);
      // دفعة سابقة على نفس الطلب تأكدت الحين بدل ما تُنشأ شحنة جديدة — نروح
      // مباشرة لصفحة نتيجة الدفع اللي بتعرض النجاح، بدون خصم إضافي.
      if (data.alreadyPaid) {
        window.location.hash = `pay-result/${order.id}`;
        return;
      }
      window.location.assign(data.url);
    } catch (requestError) {
      setError(requestError.message || t.cardPayError);
      setBusy(false);
    }
  }

  async function uploadProof() {
    if (!order || !proofFile || !auth.currentUser) {
      setError(t.chooseProofFirst);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const filename = safeName(proofFile.name);
      const proofPath = `payment-proofs/${auth.currentUser.uid}/${order.id}/${Date.now()}_${filename}`;
      await uploadBytes(ref(storage, proofPath), proofFile, { contentType: proofFile.type });
      await orderRequest("submit_proof", { orderId: order.id, proofPath, proofName: filename }, t);
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || t.uploadProofError);
    }
    setBusy(false);
  }

  const soldOut = !isBundle && item?.type === "code" && Number(item?.codesCount || 0) < 1;

  if (soldOut) {
    return <><style>{styles}</style><button type="button" className="ppo-start" disabled>{t.soldOut}</button></>;
  }

  if (!open) {
    return <><style>{styles}</style><button type="button" className="ppo-start" onClick={() => setOpen(true)}>{t.orderNow}</button></>;
  }

  return (
    <section className="ppo-sheet" aria-live="polite">
      <style>{styles}</style>
      {complete ? <>
        <div className="ppo-step">{t.proofSentStep}</div>
        <div className="ppo-title">{t.proofSentTitle}</div>
        <div className="ppo-copy">{t.proofSentCopy}</div>
        <div className="ppo-success">{t.proofSentSuccess}</div>
        {notifyLink && <a className="ppo-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 12 }} href={notifyLink} target="_blank" rel="noopener noreferrer">{t.notifySeller}</a>}
        <a className="ppo-orders-link" href={`#purchases/${item?.ownerId || ""}`}>{t.myOrders}</a>
      </> : !order ? <>
        <div className="ppo-step">{t.step1}</div>
        <div className="ppo-title">{t.step1Title}</div>
        <div className="ppo-copy">{t.step1Copy}</div>
        <div className="ppo-field"><label htmlFor="buyer-phone">{t.whatsappLabel}</label><input id="buyer-phone" type="tel" value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} placeholder="9xxxxxxx" autoComplete="tel" dir="ltr" /></div>
        <div className="ppo-field"><label htmlFor="buyer-email">{t.emailLabel}</label><input id="buyer-email" type="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} placeholder={t.emailPlaceholder} autoComplete="email" dir="ltr" /></div>
        {!isBundle && <div className="ppo-field"><label htmlFor="coupon-code">{t.couponLabel}</label><input id="coupon-code" type="text" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder={t.couponPlaceholder} /></div>}
        {error && <div className="ppo-error">{error}</div>}
        <div className="ppo-actions"><button type="button" className="ppo-secondary" onClick={() => setOpen(false)} disabled={busy}>{t.back}</button><button type="button" className="ppo-primary" onClick={startOrder} disabled={busy}>{busy ? t.preparing : t.continueToTransfer}</button></div>
        <div className="ppo-small">{t.trialNote}</div>
      </> : <>
        {(() => {
          const hasManualTransfer = Boolean(order.paymentInstructions);
          return <>
            <div className="ppo-step">{t.step2}</div>
            <div className="ppo-title">
              {order.cardPaymentAvailable && hasManualTransfer ? t.choosePaymentMethod
                : order.cardPaymentAvailable ? t.payByCardTitle
                : t.transferDirect}
            </div>
            {order.couponCode ? (
              <div className="ppo-success">{t.couponApplied(order.couponCode, order.price.toFixed(2), order.originalPrice.toFixed(2))}</div>
            ) : (
              <div className="ppo-copy">{t.amountDue} <b>{order.price.toFixed(2)} {curr}</b></div>
            )}
            {error && <div className="ppo-error">{error}</div>}
            {order.cardPaymentAvailable && <>
              <button type="button" className="ppo-primary" style={{ width: "100%", marginTop: 12 }} onClick={payByCard} disabled={busy}>{busy ? t.payingByCard : t.payByCardNow}</button>
              {hasManualTransfer && <div className="ppo-small" style={{ textAlign: "center", margin: "13px 0" }}>{t.orTransferManually}</div>}
            </>}
            {hasManualTransfer && <>
              <div className="ppo-instructions">{order.paymentInstructions}</div>
              {(order.paymentBankName || order.paymentAccountHolder || order.paymentAccountNumber || order.paymentPhoneNumber) && (
                <div className="ppo-pay-card">
                  {order.paymentBankName && (
                    <div className="ppo-pay-row"><span className="ppo-pay-label">{t.bank}</span><span className="ppo-pay-value" style={{ fontFamily: "inherit" }}>{order.paymentBankName}</span></div>
                  )}
                  {order.paymentAccountHolder && (
                    <div className="ppo-pay-row"><span className="ppo-pay-label">{t.accountHolder}</span><span className="ppo-pay-value" style={{ fontFamily: "inherit" }}>{order.paymentAccountHolder}</span></div>
                  )}
                  {order.paymentAccountNumber && (
                    <div className="ppo-pay-row">
                      <span className="ppo-pay-label">{t.accountNumber}</span>
                      <span className="ppo-pay-value">{order.paymentAccountNumber}</span>
                      <button type="button" className="ppo-pay-copy" onClick={() => copyPaymentField(order.paymentAccountNumber, "account")}>{copiedField === "account" ? t.copied : t.copy}</button>
                    </div>
                  )}
                  {order.paymentPhoneNumber && (
                    <div className="ppo-pay-row">
                      <span className="ppo-pay-label">{t.phoneNumber}</span>
                      <span className="ppo-pay-value">{order.paymentPhoneNumber}</span>
                      <button type="button" className="ppo-pay-copy" onClick={() => copyPaymentField(order.paymentPhoneNumber, "phone")}>{copiedField === "phone" ? t.copied : t.copy}</button>
                    </div>
                  )}
                </div>
              )}
              <div className="ppo-copy">{t.manualTransferNote}</div>
              <div className="ppo-field"><label htmlFor="payment-proof">{t.proofLabel}</label><input id="payment-proof" className="ppo-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={chooseProof} /></div>
              {proofFile && <div className="ppo-small">{t.proofChosen(proofFile.name)}</div>}
            </>}
            <div className="ppo-actions">
              <button type="button" className="ppo-secondary" onClick={() => setOpen(false)} disabled={busy}>{hasManualTransfer ? t.finishLater : t.back}</button>
              {hasManualTransfer && <button type="button" className="ppo-primary" onClick={uploadProof} disabled={busy || !proofFile}>{busy ? t.uploadingProof : t.sendProofToSeller}</button>}
            </div>
            {hasManualTransfer && <div className="ppo-small">{t.manualTransferWarning}</div>}
          </>;
        })()}
      </>}
    </section>
  );
}
