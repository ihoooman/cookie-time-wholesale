"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgePercent,
  Camera,
  CheckCircle2,
  Clock3,
  Cookie,
  Handshake,
  House,
  Info,
  PackageCheck,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
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
  const [headerOnLight, setHeaderOnLight] = useState(false);
  const [customer, setCustomer] = useState({
    businessName: "",
    businessType: "کافه",
    area: "",
    name: "",
    phone: "",
    note: "",
  });
  const menuRef = useRef<HTMLElement>(null);
  const heroPrimaryRef = useRef<HTMLElement>(null);

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
    function syncHeaderContrast() {
      const heroBottom = heroPrimaryRef.current?.getBoundingClientRect().bottom ?? 0;
      setHeaderOnLight(heroBottom <= 104);
    }
    syncHeaderContrast();
    window.addEventListener("scroll", syncHeaderContrast, { passive: true });
    window.addEventListener("resize", syncHeaderContrast);
    return () => {
      window.removeEventListener("scroll", syncHeaderContrast);
      window.removeEventListener("resize", syncHeaderContrast);
    };
  }, []);

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
  const minimumRemaining = Math.max(0, 10 - itemCount);
  const needsExtendedCoordination = itemCount > 50;
  const wholesaleEligibleItems = cartItems.filter((item) => item.quantity > 20);

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
          businessName: customer.businessName,
          businessType: customer.businessType,
          area: customer.area,
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

      <header className={`site-header liquid-clear${headerOnLight ? " is-over-light" : ""}`}>
        <a className="brand" href="#top" aria-label="Cookie Time - صفحه اصلی">
          <img src={headerOnLight ? "/brand/logo-burgundy.png" : "/brand/logo-cream.png"} alt="Cookie Time" />
        </a>
        <nav className="desktop-nav" aria-label="ناوبری اصلی">
          <button type="button" onClick={scrollToMenu}><Cookie size={17} /> منوی همکاری</button>
          <a href="#terms"><Handshake size={17} /> شرایط همکاری</a>
          <a href="https://instagram.com/cookietimetehran" target="_blank" rel="noreferrer"><Camera size={17} /> اینستاگرام</a>
        </nav>
        <button className="liquid-button cart-trigger" type="button" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={18} />
          <span>سفارش عمده</span>
          <strong>{priceFormatter.format(itemCount)}</strong>
        </button>
      </header>

      <section className="hero" id="top">
        <article className="hero-primary" ref={heroPrimaryRef}>
          <div className="hero-copy">
            <span className="eyebrow">منوی همکاری کافه‌ها</span>
            <h1>ویترینت رو<br />تازه‌تر کن</h1>
            <p>کوکی و دسر دست‌ساز، تولید روزانه و آماده سرو؛ برای کافه‌هایی که کیفیت ثابت و تأمین منظم می‌خواهند.</p>
            <button className="primary-action liquid-clear" type="button" onClick={scrollToMenu}>
              شروع سفارش عمده
              <ArrowLeft size={20} />
            </button>
          </div>
          <div className="hero-product" aria-hidden="true">
            <span className="hero-orbit orbit-one" />
            <span className="hero-orbit orbit-two" />
            <img src="/products/cookie-nutella.webp" alt="" />
          </div>
        </article>
        <article className="bento-card bento-fresh">
          <div>
            <span><Clock3 size={16} /> زمان آماده‌سازی</span>
            <strong>۴۸ ساعت</strong>
          </div>
          <img src="/products/cookie-lotus.webp" alt="کوکی لوتوس" />
        </article>
        <article className="bento-card bento-pistachio">
          <div>
            <span><Truck size={16} /> همکاری تهران</span>
            <strong>ارسال منظم</strong>
          </div>
          <img src="/products/cookie-pistachio.webp" alt="کوکی پسته" />
        </article>
      </section>

      <section className="menu-section" ref={menuRef} id="menu">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">قیمت ویژه همکاری</span>
            <h2>منوی عمده Cookie Time</h2>
          </div>
          <div className="category-switch liquid-regular" role="tablist" aria-label="دسته‌بندی محصولات">
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
                  {product.featured && <span className="product-badge"><Sparkles size={13} /> انتخاب کافه‌ها</span>}
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                </button>
                <div className="product-info">
                  <div>
                    <span className="product-meta">{product.weightLabel}</span>
                    <h3>{product.name}</h3>
                  </div>
                  <p>{product.description}</p>
                  <div className="product-actions">
                    <div className="price"><small>قیمت همکاری</small><strong>{priceFormatter.format(product.price)}</strong><span>تومان</span></div>
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => addToCart(product)}
                      disabled={product.stockQty <= 0}
                      aria-label={`افزودن ${product.name} به سبد`}
                    >
                      {product.stockQty <= 0 ? "ناموجود" : <><Plus size={17} /> افزودن</>}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="wholesale-terms" id="terms">
        <div className="section-heading terms-heading">
          <div>
            <span className="eyebrow dark">شرایط همکاری</span>
            <h2>شفاف، منظم و مناسب برنامه کافه</h2>
          </div>
          <p>قیمت‌ها ویژه سفارش عمده کافه‌هاست و هزینه ارسال جداگانه محاسبه می‌شود.</p>
        </div>
        <div className="terms-grid">
          <article><span><PackageCheck size={22} /></span><strong>حداقل ۱۰ عدد</strong><p>ترکیب محصولات آزاد است؛ فقط جمع سفارش باید حداقل ۱۰ عدد باشد.</p></article>
          <article><span><BadgePercent size={22} /></span><strong>تخفیف آیتم ۲۰+</strong><p>سفارش بیش از ۲۰ عدد از هر محصول، واجد تخفیف همکاری بیشتر است.</p></article>
          <article><span><Clock3 size={22} /></span><strong>آماده‌سازی ۴۸ ساعته</strong><p>برای حفظ تازگی و کیفیت ثابت، سفارش‌ها با برنامه تولید آماده می‌شوند.</p></article>
          <article><span><Handshake size={22} /></span><strong>هماهنگی سفارش ۵۰+</strong><p>برای سفارش‌های بالای ۵۰ عدد، حداقل ۷۲ ساعت قبل هماهنگ کنید.</p></article>
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-copy">
          <span className="eyebrow dark">چرا همکاری با Cookie Time؟</span>
          <h2>کیفیت ثابت برای ویترین هر روز</h2>
          <p>تولید روزانه، بسته‌بندی بهداشتی و آماده سرو، وزن ثابت و مواد اولیه پریمیوم؛ برای تجربه‌ای که مشتری کافه دوباره سراغش می‌آید.</p>
        </div>
        <div className="story-points">
          <div><strong>تازه</strong><span>تولید روزانه</span></div>
          <div><strong>ثابت</strong><span>وزن و کیفیت هر سفارش</span></div>
          <div><strong>آماده</strong><span>سرو در کافه و ویترین</span></div>
        </div>
      </section>

      <footer className="site-footer">
        <img src="/brand/logo-cream.png" alt="Cookie Time" />
        <p>همکاری خوش‌طعم برای ویترین کافه شما.</p>
        <div>
          <a href="https://instagram.com/cookietimetehran" target="_blank" rel="noreferrer">@cookietimetehran</a>
          <a href="https://wa.me/989128505124" target="_blank" rel="noreferrer">واتساپ همکاری</a>
          <a href="/admin"><Store size={15} /> مدیریت</a>
        </div>
      </footer>

      <nav className="mobile-tabbar liquid-regular" aria-label="ناوبری موبایل">
        <a href="#top"><House size={21} />خانه</a>
        <button type="button" onClick={scrollToMenu}><Cookie size={21} />منو</button>
        <a href="#terms"><Info size={21} />شرایط</a>
        <button type="button" onClick={() => setCartOpen(true)}><ShoppingBag size={21} />سفارش <strong>{itemCount}</strong></button>
      </nav>

      {selectedProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedProduct(null)}>
          <section className="product-modal liquid-regular" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button liquid-button" type="button" onClick={() => setSelectedProduct(null)} aria-label="بستن">×</button>
            <div className="modal-product-image"><img src={selectedProduct.imageUrl} alt={selectedProduct.name} /></div>
            <div className="modal-product-copy">
              <span>{selectedProduct.weightLabel}</span>
              <h2 id="product-modal-title">{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <div className="modal-buy-row">
                <div className="price"><small>قیمت همکاری</small><strong>{priceFormatter.format(selectedProduct.price)}</strong><span>تومان</span></div>
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
          <aside className="cart-drawer liquid-regular" role="dialog" aria-modal="true" aria-labelledby="cart-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div><span>درخواست همکاری</span><h2 id="cart-title">سفارش عمده</h2></div>
              <button className="close-button liquid-button" type="button" onClick={() => setCartOpen(false)} aria-label="بستن سبد">×</button>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-cart"><Cookie size={42} /><strong>سفارش هنوز خالیه</strong><button type="button" onClick={() => { setCartOpen(false); scrollToMenu(); }}>مشاهده منوی همکاری</button></div>
            ) : (
              <form className="checkout-form" onSubmit={placeOrder}>
                <div className="cart-lines">
                  {cartItems.map(({ product, quantity }) => (
                    <div className="cart-line" key={product.id}>
                      <img src={product.imageUrl} alt="" />
                      <div className="cart-line-copy"><strong>{product.name}</strong><span>{priceFormatter.format(product.price)} تومان</span></div>
                      <div className="quantity-control liquid-clear">
                        <button type="button" onClick={() => setQuantity(product, quantity - 1)} aria-label={`کم کردن ${product.name}`}>−</button>
                        <span>{priceFormatter.format(quantity)}</span>
                        <button type="button" onClick={() => setQuantity(product, quantity + 1)} aria-label={`اضافه کردن ${product.name}`}>＋</button>
                      </div>
                      {quantity > 20 && <small className="wholesale-eligible"><BadgePercent size={13} /> واجد تخفیف همکاری</small>}
                    </div>
                  ))}
                </div>

                <div className={`minimum-order ${minimumRemaining === 0 ? "complete" : ""}`}>
                  {minimumRemaining > 0 ? (
                    <><Info size={18} /><span>برای رسیدن به حداقل سفارش همکاری، <strong>{priceFormatter.format(minimumRemaining)} عدد</strong> دیگر انتخاب کنید.</span></>
                  ) : (
                    <><CheckCircle2 size={18} /><span>حداقل سفارش همکاری تکمیل شد: <strong>{priceFormatter.format(itemCount)} عدد</strong></span></>
                  )}
                </div>

                <div className="discount-box">
                  <label htmlFor="discount">کد تخفیف</label>
                  <div><input id="discount" value={discountCode} onChange={(event) => { setDiscountCode(event.target.value); setAppliedDiscount(null); }} placeholder="مثلاً COOKIE10" dir="ltr" /><button type="button" onClick={applyDiscount} disabled={discountLoading}>{discountLoading ? "..." : "اعمال"}</button></div>
                  {appliedDiscount && <small className="success-text">کد {appliedDiscount.code} اعمال شد.</small>}
                </div>

                <div className="checkout-fields">
                  <label>نام مجموعه<input required value={customer.businessName} onChange={(event) => setCustomer({ ...customer, businessName: event.target.value })} placeholder="نام کافه یا مجموعه" /></label>
                  <label>نوع مجموعه<select value={customer.businessType} onChange={(event) => setCustomer({ ...customer, businessType: event.target.value })}><option>کافه</option><option>رستوران</option><option>هتل</option><option>فروشگاه</option><option>سایر</option></select></label>
                  <label>منطقه / محله<input required value={customer.area} onChange={(event) => setCustomer({ ...customer, area: event.target.value })} placeholder="مثلاً سعادت‌آباد" /></label>
                  <label>نام مسئول سفارش<input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} autoComplete="name" /></label>
                  <label>شماره موبایل<input required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} inputMode="tel" autoComplete="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" /></label>
                  <label>توضیحات سفارش <span>(اختیاری)</span><textarea value={customer.note} onChange={(event) => setCustomer({ ...customer, note: event.target.value })} rows={2} placeholder="اگر نکته‌ای هست بنویس..." /></label>
                </div>

                {discountError && <p className="form-error" role="alert">{discountError}</p>}

                <div className="cart-summary">
                  <div><span>تعداد کل</span><strong>{priceFormatter.format(itemCount)} عدد</strong></div>
                  <div><span>جمع قیمت همکاری</span><strong>{priceFormatter.format(subtotal)} تومان</strong></div>
                  {discountAmount > 0 && <div className="discount-row"><span>تخفیف</span><strong>− {priceFormatter.format(discountAmount)} تومان</strong></div>}
                  <div className="total-row"><span>مبلغ برآوردی</span><strong>{priceFormatter.format(total)} تومان</strong></div>
                </div>
                {wholesaleEligibleItems.length > 0 && <p className="bulk-discount-note"><BadgePercent size={16} /> تخفیف همکاری آیتم‌های ۲۰+ پس از بررسی در واتساپ تأیید می‌شود.</p>}
                {needsExtendedCoordination && <p className="coordination-note"><Clock3 size={16} /> سفارش بالای ۵۰ عدد است؛ برای تولید به هماهنگی حداقل ۷۲ ساعت قبل نیاز دارد.</p>}
                <button className="whatsapp-submit" type="submit" disabled={submitting || minimumRemaining > 0}>
                  <Handshake size={19} />
                  {submitting ? "در حال ثبت سفارش..." : "ثبت درخواست همکاری و ارسال به واتساپ"}
                </button>
                <p className="checkout-note">زمان آماده‌سازی معمول ۴۸ ساعت است. هزینه ارسال جداگانه محاسبه می‌شود.</p>
              </form>
            )}
          </aside>
        </div>
      )}

      {orderResult && (
        <div className="modal-backdrop order-success-backdrop">
          <section className="order-success liquid-regular" role="dialog" aria-modal="true" aria-labelledby="success-title">
            <span className="success-cookie"><Handshake size={34} /></span>
            <span className="eyebrow dark">درخواست همکاری ثبت شد</span>
            <h2 id="success-title">برای تأیید نهایی آماده‌ایم</h2>
            <p>سفارش <strong>{orderResult.order.orderNumber}</strong> داخل پنل ثبت شد. متن آماده را در واتساپ بفرست تا موجودی، تخفیف همکاری و زمان ارسال تأیید شود.</p>
            <a className="whatsapp-link" href={orderResult.whatsappUrl} target="_blank" rel="noreferrer">ارسال درخواست در واتساپ</a>
            <button type="button" onClick={() => setOrderResult(null)}>بازگشت به فروشگاه</button>
          </section>
        </div>
      )}

      <div className={`toast ${notice ? "show" : ""}`} role="status" aria-live="polite">{notice}</div>
    </main>
  );
}
