import React, { useEffect, useId, useRef, useState } from "react";
import { savePreviewDraft } from "./storePreviewDraft.js";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1024;

const TRY_T = {
  ar: {
    eyebrow: "جرّب قبل ما تسجّل",
    title: "شوف متجرك جاهز قبل ما تسجّل",
    sub: "اكتب اسم متجرك وارفع صورة منتج واحد، ونجهّز لك صفحة متجرك بنفس الشكل اللي بيشوفه عملاؤك.",
    nameLabel: "اسم متجرك",
    namePlaceholder: "مثال: دعوات ريم",
    imageLabel: "صورة منتجك",
    dropTitle: "اضغط لرفع صورة منتجك",
    dropHint: "غلاف كتاب، تصميم دعوة، صورة كورس... (JPG أو PNG)",
    changeImage: "تغيير الصورة",
    submit: "شوف متجري ←",
    submitting: "نجهّز متجرك...",
    needName: "اكتب اسم متجرك أولًا.",
    needImage: "ارفع صورة منتجك أولًا.",
    notImage: "الملف لازم يكون صورة (JPG أو PNG).",
    tooBig: "الصورة كبيرة مرة. اختر صورة أصغر من 15 ميجا.",
    readError: "ما قدرنا نقرأ الصورة. جرّب صورة ثانية.",
    genericError: "تعذر تجهيز المعاينة الآن. حاول بعد قليل.",
    steps: ["نقرأ صورة منتجك...", "نكتب وصف يجذب عملاءك...", "نجهّز واجهة متجرك..."],
    previewBadge: "معاينة",
    storePlaceholder: "اسم متجرك",
    taglinePlaceholder: "سطر تعريفي لمتجرك يظهر هنا",
    fileType: "ملف رقمي",
    productPlaceholder: "منتجك الأول يظهر هنا",
    buy: "اشترِ الآن",
    curr: "ر.ع",
    storeMeta: "متجر رقمي على مُونة",
    ctaTitle: "عجبك؟",
    cta: "افتح متجرك الحقيقي الحين ←",
    ctaNote: "منتجك محفوظ، وبتلقاه جاهز بلوحة متجرك بعد التسجيل.",
    tryAnother: "جرّب صورة ثانية",
  },
  en: {
    eyebrow: "Try before you sign up",
    title: "See your store ready before you sign up",
    sub: "Type your store name and upload one product image, and we'll build your store page exactly as your customers will see it.",
    nameLabel: "Your store name",
    namePlaceholder: "e.g. Reem Invitations",
    imageLabel: "Your product image",
    dropTitle: "Tap to upload your product image",
    dropHint: "Book cover, invitation design, course image... (JPG or PNG)",
    changeImage: "Change image",
    submit: "Show my store →",
    submitting: "Building your store...",
    needName: "Type your store name first.",
    needImage: "Upload your product image first.",
    notImage: "The file must be an image (JPG or PNG).",
    tooBig: "That image is too large. Pick one under 15 MB.",
    readError: "We couldn't read that image. Try another one.",
    genericError: "We couldn't build the preview right now. Try again shortly.",
    steps: ["Reading your product image...", "Writing a description that sells...", "Setting up your storefront..."],
    previewBadge: "Preview",
    storePlaceholder: "Your store name",
    taglinePlaceholder: "Your store's tagline shows here",
    fileType: "Digital file",
    productPlaceholder: "Your first product shows here",
    buy: "Buy now",
    curr: "OMR",
    storeMeta: "A digital store on Monah",
    ctaTitle: "Like it?",
    cta: "Open your real store now →",
    ctaNote: "Your product is saved and will be waiting in your store dashboard after you sign up.",
    tryAnother: "Try another image",
  },
};

