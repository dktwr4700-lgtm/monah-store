import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, projectRoot), "utf8");
}

describe("عقود المسارات العامة في مُونَة", () => {
  it("يحمّل صفحة المنتج الفعلية عند فتح رابط المنتج", async () => {
    const main = await source("src/main.jsx");
    const productPage = await source("src/ProductPage.jsx");

    expect(main).toContain('lazy(() => import("./ProductPage.jsx"))');
    expect(main).toContain('hash.startsWith("product/")');
    expect(main).toContain("<ProductPage productId={hash.split(\"/\")[1]} />");
    expect(productPage).toContain('getDoc(doc(db, "products", productId))');
    expect(productPage).toContain('setStatus("missing")');
    expect(productPage).toContain("navigator.share");
  });

  it("يطلب المنتجات المنشورة وغير الموقوفة للزوار", async () => {
    const store = await source("src/StorePage.jsx");
    const productPage = await source("src/ProductPage.jsx");

    expect(store).toContain('where("hidden", "==", false)');
    expect(store).toContain('where("suspended", "==", false)');
    expect(productPage).toContain("productData.hidden || productData.suspended");
  });

  it("يحافظ على إنشاء المنتج مخفيًا حتى يكتمل رفع ملفه", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("hidden: true");
    expect(dashboard).toContain("suspended: false");
    expect(dashboard).toContain("await updateDoc(doc(db, \"products\", productRef.id), { hidden: !publish })");
    expect(dashboard).toContain("سعرًا صحيحًا أكبر من صفر");
  });

  it("لا يعرض تفاصيل الخطأ الداخلية للبائع", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("تعذّر فتح لوحة التحكم الآن");
    expect(dashboard).not.toContain("[تشخيص مؤقت]");
    expect(dashboard).not.toContain("this.state.error && this.state.error.stack");
  });

  it("يتحقق من هوية البائع وباقته على الخادم قبل تشغيل مساعد النمو", async () => {
    const assistant = await source("api/growth-assistant.js");
    const assistantClient = await source("src/GrowthAssistant.jsx");

    expect(assistant).toContain("verifyIdToken(idToken)");
    expect(assistant).toContain('sellerSnap.data().plan !== REQUIRED_PLAN');
    expect(assistant).toContain('db.collection("products").where("ownerId", "==", decoded.uid)');
    expect(assistant).not.toContain("storeData.plan !== REQUIRED_PLAN");
    expect(assistantClient).toContain("Authorization: `Bearer ${idToken}`");
    expect(assistantClient).not.toContain("storeData: storeData || {}");
  });

  it("يحضّر قواعد تمنع تعديل منتجات الآخرين وتصاريح التنزيل من المتصفح", async () => {
    const rules = await source("firestore.rules");
    const storageRules = await source("storage.rules");

    expect(rules).toContain("request.resource.data.ownerId == request.auth.uid");
    expect(rules).toContain("request.resource.data.suspended == false");
    expect(rules).toContain("match /unlocks/{unlockId}");
    expect(rules).toContain("allow list, create, update, delete: if false;");
    expect(rules).toContain("match /shared/{docId} { allow read, write: if false; }");
    expect(storageRules).toContain("request.resource.contentType.matches('image/.*')");
    expect(storageRules).toContain("allow update, delete: if false;");
  });

  it("يطلب للمتجر العام المنتجات المنشورة وغير الموقوفة فقط", async () => {
    const store = await source("src/StorePage.jsx");
    const dashboard = await source("src/Dashboard.jsx");

    expect(store).toContain('where("hidden", "==", false)');
    expect(store).toContain('where("suspended", "==", false)');
    expect(dashboard).not.toContain("payoutInfo:");
    expect(dashboard).not.toContain("payoutWhatsapp:");
  });

  it("يجهّز فهرسًا وترحيلًا آمنين قبل تفعيل الاستعلام المحمي على المنتجات القديمة", async () => {
    const indexes = await source("firestore.indexes.json");
    const migration = await source("scripts/migrate-product-visibility.mjs");
    const payoutMigration = await source("scripts/remove-public-payout-fields.mjs");

    expect(indexes).toContain('"fieldPath": "suspended"');
    expect(migration).toContain('suspended: false');
    expect(migration).toContain('FIREBASE_SERVICE_ACCOUNT_KEY');
    expect(payoutMigration).toContain("FieldValue.delete()");
    expect(payoutMigration).toContain("payoutWhatsapp");
  });

  it("يعرض هوية التاجر ومشاركة المتجر دون إعادة شعار مُونَة في الواجهة العامة", async () => {
    const store = await source("src/StorePage.jsx");
    const product = await source("src/ProductPage.jsx");
    const dashboard = await source("src/Dashboard.jsx");

    expect(store).toContain("navigator.share");
    expect(store).toContain("مدعوم من مُونَة");
    expect(product).toContain("مدعوم من مُونَة");
    expect(product).toContain("text: `شاهد ${name} من ${storeName}`");
    expect(dashboard).toContain("function shareStore()");
    expect(dashboard).toContain("اختر مظهر متجرك");
  });

  it("يشرح الاشتراك المرن دون ادعاء شعبية غير موثق", async () => {
    const landing = await source("src/App.jsx");
    const dashboard = await source("src/Dashboard.jsx");
    const catalog = await source("src/subscriptionCatalog.js");

    expect(landing).toContain("اشتراك مرن");
    expect(landing).toContain("متجرك الأساسي");
    expect(landing).not.toContain("الأكثر طلبًا");
    expect(dashboard).toContain("اشتراك متجرك");
    expect(dashboard).toContain("تبني اشتراكك بنفسك");
    expect(dashboard).toContain("BASE_MONTHLY_PRICE.toFixed(2)");
    expect(dashboard).not.toContain("PACKAGES.map");
    expect(catalog).toContain("export const BASE_MONTHLY_PRICE = 3");
  });

  it("يعرض أدوات التاجر المهمة مباشرة داخل لوحة التحكم", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("مساحتك الخاصة");
    expect(dashboard).toContain("مركز مشاركة المتجر");
    expect(dashboard).toContain("حالة منتجاتك");
    expect(dashboard).toContain("مظهر {selectedStoreStyle.name}");
    expect(dashboard).toContain("واتساب");
  });

  it("يوفر أدوات QR وتثبيت وترتيب المنتجات وأسئلة المتجر بهوية التاجر", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const store = await source("src/StorePage.jsx");
    const product = await source("src/ProductPage.jsx");
    const rules = await source("firestore.rules");

    expect(dashboard).toContain("QRCodeSVG");
    expect(dashboard).toContain("رمز متجرك");
    expect(dashboard).toContain("toggleFeatured");
    expect(dashboard).toContain("moveProduct");
    expect(dashboard).toContain("أسئلة وأجوبة للزائر");
    expect(store).toContain("اختيارات التاجر");
    expect(store).toContain("أسئلة شائعة");
    expect(product).toContain("منتجات أخرى من {storeName}");
    expect(product).toContain("أسئلة عن المتجر");
    expect(rules).toContain("'featured', 'sortOrder'");
    expect(rules).toContain("'coverUrl', 'about', 'faqs', 'updatedAt'");
  });

  it("يحفظ تصميم المتجر بالدمج حتى لا تتعطل المتاجر التي لديها حقول قديمة", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("}, { merge: true });");
  });

  it("يحفظ حزم المنتجات مقفلة ويمنع ظهورها أو شرائها قبل الدفع", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const store = await source("src/StorePage.jsx");
    const rules = await source("firestore.rules");

    expect(dashboard).toContain('collection(db, "bundles")');
    expect(dashboard).toContain("حفظ الحزمة مقفلة");
    expect(dashboard).toContain("تم حفظ الحزمة وهي مقفلة الآن");
    expect(dashboard).toContain("الحزم المحفوظة");
    expect(dashboard).toContain("إخفاء الحزمة");
    expect(dashboard).toContain("الحزم المخفية");
    expect(dashboard).toContain("حذف نهائيًا");
    expect(dashboard).toContain("نعم، احذف الحزمة");
    expect(dashboard).toContain("تم حذف الحزمة فقط. منتجاتك بقيت كما هي.");
    expect(dashboard).toContain("hidden: true");
    expect(dashboard).toContain("لن تظهر للزوار أو تسمح بالشراء قبل الدفع");
    expect(store).not.toContain('collection(db, "bundles")');
    expect(rules).toContain("match /bundles/{bundleId}");
    expect(rules).toContain("request.resource.data.hidden == true");
    expect(rules).toContain("request.resource.data.archived is bool");
  });

  it("لا يعد بالدفع أو التسليم التلقائي قبل ربط ثواني واختبار الشراء", async () => {
    const landing = await source("src/App.jsx");
    const dashboard = await source("src/Dashboard.jsx");

    expect(landing).toContain("الدفع والتسليم يفعّلان بعد ربط ثواني واختبارهما");
    expect(landing).toContain("الدفع والتسليم قيد التجهيز");
    expect(landing).toContain("لا يوجد تحصيل اشتراك حاليًا قبل ربط ثواني واختباره");
    expect(landing).toContain("قيد التجهيز");
    expect(landing).toContain("متجرك الأساسي");
    expect(landing).toContain("إضافات يختارها التاجر بعد ربط ثواني");
    expect(landing).not.toContain("PACKAGES.map");
    expect(landing).not.toContain("وفّر شهرين");
    expect(landing).not.toContain("وصل الملف للعميل تلقائيًا الآن");
    expect(landing).not.toContain("الملف يوصل العميل فورًا بعد الدفع");
    expect(landing).not.toContain("تدفع الاشتراك الشهري بس");
    expect(landing).toContain("بعد الربط");
    expect(landing).toContain("قيد التجهيز");
    expect(landing).not.toContain('<b>فوري</b><span>تسليم الملف</span>');
    expect(dashboard).toContain("رابط تنزيل المشتري يُفعّل بعد ربط ثواني واختبار عملية دفع حقيقية");
    expect(dashboard).not.toContain("رابط تحميله يتوفر فقط للمشتري بعد إتمام الدفع");
    expect(dashboard).toContain("الدفع والتسليم بعد ربط ثواني");
    expect(dashboard).not.toContain("ادفع واستلم الآن");
  });
});
