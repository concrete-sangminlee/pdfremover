import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolkitApp from "../components/toolkit-app";
import { VALID_TOOLS, isValidTool, type Tool } from "../lib/config";

export const dynamicParams = false;

const META: Record<Tool, { titleKo: string; titleEn: string; descKo: string; descEn: string }> = {
  unlock: {
    titleKo: "PDF 암호 해제",
    titleEn: "Unlock PDF",
    descKo: "PDF 비밀번호와 제한을 즉시 해제합니다. 100% 무료, 브라우저에서 안전하게 처리.",
    descEn: "Remove PDF passwords and restrictions instantly. 100% free, processed safely in your browser.",
  },
  merge: {
    titleKo: "PDF 병합",
    titleEn: "Merge PDF",
    descKo: "여러 PDF 파일을 하나로 합칩니다. 드래그로 순서 변경 가능. 무료, 서버 업로드 없음.",
    descEn: "Combine multiple PDF files into one. Drag to reorder. Free, no server upload.",
  },
  split: {
    titleKo: "PDF 분할",
    titleEn: "Split PDF",
    descKo: "PDF를 페이지 범위별로 여러 파일로 나눕니다. 무료 온라인 PDF 분할 도구.",
    descEn: "Split PDF into multiple files by page ranges. Free online PDF splitter.",
  },
  extract: {
    titleKo: "PDF 페이지 추출",
    titleEn: "Extract PDF Pages",
    descKo: "PDF에서 원하는 페이지만 골라 추출합니다. 무료, 브라우저에서 처리.",
    descEn: "Extract specific pages from your PDF. Free, processed in your browser.",
  },
  rotate: {
    titleKo: "PDF 페이지 회전",
    titleEn: "Rotate PDF Pages",
    descKo: "PDF 페이지를 90°, 180°, 270° 회전합니다. 무료 온라인 도구.",
    descEn: "Rotate PDF pages by 90°, 180°, or 270°. Free online tool.",
  },
  compress: {
    titleKo: "PDF 최적화",
    titleEn: "Optimize PDF",
    descKo: "메타데이터 제거 및 구조 최적화로 PDF 파일을 경량화합니다. 무료.",
    descEn: "Strip metadata and optimize PDF structure to reduce file size. Free.",
  },
  watermark: {
    titleKo: "PDF 워터마크 추가",
    titleEn: "Add Watermark to PDF",
    descKo: "PDF에 텍스트 워터마크를 추가합니다. 크기, 각도, 투명도 조절 가능.",
    descEn: "Add text watermarks to PDF. Customize size, angle, and opacity.",
  },
  pagenum: {
    titleKo: "PDF 페이지 번호 추가",
    titleEn: "Add Page Numbers to PDF",
    descKo: "PDF에 자동으로 페이지 번호를 삽입합니다. 위치와 형식 선택 가능.",
    descEn: "Insert automatic page numbers into PDF. Choose position and format.",
  },
  delete: {
    titleKo: "PDF 페이지 삭제",
    titleEn: "Delete PDF Pages",
    descKo: "PDF에서 불필요한 페이지를 제거합니다. 무료 온라인 도구.",
    descEn: "Remove unwanted pages from PDF. Free online tool.",
  },
  imgresize: {
    titleKo: "이미지 리사이즈",
    titleEn: "Image Resize",
    descKo: "이미지 크기를 원하는 비율로 조절합니다. 확대/축소 모두 가능.",
    descEn: "Resize images to any scale. Enlarge or shrink.",
  },
  imgcompress: {
    titleKo: "이미지 압축",
    titleEn: "Image Compress",
    descKo: "이미지를 압축하여 파일 크기를 줄입니다. 품질 조절 가능.",
    descEn: "Compress images to reduce file size. Adjustable quality.",
  },
  pdftext: {
    titleKo: "PDF 텍스트 추출",
    titleEn: "Extract PDF Text",
    descKo: "PDF에서 텍스트를 추출합니다. 무료, 브라우저에서 처리.",
    descEn: "Extract text content from PDF files. Free, browser-based.",
  },
  docx2html: {
    titleKo: "DOCX 뷰어",
    titleEn: "DOCX Viewer",
    descKo: "Word 문서를 브라우저에서 바로 확인합니다. 서버 업로드 없이 안전하게.",
    descEn: "Preview Word documents directly in your browser. No server upload.",
  },
  pdf2img: {
    titleKo: "PDF를 이미지로 변환",
    titleEn: "PDF to Image",
    descKo: "PDF 페이지를 고화질 PNG 이미지로 변환합니다. 무료, 브라우저에서 처리.",
    descEn: "Convert PDF pages to high-quality PNG images. Free, browser-based.",
  },
  img2pdf: {
    titleKo: "이미지를 PDF로 변환",
    titleEn: "Image to PDF",
    descKo: "JPG, PNG, WebP 이미지를 하나의 PDF 파일로 변환합니다. 무료, 브라우저에서 처리.",
    descEn: "Convert JPG, PNG, WebP images into a single PDF file. Free, browser-based.",
  },
  imgstitch: {
    titleKo: "이미지 합치기",
    titleEn: "Image Stitch",
    descKo: "여러 이미지를 세로 또는 가로로 합칩니다.",
    descEn: "Combine multiple images vertically or horizontally.",
  },
  txt2pdf: {
    titleKo: "텍스트 → PDF",
    titleEn: "Text to PDF",
    descKo: "텍스트를 입력하여 PDF 파일을 만듭니다.",
    descEn: "Type or paste text to create a PDF file.",
  },
  imgconvert: {
    titleKo: "이미지 포맷 변환",
    titleEn: "Image Format Convert",
    descKo: "PNG, JPG, WebP 간 이미지 포맷을 변환합니다.",
    descEn: "Convert between PNG, JPG, and WebP image formats.",
  },
  html2pdf: {
    titleKo: "HTML → PDF 변환",
    titleEn: "HTML to PDF",
    descKo: "HTML 파일을 PDF로 변환합니다. 무료, 브라우저에서 처리.",
    descEn: "Convert HTML files to PDF. Free, browser-based.",
  },
  info: {
    titleKo: "PDF 정보 확인",
    titleEn: "PDF Info",
    descKo: "PDF 파일의 메타데이터와 상세 정보를 확인합니다.",
    descEn: "View PDF metadata and detailed file information.",
  },
};