const styles = `
  .spt{ padding:78px 0; background:linear-gradient(180deg,#F5F2EA 0%,#FBFAF6 100%); }
  .spt-grid{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,400px); gap:44px; align-items:start; margin-top:34px; }
  .spt-preview{ scroll-margin-top:16px; }
  .spt-sub{ text-align:center; color:#5A5648; font-size:14.5px; line-height:1.9; max-width:520px; margin:0 auto; }
  .spt-form{ background:#fff; border:1px solid rgba(19,33,27,.09); border-radius:24px; padding:26px; box-shadow:0 18px 40px rgba(23,35,28,.07); }
  .spt-field + .spt-field{ margin-top:18px; }
  .spt-label{ display:block; font-size:13px; font-weight:800; color:#153A2C; margin-bottom:8px; }
  .spt-input{ width:100%; border:1.5px solid #E4DFD2; border-radius:14px; padding:13px 15px; font-family:'Cairo',sans-serif; font-size:15px; color:#13211B; background:#FDFCF9; transition:border-color .15s ease, box-shadow .15s ease; min-height:48px; }
  .spt-input:focus{ outline:none; border-color:#153A2C; box-shadow:0 0 0 3px rgba(21,58,44,.1); background:#fff; }
  .spt-drop{ position:relative; display:flex; align-items:center; gap:14px; border:1.5px dashed #CFC8B6; border-radius:16px; padding:14px; background:#FDFCF9; cursor:pointer; min-height:84px; transition:border-color .15s ease, background .15s ease; }
  .spt-drop:hover, .spt-drop.drag{ border-color:#153A2C; background:#F4F8F2; }
  .spt-drop:focus-within{ border-color:#153A2C; box-shadow:0 0 0 3px rgba(21,58,44,.1); }
  .spt-drop-icon{ width:52px; height:52px; border-radius:14px; background:#EAF0EB; color:#153A2C; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
  .spt-drop-icon img{ width:100%; height:100%; object-fit:cover; }
  .spt-drop b{ display:block; font-size:13.5px; color:#153A2C; }
  .spt-drop span{ display:block; font-size:12px; color:#6B6656; margin-top:3px; line-height:1.6; }
  .spt-file{ position:absolute; width:1px; height:1px; opacity:0; overflow:hidden; }
  .spt-submit{ width:100%; margin-top:22px; justify-content:center; min-height:50px; font-size:15px; }
  .spt-submit:disabled{ opacity:.7; cursor:progress; transform:none; }
  .spt-error{ margin-top:14px; background:#FBEDEA; color:#8A2E1F; border-radius:12px; padding:11px 14px; font-size:13px; line-height:1.7; }
  .spt-status{ margin-top:12px; text-align:center; font-size:12.5px; color:#375044; min-height:20px; }

  .spt-phone{ width:100%; max-width:380px; margin:0 auto; background:#fff; border-radius:34px; border:9px solid #13211B; box-shadow:0 34px 60px rgba(19,33,27,.2); overflow:hidden; position:relative; }
  .spt-phone-bar{ height:22px; display:flex; justify-content:center; align-items:center; background:#fff; }
  .spt-phone-bar i{ width:74px; height:5px; border-radius:6px; background:#E4DFD2; display:block; }
  .spt-screen{ padding:12px 14px 18px; font-family:'Cairo',sans-serif; }
  .spt-badge{ position:absolute; top:34px; inset-inline-end:22px; z-index:3; background:#D6F35C; color:#143226; font-size:10.5px; font-weight:800; padding:4px 10px; border-radius:100px; }
  .spt-store{ background:#163F2E; color:#fff; border-radius:20px; padding:20px 18px; position:relative; overflow:hidden; isolation:isolate; }
  .spt-store:before{ content:""; position:absolute; width:190px; height:190px; border:1px solid rgba(255,255,255,.15); border-radius:50%; top:-100px; inset-inline-start:-60px; z-index:-1; }
  .spt-store-row{ display:flex; align-items:center; gap:12px; }
  .spt-logo{ width:52px; height:52px; border-radius:16px; background:#fff; color:#163F2E; display:flex; align-items:center; justify-content:center; font-family:'Almarai',sans-serif; font-weight:800; font-size:21px; flex-shrink:0; box-shadow:0 8px 16px rgba(0,0,0,.18); }
  .spt-store-name{ font-family:'Almarai',sans-serif; font-weight:800; font-size:17px; line-height:1.4; overflow-wrap:anywhere; }
  .spt-store-tag{ font-size:11.5px; color:rgba(255,255,255,.82); margin-top:4px; line-height:1.7; }
  .spt-store-meta{ font-size:9.5px; letter-spacing:.04em; color:rgba(255,255,255,.62); font-weight:800; margin-top:5px; }
  .spt-product{ margin-top:14px; border:1px solid rgba(17,32,24,.1); border-radius:18px; overflow:hidden; background:#fff; }
  .spt-product-img{ aspect-ratio:4/3; background:#EAF0EB; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .spt-product-img img{ width:100%; height:100%; object-fit:cover; display:block; }
  .spt-product-body{ padding:12px 13px 14px; }
  .spt-type{ font-size:10px; color:#9C6D1F; font-weight:800; }
  .spt-name{ font-size:14px; font-weight:800; line-height:1.55; color:#112018; margin-top:3px; }
  .spt-desc{ font-size:11.5px; color:#4A564C; line-height:1.8; margin-top:5px; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
  .spt-price-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:10px; }
  .spt-price{ font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:800; color:#163F2E; }
  .spt-buy{ background:#163F2E; color:#fff; border-radius:100px; padding:8px 16px; font-size:11.5px; font-weight:800; }
  .spt-muted{ color:#A7A08E; }
  .spt-line{ display:block; height:10px; border-radius:6px; background:#EDEAE0; margin-top:8px; }
  .spt-line.w70{ width:70%; } .spt-line.w90{ width:90%; } .spt-line.w50{ width:50%; }
  .spt-loading .spt-line, .spt-loading .spt-product-img{ background:linear-gradient(90deg,#EDEAE0 0%,#F7F5EF 50%,#EDEAE0 100%); background-size:200% 100%; animation:sptShimmer 1.2s ease-in-out infinite; }
  @keyframes sptShimmer{ from{ background-position:100% 0; } to{ background-position:-100% 0; } }
  .spt-reveal{ animation:sptIn .5s ease-out both; }
  @keyframes sptIn{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:none; } }

  .spt-cta{ margin-top:22px; text-align:center; }
  .spt-cta-title{ font-family:'Almarai',sans-serif; font-weight:800; font-size:18px; color:#153A2C; margin-bottom:10px; }
  .spt-cta .pill-black{ min-height:50px; }
  .spt-cta-note{ font-size:12px; color:#5A5648; margin-top:10px; line-height:1.7; }
  .spt-retry{ margin-top:8px; background:none; border:0; color:#375044; font-family:'Cairo',sans-serif; font-size:12.5px; text-decoration:underline; cursor:pointer; padding:10px; min-height:44px; }

  @media (prefers-reduced-motion: reduce){
    .spt-loading .spt-line, .spt-loading .spt-product-img, .spt-reveal{ animation:none; }
  }
  @media (max-width:860px){
    .spt{ padding:54px 0; }
    .spt-grid{ grid-template-columns:minmax(0,1fr); gap:30px; }
    .spt-form{ padding:20px; }
  }
`;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      resolve({ dataUrl, base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("read"));
    };
    img.src = url;
  });
}

