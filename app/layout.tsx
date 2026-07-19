import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const description =
    "منوی همکاری Cookie Time برای سفارش عمده کوکی و دسر دست‌ساز ویژه کافه‌ها؛ تولید روزانه و ثبت مستقیم در واتساپ.";

  return {
    metadataBase,
    title: {
      default: "Cookie Time | سفارش عمده برای کافه‌ها",
      template: "%s | Cookie Time",
    },
    description,
    manifest: "/manifest.webmanifest",
    applicationName: "Cookie Time",
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
      title: "Cookie Time | منوی همکاری کافه‌ها",
      description,
      siteName: "Cookie Time",
      images: [
        {
          url: new URL("/og-wholesale.png", metadataBase),
          width: 1200,
          height: 630,
          alt: "Cookie Time — یه گاز تا حال خوب",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Cookie Time | منوی همکاری کافه‌ها",
      description,
      images: [new URL("/og-wholesale.png", metadataBase)],
    },
  };
}

export const viewport = {
  themeColor: "#751f39",
  colorScheme: "light",
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
