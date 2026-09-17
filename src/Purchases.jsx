import React, { useEffect, useState } from "react";
import { auth, db, ensureAnonymousAuth } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { useLang, LangToggle } from "./i18n.jsx";

const styles = `
  .buy-page{min-height:100vh;background:#fff;color:#111;font-family:'Cairo',sans-serif}.buy-shell{max-width:720px;margin:auto;padding:22px 16px 40px}.buy-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px}.buy-title{font-family:'Almarai',sans-serif;font-size:18px;font-weight:800}.buy-top-actions{display:flex;align-items:center;gap:8px}.buy-back,.buy-lang{border:1px solid #e2ded3;border-radius:999px;background:#fff;color:#163f2e;text-decoration:none;padding:9px 12px;font-size:11px;font-weight:800;font-family:inherit;cursor:pointer}.buy-note{background:#fff8e9;border:1px solid #f0d8a3;border-radius:14px;padding:12px;font-size:11px;line-height:1.8;color:#755614;margin-bottom:14px}.buy-card{background:#fff;border:1px solid #e5e0d6;border-radius:17px;padding:16px;margin-bottom:11px}.buy-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.buy-name{font-size:14px;font-weight:800;line-height:1.6}.buy-price{font-family:'JetBrains Mono',monospace;font-size:12px;color:#163f2e;font-weight:800;white-space:nowrap}.buy-status{display:inline-block;margin-top:8px;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800}.buy-status.draft{background:#f3ebdd;color:#816422}.buy-status.awaiting{background:#fce9c6;color:#7a5a17}.buy-status.confirmed{background:#eaf0eb;color:#42634a}.buy-date{font-size:10.5px;color:#8a8677;margin-top:9px}.buy-download,.buy-copy{width:100%;border:0;border-radius:999px;padding:11px 13px;margin-top:12px;font-family:inherit;font-weight:800;font-size:11.5px;cursor:pointer}.buy-download{background:#111;color:#fff}.buy-copy{background:#fff;border:1px solid #d9d4c9;color:#163f2e}.buy-code{direction:ltr;text-align:left;margin-top:11px;border-radius:10px;background:#f7f6f1;border:1px dashed #d7d1c4;padding:10px;font-family:'JetBrains Mono',monospace;font-size:12px;word-break:break-all;white-space:pre-line}.buy-empty{background:#fff;border:1px solid #e5e0d6;border-radius:18px;padding:30px 18px;text-align:center;font-size:12px;line-height:1.9;color:#777}.buy-error{background:#f6e9e5;color:#b24c3a;border-radius:12px;padding:11px;font-size:11.5px;line-height:1.7;margin-bottom:13px}.buy-bundle-item{border-top:1px dashed #e5e0d6;margin-top:12px;padding-top:12px}.buy-bundle-item .buy-name{font-size:12.5px}
`;

const BUY_T = {
  ar: {
    confirmed: "تم تأكيد التحويل", awaiting: "بانتظار مراجعة التاجر", pending: "بانتظار رفع الإثبات",
    justNow: "الآن",
    loadOrdersError: "تعذر تحميل طلباتك الآن.",
    prepDownloadError: "تعذر تجهيز التنزيل الآن.", prepPlayError: "تعذر تجهيز التشغيل الآن.",
    copyCodeError: "تعذر نسخ الكود. انسخه يدويًا.",
    backHome: "العودة للرئيسية", backToStore: "العودة إلى المتجر",
    preparing: "جاري التجهيز...", playNow: "العب الآن",
    preparingDownload: "جاري تجهيز التنزيل...", downloadProduct: "تنزيل المنتج",
    downloadsRemaining: (left, max) => `تبقّى لك ${left} من ${max} تنزيلات`,
    downloadsUsedUp: (max) => `استخدمت كل تنزيلاتك (${max}). تواصل مع التاجر لو تحتاج نسخة إضافية.`,
    codeCopied: "تم نسخ الكود", copyCode: "نسخ الكود",
    myOrders: "طلباتي",
    noteWithOwner: "هذه الصفحة تعرض طلباتك من هذا المتجر فقط.",
    noteWithoutOwner: "هذه الصفحة تعرض طلبات هذا الجهاز فقط في نسخة التجربة.",
    noteSuffix: "بعد تأكيد التاجر استلام التحويل، يفتح تنزيل المنتج هنا.",
    emptyOrders: "ما عندك طلبات على هذا الجهاز حاليًا.", emptyOrdersSub: "افتح رابط المنتج لبدء طلب جديد.",
    fromStore: (name) => `من متجر: ${name}`,
    activationNote: "🔒 هذا المنتج يشتغل مباشرة من الموقع — اضغط \"العب الآن\" فوق، ما تحتاج تنزّل أي ملف.",
    couponNote: (percent) => `🎁 عندك كوبون خصم ${percent}٪ لطلبك الجاي من هذا المتجر:`,
    viewReceipt: "عرض الفاتورة", finishOrder: "أكمل الطلب وارفع إثبات التحويل",
  },
  en: {
    confirmed: "Transfer confirmed", awaiting: "Awaiting seller review", pending: "Awaiting proof upload",
    justNow: "Just now",
    loadOrdersError: "Couldn't load your orders right now.",
    prepDownloadError: "Couldn't prepare the download right now.", prepPlayError: "Couldn't prepare it to play right now.",
    copyCodeError: "Couldn't copy the code. Copy it manually.",
    backHome: "Back to homepage", backToStore: "Back to store",
    preparing: "Preparing...", playNow: "Play now",
    preparingDownload: "Preparing download...", downloadProduct: "Download product",
    downloadsRemaining: (left, max) => `${left} of ${max} downloads left`,
    downloadsUsedUp: (max) => `You've used all your downloads (${max}). Contact the seller if you need another copy.`,
    codeCopied: "Code copied", copyCode: "Copy code",
    myOrders: "My orders",
    noteWithOwner: "This page shows your orders from this store only.",
    noteWithoutOwner: "This page shows orders from this device only, in the trial version.",
    noteSuffix: "Once the seller confirms the transfer, the product download unlocks here.",
    emptyOrders: "You don't have any orders on this device yet.", emptyOrdersSub: "Open a product link to start a new order.",
    fromStore: (name) => `From: ${name}`,
    activationNote: "🔒 This product runs directly from the website — click \"Play now\" above, no file to download.",
    couponNote: (percent) => `🎁 You have a ${percent}% discount coupon for your next order from this store:`,
    viewReceipt: "View receipt", finishOrder: "Finish the order and upload proof of transfer",
  },
};

