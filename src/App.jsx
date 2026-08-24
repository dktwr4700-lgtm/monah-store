import React, { useState, useRef, useEffect } from "react";

const styles = `
  .monah-app *{ box-sizing:border-box; }
  .monah-app{ font-family:'Cairo', sans-serif; background:#F6F3EC; color:#16233F; }
  .monah-app .mono{ font-family:'JetBrains Mono', monospace; }
  .monah-app a{ text-decoration:none; }
  .monah-app :focus-visible{ outline:2px solid #0E3B2C; outline-offset:2px; }
  .wrap{ max-width:1080px; margin:0 auto; padding:0 20px; }

  .nav{ display:flex; justify-content:space-between; align-items:center; padding:20px 0; }
  .nav-brand{ display:flex; align-items:center; gap:9px; font-family:'Almarai', sans-serif; font-weight:800; font-size:20px; }
  .nav-brand img{ width:30px; height:30px; border-radius:8px; display:block; }
  .nav-btns{ display:flex; gap:10px; }
  .nav-btn{ padding:10px 16px; border-radius:9px; font-size:13px; font-weight:700; border:1px solid #E4E0D3; background:#FFFFFF; color:#16233F; cursor:pointer; }
  .nav-btn.primary{ background:#16233F; color:#fff; border:none; }

  /* ===== HERO — dark green + parallax layers ===== */
  .hero-shell{ padding:16px 20px 0; }
  .hero{
    position:relative; max-width:1040px; margin:0 auto; overflow:hidden;
    background:#0E3B2C; border-radius:24px; padding:52px 28px 200px;
  }
  .hero-eyebrow{ position:relative; z-index:5; display:inline-flex; align-items:center; gap:7px; color:#D6F35C; font-family:'JetBrains Mono', monospace; font-size:12px; font-weight:700; letter-spacing:.03em; margin-bottom:22px; }
  .hero-eyebrow::before{ content:"—"; }
  .hero h1{ position:relative; z-index:5; font-family:'Almarai', sans-serif; font-weight:800; font-size:33px; line-height:1.5; margin-bottom:14px; color:#F4F1E8; max-width:520px; }
  .hero h1 em{ font-style:normal; color:#D6F35C; }
  .hero-audience{ position:relative; z-index:5; color:#8FA894; font-size:13.5px; margin-bottom:16px; max-width:480px; }
  .hero p{ position:relative; z-index:5; color:#B9C9BC; font-size:15px; line-height:1.9; max-width:440px; margin:0 0 26px; }
  .hero-cta{ position:relative; z-index:5; display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
  .btn{ padding:14px 22px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Cairo', sans-serif; }
  .btn.out{ border:1.5px solid #4A6656; color:#F4F1E8; background:transparent; }
  .btn.fill{ background:#D6F35C; color:#0E3B2C; border:none; }

  .hero-layer{ position:absolute; border-radius:50%; pointer-events:none; will-change:transform; transition:transform .12s ease-out; z-index:1; }
  .hero-layer.l1{ width:150px; height:150px; background:rgba(214,243,92,0.12); top:10px; left:30px; }
  .hero-layer.l2{ width:90px; height:90px; background:rgba(214,243,92,0.28); bottom:210px; left:130px; }
  .hero-layer.l3{ width:200px; height:200px; background:rgba(214,243,92,0.07); top:60px; left:-40px; }

  .hero-receipt{
    position:absolute; z-index:4; left:28px; bottom:28px; width:250px;
    background:#F4F1E8; border-radius:16px; box-shadow:0 24px 46px rgba(0,0,0,0.32);
    overflow:hidden; will-change:transform; transition:transform .12s ease-out;
  }
  .receipt-head{ display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px dashed #E4E0D3; }
  .receipt-id{ font-size:11px; color:#8A8677; }
  .receipt-brand{ font-family:'Almarai', sans-serif; font-weight:800; font-size:13px; color:#16233F; }
  .receipt-body{ padding:14px 18px 16px; }
  .receipt-row{ display:flex; justify-content:space-between; font-size:12.5px; padding:5px 0; color:#3D4A66; }
  .receipt-row b{ color:#16233F; }
  .receipt-status{ display:inline-flex; align-items:center; gap:6px; background:#EAF0EB; color:#4B6152; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; margin-top:8px; }

  .hero-hint{ position:relative; z-index:5; color:#5E7A67; font-size:11px; font-family:'JetBrains Mono', monospace; margin-top:130px; }

  @media (max-width:640px){
    .hero{ padding:40px 20px 250px; border-radius:18px; }
    .hero h1{ font-size:26px; }
    .hero-receipt{ position:static; margin:24px auto 0; width:100%; max-width:280px; transform:none !important; }
    .hero-layer{ display:none; }
    .hero-hint{ display:none; }
  }

  .stats{ display:flex; border-top:1px solid #E4E0D3; border-bottom:1px solid #E4E0D3; max-width:600px; margin:28px auto 0; }
  .stat{ flex:1; text-align:center; padding:22px 10px; border-inline-start:1px solid #E4E0D3; }
  .stat:first-child{ border-inline-start:none; }
  .stat b{ display:block; font-family:'Almarai', sans-serif; font-weight:800; font-size:20px; }
  .stat span{ display:block; color:#8A8677; font-size:12px; margin-top:4px; }

  section.section{ padding:52px 0; }
  .section-eyebrow{ text-align:center; font-size:12px; color:#B9832F; font-weight:700; letter-spacing:.04em; margin-bottom:8px; }
  h2.section-title{ text-align:center; font-family:'Almarai', sans-serif; font-weight:800; font-size:24px; margin-bottom:8px; }
  .section-sub{ text-align:center; color:#8A8677; font-size:14px; margin-bottom:36px; }

  .steps{ max-width:640px; margin:0 auto; }
  .step{ display:flex; gap:18px; padding:20px 0; border-top:1px dashed #E4E0D3; }
  .step:first-child{ border-top:none; }
  .step-num{ font-family:'JetBrains Mono', monospace; font-weight:700; color:#B9832F; font-size:15px; padding-top:2px; min-width:24px; }
  .step-icon{ width:34px; height:34px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .step-text b{ display:block; font-size:15px; font-weight:700; margin-bottom:4px; }
  .step-text span{ color:#8A8677; font-size:13px; line-height:1.8; }

  /* WHY — distinct layout: horizontal stat-led rows, not a card grid (kept different from FEATURES on purpose) */
  .why-list{ max-width:640px; margin:0 auto; }
  .why-row{ display:flex; align-items:center; gap:20px; padding:20px 4px; border-top:1px solid #E4E0D3; }
  .why-row:first-child{ border-top:none; }
  .why-figure{ font-family:'Almarai', sans-serif; font-weight:800; font-size:26px; color:#0E3B2C; min-width:64px; text-align:center; }
  .why-text b{ display:block; font-size:14.5px; font-weight:700; margin-bottom:3px; }
  .why-text span{ color:#8A8677; font-size:13px; line-height:1.7; }

  .features{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .feature{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:22px; }
  .feature-icon{ width:36px; height:36px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
  .feature b{ display:block; font-size:14px; font-weight:700; margin-bottom:6px; }
  .feature span{ color:#8A8677; font-size:12.5px; line-height:1.7; }

  /* USECASES — pill/chip strip, visually distinct from the icon-card sections */
  .usecases{ display:flex; flex-wrap:wrap; gap:10px; justify-content:center; max-width:760px; margin:0 auto; }
  .usecase-chip{ display:flex; align-items:center; gap:10px; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:100px; padding:10px 18px 10px 10px; }
  .usecase-chip-icon{ width:28px; height:28px; border-radius:50%; background:#0E3B2C; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .usecase-chip b{ font-size:13px; font-weight:700; display:block; }
  .usecase-chip span{ font-size:11px; color:#8A8677; display:block; }

  .protection{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .protection-item{ background:#FBFAF7; border:1px solid #E4E0D3; border-radius:14px; padding:22px; }
  .protection-icon{ width:36px; height:36px; border-radius:9px; background:#F3E9D6; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
  .protection-item b{ display:block; font-size:14px; font-weight:700; margin-bottom:6px; }
  .protection-item span{ color:#8A8677; font-size:12.5px; line-height:1.7; }

  .compare{ max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:16px; overflow:hidden; }
  .compare-row{ display:grid; grid-template-columns:1.3fr 1fr 1fr; align-items:center; padding:14px 18px; border-top:1px solid #E4E0D3; }
  .compare-row:first-child{ border-top:none; background:#FBFAF7; }
  .compare-row:first-child span{ font-size:11px; font-weight:700; color:#8A8677; }
  .compare-label{ color:#3D4A66; font-size:13px; }
  .compare-monah{ text-align:center; color:#4B6152; font-weight:700; font-size:13px; }
  .compare-other{ text-align:center; color:#B0AC9C; font-size:13px; }

  .products{ display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .product-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; overflow:hidden; }
  .product-thumb{ height:100px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; }
  .product-info{ padding:14px 16px 16px; }
  .product-info b{ display:block; font-size:13px; font-weight:700; margin-bottom:3px; }
  .product-info span{ color:#8A8677; font-size:11.5px; }
  .product-price{ margin-top:8px; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:13px; color:#16233F; }
  .products-note{ text-align:center; color:#B0AC9C; font-size:11.5px; margin-top:16px; }

  .billing-toggle{ display:flex; justify-content:center; align-items:center; gap:14px; margin-bottom:14px; }
  .billing-btn{ padding:10px 20px; border-radius:100px; font-size:13px; font-weight:700; cursor:pointer; border:1px solid #E4E0D3; background:#FFFFFF; color:#3D4A66; }
  .billing-btn.active{ background:#16233F; color:#fff; border-color:#16233F; }
  .billing-save-badge{ background:#EAF0EB; color:#4B6152; font-size:10.5px; font-weight:700; padding:3px 9px; border-radius:100px; margin-right:6px; }

  .common-features{ text-align:center; color:#8A8677; font-size:12px; max-width:640px; margin:0 auto 30px; line-height:2; }
  .common-features b{ color:#16233F; }

  .pricing{ display:flex; gap:16px; max-width:920px; margin:0 auto 20px; flex-wrap:wrap; justify-content:center; align-items:stretch; }
  .price-card{ flex:1; min-width:230px; max-width:280px; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:16px; padding:30px 24px 26px; position:relative; display:flex; flex-direction:column; }
  .price-card.popular{ border:2px solid #16233F; padding-top:32px; }
  .price-badge{ position:absolute; top:-12px; right:24px; background:#B9832F; color:#fff; font-size:11px; font-weight:700; padding:5px 13px; border-radius:100px; }
  .price-name{ font-family:'Almarai', sans-serif; font-weight:800; font-size:15px; margin-bottom:6px; }
  .price-desc{ color:#8A8677; font-size:11.5px; line-height:1.7; margin-bottom:14px; min-height:32px; }
  .price-value{ display:flex; align-items:baseline; gap:6px; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:26px; margin-bottom:4px; }
  .price-value span{ font-size:12px; color:#8A8677; font-family:'Cairo', sans-serif; font-weight:400; }
  .price-yearly-note{ font-size:11px; color:#B9832F; font-weight:700; margin-bottom:16px; padding-bottom:16px; border-bottom:1px dashed #E4E0D3; min-height:14px; }
  .price-features{ flex:1; }
  .price-features div{ display:flex; align-items:flex-start; gap:8px; font-size:13px; color:#3D4A66; line-height:1.6; padding:6px 0; }
  .price-soon{ margin-top:8px; padding-top:8px; border-top:1px dashed #E4E0D3; }
  .price-soon-label{ color:#B9832F; font-size:10px; font-weight:700; margin-bottom:4px; }
  .price-soon div{ font-size:11px; color:#B0AC9C; padding:2px 0; }
  .price-btn{ width:100%; margin-top:20px; padding:13px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; border:1.5px solid #16233F; background:transparent; color:#16233F; display:block; text-align:center; }
  .price-card.popular .price-btn{ background:#16233F; color:#fff; border:none; }
  .pricing-note{ text-align:center; color:#8A8677; font-size:12px; max-width:480px; margin:0 auto; line-height:1.8; }

  .faq{ max-width:640px; margin:0 auto; }
  .faq-item{ border-top:1px solid #E4E0D3; }
  .faq-item:last-child{ border-bottom:1px solid #E4E0D3; }
  .faq-q{ width:100%; text-align:right; background:none; border:none; cursor:pointer; padding:18px 0; display:flex; justify-content:space-between; align-items:center; font-size:14.5px; font-weight:700; font-family:'Cairo', sans-serif; color:#16233F; }
  .faq-q span{ color:#B9832F; font-size:18px; }
  .faq-a{ color:#8A8677; font-size:13px; line-height:1.8; padding-bottom:18px; max-width:520px; }

  .final-cta{ text-align:center; padding:56px 20px; }
  .final-cta h3{ font-family:'Almarai', sans-serif; font-weight:800; font-size:20px; margin-bottom:8px; }
  .final-cta p{ color:#8A8677; font-size:13.5px; margin-bottom:20px; }

  footer{ text-align:center; padding:28px 20px; color:#B0AC9C; font-size:12px; border-top:1px solid #E4E0D3; }
  .footer-contact{ color:#3D4A66; font-size:12.5px; margin-bottom:8px; }
  .footer-contact a{ color:#16233F; font-weight:700; }
  .footer-links{ margin-top:8px; display:flex; gap:14px; justify-content:center; }
  .footer-links a{ color:#8A8677; font-size:11.5px; }
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

/* WHY — trimmed to remove overlap with FEATURES/PROTECTION, shown as a figure-led list instead of icon cards */
const WHY = [
  { figure: "٪٠", title: "احتفظ بـ١٠٠٪ من أرباحك", desc: "بدون عمولة على أي عملية بيع، تدفع الاشتراك الشهري بس ولا شي غيره." },
  { figure: "*.*", title: "يدعم كل أنواع الملفات", desc: "PDF، ZIP، صور، فيديوهات، أكواد، وأي ملف رقمي تبيعه." },
  { figure: "٠", title: "بدون خبرة تقنية", desc: "ما تحتاج كمبيوتر ولا استضافة خارجية، كل شي من متجرك مباشرة." },
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
  { title: "المصممين", desc: "قوالب وفونتات", icon: <><circle cx="12" cy="12" r="9" stroke="#D6F35C" strokeWidth="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="#D6F35C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></> },
  { title: "المبرمجين", desc: "أكواد وسكربتات", icon: <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke="#D6F35C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/> },
  { title: "المعلّمين", desc: "دورات وملخصات", icon: <><path d="M4 6a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 2V6z" stroke="#D6F35C" strokeWidth="2" fill="none"/><path d="M20 6a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 2V6z" stroke="#D6F35C" strokeWidth="2" fill="none"/></> },
  { title: "صنّاع المحتوى", desc: "برستات وقوالب سوشيال", icon: <><path d="M12 3v12" stroke="#D6F35C" strokeWidth="2" strokeLinecap="round" fill="none"/><path d="M8 8l4-5 4 5" stroke="#D6F35C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="#D6F35C" strokeWidth="2" fill="none"/></> },
];

const STEPS = [
  { n: "01", title: "تسجّل وتشترك بباقة شهرية", desc: "تدخل بياناتك وتختار الباقة المناسبة لك.", icon: <><circle cx="12" cy="8" r="3.5" stroke="#B9832F" strokeWidth="2" fill="none"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
  { n: "02", title: "ترفع منتجاتك الرقمية", desc: "ملفات، تصاميم، أكواد — أي شي رقمي تبيعه.", icon: <><path d="M12 16V4M7 9l5-5 5 5" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="#B9832F" strokeWidth="2" fill="none"/></> },
  { n: "03", title: "تشارك الرابط وتستلم كامل السعر", desc: "ما فيه عمولة على أي عملية بيع تسويها.", icon: <path d="M12 3v18M3 12h18" stroke="#B9832F" strokeWidth="2" strokeLinecap="round" fill="none"/> },
];

const COMMON_FEATURES = [
  "بدون عمولة على المبيعات",
  "تسليم تلقائي بعد الدفع",
  "صفحة متوافقة مع الجوال",
  "رابط خاص لكل منتج",
  "ترقية أو تخفيض أو إلغاء في أي وقت",
];

const PACKAGES = [
  {
    name: "أساسية", monthly: 5, yearly: 50,
    desc: "مناسبة لمن يريد البدء ببيع أول منتجاته الرقمية.",
    btn: "ابدأ متجرك",
    features: ["حتى 10 منتجات", "صفحة متجر جاهزة", "بيع ملفات وأكواد/تراخيص"],
  },
  {
    name: "احترافية", monthly: 10, yearly: 100, popular: true,
    desc: "مناسبة لمن يريد تنمية مبيعاته وتخصيص متجره.",
    btn: "نمِّ متجرك",
    features: ["كل مميزات الأساسية", "منتجات غير محدودة", "تخصيص شعار وألوان المتجر", "كوبونات خصم"],
    soon: ["إنشاء باقات من عدة منتجات", "تقارير مبيعات مفصلة", "تصدير الطلبات والبيانات"],
  },
  {
    name: "متجر متكامل", monthly: 15, yearly: 150,
    desc: "مناسبة لمن يريد بناء علامة رقمية مستقلة.",
    btn: "ابنِ علامتك",
    features: ["كل مميزات الاحترافية", "مساعد نمو المتجر بالذكاء الاصطناعي", "دعم أولوية عبر واتساب"],
    soon: ["ربط دومينك الخاص", "إزالة شعار Monah من واجهة المتجر", "حماية متقدمة لروابط التحميل", "تحليلات مصادر الزيارات"],
  },
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
      <button
        className="faq-q"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {q}<span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="faq-a" id={panelId} role="region">{a}</div>}
    </div>
  );
}

export default function App() {
  const [billing, setBilling] = useState("monthly");
  const heroRef = useRef(null);
  const layerRefs = useRef([]);
  const receiptRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    function handleMove(e) {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      layerRefs.current.forEach((el) => {
        if (!el) return;
        const depth = parseFloat(el.dataset.depth || "0");
        el.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
      });
      if (receiptRef.current) {
        receiptRef.current.style.transform = `translate(${x * 22}px, ${y * 22}px)`;
      }
    }
    function handleLeave() {
      layerRefs.current.forEach((el) => { if (el) el.style.transform = "translate(0,0)"; });
      if (receiptRef.current) receiptRef.current.style.transform = "translate(0,0)";
    }

    hero.addEventListener("mousemove", handleMove);
    hero.addEventListener("mouseleave", handleLeave);
    return () => {
      hero.removeEventListener("mousemove", handleMove);
      hero.removeEventListener("mouseleave", handleLeave);
    };
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
            <a className="nav-btn" href="#login">تسجيل الدخول</a>
            <a className="nav-btn primary" href="#register">أنشئ متجرك الآن</a>
          </div>
        </div>
      </div>

      <div className="hero-shell">
        <div className="hero" ref={heroRef}>
          <div className="hero-layer l1" data-depth="30" ref={(el) => (layerRefs.current[0] = el)} />
          <div className="hero-layer l2" data-depth="55" ref={(el) => (layerRefs.current[1] = el)} />
          <div className="hero-layer l3" data-depth="15" ref={(el) => (layerRefs.current[2] = el)} />

          <div className="hero-eyebrow">بدون عمولة على أي عملية بيع</div>
          <h1>بيع منتجك الرقمي<br/>من <em>رابط واحد</em></h1>
          <div className="hero-audience">للمصممين، المبرمجين، المعلّمين، وصنّاع المحتوى في عُمان والخليج</div>
          <p>ارفع ملفاتك الرقمية، شارك رابط كل منتج على واتساب وإنستغرام، والملف يوصل عميلك تلقائيًا بعد الدفع.</p>
          <div className="hero-cta">
            <a className="btn fill" href="#register">أنشئ متجرك الآن</a>
            <a className="btn out" href="#how">شاهد كيف تعمل</a>
          </div>
          <div className="hero-hint">← حرّك الماوس هنا</div>

          <div className="hero-receipt" ref={receiptRef}>
            <div className="receipt-head">
              <span className="receipt-id mono">MN-2481#</span>
              <span className="receipt-brand">إيصال Monah</span>
            </div>
            <div className="receipt-body">
              <div className="receipt-row"><span>المتجر</span><b>هند للتصاميم</b></div>
              <div className="receipt-row"><span>المنتج</span><b>رزمة قوالب سيرة ذاتية</b></div>
              <div className="receipt-row"><span>السعر</span><b className="mono">٥.٠٠ ر.ع</b></div>
              <div className="receipt-status">✓ تم الدفع والتسليم</div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>٪٠</b><span>عمولة على البيع</span></div>
        <div className="stat"><b>فوري</b><span>تسليم الملف</span></div>
        <div className="stat"><b>مؤقت</b><span>روابط تحميل محمية</span></div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow">لماذا Monah</div>
          <h2 className="section-title">منصة مبنية لصالحك أنت</h2>
          <div className="why-list">
            {WHY.map((w) => (
              <div className="why-row" key={w.title}>
                <div className="why-figure mono">{w.figure}</div>
                <div className="why-text">
                  <b>{w.title}</b>
                  <span>{w.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-eyebrow">البداية</div>
          <h2 className="section-title">كيف تشتغل المنصة</h2>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="step-num mono">{s.n}</div>
                <div className="step-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24">{s.icon}</svg>
                </div>
                <div className="step-text"><b>{s.title}</b><span>{s.desc}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">لمين المنصة</div>
          <h2 className="section-title">مصممة لكل صانع محتوى رقمي</h2>
          <div className="usecases">
            {USECASES.map((u) => (
              <div className="usecase-chip" key={u.title}>
                <div className="usecase-chip-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24">{u.icon}</svg>
                </div>
                <div>
                  <b>{u.title}</b>
                  <span>{u.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow">المميزات</div>
          <h2 className="section-title">كل شي تحتاجه لبيع منتجك</h2>
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24">{f.icon}</svg>
                </div>
                <b>{f.title}</b>
                <span>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">الحماية</div>
          <h2 className="section-title">حمايتك من الألف للياء</h2>
          <div className="section-sub">منتجك الرقمي يستحق الحماية، وإحنا نتكفل فيها</div>
          <div className="protection">
            {PROTECTION.map((p) => (
              <div className="protection-item" key={p.title}>
                <div className="protection-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24">{p.icon}</svg>
                </div>
                <b>{p.title}</b>
                <span>{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow">المقارنة</div>
          <h2 className="section-title">وش الفرق؟</h2>
          <div className="section-sub">مقارنة بسيطة بين Monah والمنصات التقليدية</div>
          <div className="compare">
            <div className="compare-row">
              <span></span><span style={{ textAlign: "center" }}>Monah</span><span style={{ textAlign: "center" }}>منصات تقليدية</span>
            </div>
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

      <section className="section" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">أمثلة</div>
          <h2 className="section-title">منتجات على المنصة</h2>
          <div className="section-sub">نماذج توضيحية لأنواع المنتجات اللي تُباع على Monah</div>
          <div className="products">
            {FEATURED_PRODUCTS.map((p) => (
              <div className="product-card" key={p.title}>
                <div className="product-thumb">
                  <svg width="26" height="26" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/><path d="M14 3v4h4" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg>
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

      <section className="section" id="pricing" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">الاشتراك</div>
          <h2 className="section-title">اختر باقتك</h2>
          <div className="section-sub">تقدر ترقّي أو تنزّل باقتك في أي وقت، وتلغي اشتراكك بدون أي رسوم إضافية</div>

          <div className="billing-toggle">
            <button
              className={"billing-btn" + (billing === "monthly" ? " active" : "")}
              onClick={() => setBilling("monthly")}
            >
              شهري
            </button>
            <button
              className={"billing-btn" + (billing === "yearly" ? " active" : "")}
              onClick={() => setBilling("yearly")}
            >
              سنوي <span className="billing-save-badge">وفّر شهرين</span>
            </button>
          </div>

          <div className="common-features">
            <b>كل الباقات تشمل:</b> {COMMON_FEATURES.join(" · ")}
          </div>

          <div className="pricing">
            {PACKAGES.map((p) => (
              <div className={"price-card" + (p.popular ? " popular" : "")} key={p.name}>
                {p.popular && <div className="price-badge">الأكثر طلبًا</div>}
                <div className="price-name">{p.name}</div>
                <div className="price-desc">{p.desc}</div>
                <div className="price-value mono">
                  {billing === "monthly" ? p.monthly : p.yearly}
                  <span>{billing === "monthly" ? "ر.ع / شهريًا" : "ر.ع / سنويًا"}</span>
                </div>
                <div className="price-yearly-note">
                  {billing === "yearly" ? `بدل ${p.monthly * 12} ر.ع — توفير ${p.monthly * 12 - p.yearly} ر.ع بالسنة` : ""}
                </div>
                <div className="price-features">
                  {p.features.map((f) => <div key={f}>✓ {f}</div>)}
                </div>
                {p.soon && (
                  <div className="price-soon">
                    <div className="price-soon-label">قادم قريبًا:</div>
                    {p.soon.map((f) => <div key={f}>○ {f}</div>)}
                  </div>
                )}
                <a className="price-btn" href="#register">{p.btn}</a>
              </div>
            ))}
          </div>
          <div className="pricing-note">الأسعار كاملة وشاملة، بدون أي عمولة أو رسوم خفية من Monah. قد تُطبَّق رسوم بسيطة من مزود الدفع حسب وسيلة الدفع المستخدمة. لو ألغيت اشتراكك، ما يُخصم منك أي مبلغ إضافي.</div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow">أسئلة</div>
          <h2 className="section-title">أسئلة شائعة</h2>
          <div className="faq">
            {FAQS.map((f, i) => <FaqItem key={f.q} id={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <div className="final-cta">
        <h3>جاهز تبدأ متجرك؟</h3>
        <p>سجّل الحين وابدأ البيع خلال دقائق. لن يُخصم أي مبلغ قبل تأكيد اختيارك للباقة.</p>
        <a className="btn fill" href="#register">أنشئ متجرك الآن</a>
      </div>

      <footer>
        <div className="footer-contact">
          تواصل معنا مباشرة على واتساب: <a href="https://wa.me/96876630905" target="_blank" rel="noopener noreferrer">76630905</a>
        </div>
        © Monah — منصة بيع المنتجات الرقمية
        <div className="footer-links">
          <a href="#privacy">سياسة الخصوصية</a>
          <a href="#terms">الشروط والأحكام</a>
        </div>
      </footer>
    </div>
  );
}
