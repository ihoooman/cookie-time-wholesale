import { listProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await listProducts(false);
    return Response.json({ products }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "دریافت محصولات ممکن نشد." }, { status: 500 });
  }
}
