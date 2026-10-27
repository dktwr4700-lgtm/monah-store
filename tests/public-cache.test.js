import { describe, it, expect } from "vitest";
import { rememberStore, recallStore, recallProduct, rememberProduct } from "../src/publicCache.js";

describe("ذاكرة الصفحات العامة", () => {
  it("المتجر ينحفظ بالرابط والمعرف والاسم المختصر ومنتجاته تنفتح على طول", () => {
    const products = [{ id: "p1", name: "أ" }, { id: "p2", name: "ب" }];
    rememberStore(["fnx", "uid1", "fnx"], { store: { name: "FNX" }, ownerId: "uid1", products });
    expect(recallStore("fnx").products).toHaveLength(2);
    expect(recallStore("uid1").store.name).toBe("FNX");
    expect(recallProduct("p2")).toMatchObject({ product: { name: "ب" }, store: { name: "FNX" } });
    expect(recallProduct("p2").siblings).toHaveLength(2);
    expect(recallStore("none")).toBe(null);
  });
  it("تحديث المنتج يحافظ على المنتجات الثانية", () => {
    rememberProduct({ id: "p1", name: "أ جديد" }, { name: "FNX" });
    expect(recallProduct("p1").product.name).toBe("أ جديد");
    expect(recallProduct("p1").siblings).toHaveLength(2);
  });
});
