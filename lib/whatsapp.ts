import type { Order } from "./types";

const WHATSAPP_NUMBER = "989128505124";

export function buildWhatsAppUrl(order: Order): string {
  const itemLines = order.items
    .map(
      (item) =>
        `• ${item.quantity.toLocaleString("fa-IR")} × ${item.name} — ${item.lineTotal.toLocaleString("fa-IR")} تومان`,
    )
    .join("\n");
  const discountLine = order.discountAmount
    ? `\nتخفیف (${order.discountCode}): ${order.discountAmount.toLocaleString("fa-IR")} تومان`
    : "";
  const noteLine = order.note ? `\nتوضیحات: ${order.note}` : "";
  const message = `سلام Cookie Time 👋\n\nسفارش جدید ${order.orderNumber}\nنام: ${order.customerName}\nشماره تماس: ${order.customerPhone}\n\nمحصولات:\n${itemLines}\n\nجمع جزء: ${order.subtotal.toLocaleString("fa-IR")} تومان${discountLine}\nمبلغ نهایی: ${order.total.toLocaleString("fa-IR")} تومان${noteLine}\n\nلطفاً سفارش را تأیید کنید.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
