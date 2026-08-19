import React, { useState } from "react";

const styles = `
  .monah-app *{ box-sizing:border-box; }
  .monah-app{ font-family:'Cairo', sans-serif; background:#F6F3EC; color:#16233F; }
  .monah-app .mono{ font-family:'JetBrains Mono', monospace; }
  .monah-app a{ text-decoration:none; }
  .wrap{ max-width:1080px; margin:0 auto; padding:0 20px; }

  .nav{ display:flex; justify-content:space-between; align-items:center; padding:20px 0; }
  .nav-brand{ display:flex; align-items:center; gap:9px; font-family:'Almarai', sans-serif; font-weight:800; font-size:20px; }
  .nav-brand img{ width:30px; height:30px; border-radius:8px; display:block; }
  .nav-btns{ display:flex; gap:10px; }
  .nav-btn{ padding:10px 16px; border-radius:9px; font-size:13px; font-weight:700; border:1px solid #E4E0D3; background:#FFFFFF; color:#16233F; cursor:pointer; }
  .nav-btn.primary{ background:#16233F; color:#fff; border:none; }

  .hero{ padding:30px 0 40px; text-align:center; }
  .hero-eyebrow{ display:inline-flex; align-items:center; gap:6px; background:#EAF0EB; color:#4B6152; font-size:12px; font-weight:700; padding:7px 14px; border-radius:100px; margin-bottom:22px; }
  .hero h1{ font-family:'Almarai', sans-serif; font-weight:800; font-size:33px; line-height:1.5; margin-bottom:14px; }
  .hero h1 em{ font-style:normal; color:#B9832F; }
  .hero-audience{ color:#8A8677; font-size:13.5px; margin-bottom:16px; }
  .hero p{ color:#3D4A66; font-size:15px; line-height:1.9; max-width:480px; margin:0 auto 26px; }
  .hero-cta{ display:flex; gap:10px; justify-content:center; margin-bottom:20px; flex-wrap:wrap; }
  .btn{ padding:14px 22px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Cairo', sans-serif; }
  .btn.out{ border:1.5px solid #16233F; color:#16233F; background:transparent; }
  .btn.fill{ background:#16233F; color:#fff; border:none; }
  .hero-trust{ color:#8A8677; font-size:13px; }
  .hero-trust b{ color:#16233F; }

  .stats{ display:flex; border-top:1px solid #E4E0D3; border-bottom:1px solid #E4E0D3; max-width:600px; margin:0 auto; }
  .stat{ flex:1; text-align:center; padding:22px 10px; border-inline-start:1px solid #E4E0D3; }
  .stat:first-child{ border-inline-start:none; }
  .stat b{ display:block; font-family:'Almarai', sans-serif; font-weight:800; font-size:20px; }
  .stat span{ display:block; color:#8A8677; font-size:12px; margin-top:4px; }

  .receipt{ max-width:340px; margin:32px auto 0; background:#FFFFFF; border-radius:16px; border:1px solid #E4E0D3; box-shadow:0 14px 30px rgba(22,35,63,0.07); overflow:hidden; }
  .receipt-head{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px dashed #E4E0D3; }
  .receipt-id{ font-size:11px; color:#8A8677; }
  .receipt-brand{ font-family:'Almarai', sans-serif; font-weight:800; font-size:13px; }
  .receipt-body{ padding:16px 20px; }
  .receipt-row{ display:flex; justify-content:space-between; font-size:13px; padding:6px 0; color:#3D4A66; }
  .receipt-row b{ color:#16233F; }
  .receipt-status{ display:inline-flex; align-items:center; gap:6px; background:#EAF0EB; color:#4B6152; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; margin-top:8px; }
  .receipt-note{ text-align:center; color:#B0AC9C; font-size:10.5px; margin-top:10px; }

  section.section{ padding:52px 0; }
  .section-eyebrow{ text-align:center; font-size:12px; color:#B9832F; font-weight:700; letter-spacing:.04em; margin-bottom:8px; }
  .section-title{ text-align:center; font-family:'Almarai', sans-serif; font-weight:800; font-size:24px; margin-bottom:8px; }
  .section-sub{ text-align:center; color:#8A8677; font-size:14px; margin-bottom:36px; }

  .steps{ max-width:640px; margin:0 auto; }
  .step{ display:flex; gap:18px; padding:20px 0; border-top:1px dashed #E4E0D3; }
  .step:first-child{ border-top:none; }
  .step-num{ font-family:'JetBrains Mono', monospace; font-weight:700; color:#B9832F; font-size:15px; padding-top:2px; min-width:24px; }
  .step-text b{ display:block; font-size:15px; font-weight:700; margin-bottom:4px; }
  .step-text span{ color:#8A8677; font-size:13px; line-height:1.8; }

  .features{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; max-width:900px; margin:0 auto; }
  .feature{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; padding:22px; }
  .feature-icon{ width:36px; height:36px; border-radius:9px; background:#EAF0EB; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
  .feature b{ display:block; font-size:14px; font-weight:700; margin-bottom:6px; }
  .feature span{ color:#8A8677; font-size:12.5px; line-height:1.7; }

  .usecases{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; max-width:900px; margin:0 auto; }
  .usecase{ background:#FBFAF7; border:1px solid #E4E0D3; border-radius:12px; padding:18px; text-align:center; }
  .usecase-emoji{ font-size:22px; margin-bottom:8px; }
  .usecase b{ display:block; font-size:13.5px; font-weight:700; margin-bottom:4px; }
  .usecase span{ color:#8A8677; font-size:11.5px; line-height:1.6; }

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
  .pricing-compare{ text-align:center; margin-top:14px; }
  .pricing-compare a{ color:#8A8677; font-size:12px; text-decoration:underline; }

  .compare{ display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px; max-width:760px; margin:0 auto; align-items:start; }
  .compare-col{ background:#FFFFFF; border-radius:16px; padding:24px 20px; border:1px solid #E4E0D3; }
  .compare-col.monah{ background:#16233F; border-color:#16233F; }
  .compare-head{ font-family:'Almarai', sans-serif; font-weight:800; font-size:14px; margin-bottom:16px; padding-bottom:14px; border-bottom:1px dashed #E4E0D3; color:#16233F; }
  .compare-col.monah .compare-head{ color:#fff; border-bottom-color:rgba(255,255,255,0.2); }
  .compare-row{ padding:9px 0; border-top:1px dashed #E4E0D3; }
  .compare-row:first-of-type{ border-top:none; }
  .compare-col.monah .compare-row{ border-top-color:rgba(255,255,255,0.14); }
  .compare-label{ display:block; font-size:10.5px; font-weight:700; color:#B9832F; margin-bottom:3px; }
  .compare-col.monah .compare-label{ color:#D8B074; }
  .compare-value{ display:block; font-size:12.5px; line-height:1.7; color:#3D4A66; }
  .compare-col.monah .compare-value{ color:#E4E8F0; }

  .showcase{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; max-width:900px; margin:0 auto 14px; }
  .showcase-card{ background:#FFFFFF; border:1px solid #E4E0D3; border-radius:14px; overflow:hidden; }
  .showcase-thumb{ height:100px; display:flex; align-items:center; justify-content:center; font-size:30px; background:#EAF0EB; }
  .showcase-body{ padding:14px 16px 16px; }
  .showcase-seller{ color:#B9832F; font-size:10.5px; font-weight:700; margin-bottom:4px; }
  .showcase-title{ font-size:13px; font-weight:700; line-height:1.5; margin-bottom:10px; min-height:38px; }
  .showcase-row{ display:flex; justify-content:space-between; align-items:center; }
  .showcase-price{ font-family:'JetBrains Mono', monospace; font-weight:700; font-size:14px; }
  .showcase-badge{ background:#F6F3EC; color:#8A8677; font-size:10px; font-weight:700; padding:4px 9px; border-radius:100px; }
  .showcase-disclaimer{ text-align:center; color:#B0AC9C; font-size:11px; }

  .faq{ max-width:640px; margin:0 auto; }
  .faq-item{ border-top:1px solid #E4E0D3; padding:18px 0; cursor:pointer; }
  .faq-item:last-child{ border-bottom:1px solid #E4E0D3; }
  .faq-q{ display:flex; justify-content:space-between; align-items:center; font-size:14.5px; font-weight:700; }
  .faq-q span{ color:#B9832F; font-size:18px; }
  .faq-a{ color:#8A8677; font-size:13px; line-height:1.8; margin-top:10px; max-width:520px; }

  .final-cta{ text-align:center; padding:56px 20px; }
  .final-cta h3{ font-family:'Almarai', sans-serif; font-weight:800; font-size:20px; margin-bottom:8px; }
  .final-cta p{ color:#8A8677; font-size:13.5px; margin-bottom:20px; }

  footer{ text-align:center; padding:28px 20px; color:#B0AC9C; font-size:12px; border-top:1px solid #E4E0D3; }
  .footer-contact{ color:#3D4A66; font-size:12.5px; margin-bottom:8px; }
  .footer-contact a{ color:#16233F; font-weight:700; }
  .footer-links{ margin-top:8px; display:flex; gap:14px; justify-content:center; }
  .footer-links a{ color:#8A8677; font-size:11.5px; }
`;

