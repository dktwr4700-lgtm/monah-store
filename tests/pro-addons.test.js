import { describe, it, expect } from "vitest";
import { ADD_ON_CATALOG, effectiveAddOns, planIncludesAddOn, addOnsCostForPlan } from "../src/subscriptionCatalog.js";

describe("باقة برو تشمل كل الإضافات", () => {
  const paid = ADD_ON_CATALOG.filter((a) => a.price > 0).map((a) => a.key);

  it("برو: كل الإضافات المدفوعة شغالة وما ينحسب عليها شي", () => {
    expect(effectiveAddOns("pro", [])).toEqual(expect.arrayContaining(paid));
    expect(addOnsCostForPlan("pro", paid)).toBe(0);
    for (const key of paid) expect(planIncludesAddOn("pro", key)).toBe(true);
  });

  it("البيع الرقمي يبقى اختياري حتى في برو (يحتاج بوابة دفع)", () => {
    expect(planIncludesAddOn("pro", "digitalSelling")).toBe(false);
    expect(effectiveAddOns("pro", [])).not.toContain("digitalSelling");
    expect(effectiveAddOns("pro", ["digitalSelling"])).toContain("digitalSelling");
  });

  it("الأساسية: بس اللي فعّلها، وكل إضافة بسعرها", () => {
    expect(effectiveAddOns("basic", ["aiTools"])).toEqual(["aiTools"]);
    expect(addOnsCostForPlan("basic", ["aiTools", "whatsappAssistant"])).toBe(3);
    expect(planIncludesAddOn("basic", "aiTools")).toBe(false);
  });
});
