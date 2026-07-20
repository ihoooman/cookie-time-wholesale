import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlassEngine } from "./glass-engine";
import { PwaRegister } from "./pwa-register";
import { ThemeSwitcher } from "./theme-switcher";

const metadataBase = new URL("https://seller.time-cookie.com");
const description =
  "سفارش عمده کوکی، جارکیک و کیک دست‌ساز Cookie Time برای کافه‌ها و مجموعه‌های تهران؛ قیمت همکاری، تولید روزانه و ثبت مستقیم سفارش در واتساپ.";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "سفارش عمده کوکی و دسر در تهران | Cookie Time",
    template: "%s | Cookie Time",
  },
  description,
  keywords: [
    "سفارش عمده کوکی",
    "خرید عمده کوکی",
    "کوکی برای کافه",
    "دسر عمده تهران",
    "جارکیک عمده",
    "Cookie Time",
  ],
  alternates: { canonical: "/" },
  category: "مواد غذایی و دسر عمده",
  creator: "Cookie Time",
  publisher: "Cookie Time",
  manifest: "/manifest.webmanifest",
  applicationName: "Cookie Time",
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cookie Time",
  },
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    title: "سفارش عمده کوکی و دسر در تهران | Cookie Time",
    description,
    siteName: "Cookie Time",
    images: [
      {
        url: "/og-wholesale.webp",
        width: 1200,
        height: 630,
        alt: "منوی سفارش عمده کوکی و دسر Cookie Time",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سفارش عمده کوکی و دسر | Cookie Time",
    description,
    images: ["/og-wholesale.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#751f39" },
    { media: "(prefers-color-scheme: dark)", color: "#140b0f" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

const themeBootstrap = `(() => {
  try {
    const saved = localStorage.getItem("cookie-time-theme");
    const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const theme = mode === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    const root = document.documentElement;
    root.dataset.themeMode = mode;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch {
    const root = document.documentElement;
    const theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.dataset.themeMode = "system";
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <GlassEngine />
        <ThemeSwitcher />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
