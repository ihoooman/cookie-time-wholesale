import { putMediaObject } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return jsonError("فایل تصویر انتخاب نشده است.");
    if (!file.type.startsWith("image/")) return jsonError("فقط فایل تصویری مجاز است.");
    if (file.size > 8 * 1024 * 1024) return jsonError("حجم تصویر باید کمتر از ۸ مگابایت باشد.");
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const key = `${crypto.randomUUID()}.${extension}`;
    await putMediaObject(key, await file.arrayBuffer(), file.type);
    return Response.json({ key, url: `/api/media/${key}` }, { status: 201 });
  } catch {
    return jsonError("آپلود تصویر ممکن نشد.", 500);
  }
}
