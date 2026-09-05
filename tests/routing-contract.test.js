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
    expect(dashboard).toContain("اكتب 0 للمنتج المجاني");
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

  it("يتيح تنزيل الملف المجاني فقط عبر رابط قصير ولا يفتح الملفات المدفوعة", async () => {
    const productPage = await source("src/ProductPage.jsx");
    const freeDownload = await source("api/free-download.js");
    const protectedDownload = await source("api/download.js");
    const rules = await source("firestore.rules");

    expect(productPage).toContain('href={`/api/free-download?productId=${encodeURIComponent(product.id)}`} target="_blank"');
    expect(productPage).not.toContain('window.location.assign(`/api/free-download?productId=${encodeURIComponent(product.id)}`)');
    expect(productPage).toContain("احصل على المنتج مجانًا");
    expect(freeDownload).toContain('req.method !== "POST" && req.method !== "GET"');
    expect(freeDownload).toContain('res.redirect(302, url)');
    expect(freeDownload).toContain('version: "v4"');
    expect(freeDownload).toContain("responseDisposition");
    expect(freeDownload).toContain("Number(product.price) === 0");
    expect(freeDownload).toContain("product.hidden === false");
    expect(freeDownload).toContain("SIGNED_URL_TTL_MS");
    expect(freeDownload).toContain('from "firebase-admin/app"');
    expect(freeDownload).not.toContain("admin.apps");
    expect(protectedDownload).toContain("from 'firebase-admin/app'");
    expect(protectedDownload).not.toContain("admin.apps");
    expect(rules).toContain("request.resource.data.price >= 0");
    expect(rules).toContain("request.resource.data.type == 'file'");
  });

  it("يحصر طلب التحويل والإيصال والتسليم بين العميل والتاجر ولا يفتح التنزيل قبل التأكيد", async () => {
    const productPage = await source("src/ProductPage.jsx");
    const orderPanel = await source("src/ProductOrderPanel.jsx");
    const purchases = await source("src/Purchases.jsx");
    const orders = await source("src/Orders.jsx");
    const orderApi = await source("api/orders.js");
    const protectedDownload = await source("api/download.js");
    const rules = await source("firestore.rules");
    const storageRules = await source("storage.rules");

    expect(productPage).toContain("<ProductOrderPanel product={product} sellerWhatsapp={store?.whatsapp} />");
    expect(orderPanel).toContain('orderRequest("submit_proof"');
    expect(orderPanel).toContain("payment-proofs/${auth.currentUser.uid}/${order.id}/");
    expect(orderPanel).toContain("nextFile.size >= MAX_PROOF_BYTES");
    expect(orderPanel).toContain("لا يتم تأكيد التحويل تلقائيًا");
    expect(orders).toContain('orderRequest("confirm"');
    expect(orders).toContain("تأكيد استلام المبلغ وفتح التنزيل");
    expect(purchases).toContain('fetch("/api/download"');
    expect(orderApi).toContain('status: "awaiting_seller_confirmation"');
    expect(orderApi).toContain('db.collection("sellers").doc(product.ownerId)');
    expect(orderApi).not.toContain('db.collection("stores").doc(product.ownerId).get()');
    expect(orderApi).toContain("if (order.ownerId !== account.uid)");
    expect(orderApi).toContain('.where("status", "==", "draft")');
    expect(orderApi).toContain('db.collection("unlocks").doc(`${account.uid}_${productId}`)');
    expect(orderApi).toContain("db.runTransaction");
    expect(orderApi).toContain("isAllowedProof({ size, contentType })");
    expect(orderApi).toContain('db.collection("unlocks").doc(`${buyerUid}_${productId}`)');
    expect(orderApi).toContain("transaction.set(unlockRef");
    expect(orderApi).toContain("codesCount: Math.max(0, Number(product.codesCount || 0) - 1)");
    expect(orderApi).toContain('if (order.status === "confirmed")');
    expect(protectedDownload).toContain("responseDisposition");
    expect(rules).toContain("resource.data.buyerUid == request.auth.uid");
    expect(rules).toContain("allow create, update, delete: if false;");
    expect(storageRules).toContain("match /payment-proofs/{buyerUid}/{orderId}/{fileName}");
    expect(storageRules).toContain("merchantCanReadProof(orderId)");
    expect(storageRules).toContain("request.resource.contentType == 'application/pdf'");
    expect(storageRules).toContain("allow update, delete: if false;");
  });

  it("يبقي المنتج المجاني ضمن المتجر الأساسي بعد اختباره دون فتح المنتجات المدفوعة", async () => {
    const landing = await source("src/App.jsx");
    expect(landing).toContain("منتج مجاني وروابط تتبع الزيارات");
  });

  it("ينشئ روابط تتبع يراها مالك المنتج فقط ويحفظ عدد الزيارات في الخادم", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const rules = await source("firestore.rules");
    const tracking = await source("api/track-visit.js");

    expect(dashboard).toContain("روابط التتبع");
    expect(dashboard).toContain('collection(db, "campaignLinks")');
    expect(dashboard).toContain("إنشاء رابط تتبع");
    expect(dashboard.indexOf("const [campaignLinks")).toBeLessThan(dashboard.indexOf("// store design"));
    expect(dashboard.indexOf("const [campaignLinks", dashboard.indexOf("const [campaignLinks") + 1)).toBe(-1);
    expect(rules).toContain("match /campaignLinks/{linkId}");
    expect(rules).toContain("request.resource.data.visits == resource.data.visits");
    expect(tracking).toContain("db.runTransaction");
    expect(tracking).toContain("lastVisitedAt");
    expect(tracking).toContain('from "firebase-admin/app"');
    expect(tracking).not.toContain("admin.apps");
  });

  it("يعرض ملخصًا من عدادات الزيارات الحقيقية دون تسميتها مبيعات", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const catalog = await source("src/subscriptionCatalog.js");

    expect(dashboard).toContain("campaignVisitTotal");
    expect(dashboard).toContain("أكثر رابط تمت زيارته");
    expect(dashboard).toContain("وليست مبيعات أو معلومات عن الزوار");
    expect(catalog).toContain('key: "salesGrowth"');
    expect(catalog).toContain('title: "زيادة المبيعات", price: 1');
  });

  it("يرتب تبويب المنتجات إلى أقسام قابلة للفتح دون إزالة أدوات التاجر", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    expect(dashboard).toContain('<details className="dh-section" open={products.length === 0}>');
    expect(dashboard).toContain("افتح النموذج فقط عندما تكون جاهزًا لإضافة منتج.");
    expect(dashboard).toContain("روابط التتبع");
    expect(dashboard).toContain("حزم المنتجات");
    expect(dashboard).toContain("إنشاء رابط تتبع");
    expect(dashboard).toContain("حفظ الحزمة كمسودة");
  });

  it("يبقي بطاقة المنتج واضحة على الجوال دون تغيير أزرار إدارتها", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("grid-template-columns:repeat(2,minmax(0,1fr))");
    expect(dashboard).toContain("رابط المنتج");
    expect(dashboard).toContain("نسخ الرابط");
    expect(dashboard).toContain('onClick={() => startEdit(p)}');
    expect(dashboard).toContain('onClick={() => toggleHidden(p.id, p.hidden)}');
    expect(dashboard).toContain('onClick={() => toggleFeatured(p.id, !!p.featured)}');
  });

  it("يوحد ترتيب لوحة التاجر الكاملة على الجوال دون تغيير حالة الاشتراك", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const orders = await source("src/Orders.jsx");

    expect(dashboard).toContain("@media (max-width:390px)");
    expect(dashboard).toContain("dh-studio-action.primary,.dh-share-btn.primary");
    expect(dashboard).toContain("dh-subscription-base");
    expect(dashboard).toContain("رابط التتبع");
    expect(dashboard).toContain("نسخ الرابط");
    expect(dashboard).toContain("لا يوجد تحصيل أو تجديد تلقائي الآن");
    expect(orders).toContain(".ord-confirm-btn,.ord-proof-btn,.ord-deliver-btn{width:100%;margin-left:0;min-height:42px}");
  });

  it("يولد مسودة وصف للتاجر من الخادم ولا يحفظها أو ينشرها تلقائيًا", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const aiDescription = await source("api/ai-product-description.js");
    const catalog = await source("src/subscriptionCatalog.js");

    expect(aiDescription).toContain("identitytoolkit.googleapis.com/v1/accounts:lookup");
    expect(aiDescription).toContain("idToken");
    expect(aiDescription).toContain('model: "claude-sonnet-4-6"');
    expect(aiDescription).toContain("لا تخترع محتوى");
    expect(aiDescription).toContain("لا تذكر أو تعد بدفع أو شراء أو تسليم تلقائي");
    expect(dashboard).toContain('fetch("/api/ai-product-description"');
    expect(dashboard).toContain("اكتب لي مسودة وصف");
    expect(dashboard).toContain("استخدم هذه المسودة");
    expect(dashboard).toContain("مسودة فقط");
    expect(catalog).toContain('key: "aiTools"');
    expect(catalog).toContain('status: "متاح الآن", ready: true');
  });

  it("يولد نص إعلان لمالك المنتج فقط ولا ينشره تلقائيًا", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const adCopy = await source("api/ai-ad-copy.js");
    const catalog = await source("src/subscriptionCatalog.js");

    expect(adCopy).toContain("identitytoolkit.googleapis.com/v1/accounts:lookup");
    expect(adCopy).toContain('db.collection("products").doc(productId).get()');
    expect(adCopy).toContain("productSnap.data().ownerId !== uid");
    expect(adCopy).toContain("لا تعد بدفع أو شراء أو تسليم تلقائي");
    expect(dashboard).toContain('fetch("/api/ai-ad-copy"');
    expect(dashboard).toContain("اكتب لي مسودة إعلان");
    expect(dashboard).toContain("لن تُنشر من مُونَة");
    expect(catalog).toContain('key: "aiTools"');
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
    expect(dashboard).toContain("متجر أساسي 3 ر.ع، ثم إضافات قليلة تختارها عند تفعيل الاشتراك.");
    expect(dashboard).toContain("BASE_MONTHLY_PRICE.toFixed(2)");
    expect(dashboard).not.toContain("PACKAGES.map");
    expect(catalog).toContain("export const BASE_MONTHLY_PRICE = 3");
  });

  it("يعرض فقط الإضافات والأسعار المعتمدة ولا يعيد المزايا المؤجلة", async () => {
    const landing = await source("src/App.jsx");
    const catalog = await source("src/subscriptionCatalog.js");

    expect([...catalog.matchAll(/key: "/g)]).toHaveLength(6);
    expect(catalog).toContain('key: "digitalSelling", group: "البيع الرقمي", title: "البيع الرقمي", price: 2');
    expect(catalog).toContain('key: "salesGrowth", group: "زيادة المبيعات", title: "زيادة المبيعات", price: 1');
    expect(catalog).toContain('key: "salesManagement", group: "إدارة المبيعات", title: "إدارة المبيعات", price: 1');
    expect(catalog).toContain('key: "extraProtection", group: "حماية المنتجات", title: "حماية إضافية", price: 0.5');
    expect(catalog).toContain('key: "aiTools", group: "أدوات الذكاء", title: "أدوات الذكاء", price: 1');
    expect(catalog).toContain('key: "customDomain", group: "هوية المتجر", title: "دومين خاص", price: 1');
    expect(catalog).not.toContain('key: "affiliate"');
    expect(catalog).not.toContain('key: "giftCards"');
    expect(catalog).not.toContain('key: "upsell"');
    expect(catalog).not.toContain('key: "aiLaunch"');
    expect(landing).toContain('import { ADD_ON_CATALOG, BASE_MONTHLY_PRICE } from "./subscriptionCatalog.js"');
    expect(landing).toContain("ADD_ON_CATALOG.map((item) =>");
    expect(landing).not.toContain("البيع الرقمي — 2 ر.ع");
  });

  it("يوحد اشتراك لوحة التاجر مع الأسعار المعتمدة دون ادعاء تحصيل قائم", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("متجر أساسي 3 ر.ع، ثم إضافات قليلة تختارها عند تفعيل الاشتراك.");
    expect(dashboard).toContain("الهوية والمنتجات والمشاركة وQR والمنتجات المجانية وتتبع الزيارات.");
    expect(dashboard).toContain("التفعيل لاحقًا");
    expect(dashboard).toContain("هذه الأسعار تشرح خطتك فقط. لا يوجد تحصيل أو تجديد تلقائي الآن.");
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

  it("يحفظ حزم المنتجات كمسودة ويسمح بنشرها وبيعها عبر إثبات التحويل", async () => {
    const dashboard = await source("src/Dashboard.jsx");
    const bundlePage = await source("src/BundlePage.jsx");
    const orderPanel = await source("src/ProductOrderPanel.jsx");
    const orderApi = await source("api/orders.js");
    const rules = await source("firestore.rules");

    expect(dashboard).toContain('collection(db, "bundles")');
    expect(dashboard).toContain("حفظ الحزمة كمسودة");
    expect(dashboard).toContain("تم حفظ الحزمة كمسودة");
    expect(dashboard).toContain("الحزم المحفوظة");
    expect(dashboard).toContain("نشر الحزمة");
    expect(dashboard).toContain("نسخ رابط الحزمة");
    expect(dashboard).toContain("أرشفة الحزمة");
    expect(dashboard).toContain("الحزم المؤرشفة");
    expect(dashboard).toContain("حذف نهائيًا");
    expect(dashboard).toContain("نعم، احذف الحزمة");
    expect(dashboard).toContain("تم حذف الحزمة فقط. منتجاتك بقيت كما هي.");
    expect(dashboard).toContain("hidden: true");
    expect(dashboard).toContain("updateDoc(doc(db, \"bundles\", bundle.id), { hidden: !bundle.hidden })");
    expect(bundlePage).toContain('ProductOrderPanel bundle={bundle}');
    expect(orderPanel).toContain("isBundle");
    expect(orderApi).toContain("createBundleOrder");
    expect(orderApi).toContain("unlockOneProduct");
    expect(rules).toContain("match /bundles/{bundleId}");
    expect(rules).toContain("bundleIsPublic()");
    expect(rules).toContain("request.resource.data.hidden is bool");
  });

  it("لا يسمي بوابة دفع ولا يعد بالدفع أو التسليم قبل إتاحة الخدمة", async () => {
    const landing = await source("src/App.jsx");
    const dashboard = await source("src/Dashboard.jsx");
    const legal = await source("src/LegalPage.jsx");
    const catalog = await source("src/subscriptionCatalog.js");
    const customerAssistant = await source("api/customer-assistant.js");
    const html = await source("index.html");

    expect(landing).toContain("يرفع إثبات التحويل");
    expect(landing).toContain("بعد تأكيد التاجر استلام المبلغ");
    expect(landing).toContain("متجرك الأساسي");
    expect(landing).toContain("إضافات تكبّر مبيعاتك عند التفعيل");
    expect(landing).not.toContain("PACKAGES.map");
    expect(landing).not.toContain("وفّر شهرين");
    expect(landing).not.toContain("وصل الملف للعميل تلقائيًا الآن");
    expect(landing).not.toContain("الملف يوصل العميل فورًا بعد الدفع");
    expect(landing).not.toContain("تدفع الاشتراك الشهري بس");
    expect(landing).not.toContain('<b>فوري</b><span>تسليم الملف</span>');
    expect(landing).not.toContain("ثواني");
    expect(dashboard).toContain("يفتح للعميل بعد أن تؤكد استلام التحويل من تبويب الطلبات");
    expect(dashboard).not.toContain("رابط تحميله يتوفر فقط للمشتري بعد إتمام الدفع");
    expect(dashboard).not.toContain("ادفع واستلم الآن");
    expect(dashboard).not.toContain("ثواني");
    expect(dashboard).not.toContain('>الخصومات</button>');
    expect(dashboard).toContain('>الطلبات</button>');
    expect(legal).not.toContain("ثواني");
    expect(catalog).not.toContain("ثواني");
    expect(catalog).toContain("يتفعل بعد ربط الدفع");
    expect(customerAssistant).not.toContain("دفع تلقائي فوري عبر المنصة");
    expect(html).not.toContain("تسليم الملفات تلقائياً");
    expect(html).not.toContain("بدون عمولة على المبيعات");
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

  it("يقصر إنشاء متجر جديد على دعوة خاصة ولا يكشف سجلات الدعوات للمتصفح", async () => {
    const landing = await source("src/App.jsx");
    const main = await source("src/main.jsx");
    const register = await source("src/Register.jsx");
    const login = await source("src/Login.jsx");
    const dashboard = await source("src/Dashboard.jsx");
    const admin = await source("src/AdminDashboard.jsx");
    const invitePage = await source("src/InviteActivation.jsx");
    const inviteApi = await source("api/merchant-invites.js");
    const rules = await source("firestore.rules");

    expect(main).toContain('lazy(() => import("./InviteActivation.jsx"))');
    expect(main).toContain('hash.startsWith("invite/")');
    expect(landing).toContain("START_STORE_URL");
    expect(landing).toContain("افتح متجرك الحين");
    expect(landing).not.toContain('href="#register"');
    expect(register).toContain("التسجيل بدعوة خاصة");
    expect(register).not.toContain("createUserWithEmailAndPassword");
    expect(login).toContain("اطلب رابط دعوة خاص من صاحب مُونة.");
    expect(login).not.toContain("أنشئ حساب بائع");
    expect(admin).toContain("سجّل دخولك أولًا");
    expect(admin).toContain("دخلت بحساب غير حساب المالك");
    expect(admin).toContain("سجل خروج ثم ادخل بحساب المالك.");
    expect(dashboard).not.toContain("ensureSellerProfile");
    expect(dashboard).toContain("ما عندك دعوة مفعّلة");
    expect(admin).toContain("دعوات التجار");
    expect(admin).toContain("إنشاء رابط دعوة");
    expect(invitePage).toContain('inviteRequest("inspect", { token })');
    expect(invitePage).toContain('inviteRequest("activate", { token }, idToken)');
    expect(inviteApi).toContain("randomBytes(32)");
    expect(inviteApi).toContain('createHash("sha256")');
    expect(inviteApi).toContain("const INVITE_TTL_MS = 72 * 60 * 60 * 1000");
    expect(inviteApi).toContain('status: "accepted"');
    expect(inviteApi).toContain('currentInvite.status !== "pending" || isExpired(currentInvite)');
    expect(inviteApi).toContain('if (snapshot.data().status !== "pending")');
    expect(inviteApi).toContain('status: "revoked"');
    expect(inviteApi).toContain("requireOwner");
    expect(inviteApi).toContain('where("email", "==", account.email).limit(1).get()');
    expect(inviteApi).toContain("هذا البريد لديه متجر مفعّل بالفعل.");
    expect(rules).toContain("match /merchantInvites/{inviteId}");
    expect(rules).toContain("allow create: if false;");
    expect(rules).toContain("allow read, write: if false;");
  });

  it("يسمح للتاجر يسجّل متجره بنفسه ويفعّل اشتراكه ببطاقة أو تحويل يدوي", async () => {
    const main = await source("src/main.jsx");
    const landing = await source("src/App.jsx");
    const startStore = await source("src/StartStore.jsx");
    const storePayResult = await source("src/StorePayResult.jsx");
    const signupApi = await source("api/merchant-signup.js");
    const tapClient = await source("api/tap-client.js");
    const orderApi = await source("api/orders.js");
    const admin = await source("src/AdminDashboard.jsx");
    const storageRules = await source("storage.rules");

    expect(main).toContain('lazy(() => import("./StartStore.jsx"))');
    expect(main).toContain('hash === "start-store"');
    expect(main).toContain('hash.startsWith("store-pay-result/")');
    expect(landing).toContain('href={START_STORE_URL}');

    expect(startStore).toContain('signupRequest("register"');
    expect(startStore).toContain('signupRequest("create_card_charge"');
    expect(startStore).toContain('signupRequest("submit_manual_proof"');
    expect(startStore).toContain("merchant-subscription-proofs/${auth.currentUser.uid}/");
    expect(storePayResult).toContain('action: "verify_card_charge"');

    expect(signupApi).toContain("const MONTHLY_PLAN_PRICE = 5");
    expect(signupApi).toContain('if (sellerSnap.exists) return res.status(409)');
    expect(signupApi).toContain("charge.status !== \"CAPTURED\"");
    expect(signupApi).toContain("async function activateSeller(uid, request)");
    expect(signupApi).toContain("subscriptionExpiresAt: isoDate(new Date(Date.now() + SUBSCRIPTION_PERIOD_MS))");
    expect(signupApi).toContain("requireOwner");

    expect(tapClient).toContain("export async function tapRequest");
    expect(orderApi).toContain('import { tapRequest as tapRequestRaw, splitPhoneForTap } from "./tap-client.js"');

    expect(admin).toContain("طلبات اشتراك جديدة");
    expect(admin).toContain('signupRequest("admin_approve"');
    expect(admin).toContain('signupRequest("admin_reject"');
    expect(admin).toContain('signupRequest("admin_save_instructions"');

    expect(storageRules).toContain("match /merchant-subscription-proofs/{uid}/{fileName}");
    expect(storageRules).toContain("uid == request.auth.uid");
  });
});