function labelFor(status, t) {
  if (status === "confirmed") return t.confirmed;
  if (status === "awaiting_seller_confirmation") return t.awaiting;
  return t.pending;
}

function dateFor(iso, lang, t) {
  if (!iso) return t.justNow;
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "ar-OM", { day: "numeric", month: "short", year: "numeric" });
}

async function requestOrders(action, payload = {}, t) {
  await ensureAnonymousAuth();
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t.loadOrdersError);
  return data;
}

function DeliveryItem({ item, downloadingId, copiedId, onDownload, onPlay, onCopy, t }) {
  return (
    <>
      {item.playReady && (
        <button className="buy-download" type="button" disabled={downloadingId === item.productId} onClick={() => onPlay(item.productId)}>
          {downloadingId === item.productId ? t.preparing : t.playNow}
        </button>
      )}
      {item.downloadReady && (
        <button className="buy-download" type="button" disabled={downloadingId === item.productId} onClick={() => onDownload(item.productId)}>
          {downloadingId === item.productId ? t.preparingDownload : t.downloadProduct}
        </button>
      )}
      {item.maxDownloads != null && (
        <div className="buy-date">
          {item.downloadsRemaining > 0
            ? t.downloadsRemaining(item.downloadsRemaining, item.maxDownloads)
            : t.downloadsUsedUp(item.maxDownloads)}
        </div>
      )}
      {item.licenseCode && (
        <>
          <div className="buy-code">{item.licenseCode}</div>
          <button className="buy-copy" type="button" onClick={() => onCopy(item.productId, item.licenseCode)}>
            {copiedId === item.productId ? t.codeCopied : t.copyCode}
          </button>
        </>
      )}
    </>
  );
}

