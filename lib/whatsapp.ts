import type { Order } from "./types";

const WHATSAPP_NUMBER = "989128505124";

export function buildWhatsAppUrl(order: Order): string {
  const itemLines = order.items
    .map(
      (item) =>
        `• ${item.quantity.toLocaleString("fa-IR")} × ${item.name} — ${item.lineTotal.toLocaleString("fa-IR")} تومان${item.wholesaleDiscountEligible ? " (واجد تخفیف همکاری ۲۰+)" : ""}`,
    )
    .join("\n");
  const discountLine = order.discountAmount
    ? `\nتخفیف (${order.discountCode}): ${order.discountAmount.toLocaleString("fa-IR")} تومان`
    : "";
  const noteLine = order.note ? `\nتوضیحات: ${order.note}` : "";
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const preparationLine = totalQuantity > 50
    ? "زمان‌بندی: سفارش بالای ۵۰ عدد — نیازمند هماهنگی حداقل ۷۲ ساعت قبل"
    : "زمان آماده‌سازی: ۴۸ ساعت";
  const message = `سلام Cookie Time 👋\n\nسفارش همکاری جدید ${order.orderNumber}\nمجموعه: ${order.businessName} (${order.businessType})\nمنطقه: ${order.area}\nمسئول سفارش: ${order.customerName}\nشماره تماس: ${order.customerPhone}\n\nمحصولات (${totalQuantity.toLocaleString("fa-IR")} عدد):\n${itemLines}\n\nجمع برآوردی: ${order.subtotal.toLocaleString("fa-IR")} تومان${discountLine}\nمبلغ پس از کد تخفیف: ${order.total.toLocaleString("fa-IR")} تومان\n${preparationLine}\nهزینه ارسال جداگانه محاسبه می‌شود.${noteLine}\n\nلطفاً موجودی، تخفیف همکاری آیتم‌های ۲۰+ و زمان ارسال را تأیید کنید.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
