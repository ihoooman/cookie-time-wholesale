import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Handshake, PackageCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicProductBySlug, getPublicProducts } from "@/lib/catalog";
import { ProductCta } from "./product-cta";

export const dynamic = "force-dynamic";

const SITE_URL = "https://seller.time-cookie.com";
const priceFormatter = new Intl.NumberFormat("fa-IR");

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return { title: "محصول پیدا نشد", robots: { index: false, follow: false } };

  const description = `${product.description} سفارش عمده ${product.name} با قیمت همکاری برای کافه‌ها و مجموعه‌های تهران از Cookie Time.`;
  const canonical = `/products/${encodeURIComponent(product.slug)}`;

  return {
    title: `${product.name} عمده | قیمت همکاری`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      url: canonical,
      title: `سفارش عمده ${product.name} | Cookie Time`,
      description,
      images: [{ url: product.imageUrl, alt: `${product.name} دست‌ساز Cookie Time` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `سفارش عمده ${product.name}`,
      description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, products] = await Promise.all([
    getPublicProductBySlug(slug),
    getPublicProducts(),
  ]);
  if (!product) notFound();

  const canonicalUrl = `${SITE_URL}/products/${encodeURIComponent(product.slug)}`;
  const absoluteImage = product.imageUrl.startsWith("http") ? product.imageUrl : `${SITE_URL}${product.imageUrl}`;
  const relatedProducts = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [absoluteImage],
    description: product.description,
    sku: product.id,
    category: product.category === "cookie" ? "کوکی دست‌ساز" : product.category === "jar" ? "جارکیک" : "کیک",
    brand: { "@type": "Brand", name: "Cookie Time" },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "IRR",
      price: product.price * 10,
      availability: product.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Cookie Time" },
    },
  };

  return (
    <main className="product-page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <header className="product-page-header liquid-clear">
        <Link href="/" aria-label="صفحه اصلی Cookie Time"><img src="/brand/logo-burgundy.png" alt="Cookie Time" /></Link>
        <Link href="/#menu"><ArrowRight size={18} /> بازگشت به منوی عمده</Link>
      </header>

      <article className="product-page-card liquid-regular">
        <div className="product-page-image">
          <img src={product.imageUrl} alt={`${product.name} دست‌ساز Cookie Time برای سفارش عمده`} fetchPriority="high" />
        </div>
        <div className="product-page-copy">
          <nav aria-label="مسیر صفحه" className="breadcrumbs">
            <Link href="/">Cookie Time</Link><span>/</span><Link href="/#menu">منوی عمده</Link><span>/</span><span>{product.name}</span>
          </nav>
          <span className="eyebrow dark">{product.weightLabel} · قیمت ویژه همکاری</span>
          <h1>{product.name}؛ سفارش عمده برای کافه</h1>
          <p className="product-page-description">{product.description}</p>
          <div className="product-page-benefits">
            <span><PackageCheck size={18} /> تولید روزانه و آماده سرو</span>
            <span><Clock3 size={18} /> آماده‌سازی معمول ۴۸ ساعت</span>
            <span><Handshake size={18} /> حداقل سفارش ترکیبی ۱۰ عدد</span>
          </div>
          <div className="product-page-buy">
            <div className="price"><small>قیمت همکاری هر عدد</small><strong>{priceFormatter.format(product.price)}</strong><span>تومان</span></div>
            <ProductCta productId={product.id} productName={product.name} stockQty={product.stockQty} />
          </div>
          <p className="product-page-note">هزینه ارسال جداگانه محاسبه می‌شود. تأیید نهایی موجودی و زمان آماده‌سازی در واتساپ انجام خواهد شد.</p>
        </div>
      </article>

      <section className="product-page-content">
        <div>
          <span className="eyebrow dark">مناسب ویترین حرفه‌ای</span>
          <h2>چرا {product.name} را به منوی کافه اضافه کنیم؟</h2>
          <p>
            وزن ثابت، ظاهر مناسب ویترین و آماده‌سازی برنامه‌ریزی‌شده باعث می‌شود این محصول بدون نیاز به تولید داخل مجموعه،
            به‌راحتی در کنار قهوه و نوشیدنی سرو شود. امکان ترکیب آن با سایر محصولات Cookie Time در سفارش حداقل ۱۰ عددی وجود دارد.
          </p>
        </div>
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>محصولات مشابه برای سفارش عمده</h2>
            <div>
              {relatedProducts.map((item) => (
                <Link href={`/products/${item.slug}`} key={item.id}>
                  <img src={item.imageUrl} alt={item.name} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
