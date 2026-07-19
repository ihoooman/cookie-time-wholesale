import { deleteDiscount, updateDiscount } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError } from "@/lib/http";
import type { Discount } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  const { id } = await context.params;
  const body = (await request.json()) as Partial<Discount>;
  await updateDiscount(id, body);
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  const { id } = await context.params;
  await deleteDiscount(id);
  return Response.json({ ok: true });
}
