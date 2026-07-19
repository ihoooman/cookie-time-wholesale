import { createDiscount, listDiscounts } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  return Response.json({ discounts: await listDiscounts() });
}

export async function POST(request: Request) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const type = body.type === "fixed" ? "fixed" : "percent";
    const value = Math.max(1, Math.floor(Number(body.value ?? 0)));
    const minOrder = Math.max(0, Math.floor(Number(body.minOrder ?? 0)));
    if (!code) return jsonError("کد تخفیف را وارد کنید.");
    if (type === "percent" && value > 100) return jsonError("درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.");
    const discount = await createDiscount({ code, type, value, minOrder, active: body.active !== false });
    return Response.json({ discount }, { status: 201 });
  } catch {
    return jsonError("ساخت کد تخفیف ممکن نشد.");
  }
}
