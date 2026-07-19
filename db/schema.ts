import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  weightLabel: text("weight_label").notNull(),
  imageUrl: text("image_url").notNull(),
  imageKey: text("image_key"),
  stockQty: integer("stock_qty").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  note: text("note").notNull().default(""),
  itemsJson: text("items_json").notNull(),
  subtotal: integer("subtotal").notNull(),
  discountCode: text("discount_code"),
  discountAmount: integer("discount_amount").notNull().default(0),
  total: integer("total").notNull(),
  createdAt: text("created_at").notNull(),
});

export const discounts = sqliteTable("discounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: integer("value").notNull(),
  minOrder: integer("min_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
