import React from "react";

const styles = `
  .lg-page{ min-height:100vh; background:#FFFFFF; font-family:'Cairo', sans-serif; }
  .lg-header{ padding:20px 22px; border-bottom:1px solid #EDEAE0; display:flex; justify-content:space-between; align-items:center; }
  .lg-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#0B0B0C; font-size:16px; text-decoration:none; }
  .lg-back{ color:#8A8677; font-size:12px; text-decoration:none; }
  .lg-wrap{ max-width:600px; margin:0 auto; padding:32px 22px 60px; }
  .lg-title{ font-family:'Almarai', sans-serif; font-weight:800; color:#0B0B0C; font-size:22px; margin-bottom:6px; }
  .lg-updated{ color:#8A8677; font-size:11.5px; margin-bottom:28px; }
  .lg-section{ margin-bottom:24px; }
  .lg-section h3{ font-family:'Almarai', sans-serif; font-weight:800; color:#0B0B0C; font-size:14.5px; margin-bottom:8px; }
  .lg-section p{ color:#3D4A66; font-size:13.5px; line-height:2; margin-bottom:6px; }
  .lg-section ul{ margin: 0; padding-inline-start: 20px; }
  .lg-section li{ color:#3D4A66; font-size:13.5px; line-height:1.9; margin-bottom:4px; }
  .lg-note{ background:#FBFAF7; border:1px solid #EDEAE0; border-radius:12px; padding:14px 16px; color:#8A8677; font-size:12px; line-height:1.8; margin-top:8px; }
`;

const PRIVACY = {
  title: "سياسة الخصوصية",
  sections: [
    {
      h: "المعلومات اللي نجمعها",
      p: ["نجمع بريدك الإلكتروني عند الشراء، وبيانات حسابك (اسم المتجر، شعار، بيانات تواصل مثل رقم واتساب أو حساب إنستغرام) لو سجّلت كبائع."],
    },
    {
      h: "كيف نستخدم بياناتك",
      list: [
        "لتوصيل المنتج أو الكود اللي اشتريته",
        "لتشغيل حسابك كبائع وعرض متجرك للزبائن",
        "للتواصل معك بخصوص طلبك أو حسابك عند الحاجة",
        "لإرسال إشعارات تخص اشتراكك أو تجديده",
      ],
    },
    {
      h: "مشاركة البيانات",
      p: ["ما نبيع بياناتك ولا نشاركها مع جهات ثالثة لأغراض تسويقية. البيانات تُستخدم فقط لتشغيل المنصة."],
    },
    {
      h: "أمان البيانات",
      p: ["بياناتك محفوظة عبر خدمات Google Firebase بإجراءات حماية معيارية. مع ذلك، ما فيه نظام مضمون بنسبة 100٪، ونعمل باستمرار على تحسين الحماية."],
    },
    {
      h: "حقوقك",
      p: ["تقدر تطلب حذف حسابك وبياناتك في أي وقت بالتواصل معنا."],
    },
  ],
};

const TERMS = {
  title: "الشروط والأحكام",
  sections: [
    {
      h: "طبيعة الخدمة",
      p: ["Monah منصة تتيح للبائعين إنشاء متجر رقمي وبيع منتجاتهم الرقمية (ملفات، أكواد تفعيل) مقابل اشتراك شهري أو سنوي، بدون عمولة على المبيعات."],
    },
    {
      h: "مسؤولية البائع",
      list: [
        "البائع مسؤول بالكامل عن محتوى منتجاته ودقة وصفها",
        "البائع مسؤول عن جودة وصحة الملفات أو الأكواد اللي يرفعها",
        "يُمنع بيع محتوى مخالف للأنظمة أو حقوق الملكية الفكرية",
      ],
    },
    {
      h: "الاشتراك الشهري والسنوي",
      p: [
        "الاشتراك (شهري أو سنوي) يُجدد تلقائيًا في نفس الدورة اللي اخترتها، ما لم يُلغَ من لوحة التحكم.",
        "الاشتراك السنوي يُقدَّم بسعر مخفّض مقارنة بمجموع الاشتراك الشهري لنفس المدة، ويُدفع دفعة واحدة عند التجديد.",
        "تقدر تنتقل بين الاشتراك الشهري والسنوي، أو تغيّر باقتك، في أي وقت من لوحة التحكم.",
      ],
    },
    {
      h: "الدفع والاسترجاع",
      p: [
        "لكون المنتجات رقمية تُسلّم فورًا، لا يوجد استرجاع بعد إتمام عملية الشراء إلا في حال وجود خلل تقني من طرف المنصة.",
        "لو ألغيت اشتراكك، ما يُخصم منك أي مبلغ إضافي، ويتوقف متجرك عن استقبال مبيعات جديدة مع بقاء بياناتك محفوظة.",
      ],
    },
    {
      h: "التعديل على الخدمة",
      p: ["نحتفظ بحق تعديل أو إيقاف أي ميزة بالمنصة، مع إشعار البائعين بأي تغيير جوهري يؤثر على حساباتهم."],
    },
  ],
};

export default function LegalPage({ type }) {
  const data = type === "terms" ? TERMS : PRIVACY;

  return (
    <div className="lg-page" dir="rtl" lang="ar">
      <style>{styles}</style>
      <div className="lg-header">
        <a className="lg-brand" href="#">Monah</a>
        <a className="lg-back" href="#">العودة للرئيسية</a>
      </div>
      <div className="lg-wrap">
        <div className="lg-title">{data.title}</div>
        <div className="lg-updated">آخر تحديث: أغسطس 2026</div>

        {data.sections.map((s) => (
          <div className="lg-section" key={s.h}>
            <h3>{s.h}</h3>
            {s.p && s.p.map((line, i) => <p key={i}>{line}</p>)}
            {s.list && (
              <ul>
                {s.list.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}

        <div className="lg-note">
          هذه الصفحة تقدّم إطارًا عامًا لسياسات المنصة وليست استشارة قانونية. لأي استفسار تواصل معنا مباشرة.
        </div>
      </div>
    </div>
  );
}