function initialOf(name) {
  const trimmed = name.trim();
  return trimmed ? Array.from(trimmed)[0].toUpperCase() : "م";
}

export default function StorePreviewTry({ lang }) {
  const t = TRY_T[lang] || TRY_T.ar;
  const ids = useId();
  const [storeName, setStoreName] = useState("");
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const loading = status === "loading";

  // على الجوال المعاينة تحت النموذج — ننزل لها عشان يشوف متجره وهو يتجهّز.
  function scrollToPreview() {
    if (!previewRef.current || !window.matchMedia("(max-width:860px)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // scrollTo للنافذة مباشرة: غلاف الصفحة الرئيسية overflow:hidden، وscrollIntoView
    // كان يحرّك المحتوى داخله بدل ما ينزل بالصفحة.
    // بعد ما تخلص معالجة الضغطة — التمرير اللي يبدأ داخلها كان يتلغى.
    setTimeout(() => {
      if (!previewRef.current) return;
      const top = previewRef.current.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    }, 60);
  }

  useEffect(() => {
    if (!loading) return undefined;
    setStepIndex(0);
    const timer = setInterval(() => setStepIndex((i) => Math.min(i + 1, t.steps.length - 1)), 2600);
    return () => clearInterval(timer);
  }, [loading, t.steps.length]);

  async function takeFile(file) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError(t.notImage);
    if (file.size > MAX_SOURCE_BYTES) return setError(t.tooBig);
    try {
      setImage(await compressImage(file));
      setResult(null);
    } catch {
      setError(t.readError);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (storeName.trim().length < 2) return setError(t.needName);
    if (!image) return setError(t.needImage);
    setStatus("loading");
    setResult(null);
    scrollToPreview();
    try {
      const response = await fetch("/api/ai-product-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "store_preview", storeName: storeName.trim(), mediaType: image.mediaType, image: image.base64 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.genericError);
      setResult(data);
      setStatus("done");
      savePreviewDraft({
        storeName: storeName.trim(),
        productName: data.productName,
        description: data.description,
        price: data.suggestedPrice,
        storeTagline: data.storeTagline,
        image: image.dataUrl,
      });
    } catch (err) {
      setError(err.message || t.genericError);
      setStatus("idle");
    }
  }

  function tryAnother() {
    setResult(null);
    setImage(null);
    setStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  const shownName = storeName.trim() || t.storePlaceholder;
  const priceText = result ? `${Number(result.suggestedPrice).toFixed(2)} ${t.curr}` : "";

  return (
    <section className="spt" id="try" aria-labelledby={`${ids}-title`}>
      <style>{styles}</style>
      <div className="wrap">
        <div className="section-eyebrow">{t.eyebrow}</div>
        <h2 className="section-title" id={`${ids}-title`}>{t.title}</h2>
        <p className="spt-sub">{t.sub}</p>

        <div className="spt-grid">
          <form className="spt-form" onSubmit={submit} noValidate>
            <div className="spt-field">
              <label className="spt-label" htmlFor={`${ids}-name`}>{t.nameLabel}</label>
              <input
                id={`${ids}-name`}
                className="spt-input"
                value={storeName}
                maxLength={60}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={t.namePlaceholder}
                autoComplete="organization"
              />
            </div>
            <div className="spt-field">
              <span className="spt-label" id={`${ids}-img-label`}>{t.imageLabel}</span>
              <label
                className={"spt-drop" + (dragging ? " drag" : "")}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); takeFile(e.dataTransfer.files?.[0]); }}
              >
                <input
                  ref={fileInputRef}
                  className="spt-file"
                  type="file"
                  accept="image/*"
                  aria-labelledby={`${ids}-img-label`}
                  onChange={(e) => takeFile(e.target.files?.[0])}
                />
                <div className="spt-drop-icon" aria-hidden="true">
                  {image ? <img src={image.dataUrl} alt="" /> : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <div>
                  <b>{image ? t.changeImage : t.dropTitle}</b>
                  <span>{t.dropHint}</span>
                </div>
              </label>
            </div>
            <button className="pill-black spt-submit" type="submit" disabled={loading}>
              {loading ? t.submitting : t.submit}
            </button>
            {error && <div className="spt-error" role="alert">{error}</div>}
            <div className="spt-status" aria-live="polite">{loading ? t.steps[stepIndex] : ""}</div>
          </form>

          <div className="spt-preview" ref={previewRef}>
            <div className="spt-phone">
              <div className="spt-phone-bar" aria-hidden="true"><i /></div>
              <div className="spt-badge">{t.previewBadge}</div>
              <div className={"spt-screen" + (loading ? " spt-loading" : "")}>
                <div className="spt-store">
                  <div className="spt-store-row">
                    <div className="spt-logo" aria-hidden="true">{initialOf(storeName)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="spt-store-name">{shownName}</div>
                      <div className="spt-store-tag">{result?.storeTagline || t.taglinePlaceholder}</div>
                      <div className="spt-store-meta">{t.storeMeta}</div>
                    </div>
                  </div>
                </div>

                <div className={"spt-product" + (result ? " spt-reveal" : "")}>
                  <div className="spt-product-img">
                    {image ? <img src={image.dataUrl} alt="" /> : null}
                  </div>
                  <div className="spt-product-body">
                    <div className="spt-type">{t.fileType}</div>
                    {result ? (
                      <>
                        <div className="spt-name">{result.productName}</div>
                        <div className="spt-desc">{result.description}</div>
                        <div className="spt-price-row">
                          <span className="spt-price">{priceText}</span>
                          <span className="spt-buy" aria-hidden="true">{t.buy}</span>
                        </div>
                      </>
                    ) : loading ? (
                      <>
                        <span className="spt-line w70" />
                        <span className="spt-line w90" />
                        <span className="spt-line w50" />
                      </>
                    ) : (
                      <div className="spt-name spt-muted">{t.productPlaceholder}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {result && (
              <div className="spt-cta spt-reveal">
                <div className="spt-cta-title">{t.ctaTitle}</div>
                <a className="pill-black" href="#start-store">{t.cta}</a>
                <div className="spt-cta-note">{t.ctaNote}</div>
                <button type="button" className="spt-retry" onClick={tryAnother}>{t.tryAnother}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
