import React from "react";

const styles = `
  *{box-sizing:border-box; margin:0; padding:0;}
  html{scroll-behavior:smooth;}
  body{ font-family:'Cairo', sans-serif; background:var(--bg); color:var(--text); line-height:1.65; }
  :root{
    --bg:#F7F6F2; --surface:#FFFFFF; --border:#DFDCD1; --border-soft:#EAE7DD;
    --text:#16181D; --text-soft:#66655C;
    --primary:#16233F; --primary-dark:#0D1729; --primary-tint:#EAEDF2;
    --accent:#C7902E; --accent-tint:#F7ECD6;
    --maxw:1080px;
  }
  .monah-app h1,.monah-app h2,.monah-app h3,.monah-app .brand{ font-family:'Almarai', sans-serif; }
  .monah-app a{ color:inherit; text-decoration:none; }
  .wrap{ max-width:var(--maxw); margin:0 auto; padding:0 20px; }
  .monah-app section{ padding:52px 0; }
  .cap{ font-size:12.5px; font-weight:700; color:var(--text-soft); letter-spacing:.3px; margin-bottom:10px; }
  h2.section-title{ font-size:22px; font-weight:800; margin-bottom:8px; }
  .section-sub{ color:var(--text-soft); font-size:14px; max-width:520px; margin-bottom:30px; }
  .btn{ display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:14.5px; padding:13px 22px; border-radius:8px; border:1px solid transparent; white-space:nowrap; cursor:pointer; }
  .btn-primary{ background:var(--primary); color:#fff; }
  .btn-outline{ background:transparent; border-color:var(--border); color:var(--text); }
  .btn-accent{ background:var(--accent); color:#fff; }

  header{ border-bottom:1px solid var(--border); background:var(--bg); position:sticky; top:0; z-index:10; }
  .nav{ height:64px; display:flex; align-items:center; justify-content:space-between; }
  .brand{ font-size:18px; font-weight:800; color:var(--primary); }
  .nav-links{ display:none; gap:26px; font-size:13.5px; font-weight:600; color:var(--text-soft); }
  .nav-cta{ display:flex; gap:10px; }
  @media(min-width:860px){ .nav-links{ display:flex; } .nav-links a:hover{ color:var(--primary); } }

  .hero{ padding-top:48px; }
  .hero-grid{ display:grid; gap:40px; align-items:center; }
  @media(min-width:920px){ .hero-grid{ grid-template-columns: 1fr .85fr; } }
  .hero h1{ font-size:30px; line-height:1.4; font-weight:800; color:var(--primary); margin-bottom:16px; }
  @media(min-width:640px){ .hero h1{ font-size:38px; } }
  .hero p{ color:var(--text-soft); font-size:15px; max-width:460px; margin-bottom:24px; }
  .hero-actions{ display:flex; flex-wrap:wrap; gap:12px; margin-bottom:22px; }
  .hero-note{ font-size:13px; color:var(--text-soft); }

  .receipt-wrap{ position:relative; padding-top:12px; }
  .receipt{ background:var(--surface); border-radius:4px; box-shadow:0 22px 50px rgba(13,23,41,.14); padding:26px 24px 22px; position:relative; }
  .receipt::before{ content:""; position:absolute; top:-1px; right:14px; left:14px; height:12px; background: radial-gradient(circle at 10px 0, transparent 6px, var(--bg) 6.5px) top/20px 12px repeat-x; }
  .receipt-head{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
  .receipt-brand{ font-weight:800; font-size:14.5px; color:var(--primary); }
  .receipt-id{ font-size:11.5px; color:var(--text-soft); }
  .receipt-store{ font-size:12.5px; color:var(--text-soft); margin-bottom:16px; }
  .rdiv{ border-top:1px dashed var(--border); margin:14px 0; }
  .rrow{ display:flex; justify-content:space-between; font-size:13.5px; padding:5px 0; }
  .rrow .k{ color:var(--text-soft); }
  .rrow .v{ font-weight:700; }
  .rstatus{ display:inline-block; font-size:11.5px; font-weight:700; color:#3E7A54; background:#E7F2EA; padding:3px 9px; border-radius:5px; }
  .rtotal{ display:flex; justify-content:space-between; align-items:baseline; margin-top:14px; }
  .rtotal .k{ font-weight:700; font-size:14px; }
  .rtotal .v{ font-weight:800; font-size:22px; color:var(--primary); }
  .receipt-foot{ font-size:11.5px; color:var(--text-soft); margin-top:4px; }

  .spec-row{ display:grid; grid-template-columns:110px 1fr; gap:18px; border-top:1px solid var(--border-soft); padding:20px 0; }
  .spec-row:first-child{ border-top:1px solid var(--border); }
  @media(min-width:760px){ .spec-list{ display:grid; grid-template-columns:1fr 1fr; column-gap:40px; } .spec-row{ grid-template-columns:100px 1fr; } }
  .spec-key{ font-family:'Almarai'; font-weight:800; font-size:17px; color:var(--accent); }
  .spec-body h3{ font-size:14.5px; margin-bottom:4px; }
  .spec-body p{ font-size:13px; color:var(--text-soft); }

  .steps{ display:grid; gap:0; grid-template-columns:1fr; counter-reset:step; }
  @media(min-width:900px){ .steps{ grid-template-columns:repeat(5,1fr); } }
  .step{ border-top:1px solid var(--border); padding:18px 0 4px; }
  @media(min-width:900px){ .step{ border-top:none; border-right:1px solid var(--border); padding:0 18px; } .step:first-child{ border-right:none; padding-right:0; } }
  .step-num{ counter-increment:step; font-family:'Almarai'; font-weight:800; font-size:13px; color:var(--accent); margin-bottom:8px; }
  .step-num::before{ content: counter(step,arabic-indic); }
  .step h3{ font-size:14px; margin-bottom:5px; }
  .step p{ font-size:12.5px; color:var(--text-soft); }

  .price-scroll{ overflow-x:auto; border:1px solid var(--border); border-radius:8px; }
  table.price-table{ width:100%; border-collapse:collapse; min-width:620px; }
  .price-table th, .price-table td{ padding:14px 16px; text-align:right; font-size:13.5px; border-top:1px solid var(--border-soft); }
  .price-table thead th{ border-top:none; background:var(--surface); }
  .price-table th:first-child, .price-table td:first-child{ color:var(--text-soft); font-weight:600; width:34%; }
  .plan-name{ font-family:'Almarai'; font-weight:800; font-size:14px; color:var(--primary); }
  .plan-price{ font-size:19px; font-weight:800; margin-top:2px; }
  .plan-price span{ font-size:11.5px; font-weight:600; color:var(--text-soft); }
  .col-highlight{ background:var(--primary-tint); }
  .check{ color:#3E7A54; font-weight:800; }
  .dash{ color:var(--text-soft); }
  .price-cta-row td{ padding-top:16px; padding-bottom:18px; }

  .faq-list{ max-width:680px; }
  details{ border-top:1px solid var(--border-soft); padding:15px 0; }
  details:first-child{ border-top:1px solid var(--border); }
  summary{ cursor:pointer; font-weight:700; font-size:14px; list-style:none; display:flex; justify-content:space-between; align-items:center; }
  summary::-webkit-details-marker{ display:none; }
  summary::after{ content:"+"; font-size:18px; color:var(--text-soft); font-weight:400; }
  details[open] summary::after{ content:"–"; }
  details p{ font-size:13px; color:var(--text-soft); margin-top:9px; max-width:560px; }

  .cta-band{ background:var(--primary); border-radius:10px; padding:38px 26px; text-align:center; color:#fff; }
  .cta-band h2{ font-size:20px; margin-bottom:8px; }
  .cta-band p{ color:#B9C0D1; font-size:13.5px; margin-bottom:20px; }

  footer{ border-top:1px solid var(--border); padding:32px 0; }
  .foot-grid{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:20px; margin-bottom:18px; }
  .foot-links{ display:flex; gap:16px; font-size:12.5px; color:var(--text-soft); flex-wrap:wrap; }
  .foot-bottom{ font-size:12px; color:var(--text-soft); border-top:1px solid var(--border-soft); padding-top:14px; }
`;

