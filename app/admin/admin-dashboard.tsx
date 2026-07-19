"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Discount, Order, Product, ProductCategory } from "@/lib/types";

type AdminTab = "overview" | "products" | "orders" | "discounts";
type Stats = {
  revenue: number;
  orderCount: number;
  itemCount: number;
  averageOrder: number;
  activeProducts: number;
  lowStock: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
};

type ProductDraft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: ProductCategory;
  weightLabel: string;
  imageUrl: string;
  imageKey: string | null;
  stockQty: number;
  active: boolean;
  featured: boolean;
  sortOrder: number;
};

const emptyProduct: ProductDraft = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  category: "cookie",
  weightLabel: "۹۰ گرم",
  imageUrl: "",
  imageKey: null,
  stockQty: 0,
  active: true,
  featured: false,
  sortOrder: 100,
};

const nf = new Intl.NumberFormat("fa-IR");
const dtf = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" });

export function AdminDashboard({ adminName, signOutPath }: { adminName: string; signOutPath: string }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [discountForm, setDiscountForm] = useState({ code: "", type: "percent", value: 10, minOrder: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productResponse, orderResponse, discountResponse, statsResponse] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/orders", { cache: "no-store" }),
        fetch("/api/admin/discounts", { cache: "no-store" }),
        fetch("/api/admin/stats", { cache: "no-store" }),
      ]);
      if ([productResponse, orderResponse, discountResponse, statsResponse].some((response) => !response.ok)) {
        throw new Error("دریافت اطلاعات پنل ممکن نشد.");
      }
      const [productData, orderData, discountData, statsData] = await Promise.all([
        productResponse.json() as Promise<{ products: Product[] }>,
        orderResponse.json() as Promise<{ orders: Order[] }>,
        discountResponse.json() as Promise<{ discounts: Discount[] }>,
        statsResponse.json() as Promise<{ stats: Stats }>,
      ]);
      setProducts(productData.products);
      setOrders(orderData.orders);
      setDiscounts(discountData.discounts);
      setStats(statsData.stats);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadData]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.active && product.stockQty <= 5),
    [products],
  );

  function startCreate() {
    setDraft({ ...emptyProduct, sortOrder: products.length + 1 });
    setImageFile(null);
    setEditorOpen(true);
  }

  function startEdit(product: Product) {
    setDraft({ ...product });
    setImageFile(null);
    setEditorOpen(true);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let imageUrl = draft.imageUrl;
      let imageKey = draft.imageKey;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadResponse = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const uploadData = (await uploadResponse.json()) as { url?: string; key?: string; error?: string };
        if (!uploadResponse.ok) throw new Error(uploadData.error || "آپلود تصویر ممکن نشد.");
        imageUrl = uploadData.url!;
        imageKey = uploadData.key!;
      }
      if (!imageUrl) throw new Error("تصویر محصول را انتخاب کنید.");
      const payload = { ...draft, imageUrl, imageKey };
      const response = await fetch(draft.id ? `/api/admin/products/${draft.id}` : "/api/admin/products", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "ذخیره محصول ممکن نشد.");
      setEditorOpen(false);
      setNotice(draft.id ? "محصول ویرایش شد" : "محصول جدید ساخته شد");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ذخیره محصول ممکن نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product: Product, field: "active" | "featured") {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !product[field] }),
    });
    await loadData();
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`محصول «${product.name}» حذف شود؟`)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (!response.ok) return setError("حذف محصول ممکن نشد.");
    setNotice("محصول حذف شد");
    await loadData();
  }

  async function removeOrder(order: Order) {
    if (!window.confirm(`سفارش ${order.orderNumber} حذف شود؟`)) return;
    await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
    setNotice("سفارش حذف شد");
    await loadData();
  }

  async function createNewDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discountForm),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) return setError(data.error || "ساخت کد ممکن نشد.");
    setDiscountForm({ code: "", type: "percent", value: 10, minOrder: 0 });
    setNotice("کد تخفیف ساخته شد");
    await loadData();
  }

  async function toggleDiscount(discount: Discount) {
    await fetch(`/api/admin/discounts/${discount.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !discount.active }),
    });
    await loadData();
  }

  async function removeDiscount(discount: Discount) {
    if (!window.confirm(`کد ${discount.code} حذف شود؟`)) return;
    await fetch(`/api/admin/discounts/${discount.id}`, { method: "DELETE" });
    setNotice("کد تخفیف حذف شد");
    await loadData();
  }

  const tabTitle = {
    overview: "گزارش فروش",
    products: "مدیریت محصولات",
    orders: "سفارش‌ها",
    discounts: "کدهای تخفیف",
  }[tab];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar glass-regular">
        <Link className="admin-logo" href="/"><img src="/brand/logo-burgundy.png" alt="Cookie Time" /></Link>
        <nav>
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><span>◫</span>گزارش</button>
          <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><span>◉</span>محصولات</button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><span>▤</span>سفارش‌ها</button>
          <button className={tab === "discounts" ? "active" : ""} onClick={() => setTab("discounts")}><span>٪</span>تخفیف‌ها</button>
        </nav>
        <div className="admin-profile"><span>{adminName.slice(0, 1)}</span><div><strong>{adminName}</strong><a href={signOutPath}>خروج از حساب</a></div></div>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div><span>پنل مدیریت Cookie Time</span><h1>{tabTitle}</h1></div>
          <div><Link href="/">مشاهده فروشگاه</Link>{tab === "products" && <button onClick={startCreate}>＋ محصول جدید</button>}</div>
        </header>

        {error && <div className="admin-error" role="alert"><span>{error}</span><button onClick={() => setError("")}>×</button></div>}
        {loading ? <div className="admin-loading">در حال آماده‌سازی پنل...</div> : (
          <>
            {tab === "overview" && stats && (
              <div className="admin-overview">
                <div className="stats-grid">
                  <article><span>فروش کل</span><strong>{nf.format(stats.revenue)} <small>تومان</small></strong><em>از سفارش‌های ثبت‌شده</em></article>
                  <article><span>تعداد سفارش</span><strong>{nf.format(stats.orderCount)}</strong><em>میانگین {nf.format(stats.averageOrder)} تومان</em></article>
                  <article><span>آیتم فروخته‌شده</span><strong>{nf.format(stats.itemCount)}</strong><em>{nf.format(stats.activeProducts)} محصول فعال</em></article>
                  <article className={stats.lowStock ? "warning" : ""}><span>موجودی کم</span><strong>{nf.format(stats.lowStock)}</strong><em>محصول با ۵ عدد یا کمتر</em></article>
                </div>
                <div className="overview-panels">
                  <article className="admin-panel">
                    <div className="panel-title"><h2>محصولات پرفروش</h2><span>بر اساس تعداد</span></div>
                    {stats.topProducts.length ? <ol className="top-products">{stats.topProducts.map((product, index) => <li key={product.name}><b>{nf.format(index + 1)}</b><span><strong>{product.name}</strong><small>{nf.format(product.revenue)} تومان فروش</small></span><em>{nf.format(product.quantity)} عدد</em></li>)}</ol> : <p className="panel-empty">هنوز سفارشی ثبت نشده است.</p>}
                  </article>
                  <article className="admin-panel">
                    <div className="panel-title"><h2>هشدار موجودی</h2><button onClick={() => setTab("products")}>مدیریت</button></div>
                    {lowStockProducts.length ? <ul className="stock-list">{lowStockProducts.map((product) => <li key={product.id}><img src={product.imageUrl} alt="" /><span>{product.name}</span><strong>{nf.format(product.stockQty)} عدد</strong></li>)}</ul> : <p className="panel-empty">موجودی همه محصولات مناسب است.</p>}
                  </article>
                </div>
              </div>
            )}

            {tab === "products" && (
              <div className="admin-panel product-management">
                <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>محصول</th><th>دسته</th><th>قیمت</th><th>موجودی</th><th>نمایش</th><th>ویژه</th><th></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={product.imageUrl} alt="" /><div><strong>{product.name}</strong><span>{product.weightLabel}</span></div></div></td><td>{categoryLabel(product.category)}</td><td>{nf.format(product.price)} تومان</td><td><span className={product.stockQty <= 5 ? "stock-low" : ""}>{nf.format(product.stockQty)}</span></td><td><button className={`status-toggle ${product.active ? "on" : ""}`} onClick={() => toggleProduct(product, "active")} aria-label="تغییر وضعیت نمایش"><span /></button></td><td><button className={`feature-button ${product.featured ? "on" : ""}`} onClick={() => toggleProduct(product, "featured")}>★</button></td><td><div className="row-actions"><button onClick={() => startEdit(product)}>ویرایش</button><button className="danger" onClick={() => removeProduct(product)}>حذف</button></div></td></tr>)}</tbody></table></div>
              </div>
            )}

            {tab === "orders" && (
              <div className="admin-panel orders-panel">
                {orders.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>شماره</th><th>مشتری</th><th>محصولات</th><th>مبلغ</th><th>زمان</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong dir="ltr">{order.orderNumber}</strong></td><td><div className="customer-cell"><strong>{order.customerName}</strong><a href={`tel:${order.customerPhone}`} dir="ltr">{order.customerPhone}</a>{order.note && <small>{order.note}</small>}</div></td><td><div className="order-items-cell">{order.items.map((item) => <span key={item.productId}>{nf.format(item.quantity)}× {item.name}</span>)}</div></td><td><strong>{nf.format(order.total)} تومان</strong>{order.discountAmount > 0 && <small className="discount-note">{nf.format(order.discountAmount)} تخفیف</small>}</td><td>{dtf.format(new Date(order.createdAt))}</td><td><button className="text-danger" onClick={() => removeOrder(order)}>حذف</button></td></tr>)}</tbody></table></div> : <p className="panel-empty large">هنوز سفارشی ثبت نشده است.</p>}
              </div>
            )}

            {tab === "discounts" && (
              <div className="discount-admin-grid">
                <form className="admin-panel discount-form" onSubmit={createNewDiscount}>
                  <div className="panel-title"><h2>ساخت کد جدید</h2></div>
                  <label>کد تخفیف<input required value={discountForm.code} onChange={(event) => setDiscountForm({ ...discountForm, code: event.target.value.toUpperCase() })} dir="ltr" placeholder="COOKIE10" /></label>
                  <label>نوع تخفیف<select value={discountForm.type} onChange={(event) => setDiscountForm({ ...discountForm, type: event.target.value })}><option value="percent">درصدی</option><option value="fixed">مبلغ ثابت</option></select></label>
                  <label>{discountForm.type === "percent" ? "درصد" : "مبلغ (تومان)"}<input required min="1" type="number" value={discountForm.value} onChange={(event) => setDiscountForm({ ...discountForm, value: Number(event.target.value) })} /></label>
                  <label>حداقل خرید (تومان)<input min="0" type="number" value={discountForm.minOrder} onChange={(event) => setDiscountForm({ ...discountForm, minOrder: Number(event.target.value) })} /></label>
                  <button type="submit">ساخت کد تخفیف</button>
                </form>
                <div className="admin-panel discount-list-panel">
                  <div className="panel-title"><h2>کدهای فعال</h2><span>{nf.format(discounts.length)} کد</span></div>
                  {discounts.length ? <div className="discount-list">{discounts.map((discount) => <article key={discount.id}><div><strong dir="ltr">{discount.code}</strong><span>{discount.type === "percent" ? `${nf.format(discount.value)}٪` : `${nf.format(discount.value)} تومان`} تخفیف</span><small>حداقل خرید: {nf.format(discount.minOrder)} تومان · {nf.format(discount.usageCount)} بار استفاده</small></div><div><button className={`status-toggle ${discount.active ? "on" : ""}`} onClick={() => toggleDiscount(discount)}><span /></button><button className="text-danger" onClick={() => removeDiscount(discount)}>حذف</button></div></article>)}</div> : <p className="panel-empty">هنوز کد تخفیفی ساخته نشده است.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {editorOpen && (
        <div className="admin-modal-backdrop" onMouseDown={() => setEditorOpen(false)}>
          <form className="product-editor glass-regular" onSubmit={saveProduct} onMouseDown={(event) => event.stopPropagation()}>
            <div className="editor-header"><div><span>{draft.id ? "ویرایش محصول" : "محصول تازه"}</span><h2>{draft.id ? draft.name : "ساخت محصول جدید"}</h2></div><button type="button" onClick={() => setEditorOpen(false)}>×</button></div>
            <div className="editor-grid">
              <label>نام محصول<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label>شناسه انگلیسی<input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} dir="ltr" placeholder="cookie-name" /></label>
              <label>قیمت (تومان)<input required min="0" type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} /></label>
              <label>موجودی<input required min="0" type="number" value={draft.stockQty} onChange={(event) => setDraft({ ...draft, stockQty: Number(event.target.value) })} /></label>
              <label>دسته<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ProductCategory })}><option value="cookie">کوکی</option><option value="jar">جارکیک</option><option value="cake">کیک</option></select></label>
              <label>وزن / اندازه<input required value={draft.weightLabel} onChange={(event) => setDraft({ ...draft, weightLabel: event.target.value })} /></label>
              <label className="editor-full">توضیحات<textarea required rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
              <label className="image-upload editor-full">تصویر محصول<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /><span>{imageFile ? imageFile.name : draft.imageUrl ? "برای تعویض تصویر، فایل جدید انتخاب کن" : "PNG یا JPG تا ۸ مگابایت"}</span>{draft.imageUrl && !imageFile && <img src={draft.imageUrl} alt="پیش‌نمایش" />}</label>
              <label className="check-label"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />نمایش در فروشگاه</label>
              <label className="check-label"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />محصول محبوب</label>
            </div>
            <div className="editor-actions"><button type="button" onClick={() => setEditorOpen(false)}>انصراف</button><button type="submit" disabled={saving}>{saving ? "در حال ذخیره..." : "ذخیره محصول"}</button></div>
          </form>
        </div>
      )}
      <div className={`toast ${notice ? "show" : ""}`} role="status">{notice}</div>
    </main>
  );
}

function categoryLabel(category: ProductCategory) {
  return category === "cookie" ? "کوکی" : category === "jar" ? "جارکیک" : "کیک";
}
