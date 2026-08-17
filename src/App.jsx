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
  .hero h1{ font-family:'Almarai', sans-serif; font-weight:800; font-size:34px; line-height:1.5; margin-bottom:16px; }
  .hero h1 em{ font-style:normal; color:#B9832F; }
  .hero p{ color:#3D4A66; font-size:15px; line-height:1.9; max-width:480px; margin:0 auto 26px; }
  .hero-cta{ display:flex; gap:10px; justify-content:center; margin-bottom:20px; flex-wrap:wrap; }
  .btn{ padding:14px 22px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Cairo', sans-serif; }
  .btn.out{ border:1.5px solid #16233F; color:#16233F; background:transparent; }
  .btn.fill{ background:#16233F; color:#fff; border:none; }
  .hero-trust{ color:#8A8677; font-size:13px; }
  .hero-trust b{ color:#16233F; }

  .stats{ display:flex; border-top:1px solid #E4E0D3; border-bottom:1px solid #E4E0D3; max-width:520px; margin:0 auto; }
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

  .pricing{ display:flex; gap:16px; max-width:920px; margin:0 auto; flex-wrap:wrap; justify-content:center; align-items:stretch; }
  .price-card{ flex:1; min-width:230px; max-width:280px; background:#FFFFFF; border:1px solid #E4E0D3; border-radius:16px; padding:30px 24px 26px; position:relative; display:flex; flex-direction:column; }
  .price-card.popular{ border:2px solid #16233F; padding-top:32px; }
  .price-badge{ position:absolute; top:-12px; right:24px; background:#B9832F; color:#fff; font-size:11px; font-weight:700; padding:5px 13px; border-radius:100px; }
  .price-name{ font-family:'Almarai', sans-serif; font-weight:800; font-size:15px; margin-bottom:10px; }
  .price-value{ display:flex; align-items:baseline; gap:6px; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:26px; padding-bottom:16px; margin-bottom:16px; border-bottom:1px dashed #E4E0D3; }
  .price-value span{ font-size:12px; color:#8A8677; font-family:'Cairo', sans-serif; font-weight:400; }
  .price-features{ flex:1; }
  .price-features div{ display:flex; align-items:flex-start; gap:8px; font-size:13px; color:#3D4A66; line-height:1.6; padding:6px 0; }
  .price-btn{ width:100%; margin-top:20px; padding:13px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; border:1.5px solid #16233F; background:transparent; color:#16233F; display:block; text-align:center; }
  .price-card.popular .price-btn{ background:#16233F; color:#fff; border:none; }

  .faq{ max-width:640px; margin:0 auto; }
  .faq-item{ border-top:1px solid #E4E0D3; padding:18px 0; cursor:pointer; }
  .faq-item:last-child{ border-bottom:1px solid #E4E0D3; }
  .faq-q{ display:flex; justify-content:space-between; align-items:center; font-size:14.5px; font-weight:700; }
  .faq-q span{ color:#B9832F; font-size:18px; }
  .faq-a{ color:#8A8677; font-size:13px; line-height:1.8; margin-top:10px; max-width:520px; }

  .final-cta{ text-align:center; padding:56px 20px; }
  .final-cta h3{ font-family:'Almarai', sans-serif; font-weight:800; font-size:20px; margin-bottom:8px; }
  .final-cta p{ color:#8A8677; font-size:13.5px; margin-bottom:20px; }

  footer{ text-align:center; padding:24px 20px; color:#B0AC9C; font-size:12px; border-top:1px solid #E4E0D3; }
  .footer-links{ margin-top:8px; display:flex; gap:14px; justify-content:center; }
  .footer-links a{ color:#8A8677; font-size:11.5px; }
`;

const FEATURES = [
  { title: "تسليم تلقائي", desc: "الملف يوصل العميل فورًا بعد الدفع، بدون أي تدخل منك.", icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#4B6152" strokeWidth="2" strokeLinejoin="round" fill="none"/> },
  { title: "رابط لكل منتج", desc: "كل منتج له رابط خاص فيه، تشاركه بأي مكان تحب.", icon: <path d="M12 3v18M3 12h18" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/> },
  { title: "تقارير مبيعات", desc: "تابع إيراداتك وأداء منتجاتك أول بأول.", icon: <><rect x="3" y="4" width="18" height="14" rx="2" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M3 9h18" stroke="#4B6152" strokeWidth="2" fill="none"/></> },
  { title: "إعداد بدقائق", desc: "بدون خبرة تقنية، وبدون كمبيوتر أو استضافة خارجية.", icon: <><circle cx="12" cy="12" r="9" stroke="#4B6152" strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke="#4B6152" strokeWidth="2" strokeLinecap="round" fill="none"/></> },
];

const STEPS = [
  { n: "01", title: "تسجّل وتشترك بباقة شهرية", desc: "تدخل بياناتك وتختار الباقة المناسبة لك." },
  { n: "02", title: "ترفع منتجاتك الرقمية", desc: "ملفات، تصاميم، أكواد — أي شي رقمي تبيعه." },
  { n: "03", title: "تشارك الرابط وتستلم كامل السعر", desc: "ما فيه عمولة على أي عملية بيع تسويها." },
];

const PACKAGES = [
  { name: "أساسية", price: "3", features: ["حتى 10 منتجات", "رابط خاص لكل منتج", "تسليم تلقائي"] },
  { name: "احترافية", price: "6", popular: true, features: ["منتجات غير محدودة", "تخصيص شعار وألوان المتجر", "تقارير مبيعات مفصّلة"] },
  { name: "متجر متكامل", price: "12", features: ["كل مميزات الاحترافية", "ربط دومينك الخاص", "دعم أولوية"] },
];

const FAQS = [
  { q: "هل أحتاج خبرة تقنية؟", a: "أبدًا. ترفع ملفك وتحدد السعر، والباقي تتكفل به المنصة." },
  { q: "وش أنواع الملفات المسموحة؟", a: "أي ملف رقمي: PDF، تصاميم، أكواد، فيديوهات، وغيرها." },
  { q: "فيه عمولة على مبيعاتي؟", a: "لا. تدفع الاشتراك الشهري بس، وتحتفظ بكامل سعر بيعك." },
  { q: "أقدر أربط دومين خاص فيني؟", a: "نعم، بباقة المتجر المتكامل تقدر تربط دومينك الخاص بخطوات بسيطة من لوحة التحكم." },
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
  return (
    <div className="monah-app" dir="rtl" lang="ar">
      <style>{styles}</style>

      <div className="wrap">
        <div className="nav">
          <div className="nav-btns">
            <a className="nav-btn" href="#login">تسجيل الدخول</a>
            <a className="nav-btn primary" href="#register">ابدأ البيع</a>
          </div>
          <div className="nav-brand">
            <img src="/monah-mark-512.png" alt="Monah" />
            <span>Monah</span>
          </div>
        </div>

        <div className="hero">
          <div className="hero-eyebrow">● بدون عمولة على المبيعات</div>
          <h1>متجرك الرقمي جاهز<br/>في <em>دقائق معدودة</em></h1>
          <p>ارفع ملفاتك الرقمية، شارك رابط كل منتج على واتساب وإنستغرام، والملف يوصل عميلك تلقائيًا بعد الدفع.</p>
          <div className="hero-cta">
            <a className="btn out" href="#how">شوف كيف تشتغل</a>
            <a className="btn fill" href="#register">ابدأ البيع</a>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>٪٠</b><span>عمولة على البيع</span></div>
        <div className="stat"><b>فوري</b><span>تسليم الملف</span></div>
        <div className="stat"><b>رابط</b><span>خاص لكل منتج</span></div>
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
      </div>

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

      <section className="section" id="pricing">
        <div className="wrap">
          <div className="section-eyebrow">الاشتراك</div>
          <div className="section-title">اختر باقتك</div>
          <div className="section-sub">تقدر تلغي أو تغيّر باقتك في أي وقت</div>
          <div className="pricing">
            {PACKAGES.map((p) => (
              <div className={"price-card" + (p.popular ? " popular" : "")} key={p.name}>
                {p.popular && <div className="price-badge">الأكثر طلبًا</div>}
                <div className="price-name">{p.name}</div>
                <div className="price-value mono">{p.price} <span>ر.ع / شهريًا</span></div>
                <div className="price-features">
                  {p.features.map((f) => <div key={f}>✓ {f}</div>)}
                </div>
                <a className="price-btn" href="#register">ابدأ بهذي الباقة</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#FFFFFF" }}>
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
        <p>سجّل الحين وابدأ البيع خلال دقائق</p>
        <a className="btn fill" href="#register">ابدأ البيع الآن</a>
      </div>

      <footer>
        © Monah — منصة بيع المنتجات الرقمية
        <div className="footer-links">
          <a href="#privacy">سياسة الخصوصية</a>
          <a href="#terms">الشروط والأحكام</a>
        </div>
      </footer>
    </div>
  );
}
