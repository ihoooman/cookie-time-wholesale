"use client";

import { ShoppingBag } from "lucide-react";

export function ProductCta({ productId, productName, stockQty }: {
  productId: string;
  productName: string;
  stockQty: number;
}) {
  function addAndContinue() {
    try {
      const saved = localStorage.getItem("cookie-time-cart");
      const cart = saved ? JSON.parse(saved) as Record<string, number> : {};
      cart[productId] = Math.min(stockQty, (cart[productId] ?? 0) + 1);
      localStorage.setItem("cookie-time-cart", JSON.stringify(cart));
    } catch {
      localStorage.removeItem("cookie-time-cart");
    }
    window.location.assign("/#menu");
  }

  return (
    <button type="button" className="product-page-cta" onClick={addAndContinue} disabled={stockQty <= 0}>
      <ShoppingBag size={20} />
      {stockQty > 0 ? `افزودن ${productName} به سفارش` : "فعلاً ناموجود"}
    </button>
  );
}
