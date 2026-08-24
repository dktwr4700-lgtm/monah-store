import React, { useState, useEffect, useRef } from "react";

const styles = `
  .monah-app *{ box-sizing:border-box; }
  .monah-app{ font-family:'Cairo', sans-serif; background:#FFFFFF; color:#0B0B0C; }
  .monah-app .mono{ font-family:'JetBrains Mono', monospace; }
  .monah-app a{ text-decoration:none; }
  .monah-app :focus-visible{ outline:2px solid #0E3B2C; outline-offset:2px; }
  .wrap{ max-width:1080px; margin:0 auto; padding:0 20px; }

  .reveal{ opacity:0; transform:translateY(26px); transition:opacity .7s ease, transform .7s ease; }
  .reveal.in{ opacity:1; transform:translateY(0); }

  .nav{ display:flex; justify-content:space-between; align-items:center; padding:20px 0; }
  .nav-brand{ display:flex; align-items:center; gap:9px; font-family:'Almarai', sans-serif; font-weight:800; font-size:18px; }
  .nav-brand img{ width:26px; height:26px; border-radius:7px; display:block; }
  .nav-btns{ display:flex; gap:10px; align-items:center; }
  .nav-link{ font-size:13px; font-weight:700; color:#0B0B0C; }
  .nav-cta{ background:#0B0B0C; color:#fff; padding:10px 18px; border-radius:100px; font-size:12.5px; font-weight:700; }

  /* ===== HERO ===== */
  .hero{ padding:26px 0 10px; display:flex; align-items:center; gap:50px; }
  .hero-copy{ flex:1; min-width:280px; }
  .hero-eyebrow{ display:inline-block; background:#F1F0EA; color:#5B6B60; font-size:11.5px; font-weight:700; padding:6px 14px; border-radius:100px; margin-bottom:20px; }
  .hero h1{ font-family:'Almarai', sans-serif; font-weight:800; font-size:40px; line-height:1.25; color:#0B0B0C; margin-bottom:16px; }
  .hero p{ color:#6B6B6B; font-size:14.5px; line-height:1.85; max-width:380px; margin-bottom:24px; }
  .pill-black{ display:inline-flex; align-items:center; gap:8px; background:#0B0B0C; color:#fff; padding:14px 22px; border-radius:100px; font-weight:700; font-size:14px; cursor:pointer; border:none; font-family:'Cairo', sans-serif; }
  .hero-ghost{ display:block; margin-top:14px; color:#8A8677; font-size:12.5px; }

  .progress-dots{ display:flex; gap:6px; margin-top:20px; }
  .progress-dots span{ width:6px; height:6px; border-radius:50%; background:#E4E0D3; transition:background .3s ease, width .3s ease; }
  .progress-dots span.active{ background:#0E3B2C; width:18px; border-radius:4px; }

  .hero-phone-col{ flex:0 0 300px; display:flex; justify-content:center; position:relative; perspective:1200px; }
  .phone{ width:270px; height:550px; background:#0B0B0C; border-radius:42px; padding:11px; box-shadow:0 40px 80px rgba(0,0,0,0.16); position:relative; transform-style:preserve-3d; transition:transform .25s ease-out; }
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

  .stats{ display:flex; border-top:1px solid #EDEAE0; border-bottom:1px solid #EDEAE0; max-width:600px; margin:36px auto 0; }
  .stat{ flex:1; text-align:center; padding:20px 10px; border-inline-start:1px solid #EDEAE0; }
  .stat:first-child{ border-inline-start:none; }
  .stat b{ display:block; font-family:'Almarai', sans-serif; font-weight:800; font-size:18px; }
  .stat span{ display:block; color:#8A8677; font-size:11.5px; margin-top:4px; }

  section.section{ padding:56px 0; }
  .section-eyebrow{ text-align:center; font-size:11.5px; color:#B9832F; font-weight:700; letter-spacing:.04em; margin-bottom:8px; }
  h2.section-title{ text-align:center; font-family:'Almarai', sans-serif; font-weight:800; font-size:23px; margin-bottom:8px; }
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
  .feature{ background:#FFFFFF; border:1px solid #EDEAE0; border-radius:14px; padding:20px; }
  .feature-icon{ width:34px; height:34px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
  .feature b{ display:block; font-size:13.5px; font-weight:700; margin-bottom:5px; }
  .feature span{ color:#8A8677; font-size:12px; line-height:1.7; }

  .protection{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .protection-item{ background:#FBFAF7; border:1px solid #EDEAE0; border-radius:14px; padding:20px; }
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

  .products{ display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .product-card{ background:#FFFFFF; border:1px solid #EDEAE0; border-radius:14px; overflow:hidden; }
  .product-thumb{ height:96px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; }
  .product-info{ padding:13px 15px 15px; }
  .product-info b{ display:block; font-size:12.5px; font-weight:700; margin-bottom:3px; }
  .product-info span{ color:#8A8677; font-size:11px; }
  .product-price{ margin-top:8px; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:12.5px; color:#0B0B0C; }
  .products-note{ text-align:center; color:#B0AC9C; font-size:11px; margin-top:16px; }

  .billing-toggle{ display:flex; justify-content:center; align-items:center; gap:14px; margin-bottom:14px; }
  .billing-btn{ padding:10px 20px; border-radius:100px; font-size:12.5px; font-weight:700; cursor:pointer; border:1px solid #EDEAE0; background:#FFFFFF; color:#3D4A66; }
  .billing-btn.active{ background:#0B0B0C; color:#fff; border-color:#0B0B0C; }
  .billing-save-badge{ background:#EAF0EB; color:#4B6152; font-size:10px; font-weight:700; padding:3px 9px; border-radius:100px; margin-right:6px; }

  .common-features{ text-align:center; color:#8A8677; font-size:11.5px; max-width:640px; margin:0 auto 28px; line-height:2; }
  .common-features b{ color:#0B0B0C; }

  .pricing{ display:flex; gap:16px; max-width:920px; margin:0 auto 20px; flex-wrap:wrap; justify-content:center; align-items:stretch; }
  .price-card{ flex:1; min-width:220px; max-width:270px; background:#FFFFFF; border:1px solid #EDEAE0; border-radius:16px; padding:28px 22px 24px; position:relative; display:flex; flex-direction:column; }
  .price-card.popular{ border:2px solid #0B0B0C; padding-top:30px; }
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
  .price-card.popular .price-btn{ background:#0B0B0C; color:#fff; border:none; }
  .pricing-note{ text-align:center; color:#8A8677; font-size:11.5px; max-width:480px; margin:0 auto; line-height:1.8; }

  .faq{ max-width:640px; margin:0 auto; }
  .faq-item{ border-top:1px solid #EDEAE0; }
  .faq-item:last-child{ border-bottom:1px solid #EDEAE0; }
  .faq-q{ width:100%; text-align:right; background:none; border:none; cursor:pointer; padding:17px 0; display:flex; gap:12px; align-items:center; font-size:14px; font-weight:700; font-family:'Cairo', sans-serif; color:#0B0B0C; }
  .faq-q .n{ color:#B9832F; font-family:'JetBrains Mono', monospace; font-size:11.5px; }
  .faq-a{ color:#8A8677; font-size:12.5px; line-height:1.8; padding-bottom:17px; padding-right:28px; max-width:500px; }

  .final-cta{ text-align:center; padding:54px 20px; }
  .final-cta h3{ font-family:'Almarai', sans-serif; font-weight:800; font-size:19px; margin-bottom:8px; }
  .final-cta p{ color:#8A8677; font-size:13px; margin-bottom:20px; }

  .foot-black{ background:#0E3B2C; border-radius:24px; margin:0 20px 20px; padding:32px 30px 0; overflow:hidden; max-width:1040px; margin-inline:auto; }
  .foot-top{ display:flex; justify-content:space-between; color:#B9C9BC; font-size:11.5px; padding-bottom:28px; border-bottom:1px solid rgba(244,241,232,0.12); flex-wrap:wrap; gap:16px; }
  .foot-top div b{ color:#F4F1E8; display:block; margin-bottom:8px; font-size:11.5px; }
  .foot-top a{ color:#B9C9BC; display:block; margin-top:7px; }
  .foot-contact{ color:#D4DBD6; font-size:12px; }
  .foot-contact a{ color:#D6F35C; font-weight:700; }
  .foot-wordmark{ font-family:'Almarai', sans-serif; font-weight:800; font-size:clamp(48px,11vw,100px); color:#F4F1E8; text-align:center; line-height:1; padding:24px 0 14px; letter-spacing:-0.02em; }

  @media (max-width:760px){
    .hero{ flex-direction:column; padding-top:14px; }
    .hero h1{ font-size:29px; text-align:center; }
    .hero-copy{ text-align:center; }
    .hero p{ margin-inline:auto; }
    .progress-dots{ justify-content:center; }
    .float-card{ display:none; }
    .phone{ width:230px; height:470px; }
    .screen-stage{ height:320px; }
  }
`;

