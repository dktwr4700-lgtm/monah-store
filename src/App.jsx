import React, { useState, useEffect } from "react";
import { ADD_ON_CATALOG, BASE_MONTHLY_PRICE } from "./subscriptionCatalog.js";

const styles = `
  .monah-app *{ box-sizing:border-box; }
  .monah-app{ font-family:'Cairo', sans-serif; background:#F5F2EA; color:#13211B; overflow:hidden; }
  .monah-app .mono{ font-family:'JetBrains Mono', monospace; }
  .monah-app a{ text-decoration:none; }
  .monah-app :focus-visible{ outline:2px solid #0E3B2C; outline-offset:2px; }
  .wrap{ max-width:1160px; margin:0 auto; padding:0 22px; }

  .reveal{ opacity:0; transform:translateY(26px); transition:opacity .7s ease, transform .7s ease; }
  .reveal.in{ opacity:1; transform:translateY(0); }

  .nav{ display:flex; justify-content:space-between; align-items:center; direction:ltr; margin-top:16px; padding:12px 14px 12px 18px; background:rgba(255,255,255,.76); border:1px solid rgba(19,33,27,.09); border-radius:18px; box-shadow:0 12px 30px rgba(23,35,28,.06); position:relative; z-index:10; backdrop-filter:blur(12px); }
  .nav-brand{ display:flex; align-items:center; gap:9px; font-family:'Almarai', sans-serif; font-weight:800; font-size:18px; color:#112A20; }
  .nav-brand img{ width:29px; height:29px; border-radius:9px; display:block; box-shadow:0 5px 14px rgba(14,59,44,.16); }
  .nav-btns{ display:flex; gap:10px; align-items:center; }
  .nav-btns{ direction:rtl; }
  .nav-link{ font-size:13px; font-weight:700; color:#375044; padding:8px 5px; }
  .nav-cta{ background:#153A2C; color:#fff; padding:10px 18px; border-radius:100px; font-size:12.5px; font-weight:700; box-shadow:0 8px 18px rgba(14,59,44,.18); }

  /* ===== HERO ===== */
  .hero{ margin-top:40px; display:flex; align-items:center; gap:0; }
  .hero-copy{ flex:1 1 380px; min-width:280px; padding-inline-end:44px; position:relative; z-index:2; }
  .hero h1{ font-family:'Almarai', sans-serif; font-weight:800; font-size:clamp(32px,4.1vw,48px); line-height:1.32; color:#153A2C; margin-bottom:18px; letter-spacing:-.02em; text-wrap:balance; }
  .hero p{ color:#8A8677; font-size:15px; line-height:1.9; max-width:400px; margin-bottom:26px; }
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
  .receipt-head span{ font-size:11px; color:#8A8677; }
  .receipt-sub{ font-size:11px; color:#8A8677; margin-bottom:16px; }
  .receipt-rule{ border-top:1px dashed #E1DDD1; margin:14px 0; }
  .receipt-line{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; font-size:12.5px; padding:5px 0; }
  .receipt-line .label{ color:#0B0B0C; }
  .receipt-line .label small{ display:block; color:#8A8677; font-size:10.5px; margin-top:2px; }
  .receipt-line .value{ font-size:12.5px; color:#0B0B0C; }
  .receipt-total{ display:flex; justify-content:space-between; align-items:baseline; margin-top:14px; }
  .receipt-total b{ font-size:11.5px; color:#8A8677; font-weight:600; }
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
  .ledger-row .v{ font-size:13px; color:#8A8677; white-space:nowrap; }
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
  .section-sub{ text-align:center; color:#8A8677; font-size:13.5px; margin-bottom:34px; }

  .n-list{ max-width:640px; margin:0 auto; }
  .n-row{ display:flex; align-items:center; gap:16px; padding:18px 4px; border-top:1px solid #EDEAE0; }
  .n-row:first-child{ border-top:none; }
  .n-figure{ font-family:'Almarai', sans-serif; font-weight:800; font-size:15px; color:#B9832F; min-width:26px; }
  .n-text b{ display:block; font-size:14px; font-weight:700; margin-bottom:3px; }
  .n-text span{ color:#8A8677; font-size:12.5px; line-height:1.7; }

  .style-list{ max-width:640px; margin:0 auto; }
  .style-row{ display:flex; justify-content:space-between; align-items:center; padding:16px 4px; border-top:1px solid #EDEAE0; }
  .style-row:first-child{ border-top:none; }
  .style-row .left{ display:flex; align-items:center; gap:13px; }
  .style-swatch{ width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; }
  .style-row b{ display:block; font-size:13.5px; font-weight:700; color:#0B0B0C; }
  .style-row span{ font-size:11px; color:#8A8677; }

  .features{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .feature{ background:#FFFFFF; border:1px solid #E7E2D6; border-radius:18px; padding:23px; box-shadow:0 12px 24px rgba(26,46,35,.035); }
  .feature-icon{ width:34px; height:34px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
  .feature b{ display:block; font-size:13.5px; font-weight:700; margin-bottom:5px; }
  .feature span{ color:#8A8677; font-size:12px; line-height:1.7; }

  .protection{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .protection-item{ background:#FFFDF8; border:1px solid #E7E2D6; border-radius:18px; padding:23px; }
  .protection-icon{ width:34px; height:34px; border-radius:9px; background:#F3E9D6; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
  .protection-item b{ display:block; font-size:13.5px; font-weight:700; margin-bottom:5px; }
  .protection-item span{ color:#8A8677; font-size:12px; line-height:1.7; }

  .compare{ max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #EDEAE0; border-radius:16px; overflow:hidden; }
  .compare-row{ display:grid; grid-template-columns:1.3fr 1fr 1fr; align-items:center; padding:13px 18px; border-top:1px solid #EDEAE0; }
  .compare-row:first-child{ border-top:none; background:#FBFAF7; }
  .compare-row:first-child span{ font-size:11px; font-weight:700; color:#8A8677; }
  .compare-label{ color:#3D4A66; font-size:12.5px; }
  .compare-monah{ text-align:center; color:#4B6152; font-weight:700; font-size:12.5px; }
  .compare-other{ text-align:center; color:#B0AC9C; font-size:12.5px; }

  .billing-toggle{ display:flex; justify-content:center; align-items:center; gap:14px; margin-bottom:14px; }
  .billing-btn{ padding:10px 20px; border-radius:100px; font-size:12.5px; font-weight:700; cursor:pointer; border:1px solid #EDEAE0; background:#FFFFFF; color:#3D4A66; }
  .billing-btn.active{ background:#0B0B0C; color:#fff; border-color:#0B0B0C; }
  .billing-save-badge{ background:#EAF0EB; color:#4B6152; font-size:10px; font-weight:700; padding:3px 9px; border-radius:100px; margin-right:6px; }

  .common-features{ text-align:center; color:#8A8677; font-size:11.5px; max-width:640px; margin:0 auto 28px; line-height:2; }
  .common-features b{ color:#0B0B0C; }

  .pricing{ display:flex; gap:16px; max-width:920px; margin:0 auto 20px; flex-wrap:wrap; justify-content:center; align-items:stretch; }
  .price-card{ flex:1; min-width:220px; max-width:280px; background:#FFFFFF; border:1px solid #E5E0D5; border-radius:20px; padding:30px 24px 25px; position:relative; display:flex; flex-direction:column; box-shadow:0 12px 28px rgba(24,44,32,.04); }
  .price-card.popular{ border:2px solid #153A2C; padding-top:30px; box-shadow:0 18px 36px rgba(21,58,44,.12); transform:translateY(-6px); }
  .price-badge{ position:absolute; top:-12px; right:22px; background:#B9832F; color:#fff; font-size:10.5px; font-weight:700; padding:5px 12px; border-radius:100px; }
  .price-name{ font-family:'Almarai', sans-serif; font-weight:800; font-size:14.5px; margin-bottom:6px; }
  .price-desc{ color:#8A8677; font-size:11px; line-height:1.7; margin-bottom:14px; min-height:30px; }
  .price-value{ display:flex; align-items:baseline; gap:6px; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:24px; margin-bottom:4px; }
  .price-value span{ font-size:11.5px; color:#8A8677; font-family:'Cairo', sans-serif; font-weight:400; }
  .price-yearly-note{ font-size:10.5px; color:#B9832F; font-weight:700; margin-bottom:14px; padding-bottom:14px; border-bottom:1px dashed #EDEAE0; min-height:14px; }
  .price-features{ flex:1; }
  .price-features div{ display:flex; align-items:flex-start; gap:8px; font-size:12.5px; color:#3D4A66; line-height:1.6; padding:5px 0; }
  .price-soon{ margin-top:8px; padding-top:8px; border-top:1px dashed #EDEAE0; }
  .price-soon-label{ color:#B9832F; font-size:9.5px; font-weight:700; margin-bottom:4px; }
  .price-soon div{ font-size:10.5px; color:#B0AC9C; padding:2px 0; }
  .price-btn{ width:100%; margin-top:18px; padding:12px; border-radius:9px; font-size:12.5px; font-weight:700; cursor:pointer; border:1.5px solid #0B0B0C; background:transparent; color:#0B0B0C; display:block; text-align:center; }
  .price-card.popular .price-btn{ background:#153A2C; color:#fff; border:none; }
  .pricing-note{ text-align:center; color:#8A8677; font-size:11.5px; max-width:480px; margin:0 auto; line-height:1.8; }

  .faq{ max-width:640px; margin:0 auto; }
  .faq-item{ border-top:1px solid #EDEAE0; }
  .faq-item:last-child{ border-bottom:1px solid #EDEAE0; }
  .faq-q{ width:100%; text-align:right; background:none; border:none; cursor:pointer; padding:17px 0; display:flex; gap:12px; align-items:center; font-size:14px; font-weight:700; font-family:'Cairo', sans-serif; color:#0B0B0C; }
  .faq-q .n{ color:#B9832F; font-family:'JetBrains Mono', monospace; font-size:11.5px; }
  .faq-a{ color:#8A8677; font-size:12.5px; line-height:1.8; padding-bottom:17px; padding-right:28px; max-width:500px; }

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

  .monah-app button{ transition:transform 100ms ease-out; }
  .monah-app button:active{ transform:scale(0.96); }
`;

