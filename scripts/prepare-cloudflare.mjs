import { readFile, writeFile } from "node:fs/promises";

const configPath = new URL("../wrangler.jsonc", import.meta.url);
const rawConfig = await readFile(configPath, "utf8");
const config = JSON.parse(rawConfig);

const database = config.d1_databases?.find((item) => item.binding === "DB");
const mediaBucket = config.r2_buckets?.find((item) => item.binding === "MEDIA");

if (!database?.database_id) {
  throw new Error(
    "Cloudflare D1 تنظیم نشده است. پس از wrangler login یک‌بار npm run cf:setup را اجرا کنید.",
  );
}
if (!mediaBucket?.bucket_name) {
  throw new Error(
    "Cloudflare R2 تنظیم نشده است. پس از wrangler login یک‌بار npm run cf:setup را اجرا کنید.",
  );
}

database.migrations_dir = "drizzle";
config.keep_vars = true;

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("Cloudflare bindings verified: DB, MEDIA");
