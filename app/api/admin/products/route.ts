import { createProduct, listProducts } from "@/lib/db";
import { isAuthorizedAdminRequest } from "@/lib/admin";
import { jsonError, parseProductInput, slugify } from "@/lib/http";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  return Response.json({ products: await listProducts(true) });
}

export async function POST(request: Request) {
  if (!(await isAuthorizedAdminRequest())) return jsonError("دسترسی غیرمجاز است.", 403);
  try {
    const parsed = parseProductInput(await request.json(), false);
    const input: Omit<Product, "createdAt" | "updatedAt"> = {
      id: crypto.randomUUID(),
      name: parsed.name!,
      slug: parsed.slug || slugify(parsed.name!),
      description: parsed.description!,
      price: parsed.price!,
      category: parsed.category!,
      weightLabel: parsed.weightLabel!,
      imageUrl: parsed.imageUrl!,
      imageKey: parsed.imageKey ?? null,
      stockQty: parsed.stockQty!,
      active: parsed.active ?? true,
      featured: parsed.featured ?? false,
      sortOrder: parsed.sortOrder ?? 100,
    };
    return Response.json({ product: await createProduct(input) }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "ساخت محصول ممکن نشد.");
  }
}
