"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Order, Product, ProductCategory } from "@/lib/types";

type Cart = Record<string, number>;
type CategoryFilter = "all" | ProductCategory;
type CompletedOrder = { order: Order; whatsappUrl: string };

const categories: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "cookie", label: "کوکی‌ها" },
  { id: "jar", label: "جارکیک‌ها" },
  { id: "cake", label: "کیک‌ها" },
];

const priceFormatter = new Intl.NumberFormat("fa-IR");

export function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<CompletedOrder | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", note: "" });
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("cookie-time-cart");
        if (saved) setCart(JSON.parse(saved) as Cart);
      } catch {
        localStorage.removeItem("cookie-time-cart");
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    localStorage.setItem("cookie-time-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let active = true;
    fetch("/api/products", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { products?: Product[]; error?: string };
        if (!response.ok) throw new Error(data.error || "دریافت منو ممکن نشد.");
        if (active) setProducts(data.products ?? []);
      })
      .catch((error: Error) => active && setLoadError(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2300);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredProducts = useMemo(
    () => products.filter((product) => category === "all" || product.category === category),
    [category, products],
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = products.find((item) => item.id === productId);
          return product ? { product, quantity } : null;
        })
        .filter((item): item is { product: Product; quantity: number } => Boolean(item)),
    [cart, products],
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = Math.max(0, subtotal - discountAmount);

  function addToCart(product: Product, quantity = 1) {
    if (product.stockQty <= 0) return;
    setCart((current) => ({
      ...current,
      [product.id]: Math.min(product.stockQty, (current[product.id] ?? 0) + quantity),
    }));
    setAppliedDiscount(null);
    setNotice(`${product.name} به سبد اضافه شد`);
  }

  function setQuantity(product: Product, quantity: number) {
    setAppliedDiscount(null);
    setCart((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }
      return { ...current, [product.id]: Math.min(product.stockQty, quantity) };
    });
  }

  function scrollToMenu() {
    menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function applyDiscount() {
    setDiscountLoading(true);
    setDiscountError("");
    try {
      const response = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode, subtotal }),
      });
      const data = (await response.json()) as { code?: string; amount?: number; error?: string };
      if (!response.ok) throw new Error(data.error || "کد تخفیف معتبر نیست.");
      setAppliedDiscount({ code: data.code!, amount: data.amount! });
      setDiscountCode(data.code!);
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountError(error instanceof Error ? error.message : "بررسی کد ممکن نشد.");
    } finally {
      setDiscountLoading(false);
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartItems.length) return;
    setSubmitting(true);
    setDiscountError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          customerPhone: customer.phone,
          note: customer.note,
          discountCode: appliedDiscount?.code || discountCode || undefined,
          cart: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = (await response.json()) as CompletedOrder & { error?: string };
      if (!response.ok) throw new Error(data.error || "ثبت سفارش ممکن نشد.");
      setOrderResult({ order: data.order, whatsappUrl: data.whatsappUrl });
      setCart({});
      setAppliedDiscount(null);
      setDiscountCode("");
      setCartOpen(false);
    } catch (error) {
      setDiscountError(error instanceof Error ? error.message : "ثبت سفارش ممکن نشد.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="storefront-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header glass-regular">
        <a className="brand" href="#top" aria-label="Cookie Time - صفحه اصلی">
          <img src="/brand/logo-burgundy.png" alt="Cookie Time" />
        </a>
        <nav className="desktop-nav" aria-label="ناوبری اصلی">
          <button type="button" onClick={scrollToMenu}>منو</button>
          <a href="#story">درباره ما</a>
          <a href="https://instagram.com/cookietimetehran" target="_blank" rel="noreferrer">اینستاگرام</a>
        </nav>
        <button className="glass-button cart-trigger" type="button" onClick={() => setCartOpen(true)}>
          <span>سبد خرید</span>
          <strong>{priceFormatter.format(itemCount)}</strong>
        </button>
      </header>

      <section className="hero" id="top">
        <article className="hero-primary">
          <div className="hero-copy">
            <span className="eyebrow">دست‌ساز، تازه، دوست‌داشتنی</span>
            <h1>یه گاز<br />تا حال خوب</h1>
            <p>کوکی‌های تازه و دسرهای دست‌ساز؛ انتخاب کن، سفارش را ثبت کن و مستقیم در واتساپ بفرست.</p>
            <button className="primary-action glass-clear" type="button" onClick={scrollToMenu}>
              انتخاب کوکی
              <span aria-hidden="true">←</span>
            </button>
          </div>
          <div className="hero-product" aria-hidden="true">
            <span className="hero-orbit orbit-one" />
            <span className="hero-orbit orbit-two" />
            <img src="/products/cookie-nutella.png" alt="" />
          </div>
        </article>
        <article className="bento-card bento-fresh">
          <div>
            <span>پخت روز</span>
            <strong>هر لقمه، تازه</strong>
          </div>
          <img src="/products/cookie-lotus.png" alt="کوکی لوتوس" />
        </article>
        <article className="bento-card bento-pistachio">
          <div>
            <span>انتخاب ویژه</span>
            <strong>پسته‌ای و خاص</strong>
          </div>
          <img src="/products/cookie-pistachio.png" alt="کوکی پسته" />
        </article>
      </section>

      <section className="menu-section" ref={menuRef} id="menu">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">منوی امروز</span>
            <h2>خوشمزه مورد علاقت رو پیدا کن</h2>
          </div>
          <div className="category-switch glass-regular" role="tablist" aria-label="دسته‌بندی محصولات">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={category === item.id}
                className={category === item.id ? "active" : ""}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="product-grid" aria-label="در حال بارگذاری محصولات">
            {Array.from({ length: 8 }).map((_, index) => <div className="product-skeleton" key={index} />)}
          </div>
        ) : loadError ? (
          <div className="empty-state"><strong>منو فعلاً در دسترس نیست</strong><span>{loadError}</span></div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  className="product-image-button"
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  aria-label={`مشاهده ${product.name}`}
                >
                  {product.featured && <span className="product-badge">محبوب</span>}
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                </button>
                <div className="product-info">
                  <div>
                    <span className="product-meta">{product.weightLabel}</span>
                    <h3>{product.name}</h3>
                  </div>
                  <p>{product.description}</p>
                  <div className="product-actions">
                    <div className="price"><strong>{priceFormatter.format(product.price)}</strong><span>تومان</span></div>
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => addToCart(product)}
                      disabled={product.stockQty <= 0}
                      aria-label={`افزودن ${product.name} به سبد`}
                    >
                      {product.stockQty <= 0 ? "ناموجود" : <><span aria-hidden="true">＋</span> افزودن</>}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="story-section" id="story">
        <div className="story-copy">
          <span className="eyebrow dark">چرا Cookie Time؟</span>
          <h2>کیفیت ثابت، از اولین انتخاب تا آخرین گاز</h2>
          <p>محصولات ما روزانه با مواد اولیه پریمیوم آماده می‌شوند تا همان طعم و بافتی را بگیری که منتظرش هستی.</p>
        </div>
        <div className="story-points">
          <div><strong>روزانه</strong><span>تولید تازه</span></div>
          <div><strong>واقعی</strong><span>عکس محصولات</span></div>
          <div><strong>ساده</strong><span>سفارش با واتساپ</span></div>
        </div>
      </section>

      <footer className="site-footer">
        <img src="/brand/logo-cream.png" alt="Cookie Time" />
        <p>حال خوب، تازه از فر.</p>
        <div>
          <a href="https://instagram.com/cookietimetehran" target="_blank" rel="noreferrer">@cookietimetehran</a>
          <a href="https://wa.me/989128505124" target="_blank" rel="noreferrer">واتساپ سفارش</a>
          <a href="/admin">مدیریت</a>
        </div>
      </footer>

      <nav className="mobile-tabbar glass-regular" aria-label="ناوبری موبایل">
        <a href="#top"><span aria-hidden="true">⌂</span>خانه</a>
        <button type="button" onClick={scrollToMenu}><span aria-hidden="true">◉</span>منو</button>
        <button type="button" onClick={() => setCartOpen(true)}><span aria-hidden="true">▢</span>سبد <strong>{itemCount}</strong></button>
      </nav>

      {selectedProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedProduct(null)}>
          <section className="product-modal glass-regular" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button glass-button" type="button" onClick={() => setSelectedProduct(null)} aria-label="بستن">×</button>
            <div className="modal-product-image"><img src={selectedProduct.imageUrl} alt={selectedProduct.name} /></div>
            <div className="modal-product-copy">
              <span>{selectedProduct.weightLabel}</span>
              <h2 id="product-modal-title">{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <div className="modal-buy-row">
                <div className="price"><strong>{priceFormatter.format(selectedProduct.price)}</strong><span>تومان</span></div>
                <button type="button" className="primary-action" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setCartOpen(true); }}>
                  افزودن به سبد
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="cart-backdrop" role="presentation" onMouseDown={() => setCartOpen(false)}>
          <aside className="cart-drawer glass-regular" role="dialog" aria-modal="true" aria-labelledby="cart-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div><span>خرید شما</span><h2 id="cart-title">سبد خرید</h2></div>
              <button className="close-button glass-button" type="button" onClick={() => setCartOpen(false)} aria-label="بستن سبد">×</button>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-cart"><span aria-hidden="true">🍪</span><strong>سبدت هنوز خالیه</strong><button type="button" onClick={() => { setCartOpen(false); scrollToMenu(); }}>بریم سراغ منو</button></div>
            ) : (
              <form className="checkout-form" onSubmit={placeOrder}>
                <div className="cart-lines">
                  {cartItems.map(({ product, quantity }) => (
                    <div className="cart-line" key={product.id}>
                      <img src={product.imageUrl} alt="" />
                      <div className="cart-line-copy"><strong>{product.name}</strong><span>{priceFormatter.format(product.price)} تومان</span></div>
                      <div className="quantity-control glass-clear">
                        <button type="button" onClick={() => setQuantity(product, quantity - 1)} aria-label={`کم کردن ${product.name}`}>−</button>
                        <span>{priceFormatter.format(quantity)}</span>
                        <button type="button" onClick={() => setQuantity(product, quantity + 1)} aria-label={`اضافه کردن ${product.name}`}>＋</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="discount-box">
                  <label htmlFor="discount">کد تخفیف</label>
                  <div><input id="discount" value={discountCode} onChange={(event) => { setDiscountCode(event.target.value); setAppliedDiscount(null); }} placeholder="مثلاً COOKIE10" dir="ltr" /><button type="button" onClick={applyDiscount} disabled={discountLoading}>{discountLoading ? "..." : "اعمال"}</button></div>
                  {appliedDiscount && <small className="success-text">کد {appliedDiscount.code} اعمال شد.</small>}
                </div>

                <div className="checkout-fields">
                  <label>نام و نام خانوادگی<input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} autoComplete="name" /></label>
                  <label>شماره موبایل<input required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} inputMode="tel" autoComplete="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" /></label>
                  <label>توضیحات سفارش <span>(اختیاری)</span><textarea value={customer.note} onChange={(event) => setCustomer({ ...customer, note: event.target.value })} rows={2} placeholder="اگر نکته‌ای هست بنویس..." /></label>
                </div>

                {discountError && <p className="form-error" role="alert">{discountError}</p>}

                <div className="cart-summary">
                  <div><span>جمع جزء</span><strong>{priceFormatter.format(subtotal)} تومان</strong></div>
                  {discountAmount > 0 && <div className="discount-row"><span>تخفیف</span><strong>− {priceFormatter.format(discountAmount)} تومان</strong></div>}
                  <div className="total-row"><span>مبلغ نهایی</span><strong>{priceFormatter.format(total)} تومان</strong></div>
                </div>
                <button className="whatsapp-submit" type="submit" disabled={submitting}>
                  <span aria-hidden="true">✦</span>
                  {submitting ? "در حال ثبت سفارش..." : "ثبت و ارسال سفارش در واتساپ"}
                </button>
                <p className="checkout-note">سفارش در پنل Cookie Time ثبت می‌شود و متن آماده در واتساپ باز خواهد شد.</p>
              </form>
            )}
          </aside>
        </div>
      )}

      {orderResult && (
        <div className="modal-backdrop order-success-backdrop">
          <section className="order-success glass-regular" role="dialog" aria-modal="true" aria-labelledby="success-title">
            <span className="success-cookie" aria-hidden="true">🍪</span>
            <span className="eyebrow dark">سفارش ثبت شد</span>
            <h2 id="success-title">فقط یک قدم مونده!</h2>
            <p>سفارش <strong>{orderResult.order.orderNumber}</strong> داخل پنل ثبت شد. روی دکمه زیر بزن و متن آماده را در واتساپ ارسال کن.</p>
            <a className="whatsapp-link" href={orderResult.whatsappUrl} target="_blank" rel="noreferrer">ارسال سفارش در واتساپ</a>
            <button type="button" onClick={() => setOrderResult(null)}>بازگشت به فروشگاه</button>
          </section>
        </div>
      )}

      <div className={`toast ${notice ? "show" : ""}`} role="status" aria-live="polite">{notice}</div>
    </main>
  );
}