export default function Purchases({ ownerId }) {
  const [lang, setLang] = useLang();
  const t = BUY_T[lang];
  const curr = lang === "ar" ? "ر.ع" : "OMR";
  const [state, setState] = useState("loading");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [copiedCouponId, setCopiedCouponId] = useState("");
  const [backUrl, setBackUrl] = useState("#");
  const [backLabel, setBackLabel] = useState(t.backHome);
  const [storeNames, setStoreNames] = useState({});

  async function loadOrders() {
    setState("loading");
    setError("");
    try {
      const data = await requestOrders("list_buyer", ownerId ? { ownerId } : {}, t);
      const list = Array.isArray(data.orders) ? data.orders : [];
      setOrders(list);
      setState("ready");

      // لو الطلبات من أكثر من متجر، نجيب اسم كل متجر عشان نوضح تحت كل طلب من وين
      // جا بالضبط — لأن القائمة تجمع طلبات كل المتاجر لهذا الجهاز في مكان وحد.
      const ownerIds = Array.from(new Set(list.map((order) => order.ownerId).filter(Boolean)));
      if (ownerIds.length > 1) {
        try {
          const entries = await Promise.all(ownerIds.map(async (ownerId) => {
            const storeSnap = await getDoc(doc(db, "stores", ownerId));
            return [ownerId, storeSnap.exists() ? storeSnap.data().name || "" : ""];
          }));
          setStoreNames(Object.fromEntries(entries.filter(([, name]) => name)));
        } catch {
          // نتجاهل ونعرض الطلبات بدون اسم المتجر
        }
      }
      if (ownerIds.length === 1) {
        try {
          const storeSnap = await getDoc(doc(db, "stores", ownerIds[0]));
          setBackUrl(`#store/${storeSnap.exists() && storeSnap.data().slug ? storeSnap.data().slug : ownerIds[0]}`);
          setBackLabel(t.backToStore);
        } catch {
          // نتجاهل ونبقى على الرجوع للرئيسية الافتراضي
        }
      }
    } catch (requestError) {
      setError(requestError.message || t.loadOrdersError);
      setState("ready");
    }
  }

  useEffect(() => { loadOrders(); }, [ownerId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function download(productId) {
    setDownloadingId(productId);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ productId }) });
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
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ productId, mode: "play" }) });
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

  async function copyCoupon(orderId, code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCouponId(orderId);
      window.setTimeout(() => setCopiedCouponId(""), 1600);
    } catch {
      setError(t.copyCodeError);
    }
  }

  function goBack() {
    // نرجّع العميل بالضبط للصفحة اللي جا منها (متجره غالبًا) بدل الصفحة الرئيسية،
    // بغض النظر عن وجود طلبات — لأن الرجوع الطبيعي بالمتصفح يشتغل حتى بدون بيانات طلب.
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = backUrl.replace(/^#/, "");
    }
  }

  return (
    <div className="buy-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <main className="buy-shell">
        <header className="buy-top">
          <div className="buy-title">{t.myOrders}</div>
          <div className="buy-top-actions">
            <LangToggle lang={lang} onChange={setLang} className="buy-lang" />
            <button type="button" className="buy-back" onClick={goBack}>{backLabel}</button>
          </div>
        </header>
        <div className="buy-note">{ownerId ? t.noteWithOwner : t.noteWithoutOwner} {t.noteSuffix}</div>
        {error && <div className="buy-error">{error}</div>}
        {state === "ready" && orders.length === 0 ? (
          <div className="buy-empty">{t.emptyOrders}<br />{t.emptyOrdersSub}</div>
        ) : orders.map((order) => (
          <article className="buy-card" key={order.id}>
            <div className="buy-card-top">
              <div>
                {storeNames[order.ownerId] && <div className="buy-date" style={{ marginTop: 0, marginBottom: 3 }}>{t.fromStore(storeNames[order.ownerId])}</div>}
                <div className="buy-name">{order.productName}</div>
                <span className={`buy-status ${order.status === "confirmed" ? "confirmed" : order.status === "awaiting_seller_confirmation" ? "awaiting" : "draft"}`}>{labelFor(order.status, t)}</span>
              </div>
              <div className="buy-price">{Number(order.price || 0).toFixed(2)} {curr}</div>
            </div>
            <div className="buy-date">{dateFor(order.createdAt, lang, t)}</div>

            {order.type === "bundle" ? (
              order.items.map((item) => (
                <div className="buy-bundle-item" key={item.productId}>
                  <div className="buy-name">{item.productName}</div>
                  <DeliveryItem item={item} downloadingId={downloadingId} copiedId={copiedId} onDownload={download} onPlay={play} onCopy={copyCode} t={t} />
                </div>
              ))
            ) : (
              <DeliveryItem item={{ ...order, productId: order.productId }} downloadingId={downloadingId} copiedId={copiedId} onDownload={download} onPlay={play} onCopy={copyCode} t={t} />
            )}

            {order.type !== "bundle" && Array.isArray(order.activationRequiredProductIds) && order.activationRequiredProductIds.length > 0 && order.status === "confirmed" && (
              <div className="buy-note" style={{ marginTop: 12, marginBottom: 0 }}>
                {t.activationNote}
              </div>
            )}
            {order.repeatCoupon && (
              <div className="buy-note" style={{ marginTop: 12, marginBottom: 0 }}>
                {t.couponNote(order.repeatCoupon.discountPercent)}
                <div className="buy-code" style={{ marginTop: 6 }}>{order.repeatCoupon.code}</div>
                <button className="buy-copy" type="button" onClick={() => copyCoupon(order.id, order.repeatCoupon.code)}>
                  {copiedCouponId === order.id ? t.codeCopied : t.copyCode}
                </button>
              </div>
            )}
            {order.status === "confirmed" && (
              <a className="buy-copy" style={{ display: "block", textAlign: "center", textDecoration: "none" }} href={`#receipt/${order.id}`}>{t.viewReceipt}</a>
            )}
            {order.status === "draft" && (
              <a className="buy-copy" style={{ display: "block", textAlign: "center", textDecoration: "none" }} href={order.type === "bundle" ? `#bundle/${order.bundleId}` : `#product/${order.productId}`}>{t.finishOrder}</a>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}
