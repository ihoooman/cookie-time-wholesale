import type { MetadataRoute } from "next";
import { getPublicProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const SITE_URL = "https://seller.time-cookie.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublicProducts();

  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-07-20T00:00:00+03:30"),
    },
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
      lastModified: new Date(product.updatedAt),
    })),
  ];
}