const FEATURES = [
  { title: "تسليم تلقائي", desc: "الملف يوصل العميل فورًا بعد الدفع، بدون أي تدخل منك.", icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
  { title: "رابط لكل منتج", desc: "كل منتج له رابط خاص فيه، تشاركه بأي مكان تحب.", icon: <path d="M12 3v18M3 12h18" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/> },
  { title: "تقارير مبيعات", desc: "تابع إيراداتك وأداء منتجاتك أول بأول.", icon: <><rect x="3" y="4" width="18" height="14" rx="2" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M3 9h18" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: "إعداد بدقائق", desc: "بدون خبرة تقنية، وبدون كمبيوتر أو استضافة خارجية.", icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
];

const PROTECTION = [
  { title: "روابط تحميل مؤقتة", desc: "رابط تحميل كل منتج له صلاحية محدودة، ما يبقى صالح للأبد لأي شخص.", icon: <><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
  { title: "تشفير الملفات", desc: "ملفاتك محفوظة بشكل مشفّر، ما يقدر أي طرف يوصلها إلا العميل المخوّل بعد الدفع.", icon: <><rect x="5" y="11" width="14" height="9" rx="2" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { title: "حماية الرابط من المشاركة", desc: "رابط التحميل مرتبط بك وحدك، فما يقدر أي شخص ثاني يستخدم نفس الرابط لتحميل منتجك.", icon: <><path d="M9 12l2 2 4-4" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="12" cy="12" r="9" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
];

const WHY = [
  { n: "01", title: "احتفظ بـ١٠٠٪ من أرباحك", desc: "بدون عمولة على أي عملية بيع، تدفع الاشتراك الشهري بس ولا شي غيره." },
  { n: "02", title: "يدعم كل أنواع الملفات", desc: "PDF، ZIP، صور، فيديوهات، أكواد، وأي ملف رقمي تبيعه." },
  { n: "03", title: "بدون خبرة تقنية", desc: "ما تحتاج كمبيوتر ولا استضافة خارجية، كل شي من متجرك مباشرة." },
];

const COMPARE = [
  { label: "العمولة على المبيعات", monah: "٪٠", other: "نسبة من كل عملية بيع" },
  { label: "رسوم الاشتراك", monah: "ثابتة وواضحة", other: "غالبًا متغيّرة" },
];

const FEATURED_PRODUCTS = [
  { title: "رزمة قوالب سيرة ذاتية", store: "متجر هند للتصاميم", price: "٥.٠٠ ر.ع" },
  { title: "كورس أساسيات البرمجة", store: "متجر سالم التقني", price: "٨.٠٠ ر.ع" },
  { title: "باقة برستات تصوير", store: "متجر مريم", price: "٣.٥٠ ر.ع" },
];

const USECASES = [
  { title: "ملفات وتصاميم", desc: "PDF، قوالب، صور", color: "#0E3B2C" },
  { title: "أكواد وتراخيص", desc: "سكربتات، مفاتيح تفعيل", color: "#B9832F" },
  { title: "دورات وملفات تعليمية", desc: "فيديو، ملخصات", color: "#4B6152" },
  { title: "برستات ومحتوى", desc: "قوالب سوشيال ميديا", color: "#8A8677" },
];

const STEPS = [
  { n: "01", title: "تسجّل وتشترك بباقة شهرية", desc: "تدخل بياناتك وتختار الباقة المناسبة لك." },
  { n: "02", title: "ترفع منتجاتك الرقمية", desc: "ملفات، تصاميم، أكواد — أي شي رقمي تبيعه." },
  { n: "03", title: "تشارك الرابط وتستلم كامل السعر", desc: "ما فيه عمولة على أي عملية بيع تسويها." },
];

const COMMON_FEATURES = [
  "بدون عمولة على المبيعات",
  "تسليم تلقائي بعد الدفع",
  "صفحة متوافقة مع الجوال",
  "رابط خاص لكل منتج",
  "ترقية أو تخفيض أو إلغاء في أي وقت",
];

const PACKAGES = [
  { name: "أساسية", monthly: 5, yearly: 50, desc: "مناسبة لمن يريد البدء ببيع أول منتجاته الرقمية.", btn: "ابدأ متجرك", features: ["حتى 10 منتجات", "صفحة متجر جاهزة", "بيع ملفات وأكواد/تراخيص"] },
  { name: "احترافية", monthly: 10, yearly: 100, popular: true, desc: "مناسبة لمن يريد تنمية مبيعاته وتخصيص متجره.", btn: "نمِّ متجرك", features: ["كل مميزات الأساسية", "منتجات غير محدودة", "تخصيص شعار وألوان المتجر", "كوبونات خصم"], soon: ["إنشاء باقات من عدة منتجات", "تقارير مبيعات مفصلة", "تصدير الطلبات والبيانات"] },
  { name: "متجر متكامل", monthly: 15, yearly: 150, desc: "مناسبة لمن يريد بناء علامة رقمية مستقلة.", btn: "ابنِ علامتك", features: ["كل مميزات الاحترافية", "مساعد نمو المتجر بالذكاء الاصطناعي", "دعم أولوية عبر واتساب"], soon: ["ربط دومينك الخاص", "إزالة شعار Monah من واجهة المتجر", "حماية متقدمة لروابط التحميل", "تحليلات مصادر الزيارات"] },
];

const FAQS = [
  { q: "هل أحتاج خبرة تقنية؟", a: "أبدًا. ترفع ملفك وتحدد السعر، والباقي تتكفل به المنصة." },
  { q: "وش أنواع الملفات المسموحة؟", a: "أي ملف رقمي: PDF، تصاميم، أكواد، فيديوهات، وغيرها." },
  { q: "فيه عمولة على مبيعاتي؟", a: "لا. تدفع الاشتراك الشهري بس، وتحتفظ بكامل سعر بيعك." },
  { q: "أقدر أربط دومين خاص فيني؟", a: "هذي ميزة قادمة قريبًا للباقة المتكاملة، لسا قيد التطوير." },
  { q: "وش يصير لو ألغيت اشتراكي؟", a: "متجرك يتوقف عن استقبال مبيعات جديدة، لكن بياناتك ومنتجاتك تبقى محفوظة عندنا لو رجعت تشترك لاحقًا." },
  { q: "أقدر أغيّر باقتي بعدين؟", a: "أكيد، تقدر ترقّي أو تنزّل باقتك في أي وقت من لوحة التحكم." },
  { q: "وش الفرق بين الاشتراك الشهري والسنوي؟", a: "نفس المميزات بالضبط، بس الاشتراك السنوي يوفر لك تكلفة شهرين مجانًا مقارنة بالدفع شهر بشهر." },
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
  const [billing, setBilling] = useState("monthly");
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
            <p>ارفع ملفاتك الرقمية، شارك رابط كل منتج على واتساب وإنستغرام، والملف يوصل عميلك تلقائيًا بعد الدفع.</p>
            <a className="pill-black" href="#register">أنشئ متجرك الآن ←</a>
            <a className="hero-ghost" href="#how">شاهد كيف تعمل</a>
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
                    <div className="confirm-title">تم الدفع والتسليم</div>
                    <div className="confirm-sub">وصل الملف للعميل تلقائيًا الآن</div>
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
          <div className="stat"><b>فوري</b><span>تسليم الملف</span></div>
          <div className="stat"><b>مؤقت</b><span>روابط تحميل محمية</span></div>
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

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow reveal">أمثلة</div>
          <h2 className="section-title reveal">منتجات على المنصة</h2>
          <div className="section-sub reveal">نماذج توضيحية لأنواع المنتجات اللي تُباع على Monah</div>
          <div className="products">
            {FEATURED_PRODUCTS.map((p) => (
              <div className="product-card reveal" key={p.title}>
                <div className="product-thumb">
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/><path d="M14 3v4h4" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg>
                </div>
                <div className="product-info">
                  <b>{p.title}</b>
                  <span>{p.store}</span>
                  <div className="product-price mono">{p.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="products-note">أمثلة توضيحية — منتجات البائعين الحقيقيين تظهر هنا بعد الإطلاق</div>
        </div>
      </section>

      <section className="section" id="pricing" style={{ background: "#FBFAF7" }}>
        <div className="wrap">
          <div className="section-eyebrow reveal">الاشتراك</div>
          <h2 className="section-title reveal">اختر باقتك</h2>
          <div className="section-sub reveal">تقدر ترقّي أو تنزّل باقتك في أي وقت، وتلغي اشتراكك بدون أي رسوم إضافية</div>

          <div className="billing-toggle reveal">
            <button className={"billing-btn" + (billing === "monthly" ? " active" : "")} onClick={() => setBilling("monthly")}>شهري</button>
            <button className={"billing-btn" + (billing === "yearly" ? " active" : "")} onClick={() => setBilling("yearly")}>سنوي <span className="billing-save-badge">وفّر شهرين</span></button>
          </div>

          <div className="common-features reveal"><b>كل الباقات تشمل:</b> {COMMON_FEATURES.join(" · ")}</div>

          <div className="pricing">
            {PACKAGES.map((p) => (
              <div className={"price-card reveal" + (p.popular ? " popular" : "")} key={p.name}>
                {p.popular && <div className="price-badge">الأكثر طلبًا</div>}
                <div className="price-name">{p.name}</div>
                <div className="price-desc">{p.desc}</div>
                <div className="price-value mono">{billing === "monthly" ? p.monthly : p.yearly}<span>{billing === "monthly" ? "ر.ع / شهريًا" : "ر.ع / سنويًا"}</span></div>
                <div className="price-yearly-note">{billing === "yearly" ? `بدل ${p.monthly * 12} ر.ع — توفير ${p.monthly * 12 - p.yearly} ر.ع بالسنة` : ""}</div>
                <div className="price-features">{p.features.map((f) => <div key={f}>✓ {f}</div>)}</div>
                {p.soon && <div className="price-soon"><div className="price-soon-label">قادم قريبًا:</div>{p.soon.map((f) => <div key={f}>○ {f}</div>)}</div>}
                <a className="price-btn" href="#register">{p.btn}</a>
              </div>
            ))}
          </div>
          <div className="pricing-note">الأسعار كاملة وشاملة، بدون أي عمولة أو رسوم خفية من Monah. قد تُطبَّق رسوم بسيطة من مزود الدفع حسب وسيلة الدفع المستخدمة. لو ألغيت اشتراكك، ما يُخصم منك أي مبلغ إضافي.</div>
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

      <div className="final-cta reveal">
        <h3>جاهز تبدأ متجرك؟</h3>
        <p>سجّل الحين وابدأ البيع خلال دقائق. لن يُخصم أي مبلغ قبل تأكيد اختيارك للباقة.</p>
        <a className="pill-black" href="#register">أنشئ متجرك الآن ←</a>
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
