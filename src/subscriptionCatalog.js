export const BASE_MONTHLY_PRICE = 5;
export const CUSTOM_DOMAIN_MONTHLY_PRICE = 2;

// titleEn/descEn تُستخدم بس بالصفحة الرئيسية العامة (App.jsx) لما الزائر يفعّل
// الإنجليزية — title/desc العربية تبقى كما هي لكل مكان ثاني (لوحة التاجر، صفحة
// التسجيل) لأنها موجّهة للتاجر العماني نفسه، ما تحتاج ترجمة.
export const ADD_ON_CATALOG = [
  { key: "digitalSelling", group: "البيع الرقمي", title: "البيع الرقمي", titleEn: "Digital selling", price: 2, desc: "عميلك يدفع ببطاقته أو محفظته ويستلم ملفه فورًا خلال ثوانٍ، بدون ما تراجع أو تؤكد شي بنفسك. اربط بوابة الدفع الخاصة بك من الإعدادات (بوابة الدفع الخاصة بك) أولًا، ثم فعّل هذه الإضافة.", descEn: "Your customer pays by card or wallet and receives their file instantly within seconds, with no manual review or confirmation from you. Connect your own payment gateway from Settings first, then enable this add-on.", status: "متاح الآن", ready: true },
  { key: "salesGrowth", group: "زيادة المبيعات", title: "زيادة المبيعات", titleEn: "Sales growth", price: 1, desc: "بيع أكثر بضغطة وحدة: اجمع منتجاتك في حزم بسعر مغري، وفعّل كوبونات خصم توصّل عميلك أسرع للشراء.", descEn: "Sell more with a single click: bundle your products at an attractive price, and enable discount coupons that get your customer to buy faster.", status: "متاح الآن", ready: true },
  { key: "salesManagement", group: "إدارة المبيعات", title: "إدارة المبيعات", titleEn: "Sales management", price: 1, desc: "فاتورة رسمية بشعار متجرك تظهر تلقائيًا لك ولعميلك بعد كل عملية بيع، تعطيك مظهر احترافي بدون أي جهد إضافي.", descEn: "An official invoice with your store's logo, generated automatically for you and your customer after every sale — a professional look with zero extra effort.", status: "متاح الآن", ready: true },
  { key: "extraProtection", group: "حماية المنتجات", title: "حماية إضافية", titleEn: "Extra protection", price: 0.5, desc: "امنع تسريب ملفك بعد البيع: كل عميل يقدر ينزّل الملف حتى 5 مرات فقط، ثم يتوقف الرابط تلقائيًا.", descEn: "Prevent your file from leaking after the sale: each customer can download it up to 5 times only, then the link stops working automatically.", status: "متاح الآن", ready: true },
  { key: "aiTools", group: "أدوات الذكاء", title: "أدوات الذكاء", titleEn: "AI tools", price: 1, desc: "وصف منتج جذاب ونص إعلان جاهز خلال ثوانٍ يكتبه لك الذكاء الاصطناعي — تراجعه وتنشره بنفسك.", descEn: "A compelling product description and ready ad copy, written for you by AI within seconds — you review it and publish it yourself.", status: "متاح الآن", ready: true },
];
