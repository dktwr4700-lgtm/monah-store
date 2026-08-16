import React, { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const styles = `
  .pp-page{ min-height:100vh; background:#F6F3EC; font-family:'Cairo', sans-serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }
  .pp-header{ padding:20px 22px; border-bottom:1px solid #E4E0D3; display:flex; justify-content:space-between; align-items:center; }
  .pp-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:16px; }
  .pp-seller{ color:#8A8677; font-size:11px; }
  .pp-wrap{ max-width:460px; margin:0 auto; padding:32px 22px 0; }
  .pp-cap{ display:flex; align-items:center; gap:6px; font-size:11px; color:#8A8677; margin-bottom:12px; font-weight:600; }
  .pp-cap i{ width:5px; height:5px; border-radius:50%; background:#B9832F; display:inline-block; }
  .pp-name{ font-family:'Almarai', sans-serif; font-weight:800; font-size:22px; color:#16233F; line-height:1.4; margin-bottom:18px; }
  .pp-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; overflow:hidden; box-shadow:0 10px 24px rgba(22,35,63,0.06); margin-bottom:20px; }
  .pp-price-row{ display:flex; align-items:baseline; gap:6px; padding:18px 20px; border-bottom:1px dashed #E4E0D3; }
  .pp-price{ color:#16233F; font-weight:800; font-size:26px; font-family:'JetBrains Mono',monospace; }
  .pp-currency{ color:#8A8677; font-size:13px; }
  .pp-desc{ padding:16px 20px; color:#3D4A66; font-size:13px; line-height:1.9; }
  .pp-btn{ width:100%; background:#16233F; color:#fff; border:none; padding:16px; border-radius:10px; font-weight:700; font-size:14px; font-family:'Cairo', sans-serif; cursor:pointer; }
  .pp-btn:disabled{ opacity:.6; }
  .pp-secure{ text-align:center; margin-top:14px; color:#8A8677; font-size:11px; }
  .pp-note{ text-align:center; margin-top:10px; color:#B0AC9C; font-size:10px; line-height:1.6; }
  .pp-unlocked{ text-align:center; background:#EAF0EB; color:#4B6152; font-size:12.5px; font-weight:700; padding:10px; border-radius:8px; margin-bottom:12px; }
  .pp-email-field{ margin-bottom:14px; }
  .pp-email-field label{ display:block; font-size:11.5px; color:#8A8677; margin-bottom:6px; font-weight:600; }
  .pp-email-field input{ width:100%; padding:12px 14px; border:1px solid #E4E0D3; border-radius:8px; font-size:13px; background:#FFFFFF; font-family:'Cairo', sans-serif; box-sizing:border-box; direction:ltr; text-align:right; }
  .pp-email-error{ color:#B24C3A; font-size:11px; margin-top:6px; }
  .pp-footer{ text-align:center; padding:26px 20px; color:#B0AC9C; font-size:10.5px; }
  .pp-state{ min-height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; }
  .pp-state-title{ font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:16px; }
  .pp-state-sub{ color:#8A8677; font-size:13px; }
`;

export default function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [status, setStatus] = useState("loading");
  const [paying, setPaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const snap = await getDoc(doc(db, "products", productId));
        if (snap.exists()) {
          const data = snap.data();
          setProduct(data);
          const storeSnap = await getDoc(doc(db, "stores", data.ownerId));
          if (storeSnap.exists()) setStore(storeSnap.data());
          setStatus("ready");
        } else {
          setStatus("notfound");
        }
      } catch (err) {
        setStatus("notfound");
      }
    }
    fetchProduct();
  }, [productId]);

  if (status === "loading") {
    return (
      <div className="pp-state" dir="rtl" lang="ar">
        <style>{styles}</style>
        <div className="pp-state-sub">جاري التحميل...</div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="pp-state" dir="rtl" lang="ar">
        <style>{styles}</style>
        <div className="pp-state-title">هذا المنتج غير متوفر</div>
        <div className="pp-state-sub">تأكد من صحة الرابط وحاول مرة ثانية.</div>
      </div>
    );
  }

  const brandColor = (store && store.color) || "#16233F";

  return (
    <div className="pp-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="pp-header">
        <div className="pp-brand" style={{ color: brandColor }}>{(store && store.name) || "Monah"}</div>
        <div className="pp-seller">عبر منصة Monah</div>
      </div>
      <div className="pp-wrap">
        <div className="pp-cap"><i></i>منتج رقمي</div>
        <div className="pp-name">{product.name}</div>
        <div className="pp-card">
          <div className="pp-price-row">
            <span className="pp-price mono">{Number(product.price).toFixed(2)}</span>
            <span className="pp-currency">ر.ع</span>
          </div>
          {product.description && <div className="pp-desc">{product.description}</div>}
        </div>
        {!unlocked && (
          <>
            <div className="pp-email-field">
              <label>بريدك الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} placeholder="example@email.com" />
              {emailError && <div className="pp-email-error">{emailError}</div>}
            </div>
            <button
              className="pp-btn"
              style={{ background: brandColor }}
              disabled={paying}
              onClick={() => {
                if (!email || !email.includes("@")) {
                  setEmailError("أدخل بريدًا إلكترونيًا صحيحًا.");
                  return;
                }
                setPaying(true);
                addDoc(collection(db, "orders"), {
                  productId,
                  ownerId: product.ownerId,
                  productName: product.name,
                  price: product.price,
                  buyerEmail: email,
                  createdAt: serverTimestamp(),
                }).finally(() => {
                  setTimeout(() => {
                    setPaying(false);
                    setUnlocked(true);
                  }, 900);
                });
              }}
            >
              {paying ? "جاري التحقق..." : "ادفع واستلم الملف الآن"}
            </button>
            <div className="pp-secure">تسليم فوري تلقائي بعد إتمام الدفع</div>
            <div className="pp-note">الدفع الفعلي لسا قيد التفعيل — هذا زر تجريبي يوريك آلية التسليم</div>
          </>
        )}
        {unlocked && (
          <>
            <div className="pp-unlocked">✓ تم الدفع بنجاح</div>
            <a
              className="pp-btn"
              style={{ background: brandColor, display: "block", textAlign: "center", textDecoration: "none" }}
              href={product.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              تحميل الملف الآن
            </a>
            <div className="pp-secure">الرابط أعلاه يفتح ملفك مباشرة</div>
          </>
        )}
      </div>
      <div className="pp-footer">هذا المتجر مدعوم عبر منصة Monah</div>
    </div>
  );
}
