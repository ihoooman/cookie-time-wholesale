# استقرار Cookie Time روی Cloudflare Workers

این پروژه با `vinext` برای Cloudflare Workers آماده شده است. به Cloudflare Images
نیاز ندارد؛ دیتابیس روی D1 و تصاویر آپلودی پنل روی R2 قرار می‌گیرند.

## ۱. ساخت منابع برای اولین بار

```bash
npm ci
npx wrangler login
npm run cf:setup
```

دستور آخر D1 با نام `cookie-time-wholesale` و R2 با نام `cookie-time-media` را
می‌سازد و شناسه واقعی آن‌ها را داخل `wrangler.jsonc` می‌نویسد. تغییر این فایل را
commit و push کنید؛ شناسه D1 محرمانه نیست.

## ۲. متغیرها و Secrets

در Worker > Settings > Variables and Secrets این دو مقدار را وارد کنید:

- `GOOGLE_CLIENT_ID`: شناسه OAuth Web گوگل
- `AUTH_SECRET`: رشته تصادفی حداقل ۳۲ کاراکتری و از نوع Secret

برای OAuth گوگل، دامنه نهایی Worker را در Authorized JavaScript origins قرار
دهید. `keep_vars` فعال است تا deployهای بعدی این مقادیر داشبورد را پاک نکنند.

## ۳. اتصال GitHub در Workers & Pages

ریپوی `ihoooman/cookie-time-wholesale` و شاخه `main` را متصل کنید و تنظیمات
Build را این‌طور قرار دهید:

- Root directory: `/`
- Build command: `npm run cf:build`
- Deploy command: `npm run cf:deploy`
- Non-production deploy command: `npx wrangler versions upload`
- Node version: `22`

`cf:deploy` قبل از انتشار، migrationهای پوشه `drizzle/` را روی D1 اجرا می‌کند و
سپس build آماده را با vinext روی Worker منتشر می‌کند.

## بررسی محلی

```bash
npm run test
npm run cf:dry-run
```
