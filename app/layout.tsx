import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "PDF Toolkit Pro — Free Online PDF Tools",
    template: "%s — PDF Toolkit Pro",
  },
  description:
    "Free online PDF tools. Unlock, merge, split, extract, rotate, compress, add watermarks and page numbers. 100% browser-based. No upload to servers.",
  keywords: [
    "PDF", "PDF tool", "PDF editor", "PDF unlock", "PDF merge",
    "PDF split", "PDF compress", "PDF watermark", "PDF page numbers",
    "PDF password remover", "free PDF tool", "online PDF editor",
    "무료 PDF", "PDF 암호 해제", "PDF 병합", "PDF 분할", "PDF 압축",
  ],
  authors: [{ name: "PDF Toolkit Pro" }],
  creator: "PDF Toolkit Pro",
  publisher: "PDF Toolkit Pro",
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pdfcontrol.vercel.app"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    siteName: "PDF Toolkit Pro",
    title: "PDF Toolkit Pro — Free Online PDF Tools",
    description: "Free online PDF tools — unlock, merge, split, compress, watermark and more. 100% browser-based.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Toolkit Pro",
    description: "Free online PDF tools — processed safely in your browser",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "PDF Toolkit",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "PDF Toolkit Pro",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web Browser",
              description: "All-in-one PDF solution with 10 professional tools",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              featureList: ["PDF Unlock", "PDF Merge", "PDF Split", "Page Extraction", "Page Rotation", "PDF Optimization", "Text Watermark", "Page Numbers", "Page Deletion", "PDF Info"],
            }),
          }}
        />
      </head>
      <body className="bg-white text-gray-900 antialiased" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
