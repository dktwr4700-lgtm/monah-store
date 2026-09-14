import React from "react";
import { useLang, LangToggle } from "./i18n.jsx";

const styles = `
  .lg-page{ min-height:100vh; background:#FFFFFF; font-family:'Cairo', sans-serif; }
  .lg-header{ padding:20px 22px; border-bottom:1px solid #EDEAE0; display:flex; justify-content:space-between; align-items:center; gap:10px; }
  .lg-brand{ font-family:'Almarai', sans-serif; font-weight:800; color:#0B0B0C; font-size:16px; text-decoration:none; }
  .lg-header-right{ display:flex; align-items:center; gap:10px; }
  .lg-back{ color:#8A8677; font-size:12px; text-decoration:none; }
  .lg-lang{ border:1px solid #EDEAE0; background:#fff; color:#8A8677; border-radius:100px; padding:7px 12px; font-family:inherit; font-size:11px; font-weight:800; cursor:pointer; }
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
  ar: {
    title: "سياسة الخصوصية",
    sections: [
      {
        h: "استخدام المنصة",
        p: ["تتيح مُونَة للتاجر إنشاء متجر رقمي وإدارة المنتجات وروابط المشاركة. قد تختلف الخدمات المتاحة بحسب ما يظهر داخل المنصة وقت الاستخدام، بما في ذلك خيارات الدفع أو التسليم الإلكتروني عند توفرها."],
      },
      {
        h: "المعلومات التي نجمعها",
        p: ["عند إنشاء حساب تاجر، نحتفظ بالبريد الإلكتروني واسم المتجر. وإذا أضفتها بنفسك، قد نحتفظ بشعار المتجر وغلافه ووصفه وبيانات التواصل التي تختار عرضها للزوار."],
        list: [
          "معلومات المنتجات التي يضيفها التاجر، مثل الاسم والوصف والسعر والصور والملف أو الأكواد المرتبطة به.",
          "البريد الإلكتروني الذي يرسله الزائر بنفسه عند تسجيل اهتمامه بمنتج قادم، ليظهر لصاحب ذلك المنتج فقط.",
          "لا تطلب مُونَة بيانات بطاقات أو حسابات دفع أو تحويلات مالية داخل صفحة المتجر العامة. إذا توفرت خدمة دفع إلكتروني، تظهر طريقة الدفع في صفحة مستقلة ومحمية قبل تأكيد العملية.",
        ],
      },
      {
        h: "كيف نستخدم المعلومات",
        list: [
          "لتشغيل حساب التاجر وعرض المعلومات التي يختار التاجر نشرها في صفحة متجره.",
          "لتقديم أدوات إدارة المنتجات وروابط المشاركة والحزم وحالة إطلاق المنتج القادم.",
          "لإتاحة بيانات الاهتمام بصاحب المنتج المعني، عند إدخال الزائر بريده بنفسه.",
          "للتواصل بخصوص الحساب أو طلبات الدعم عند الحاجة.",
        ],
      },
      {
        h: "مشاركة البيانات",
        p: ["لا نبيع بياناتك ولا نشاركها لأغراض تسويقية. نستخدم مزودي خدمات تقنية لازمين لتشغيل المنصة، مثل Firebase لحفظ بيانات المتجر والملفات، وفق إعدادات الحماية المعتمدة."],
      },
      {
        h: "أمان البيانات",
        p: ["نستخدم إعدادات صلاحيات لحماية بيانات المتاجر والملفات، ونعمل على تحسينها عند الحاجة. مع ذلك، لا يوجد نظام رقمي مضمون بنسبة 100٪؛ لذا لا تضع معلومات حساسة لا تحتاجها المنصة."],
      },
      {
        h: "حقوقك",
        p: ["يمكنك طلب الوصول إلى بيانات حسابك أو تصحيحها أو طلب حذفها بالتواصل معنا على monahapp@outlook.sa. سنراجع الطلب وفق المتطلبات النظامية واحتياجات تشغيل المنصة وحماية المستخدمين."],
      },
      {
        h: "تحديث هذه السياسة",
        p: ["قد نحدّث هذه السياسة عند إضافة مزايا جديدة أو تعديل طريقة عمل المنصة. سيظهر تاريخ التحديث في هذه الصفحة، وننصح بمراجعتها عند استخدام أي ميزة جديدة."],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      {
        h: "Using the platform",
        p: ["Monah lets a seller create a digital store and manage products and sharing links. Available services may vary based on what's shown inside the platform at the time of use, including payment or digital delivery options where offered."],
      },
      {
        h: "Information we collect",
        p: ["When you create a seller account, we keep your email and store name. If you add them yourself, we may also keep your store's logo, cover image, description, and any contact details you choose to show to visitors."],
        list: [
          "Product information the seller adds, such as name, description, price, images, and the file or codes attached to it.",
          "The email a visitor submits themselves when registering interest in an upcoming product, shown only to that product's owner.",
          "Monah never asks for card details, payment accounts, or bank transfers inside the public store page. Where a card-payment service is available, the payment method appears on a separate, protected page before the transaction is confirmed.",
        ],
      },
      {
        h: "How we use the information",
        list: [
          "To run the seller account and display the information the seller chooses to publish on their store page.",
          "To provide product-management tools, sharing links, bundles, and upcoming-product launch status.",
          "To make interest data available to the relevant product's owner, when a visitor enters their own email.",
          "To communicate about the account or support requests when needed.",
        ],
      },
      {
        h: "Sharing data",
        p: ["We don't sell your data or share it for marketing purposes. We use technical service providers necessary to run the platform, such as Firebase for storing store data and files, under approved security settings."],
      },
      {
        h: "Data security",
        p: ["We use access-control settings to protect store and file data, and work to improve them as needed. That said, no digital system is 100% guaranteed — so don't put sensitive information the platform doesn't need into it."],
      },
      {
        h: "Your rights",
        p: ["You can request access to your account data, ask to correct it, or request its deletion by contacting us at monahapp@outlook.sa. We'll review the request according to legal requirements and the platform's operational and user-protection needs."],
      },
      {
        h: "Updates to this policy",
        p: ["We may update this policy when we add new features or change how the platform works. The update date will appear on this page, and we recommend reviewing it whenever you use a new feature."],
      },
    ],
  },
};

const TERMS = {
  ar: {
    title: "الشروط والأحكام",
    sections: [
      {
        h: "طبيعة الخدمة",
        p: ["مُونَة منصة تساعد التاجر على تجهيز متجر رقمي وإدارة منتجاته ومشاركة روابطها. يظهر للعميل داخل المنصة ما إذا كانت خيارات الشراء أو الدفع أو التسليم متاحة للمنتج المعني قبل تأكيد أي عملية."],
      },
      {
        h: "الاشتراك والإضافات",
        p: [
          "يبدأ الاشتراك المرن بمتجر أساسي بسعر 5 ر.ع شهريًا، ثم إضافات يختارها التاجر لاحقًا. يظهر السعر الإجمالي وطريقة التفعيل بوضوح قبل أي تحصيل.",
          "لا تتفعل أي إضافة مدفوعة جديدة إلا بعد أن يطّلع التاجر على سعرها وشروطها ويؤكد عملية التفعيل بالطريقة المتاحة داخل المنصة.",
        ],
      },
      {
        h: "حزم المنتجات",
        p: ["يمكن للتاجر تجهيز حزم منتجات وحفظها كمسودة، ثم نشرها أو إخفاؤها أو حذفها من لوحة التحكم. لا تظهر الحزمة للزوار ولا تتاح للطلب إلا بعد أن ينشرها التاجر بنفسه."],
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
        h: "الدفع والتسليم والاسترجاع",
        p: [
          "عند إتاحة دفع إلكتروني لمنتج ما، تظهر طريقة الدفع والسعر الإجمالي قبل تأكيد العملية. لا يبدأ التسليم الرقمي إلا وفق الحالة التي تظهر للعميل بعد تأكيد العملية بنجاح.",
          "أي اتفاق أو دفع يتم خارج مُونَة بين التاجر والعميل لا تديره المنصة ولا تتحقق منه. سياسة الاسترجاع، عند توفرها، تظهر قبل تأكيد الشراء للمنتج المعني.",
        ],
      },
      {
        h: "التعديل على الخدمة",
        p: ["قد نعدل أو نوقف ميزة لحماية المنصة أو تطويرها. سنوضح أي تغيير جوهري يتعلق بالدفع أو الصلاحيات أو توفر المزايا قبل تطبيقه على المستخدمين المتأثرين."],
      },
    ],
  },
  en: {
    title: "Terms & Conditions",
    sections: [
      {
        h: "Nature of the service",
        p: ["Monah is a platform that helps a seller set up a digital store, manage their products, and share their links. The buyer sees inside the platform whether purchase, payment, or delivery options are available for a given product before confirming any transaction."],
      },
      {
        h: "Subscription and add-ons",
        p: [
          "The flexible subscription starts with a base store at 5 OMR/month, followed by add-ons the seller chooses later. The total price and activation method are shown clearly before any charge.",
          "No new paid add-on activates until the seller has reviewed its price and terms and confirmed the activation through the method available inside the platform.",
        ],
      },
      {
        h: "Product bundles",
        p: ["A seller can prepare product bundles and save them as a draft, then publish, hide, or delete them from the dashboard. A bundle is never shown to visitors or available to order until the seller publishes it themselves."],
      },
      {
        h: "Seller responsibility",
        list: [
          "The seller is fully responsible for their products' content and the accuracy of their descriptions",
          "The seller is responsible for the quality and validity of the files or codes they upload",
          "Selling content that violates the law or intellectual property rights is prohibited",
        ],
      },
      {
        h: "Payment, delivery, and refunds",
        p: [
          "Where card payment is available for a product, the payment method and total price are shown before the transaction is confirmed. Digital delivery only begins according to the status shown to the buyer after the transaction is successfully confirmed.",
          "Any agreement or payment made outside Monah between the seller and the buyer is not managed or verified by the platform. A refund policy, where offered, is shown before purchase is confirmed for the relevant product.",
        ],
      },
      {
        h: "Changes to the service",
        p: ["We may modify or discontinue a feature to protect or develop the platform. We'll explain any material change related to payment, permissions, or feature availability before applying it to affected users."],
      },
    ],
  },
};

const LG_T = {
  ar: { home: "العودة للرئيسية", updated: "آخر تحديث: أغسطس 2026", note: "هذه مسودة تشغيلية تشرح طريقة استخدام المنصة وليست استشارة قانونية. نوصي بمراجعتها مع مختص قانوني قبل اعتمادها النهائي." },
  en: { home: "Back to homepage", updated: "Last updated: August 2026", note: "This is an operational draft explaining how the platform works, not legal advice. We recommend reviewing it with a legal professional before finalizing it." },
};

export default function LegalPage({ type }) {
  const [lang, setLang] = useLang();
  const t = LG_T[lang];
  const source = type === "terms" ? TERMS : PRIVACY;
  const data = source[lang];

  return (
    <div className="lg-page" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <style>{styles}</style>
      <div className="lg-header">
        <a className="lg-brand" href="#">Monah</a>
        <div className="lg-header-right">
          <LangToggle lang={lang} onChange={setLang} className="lg-lang" />
          <a className="lg-back" href="#">{t.home}</a>
        </div>
      </div>
      <div className="lg-wrap">
        <div className="lg-title">{data.title}</div>
        <div className="lg-updated">{t.updated}</div>

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
          {t.note}
        </div>
      </div>
    </div>
  );
}
