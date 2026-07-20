import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

async function builtStyles() {
  const assets = new URL("dist/client/assets/", root);
  const names = await readdir(assets);
  const styles = names.filter((name) => name.endsWith(".css"));
  return Promise.all(styles.map((name) => readFile(new URL(name, assets), "utf8")))
    .then((files) => files.join("\n"));
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

test("admin supports restricted Google and password sign-in", async () => {
  const [admin, googleLogin, googleSessionRoute, passwordLogin, passwordSessionRoute] = await Promise.all([
    source("lib/admin.ts"),
    source("app/admin/login/google-login.tsx"),
    source("app/api/auth/google/session/route.ts"),
    source("app/admin/login/password-login.tsx"),
    source("app/api/auth/password/session/route.ts"),
  ]);

  assert.match(admin, /hoomihooman@gmail\.com/);
  assert.match(admin, /createRemoteJWKSet/);
  assert.match(admin, /email_verified/);
  assert.match(admin, /ADMIN_PASSWORD/);
  assert.match(admin, /timingSafeEqual/);
  assert.match(admin, /MAX_LOGIN_ATTEMPTS = 5/);
  assert.match(googleLogin, /accounts\.google\.com\/gsi\/client/);
  assert.match(googleSessionRoute, /verifyGoogleCredential/);
  assert.match(passwordLogin, /autocomplete="current-password"/i);
  assert.match(passwordSessionRoute, /verifyPasswordCredential/);
  assert.match(passwordSessionRoute, /Retry-After/);
  assert.doesNotMatch(admin + passwordLogin + passwordSessionRoute, /hoomanhooman/i);
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

test("liquid glass is tuned independently for Safari and Chromium", async () => {
  const [styles, glassEngine, productionStyles] = await Promise.all([
    source("app/globals.css"),
    source("app/glass-engine.tsx"),
    builtStyles(),
  ]);

  assert.match(styles, /--glass-regular-blur: 18px/);
  assert.match(styles, /--glass-clear-blur: 10px/);
  assert.match(styles, /--glass-button-blur: 12px/);
  assert.match(styles, /--glass-card-blur: 20px/);
  assert.match(styles, /html\[data-glass-engine="safari"\]/);
  assert.match(styles, /--glass-regular-blur: 12px/);
  assert.match(styles, /--glass-clear-blur: 5px/);
  assert.match(styles, /--glass-button-blur: 10px/);
  assert.match(styles, /--glass-card-blur: 14px/);
  assert.match(glassEngine, /dataset\.glassEngine = isSafari \? "safari" : "chromium"/);
  assert.match(productionStyles, /(?:^|[;{])backdrop-filter:\s*blur\(var\(--glass-clear-blur\)\)/);
  assert.match(productionStyles, /-webkit-backdrop-filter:\s*blur\(var\(--glass-clear-blur\)\)/);
});

test("public catalog ships complete technical and content SEO", async () => {
  const [layout, homepage, storefront, sitemap, robots, productPage, worker, adminLayout] = await Promise.all([
    source("app/layout.tsx"),
    source("app/page.tsx"),
    source("app/storefront.tsx"),
    source("app/sitemap.ts"),
    source("app/robots.ts"),
    source("app/products/[slug]/page.tsx"),
    source("worker/index.ts"),
    source("app/admin/layout.tsx"),
  ]);

  assert.match(layout, /https:\/\/seller\.time-cookie\.com/);
  assert.match(layout, /سفارش عمده کوکی و دسر در تهران/);
  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(layout, /"max-image-preview": "large"/);
  assert.match(homepage, /"@type": "Organization"/);
  assert.match(homepage, /"@type": "ItemList"/);
  assert.match(homepage, /initialProducts=\{products\}/);
  assert.match(storefront, /<span>سفارش عمده<\/span><span>کوکی و دسر<\/span>/);
  assert.match(storefront, /سفارش عمده کوکی و دسر در تهران/);
  assert.match(storefront, /href=\{`\/products\/\$\{product\.slug\}`\}/);
  assert.match(sitemap, /products\/\$\{encodeURIComponent\(product\.slug\)\}/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(robots, /"\/admin"/);
  assert.match(productPage, /"@type": "Product"/);
  assert.match(productPage, /priceCurrency: "IRR"/);
  assert.match(productPage, /product\.price \* 10/);
  assert.match(adminLayout, /index: false/);
  assert.match(worker, /X-Robots-Tag/);
});
