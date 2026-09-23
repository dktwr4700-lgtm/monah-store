export const STARTER_MONTHLY_PRICE = 0.5;
export const STARTER_PRODUCT_LIMIT = 2;
export const BASE_MONTHLY_PRICE = 5;
export const BASE_PRODUCT_LIMIT = 50;
export const PRO_MONTHLY_PRICE = 10;
export const PRO_PRODUCT_LIMIT = 150;
export const CUSTOM_DOMAIN_MONTHLY_PRICE = 2;

export function productLimitForPlan(plan) {
  if (plan === "pro") return PRO_PRODUCT_LIMIT;
  if (plan === "trial") return 1;
  if (plan === "starter") return STARTER_PRODUCT_LIMIT;
  return BASE_PRODUCT_LIMIT;
}

export function priceForPlan(plan) {
  if (plan === "pro") return PRO_MONTHLY_PRICE;
  if (plan === "starter") return STARTER_MONTHLY_PRICE;
  return BASE_MONTHLY_PRICE;
}

// سعر "ابدأ" (0.50 ر.ع) تعريفي لأول شهر بس — أي تجديد بعده يحسب على أساس
// باقة "الأساسي" العادية، فيطابق ما يحسبه السيرفر فعليًا وقت التجديد.
export function renewalPriceForPlan(plan) {
  return priceForPlan(plan === "starter" ? "basic" : plan);
}

// titleEn/descEn/groupEn تُستخدم بكل مكان يعرض هذا الكتالوج (الصفحة الرئيسية،
// لوحة التاجر، صفحة فتح المتجر) لما التاجر يبدّل للإنجليزية عبر زر اللغة —
// title/desc/group العربية تبقى الافتراضي.
export const ADD_ON_CATALOG = [
  { key: "digitalSelling", group: "البيع الرقمي", groupEn: "Digital selling", title: "البيع الرقمي", titleEn: "Digital selling", price: 2, desc: "عميلك يدفع ببطاقته أو محفظته ويستلم ملفه فورًا خلال ثوانٍ، بدون ما تراجع أو تؤكد شي بنفسك. اربط بوابة الدفع الخاصة بك من الإعدادات (بوابة الدفع الخاصة بك) أولًا، ثم فعّل هذه الإضافة.", descEn: "Your customer pays by card or wallet and receives their file instantly within seconds, with no manual review or confirmation from you. Connect your own payment gateway from Settings first, then enable this add-on.", status: "متاح الآن", ready: true },
  { key: "salesGrowth", group: "زيادة المبيعات", groupEn: "Sales growth", title: "زيادة المبيعات", titleEn: "Sales growth", price: 1, desc: "بيع أكثر بضغطة وحدة: اجمع منتجاتك في حزم بسعر مغري، وفعّل كوبونات خصم توصّل عميلك أسرع للشراء.", descEn: "Sell more with a single click: bundle your products at an attractive price, and enable discount coupons that get your customer to buy faster.", status: "متاح الآن", ready: true },
  { key: "salesManagement", group: "إدارة المبيعات", groupEn: "Sales management", title: "إدارة المبيعات", titleEn: "Sales management", price: 1, desc: "فاتورة رسمية بشعار متجرك تظهر تلقائيًا لك ولعميلك بعد كل عملية بيع، تعطيك مظهر احترافي بدون أي جهد إضافي.", descEn: "An official invoice with your store's logo, generated automatically for you and your customer after every sale — a professional look with zero extra effort.", status: "متاح الآن", ready: true },
  { key: "extraProtection", group: "حماية المنتجات", groupEn: "Extra protection", title: "حماية إضافية", titleEn: "Extra protection", price: 0.5, desc: "امنع تسريب ملفك بعد البيع: كل عميل يقدر ينزّل الملف حتى 5 مرات فقط، ثم يتوقف الرابط تلقائيًا.", descEn: "Prevent your file from leaking after the sale: each customer can download it up to 5 times only, then the link stops working automatically.", status: "متاح الآن", ready: true },
  { key: "aiTools", group: "أدوات الذكاء", groupEn: "AI tools", title: "أدوات الذكاء", titleEn: "AI tools", price: 1, desc: "وصف منتج جذاب ونص إعلان جاهز خلال ثوانٍ يكتبه لك الذكاء الاصطناعي — تراجعه وتنشره بنفسك.", descEn: "A compelling product description and ready ad copy, written for you by AI within seconds — you review it and publish it yourself.", status: "متاح الآن", ready: true },
  { key: "whatsappAssistant", group: "مساعد واتساب", groupEn: "WhatsApp assistant", title: "مساعد واتساب الذكي", titleEn: "WhatsApp AI assistant", price: 2, desc: "اربط رقم واتساب أعمالك، والمساعد يرد تلقائي على استفسارات عملائك عن منتجاتك وأسعارك ويرسل لهم رابط الشراء — على مدار الساعة. يحتاج حساب WhatsApp Business API خاص بك من Meta.", descEn: "Connect your WhatsApp Business number, and the assistant automatically answers customer questions about your products and prices and sends them the purchase link — around the clock. Requires your own WhatsApp Business API account from Meta.", status: "متاح الآن", ready: true },
];
