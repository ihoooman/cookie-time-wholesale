import { calculateDiscount, getDiscount } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const subtotal = Math.max(0, Math.floor(Number(body.subtotal ?? 0)));
    if (!code) return jsonError("کد تخفیف را وارد کنید.");
    const discount = await getDiscount(code);
    if (!discount) return jsonError("کد تخفیف معتبر نیست.", 404);
    if (subtotal < discount.minOrder) {
      return jsonError(`حداقل خرید برای این کد ${discount.minOrder.toLocaleString("fa-IR")} تومان است.`);
    }
    return Response.json({
      code: discount.code,
      amount: calculateDiscount(discount, subtotal),
    });
  } catch {
    return jsonError("بررسی کد تخفیف ممکن نشد.", 500);
  }
}
