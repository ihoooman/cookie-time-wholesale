import { deleteMediaObject, deleteProduct, updateProduct } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError, parseProductInput } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  try {
    const { id } = await context.params;
    await updateProduct(id, parseProductInput(await request.json(), true));
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ویرایش محصول ممکن نشد.");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  try {
    const { id } = await context.params;
    const imageKey = await deleteProduct(id);
    if (imageKey) await deleteMediaObject(imageKey);
    return Response.json({ ok: true });
  } catch {
    return jsonError("حذف محصول ممکن نشد.", 500);
  }
}