const specs = [
  ["٠٪", "عمولة على المبيعات", "تحتفظ بكامل قيمة كل عملية بيع، دخلنا فقط من اشتراكك الشهري."],
  ["فوري", "تسليم تلقائي", "فور نجاح الدفع، يستلم العميل ملفه مباشرة دون أي تدخل منك."],
  ["خاص", "متجر باسمك", "صفحة مستقلة تحمل اسمك ومنتجاتك، جاهزة للمشاركة فور الاشتراك."],
  ["رابط", "لكل منتج على حدة", "شارك أي منتج مباشرة في واتساب أو إنستغرام برابط واحد بسيط."],
  ["تقارير", "مبيعات واضحة", "تابع مبيعاتك وأداء كل منتج من لوحة تحكم بسيطة ومباشرة."],
  ["كل صيغة", "ملفات متنوعة", "PDF، تصاميم، فيديو، صوتيات، أكواد — ارفع أي ملف رقمي تبيعه."],
];

const steps = [
  ["سجّل حسابك", "أنشئ حسابك كبائع خلال دقائق."],
  ["اشترك بالباقة", "اختر الباقة الشهرية المناسبة لك."],
  ["ارفع منتجاتك", "حمّل ملفاتك وحدد سعر كل منتج."],
  ["شارك رابطك", "انشر رابط متجرك أو منتجاتك أينما شئت."],
  ["استلم مبيعاتك", "الدفع والتسليم يتمّان تلقائيًا لكل عملية."],
];

