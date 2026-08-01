import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    "https://mywedding.events";

  return new URL(
    configuredUrl.startsWith("http") ? configuredUrl : `https://${configuredUrl}`,
  );
}

const siteUrl = getSiteUrl();
const coverImagePath = "/uploads/whatsapp-cover.jpg";
const coverImageUrl = new URL(coverImagePath, siteUrl).toString();
const previewImage = {
  url: coverImageUrl,
  width: 1200,
  height: 630,
  alt: "Karim and Mirna wedding invitation",
  type: "image/jpeg",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Karim & Mirna - Wedding Invitation",
  description:
    "Wedding invitation for Karim and Mirna on Sunday, September 20, 2026.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Karim & Mirna - Wedding Invitation",
    description:
      "Wedding invitation for Karim and Mirna on Sunday, September 20, 2026.",
    url: siteUrl.toString(),
    siteName: "Karim & Mirna Wedding Invitation",
    type: "website",
    locale: "en_US",
    images: [previewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karim & Mirna - Wedding Invitation",
    description:
      "Wedding invitation for Karim and Mirna on Sunday, September 20, 2026.",
    images: [previewImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f2ec",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Gulzar&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Libre+Baskerville:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ visibility: "hidden" }}>
        <noscript>
          <style>{`body{visibility:visible!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
