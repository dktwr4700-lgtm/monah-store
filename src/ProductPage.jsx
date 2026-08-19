import React, { useState, useEffect } from "react";
import { db, storage, ensureAnonymousAuth } from "./firebase.js";
import {
  doc, getDoc, setDoc, collection, addDoc, serverTimestamp,
  query, where, limit, getDocs, runTransaction
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const UNLOCK_VALID_DAYS = 30;

const styles = `
  .pp-page{ min-height:100vh; background:#F6F3EC; font-family:'Cairo', sans-serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }

  .pp-header{ padding:18px 22px; border-bottom:1px solid #E4E0D3; display:flex; justify-content:space-between; align-items:center; position:relative; z-index:2; }
  .pp-back{ display:flex; align-items:center; gap:6px; color:#8A8677; font-size:12px; text-decoration:none; }
  .pp-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#16233F; font-size:15px; }

  .pp-cover{ height:200px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
  .pp-cover::before{ content:""; position:absolute; inset:0; opacity:.08; background-image: radial-gradient(circle, #fff 1.5px, transparent 1.5px); background-size:16px 16px; pointer-events:none; }
  .pp-cover-icon{ width:56px; height:56px; border-radius:14px; background:rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; position:relative; z-index:1; }
  .pp-cover.has-image::before{ display:none; }
  .pp-cover-img{ width:100%; height:100%; object-fit:cover; }

  .pp-wrap{ max-width:460px; margin:0 auto; padding:24px 22px 0; }

  .pp-cat{ display:inline-flex; align-items:center; gap:6px; background:#EAF0EB; color:#4B6152; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; margin-bottom:16px; }
  .pp-name{ font-family:'Almarai', sans-serif; font-weight:800; font-size:23px; color:#16233F; line-height:1.4; margin-bottom:8px; }
  .pp-by{ color:#8A8677; font-size:12.5px; margin-bottom:22px; }
  .pp-by a{ color:#16233F; font-weight:700; text-decoration:none; }

  .pp-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; overflow:hidden; box-shadow:0 10px 24px rgba(22,35,63,0.06); margin-bottom:16px; }
  .pp-price-row{ display:flex; align-items:baseline; justify-content:space-between; padding:18px 20px; border-bottom:1px dashed #E4E0D3; }
  .pp-price-label{ color:#8A8677; font-size:11.5px; font-weight:600; }
  .pp-price-value{ display:flex; align-items:baseline; gap:6px; }
  .pp-price{ color:#16233F; font-weight:800; font-size:26px; font-family:'JetBrains Mono',monospace; }
  .pp-currency{ color:#8A8677; font-size:13px; }
  .pp-desc{ padding:18px 20px; color:#3D4A66; font-size:13.5px; line-height:2; }
  .pp-desc-empty{ padding:18px 20px; color:#B0AC9C; font-size:12.5px; }
  .pp-includes{ display:flex; align-items:center; gap:8px; padding:0 20px 18px; color:#3D4A66; font-size:12px; }

  .pp-trust{ display:flex; margin-bottom:20px; border:1px solid #E4E0D3; border-radius:12px; overflow:hidden; background:#FFFFFF; }
  .pp-trust-item{ flex:1; text-align:center; padding:12px 6px; border-inline-start:1px solid #E4E0D3; }
  .pp-trust-item:first-child{ border-inline-start:none; }
  .pp-trust-item svg{ margin-bottom:5px; }
  .pp-trust-item span{ display:block; color:#3D4A66; font-size:10px; font-weight:600; }

  .pp-btn{ width:100%; background:#16233F; color:#fff; border:none; padding:16px; border-radius:10px; font-weight:700; font-size:14px; font-family:'Cairo', sans-serif; cursor:pointer; }
  .pp-btn:disabled{ opacity:.6; }
  .pp-secure{ text-align:center; margin-top:14px; color:#8A8677; font-size:11px; }
  .pp-note{ text-align:center; margin-top:10px; color:#B0AC9C; font-size:10px; line-height:1.6; }
  .pp-unlocked{ text-align:center; background:#EAF0EB; color:#4B6152; font-size:12.5px; font-weight:700; padding:10px; border-radius:8px; margin-bottom:12px; }
  .pp-code-box{ display:flex; align-items:center; gap:10px; background:#16233F; border-radius:10px; padding:16px 18px; margin-bottom:4px; }
  .pp-code-value{ flex:1; color:#fff; font-size:16px; font-weight:700; letter-spacing:.03em; word-break:break-all; }
  .pp-code-copy{ background:rgba(255,255,255,0.16); color:#fff; border:none; padding:8px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; }

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
  const [assignedCode, setAssignedCode] = useState("");
  const [claimError, setClaimError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const snap = await getDoc(doc(db, "products", productId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.suspended) {
            setStatus("suspended");
            return;
          }
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

  if (status === "suspended") {
    return (
      <div className="pp-state" dir="rtl" lang="ar">
        <style>{styles}</style>
        <div className="pp-state-title">هذا المنتج غير متاح حاليًا</div>
        <div className="pp-state-sub">تواصل مع صاحب المتجر لمزيد من التفاصيل.</div>
      </div>
    );
  }

  const brandColor = (store && store.color) || "#16233F";
  const storeName = (store && store.name) || "متجر رقمي";
  const category = product.category || "منتج رقمي";
  const isCodeProduct = product.type === "code";

  async function claimCode() {
    const codesRef = collection(db, "products", productId, "codes");
    const q = query(codesRef, where("used", "==", false), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("out_of_stock");
    }
    const candidateRef = snap.docs[0].ref;
    return runTransaction(db, async (tx) => {
      const freshSnap = await tx.get(candidateRef);
      if (!freshSnap.exists() || freshSnap.data().used) {
        throw new Error("retry");
      }
      tx.update(candidateRef, { used: true, usedBy: email, usedAt: serverTimestamp() });
      return freshSnap.data().code;
    });
  }

  // يسجّل تصريح دخول للملف الرقمي، صالح لمدة محدودة، مربوط بجلسة المشتري
  // هذا هو الجزء اللي بعدين -بعد تفعيل بوابة الدفع- بنستدعيه فقط بعد تأكيد الدفع الفعلي
  async function grantFileAccess() {
    const uid = await ensureAnonymousAuth();
    const unlockId = `${uid}_${productId}`;
    const expiresAt = new Date(Date.now() + UNLOCK_VALID_DAYS * 24 * 60 * 60 * 1000);
    await setDoc(doc(db, "unlocks", unlockId), {
      productId,
      uid,
      buyerEmail: email,
      createdAt: serverTimestamp(),
      expiresAt,
    });
  }

  async function handlePurchase() {
    if (!email || !email.includes("@")) {
      setEmailError("أدخل بريدًا إلكترونيًا صحيحًا.");
      return;
    }
    setClaimError("");
    setPaying(true);

    try {
      let codeValue = "";
      if (isCodeProduct) {
        try {
          codeValue = await claimCode();
        } catch (err) {
          if (err.message === "out_of_stock" || err.message === "retry") {
            setClaimError("نفدت الكمية المتوفرة من هذا المنتج، تواصلي مع صاحب المتجر.");
            setPaying(false);
            return;
          }
          throw err;
        }
      } else {
        await grantFileAccess();
      }

      await addDoc(collection(db, "orders"), {
        productId,
        ownerId: product.ownerId,
        productName: product.name,
        price: product.price,
        buyerEmail: email,
        type: product.type || "file",
        createdAt: serverTimestamp(),
      });

      setTimeout(() => {
        setPaying(false);
        setAssignedCode(codeValue);
        setUnlocked(true);
      }, 900);
    } catch (err) {
      setClaimError("صار خطأ، حاول مرة ثانية.");
      setPaying(false);
    }
  }

  // يطلب رابط تحميل آمن مباشرة من Firebase Storage
  // الرابط يشتغل فقط لو عندنا تصريح دخول صالح (unlocks) — وإلا يرفضه Firebase تلقائيًا
  async function handleDownload() {
    setDownloading(true);
    setDownloadError("");
    const newTab = window.open("", "_blank");
    try {
      let url;
      if (product.filePath) {
        const fileRef = ref(storage, product.filePath);
        url = await getDownloadURL(fileRef);
      } else {
        // توافق مؤقت مع منتجات قديمة رُفعت قبل تفعيل نظام الحماية
        url = product.fileUrl;
      }
      if (newTab) {
        newTab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      if (newTab) newTab.close();
      setDownloadError("انتهت صلاحية رابط التحميل أو صار خطأ. تواصل مع صاحب المتجر.");
    }
    setDownloading(false);
  }

  return (
    <div className="pp-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="pp-header">
        <a className="pp-back" href={`#store/${product.ownerId}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#8A8677" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="scale(-1,1) translate(-24,0)"/></svg>
          {storeName}
        </a>
        <div className="pp-brand" style={{ color: brandColor }}>Monah</div>
      </div>

      <div className={"pp-cover" + (product.images && product.images.length > 0 ? " has-image" : "")} style={{ background: (product.images && product.images.length) ? "transparent" : brandColor }}>
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="pp-cover-img" />
        ) : (
          <div className="pp-cover-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M14 2v6h6" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      <div className="pp-wrap">
        <div className="pp-cat">{category}</div>
        <div className="pp-name">{product.name}</div>
        <div className="pp-by">من متجر <a href={`#store/${product.ownerId}`}>{storeName}</a></div>

        <div className="pp-card">
          <div className="pp-price-row">
            <span className="pp-price-label">السعر</span>
            <div className="pp-price-value">
              <span className="pp-price mono">{Number(product.price).toFixed(2)}</span>
              <span className="pp-currency">ر.ع</span>
            </div>
          </div>
          {product.description
            ? <div className="pp-desc">{product.description}</div>
            : <div className="pp-desc-empty">ما فيه وصف إضافي لهذا المنتج.</div>}
          <div className="pp-includes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#4B6152" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {isCodeProduct ? "كود تفعيل خاص يصلك فورًا بعد إتمام الدفع" : "ملف رقمي يُرسل لك فورًا بعد إتمام الدفع"}
          </div>
        </div>

        <div className="pp-trust">
          <div className="pp-trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 5px" }}><path d="M12 2l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V6l7-4z" stroke="#4B6152" strokeWidth="1.7"/></svg>
            <span>دفع آمن</span>
          </div>
          <div className="pp-trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 5px" }}><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="1.7"/><path d="M12 7v5l3 3" stroke="#4B6152" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <span>تسليم فوري</span>
          </div>
          <div className="pp-trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 5px" }}><path d="M21 11.5a8.5 8.5 0 01-12.5 7.5L4 20l1-4.3A8.5 8.5 0 1121 11.5z" stroke="#4B6152" strokeWidth="1.7"/></svg>
            <span>دعم مباشر</span>
          </div>
        </div>

        {!unlocked && (
          <>
            <div className="pp-email-field">
              <label>بريدك الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} placeholder="example@email.com" />
              {emailError && <div className="pp-email-error">{emailError}</div>}
              {claimError && <div className="pp-email-error">{claimError}</div>}
            </div>
            <button
              className="pp-btn"
              style={{ background: brandColor }}
              disabled={paying}
              onClick={handlePurchase}
            >
              {paying ? "جاري التحقق..." : "ادفع واستلم الآن"}
            </button>
            <div className="pp-secure">تسليم فوري تلقائي بعد إتمام الدفع</div>
            <div className="pp-note">الدفع الفعلي لسا قيد التفعيل — هذا زر تجريبي يوريك آلية التسليم</div>
          </>
        )}
        {unlocked && !isCodeProduct && (
          <>
            <div className="pp-unlocked">✓ تم الدفع بنجاح</div>
            <button
              className="pp-btn"
              style={{ background: brandColor }}
              disabled={downloading}
              onClick={handleDownload}
            >
              {downloading ? "جاري تجهيز الرابط..." : "تحميل الملف الآن"}
            </button>
            {downloadError && <div className="pp-email-error" style={{ textAlign: "center", marginTop: "10px" }}>{downloadError}</div>}
            <div className="pp-secure">رابط التحميل صالح لمدة {UNLOCK_VALID_DAYS} يوم من الآن</div>
          </>
        )}
        {unlocked && isCodeProduct && (
          <>
            <div className="pp-unlocked">✓ تم الدفع بنجاح</div>
            <div className="pp-code-box">
              <span className="pp-code-value mono">{assignedCode}</span>
              <button
                className="pp-code-copy"
                onClick={() => {
                  navigator.clipboard.writeText(assignedCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 1500);
                }}
              >
                {codeCopied ? "تم النسخ" : "نسخ الكود"}
              </button>
            </div>
            <div className="pp-secure">هذا الكود خاص فيك، احتفظي فيه</div>
          </>
        )}
      </div>
      <div className="pp-footer">هذا المتجر مدعوم عبر منصة Monah</div>
    </div>
  );
}
