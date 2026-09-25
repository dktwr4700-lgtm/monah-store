import React, { useState, useEffect } from "react";
import { ADD_ON_CATALOG, STARTER_MONTHLY_PRICE } from "./subscriptionCatalog.js";
import { useLang, LangToggle } from "./i18n.jsx";
import StorePreviewTry from "./StorePreviewTry.jsx";

const styles = `
  .monah-app *{ box-sizing:border-box; }
  .monah-app{ font-family:'Cairo', sans-serif; background:#fff; color:#13211B; overflow:hidden; }
  .monah-app .mono{ font-family:'JetBrains Mono', monospace; }
  .monah-app a{ text-decoration:none; }
  .monah-app :focus-visible{ outline:2px solid #0E3B2C; outline-offset:2px; }
  .wrap{ max-width:1160px; margin:0 auto; padding:0 22px; }

  .reveal{ opacity:0; transform:translateY(26px); transition:opacity .7s ease, transform .7s ease; }
  .reveal.in{ opacity:1; transform:translateY(0); }

  .nav{ display:flex; justify-content:space-between; align-items:center; direction:ltr; margin-top:16px; padding:12px 14px 12px 18px; background:rgba(255,255,255,.76); border:1px solid rgba(19,33,27,.09); border-radius:18px; box-shadow:0 12px 30px rgba(23,35,28,.06); position:relative; z-index:10; backdrop-filter:blur(12px); gap:10px; }
  .nav-brand{ display:flex; align-items:center; gap:9px; font-family:'Almarai', sans-serif; font-weight:800; font-size:18px; color:#112A20; flex-shrink:0; white-space:nowrap; }
  .nav-brand img{ width:29px; height:29px; border-radius:9px; display:block; box-shadow:0 5px 14px rgba(14,59,44,.16); }
  .nav-btns{ display:flex; gap:10px; align-items:center; }
  .nav-btns{ direction:rtl; }
  .nav-link{ font-size:13px; font-weight:700; color:#375044; padding:8px 5px; white-space:nowrap; }
  .nav-cta{ background:#153A2C; color:#fff; padding:10px 18px; border-radius:100px; font-size:12.5px; font-weight:700; box-shadow:0 8px 18px rgba(14,59,44,.18); white-space:nowrap; }
  .nav-text-short{ display:none; }

  /* ===== HERO ===== */
  .hero{ margin-top:40px; display:flex; align-items:center; gap:0; }
  .hero-copy{ flex:1 1 380px; min-width:280px; padding-inline-end:44px; position:relative; z-index:2; }
  .hero h1{ font-family:'Almarai', sans-serif; font-weight:800; font-size:clamp(32px,4.1vw,48px); line-height:1.32; color:#153A2C; margin-bottom:18px; letter-spacing:-.02em; text-wrap:balance; }
  .hero p{ color:#5A5648; font-size:15px; line-height:1.9; max-width:400px; margin-bottom:26px; }
  .pill-black{ display:inline-flex; align-items:center; gap:8px; background:#D6F35C; color:#143226; padding:14px 23px; border-radius:100px; font-weight:800; font-size:14px; cursor:pointer; border:none; font-family:'Cairo', sans-serif; box-shadow:0 10px 22px rgba(0,0,0,.15); transition:transform .16s ease-out, box-shadow .16s ease-out; }
  .pill-black:hover{ transform:translateY(-2px); box-shadow:0 16px 28px rgba(21,58,44,.16); }
  .hero-cta-row{ display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
  .hero-ghost{ display:inline-flex; color:#375044; font-size:12.5px; border-bottom:1px solid #D8D2C2; padding-bottom:2px; transition:border-color .16s ease; }
  .hero-ghost:hover{ border-color:#153A2C; }

  /* ---- receipt mockup ---- */
  .receipt-stage{ flex:0 0 320px; position:relative; padding:22px 0 44px; }
  .receipt-copy2{ position:absolute; inset:36px 14px 20px -10px; background:#F1D9A0; border-radius:4px; transform:rotate(-3.5deg); box-shadow:0 10px 24px rgba(34,46,37,.08); }
  .receipt{
    position:relative; background:#FFFFFF; border:1px solid #EDEAE0; border-radius:4px 4px 0 0;
    padding:26px 24px 96px; box-shadow:0 24px 50px rgba(23,35,28,.10);
    clip-path: polygon(
      0% 0%, 100% 0%, 100% 95%,
      95% 98%, 90% 95%, 85% 98%, 80% 95%, 75% 98%, 70% 95%, 65% 98%, 60% 95%,
      55% 98%, 50% 95%, 45% 98%, 40% 95%, 35% 98%, 30% 95%, 25% 98%, 20% 95%,
      15% 98%, 10% 95%, 5% 98%, 0% 95%
    );
  }
  .receipt-tag{ position:absolute; top:-11px; right:22px; background:#153A2C; color:#F5F2EA; font-size:10.5px; font-weight:700; padding:5px 12px; border-radius:100px; }
  .receipt-head{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; }
  .receipt-head b{ font-family:'Almarai', sans-serif; font-weight:800; font-size:14.5px; color:#0B0B0C; }
  .receipt-head span{ font-size:11px; color:#5A5648; }
  .receipt-sub{ font-size:11px; color:#5A5648; margin-bottom:16px; }
  .receipt-rule{ border-top:1px dashed #E1DDD1; margin:14px 0; }
  .receipt-line{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; font-size:12.5px; padding:5px 0; }
  .receipt-line .label{ color:#0B0B0C; }
  .receipt-line .label small{ display:block; color:#5A5648; font-size:10.5px; margin-top:2px; }
  .receipt-line .value{ font-size:12.5px; color:#0B0B0C; }
  .receipt-total{ display:flex; justify-content:space-between; align-items:baseline; margin-top:14px; }
  .receipt-total b{ font-size:11.5px; color:#5A5648; font-weight:600; }
  .receipt-total .amount{ font-size:21px; font-weight:700; color:#0B0B0C; }

  .stamp{ position:absolute; left:26px; bottom:14px; width:92px; height:92px; border-radius:50%; opacity:.94; display:flex; align-items:center; justify-content:center; text-align:center; transform:rotate(-13deg); }
  .stamp::before{ content:""; position:absolute; inset:0; border:2px solid #153A2C; border-radius:50%; }
  .stamp::after{ content:""; position:absolute; inset:7px; border:1px solid #153A2C; border-radius:50%; opacity:.5; }
  .stamp-text{ position:relative; font-family:'Almarai', sans-serif; font-weight:800; font-size:11px; color:#153A2C; line-height:1.3; }
  .stamp-text small{ display:block; font-size:7.5px; font-weight:700; letter-spacing:.04em; margin-top:3px; }
  .stamp-impact{ position:absolute; left:26px; bottom:14px; width:92px; height:92px; border:2px solid #153A2C; border-radius:50%; opacity:0; pointer-events:none; }

  /* ---- ledger trust row ---- */
  .ledger{ margin-top:52px; border-top:1px solid #E1DDD1; border-bottom:1px solid #E1DDD1; padding:6px 0; }
  .ledger-row{ display:flex; align-items:baseline; gap:14px; padding:15px 2px; border-top:1px dashed #EDEAE0; }
  .ledger-row:first-child{ border-top:none; }
  .ledger-row .k{ font-size:13.5px; font-weight:700; color:#153A2C; white-space:nowrap; }
  .ledger-row .fill{ flex:1; border-bottom:1px dotted #D8D2C2; transform:translateY(-4px); }
  .ledger-row .v{ font-size:13px; color:#5A5648; white-space:nowrap; }
  .ledger-row .v.strong{ color:#0B0B0C; font-weight:700; }

  @media (prefers-reduced-motion: no-preference){
    .hero-copy{ animation: monahFadeUp .6s cubic-bezier(.22,.75,.32,1) both; }
    .receipt{ animation: monahPrintUp .65s cubic-bezier(.22,.75,.32,1) .18s both; }
    .receipt-copy2{ animation: monahPrintUpTilted .65s cubic-bezier(.22,.75,.32,1) .1s both; }
    .stamp{ animation: monahStampDown .5s cubic-bezier(.31,1.4,.5,1) .82s both; }
    .stamp-impact{ animation: monahInkImpact .6s ease-out .82s both; }
  }
  @keyframes monahFadeUp{ from{ opacity:0; transform:translateY(16px); } to{ opacity:1; transform:translateY(0); } }
  @keyframes monahPrintUp{ from{ opacity:0; transform:translateY(38px); } to{ opacity:1; transform:translateY(0); } }
  @keyframes monahPrintUpTilted{ from{ opacity:0; transform:translateY(56px) rotate(-3.5deg); } to{ opacity:1; transform:translateY(0) rotate(-3.5deg); } }
  @keyframes monahStampDown{
    0%{ opacity:0; transform:translate(-4px,-34px) rotate(-36deg) scale(1.45); }
    68%{ opacity:1; transform:translate(0,3px) rotate(-10deg) scale(.94); }
    100%{ opacity:.94; transform:translate(0,0) rotate(-13deg) scale(1); }
  }
  @keyframes monahInkImpact{
    0%{ opacity:0; transform:scale(.55); }
    35%{ opacity:.4; }
    100%{ opacity:0; transform:scale(1.75); }
  }

  section.section{ padding:78px 0; }
  .section-eyebrow{ text-align:center; font-size:11.5px; color:#B9832F; font-weight:700; letter-spacing:.04em; margin-bottom:8px; }
  h2.section-title{ text-align:center; font-family:'Almarai', sans-serif; font-weight:800; font-size:clamp(24px,3vw,32px); margin-bottom:10px; color:#153A2C; }
  .section-sub{ text-align:center; color:#5A5648; font-size:13.5px; margin-bottom:34px; }

  .n-list{ max-width:640px; margin:0 auto; }
  .n-row{ display:flex; align-items:center; gap:16px; padding:18px 4px; border-top:1px solid #EDEAE0; }
  .n-row:first-child{ border-top:none; }
  .n-figure{ font-family:'Almarai', sans-serif; font-weight:800; font-size:15px; color:#B9832F; min-width:26px; }
  .n-text b{ display:block; font-size:14px; font-weight:700; margin-bottom:3px; }
  .n-text span{ color:#5A5648; font-size:12.5px; line-height:1.7; }

  .style-list{ max-width:640px; margin:0 auto; }
  .style-row{ display:flex; justify-content:space-between; align-items:center; padding:16px 4px; border-top:1px solid #EDEAE0; }
  .style-row:first-child{ border-top:none; }
  .style-row .left{ display:flex; align-items:center; gap:13px; }
  .style-swatch{ width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; }
  .style-row b{ display:block; font-size:13.5px; font-weight:700; color:#0B0B0C; }
  .style-row span{ font-size:11px; color:#5A5648; }

  .features{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .feature{ background:#FFFFFF; border:1px solid #E7E2D6; border-radius:18px; padding:23px; box-shadow:0 12px 24px rgba(26,46,35,.035); }
  .feature-icon{ width:34px; height:34px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
  .feature b{ display:block; font-size:13.5px; font-weight:700; margin-bottom:5px; }
  .feature span{ color:#5A5648; font-size:12px; line-height:1.7; }

  .protection{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .protection-item{ background:#FFFDF8; border:1px solid #E7E2D6; border-radius:18px; padding:23px; }
  .protection-icon{ width:34px; height:34px; border-radius:9px; background:#F3E9D6; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
  .protection-item b{ display:block; font-size:13.5px; font-weight:700; margin-bottom:5px; }
  .protection-item span{ color:#5A5648; font-size:12px; line-height:1.7; }

  .compare{ max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #EDEAE0; border-radius:16px; overflow:hidden; }
  .compare-row{ display:grid; grid-template-columns:1.3fr 1fr 1fr; align-items:center; padding:13px 18px; border-top:1px solid #EDEAE0; }
  .compare-row:first-child{ border-top:none; background:#FBFAF7; }
  .compare-row:first-child span{ font-size:11px; font-weight:700; color:#5A5648; }
  .compare-label{ color:#3D4A66; font-size:12.5px; }
  .compare-monah{ text-align:center; color:#4B6152; font-weight:700; font-size:12.5px; }
  .compare-other{ text-align:center; color:#7A766A; font-size:12.5px; }

  .billing-toggle{ display:flex; justify-content:center; align-items:center; gap:14px; margin-bottom:14px; }
  .billing-btn{ padding:10px 20px; border-radius:100px; font-size:12.5px; font-weight:700; cursor:pointer; border:1px solid #EDEAE0; background:#FFFFFF; color:#3D4A66; }
  .billing-btn.active{ background:#0B0B0C; color:#fff; border-color:#0B0B0C; }
  .billing-save-badge{ background:#EAF0EB; color:#4B6152; font-size:10px; font-weight:700; padding:3px 9px; border-radius:100px; margin-right:6px; }

  .common-features{ text-align:center; color:#5A5648; font-size:11.5px; max-width:640px; margin:0 auto 28px; line-height:2; }
  .common-features b{ color:#0B0B0C; }

  .pricing{ display:flex; gap:16px; max-width:920px; margin:0 auto 20px; flex-wrap:wrap; justify-content:center; align-items:stretch; }
  .price-card{ flex:1; min-width:220px; max-width:280px; background:#FFFFFF; border:1px solid #E5E0D5; border-radius:20px; padding:30px 24px 25px; position:relative; display:flex; flex-direction:column; box-shadow:0 12px 28px rgba(24,44,32,.04); }
  .price-card.popular{ border:2px solid #153A2C; padding-top:30px; box-shadow:0 18px 36px rgba(21,58,44,.12); transform:translateY(-6px); }
  .price-badge{ position:absolute; top:-12px; right:22px; background:#B9832F; color:#fff; font-size:10.5px; font-weight:700; padding:5px 12px; border-radius:100px; }
  .price-name{ font-family:'Almarai', sans-serif; font-weight:800; font-size:14.5px; margin-bottom:6px; }
  .price-desc{ color:#5A5648; font-size:11px; line-height:1.7; margin-bottom:14px; min-height:30px; }
  .price-value{ display:flex; align-items:baseline; gap:6px; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:24px; margin-bottom:4px; }
  .price-value span{ font-size:11.5px; color:#5A5648; font-family:'Cairo', sans-serif; font-weight:400; }
  .price-yearly-note{ font-size:10.5px; color:#B9832F; font-weight:700; margin-bottom:14px; padding-bottom:14px; border-bottom:1px dashed #EDEAE0; min-height:14px; }
  .price-features{ flex:1; }
  .price-features div{ display:flex; align-items:flex-start; gap:8px; font-size:12.5px; color:#3D4A66; line-height:1.6; padding:5px 0; }
  .price-soon{ margin-top:8px; padding-top:8px; border-top:1px dashed #EDEAE0; }
  .price-soon-label{ color:#B9832F; font-size:9.5px; font-weight:700; margin-bottom:4px; }
  .price-soon div{ font-size:10.5px; color:#7A766A; padding:2px 0; }
  .price-btn{ width:100%; margin-top:18px; padding:12px; border-radius:9px; font-size:12.5px; font-weight:700; cursor:pointer; border:1.5px solid #0B0B0C; background:transparent; color:#0B0B0C; display:block; text-align:center; }
  .price-card.popular .price-btn{ background:#153A2C; color:#fff; border:none; }
  .pricing-note{ text-align:center; color:#5A5648; font-size:11.5px; max-width:480px; margin:0 auto; line-height:1.8; }

  .faq{ max-width:640px; margin:0 auto; }
  .faq-item{ border-top:1px solid #EDEAE0; }
  .faq-item:last-child{ border-bottom:1px solid #EDEAE0; }
  .faq-q{ width:100%; text-align:right; background:none; border:none; cursor:pointer; padding:17px 0; display:flex; gap:12px; align-items:center; font-size:14px; font-weight:700; font-family:'Cairo', sans-serif; color:#0B0B0C; }
  .faq-q .n{ color:#B9832F; font-family:'JetBrains Mono', monospace; font-size:11.5px; }
  .faq-a{ color:#5A5648; font-size:12.5px; line-height:1.8; padding-bottom:17px; padding-right:28px; max-width:500px; }

  .final-cta{ padding:62px 0 30px; }
  .final-cta-inner{ min-height:290px; padding:44px 52px; border-radius:28px; background:linear-gradient(120deg,#14382B,#1C4A38); color:#fff; display:flex; align-items:center; justify-content:space-between; gap:30px; overflow:hidden; position:relative; box-shadow:0 24px 50px rgba(15,48,35,.16); }
  .final-cta-inner::before{ content:""; position:absolute; width:390px; height:390px; background:radial-gradient(circle,rgba(214,243,92,.16),transparent 68%); left:-130px; top:-120px; pointer-events:none; }
  .final-copy{ position:relative; z-index:1; max-width:490px; }
  .final-kicker{ color:#D6F35C; font-size:11px; font-weight:800; letter-spacing:.05em; margin-bottom:10px; }
  .final-cta h3{ font-family:'Almarai', sans-serif; font-weight:800; font-size:clamp(24px,3vw,34px); margin-bottom:10px; color:#fff; line-height:1.5; }
  .final-cta p{ color:#D8E5DE; font-size:13px; margin-bottom:22px; line-height:1.85; }
  .final-orbit{ width:210px; height:180px; position:relative; flex:0 0 210px; perspective:800px; }
  .orbit-plane{ position:absolute; inset:24px 0 0; border:1px solid rgba(214,243,92,.45); border-radius:50%; transform:rotateX(64deg) rotateZ(-20deg); box-shadow:0 0 28px rgba(214,243,92,.1); }
  .orbit-plane:nth-child(2){ transform:rotateX(64deg) rotateZ(40deg); opacity:.55; }
  .orbit-card{ position:absolute; width:112px; right:49px; top:29px; padding:16px 12px; border-radius:16px; background:#F9F8F2; color:#153A2C; box-shadow:0 18px 28px rgba(0,0,0,.25); text-align:center; transform:rotateY(-17deg) rotateX(9deg); font-family:'Almarai',sans-serif; font-weight:800; font-size:14px; }
  .orbit-card small{ display:block; font-family:'Cairo',sans-serif; color:#6A7D71; font-weight:700; font-size:10px; margin-top:5px; }

  .foot-black{ background:transparent; border-top:1px solid #DDD8CB; border-radius:0; margin:0 22px 12px; padding:24px 8px 14px; overflow:hidden; max-width:1116px; margin-inline:auto; }
  .foot-top{ display:flex; justify-content:space-between; color:#63746A; font-size:11.5px; padding-bottom:16px; flex-wrap:wrap; gap:16px; }
  .foot-top div b{ color:#153A2C; display:block; margin-bottom:8px; font-size:11.5px; }
  .foot-top a{ color:#63746A; display:block; margin-top:7px; }
  .foot-contact{ color:#63746A; font-size:12px; }
  .foot-contact a{ color:#153A2C; font-weight:800; }
  .foot-wordmark{ font-family:'Almarai', sans-serif; font-weight:800; font-size:clamp(28px,5vw,52px); color:#153A2C; text-align:left; line-height:1; padding:4px 0; letter-spacing:-0.04em; }

  @media (max-width:760px){
    .nav{ margin-top:10px; border-radius:15px; padding:10px 11px 10px 14px; }
    .nav-cta{ padding:9px 13px; }
    .hero{ flex-direction:column; align-items:stretch; gap:0; }
    .hero-copy{ flex:none; padding-inline-end:0; text-align:center; }
    .hero p{ margin-inline:auto; }
    .hero-cta-row{ justify-content:center; }
    .receipt-stage{ flex:none; margin:36px auto 0; max-width:320px; width:100%; }
    .ledger-row{ flex-wrap:wrap; }
    section.section{ padding:54px 0; }
    .price-card.popular{ transform:none; }
    .final-cta{ padding:50px 0 24px; }
    .final-cta-inner{ padding:34px 24px 28px; min-height:0; flex-direction:column; text-align:center; }
    .final-orbit{ transform:scale(.82); margin:-20px 0 -26px; }
    .foot-wordmark{ text-align:center; }
  }
  @media (max-width:480px){
    .nav{ gap:6px; }
    .nav-btns{ gap:6px; }
    .nav-link{ padding:7px 3px; font-size:12px; }
    .nav-cta{ padding:8px 11px; font-size:11.5px; }
    .nav-text-full{ display:none; }
    .nav-text-short{ display:inline; }
  }

  .monah-app button{ transition:transform 100ms ease-out; }
  .monah-app button:active{ transform:scale(0.96); }
`;

