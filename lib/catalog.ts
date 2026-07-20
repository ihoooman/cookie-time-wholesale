import { listProducts } from "./db";
import { seedProducts } from "./seed";
import type { Product } from "./types";

const FALLBACK_UPDATED_AT = "2026-07-20T00:00:00+03:30";

function fallbackProducts(): Product[] {
  return seedProducts.map((product) => ({
    ...product,
    imageKey: null,
    createdAt: FALLBACK_UPDATED_AT,
    updatedAt: FALLBACK_UPDATED_AT,
  }));
}

/**
 * Returns the live catalog for server-rendered, indexable pages. The bundled
 * catalog is used only when a local build does not have access to Cloudflare D1.
 */
export async function getPublicProducts(): Promise<Product[]> {
  try {
    return await listProducts(false);
  } catch {
    return fallbackProducts();
  }
}

export async function getPublicProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getPublicProducts();
  return products.find((product) => product.slug === slug);
}
