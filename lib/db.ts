import { env } from "cloudflare:workers";
import { seedProducts } from "./seed";
import type { Discount, Order, OrderItem, Product } from "./types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: Product["category"];
  weight_label: string;
  image_url: string;
  image_key: string | null;
  stock_qty: number;
  active: number;
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  business_name: string;
  business_type: string;
  area: string;
  customer_name: string;
  customer_phone: string;
  note: string;
  items_json: string;
  subtotal: number;
  discount_code: string | null;
  discount_amount: number;
  total: number;
  created_at: string;
};

type DiscountRow = {
  id: string;
  code: string;
  type: Discount["type"];
  value: number;
  min_order: number;
  active: number;
  usage_count: number;
  created_at: string;
};

let readyPromise: Promise<void> | null = null;

function getDatabase(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("پایگاه داده در دسترس نیست.");
  return db;
}

export function getMediaBucket(): R2Bucket {
  const bucket = (env as unknown as { MEDIA?: R2Bucket }).MEDIA;
  if (!bucket) throw new Error("فضای ذخیره‌سازی تصویر در دسترس نیست.");
  return bucket;
}

export async function ensureDatabase(): Promise<void> {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    const db = getDatabase();
    const statements = [
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT NOT NULL,
        weight_label TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_key TEXT,
        stock_qty INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        featured INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        business_name TEXT NOT NULL DEFAULT '',
        business_type TEXT NOT NULL DEFAULT 'کافه',
        area TEXT NOT NULL DEFAULT '',
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        items_json TEXT NOT NULL,
        subtotal INTEGER NOT NULL,
        discount_code TEXT,
        discount_amount INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS discounts (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        value INTEGER NOT NULL,
        min_order INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS products_active_sort_idx ON products(active, sort_order)",
      "CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS discounts_code_idx ON discounts(code)",
    ];
    await db.batch(statements.map((sql) => db.prepare(sql)));

    const orderColumns = await db.prepare("PRAGMA table_info(orders)").all<{ name: string }>();
    const existingOrderColumns = new Set(orderColumns.results.map((column) => column.name));
    const orderColumnMigrations: D1PreparedStatement[] = [];
    if (!existingOrderColumns.has("business_name")) {
      orderColumnMigrations.push(db.prepare("ALTER TABLE orders ADD COLUMN business_name TEXT NOT NULL DEFAULT ''"));
    }
    if (!existingOrderColumns.has("business_type")) {
      orderColumnMigrations.push(db.prepare("ALTER TABLE orders ADD COLUMN business_type TEXT NOT NULL DEFAULT 'کافه'"));
    }
    if (!existingOrderColumns.has("area")) {
      orderColumnMigrations.push(db.prepare("ALTER TABLE orders ADD COLUMN area TEXT NOT NULL DEFAULT ''"));
    }
    if (orderColumnMigrations.length) await db.batch(orderColumnMigrations);

    const now = new Date().toISOString();
    const seedStatements = seedProducts.map((product) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO products (
            id, name, slug, description, price, category, weight_label,
            image_url, image_key, stock_qty, active, featured, sort_order,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          product.id,
          product.name,
          product.slug,
          product.description,
          product.price,
          product.category,
          product.weightLabel,
          product.imageUrl,
          product.stockQty,
          product.active ? 1 : 0,
          product.featured ? 1 : 0,
          product.sortOrder,
          now,
          now,
        ),
    );
    if (seedStatements.length) await db.batch(seedStatements);
  })().catch((error) => {
    readyPromise = null;
    throw error;
  });

  return readyPromise;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    category: row.category,
    weightLabel: row.weight_label,
    imageUrl: row.image_url,
    imageKey: row.image_key,
    stockQty: row.stock_qty,
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    businessName: row.business_name,
    businessType: row.business_type,
    area: row.area,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    note: row.note,
    items: JSON.parse(row.items_json) as OrderItem[],
    subtotal: row.subtotal,
    discountCode: row.discount_code,
    discountAmount: row.discount_amount,
    total: row.total,
    createdAt: row.created_at,
  };
}

function mapDiscount(row: DiscountRow): Discount {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    minOrder: row.min_order,
    active: Boolean(row.active),
    usageCount: row.usage_count,
    createdAt: row.created_at,
  };
}

