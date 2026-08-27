import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

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

  it("يبقي مساعد النمو غير متاح حتى تكتمل صلاحياته وتفعيله", async () => {
    const assistant = await source("api/growth-assistant.js");

    expect(assistant).toContain("مساعد النمو غير متاح حاليًا");
    expect(assistant).toContain("res.status(503)");
    expect(assistant).not.toContain("firebase-admin");
    expect(assistant).not.toContain("api.anthropic.com");
  });

  it("يرفض مسار مساعد النمو أي طلب حتى يكتمل التفعيل", async () => {
    const { default: handler } = await import(new URL("../api/growth-assistant.js", import.meta.url).href);
    const response = {
      setHeader: vi.fn(),
      status: vi.fn(),
      json: vi.fn(),
    };
    response.status.mockReturnValue(response);

    handler({ method: "POST" }, response);

    expect(response.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ error: "مساعد النمو غير متاح حاليًا. سيتاح بعد اكتمال تفعيله واختباره." }));
  });

  it("يضيف رؤوس حماية الاستضافة دون تقييد خدمات المتجر الأساسية", async () => {
    const vercel = await source("vercel.json");

    expect(vercel).toContain('"X-Content-Type-Options"');
    expect(vercel).toContain('"X-Frame-Options"');
    expect(vercel).toContain('"Referrer-Policy"');
    expect(vercel).toContain('"Permissions-Policy"');
    expect(vercel).toContain('"Cross-Origin-Opener-Policy"');
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

  it("لا يسمي بوابة دفع ولا يعد بالدفع أو التسليم قبل إتاحة الخدمة", async () => {
    const landing = await source("src/App.jsx");
    const dashboard = await source("src/Dashboard.jsx");
    const legal = await source("src/LegalPage.jsx");
    const catalog = await source("src/subscriptionCatalog.js");
    const customerAssistant = await source("api/customer-assistant.js");

    expect(landing).toContain("خيارات البيع الإلكتروني عند تفعيلها");
    expect(landing).toContain("البيع الإلكتروني قيد التفعيل");
    expect(landing).toContain("متجرك الأساسي");
    expect(landing).toContain("إضافات يختارها التاجر عند التفعيل");
    expect(landing).not.toContain("PACKAGES.map");
    expect(landing).not.toContain("وفّر شهرين");
    expect(landing).not.toContain("وصل الملف للعميل تلقائيًا الآن");
    expect(landing).not.toContain("الملف يوصل العميل فورًا بعد الدفع");
    expect(landing).not.toContain("تدفع الاشتراك الشهري بس");
    expect(landing).not.toContain('<b>فوري</b><span>تسليم الملف</span>');
    expect(landing).not.toContain("ثواني");
    expect(dashboard).toContain("وصول العميل للملف يُتاح عند تفعيل البيع الإلكتروني");
    expect(dashboard).not.toContain("رابط تحميله يتوفر فقط للمشتري بعد إتمام الدفع");
    expect(dashboard).not.toContain("ادفع واستلم الآن");
    expect(dashboard).not.toContain("ثواني");
    expect(dashboard).not.toContain('>الخصومات</button>');
    expect(dashboard).not.toContain('>الطلبات</button>');
    expect(legal).not.toContain("ثواني");
    expect(catalog).not.toContain("ثواني");
    expect(catalog).toContain("مجهز للتجربة");
    expect(customerAssistant).not.toContain("دفع تلقائي فوري عبر المنصة");
  });

  it("يجعل نصوص الشروط والخصوصية صادقة قبل تفعيل الدفع", async () => {
    const legal = await source("src/LegalPage.jsx");

    expect(legal).toContain("استخدام المنصة");
    expect(legal).toContain("لا تطلب مُونَة بيانات بطاقات أو حسابات دفع");
    expect(legal).toContain("يظهر للعميل داخل المنصة ما إذا كانت خيارات الشراء");
    expect(legal).toContain("يبدأ الاشتراك المرن بمتجر أساسي بسعر 3 ر.ع");
    expect(legal).toContain("لا تظهر الحزمة للزوار");
    expect(legal).not.toContain("اشتراك شهري أو سنوي");
    expect(legal).not.toContain("يُجدد تلقائيًا");
    expect(legal).not.toContain("تُسلّم فورًا");
  });
});
