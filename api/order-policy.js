export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PROOF_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export function isAllowedProof({ size, contentType }) {
  return Number.isFinite(size)
    && size > 0
    && size < MAX_PROOF_BYTES
    && ACCEPTED_PROOF_TYPES.has(String(contentType || "").toLowerCase());
}

export function hasActiveBuyerOrder(orders, productId) {
  return orders.some((order) => order.productId === productId
    && ["draft", "awaiting_seller_confirmation", "confirmed"].includes(order.status));
}

export function canSellerConfirmOrder(order, sellerUid) {
  return Boolean(order)
    && order.ownerId === sellerUid
    && order.status === "awaiting_seller_confirmation"
    && Boolean(order.proofPath);
}