export async function listProducts(includeInactive = false): Promise<Product[]> {
  await ensureDatabase();
  const db = getDatabase();
  const query = includeInactive
    ? "SELECT * FROM products ORDER BY sort_order, created_at"
    : "SELECT * FROM products WHERE active = 1 ORDER BY sort_order, created_at";
  const result = await db.prepare(query).all<ProductRow>();
  return result.results.map(mapProduct);
}

export async function findProductsByIds(ids: string[]): Promise<Product[]> {
  await ensureDatabase();
  if (!ids.length) return [];
  const db = getDatabase();
  const placeholders = ids.map(() => "?").join(",");
  const result = await db
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND active = 1`)
    .bind(...ids)
    .all<ProductRow>();
  return result.results.map(mapProduct);
}

export async function createProduct(input: Omit<Product, "createdAt" | "updatedAt">): Promise<Product> {
  await ensureDatabase();
  const db = getDatabase();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO products (
        id, name, slug, description, price, category, weight_label, image_url,
        image_key, stock_qty, active, featured, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.name,
      input.slug,
      input.description,
      input.price,
      input.category,
      input.weightLabel,
      input.imageUrl,
      input.imageKey,
      input.stockQty,
      input.active ? 1 : 0,
      input.featured ? 1 : 0,
      input.sortOrder,
      now,
      now,
    )
    .run();
  return { ...input, createdAt: now, updatedAt: now };
}

export async function updateProduct(id: string, input: Partial<Product>): Promise<void> {
  await ensureDatabase();
  const db = getDatabase();
  const allowed: Record<string, string> = {
    name: "name",
    slug: "slug",
    description: "description",
    price: "price",
    category: "category",
    weightLabel: "weight_label",
    imageUrl: "image_url",
    imageKey: "image_key",
    stockQty: "stock_qty",
    active: "active",
    featured: "featured",
    sortOrder: "sort_order",
  };
  const entries = Object.entries(input).filter(([key, value]) => key in allowed && value !== undefined);
  if (!entries.length) return;
  const setters = entries.map(([key]) => `${allowed[key]} = ?`);
  const values = entries.map(([key, value]) =>
    key === "active" || key === "featured" ? (value ? 1 : 0) : value,
  );
  setters.push("updated_at = ?");
  values.push(new Date().toISOString());
  await db
    .prepare(`UPDATE products SET ${setters.join(", ")} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteProduct(id: string): Promise<string | null> {
  await ensureDatabase();
  const db = getDatabase();
  const row = await db.prepare("SELECT image_key FROM products WHERE id = ?").bind(id).first<{ image_key: string | null }>();
  await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return row?.image_key ?? null;
}

export async function getDiscount(code: string): Promise<Discount | null> {
  await ensureDatabase();
  const row = await getDatabase()
    .prepare("SELECT * FROM discounts WHERE code = ? AND active = 1")
    .bind(code.trim().toUpperCase())
    .first<DiscountRow>();
  return row ? mapDiscount(row) : null;
}

export function calculateDiscount(discount: Discount | null, subtotal: number): number {
  if (!discount || subtotal < discount.minOrder) return 0;
  const amount = discount.type === "percent"
    ? Math.floor((subtotal * Math.min(discount.value, 100)) / 100)
    : Math.min(discount.value, subtotal);
  return Math.max(0, amount);
}

export async function listDiscounts(): Promise<Discount[]> {
  await ensureDatabase();
  const result = await getDatabase()
    .prepare("SELECT * FROM discounts ORDER BY created_at DESC")
    .all<DiscountRow>();
  return result.results.map(mapDiscount);
}

export async function createDiscount(input: Omit<Discount, "id" | "usageCount" | "createdAt">): Promise<Discount> {
  await ensureDatabase();
  const db = getDatabase();
  const discount: Discount = {
    ...input,
    id: crypto.randomUUID(),
    code: input.code.trim().toUpperCase(),
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  await db
    .prepare("INSERT INTO discounts (id, code, type, value, min_order, active, usage_count, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)")
    .bind(
      discount.id,
      discount.code,
      discount.type,
      discount.value,
      discount.minOrder,
      discount.active ? 1 : 0,
      discount.createdAt,
    )
    .run();
  return discount;
}

export async function updateDiscount(id: string, input: Partial<Discount>): Promise<void> {
  await ensureDatabase();
  const db = getDatabase();
  const allowed: Record<string, string> = {
    code: "code",
    type: "type",
    value: "value",
    minOrder: "min_order",
    active: "active",
  };
  const entries = Object.entries(input).filter(([key, value]) => key in allowed && value !== undefined);
  if (!entries.length) return;
  const values = entries.map(([key, value]) => {
    if (key === "active") return value ? 1 : 0;
    if (key === "code" && typeof value === "string") return value.trim().toUpperCase();
    return value;
  });
  await db
    .prepare(`UPDATE discounts SET ${entries.map(([key]) => `${allowed[key]} = ?`).join(", ")} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteDiscount(id: string): Promise<void> {
  await ensureDatabase();
  await getDatabase().prepare("DELETE FROM discounts WHERE id = ?").bind(id).run();
}

export async function createOrder(input: {
  businessName: string;
  businessType: string;
  area: string;
  customerName: string;
  customerPhone: string;
  note: string;
  cart: { productId: string; quantity: number }[];
  discountCode?: string;
}): Promise<Order> {
  await ensureDatabase();
  const products = await findProductsByIds(input.cart.map((item) => item.productId));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const items: OrderItem[] = input.cart.map((cartItem) => {
    const product = productMap.get(cartItem.productId);
    if (!product) throw new Error("یکی از محصولات دیگر در دسترس نیست.");
    const quantity = Math.max(1, Math.min(999, Math.floor(cartItem.quantity)));
    if (product.stockQty < quantity) {
      throw new Error(`موجودی ${product.name} کافی نیست.`);
    }
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      lineTotal: product.price * quantity,
      wholesaleDiscountEligible: quantity > 20,
    };
  });
  if (!items.length) throw new Error("سبد خرید خالی است.");
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity < 10) throw new Error("حداقل سفارش همکاری ۱۰ عدد است.");

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = input.discountCode ? await getDiscount(input.discountCode) : null;
  if (input.discountCode && !discount) throw new Error("کد تخفیف معتبر نیست.");
  if (discount && subtotal < discount.minOrder) {
    throw new Error(`حداقل خرید برای این کد ${discount.minOrder.toLocaleString("fa-IR")} تومان است.`);
  }
  const discountAmount = calculateDiscount(discount, subtotal);
  const now = new Date();
  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: `CT-W-${now.toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    businessName: input.businessName.trim().slice(0, 100),
    businessType: input.businessType.trim().slice(0, 40),
    area: input.area.trim().slice(0, 100),
    customerName: input.customerName.trim().slice(0, 80),
    customerPhone: input.customerPhone.trim().slice(0, 20),
    note: input.note.trim().slice(0, 500),
    items,
    subtotal,
    discountCode: discount?.code ?? null,
    discountAmount,
    total: subtotal - discountAmount,
    createdAt: now.toISOString(),
  };
  const db = getDatabase();
  const operations = [
    db
      .prepare(
        "INSERT INTO orders (id, order_number, business_name, business_type, area, customer_name, customer_phone, note, items_json, subtotal, discount_code, discount_amount, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        order.id,
        order.orderNumber,
        order.businessName,
        order.businessType,
        order.area,
        order.customerName,
        order.customerPhone,
        order.note,
        JSON.stringify(order.items),
        order.subtotal,
        order.discountCode,
        order.discountAmount,
        order.total,
        order.createdAt,
      ),
    ...items.map((item) =>
      db
        .prepare("UPDATE products SET stock_qty = stock_qty - ?, updated_at = ? WHERE id = ? AND stock_qty >= ?")
        .bind(item.quantity, order.createdAt, item.productId, item.quantity),
    ),
  ];
  if (discount) {
    operations.push(
      db.prepare("UPDATE discounts SET usage_count = usage_count + 1 WHERE id = ?").bind(discount.id),
    );
  }
  await db.batch(operations);
  return order;
}

export async function listOrders(limit = 200): Promise<Order[]> {
  await ensureDatabase();
  const result = await getDatabase()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?")
    .bind(Math.min(Math.max(limit, 1), 500))
    .all<OrderRow>();
  return result.results.map(mapOrder);
}

export async function deleteOrder(id: string): Promise<void> {
  await ensureDatabase();
  await getDatabase().prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
}
