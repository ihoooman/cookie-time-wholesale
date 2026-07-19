import { listOrders } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  return Response.json({ orders: await listOrders() });
}
