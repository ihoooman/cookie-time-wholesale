# Cookie Time — سفارش همکاری کافه‌ها

وب‌اپ فارسی و راست‌چین Cookie Time برای ثبت سفارش عمده کافه‌ها، ذخیره سفارش
در دیتابیس و ارسال متن آماده سفارش به واتساپ.

## امکانات

- منوی همکاری واقعی با عکس، قیمت، وزن و موجودی
- حداقل سفارش ۱۰ عدد، اعلام تخفیف همکاری برای بیش از ۲۰ عدد از هر محصول
- زمان آماده‌سازی استاندارد ۴۸ ساعت و هشدار ۷۲ ساعته برای سفارش‌های بالای ۵۰ عدد
- لینک واتساپ با متن کامل سفارش برای شماره مجموعه
- پنل مدیریت محصولات، عکس‌ها، موجودی، سفارش‌ها و کد تخفیف
- ورود Google فقط برای `hoomihooman@gmail.com`
- گزارش فروش و محصولات پرفروش
- PWA قابل نصب با طراحی موبایل‌محور و Liquid Glass
- Cloudflare D1 برای داده‌ها و Workers KV رایگان برای تصاویر آپلودی

## اجرا

```bash
npm install
npm run dev
```

فایل `.env.example` را به `.env.local` کپی و این دو مقدار را تنظیم کنید:

```env
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
AUTH_SECRET=a-random-secret-with-at-least-32-characters
```

در Google Cloud یک OAuth Client از نوع **Web application** بسازید و origin دامنه
سایت را در Authorized JavaScript origins قرار دهید. توکن Google در سرور با کلیدهای
عمومی Google بررسی می‌شود و فقط ایمیل مدیر پذیرفته خواهد شد.

## اعتبارسنجی

```bash
npm run lint
npm run test
npm run db:generate
```

برای استقرار مستقیم، bindingهای Cloudflare با نام‌های `DB` (D1) و `MEDIA_KV`
(Workers KV) و همین دو متغیر محیطی لازم‌اند. شماره مقصد واتساپ در
`lib/whatsapp.ts` تعریف شده است.

راهنمای اتصال مستقیم GitHub به Cloudflare Workers & Pages در
[`CLOUDFLARE.md`](./CLOUDFLARE.md) قرار دارد.
