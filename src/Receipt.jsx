import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "./firebase.js";

const styles = `
  .rcpt-page{min-height:100vh;background:#f7f6f1;color:#111;font-family:'Cairo',sans-serif;direction:rtl}
  .rcpt-shell{max-width:520px;margin:auto;padding:22px 16px 40px}
  .rcpt-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px}
  .rcpt-back{border:1px solid #e2ded3;border-radius:999px;background:#fff;color:#163f2e;text-decoration:none;padding:9px 12px;font-size:11px;font-weight:800}
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
    .rcpt-back,.rcpt-print{display:none}
    .rcpt-page{background:#fff}
    .rcpt-card{border:none;padding:0}
  }
`;

function dateFor(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-OM", { day: "numeric", month: "long", year: "numeric" });
}

export default function Receipt({ orderId }) {
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
          body: JSON.stringify({ action: "receipt", orderId }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "تعذر تحميل الفاتورة الآن.");
        setData(result.receipt);
        setState("ready");
      } catch (requestError) {
        setError(requestError.message || "تعذر تحميل الفاتورة الآن.");
        setState("error");
      }
    })();
  }, [orderId]);

  return (
    <div className="rcpt-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <main className="rcpt-shell">
        <header className="rcpt-top">
          <div />
          <a className="rcpt-back" href="#purchases">العودة لطلباتي</a>
        </header>

        {state === "loading" && <div className="rcpt-empty">جاري تجهيز الفاتورة…</div>}
        {state === "error" && <div className="rcpt-error">{error}</div>}

        {state === "ready" && data && (
          <div className="rcpt-card">
            {data.storeLogoUrl && <img className="rcpt-logo" src={data.storeLogoUrl} alt="" />}
            <div className="rcpt-store">{data.storeName}</div>
            <div className="rcpt-label">فاتورة رقم {data.receiptNumber}</div>

            <div className="rcpt-divider" />

            <div className="rcpt-row"><span>المنتج</span><span>{data.productName}</span></div>
            <div className="rcpt-row"><span>البريد الإلكتروني</span><span>{data.buyerEmail}</span></div>
            <div className="rcpt-row"><span>تاريخ التأكيد</span><span>{dateFor(data.confirmedAt)}</span></div>

            <div className="rcpt-total">
              <span>الإجمالي</span>
              <b className="mono">{data.price.toFixed(2)} ر.ع</b>
            </div>

            <button type="button" className="rcpt-print" onClick={() => window.print()}>طباعة أو حفظ كـ PDF</button>
            <div className="rcpt-note">فاتورة صادرة من مُونَة لتوثيق عملية شراء مؤكدة عبر تحويل بنكي مباشر بين العميل والتاجر.</div>
          </div>
        )}
      </main>
    </div>
  );
}