const FEATURES = [
  { title: "التسليم الرقمي", desc: "يفتح تلقائيًا للعميل بعد ما يرفع إثبات التحويل ويؤكد التاجر استلام المبلغ من لوحة الطلبات.", icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
  { title: "رابط لكل منتج", desc: "كل منتج له رابط خاص فيه، تشاركه بأي مكان تحب.", icon: <path d="M12 3v18M3 12h18" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/> },
  { title: "متابعة المتجر", desc: "تابع منتجاتك وطلباتك من لوحة التاجر. لوحة المبيعات والتقارير المتقدمة تظهر عند تفعيل الدفع الإلكتروني لاحقًا.", icon: <><rect x="3" y="4" width="18" height="14" rx="2" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M3 9h18" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: "إعداد بدقائق", desc: "بدون خبرة تقنية، وبدون كمبيوتر أو استضافة خارجية.", icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
];

const PROTECTION = [
  { title: "روابط تحميل مقيّدة", desc: "رابط التنزيل يفتح للعميل فقط بعد تأكيد التاجر استلام المبلغ، ولا يبقى صالحًا للمشاركة بصورة دائمة.", icon: <><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { title: "حفظ الملفات بشكل محمي", desc: "ملف المنتج لا يظهر للزائر في المتجر العام. وصول العميل يتاح فقط بعد تأكيد التاجر استلام المبلغ.", icon: <><rect x="5" y="11" width="14" height="9" rx="2" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M8 11V8a4 4 0 1 8 0v3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { title: "حماية وصول العميل", desc: "إتاحة الرابط للمشتري تُدار تلقائيًا بعد تأكيد التاجر استلام المبلغ من لوحة الطلبات.", icon: <><path d="M9 12l2 2 4-4" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
];

const WHY = [
  { n: "01", title: "احتفظ بسعر بيعك كاملًا", desc: "لا توجد عمولة إضافية على المبيعات. تفاصيل الاشتراك تظهر بوضوح قبل أي تفعيل." },
  { n: "02", title: "يدعم كل أنواع الملفات", desc: "PDF، ZIP، صور، فيديوهات، أكواد، وأي ملف رقمي تبيعه." },
  { n: "03", title: "بدون خبرة تقنية", desc: "ما تحتاج كمبيوتر ولا استضافة خارجية، كل شي من متجرك مباشرة." },
];

const COMPARE = [
  { label: "العمولة على المبيعات", monah: "٪٠", other: "نسبة من كل عملية بيع" },
  { label: "رسوم الاشتراك", monah: "٥ ر.ع شهريًا", other: "غالبًا متغيّرة" },
];

const USECASES = [
  { title: "ملفات وتصاميم", desc: "PDF، قوالب، صور", color: "#0E3B2C" },
  { title: "أكواد وتراخيص", desc: "سكربتات، مفاتيح تفعيل", color: "#B9832F" },
  { title: "دورات وملفات تعليمية", desc: "فيديو، ملخصات", color: "#4B6152" },
  { title: "برستات ومحتوى", desc: "قوالب سوشيال ميديا", color: "#8A8677" },
];

const START_STORE_URL = "#start-store";

const STEPS = [
  { n: "01", title: "تفتح متجرك وتفعّل اشتراكك", desc: "تسجّل بياناتك وتختار كلمة مرورك بنفسك، وتدفع اشتراكك الشهري بالبطاقة أو تحويل يدوي." },
  { n: "02", title: "ترفع منتجاتك الرقمية", desc: "ملفات، تصاميم، أكواد — أي شي رقمي تبيعه." },
  { n: "03", title: "تشارك الرابط وتستلم الطلبات", desc: "العميل يطلب المنتج ويرفع إثبات التحويل، وأنت تؤكد الاستلام فيفتح التنزيل له تلقائيًا." },
];

const FAQS = [
  { q: "هل أحتاج خبرة تقنية؟", a: "أبدًا. ترفع ملفك وتحدد السعر، تشارك رابط منتجك، والعميل يطلبه ويرفع إثبات التحويل — وأنت تؤكد الاستلام ليوصله الملف." },
  { q: "وش أنواع الملفات المسموحة؟", a: "أي ملف رقمي: PDF، تصاميم، أكواد، فيديوهات، وغيرها." },
  { q: "فيه عمولة على مبيعاتي؟", a: "لا توجد عمولة إضافية على المبيعات. وتظهر تفاصيل الاشتراك والسعر قبل أي تفعيل." },
  { q: "أقدر أربط دومين خاص فيني؟", a: "هذي ميزة قادمة قريبًا للباقة المتكاملة، لسا قيد التطوير." },
  { q: "وش يصير لو ألغيت اشتراكي؟", a: "تظهر سياسة الإلغاء بوضوح عند تفعيل الاشتراك، قبل أن توافق على أي تفعيل." },
  { q: "أقدر أغيّر باقتي بعدين؟", a: "تقدر تجهز منتجاتك وحزمك داخل لوحة التاجر. خيارات الإضافات تظهر مع تفاصيلها قبل التفعيل." },
  { q: "وش الفرق بين الاشتراك الشهري والسنوي؟", a: "الاشتراك المرن يعتمد على المتجر الأساسي والإضافات التي تختارها. أي خيارات إضافية تظهر بتفاصيلها قبل التفعيل." },
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

export default function App() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".monah-app .reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="monah-app" dir="rtl" lang="ar">
      <style>{styles}</style>

      <div className="wrap">
        <div className="nav">
          <div className="nav-brand">
            <img src="/monah-mark-512.png" alt="Monah" />
            <span>Monah</span>
          </div>
          <div className="nav-btns">
            <a className="nav-link" href="#login">تسجيل الدخول</a>
            <a className="nav-cta" href={START_STORE_URL}>افتح متجرك الحين</a>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <div className="hero-copy">
            <h1>بيع منتجك الرقمي<br/>من رابط واحد</h1>
            <p>ارفع ملفك، شارك رابط منتجك على واتساب أو إنستغرام، والعميل يطلبه ويرفع إثبات التحويل — تؤكد الاستلام فيفتح التنزيل له تلقائيًا.</p>
            <div className="hero-cta-row">
              <a className="pill-black" href={START_STORE_URL}>افتح متجرك الحين ←</a>
              <a className="hero-ghost" href="#how">شاهد كيف تعمل</a>
            </div>
          </div>

          <div className="receipt-stage">
            <div className="receipt-copy2" aria-hidden="true" />
            <div className="receipt">
              <div className="receipt-tag mono">#٠٠١٤</div>
              <div className="receipt-head">
                <b>وصل بيع رقمي</b>
                <span className="mono">١٤:٠٦</span>
              </div>
              <div className="receipt-sub">متجر هند للتصاميم</div>
              <div className="receipt-rule" />
              <div className="receipt-line">
                <div className="label">رزمة قوالب سيرة ذاتية<small>ملف PDF قابل للتعديل</small></div>
                <div className="value mono">٥.٠٠</div>
              </div>
              <div className="receipt-line">
                <div className="label">العمولة على البيع</div>
                <div className="value mono">٪٠</div>
              </div>
              <div className="receipt-rule" />
              <div className="receipt-total">
                <b>الإجمالي المستلم</b>
                <span className="amount mono">٥.٠٠ ر.ع</span>
              </div>
            </div>
            <div className="stamp-impact" aria-hidden="true" />
            <div className="stamp" aria-hidden="true">
              <div className="stamp-text">تم تأكيد<br/>الاستلام<small>Monah</small></div>
            </div>
          </div>
        </div>

        <div className="ledger">
          <div className="ledger-row">
            <span className="k">العمولة على مبيعاتك</span>
            <span className="fill" />
            <span className="v strong">٪٠ — دائمًا</span>
          </div>
          <div className="ledger-row">
            <span className="k">وقت فتح رابط التحميل</span>
            <span className="fill" />
            <span className="v">فور تأكيدك استلام المبلغ</span>
          </div>
          <div className="ledger-row">
            <span className="k">حماية روابط التنزيل</span>
            <span className="fill" />
            <span className="v strong">مفعّلة على كل منتج</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">لماذا Monah</div>
          <h2 className="section-title reveal">منصة مبنية لصالحك أنت</h2>
          <div className="n-list">
            {WHY.map((w) => (
              <div className="n-row reveal" key={w.title}>
                <div className="n-figure mono">{w.n}</div>
                <div className="n-text"><b>{w.title}</b><span>{w.desc}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how" style={{ background: "#FBFAF7" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">البداية</div>
          <h2 className="section-title reveal">كيف تشتغل المنصة</h2>
          <div className="n-list">
            {STEPS.map((s) => (
              <div className="n-row reveal" key={s.n}>
                <div className="n-figure mono">{s.n}</div>
                <div className="n-text"><b>{s.title}</b><span>{s.desc}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">لمين المنصة</div>
          <h2 className="section-title reveal">اختر نوع منتجك</h2>
          <div className="style-list">
            {USECASES.map((u) => (
              <div className="style-row reveal" key={u.title}>
                <div className="left">
                  <div className="style-swatch" style={{ background: u.color }} />
                  <div><b>{u.title}</b><span>{u.desc}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#FBFAF7" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">المميزات</div>
          <h2 className="section-title reveal">كل شي تحتاجه لبيع منتجك</h2>
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature reveal" key={f.title}>
                <div className="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24">{f.icon}</svg></div>
                <b>{f.title}</b>
                <span>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">الحماية</div>
          <h2 className="section-title reveal">حمايتك من الألف للياء</h2>
          <div className="section-sub reveal">منتجك الرقمي يستحق الحماية، وإحنا نتكفل فيها</div>
          <div className="protection">
            {PROTECTION.map((p) => (
              <div className="protection-item reveal" key={p.title}>
                <div className="protection-icon"><svg width="18" height="18" viewBox="0 0 24 24">{p.icon}</svg></div>
                <b>{p.title}</b>
                <span>{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#FBFAF7" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">المقارنة</div>
          <h2 className="section-title reveal">وش الفرق؟</h2>
          <div className="section-sub reveal">مقارنة بسيطة بين Monah والمنصات التقليدية</div>
          <div className="compare reveal">
            <div className="compare-row"><span></span><span style={{ textAlign: "center" }}>Monah</span><span style={{ textAlign: "center" }}>منصات تقليدية</span></div>
            {COMPARE.map((c) => (
              <div className="compare-row" key={c.label}>
                <div className="compare-label">{c.label}</div>
                <div className="compare-monah">✓ {c.monah}</div>
                <div className="compare-other">{c.other}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pricing" style={{ background: "#FBFAF7" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">الاشتراك</div>
          <h2 className="section-title reveal">ابدأ بسيط، وكبّر متجرك متى احتجت</h2>
          <div className="section-sub reveal">متجر أساسي يشتغل من أول يوم بسعر واضح، وإضافات تفتح لك مبيعات أسرع وأذكى وقت ما تحتاجها — بدون التزام بأكثر من اللي تختاره.</div>

          <div className="pricing">
            <div className="price-card reveal popular">
              <div className="price-badge">اشتراك مرن</div>
              <div className="price-name">متجرك الأساسي</div>
              <div className="price-desc">صفحة متجر بهويتك، إدارة المنتجات، والمشاركة والتتبع والمنتجات المجانية.</div>
              <div className="price-value mono">{BASE_MONTHLY_PRICE}<span>ر.ع / شهريًا بعد التفعيل</span></div>
              <div className="price-features">
                <div>✓ لوحة تاجر عربية سهلة</div>
                <div>✓ صفحة متجر وروابط مشاركة</div>
                <div>✓ تخصيص الاسم والشعار والهوية</div>
                <div>✓ منتج مجاني وروابط تتبع الزيارات</div>
              </div>
              <div className="price-soon">
                <div className="price-soon-label">إضافات اختيارية تكبّر مبيعاتك، تختارها وقت التسجيل أو لاحقًا من لوحة التاجر:</div>
                {ADD_ON_CATALOG.map((item) => (
                  <div key={item.key} style={{ marginBottom: 10 }}>
                    <div>○ <b>{item.title}</b> — {item.price} ر.ع</div>
                    <div style={{ color: "#8A8677", fontSize: 12, lineHeight: 1.7, marginRight: 16 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              <a className="price-btn" href={START_STORE_URL}>افتح متجرك الحين</a>
            </div>
          </div>
          <div className="pricing-note">الاشتراك الأساسي ٥ ر.ع شهريًا يُفعّل فور الدفع بالبطاقة. أي إضافة تختارها تُضاف لمبلغ اشتراكك الشهري تلقائيًا.</div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">أسئلة</div>
          <h2 className="section-title reveal">أسئلة شائعة</h2>
          <div className="faq reveal">
            {FAQS.map((f, i) => <FaqItem key={f.q} id={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <div className="final-cta">
        <div className="wrap">
          <div className="final-cta-inner">
            <div className="final-copy">
              <div className="final-kicker">خطوتك القادمة</div>
              <h3>خلّ منتجك جاهزًا للمشاركة</h3>
              <p>افتح متجرك الآن، ثم رتّب صفحته وخذ رابطك الخاص في مكان واحد وبشكل واضح.</p>
              <a className="pill-black" href={START_STORE_URL}>افتح متجرك الحين ←</a>
            </div>
            <div className="final-orbit" aria-hidden="true">
              <div className="orbit-plane" />
              <div className="orbit-plane" />
              <div className="orbit-card">Monah<small>متجرك الرقمي</small></div>
            </div>
          </div>
        </div>
      </div>

      <div className="foot-black">
        <div className="foot-top">
          <div><b>تواصل</b><div className="foot-contact">واتساب: <a href="https://wa.me/96876630905" target="_blank" rel="noopener noreferrer">76630905</a></div><div className="foot-contact" style={{ marginTop: 4 }}>إيميل: <a href="mailto:monahapp@outlook.sa">monahapp@outlook.sa</a></div></div>
          <div><b>روابط</b><a href="#privacy">سياسة الخصوصية</a><a href="#terms">الشروط والأحكام</a></div>
        </div>
        <div className="foot-wordmark">Monah</div>
      </div>
    </div>
  );
}
