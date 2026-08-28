import React, { useState, useEffect, useRef } from "react";

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
  .hero{ margin-top:18px; padding:58px 58px 42px; display:flex; align-items:center; gap:50px; background:linear-gradient(130deg,#102F24 0%,#174434 62%,#245344 100%); border-radius:32px; position:relative; overflow:hidden; isolation:isolate; box-shadow:0 28px 60px rgba(15,45,34,.18); }
  .hero::before{ content:""; position:absolute; width:430px; height:430px; border:1px solid rgba(214,243,92,.22); border-radius:50%; left:-175px; top:-225px; z-index:-1; }
  .hero::after{ content:""; position:absolute; width:290px; height:290px; background:rgba(214,243,92,.08); border-radius:50%; right:34%; bottom:-205px; filter:blur(2px); z-index:-1; }
  .hero-copy{ flex:1; min-width:280px; position:relative; z-index:2; }
  .hero-eyebrow{ display:inline-flex; align-items:center; gap:7px; background:rgba(214,243,92,.13); border:1px solid rgba(214,243,92,.26); color:#D6F35C; font-size:11.5px; font-weight:700; padding:7px 14px; border-radius:100px; margin-bottom:20px; }
  .hero-eyebrow::before{ content:""; width:6px; height:6px; background:#D6F35C; border-radius:50%; box-shadow:0 0 0 4px rgba(214,243,92,.13); }
  .hero h1{ font-family:'Almarai', sans-serif; font-weight:800; font-size:clamp(34px,4.1vw,50px); line-height:1.26; color:#FFFDF7; margin-bottom:16px; letter-spacing:-.025em; }
  .hero p{ color:#D7E2DB; font-size:15px; line-height:1.9; max-width:400px; margin-bottom:22px; }
  .pill-black{ display:inline-flex; align-items:center; gap:8px; background:#D6F35C; color:#143226; padding:14px 23px; border-radius:100px; font-weight:800; font-size:14px; cursor:pointer; border:none; font-family:'Cairo', sans-serif; box-shadow:0 10px 22px rgba(0,0,0,.15); }
  .hero-ghost{ display:inline-flex; margin:0 14px 0 0; color:#E5EEE9; font-size:12.5px; border-bottom:1px solid rgba(229,238,233,.45); padding-bottom:2px; }
  .hero-signals{ display:flex; flex-wrap:wrap; gap:12px 18px; margin-top:25px; color:#D7E2DB; font-size:11.5px; font-weight:600; }
  .hero-signals span{ display:flex; align-items:center; gap:6px; }
  .hero-signals i{ width:17px; height:17px; display:inline-flex; align-items:center; justify-content:center; background:rgba(214,243,92,.15); color:#D6F35C; border-radius:50%; font-style:normal; font-size:10px; }

  .progress-dots{ display:flex; gap:6px; margin-top:23px; }
  .progress-dots span{ width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.28); transition:background .3s ease, width .3s ease; }
  .progress-dots span.active{ background:#D6F35C; width:18px; border-radius:4px; }

  .hero-phone-col{ flex:0 0 315px; display:flex; justify-content:center; position:relative; perspective:1200px; z-index:2; }
  .hero-phone-col::before{ content:""; position:absolute; width:350px; height:210px; bottom:22px; left:50%; transform:translateX(-50%) rotateX(64deg) rotateZ(-18deg); background:linear-gradient(rgba(214,243,92,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(214,243,92,.18) 1px,transparent 1px); background-size:24px 24px; border-radius:34px; opacity:.7; pointer-events:none; }
  .hero-phone-col::after{ content:""; position:absolute; width:276px; height:276px; top:78px; left:12px; border:1px solid rgba(214,243,92,.3); border-radius:50%; transform:rotateX(58deg) rotateZ(35deg); pointer-events:none; }
  .phone{ width:276px; height:556px; background:#0A1511; border-radius:42px; padding:11px; box-shadow:0 40px 70px rgba(0,0,0,.32),0 0 0 1px rgba(255,255,255,.16); position:relative; transform-style:preserve-3d; transition:transform .25s ease-out; }
  .phone-screen{ width:100%; height:100%; background:#FBFAF6; border-radius:32px; overflow:hidden; position:relative; }
  .phone-notch{ position:absolute; top:0; left:50%; transform:translateX(-50%); width:115px; height:24px; background:#0B0B0C; border-radius:0 0 15px 15px; z-index:6; }
  .screen-status{ display:flex; justify-content:space-between; padding:13px 18px 4px; font-size:10px; color:#0B0B0C; }
  .screen-top{ display:flex; justify-content:space-between; align-items:center; padding:14px 16px 6px; }
  .screen-logo{ width:18px; height:18px; border-radius:5px; background:#0E3B2C; }
  .screen-menu{ color:#0B0B0C; font-size:15px; }

  .screen-stage{ position:relative; height:400px; overflow:hidden; }
  .slide{ position:absolute; inset:0; opacity:0; transform:translateX(22px); transition:opacity .5s ease, transform .5s ease; }
  .slide.active{ opacity:1; transform:translateX(0); }

  .screen-title{ padding:16px 16px 6px; font-family:'Almarai', sans-serif; font-weight:800; font-size:18px; line-height:1.35; color:#0B0B0C; }
  .screen-sub{ padding:0 16px 12px; font-size:10.5px; color:#8A8677; line-height:1.6; max-width:210px; }
  .screen-visual{ margin:6px 16px; height:135px; border-radius:15px; background:linear-gradient(135deg, #0E3B2C, #1C4632); display:flex; align-items:center; justify-content:center; }
  .screen-visual .pct{ color:#D6F35C; font-family:'Almarai', sans-serif; font-weight:800; font-size:30px; }
  .screen-card{ margin:12px 16px; background:#FFFFFF; border:1px solid #EDEAE0; border-radius:13px; padding:11px 13px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 8px 20px rgba(0,0,0,0.04); }
  .screen-card .left{ display:flex; align-items:center; gap:9px; }
  .screen-card .icon{ width:30px; height:30px; border-radius:8px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; font-size:13px; }
  .screen-card b{ display:block; font-size:11.5px; font-weight:700; color:#0B0B0C; }
  .screen-card span{ font-size:9.5px; color:#8A8677; }
  .screen-card .pct2{ font-size:10.5px; color:#4B6152; font-weight:700; }

  .confirm-badge{ margin:26px auto 0; width:80px; height:80px; border-radius:50%; background:#EAF0EB; display:flex; align-items:center; justify-content:center; font-size:30px; color:#4B6152; }
  .confirm-title{ text-align:center; font-family:'Almarai', sans-serif; font-weight:800; font-size:15.5px; margin-top:14px; }
  .confirm-sub{ text-align:center; font-size:10.5px; color:#8A8677; margin-top:5px; }
  .confirm-amount{ text-align:center; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:23px; color:#0B0B0C; margin-top:14px; }

  .screen-nav{ position:absolute; bottom:14px; left:14px; right:14px; background:#0B0B0C; border-radius:100px; padding:11px; display:flex; justify-content:space-around; z-index:5; }
  .screen-nav span{ width:14px; height:14px; border-radius:4px; background:#4B4B4B; }
  .screen-nav span.dot-active{ background:#D6F35C; }

  .float-card{ position:absolute; bottom:56px; left:-26px; background:#FFFFFF; border-radius:15px; padding:11px 15px; box-shadow:0 20px 40px rgba(0,0,0,0.12); display:flex; align-items:center; gap:11px; border:1px solid #F1F0EA; transition:transform .25s ease-out; }
  .float-card .icon{ width:34px; height:34px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; font-size:15px; }
  .float-card b{ display:block; font-size:12px; font-weight:700; }
  .float-card span{ font-size:10px; color:#8A8677; }

  .stats{ display:flex; border:1px solid #E1DDD1; background:#FFFEFA; border-radius:18px; max-width:720px; margin:28px auto 0; overflow:hidden; box-shadow:0 10px 30px rgba(34,46,37,.05); }
  .stat{ flex:1; text-align:center; padding:20px 10px; border-inline-start:1px solid #E8E3D8; }
  .stat:first-child{ border-inline-start:none; }
  .stat b{ display:block; font-family:'Almarai', sans-serif; font-weight:800; font-size:18px; color:#153A2C; }
  .stat span{ display:block; color:#8A8677; font-size:11.5px; margin-top:4px; }

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
    .hero{ flex-direction:column; padding:38px 22px 30px; border-radius:24px; gap:28px; }
    .hero h1{ font-size:29px; text-align:center; }
    .hero-copy{ text-align:center; }
    .hero p{ margin-inline:auto; }
    .hero-signals{ justify-content:center; gap:10px; }
    .hero-ghost{ display:inline-flex; margin:14px 0 0; }
    .progress-dots{ justify-content:center; }
    .float-card{ display:none; }
    .phone{ width:230px; height:470px; }
    .screen-stage{ height:320px; }
    section.section{ padding:54px 0; }
    .price-card.popular{ transform:none; }
    .hero-phone-col::before{ width:270px; bottom:15px; }
    .hero-phone-col::after{ width:220px; height:220px; left:5px; }
    .final-cta{ padding:50px 0 24px; }
    .final-cta-inner{ padding:34px 24px 28px; min-height:0; flex-direction:column; text-align:center; }
    .final-orbit{ transform:scale(.82); margin:-20px 0 -26px; }
    .foot-wordmark{ text-align:center; }
  }

  .monah-app button{ transition:transform 100ms ease-out; }
  .monah-app button:active{ transform:scale(0.96); }
`;

const FEATURES = [
  { title: "التسليم الرقمي", desc: "يصبح متاحًا عند تفعيل خدمة البيع الإلكتروني في المنصة. حتى ذلك الوقت يجهّز التاجر منتجه ورابط مشاركته.", icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
  { title: "رابط لكل منتج", desc: "كل منتج له رابط خاص فيه، تشاركه بأي مكان تحب.", icon: <path d="M12 3v18M3 12h18" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/> },
  { title: "متابعة المتجر", desc: "تابع منتجاتك ومسوداتك من لوحة التاجر. التقارير المتقدمة تظهر عند تفعيل خدمات البيع الإلكتروني.", icon: <><rect x="3" y="4" width="18" height="14" rx="2" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M3 9h18" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: "إعداد بدقائق", desc: "بدون خبرة تقنية، وبدون كمبيوتر أو استضافة خارجية.", icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
];

const PROTECTION = [
  { title: "روابط تحميل مقيّدة", desc: "تتاح عند تفعيل الشراء الإلكتروني للمحافظة على خصوصية المنتج وعدم مشاركة الرابط بصورة دائمة.", icon: <><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { title: "حفظ الملفات بشكل محمي", desc: "ملف المنتج لا يظهر للزائر في المتجر العام. وصول العميل يتاح ضمن خدمات البيع عند تفعيلها.", icon: <><rect x="5" y="11" width="14" height="9" rx="2" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M8 11V8a4 4 0 1 8 0v3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { title: "حماية وصول العميل", desc: "إتاحة الرابط للمشتري تُدار ضمن خدمة البيع الإلكتروني عند تشغيلها.", icon: <><path d="M9 12l2 2 4-4" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
];

const WHY = [
  { n: "01", title: "احتفظ بسعر بيعك كاملًا", desc: "لا توجد عمولة إضافية على المبيعات. تفاصيل الاشتراك تظهر بوضوح قبل أي تفعيل." },
  { n: "02", title: "يدعم كل أنواع الملفات", desc: "PDF، ZIP، صور، فيديوهات، أكواد، وأي ملف رقمي تبيعه." },
  { n: "03", title: "بدون خبرة تقنية", desc: "ما تحتاج كمبيوتر ولا استضافة خارجية، كل شي من متجرك مباشرة." },
];

const COMPARE = [
  { label: "العمولة على المبيعات", monah: "٪٠", other: "نسبة من كل عملية بيع" },
  { label: "رسوم الاشتراك", monah: "قيد التجهيز", other: "غالبًا متغيّرة" },
];

const USECASES = [
  { title: "ملفات وتصاميم", desc: "PDF، قوالب، صور", color: "#0E3B2C" },
  { title: "أكواد وتراخيص", desc: "سكربتات، مفاتيح تفعيل", color: "#B9832F" },
  { title: "دورات وملفات تعليمية", desc: "فيديو، ملخصات", color: "#4B6152" },
  { title: "برستات ومحتوى", desc: "قوالب سوشيال ميديا", color: "#8A8677" },
];

const STEPS = [
  { n: "01", title: "تسجّل وتجهّز متجرك", desc: "تدخل بياناتك وتختار ما يناسب متجرك. تفاصيل الاشتراك تظهر قبل تفعيلها." },
  { n: "02", title: "ترفع منتجاتك الرقمية", desc: "ملفات، تصاميم، أكواد — أي شي رقمي تبيعه." },
  { n: "03", title: "تشارك الرابط وتجهّز البيع", desc: "تظهر خيارات البيع الإلكتروني عند تفعيلها في المنصة." },
];

const FAQS = [
  { q: "هل أحتاج خبرة تقنية؟", a: "أبدًا. ترفع ملفك وتحدد سعرًا مبدئيًا، ثم تشارك رابط منتجك. خيارات البيع الإلكتروني تظهر عند تفعيلها في المنصة." },
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
  const [slide, setSlide] = useState(0);
  const phoneColRef = useRef(null);
  const phoneRef = useRef(null);
  const floatCardRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % 2), 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const col = phoneColRef.current;
    if (!col) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    function handleMove(e) {
      const rect = col.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      if (phoneRef.current) phoneRef.current.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`;
      if (floatCardRef.current) floatCardRef.current.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    }
    function handleLeave() {
      if (phoneRef.current) phoneRef.current.style.transform = "rotateY(0) rotateX(0)";
      if (floatCardRef.current) floatCardRef.current.style.transform = "translate(0,0)";
    }
    col.addEventListener("mousemove", handleMove);
    col.addEventListener("mouseleave", handleLeave);
    return () => {
      col.removeEventListener("mousemove", handleMove);
      col.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

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
            <a className="nav-cta" href="#register">أنشئ متجرك</a>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <div className="hero-copy">
            <div className="hero-eyebrow">بدون عمولة على أي عملية بيع</div>
            <h1>بيع منتجك الرقمي<br/>من رابط واحد</h1>
            <p>ارفع ملفاتك الرقمية وشارك رابط كل منتج على واتساب وإنستغرام. تظهر خيارات البيع الإلكتروني عند تفعيلها في المنصة.</p>
            <a className="pill-black" href="#register">أنشئ متجرك الآن ←</a>
            <a className="hero-ghost" href="#how">شاهد كيف تعمل</a>
            <div className="hero-signals">
              <span><i>✓</i> واجهة عربية سهلة</span>
              <span><i>✓</i> رابط خاص لكل منتج</span>
              <span><i>✓</i> من الجوال أو الكمبيوتر</span>
            </div>
            <div className="progress-dots">
              <span className={slide === 0 ? "active" : ""} />
              <span className={slide === 1 ? "active" : ""} />
            </div>
          </div>

          <div className="hero-phone-col" ref={phoneColRef}>
            <div className="phone" ref={phoneRef}>
              <div className="phone-screen">
                <div className="phone-notch" />
                <div className="screen-status"><span>9:41</span><span>◉ ▲ ▮</span></div>
                <div className="screen-top"><span className="screen-logo" /><span className="screen-menu">☰</span></div>

                <div className="screen-stage">
                  <div className={"slide" + (slide === 0 ? " active" : "")}>
                    <div className="screen-title">متجرك الرقمي<br/>جاهز خلال دقائق</div>
                    <div className="screen-sub">ارفع منتجك، شارك الرابط، واستلم أرباحك كاملة بدون عمولة.</div>
                    <div className="screen-visual"><span className="pct mono">٪٠</span></div>
                    <div className="screen-card">
                      <div className="left"><span className="icon">🛍️</span><div><b>رزمة قوالب سيرة ذاتية</b><span>متجر هند للتصاميم</span></div></div>
                      <span className="pct2 mono">٥.٠٠</span>
                    </div>
                  </div>
                  <div className={"slide" + (slide === 1 ? " active" : "")}>
                    <div className="confirm-badge">✓</div>
                    <div className="confirm-title">البيع الإلكتروني قيد التفعيل</div>
                    <div className="confirm-sub">تظهر خيارات الدفع والتسليم عند تفعيل الخدمة</div>
                    <div className="confirm-amount mono">٥.٠٠ ر.ع</div>
                  </div>
                </div>

                <div className="screen-nav">
                  <span className="dot-active" /><span /><span /><span />
                </div>
              </div>
            </div>
            <div className="float-card" ref={floatCardRef}>
              <span className="icon">🛍️</span>
              <div><b>متجر هند</b><span>نشط · متصل</span></div>
            </div>
          </div>
        </div>

        <div className="stats">
          <div className="stat"><b>٪٠</b><span>عمولة على البيع</span></div>
          <div className="stat"><b>عند التفعيل</b><span>تسليم الملف</span></div>
          <div className="stat"><b>قيد التجهيز</b><span>روابط تحميل محمية</span></div>
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
          <h2 className="section-title reveal">ابنِ اشتراك متجرك</h2>
          <div className="section-sub reveal">تبدأ بمتجر أساسي، ثم تختار الإضافات التي تحتاجها ويظهر لك مجموعك الشهري قبل أي تفعيل.</div>

          <div className="pricing">
            <div className="price-card reveal popular">
              <div className="price-badge">اشتراك مرن</div>
              <div className="price-name">متجرك الأساسي</div>
              <div className="price-desc">صفحة متجر بهويتك، إدارة المنتجات، والمشاركة والتتبع والمنتجات المجانية.</div>
              <div className="price-value mono">3<span>ر.ع / شهريًا بعد التفعيل</span></div>
              <div className="price-features">
                <div>✓ لوحة تاجر عربية سهلة</div>
                <div>✓ صفحة متجر وروابط مشاركة</div>
                <div>✓ تخصيص الاسم والشعار والهوية</div>
                <div>✓ منتج مجاني وروابط تتبع الزيارات</div>
              </div>
              <div className="price-soon">
                <div className="price-soon-label">إضافات يختارها التاجر عند التفعيل:</div>
                <div>○ البيع الرقمي — 2 ر.ع</div>
                <div>○ زيادة المبيعات — 1 ر.ع</div>
                <div>○ إدارة المبيعات — 1 ر.ع</div>
                <div>○ حماية إضافية — 0.5 ر.ع</div>
                <div>○ أدوات الذكاء — 1 ر.ع</div>
                <div>○ دومين خاص — 1 ر.ع</div>
              </div>
              <a className="price-btn" href="#register">جهّز متجرك</a>
            </div>
          </div>
          <div className="pricing-note">لا يوجد تحصيل أو تجديد تلقائي الآن. عند تفعيل الاشتراك لاحقًا يظهر المجموع الشهري قبل التأكيد، وإذا أضاف التاجر ميزة خلال الشهر يدفع سعرها كاملًا وقت إضافتها ثم تدخل ضمن التجديد القادم.</div>
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
              <p>أنشئ متجرك، رتّب صفحته، وخذ رابطك الخاص في مكان واحد وبشكل واضح.</p>
              <a className="pill-black" href="#register">أنشئ متجرك الآن ←</a>
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
          <div><b>تواصل</b><div className="foot-contact">واتساب: <a href="https://wa.me/96876630905" target="_blank" rel="noopener noreferrer">76630905</a></div></div>
          <div><b>روابط</b><a href="#privacy">سياسة الخصوصية</a><a href="#terms">الشروط والأحكام</a></div>
        </div>
        <div className="foot-wordmark">Monah</div>
      </div>
    </div>
  );
}
