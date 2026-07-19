import type { Product, ProductCategory } from "./types";

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function normalizePhone(value: string): string | null {
  const latin = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\s()-]/g, "");
  if (/^09\d{9}$/.test(latin)) return latin;
  if (/^989\d{9}$/.test(latin)) return `0${latin.slice(2)}`;
  if (/^\+989\d{9}$/.test(latin)) return `0${latin.slice(3)}`;
  return null;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `product-${Date.now()}`;
}

export function parseProductInput(
  value: unknown,
  partial = false,
): Partial<Product> & { name?: string; slug?: string } {
  if (!value || typeof value !== "object") throw new Error("اطلاعات محصول ناقص است.");
  const body = value as Record<string, unknown>;
  const result: Partial<Product> = {};
  if (typeof body.name === "string") result.name = body.name.trim().slice(0, 120);
  if (typeof body.slug === "string") result.slug = slugify(body.slug);
  if (typeof body.description === "string") result.description = body.description.trim().slice(0, 1000);
  if (body.price !== undefined) result.price = Math.max(0, Math.floor(Number(body.price)));
  if (typeof body.category === "string" && ["cookie", "jar", "cake"].includes(body.category)) {
    result.category = body.category as ProductCategory;
  }
  if (typeof body.weightLabel === "string") result.weightLabel = body.weightLabel.trim().slice(0, 40);
  if (typeof body.imageUrl === "string") result.imageUrl = body.imageUrl.trim().slice(0, 500);
  if (body.imageKey === null || typeof body.imageKey === "string") result.imageKey = body.imageKey as string | null;
  if (body.stockQty !== undefined) result.stockQty = Math.max(0, Math.floor(Number(body.stockQty)));
  if (body.active !== undefined) result.active = Boolean(body.active);
  if (body.featured !== undefined) result.featured = Boolean(body.featured);
  if (body.sortOrder !== undefined) result.sortOrder = Math.floor(Number(body.sortOrder));

  if (!partial) {
    const required = ["name", "description", "price", "category", "weightLabel", "imageUrl", "stockQty"] as const;
    for (const field of required) {
      if (result[field] === undefined || result[field] === "") {
        throw new Error("لطفاً همه اطلاعات ضروری محصول را کامل کنید.");
      }
    }
  }
  return result;
}
