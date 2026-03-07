import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Toolkit Pro",
  description: "All-in-one PDF solution — 암호 해제, 병합, 분할, 추출, 회전",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#050505] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
