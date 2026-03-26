import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "FileForge — Free Online PDF Tools",
    template: "%s — FileForge",
  },
  description:
    "Free online document toolkit with 20+ tools. PDF unlock, merge, split, compress, watermark. Image convert, resize, compress, stitch. DOCX viewer, text extraction. 100% browser-based, no server uploads.",
  keywords: [
    "PDF", "PDF tool", "PDF editor", "PDF unlock", "PDF merge",
    "PDF split", "PDF compress", "PDF watermark", "PDF page numbers",
    "PDF password remover", "free PDF tool", "online PDF editor",
    "image converter", "image compress", "image resize", "WebP converter",
    "DOCX viewer", "HTML to PDF", "text to PDF", "document toolkit",
    "무료 PDF", "PDF 암호 해제", "PDF 병합", "PDF 분할", "PDF 압축",
    "이미지 변환", "이미지 압축", "문서 도구",
  ],
  authors: [{ name: "FileForge" }],
  creator: "FileForge",
  publisher: "FileForge",
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pdfcontrol.vercel.app"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    siteName: "FileForge",
    title: "FileForge — Free Online Document Toolkit",
    description: "20+ free tools for PDF, images & documents. Unlock, merge, split, convert — all in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FileForge",
    description: "20+ free document tools — PDF, images & more. 100% browser-based, zero uploads.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "FileForge",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var d=localStorage.getItem('pdftk_dark');if(d==='true'||(d===null&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "FileForge",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web Browser",
              description: "All-in-one document solution with 20+ professional tools for PDF, image, and document processing",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              featureList: [
                "PDF Unlock", "PDF Merge", "PDF Split", "Page Extraction", "Page Rotation",
                "PDF Optimization", "Text Watermark", "Page Numbers", "Page Deletion", "PDF Info",
                "Image to PDF", "PDF to Image", "DOCX Viewer", "PDF Text Extraction",
                "Image Compress", "Image Resize", "Image Stitch", "Image Convert",
                "Text to PDF", "HTML to PDF"
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
