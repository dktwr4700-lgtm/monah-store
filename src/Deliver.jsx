import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";

const styles = `
  .dlv-page{min-height:100vh;background:#f7f6f1;color:#111;font-family:'Cairo',sans-serif;direction:rtl}
  .dlv-shell{max-width:520px;margin:auto;padding:22px 16px 40px}
  .dlv-title{font-family:'Almarai',sans-serif;font-size:18px;font-weight:800;margin-bottom:14px}
  .dlv-card{background:#fff;border:1px solid #e5e0d6;border-radius:17px;padding:16px;margin-bottom:11px}
  .dlv-name{font-size:14px;font-weight:800;line-height:1.6}
  .dlv-price{font-family:'JetBrains Mono',monospace;font-size:13px;color:#163f2e;font-weight:800}
  .dlv-item{border-top:1px dashed #e5e0d6;margin-top:12px;padding-top:12px}
  .dlv-download,.dlv-copy{width:100%;border:0;border-radius:999px;padding:11px 13px;margin-top:10px;font-family:inherit;font-weight:800;font-size:11.5px;cursor:pointer}
  .dlv-download{background:#111;color:#fff}
  .dlv-copy{background:#fff;border:1px solid #d9d4c9;color:#163f2e}
  .dlv-code{direction:ltr;text-align:left;margin-top:10px;border-radius:10px;background:#f7f6f1;border:1px dashed #d7d1c4;padding:10px;font-family:'JetBrains Mono',monospace;font-size:12px;word-break:break-all}
  .dlv-note{font-size:10.5px;line-height:1.7;color:#89857a;margin-top:8px}
  .dlv-state{background:#fff;border:1px solid #e5e0d6;border-radius:18px;padding:30px 18px;text-align:center;font-size:12px;line-height:1.9;color:#777}
`;

async function requestOrders(action, payload) {
  await ensureAnonymousAuth();
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تحميل طلبك الآن.");
  return data;
}

function DeliveryItem({ item, downloadingId, copiedId, onDownload, onCopy }) {
  return (
    <>
      {item.downloadReady && (
        <button className="dlv-download" type="button" disabled={downloadingId === item.productId} onClick={() => onDownload(item.productId)}>
          {downloadingId === item.productId ? "جاري تجهيز التنزيل..." : "تنزيل المنتج"}
        </button>
      )}
      {item.maxDownloads != null && (
        <div className="dlv-note">
          {item.downloadsRemaining > 0
            ? `تبقّى لك ${item.downloadsRemaining} من ${item.maxDownloads} تنزيلات`
            : `استخدمت كل تنزيلاتك (${item.maxDownloads}). تواصل مع التاجر لو تحتاج نسخة إضافية.`}
        </div>
      )}
      {item.licenseCode && (
        <>
          <div className="dlv-code">{item.licenseCode}</div>
          <button className="dlv-copy" type="button" onClick={() => onCopy(item.productId, item.licenseCode)}>
            {copiedId === item.productId ? "تم نسخ الكود" : "نسخ الكود"}
          </button>
        </>
      )}
    </>
  );
}

export default function Deliver({ orderId, token }) {
  const [state, setState] = useState("loading");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    (async () => {
      setState("loading");
      try {
        const data = await requestOrders("deliver", { orderId, token });
        setOrder(data.order);
        setState("ready");
      } catch (requestError) {
        setError(requestError.message || "تعذر تحميل طلبك الآن.");
        setState("error");
      }
    })();
  }, [orderId, token]);

  async function download(productId) {
    setDownloadingId(productId);
    try {
      const response = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, orderId, deliveryToken: token }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "تعذر تجهيز التنزيل الآن.");
      window.location.assign(data.url);
    } catch (requestError) {
      setError(requestError.message || "تعذر تجهيز التنزيل الآن.");
    }
    setDownloadingId("");
  }

  async function copyCode(productId, licenseCode) {
    try {
      await navigator.clipboard.writeText(licenseCode);
      setCopiedId(productId);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setError("تعذر نسخ الكود. انسخه يدويًا.");
    }
  }

  return (
    <div className="dlv-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="dlv-shell">
        <div className="dlv-title">استلام طلبك من مُونَة</div>

        {state === "loading" && <div className="dlv-state">جاري تجهيز طلبك…</div>}
        {state === "error" && <div className="dlv-state">{error}</div>}

        {state === "ready" && order && (
          <article className="dlv-card">
            <div className="dlv-name">{order.productName}</div>
            <div className="dlv-price">{Number(order.price || 0).toFixed(2)} ر.ع</div>

            {order.type === "bundle" ? (
              order.items.map((item) => (
                <div className="dlv-item" key={item.productId}>
                  <div className="dlv-name" style={{ fontSize: 12.5 }}>{item.productName}</div>
                  <DeliveryItem item={item} downloadingId={downloadingId} copiedId={copiedId} onDownload={download} onCopy={copyCode} />
                </div>
              ))
            ) : (
              <DeliveryItem item={order} downloadingId={downloadingId} copiedId={copiedId} onDownload={download} onCopy={copyCode} />
            )}

            {error && <div className="dlv-note" style={{ color: "#b24c3a" }}>{error}</div>}
            <a className="dlv-copy" style={{ display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }} href={`#receipt/${orderId}/${token}`}>عرض الفاتورة</a>
            <div className="dlv-note">هذا الرابط خاص بطلبك، لا تشاركه مع أحد.</div>
          </article>
        )}
      </main>
    </div>
  );
}
