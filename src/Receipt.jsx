import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";
import { useLang, LangToggle } from "./i18n.jsx";

const styles = `
  .rcpt-page{min-height:100vh;background:#fff;color:#111;font-family:'Cairo',sans-serif}
  .rcpt-shell{max-width:520px;margin:auto;padding:22px 16px 40px}
  .rcpt-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px}
  .rcpt-back,.rcpt-lang{border:1px solid #e2ded3;border-radius:999px;background:#fff;color:#163f2e;text-decoration:none;padding:9px 12px;font-size:11px;font-weight:800;font-family:inherit;cursor:pointer}
  .rcpt-card{background:#fff;border:1px solid #e5e0d6;border-radius:18px;padding:26px 22px}
  .rcpt-logo{width:44px;height:44px;border-radius:12px;object-fit:cover;margin-bottom:10px}
  .rcpt-store{font-family:'Almarai',sans-serif;font-weight:800;font-size:18px;color:#0b0b0c}
  .rcpt-label{color:#8a8677;font-size:11px;margin-top:2px}
  .rcpt-divider{border-top:1px dashed #e5e0d6;margin:18px 0}
  .rcpt-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:7px 0}
  .rcpt-row span:first-child{color:#8a8677}
  .rcpt-row span:last-child{font-weight:700;color:#0b0b0c}
  .rcpt-total{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:14px;border-top:1px solid #e5e0d6}
  .rcpt-total b{font-family:'JetBrains Mono',monospace;font-size:18px;color:#163f2e}
  .rcpt-note{font-size:10.5px;color:#b0ac9c;text-align:center;margin-top:20px;line-height:1.8}
  .rcpt-print{width:100%;border:0;border-radius:999px;background:#111;color:#fff;padding:12px 13px;margin-top:16px;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer}
  .rcpt-error,.rcpt-empty{background:#fff;border:1px solid #e5e0d6;border-radius:18px;padding:30px 18px;text-align:center;font-size:12px;line-height:1.9;color:#777}
  @media print{
    .rcpt-back,.rcpt-print,.rcpt-lang{display:none}
    .rcpt-page{background:#fff}
    .rcpt-card{border:none;padding:0}
  }
`;

const RCPT_T = {
  ar: {
    backToOrders: "العودة لطلباتي", preparing: "جاري تجهيز الفاتورة…",
    loadError: "تعذر تحميل الفاتورة الآن.",
    receiptNumber: (n) => `فاتورة رقم ${n}`,
    bundle: "الحزمة", product: "المنتج", includes: (list) => `تشمل: ${list}`,
    buyerWhatsapp: "رقم واتساب العميل", confirmedDate: "تاريخ التأكيد",
    coupon: "كوبون الخصم", priceBeforeDiscount: "السعر قبل الخصم",
    total: "الإجمالي", printOrSave: "طباعة أو حفظ كـ PDF",
    footerNote: "فاتورة صادرة من مُونَة لتوثيق عملية شراء مؤكدة عبر تحويل بنكي مباشر بين العميل والتاجر.",
  },
  en: {
    backToOrders: "Back to my orders", preparing: "Getting your receipt ready…",
    loadError: "Couldn't load the receipt right now.",
    receiptNumber: (n) => `Receipt #${n}`,
    bundle: "Bundle", product: "Product", includes: (list) => `Includes: ${list}`,
    buyerWhatsapp: "Customer WhatsApp number", confirmedDate: "Confirmation date",
    coupon: "Discount coupon", priceBeforeDiscount: "Price before discount",
    total: "Total", printOrSave: "Print or save as PDF",
    footerNote: "A receipt issued by Monah to document a confirmed purchase made via direct bank transfer between the buyer and the seller.",
  },
};

function dateFor(iso, lang) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "ar-OM", { day: "numeric", month: "long", year: "numeric" });
}

export default function Receipt({ orderId, token }) {
  const [lang, setLang] = useLang();
  const t = RCPT_T[lang];
  const curr = lang === "ar" ? "ر.ع" : "OMR";
  const [state, setState] = useState("loading");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await ensureAnonymousAuth();
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ action: "receipt", orderId, token }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || t.loadError);
        setData(result.receipt);
        setState("ready");
      } catch (requestError) {
        setError(requestError.message || t.loadError);
        setState("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  return (
    <div className="rcpt-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <main className="rcpt-shell">
        <header className="rcpt-top">
          <LangToggle lang={lang} onChange={setLang} className="rcpt-lang" />
          <a className="rcpt-back" href={`#purchases/${data?.ownerId || ""}`}>{t.backToOrders}</a>
        </header>

        {state === "loading" && <div className="rcpt-empty">{t.preparing}</div>}
        {state === "error" && <div className="rcpt-error">{error}</div>}

        {state === "ready" && data && (
          <div className="rcpt-card">
            {data.storeLogoUrl && <img className="rcpt-logo" src={data.storeLogoUrl} alt="" />}
            <div className="rcpt-store">{data.storeName}</div>
            <div className="rcpt-label">{t.receiptNumber(data.receiptNumber)}</div>

            <div className="rcpt-divider" />

            <div className="rcpt-row"><span>{data.items ? t.bundle : t.product}</span><span>{data.productName}</span></div>
            {data.items && <div className="rcpt-label" style={{ marginBottom: 6 }}>{t.includes(data.items.join("، "))}</div>}
            <div className="rcpt-row"><span>{t.buyerWhatsapp}</span><span dir="ltr">{data.buyerPhone}</span></div>
            <div className="rcpt-row"><span>{t.confirmedDate}</span><span>{dateFor(data.confirmedAt, lang)}</span></div>
            {data.couponCode && <div className="rcpt-row"><span>{t.coupon}</span><span>{data.couponCode}</span></div>}
            {data.originalPrice != null && <div className="rcpt-row"><span>{t.priceBeforeDiscount}</span><span>{data.originalPrice.toFixed(2)} {curr}</span></div>}

            <div className="rcpt-total">
              <span>{t.total}</span>
              <b className="mono">{data.price.toFixed(2)} {curr}</b>
            </div>

            <button type="button" className="rcpt-print" onClick={() => window.print()}>{t.printOrSave}</button>
            <div className="rcpt-note">{t.footerNote}</div>
          </div>
        )}
      </main>
    </div>
  );
}