const faqs = [
  ["هل يوجد عمولة على مبيعاتي؟", "لا، لا توجد أي عمولة. دخلنا فقط من الاشتراك الشهري، وتحتفظ بكامل قيمة كل عملية بيع."],
  ["ما أنواع الملفات التي يمكنني بيعها؟", "أي ملف رقمي: PDF، ملفات مضغوطة، فيديو، صوتيات، تصاميم، أكواد وقوالب برمجية."],
  ["كيف يستلم العميل المنتج بعد الدفع؟", "فور نجاح الدفع، يُرسل الملف تلقائيًا عبر رابط تحميل مباشر دون أي تدخل يدوي."],
  ["هل أحتاج خبرة تقنية لإنشاء متجري؟", "لا، الإعداد يتم من لوحة تحكم بسيطة، بدون أي كود أو خبرة برمجية."],
  ["هل يمكنني إلغاء الاشتراك في أي وقت؟", "نعم، يمكنك ترقية باقتك أو إلغاء اشتراكك في أي وقت من إعدادات حسابك."],
];

export default function App() {
  return (
    <div className="monah-app" dir="rtl" lang="ar">
      <style>{styles}</style>

      <header>
        <div className="wrap nav">
          <div className="brand">Monah</div>
          <nav className="nav-links">
            <a href="#features">المميزات</a>
            <a href="#how">طريقة العمل</a>
            <a href="#pricing">الأسعار</a>
            <a href="#faq">الأسئلة الشائعة</a>
          </nav>
          <div className="nav-cta">
            <a href="#" className="btn btn-outline" style={{ padding: "9px 15px" }}>تسجيل الدخول</a>
            <a href="#pricing" className="btn btn-primary" style={{ padding: "9px 15px" }}>ابدأ البيع</a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>متجرك الرقمي جاهز في دقائق<br />بِع منتجاتك بدون عمولة</h1>
            <p>أنشئ متجرك، ارفع ملفاتك الرقمية، وشارك رابط كل منتج على واتساب وإنستغرام. العميل يدفع، والملف يوصله تلقائيًا فورًا — وأنت تحتفظ بكامل السعر.</p>
            <div className="hero-actions">
              <a href="#pricing" className="btn btn-primary">ابدأ البيع</a>
              <a href="#how" className="btn btn-outline">شوف كيف تشتغل</a>
            </div>
            <div className="hero-note">بدون عمولة على المبيعات · تسليم تلقائي · رابط خاص لكل منتج</div>
          </div>

          <div className="receipt-wrap">
            <div className="receipt">
              <div className="receipt-head">
                <div className="receipt-brand">إيصال Monah</div>
                <div className="receipt-id">MN-2481#</div>
              </div>
              <div className="receipt-store">متجر هند للتصاميم — monah-app.com/hind</div>
              <div className="rdiv"></div>
              <div className="rrow"><span className="k">المنتج</span><span className="v">رزمة قوالب سيرة ذاتية</span></div>
              <div className="rrow"><span className="k">السعر</span><span className="v">٥ ر.ع</span></div>
              <div className="rrow"><span className="k">حالة الدفع</span><span className="rstatus">تم بنجاح</span></div>
              <div className="rrow"><span className="k">التسليم</span><span className="v">أُرسل الرابط تلقائيًا</span></div>
              <div className="rdiv"></div>
              <div className="rtotal"><span className="k">صافي البائع</span><span className="v">٥ ر.ع</span></div>
              <div className="receipt-foot">بدون أي خصم عمولة — الاشتراك الشهري فقط</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="wrap">
          <div className="cap">لماذا Monah</div>
          <h2 className="section-title">كل ما يحتاجه البائع، بلا تعقيد</h2>
          <p className="section-sub">لا حاجة لموقع منفصل أو خبرة تقنية — كل أدوات البيع جاهزة من أول يوم.</p>
          <div className="spec-list">
            {specs.map(([key, title, desc]) => (
              <div className="spec-row" key={title}>
                <div className="spec-key">{key}</div>
                <div className="spec-body"><h3>{title}</h3><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" style={{ background: "var(--surface)" }}>
        <div className="wrap">
          <div className="cap">طريقة العمل</div>
          <h2 className="section-title">من التسجيل إلى أول عملية بيع</h2>
          <p className="section-sub">خمس خطوات بسيطة، بدون حاجة لأي خبرة تقنية.</p>
          <div className="steps">
            {steps.map(([title, desc]) => (
              <div className="step" key={title}>
                <div className="step-num"></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing">
        <div className="wrap">
          <div className="cap">الباقات</div>
          <h2 className="section-title">اشتراك شهري واحد، بدون عمولة إضافية</h2>
          <p className="section-sub">اختر الباقة المناسبة لحجم مبيعاتك، وألغِ أو غيّر في أي وقت.</p>
          <div className="price-scroll">
            <table className="price-table">
              <thead>
                <tr>
                  <th></th>
                  <th><div className="plan-name">أساسية</div><div className="plan-price">٣ ر.ع <span>/شهريًا</span></div></th>
                  <th className="col-highlight"><div className="plan-name">احترافية</div><div className="plan-price">٧ ر.ع <span>/شهريًا</span></div></th>
                  <th><div className="plan-name">متقدمة</div><div className="plan-price">١٥ ر.ع <span>/شهريًا</span></div></th>
                </tr>
              </thead>
              <tbody>
                <tr><td>عدد المنتجات</td><td>حتى ١٠</td><td className="col-highlight">غير محدود</td><td>غير محدود</td></tr>
                <tr><td>رابط لكل منتج</td><td><span className="check">✓</span></td><td className="col-highlight"><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
                <tr><td>تخصيص واجهة المتجر</td><td><span className="dash">—</span></td><td className="col-highlight"><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
                <tr><td>تقارير مبيعات تفصيلية</td><td><span className="dash">—</span></td><td className="col-highlight"><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
                <tr><td>أكواد خصم وعروض</td><td><span className="dash">—</span></td><td className="col-highlight"><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>
                <tr><td>مدراء متعددون للمتجر</td><td><span className="dash">—</span></td><td className="col-highlight"><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>
                <tr className="price-cta-row">
                  <td></td>
                  <td><a href="#" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>اختر</a></td>
                  <td className="col-highlight"><a href="#" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>اختر</a></td>
                  <td><a href="#" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>اختر</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="wrap">
          <div className="cap">الأسئلة الشائعة</div>
          <h2 className="section-title">كل ما تحتاج معرفته</h2>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="cta-band">
            <h2>جاهز تبدأ متجرك الرقمي؟</h2>
            <p>سجّل الآن وابدأ ببيع منتجاتك الرقمية خلال دقائق، بدون عمولة على أي عملية بيع.</p>
            <a href="#" className="btn btn-accent">ابدأ البيع مجانًا</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="brand">Monah</div>
            <div className="foot-links">
              <a href="#features">المميزات</a>
              <a href="#pricing">الأسعار</a>
              <a href="#faq">الأسئلة الشائعة</a>
              <a href="#">تواصل معنا</a>
            </div>
          </div>
          <div className="foot-bottom">© ٢٠٢٦ Monah. جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </div>
  );
}