const WHY_MONAH = [
  { title: "بدون عمولة", desc: "تحتفظ بكامل سعر بيعك، وتدفع فقط اشتراك شهري ثابت مهما زادت مبيعاتك.", icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M8 8l8 8M9 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 17.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="#4B6152" strokeWidth="1.6" fill="none"/></> },
  { title: "حماية الملفات", desc: "روابط تحميل مشفّرة ومحمية، ما تنسرق ملفاتك أو تتوزع بدون علمك.", icon: <path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
  { title: "دعم كل الصيغ", desc: "PDF، تصاميم، أكواد، فيديوهات، أو أي ملف رقمي — ارفعه بدون قيود.", icon: <><rect x="4" y="3" width="10" height="13" rx="1.5" stroke="#4B6152" strokeWidth="2" fill="none"/><rect x="9" y="8" width="11" height="13" rx="1.5" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: "تسليم فوري", desc: "الملف يوصل عميلك تلقائيًا لحظة الدفع، ٢٤ ساعة و٧ أيام بالأسبوع.", icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
];

const FEATURES = [
  { title: "تسليم تلقائي", desc: "الملف يوصل العميل فورًا بعد الدفع، بدون أي تدخل منك.", icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
  { title: "رابط لكل منتج", desc: "كل منتج له رابط خاص فيه، تشاركه بأي مكان تحب.", icon: <path d="M12 3v18M3 12h18" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/> },
  { title: "تقارير مبيعات", desc: "تابع إيراداتك وأداء منتجاتك أول بأول.", icon: <><rect x="3" y="4" width="18" height="14" rx="2" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M3 9h18" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: "إعداد بدقائق", desc: "بدون خبرة تقنية، وبدون كمبيوتر أو استضافة خارجية.", icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
];

const FILE_PROTECTION = [
  { title: "روابط تحميل مؤقتة", desc: "كل رابط تحميل يصلح لفترة محدودة وينتهي تلقائيًا بعدها، فما يبقى صالح للاستخدام إلى الأبد.", icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M12 7v5l3.5 2" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
  { title: "تشفير كامل", desc: "ملفاتك مخزّنة ومحمية بتشفير قوي من لحظة الرفع إلى لحظة التحميل، ما يقدر أحد يوصلها غير عميلك.", icon: <><rect x="5" y="11" width="14" height="9" rx="2" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M8 11V8a4 4 0 018 0v3" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: "منع إعادة المشاركة", desc: "بعد أول تحميل ناجح، الرابط ينغلق ولا يشتغل بعدها، فملفك ما يتوزع مجانًا بروابط متداولة.", icon: <><path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/><path d="M9 12l2 2 4-4" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></> },
];

const USECASES = [
  { emoji: "🎨", title: "المصممين", desc: "قوالب، فونتات، ملفات تصميم جاهزة" },
  { emoji: "💻", title: "المبرمجين", desc: "أكواد، سكربتات، قوالب برمجية" },
  { emoji: "📚", title: "المعلّمين", desc: "دورات، ملفات تعليمية، ملخصات" },
  { emoji: "✍️", title: "صنّاع المحتوى", desc: "برستات، قوالب سوشيال ميديا" },
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
  {
    name: "أساسية", monthly: 3, yearly: 30,
    desc: "مناسبة لمن يريد البدء ببيع أول منتجاته الرقمية.",
    btn: "ابدأ متجرك",
    features: ["حتى 10 منتجات", "صفحة متجر جاهزة", "بيع ملفات وأكواد/تراخيص"],
  },
  {
    name: "احترافية", monthly: 6, yearly: 60, popular: true,
    desc: "مناسبة لمن يريد تنمية مبيعاته وتخصيص متجره.",
    btn: "نمِّ متجرك",
    features: ["كل مميزات الأساسية", "منتجات غير محدودة", "تخصيص شعار وألوان المتجر", "كوبونات خصم"],
    soon: ["إنشاء باقات من عدة منتجات", "تقارير مبيعات مفصلة", "تصدير الطلبات والبيانات"],
  },
  {
    name: "متجر متكامل", monthly: 12, yearly: 120,
    desc: "مناسبة لمن يريد بناء علامة رقمية مستقلة.",
    btn: "ابنِ علامتك",
    features: ["كل مميزات الاحترافية"],
    soon: ["ربط دومينك الخاص", "إزالة شعار Monah من واجهة المتجر", "حماية متقدمة لروابط التحميل", "تحليلات مصادر الزيارات", "دعم أولوية"],
  },
];

const COMPARE_ROWS = [
  { label: "العمولة على المبيعات", traditional: "نسبة تُقتطع من كل عملية بيع", monah: "بدون عمولة، اشتراك شهري ثابت فقط" },
  { label: "الرسوم الإضافية", traditional: "رسوم معالجة دفع أو سحب غير معلنة", monah: "سعر واضح وشامل من البداية" },
  { label: "سرعة وصول أرباحك", traditional: "تنتظر أيام حتى تُحوَّل أرباحك", monah: "أرباحك توصلك مباشرة من عميلك" },
  { label: "حماية ملفك", traditional: "غالبًا بدون حماية حقيقية من إعادة التوزيع", monah: "روابط تحميل مؤقتة ومشفّرة تنغلق بعد أول استخدام" },
];

const SHOWCASE_PRODUCTS = [
  { emoji: "🎨", title: "رزمة قوالب سيرة ذاتية", seller: "هند للتصاميم", price: "٥.٠٠ ر.ع" },
  { emoji: "💻", title: "سكربت أتمتة مهام بايثون", seller: "سالم للأكواد", price: "٨.٠٠ ر.ع" },
  { emoji: "📚", title: "دورة أساسيات التصميم الجرافيكي", seller: "أكاديمية نور", price: "١٥.٠٠ ر.ع" },
  { emoji: "✍️", title: "حزمة برستات إنستغرام", seller: "مؤثرة كوين", price: "٤.٠٠ ر.ع" },
];

const FAQS = [
  { q: "هل أحتاج خبرة تقنية؟", a: "أبدًا. ترفع ملفك وتحدد السعر، والباقي تتكفل به المنصة." },
  { q: "كيف أستلم أرباحي؟", a: "أرباحك توصلك مباشرة من عميلك، بدون ما تمر عبر عمولة للمنصة — Monah ما توسّط في مبيعاتك، أنت بس تدفع اشتراكك الشهري وتحتفظ بكامل سعر بيعك." },
  { q: "وش أنواع الملفات المسموحة؟", a: "أي ملف رقمي: PDF، تصاميم، أكواد، فيديوهات، وغيرها." },
  { q: "فيه عمولة على مبيعاتي؟", a: "لا. تدفع الاشتراك الشهري بس، وتحتفظ بكامل سعر بيعك." },
  { q: "أقدر أربط دومين خاص فيني؟", a: "هذي ميزة قادمة قريبًا للباقة المتكاملة، لسا قيد التطوير." },
  { q: "وش يصير لو ألغيت اشتراكي؟", a: "متجرك يتوقف عن استقبال مبيعات جديدة، لكن بياناتك ومنتجاتك تبقى محفوظة عندنا لو رجعت تشترك لاحقًا." },
  { q: "أقدر أغيّر باقتي بعدين؟", a: "أكيد، تقدر ترقّي أو تنزّل باقتك في أي وقت من لوحة التحكم." },
  { q: "وش الفرق بين الاشتراك الشهري والسنوي؟", a: "نفس المميزات بالضبط، بس الاشتراك السنوي يوفر لك تكلفة شهرين مجانًا مقارنة بالدفع شهر بشهر." },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item" onClick={() => setOpen(!open)}>
      <div className="faq-q">{q}<span>{open ? "−" : "+"}</span></div>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

export default function App() {
  const [billing, setBilling] = useState("monthly");

  return (
    <div className="monah-app" dir="rtl" lang="ar">
      <style>{styles}</style>

      <div className="wrap">
        <div className="nav">
          <div className="nav-btns">
            <a className="nav-btn" href="#login">تسجيل الدخول</a>
            <a className="nav-btn primary" href="#register">أنشئ متجرك الآن</a>
          </div>
          <div className="nav-brand">
            <img src="/monah-mark-512.png" alt="Monah" />
            <span>Monah</span>
          </div>
        </div>

        <div className="hero">
          <div className="hero-eyebrow">● بدون عمولة على المبيعات</div>
          <h1>بيع منتجك الرقمي<br/>من <em>رابط واحد</em></h1>
          <div className="hero-audience">للمصممين، المبرمجين، المعلّمين، وصنّاع المحتوى في عُمان والخليج</div>
          <p>ارفع ملفاتك الرقمية، شارك رابط كل منتج على واتساب وإنستغرام، والملف يوصل عميلك تلقائيًا بعد الدفع.</p>
          <div className="hero-cta">
            <a className="btn fill" href="#register">أنشئ متجرك الآن</a>
            <a className="btn out" href="#how">شاهد كيف تعمل</a>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>٤</b><span>متاجر نشطة</span></div>
        <div className="stat"><b>٪٠</b><span>عمولة على البيع</span></div>
        <div className="stat"><b>فوري</b><span>تسليم الملف</span></div>
      </div>

      <div className="wrap">
        <div className="receipt">
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
        <div className="receipt-note">مثال توضيحي لشكل عملية البيع على المنصة</div>
      </div>

      <section className="section" id="why" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">لماذا Monah</div>
          <div className="section-title">ليش تختار Monah؟</div>
          <div className="features">
            {WHY_MONAH.map((f) => (
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

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-eyebrow">البداية</div>
          <div className="section-title">كيف تشتغل المنصة</div>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="step-num mono">{s.n}</div>
                <div className="step-text"><b>{s.title}</b><span>{s.desc}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">لمين المنصة</div>
          <div className="section-title">مصممة لكل صانع محتوى رقمي</div>
          <div className="usecases">
            {USECASES.map((u) => (
              <div className="usecase" key={u.title}>
                <div className="usecase-emoji">{u.emoji}</div>
                <b>{u.title}</b>
                <span>{u.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="showcase">
        <div className="wrap">
          <div className="section-eyebrow">أمثلة</div>
          <div className="section-title">منتجات مميزة على المنصة</div>
          <div className="section-sub">عرض تجريبي يوريك شكل صفحة المنتج — الأسعار والمنتجات هنا وهمية لأغراض التوضيح فقط</div>
          <div className="showcase">
            {SHOWCASE_PRODUCTS.map((p) => (
              <div className="showcase-card" key={p.title}>
                <div className="showcase-thumb">{p.emoji}</div>
                <div className="showcase-body">
                  <div className="showcase-seller">{p.seller}</div>
                  <div className="showcase-title">{p.title}</div>
                  <div className="showcase-row">
                    <span className="showcase-price mono">{p.price}</span>
                    <span className="showcase-badge">تسليم فوري</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="showcase-disclaimer">* منتجات توضيحية وهمية، مو منتجات حقيقية معروضة للبيع</div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow">المميزات</div>
          <div className="section-title">كل شي تحتاجه لبيع منتجك</div>
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

      <section className="section" id="protection">
        <div className="wrap">
          <div className="section-eyebrow">الأمان</div>
          <div className="section-title">حماية ملفاتك من الألف إلى الياء</div>
          <div className="section-sub">ما نكتفي بمنعك من دفع عمولة، نحمي منتجك الرقمي نفسه من السرقة والتوزيع غير المصرّح فيه</div>
          <div className="features">
            {FILE_PROTECTION.map((f) => (
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

      <section className="section" id="compare" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">المقارنة</div>
          <div className="section-title">ليش تفرق عن المنصات التقليدية؟</div>
          <div className="section-sub">مقارنة بسيطة بين طريقة عمل Monah وطريقة عمل المنصات التي تقتطع عمولة من كل عملية بيع</div>
          <div className="compare">
            <div className="compare-col monah">
              <div className="compare-head">Monah</div>
              {COMPARE_ROWS.map((r) => (
                <div className="compare-row" key={r.label}>
                  <span className="compare-label">{r.label}</span>
                  <span className="compare-value">{r.monah}</span>
                </div>
              ))}
            </div>
            <div className="compare-col">
              <div className="compare-head">منصات تقليدية بعمولة</div>
              {COMPARE_ROWS.map((r) => (
                <div className="compare-row" key={r.label}>
                  <span className="compare-label">{r.label}</span>
                  <span className="compare-value">{r.traditional}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="pricing" style={{ background: "#FFFFFF" }}>
        <div className="wrap">
          <div className="section-eyebrow">الاشتراك</div>
          <div className="section-title">اختر باقتك</div>
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
          <div className="pricing-note">الأسعار كاملة وشاملة، بدون رسوم خفية أو مصاريف إضافية. لو ألغيت اشتراكك، ما يُخصم منك أي مبلغ إضافي.</div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-eyebrow">أسئلة</div>
          <div className="section-title">أسئلة شائعة</div>
          <div className="faq">
            {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
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
