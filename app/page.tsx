import { Storefront } from "./storefront";
import { getPublicProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const SITE_URL = "https://seller.time-cookie.com";

export default async function Home() {
  const products = await getPublicProducts();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Cookie Time",
        alternateName: "کوکی تایم",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/logo-burgundy.png`,
        telephone: "+989128505124",
        sameAs: ["https://instagram.com/cookietimetehran"],
        areaServed: { "@type": "City", name: "تهران" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "فروش عمده Cookie Time",
        inLanguage: "fa-IR",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "ItemList",
        name: "منوی عمده کوکی و دسر Cookie Time",
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Storefront initialProducts={products} />
    </>
  );
}
