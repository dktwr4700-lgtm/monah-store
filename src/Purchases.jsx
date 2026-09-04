import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";

const styles = `
  .buy-page{min-height:100vh;background:#f7f6f1;color:#111;font-family:'Cairo',sans-serif;direction:rtl}.buy-shell{max-width:720px;margin:auto;padding:22px 16px 40px}.buy-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px}.buy-title{font-family:'Almarai',sans-serif;font-size:18px;font-weight:800}.buy-back{border:1px solid #e2ded3;border-radius:999px;background:#fff;color:#163f2e;text-decoration:none;padding:9px 12px;font-size:11px;font-weight:800}.buy-note{background:#fff8e9;border:1px solid #f0d8a3;border-radius:14px;padding:12px;font-size:11px;line-height:1.8;color:#755614;margin-bottom:14px}.buy-card{background:#fff;border:1px solid #e5e0d6;border-radius:17px;padding:16px;margin-bottom:11px}.buy-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.buy-name{font-size:14px;font-weight:800;line-height:1.6}.buy-price{font-family:'JetBrains Mono',monospace;font-size:12px;color:#163f2e;font-weight:800;white-space:nowrap}.buy-status{display:inline-block;margin-top:8px;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800}.buy-status.draft{background:#f3ebdd;color:#816422}.buy-status.awaiting{background:#fce9c6;color:#7a5a17}.buy-status.confirmed{background:#eaf0eb;color:#42634a}.buy-date{font-size:10.5px;color:#8a8677;margin-top:9px}.buy-download,.buy-copy{width:100%;border:0;border-radius:999px;padding:11px 13px;margin-top:12px;font-family:inherit;font-weight:800;font-size:11.5px;cursor:pointer}.buy-download{background:#111;color:#fff}.buy-copy{background:#fff;border:1px solid #d9d4c9;color:#163f2e}.buy-code{direction:ltr;text-align:left;margin-top:11px;border-radius:10px;background:#f7f6f1;border:1px dashed #d7d1c4;padding:10px;font-family:'JetBrains Mono',monospace;font-size:12px;word-break:break-all}.buy-empty{background:#fff;border:1px solid #e5e0d6;border-radius:18px;padding:30px 18px;text-align:center;font-size:12px;line-height:1.9;color:#777}.buy-error{background:#f6e9e5;color:#b24c3a;border-radius:12px;padding:11px;font-size:11.5px;line-height:1.7;margin-bottom:13px}
`;

function labelFor(status) {
  if (status === "confirmed") return "تم تأكيد التحويل";
  if (status === "awaiting_seller_confirmation") return "بانتظار مراجعة التاجر";
  return "بانتظار رفع الإثبات";
}

function dateFor(iso) {
  if (!iso) return "الآن";
  return new Date(iso).toLocaleDateString("ar-OM", { day: "numeric", month: "short", year: "numeric" });
}

async function requestOrders(action, payload = {}) {
  await ensureAnonymousAuth();
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "تعذر تحميل طلباتك الآن.");
  return data;
}

export default function Purchases() {
  const [state, setState] = useState("loading");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  async function loadOrders() {
    setState("loading");
    setError("");
    try {
      const data = await requestOrders("list_buyer");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setState("ready");
    } catch (requestError) {
      setError(requestError.message || "تعذر تحميل طلباتك الآن.");
      setState("ready");
    }
  }

  useEffect(() => { loadOrders(); }, []);

  async function download(order) {
    setDownloadingId(order.id);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ productId: order.productId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "تعذر تجهيز التنزيل الآن.");
      window.location.assign(data.url);
    } catch (requestError) {
      setError(requestError.message || "تعذر تجهيز التنزيل الآن.");
    }
    setDownloadingId("");
  }

  async function copyCode(order) {
    try {
      await navigator.clipboard.writeText(order.licenseCode);
      setCopiedId(order.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setError("تعذر نسخ الكود. انسخه يدويًا.");
    }
  }

  return <div className="buy-page" dir="rtl" lang="ar"><style>{styles}</style><main className="buy-shell"><header className="buy-top"><div className="buy-title">طلباتي</div><a className="buy-back" href="#">العودة للرئيسية</a></header><div className="buy-note">هذه الصفحة تعرض طلبات هذا الجهاز فقط في نسخة التجربة. بعد تأكيد التاجر استلام التحويل، يفتح تنزيل المنتج هنا.</div>{error && <div className="buy-error">{error}</div>}{state === "ready" && orders.length === 0 ? <div className="buy-empty">ما عندك طلبات على هذا الجهاز حاليًا.<br />افتح رابط المنتج لبدء طلب جديد.</div> : orders.map((order) => <article className="buy-card" key={order.id}><div className="buy-card-top"><div><div className="buy-name">{order.productName}</div><span className={`buy-status ${order.status === "confirmed" ? "confirmed" : order.status === "awaiting_seller_confirmation" ? "awaiting" : "draft"}`}>{labelFor(order.status)}</span></div><div className="buy-price">{Number(order.price || 0).toFixed(2)} ر.ع</div></div><div className="buy-date">{dateFor(order.createdAt)}</div>{order.downloadReady && <button className="buy-download" type="button" disabled={downloadingId === order.id} onClick={() => download(order)}>{downloadingId === order.id ? "جاري تجهيز التنزيل..." : "تنزيل المنتج"}</button>}{order.status === "confirmed" && order.maxDownloads != null && <div className="buy-date">{order.downloadsRemaining > 0 ? `تبقّى لك ${order.downloadsRemaining} من ${order.maxDownloads} تنزيلات` : `استخدمت كل تنزيلاتك (${order.maxDownloads}). تواصل مع التاجر لو تحتاج نسخة إضافية.`}</div>}{order.licenseCode && <><div className="buy-code">{order.licenseCode}</div><button className="buy-copy" type="button" onClick={() => copyCode(order)}>{copiedId === order.id ? "تم نسخ الكود" : "نسخ الكود"}</button></>}</article>)}</main></div>;
}
