import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("storefront enforces the Persian wholesale WhatsApp contract", async () => {
  const [storefront, layout, whatsapp, orderRoute, database] = await Promise.all([
    source("app/storefront.tsx"),
    source("app/layout.tsx"),
    source("lib/whatsapp.ts"),
    source("app/api/orders/route.ts"),
    source("lib/db.ts"),
  ]);

  assert.match(layout, /<html lang="fa" dir="rtl">/);
  assert.match(storefront, /منوی همکاری کافه‌ها/);
  assert.match(storefront, /نام کافه یا مجموعه/);
  assert.match(storefront, /منطقه \/ محله/);
  assert.match(storefront, /شماره موبایل/);
  assert.doesNotMatch(storefront, /آدرس|تحویل|کد پستی/);
  assert.match(storefront, /حداقل سفارش/);
  assert.match(storefront, /بیش از ۲۰ عدد/);
  assert.match(storefront, /۷۲ ساعت/);
  assert.match(whatsapp, /989128505124/);
  assert.match(whatsapp, /هزینه ارسال جداگانه/);
  assert.match(orderRoute, /buildWhatsAppUrl/);
  assert.match(orderRoute, /businessName/);
  assert.match(database, /حداقل سفارش همکاری ۱۰ عدد/);
});

test("admin uses verified Google sign-in for the single approved account", async () => {
  const [admin, login, sessionRoute] = await Promise.all([
    source("lib/admin.ts"),
    source("app/admin/login/google-login.tsx"),
    source("app/api/auth/google/session/route.ts"),
  ]);

  assert.match(admin, /hoomihooman@gmail\.com/);
  assert.match(admin, /createRemoteJWKSet/);
  assert.match(admin, /email_verified/);
  assert.match(login, /accounts\.google\.com\/gsi\/client/);
  assert.match(sessionRoute, /verifyGoogleCredential/);
});

test("deployment includes persistent storage, real media, and social metadata", async () => {
  const [hosting, schema, migration, wholesaleMigration, seed, layout] = await Promise.all([
    source(".openai/hosting.json"),
    source("db/schema.ts"),
    source("drizzle/0000_regular_overlord.sql"),
    source("drizzle/0001_wonderful_expediter.sql"),
    source("lib/seed.ts"),
    source("app/layout.tsx"),
  ]);

  const hostingConfig = JSON.parse(hosting);
  assert.equal(hostingConfig.d1, "DB");
  // The existing Sites deployment keeps its managed R2 binding; direct Cloudflare
  // deployments use the free MEDIA_KV binding verified below.
  assert.equal(hostingConfig.r2, "MEDIA");
  assert.match(schema, /sqliteTable\("products"/);
  assert.match(schema, /sqliteTable\("orders"/);
  assert.match(schema, /sqliteTable\("discounts"/);
  assert.match(migration, /CREATE TABLE `products`/);
  assert.match(wholesaleMigration, /business_name/);
  assert.match(seed, /p-cookie-nutella/);
  assert.match(layout, /\/og-wholesale\.webp/);

  await Promise.all([
    access(new URL("public/og-wholesale.webp", root)),
    access(new URL("public/products/cookie-nutella.webp", root)),
    access(new URL("public/brand/logo-burgundy.png", root)),
    access(new URL("public/manifest.webmanifest", root)),
  ]);
});

test("Cloudflare Workers deployment is reproducible from GitHub", async () => {
  const [wrangler, worker, packageJson, guide, prepareScript] = await Promise.all([
    source("wrangler.jsonc"),
    source("worker/index.ts"),
    source("package.json"),
    source("CLOUDFLARE.md"),
    source("scripts/prepare-cloudflare.mjs"),
  ]);

  assert.match(wrangler, /cookie-time-wholesale/);
  assert.match(wrangler, /"keep_vars": true/);
  assert.match(wrangler, /seller\.time-cookie\.com/);
  assert.match(wrangler, /"custom_domain": true/);
  assert.match(wrangler, /"binding": "MEDIA_KV"/);
  assert.match(worker, /DB: D1Database/);
  assert.match(worker, /MEDIA_KV: KVNamespace/);
  assert.match(packageJson, /"cf:deploy"/);
  assert.match(packageJson, /CLOUDFLARE_DIRECT_DEPLOY=1/);
  assert.match(prepareScript, /migrations_dir/);
  assert.match(prepareScript, /kv_namespaces/);
  assert.match(guide, /Workers & Pages/);
});