const FEATURES = [
  { title: { ar: "التسليم الرقمي", en: "Digital delivery" }, desc: { ar: "يفتح تلقائيًا للعميل بعد ما يرفع إثبات التحويل ويؤكد التاجر استلام المبلغ من لوحة الطلبات.", en: "Unlocks automatically for the buyer once they upload proof of transfer and the seller confirms payment from the orders panel." }, icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
  { title: { ar: "رابط لكل منتج", en: "A link for every product" }, desc: { ar: "كل منتج له رابط خاص فيه، تشاركه بأي مكان تحب.", en: "Every product gets its own link you can share anywhere." }, icon: <path d="M12 3v18M3 12h18" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/> },
  { title: { ar: "متابعة المتجر", en: "Track your store" }, desc: { ar: "تابع منتجاتك وطلباتك من لوحة التاجر. لوحة المبيعات والتقارير المتقدمة تظهر عند تفعيل الدفع الإلكتروني لاحقًا.", en: "Track your products and orders from the seller dashboard. Advanced sales reports appear once you enable card payments." }, icon: <><rect x="3" y="4" width="18" height="14" rx="2" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M3 9h18" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: { ar: "إعداد بدقائق", en: "Set up in minutes" }, desc: { ar: "بدون خبرة تقنية، وبدون كمبيوتر أو استضافة خارجية.", en: "No technical experience needed — no computer or external hosting required." }, icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
];

const PROTECTION = [
  { title: { ar: "روابط تحميل مقيّدة", en: "Restricted download links" }, desc: { ar: "رابط التنزيل يفتح للعميل فقط بعد تأكيد التاجر استلام المبلغ، ولا يبقى صالحًا للمشاركة بصورة دائمة.", en: "The download link only unlocks after the seller confirms payment, and it doesn't stay valid for sharing indefinitely." }, icon: <><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { title: { ar: "حفظ الملفات بشكل محمي", en: "Securely stored files" }, desc: { ar: "ملف المنتج لا يظهر للزائر في المتجر العام. وصول العميل يتاح فقط بعد تأكيد التاجر استلام المبلغ.", en: "The product file never appears to visitors on the public store. Access is only granted after the seller confirms payment." }, icon: <><rect x="5" y="11" width="14" height="9" rx="2" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M8 11V8a4 4 0 1 8 0v3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { title: { ar: "حماية وصول العميل", en: "Protected buyer access" }, desc: { ar: "إتاحة الرابط للمشتري تُدار تلقائيًا بعد تأكيد التاجر استلام المبلغ من لوحة الطلبات.", en: "Access is granted to the buyer automatically once the seller confirms payment from the orders panel." }, icon: <><path d="M9 12l2 2 4-4" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
];

const WHY = [
  { n: "01", title: { ar: "احتفظ بسعر بيعك كاملًا", en: "Keep your full sale price" }, desc: { ar: "لا توجد عمولة إضافية على المبيعات. تفاصيل الاشتراك تظهر بوضوح قبل أي تفعيل.", en: "No extra commission on sales. Subscription details are shown clearly before you activate anything." } },
  { n: "02", title: { ar: "يدعم كل أنواع الملفات", en: "Supports every file type" }, desc: { ar: "PDF، ZIP، صور، فيديوهات، أكواد، وأي ملف رقمي تبيعه.", en: "PDF, ZIP, images, videos, codes — any digital file you sell." } },
  { n: "03", title: { ar: "بدون خبرة تقنية", en: "No technical experience needed" }, desc: { ar: "ما تحتاج كمبيوتر ولا استضافة خارجية، كل شي من متجرك مباشرة.", en: "No computer or external hosting needed — everything runs from your store directly." } },
];

const COMPARE = [
  { label: { ar: "العمولة على المبيعات", en: "Commission on sales" }, monah: { ar: "٪٠", en: "0%" }, other: { ar: "نسبة من كل عملية بيع", en: "A cut of every sale" } },
  { label: { ar: "رسوم الاشتراك", en: "Subscription fee" }, monah: { ar: "٥ ر.ع شهريًا", en: "5 OMR / month" }, other: { ar: "غالبًا متغيّرة", en: "Often variable" } },
];

const USECASES = [
  { title: { ar: "ملفات وتصاميم", en: "Files & designs" }, desc: { ar: "PDF، قوالب، صور", en: "PDF, templates, images" }, color: "#0E3B2C" },
  { title: { ar: "أكواد وتراخيص", en: "Codes & licenses" }, desc: { ar: "سكربتات، مفاتيح تفعيل", en: "Scripts, activation keys" }, color: "#B9832F" },
  { title: { ar: "دورات وملفات تعليمية", en: "Courses & learning materials" }, desc: { ar: "فيديو، ملخصات", en: "Video, summaries" }, color: "#4B6152" },
  { title: { ar: "برستات ومحتوى", en: "Presets & content" }, desc: { ar: "قوالب سوشيال ميديا", en: "Social media templates" }, color: "#5A5648" },
];

const START_STORE_URL = "#start-store";

const STEPS = [
  { n: "01", title: { ar: "اضغط \"افتح متجرك الحين\" وسجّل بياناتك", en: "Click \"Open your store now\" and register" }, desc: { ar: "تكتب اسم متجرك وبريدك الإلكتروني وتختار كلمة مرورك بنفسك — بدون خبرة تقنية.", en: "Enter your store name and email, and choose your own password — no technical experience needed." } },
  { n: "02", title: { ar: "فعّل اشتراكك بالبطاقة", en: "Activate your subscription by card" }, desc: { ar: "تدفع نص ريال بس تبدأ، ويفتح متجرك ولوحة التحكم فورًا بعد الدفع.", en: "Pay just 0.5 OMR to start, and your store and dashboard open right after payment." } },
  { n: "03", title: { ar: "من لوحتك اضغط \"إضافة منتج\"", en: "From your dashboard, click \"Add product\"" }, desc: { ar: "ترفع ملفك (PDF، صورة، فيديو، كود...) وتكتب اسمه وسعره ووصفه، ثم تنشره.", en: "Upload your file (PDF, image, video, code…), write its name, price, and description, then publish it." } },
  { n: "04", title: { ar: "يصير لمنتجك رابط خاص فيه", en: "Your product gets its own link" }, desc: { ar: "تنسخه وتشاركه بواتساب أو إنستغرام أو أي مكان تحب.", en: "Copy it and share it on WhatsApp, Instagram, or anywhere you like." } },
  { n: "05", title: { ar: "العميل يطلب وأنت تؤكد الاستلام", en: "The buyer orders and you confirm receipt" }, desc: { ar: "يرفع إثبات التحويل، وبعد ما تأكد استلامك المبلغ من لوحتك، يفتح التنزيل له تلقائيًا.", en: "They upload proof of transfer; once you confirm you received the payment from your dashboard, the download unlocks for them automatically." } },
];

const FAQS = [
  { q: { ar: "هل أحتاج خبرة تقنية؟", en: "Do I need technical experience?" }, a: { ar: "أبدًا. ترفع ملفك وتحدد السعر، تشارك رابط منتجك، والعميل يطلبه ويرفع إثبات التحويل — وأنت تؤكد الاستلام ليوصله الملف.", en: "Not at all. You upload your file, set a price, and share your product link. The buyer orders it and uploads proof of transfer — you confirm receipt and the file reaches them." } },
  { q: { ar: "وش أنواع الملفات المسموحة؟", en: "What file types are allowed?" }, a: { ar: "أي ملف رقمي: PDF، تصاميم، أكواد، فيديوهات، وغيرها.", en: "Any digital file: PDF, designs, codes, videos, and more." } },
  { q: { ar: "فيه عمولة على مبيعاتي؟", en: "Is there a commission on my sales?" }, a: { ar: "لا توجد عمولة إضافية على المبيعات. وتظهر تفاصيل الاشتراك والسعر قبل أي تفعيل.", en: "There's no extra commission on sales. Subscription and pricing details are shown before you activate anything." } },
  { q: { ar: "أقدر أربط دومين خاص فيني؟", en: "Can I connect my own domain?" }, a: { ar: "هذي ميزة قادمة قريبًا للباقة المتكاملة، لسا قيد التطوير.", en: "This is a feature coming soon for the full plan — still in development." } },
  { q: { ar: "وش يصير لو ألغيت اشتراكي؟", en: "What happens if I cancel my subscription?" }, a: { ar: "تظهر سياسة الإلغاء بوضوح عند تفعيل الاشتراك، قبل أن توافق على أي تفعيل.", en: "The cancellation policy is shown clearly when you activate your subscription, before you agree to anything." } },
  { q: { ar: "أقدر أغيّر باقتي بعدين؟", en: "Can I change my plan later?" }, a: { ar: "تقدر تجهز منتجاتك وحزمك داخل لوحة التاجر. خيارات الإضافات تظهر مع تفاصيلها قبل التفعيل.", en: "You can set up your products and bundles from the seller dashboard. Add-on options are shown with their details before activation." } },
  { q: { ar: "وش الفرق بين الاشتراك الشهري والسنوي؟", en: "What's the difference between monthly and yearly billing?" }, a: { ar: "الاشتراك المرن يعتمد على المتجر الأساسي والإضافات التي تختارها. أي خيارات إضافية تظهر بتفاصيلها قبل التفعيل.", en: "The flexible subscription is based on the base store plus any add-ons you choose. Extra options are shown with details before activation." } },
];

function FaqItem({ q, a, id }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${id}`;
  return (
    <div className="faq-item">
      <button className="faq-q" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <span className="n mono">{String(id + 1).padStart(2, "0")}</span>
        {q}
      </button>
      {open && <div className="faq-a" id={panelId} role="region">{a}</div>}
    </div>
  );
}

const NAV_T = {
  ar: { login: "تسجيل دخول", loginShort: "دخول", openStore: "إنشاء حساب", openStoreShort: "إنشاء حساب" },
  en: { login: "Log in", loginShort: "Log in", openStore: "Create account", openStoreShort: "Create account" },
};
const HERO_T = {
  ar: {
    h1a: "امتلك متجرك الرقمي", h1b: "وبيع بلا توقف",
    p: "ارفع ملفك، شارك رابط منتجك على واتساب أو إنستغرام، والعميل يطلبه ويرفع إثبات التحويل — تؤكد الاستلام فيفتح التنزيل له تلقائيًا.",
    ctaOpen: "افتح متجرك الحين ←", ctaTry: "جرّب متجرك قبل التسجيل",
    receiptTag: "#٠٠١٤", receiptHead: "وصل بيع رقمي", receiptTime: "١٤:٠٦", receiptStore: "متجر هند للتصاميم",
    receiptItem: "رزمة قوالب سيرة ذاتية", receiptItemSub: "ملف PDF قابل للتعديل", receiptPrice: "٥.٠٠",
    receiptCommission: "العمولة على البيع", receiptCommissionValue: "٪٠",
    receiptTotalLabel: "الإجمالي المستلم", receiptTotal: "٥.٠٠ ر.ع",
    stampText: "تم تأكيد", stampText2: "الاستلام",
    ledgerCommission: "العمولة على مبيعاتك", ledgerCommissionValue: "٪٠ — دائمًا",
    ledgerUnlock: "وقت فتح رابط التحميل", ledgerUnlockValue: "فور تأكيدك استلام المبلغ",
    ledgerProtection: "حماية روابط التنزيل", ledgerProtectionValue: "مفعّلة على كل منتج",
  },
  en: {
    h1a: "Own your digital store", h1b: "and sell non-stop",
    p: "Upload your file, share your product link on WhatsApp or Instagram — the buyer orders it and uploads proof of transfer. You confirm receipt, and the download unlocks for them automatically.",
    ctaOpen: "Open your store now →", ctaTry: "Try your store before signing up",
    receiptTag: "#0014", receiptHead: "Digital sale receipt", receiptTime: "14:06", receiptStore: "Hind's Design Store",
    receiptItem: "Resume templates pack", receiptItemSub: "Editable PDF file", receiptPrice: "5.00",
    receiptCommission: "Commission on sale", receiptCommissionValue: "0%",
    receiptTotalLabel: "Total received", receiptTotal: "5.00 OMR",
    stampText: "Payment confirmed", stampText2: "",
    ledgerCommission: "Commission on your sales", ledgerCommissionValue: "0% — always",
    ledgerUnlock: "Time to unlock the download link", ledgerUnlockValue: "Right after you confirm payment",
    ledgerProtection: "Download link protection", ledgerProtectionValue: "Enabled on every product",
  },
};
const SECTIONS_T = {
  ar: {
    whyEyebrow: "لماذا Monah", whyTitle: "منصة مبنية لصالحك أنت",
    howEyebrow: "البداية", howTitle: "كيف تشتغل المنصة",
    forWhomEyebrow: "لمين المنصة", forWhomTitle: "اختر نوع منتجك",
    featuresEyebrow: "المميزات", featuresTitle: "كل شي تحتاجه لبيع منتجك",
    protectionEyebrow: "الحماية", protectionTitle: "حمايتك من الألف للياء", protectionSub: "منتجك الرقمي يستحق الحماية، وإحنا نتكفل فيها",
    compareEyebrow: "المقارنة", compareTitle: "وش الفرق؟", compareSub: "مقارنة بسيطة بين Monah والمنصات التقليدية",
    compareMonah: "Monah", compareOther: "منصات تقليدية",
    pricingEyebrow: "الاشتراك", pricingTitle: "ابدأ بسيط، وكبّر متجرك متى احتجت",
    pricingSub: "متجر أساسي يشتغل من أول يوم بسعر واضح، وإضافات تفتح لك مبيعات أسرع وأذكى وقت ما تحتاجها — بدون التزام بأكثر من اللي تختاره.",
    priceBadge: "ابدأ بمبلغ رمزي", priceName: "جرّب متجرك",
    priceDesc: "صفحة متجر بهويتك، حتى منتجين، والمشاركة والتتبع — وترقّي لباقة أكبر أي وقت.",
    priceUnit: "ر.ع / شهريًا بعد التفعيل",
    priceFeature1: "✓ لوحة تاجر عربية سهلة", priceFeature2: "✓ صفحة متجر وروابط مشاركة",
    priceFeature3: "✓ تخصيص الاسم والشعار والهوية", priceFeature4: "✓ منتج مجاني وروابط تتبع الزيارات",
    addOnsLabel: "إضافات اختيارية تكبّر مبيعاتك، تختارها وقت التسجيل أو لاحقًا من لوحة التاجر:",
    openStore: "افتح متجرك الحين",
    pricingNote: "باقة التجربة نص ريال شهريًا (حتى منتجين) تُفعّل فور الدفع بالبطاقة. ترقّى للباقة الأساسية أو برو أي وقت تحتاج منتجات أكثر.",
    faqEyebrow: "أسئلة", faqTitle: "أسئلة شائعة",
    finalKicker: "خطوتك القادمة", finalTitle: "خلّ منتجك جاهزًا للمشاركة",
    finalP: "افتح متجرك الآن، ثم رتّب صفحته وخذ رابطك الخاص في مكان واحد وبشكل واضح.",
    finalCta: "افتح متجرك الحين ←", orbitCard: "متجرك الرقمي",
    footContact: "تواصل", footWhatsapp: "واتساب:", footEmail: "إيميل:",
    footLinks: "روابط", footPrivacy: "سياسة الخصوصية", footTerms: "الشروط والأحكام",
  },
  en: {
    whyEyebrow: "Why Monah", whyTitle: "A platform built for you",
    howEyebrow: "Getting started", howTitle: "How the platform works",
    forWhomEyebrow: "Who it's for", forWhomTitle: "Choose your product type",
    featuresEyebrow: "Features", featuresTitle: "Everything you need to sell your product",
    protectionEyebrow: "Protection", protectionTitle: "Your protection from A to Z", protectionSub: "Your digital product deserves protection — we've got it covered",
    compareEyebrow: "Comparison", compareTitle: "What's the difference?", compareSub: "A simple comparison between Monah and traditional platforms",
    compareMonah: "Monah", compareOther: "Traditional platforms",
    pricingEyebrow: "Subscription", pricingTitle: "Start simple, grow your store whenever you need",
    pricingSub: "A base store that works from day one at a clear price, with add-ons that unlock faster, smarter sales whenever you need them — no commitment beyond what you choose.",
    priceBadge: "Start for pocket change", priceName: "Try your store",
    priceDesc: "A store page with your identity, up to two products, sharing, and tracking — upgrade to a bigger plan anytime.",
    priceUnit: "OMR / month after activation",
    priceFeature1: "✓ Easy Arabic seller dashboard", priceFeature2: "✓ A store page with sharing links",
    priceFeature3: "✓ Customize your name, logo, and identity", priceFeature4: "✓ A free product and visit-tracking links",
    addOnsLabel: "Optional add-ons that grow your sales, chosen at signup or later from the seller dashboard:",
    openStore: "Open your store now",
    pricingNote: "The starter plan (0.5 OMR/month, up to 2 products) activates instantly on card payment. Upgrade to Basic or Pro anytime you need more products.",
    faqEyebrow: "FAQ", faqTitle: "Frequently asked questions",
    finalKicker: "Your next step", finalTitle: "Get your product ready to share",
    finalP: "Open your store now, set up its page, and get your own link in one clear place.",
    finalCta: "Open your store now →", orbitCard: "Your digital store",
    footContact: "Contact", footWhatsapp: "WhatsApp:", footEmail: "Email:",
    footLinks: "Links", footPrivacy: "Privacy policy", footTerms: "Terms & conditions",
  },
};

export default function App() {
  const [lang, setLang] = useLang();
  const nt = NAV_T[lang];
  const ht = HERO_T[lang];
  const st = SECTIONS_T[lang];
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".monah-app .reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="monah-app" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>

      <div className="wrap">
        <div className="nav">
          <div className="nav-brand">
            <img src="/monah-mark-512.png" alt="Monah" />
            <span>Monah</span>
          </div>
          <div className="nav-btns">
            <LangToggle lang={lang} onChange={setLang} className="nav-link" style={{ background: "none", border: "1px solid rgba(19,33,27,.14)", borderRadius: 100, padding: "7px 12px", cursor: "pointer", font: "inherit" }} />
            <a className="nav-link" href="#login">
              <span className="nav-text-full">{nt.login}</span>
              <span className="nav-text-short">{nt.loginShort}</span>
            </a>
            <a className="nav-cta" href={START_STORE_URL}>
              <span className="nav-text-full">{nt.openStore}</span>
              <span className="nav-text-short">{nt.openStoreShort}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <div className="hero-copy">
            <h1>{ht.h1a}<br/>{ht.h1b}</h1>
            <p>{ht.p}</p>
            <div className="hero-cta-row">
              <a className="pill-black" href={START_STORE_URL}>{ht.ctaOpen}</a>
              <a className="hero-ghost" href="#try">{ht.ctaTry}</a>
            </div>
          </div>

          <div className="receipt-stage">
            <div className="receipt-copy2" aria-hidden="true" />
            <div className="receipt">
              <div className="receipt-tag mono">{ht.receiptTag}</div>
              <div className="receipt-head">
                <b>{ht.receiptHead}</b>
                <span className="mono">{ht.receiptTime}</span>
              </div>
              <div className="receipt-sub">{ht.receiptStore}</div>
              <div className="receipt-rule" />
              <div className="receipt-line">
                <div className="label">{ht.receiptItem}<small>{ht.receiptItemSub}</small></div>
                <div className="value mono">{ht.receiptPrice}</div>
              </div>
              <div className="receipt-line">
                <div className="label">{ht.receiptCommission}</div>
                <div className="value mono">{ht.receiptCommissionValue}</div>
              </div>
              <div className="receipt-rule" />
              <div className="receipt-total">
                <b>{ht.receiptTotalLabel}</b>
                <span className="amount mono">{ht.receiptTotal}</span>
              </div>
            </div>
            <div className="stamp-impact" aria-hidden="true" />
            <div className="stamp" aria-hidden="true">
              <div className="stamp-text">{ht.stampText}<br/>{ht.stampText2}<small>Monah</small></div>
            </div>
          </div>
        </div>

        <div className="ledger">
          <div className="ledger-row">
            <span className="k">{ht.ledgerCommission}</span>
            <span className="fill" />
            <span className="v strong">{ht.ledgerCommissionValue}</span>
          </div>
          <div className="ledger-row">
            <span className="k">{ht.ledgerUnlock}</span>
            <span className="fill" />
            <span className="v">{ht.ledgerUnlockValue}</span>
          </div>
          <div className="ledger-row">
            <span className="k">{ht.ledgerProtection}</span>
            <span className="fill" />
            <span className="v strong">{ht.ledgerProtectionValue}</span>
          </div>
        </div>
      </div>

      <StorePreviewTry lang={lang} />

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.whyEyebrow}</div>
          <h2 className="section-title reveal">{st.whyTitle}</h2>
          <div className="n-list">
            {WHY.map((w) => (
              <div className="n-row reveal" key={w.n}>
                <div className="n-figure mono">{w.n}</div>
                <div className="n-text"><b>{w.title[lang]}</b><span>{w.desc[lang]}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: "#fff" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.howEyebrow}</div>
          <h2 className="section-title reveal">{st.howTitle}</h2>
          <div className="n-list">
            {STEPS.map((s) => (
              <div className="n-row reveal" key={s.n}>
                <div className="n-figure mono">{s.n}</div>
                <div className="n-text"><b>{s.title[lang]}</b><span>{s.desc[lang]}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.forWhomEyebrow}</div>
          <h2 className="section-title reveal">{st.forWhomTitle}</h2>
          <div className="style-list">
            {USECASES.map((u) => (
              <div className="style-row reveal" key={u.title.ar}>
                <div className="left">
                  <div className="style-swatch" style={{ background: u.color }} />
                  <div><b>{u.title[lang]}</b><span>{u.desc[lang]}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.featuresEyebrow}</div>
          <h2 className="section-title reveal">{st.featuresTitle}</h2>
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature reveal" key={f.title.ar}>
                <div className="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24">{f.icon}</svg></div>
                <b>{f.title[lang]}</b>
                <span>{f.desc[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.protectionEyebrow}</div>
          <h2 className="section-title reveal">{st.protectionTitle}</h2>
          <div className="section-sub reveal">{st.protectionSub}</div>
          <div className="protection">
            {PROTECTION.map((p) => (
              <div className="protection-item reveal" key={p.title.ar}>
                <div className="protection-icon"><svg width="18" height="18" viewBox="0 0 24 24">{p.icon}</svg></div>
                <b>{p.title[lang]}</b>
                <span>{p.desc[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.compareEyebrow}</div>
          <h2 className="section-title reveal">{st.compareTitle}</h2>
          <div className="section-sub reveal">{st.compareSub}</div>
          <div className="compare reveal">
            <div className="compare-row"><span></span><span style={{ textAlign: "center" }}>{st.compareMonah}</span><span style={{ textAlign: "center" }}>{st.compareOther}</span></div>
            {COMPARE.map((c) => (
              <div className="compare-row" key={c.label.ar}>
                <div className="compare-label">{c.label[lang]}</div>
                <div className="compare-monah">✓ {c.monah[lang]}</div>
                <div className="compare-other">{c.other[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pricing" style={{ background: "#fff" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.pricingEyebrow}</div>
          <h2 className="section-title reveal">{st.pricingTitle}</h2>
          <div className="section-sub reveal">{st.pricingSub}</div>

          <div className="pricing">
            <div className="price-card reveal popular">
              <div className="price-badge">{st.priceBadge}</div>
              <div className="price-name">{st.priceName}</div>
              <div className="price-desc">{st.priceDesc}</div>
              <div className="price-value mono">{STARTER_MONTHLY_PRICE}<span>{st.priceUnit}</span></div>
              <div className="price-features">
                <div>{st.priceFeature1}</div>
                <div>{st.priceFeature2}</div>
                <div>{st.priceFeature3}</div>
                <div>{st.priceFeature4}</div>
              </div>
              <div className="price-soon">
                <div className="price-soon-label">{st.addOnsLabel}</div>
                {ADD_ON_CATALOG.map((item) => (
                  <div key={item.key} style={{ marginBottom: 10 }}>
                    <div>○ <b>{lang === "en" ? item.titleEn : item.title}</b> — {item.price > 0 ? `${item.price} ${lang === "en" ? "OMR" : "ر.ع"}` : (lang === "en" ? "Free" : "مجانًا")}</div>
                    <div style={{ color: "#5A5648", fontSize: 12, lineHeight: 1.7, marginRight: 16 }}>{lang === "en" ? item.descEn : item.desc}</div>
                  </div>
                ))}
              </div>
              <a className="price-btn" href={START_STORE_URL}>{st.openStore}</a>
            </div>
          </div>
          <div className="pricing-note">{st.pricingNote}</div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">{st.faqEyebrow}</div>
          <h2 className="section-title reveal">{st.faqTitle}</h2>
          <div className="faq reveal">
            {FAQS.map((f, i) => <FaqItem key={f.q.ar} id={i} q={f.q[lang]} a={f.a[lang]} />)}
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="wrap">
          <div className="final-cta-inner">
            <div className="final-copy">
              <div className="final-kicker">{st.finalKicker}</div>
              <h3>{st.finalTitle}</h3>
              <p>{st.finalP}</p>
              <a className="pill-black" href={START_STORE_URL}>{st.finalCta}</a>
            </div>
            <div className="final-orbit" aria-hidden="true">
              <div className="orbit-plane" />
              <div className="orbit-plane" />
              <div className="orbit-card">Monah<small>{st.orbitCard}</small></div>
            </div>
          </div>
        </div>
      </div>

      <div className="foot-black">
        <div className="foot-top">
          <div><b>{st.footContact}</b><div className="foot-contact">{st.footWhatsapp} <a href="https://wa.me/96876630905" target="_blank" rel="noopener noreferrer">76630905</a></div><div className="foot-contact" style={{ marginTop: 4 }}>{st.footEmail} <a href="mailto:monahapp@outlook.sa">monahapp@outlook.sa</a></div></div>
          <div><b>{st.footLinks}</b><a href="#privacy">{st.footPrivacy}</a><a href="#terms">{st.footTerms}</a></div>
        </div>
        <div className="foot-wordmark">Monah</div>
      </div>
    </div>
  );
}