export function generateStaticParams() {
  return VALID_TOOLS.map((tool) => ({ tool }));
}

export function generateMetadata({ params }: { params: { tool: string } }): Metadata {
  if (!isValidTool(params.tool)) {
    notFound();
  }

  const tool = params.tool;
  const meta = META[tool];

  return {
    title: meta.titleEn,
    description: meta.descEn,
    keywords: [
      meta.titleEn,
      meta.titleKo,
      ...(tool.startsWith("img") ? ["image tool", "free image tool", "online image converter"] : []),
      ...(["docx2html", "pdftext", "txt2pdf", "html2pdf"].includes(tool) ? ["document tool", "free document tool"] : []),
      ...(!tool.startsWith("img") && !["docx2html", "txt2pdf", "html2pdf"].includes(tool) ? ["PDF tool", "free PDF", "online PDF"] : []),
      "FileForge",
    ],
    openGraph: {
      type: "website",
      title: `${meta.titleEn} — FileForge`,
      description: meta.descEn,
      siteName: "FileForge",
    },
    twitter: {
      card: "summary",
      title: `${meta.titleEn} — FileForge`,
      description: meta.descEn,
    },
    alternates: {
      canonical: `/${tool}`,
    },
  };
}

export default function ToolPage({ params }: { params: { tool: string } }) {
  if (!isValidTool(params.tool)) notFound();

  return <ToolkitApp initialTool={params.tool} />;
}
