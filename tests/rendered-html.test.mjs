import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("storefront keeps the Persian WhatsApp checkout contract", async () => {
  const [storefront, layout, whatsapp, orderRoute] = await Promise.all([
    source("app/storefront.tsx"),
    source("app/layout.tsx"),
    source("lib/whatsapp.ts"),
    source("app/api/orders/route.ts"),
  ]);

  assert.match(layout, /<html lang="fa" dir="rtl">/);
  assert.match(storefront, /ثبت و ارسال سفارش در واتساپ/);
  assert.match(storefront, /نام و نام خانوادگی/);
  assert.match(storefront, /شماره موبایل/);
  assert.doesNotMatch(storefront, /آدرس|تحویل|کد پستی/);
  assert.match(whatsapp, /989128505124/);
  assert.match(orderRoute, /buildWhatsAppUrl/);
});

test("deployment includes persistent storage, real media, and social metadata", async () => {
  const [hosting, schema, migration, seed, layout] = await Promise.all([
    source(".openai/hosting.json"),
    source("db/schema.ts"),
    source("drizzle/0000_regular_overlord.sql"),
    source("lib/seed.ts"),
    source("app/layout.tsx"),
  ]);

  const hostingConfig = JSON.parse(hosting);
  assert.equal(hostingConfig.d1, "DB");
  assert.equal(hostingConfig.r2, "MEDIA");
  assert.match(schema, /sqliteTable\("products"/);
  assert.match(schema, /sqliteTable\("orders"/);
  assert.match(schema, /sqliteTable\("discounts"/);
  assert.match(migration, /CREATE TABLE `products`/);
  assert.match(seed, /p-cookie-nutella/);
  assert.match(layout, /\/og\.png/);

  await Promise.all([
    access(new URL("public/og.png", root)),
    access(new URL("public/products/cookie-nutella.png", root)),
    access(new URL("public/brand/logo-burgundy.png", root)),
    access(new URL("public/manifest.webmanifest", root)),
  ]);
});
