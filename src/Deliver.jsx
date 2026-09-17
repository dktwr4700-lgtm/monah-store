import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";
import { useLang, LangToggle } from "./i18n.jsx";

const styles = `
  .dlv-page{min-height:100vh;background:#fff;color:#111;font-family:'Cairo',sans-serif}
  .dlv-shell{max-width:520px;margin:auto;padding:22px 16px 40px}
  .dlv-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
  .dlv-title{font-family:'Almarai',sans-serif;font-size:18px;font-weight:800}
  .dlv-lang{border:1px solid #d9d4c9;background:#fff;color:#163f2e;border-radius:999px;padding:9px 13px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer}
  .dlv-card{background:#fff;border:1px solid #e5e0d6;border-radius:17px;padding:16px;margin-bottom:11px}
  .dlv-name{font-size:14px;font-weight:800;line-height:1.6}
  .dlv-price{font-family:'JetBrains Mono',monospace;font-size:13px;color:#163f2e;font-weight:800}
  .dlv-item{border-top:1px dashed #e5e0d6;margin-top:12px;padding-top:12px}
  .dlv-download,.dlv-copy{width:100%;border:0;border-radius:999px;padding:11px 13px;margin-top:10px;font-family:inherit;font-weight:800;font-size:11.5px;cursor:pointer}
  .dlv-download{background:#111;color:#fff}
  .dlv-copy{background:#fff;border:1px solid #d9d4c9;color:#163f2e}
  .dlv-code{direction:ltr;text-align:left;margin-top:10px;border-radius:10px;background:#f7f6f1;border:1px dashed #d7d1c4;padding:10px;font-family:'JetBrains Mono',monospace;font-size:12px;word-break:break-all;white-space:pre-line}
  .dlv-note{font-size:10.5px;line-height:1.7;color:#5A5648;margin-top:8px}
  .dlv-state{background:#fff;border:1px solid #e5e0d6;border-radius:18px;padding:30px 18px;text-align:center;font-size:12px;line-height:1.9;color:#525252}
`;

const DLV_T = {
  ar: {
    title: "استلام طلبك من مُونَة", preparing: "جاري تجهيز طلبك…",
    loadOrderError: "تعذر تحميل طلبك الآن.", prepDownloadError: "تعذر تجهيز التنزيل الآن.",
    prepPlayError: "تعذر تجهيز التشغيل الآن.", copyCodeError: "تعذر نسخ الكود. انسخه يدويًا.",
    preparing2: "جاري التجهيز...", playNow: "العب الآن",
    preparingDownload: "جاري تجهيز التنزيل...", downloadProduct: "تنزيل المنتج",
    downloadsRemaining: (left, max) => `تبقّى لك ${left} من ${max} تنزيلات`,
    downloadsUsedUp: (max) => `استخدمت كل تنزيلاتك (${max}). تواصل مع التاجر لو تحتاج نسخة إضافية.`,
    codeCopied: "تم نسخ الكود", copyCode: "نسخ الكود",
    activationNote: "🔒 هذا المنتج يشتغل مباشرة من الموقع — اضغط \"العب الآن\" فوق، ما تحتاج تنزّل أي ملف.",
    viewReceipt: "عرض الفاتورة", orderLinkNote: "هذا الرابط خاص بطلبك، لا تشاركه مع أحد.",
  },
  en: {
    title: "Receive your order from Monah", preparing: "Getting your order ready…",
    loadOrderError: "Couldn't load your order right now.", prepDownloadError: "Couldn't prepare the download right now.",
    prepPlayError: "Couldn't prepare it to play right now.", copyCodeError: "Couldn't copy the code. Copy it manually.",
    preparing2: "Preparing...", playNow: "Play now",
    preparingDownload: "Preparing download...", downloadProduct: "Download product",
    downloadsRemaining: (left, max) => `${left} of ${max} downloads left`,
    downloadsUsedUp: (max) => `You've used all your downloads (${max}). Contact the seller if you need another copy.`,
    codeCopied: "Code copied", copyCode: "Copy code",
    activationNote: "🔒 This product runs directly from the website — click \"Play now\" above, no file to download.",
    viewReceipt: "View receipt", orderLinkNote: "This link is specific to your order — don't share it with anyone.",
  },
};

async function requestOrders(action, payload, t) {
  await ensureAnonymousAuth();
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t.loadOrderError);
  return data;
}

