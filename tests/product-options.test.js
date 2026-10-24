import { describe, it, expect } from "vitest";
import { cleanOptions, startingPrice, pickOption, hasOptions, cleanAnswer, cleanAskLabel, SELLABLE_TYPES } from "../lib/product-options.js";

describe("خيارات المنتج", () => {
  it("ينظف الخيارات ويشيل الناقصة ويعطي كل واحد رقم ثابت", () => {
    const out = cleanOptions([
      { name: " 800 فيبوكس ", price: "2.5" },
      { name: "", price: 3 },
      { name: "2400 فيبوكس", price: 0 },
      { name: "4500 فيبوكس", price: 8.5 },
    ]);
    expect(out).toEqual([{ id: "o1", name: "800 فيبوكس", price: 2.5 }, { id: "o2", name: "4500 فيبوكس", price: 8.5 }]);
  });

  it("خيار واحد بس معناه المنتج بسعر واحد", () => {
    expect(cleanOptions([{ name: "واحد", price: 2 }])).toEqual([]);
    expect(cleanOptions(null)).toEqual([]);
  });

  it("يحافظ على أرقام الخيارات القديمة لما التاجر يعدل عشان الطلبات المفتوحة ما تضيع", () => {
    const out = cleanOptions([{ id: "o3", name: "أ", price: 1 }, { id: "o3", name: "ب", price: 2 }, { name: "ج", price: 3 }]);
    const ids = out.map((o) => o.id);
    expect(ids[0]).toBe("o3");
    expect(new Set(ids).size).toBe(3);
  });

  it("ما يسمح بأكثر من 12 خيار ولا اسم طويل", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ name: `خيار ${i}`.repeat(10), price: i + 1 }));
    const out = cleanOptions(many);
    expect(out).toHaveLength(12);
    expect(out[0].name.length).toBeLessThanOrEqual(40);
  });

  it("السعر في المتجر هو أرخص خيار والسعر وقت الطلب من الخيار اللي اختاره المشتري", () => {
    const product = { options: cleanOptions([{ name: "أ", price: 5.5 }, { name: "ب", price: 2.5 }]) };
    expect(startingPrice(product.options)).toBe(2.5);
    expect(hasOptions(product)).toBe(true);
    expect(pickOption(product, "o1").price).toBe(5.5);
    expect(pickOption(product, "o9")).toBe(null);
    expect(pickOption({ price: 3 }, "o1")).toBe(null);
  });

  it("سؤال المشتري وجوابه ينقصون ويتنظفون", () => {
    expect(cleanAskLabel("  اسم   حسابك  ")).toBe("اسم حسابك");
    expect(cleanAnswer("x".repeat(500))).toHaveLength(120);
    expect(SELLABLE_TYPES).toContain("service");
  });
});

describe("الأرقام العربية", () => {
  it("السعر المكتوب بأرقام عربية من كيبورد الجوال ينقبل", () => {
    const out = cleanOptions([{ name: "أ", price: "٢٫٥" }, { name: "ب", price: "5,5" }]);
    expect(out.map((o) => o.price)).toEqual([2.5, 5.5]);
  });
});
