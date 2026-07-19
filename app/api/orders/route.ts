import { createOrder } from "@/lib/db";
import { jsonError, normalizePhone } from "@/lib/http";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerPhone = normalizePhone(typeof body.customerPhone === "string" ? body.customerPhone : "");
    const note = typeof body.note === "string" ? body.note : "";
    const discountCode = typeof body.discountCode === "string" ? body.discountCode : undefined;
    const rawCart = Array.isArray(body.cart) ? body.cart : [];
    if (customerName.length < 2) return jsonError("نام و نام خانوادگی را وارد کنید.");
    if (!customerPhone) return jsonError("شماره موبایل معتبر وارد کنید.");
    const cart = rawCart
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        productId: String(item.productId ?? ""),
        quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity ?? 1)))),
      }))
      .filter((item) => item.productId);
    if (!cart.length) return jsonError("سبد خرید خالی است.");

    const order = await createOrder({
      customerName,
      customerPhone,
      note,
      cart,
      discountCode,
    });
    return Response.json({ order, whatsappUrl: buildWhatsAppUrl(order) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ثبت سفارش ممکن نشد.";
    return jsonError(message, 400);
  }
}