function DeliveryItem({ item, downloadingId, copiedId, onDownload, onPlay, onCopy, t }) {
  return (
    <>
      {item.playReady && (
        <button className="dlv-download" type="button" disabled={downloadingId === item.productId} onClick={() => onPlay(item.productId)}>
          {downloadingId === item.productId ? t.preparing2 : t.playNow}
        </button>
      )}
      {item.downloadReady && (
        <button className="dlv-download" type="button" disabled={downloadingId === item.productId} onClick={() => onDownload(item.productId)}>
          {downloadingId === item.productId ? t.preparingDownload : t.downloadProduct}
        </button>
      )}
      {item.maxDownloads != null && (
        <div className="dlv-note">
          {item.downloadsRemaining > 0
            ? t.downloadsRemaining(item.downloadsRemaining, item.maxDownloads)
            : t.downloadsUsedUp(item.maxDownloads)}
        </div>
      )}
      {item.licenseCode && (
        <>
          <div className="dlv-code">{item.licenseCode}</div>
          <button className="dlv-copy" type="button" onClick={() => onCopy(item.productId, item.licenseCode)}>
            {copiedId === item.productId ? t.codeCopied : t.copyCode}
          </button>
        </>
      )}
    </>
  );
}

export default function Deliver({ orderId, token }) {
  const [lang, setLang] = useLang();
  const t = DLV_T[lang];
  const curr = lang === "ar" ? "ر.ع" : "OMR";
  const [state, setState] = useState("loading");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    (async () => {
      setState("loading");
      try {
        const data = await requestOrders("deliver", { orderId, token }, t);
        setOrder(data.order);
        setState("ready");
      } catch (requestError) {
        setError(requestError.message || t.loadOrderError);
        setState("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  async function download(productId) {
    setDownloadingId(productId);
    try {
      const response = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, orderId, deliveryToken: token }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || t.prepDownloadError);
      window.location.assign(data.url);
    } catch (requestError) {
      setError(requestError.message || t.prepDownloadError);
    }
    setDownloadingId("");
  }

  async function play(productId) {
    setDownloadingId(productId);
    // نفتح التبويب فورًا (بدون أي await قبله) عشان يضل معتبر "فتحه المستخدم
    // بنفسه" عند سفاري خصوصًا — لو فتحناه بعد التحويل والانتظار على الشبكة،
    // المتصفح أحيانًا يحجبه بصمت كأنه نافذة منبثقة، فيطلع للمستخدم تبويب فاضي
    // ما يتفاعل معه. نعبّي رابطه الحقيقي بعد ما يجهز.
    const win = window.open("", "_blank");
    try {
      const response = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, orderId, deliveryToken: token, mode: "play" }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || t.prepPlayError);
      if (win) { win.opener = null; win.location.href = data.url; }
      else window.location.assign(data.url);
    } catch (requestError) {
      if (win) win.close();
      setError(requestError.message || t.prepPlayError);
    }
    setDownloadingId("");
  }

  async function copyCode(productId, licenseCode) {
    try {
      await navigator.clipboard.writeText(licenseCode);
      setCopiedId(productId);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setError(t.copyCodeError);
    }
  }

  return (
    <div className="dlv-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <main className="dlv-shell">
        <div className="dlv-top">
          <div className="dlv-title">{t.title}</div>
          <LangToggle lang={lang} onChange={setLang} className="dlv-lang" />
        </div>

        {state === "loading" && <div className="dlv-state">{t.preparing}</div>}
        {state === "error" && <div className="dlv-state">{error}</div>}

        {state === "ready" && order && (
          <article className="dlv-card">
            <div className="dlv-name">{order.productName}</div>
            <div className="dlv-price">{Number(order.price || 0).toFixed(2)} {curr}</div>

            {order.type === "bundle" ? (
              order.items.map((item) => (
                <div className="dlv-item" key={item.productId}>
                  <div className="dlv-name" style={{ fontSize: 12.5 }}>{item.productName}</div>
                  <DeliveryItem item={item} downloadingId={downloadingId} copiedId={copiedId} onDownload={download} onPlay={play} onCopy={copyCode} t={t} />
                </div>
              ))
            ) : (
              <DeliveryItem item={order} downloadingId={downloadingId} copiedId={copiedId} onDownload={download} onPlay={play} onCopy={copyCode} t={t} />
            )}

            {order.type !== "bundle" && Array.isArray(order.activationRequiredProductIds) && order.activationRequiredProductIds.length > 0 && (
              <div className="dlv-note" style={{ marginTop: 10 }}>
                {t.activationNote}
              </div>
            )}
            {error && <div className="dlv-note" style={{ color: "#b24c3a" }}>{error}</div>}
            <a className="dlv-copy" style={{ display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }} href={`#receipt/${orderId}/${token}`}>{t.viewReceipt}</a>
            <div className="dlv-note">{t.orderLinkNote}</div>
          </article>
        )}
      </main>
    </div>
  );
}
