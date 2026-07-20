import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlassEngine } from "./glass-engine";
import { PwaRegister } from "./pwa-register";

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
  themeColor: "#751f39",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <GlassEngine />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
