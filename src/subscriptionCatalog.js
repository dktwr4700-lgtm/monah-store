export const BASE_MONTHLY_PRICE = 3;

export const ADD_ON_CATALOG = [
  { key: "digitalSelling", group: "البيع الرقمي", title: "البيع الرقمي", price: 2, desc: "الدفع الإلكتروني والتنزيل الآمن بعد تأكيد الدفع.", status: "يتفعل بعد ربط الدفع", ready: false },
  { key: "salesGrowth", group: "زيادة المبيعات", title: "زيادة المبيعات", price: 1, desc: "بيع الحزم وكوبونات الخصم في مكان واحد.", status: "يتفعل بعد ربط الدفع", ready: false },
  { key: "salesManagement", group: "إدارة المبيعات", title: "إدارة المبيعات", price: 1, desc: "لوحة مبيعات وسجل مشتريات وفاتورة أو إيصال بسيط.", status: "يتفعل بعد ربط الدفع", ready: false },
  { key: "extraProtection", group: "حماية المنتجات", title: "حماية إضافية", price: 0.5, desc: "تحديد عدد مرات تنزيل الملف للمشتري بعد الشراء.", status: "يتفعل بعد ربط الدفع", ready: false },
  { key: "aiTools", group: "أدوات الذكاء", title: "أدوات الذكاء", price: 1, desc: "مسودة وصف المنتج ومسودة نص الإعلان؛ التاجر يراجعها بنفسه.", status: "متاح الآن", ready: true },
  { key: "customDomain", group: "هوية المتجر", title: "دومين خاص", price: 1, desc: "ربط دومين يملكه التاجر بمتجره بعد إثبات الملكية.", status: "ينتظر اختبار دومين حقيقي", ready: false },
];
