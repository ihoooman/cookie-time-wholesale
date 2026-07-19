import { deleteOrder } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  const { id } = await context.params;
  await deleteOrder(id);
  return Response.json({ ok: true });
}
