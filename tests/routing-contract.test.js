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

  it("يعرض اشتراكًا مرنًا قبل التسجيل دون ادعاء شعبية غير موثق", async () => {
    const landing = await source("src/App.jsx");
    const dashboard = await source("src/Dashboard.jsx");
    const catalog = await source("src/subscriptionCatalog.js");

    expect(landing).toContain("ابنِ اشتراكك بنفسك");
    expect(catalog).toContain("BASE_MONTHLY_PRICE = 3");
    expect(dashboard).toContain("متجر أساسي + مزايا تختارها");
    expect(landing).not.toContain("الأكثر طلبًا");
    expect(dashboard).not.toContain("الأكثر طلبًا");
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
    expect(rules).toContain("'coverUrl', 'about', 'faqs', 'featureSelections'");
  });

  it("يعرض لوحة اشتراك مرنة بعد التسجيل ولا يعيد الباقات الثابتة أو خيارات مزايا مدفوعة", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("مزايا اشتراكك");
    expect(dashboard).toContain("متجر أساسي + مزايا تختارها");
    expect(dashboard).toContain("لا يوجد تحصيل الآن");
    expect(dashboard).toContain("كوبونات الخصم ضمن اشتراكك");
    expect(dashboard).not.toContain("شوف الباقات");
    expect(dashboard).not.toContain("ادفع واستلم الآن");
  });

  it("يكبر رمز QR ويتيح فتح رابط المتجر للتحقق منه", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("setQrOpen(true)");
    expect(dashboard).toContain("تكبير QR");
    expect(dashboard).toContain('aria-label="رمز QR للمتجر"');
    expect(dashboard).toContain("افتح الرابط للاختبار");
    expect(dashboard).toContain('level="H"');
    expect(dashboard).toContain("https://www.monah-app.com/#store/");
  });

  it("يحفظ تصميم المتجر بالدمج حتى لا تتعطل المتاجر التي لديها حقول قديمة", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("}, { merge: true });");
  });

  it("يحفظ التاجر اختيارات مزايا الدفعة الأولى فقط في متجره وبحالة صريحة", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const rules = await source("firestore.rules");

    expect(dashboard).toContain("ADD_ON_CATALOG");
    expect(dashboard).toContain("handleSaveFeatureSelections");
    expect(dashboard).toContain("featureSelectionUpdatedAt");
    expect(dashboard).toContain("copyCampaignLink");
    expect(rules).toContain("'featureSelections'");
    expect(rules).toContain("'featureSelectionUpdatedAt'");
  });

  it("يعرض معاينة المنتج وصفحة البيع فقط عند اختيار التاجر ولا يدّعي تفعيل الدفع", async () => {
    const product = await source("src/ProductPage.jsx");
    const landing = await source("src/App.jsx");
    const dashboard = await source("src/Dashboard.jsx");

    expect(product).toContain("smartSalesPageEnabled");
    expect(product).toContain("productPreviewEnabled");
    expect(product).toContain("ملف المنتج الكامل لا يظهر في صفحة المتجر");
    expect(landing).toContain("لا يوجد تحصيل الآن");
    expect(landing).not.toContain("وصل الملف للعميل تلقائيًا الآن");
    expect(dashboard).toContain("تنزيل المشتري برابط مؤقت يفعّل بعد ربط الدفع");
  });

  it("يجمع السعر قبل التسجيل ويحفظ مسودة الاختيارات مع الحساب من دون تحصيل", async () => {
    const landing = await source("src/App.jsx");
    const register = await source("src/Register.jsx");
    const catalog = await source("src/subscriptionCatalog.js");

    expect(catalog).toContain("BASE_MONTHLY_PRICE = 3");
    expect(catalog).toContain('key: "coupons"');
    expect(landing).toContain("monah.subscriptionDraft");
    expect(landing).toContain("ابنِ اشتراكك بنفسك");
    expect(register).toContain("readSubscriptionDraft");
    expect(register).toContain("featureSelections: Object.fromEntries");
    expect(register).toContain("لا يوجد دفع أو تحصيل حتى يجهز ربط ثواني");
  });

  it("يفصل الرابط المباشر العامل عن تتبع الحملات وحزم المنتجات المقفلة", async () => {
    const catalog = await source("src/subscriptionCatalog.js");
    const dashboard = await source("src/Dashboard.jsx");
    const rules = await source("firestore.rules");

    expect(catalog).toContain('key: "directSalesLinks"');
    expect(catalog).toContain('key: "campaignTracking"');
    expect(catalog).toContain('key: "bundles"');
    expect(catalog).toContain('status: "بعد ثواني", ready: false');
    expect(dashboard).toContain("حزم المنتجات");
    expect(dashboard).toContain("حفظ الحزمة مقفلة");
    expect(dashboard).toContain('collection(db, "bundles")');
    expect(dashboard).toContain("setBundleSaved(true)");
    expect(dashboard).toContain("تم حفظ الحزمة وهي مقفلة الآن");
    expect(dashboard).toContain("الحزم المحفوظة");
    expect(rules).toContain("match /bundles/{bundleId}");
    expect(rules).toContain("request.resource.data.hidden == true");
  });

  it("يسجل اهتمام الإطلاق القادم ويحمي البريد لصاحب المنتج فقط", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const product = await source("src/ProductPage.jsx");
    const rules = await source("firestore.rules");

    expect(dashboard).toContain('setProductMode("launch")');
    expect(dashboard).toContain("launchInterests");
    expect(dashboard).toContain("إطلاق منتج قادم");
    expect(dashboard).toContain('productMode === "launch" ? null');
    expect(dashboard).toContain('productMode !== "launch" && <div className="dh-field">');
    expect(dashboard).toContain('} else if (!isLaunch) {');
    expect(dashboard).toContain('!isLaunch && productType === "code" ? codesList.length : 0');
    expect(dashboard).toContain("copyInterestEmail");
    expect(dashboard).toContain("نسخ البريد");
    expect(product).toContain("registerInterest");
    expect(product).toContain('doc(db, "products", product.id, "interests"');
    expect(product).toContain("إطلاق منتج قادم");
    expect(rules).toContain("match /interests/{interestId}");
    expect(rules).toContain("allow get, list: if ownsProduct(productId) || isAdmin();");
    expect(rules).toContain("allow update, delete: if false;");
  });
});
