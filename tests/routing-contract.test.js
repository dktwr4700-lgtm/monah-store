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

  it("لا يعرض المنتجات المخفية أو الموقوفة للزوار", async () => {
    const store = await source("src/StorePage.jsx");
    const productPage = await source("src/ProductPage.jsx");

    expect(store).toContain("!product.hidden && !product.suspended");
    expect(productPage).toContain("productData.hidden || productData.suspended");
  });

  it("يحافظ على إنشاء المنتج مخفيًا حتى يكتمل رفع ملفه", async () => {
    const dashboard = await source("src/Dashboard.jsx");

    expect(dashboard).toContain("hidden: true");
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
});
