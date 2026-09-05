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
