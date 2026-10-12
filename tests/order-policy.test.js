import { describe, expect, it } from "vitest";
import { MAX_PROOF_BYTES, canSellerConfirmOrder, isAllowedProof } from "../lib/order-policy.js";

describe("سياسة طلب التحويل", () => {
  it("تقبل إثباتًا مصورًا أو PDF فقط وبحجم أقل من الحد", () => {
    expect(isAllowedProof({ size: 1024, contentType: "image/png" })).toBe(true);
    expect(isAllowedProof({ size: 1024, contentType: "application/pdf" })).toBe(true);
    expect(isAllowedProof({ size: MAX_PROOF_BYTES, contentType: "image/jpeg" })).toBe(false);
    expect(isAllowedProof({ size: 500, contentType: "application/zip" })).toBe(false);
  });

  it("يقصر فتح التنزيل على صاحب الطلب بعد وصول إثبات التحويل", () => {
    const readyOrder = { ownerId: "seller-1", status: "awaiting_seller_confirmation", proofPath: "payment-proofs/buyer-1/order-1/receipt.png" };
    expect(canSellerConfirmOrder(readyOrder, "seller-1")).toBe(true);
    expect(canSellerConfirmOrder(readyOrder, "seller-2")).toBe(false);
    expect(canSellerConfirmOrder({ ...readyOrder, proofPath: "" }, "seller-1")).toBe(false);
    expect(canSellerConfirmOrder({ ...readyOrder, status: "draft" }, "seller-1")).toBe(false);
  });
});

describe("مسودة الطلب تتبع سعر المنتج الحالي", () => {
  it("تتحدث المسودة لو تغيّر سعر المنتج، عشان البطاقة ما تنشحن بالسعر القديم", async () => {
    const { readFile } = await import("node:fs/promises");
    const orders = await readFile(new URL("../api/orders.js", import.meta.url), "utf8");
    expect(orders).toContain('Number(existing.price) !== finalPrice || Number(existing.originalPrice) !== originalPrice');
  });
});

describe("رقم وإيميل العميل إجباريين ويظهرون للتاجر", () => {
  it("السيرفر يرفض الطلب بدون إيميل، وصفحة الطلبات تعرضه", async () => {
    const { readFile } = await import("node:fs/promises");
    const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");
    const orders = await read("api/orders.js");
    expect(orders).not.toContain("if (buyerEmail && !EMAIL_PATTERN.test(buyerEmail))");
    expect(orders.match(/if \(!EMAIL_PATTERN\.test\(buyerEmail\)\)/g)).toHaveLength(2);
    const panel = await read("src/ProductOrderPanel.jsx");
    expect(panel).toContain(`emailLabel: "إيميلك"`);
    const list = await read("src/Orders.jsx");
    expect(list).toContain("mailto:${order.buyerEmail}");
  });
});
