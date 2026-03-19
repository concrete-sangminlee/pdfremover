"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TOOLS, VALID_TOOLS, type Tool, type View, type Lang } from "../lib/config";

// Lazy-load pdf-lib and jszip — only when user actually uses a tool (~325KB saved on homepage)
let _pdfLib: typeof import("pdf-lib") | null = null;
async function getPdfLib() {
  if (!_pdfLib) _pdfLib = await import("pdf-lib");
  return _pdfLib;
}

interface HistoryItem {
  time: string;
  action: string;
  file: string;
  ok: boolean;
}

interface PdfInfo {
  pages: number;
  title: string;
  author: string;
  creator: string;
  producer: string;
  encrypted: boolean;
  size: number;
}

// ━━━ i18n ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const T: Record<Lang, Record<string, string>> = {
  ko: {
    heroTag: "All-in-One PDF Solution",
    heroTitle1: "PDF Toolkit",
    heroTitle2: "Pro",
    heroSub: "암호 해제, 병합, 분할, 압축, 워터마크까지\n브라우저에서 안전하고 빠르게 처리하세요",
    tools: "Tools",
    privacy: "Private",
    processed: "Processed",
    whyTitle: "Why PDF Toolkit Pro",
    faqTitle: "FAQ",
    recentTitle: "Recent Activity",
    compareTitle: "다른 도구와 비교",
    compareFeature: "기능",
    compareUs: "PDF Toolkit Pro",
    compareOthers: "일반 PDF 도구",
    cmpPrivacy: "100% 브라우저 처리",
    cmpUpload: "서버 업로드 불필요",
    cmpFree: "완전 무료 (제한 없음)",
    cmpSignup: "회원가입 불필요",
    cmpSpeed: "오프라인에서도 작동",
    deleteConfirm: "정말 선택한 페이지를 삭제하시겠습니까?",
    allTools: "모든 도구",
    execute: "실행",
    processing: "처리 중...",
    download: "다운로드",
    downloadZip: "개 파일 다운로드 (ZIP)",
    uploadHint: "PDF 파일을 드래그하거나",
    uploadClick: "클릭",
    uploadSuffix: "하여 업로드",
    multiHint: "여러 파일 선택 가능",
    addMore: "클릭하여 파일 추가",
    footer1: "모든 처리는 브라우저에서 이루어지며 서버에 저장되지 않습니다",
    footer2: "No data collection · No cookies",
    heroCta: "가장 인기 있는 도구로 시작하기",
    heroCtaSub: "모든 도구 보기",
    rating: "4.8/5",
    ratingText: "사용자 만족도",
    howTitle: "간단한 3단계",
    how1: "PDF 파일 업로드",
    how1Desc: "파일을 드래그하거나 클릭하여 선택하세요",
    how2: "설정 조정",
    how2Desc: "필요한 옵션을 선택하세요",
    how3: "결과 다운로드",
    how3Desc: "처리 완료 후 즉시 다운로드하세요",
    securityNote: "파일은 브라우저에서만 처리됩니다. 서버에 업로드되지 않습니다.",
    relatedTools: "다른 도구도 필요하세요?",
    footerTools: "도구",
    footerResources: "리소스",
    footerLegal: "법적 고지",
    footerFaq: "자주 묻는 질문",
    footerPrivacy: "개인정보 처리",
    footerTerms: "이용약관",
    footerContact: "문의하기",
    footerAbout: "서비스 소개",
    mergeWarn: "2개 이상의 파일을 업로드해주세요.",
    rangeMode: "범위 지정",
    allPages: "모든 페이지 개별",
    rangePlaceholder: "예: 1-3, 4-6, 7-10",
    pagesPlaceholder: "예: 1, 3, 5, 7-10",
    rotAngle: "회전 각도",
    rotScope: "적용 범위",
    rotAll: "전체",
    rotSpecific: "특정",
    rotPagesPlaceholder: "예: 1, 3, 5",
    wmText: "워터마크 텍스트",
    wmSize: "크기",
    wmOpacity: "투명도",
    wmAngle: "각도",
    wmLayout: "배치",
    wmCenter: "중앙",
    wmDiagonal: "대각선",
    wmTiled: "반복 패턴",
    pnFormat: "형식",
    pnSize: "글자 크기",
    pnPosition: "위치",
    pnBL: "하단 좌",
    pnBC: "하단 중앙",
    pnBR: "하단 우",
    pnTC: "상단 중앙",
    pnTR: "상단 우",
    deletePlaceholder: "삭제할 페이지 (예: 2, 5, 8-10)",
    infoInvalid: "PDF 정보를 읽을 수 없습니다.",
    extractInvalid: "유효한 페이지 번호를 입력해주세요.",
    compressAlready: "이 파일은 이미 최적화되어 있어 추가 압축이 어렵습니다.",
    compressSaved: "절약!",
    compressPercent: "감소",
    original: "원본",
    compressed: "압축 후",
    saved: "절약",
    metadata: "메타데이터",
    metaTitle: "제목",
    metaAuthor: "저자",
    metaCreator: "생성 프로그램",
    metaProducer: "프로듀서",
    encWarning: "이 PDF는 암호로 보호되어 있습니다.",
    dragReorder: "드래그하여 순서 변경",
    infoPages: "페이지",
    infoSize: "크기",
    infoEncrypted: "암호화",
    infoPerPage: "페이지당",
    // Features
    feat1Title: "100% 프라이버시",
    feat1Desc: "모든 처리가 브라우저에서 이루어집니다. 파일이 서버로 전송되지 않습니다.",
    feat2Title: "초고속 처리",
    feat2Desc: "서버 대기 없이 즉시 처리됩니다. 인터넷 속도에 영향받지 않습니다.",
    feat3Title: "설치 불필요",
    feat3Desc: "웹 브라우저만 있으면 됩니다. Windows, Mac, Linux, 모바일 모두 지원.",
    feat4Title: "완전 무료",
    feat4Desc: "모든 기능을 제한 없이 무료로 사용할 수 있습니다. 회원가입 불필요.",
    // FAQ
    faq1Q: "파일이 안전한가요?",
    faq1A: "네, 모든 PDF 처리는 여러분의 브라우저 내에서 이루어집니다. 파일은 절대 외부 서버로 전송되지 않으며, 페이지를 닫으면 모든 데이터가 즉시 삭제됩니다.",
    faq2Q: "파일 크기 제한이 있나요?",
    faq2A: "서버 업로드가 없으므로 공식적인 제한은 없습니다. 다만 매우 큰 파일(100MB 이상)의 경우 브라우저 메모리에 따라 처리 속도가 달라질 수 있습니다.",
    faq3Q: "어떤 PDF 암호를 해제할 수 있나요?",
    faq3A: "소유자 비밀번호(인쇄, 복사, 편집 제한)가 설정된 PDF의 제한을 해제할 수 있습니다. 열기 비밀번호(사용자 암호)가 있는 경우에는 해당 비밀번호를 입력해야 합니다.",
    faq4Q: "모바일에서도 사용할 수 있나요?",
    faq4A: "네, 모든 기능이 모바일 브라우저에서도 완벽하게 동작합니다. 반응형 디자인으로 어떤 화면 크기에서든 편리하게 사용할 수 있습니다.",
    // Trust
    trust1: "브라우저 내 처리",
    trust2: "서버 전송 없음",
    trust3: "회원가입 불필요",
    trust4: "완전 무료",
    // Tools
    unlockLabel: "암호 해제",
    unlockDesc: "PDF 비밀번호 및 제한을 즉시 제거합니다",
    mergeLabel: "PDF 병합",
    mergeDesc: "여러 PDF를 하나의 파일로 합칩니다",
    splitLabel: "PDF 분할",
    splitDesc: "페이지 범위별로 PDF를 나눕니다",
    extractLabel: "페이지 추출",
    extractDesc: "원하는 페이지만 골라 추출합니다",
    rotateLabel: "페이지 회전",
    rotateDesc: "원하는 각도로 페이지를 회전합니다",
    compressLabel: "PDF 최적화",
    compressDesc: "메타데이터 제거 및 구조 최적화로 파일을 경량화합니다",
    watermarkLabel: "워터마크",
    watermarkDesc: "텍스트 워터마크를 추가합니다",
    pagenumLabel: "페이지 번호",
    pagenumDesc: "자동으로 페이지 번호를 삽입합니다",
    deleteLabel: "페이지 삭제",
    deleteDesc: "불필요한 페이지를 제거합니다",
    infoLabel: "PDF 정보",
    infoDesc: "파일 메타데이터를 확인합니다",
    // Dynamic messages
    msgUnlocked: "암호 해제가 완료되었습니다!",
    msgMerged: "개 파일이 병합되었습니다",
    msgMergedPages: "총 {n}페이지",
    msgSplit: "개 파일로 분할 완료!",
    msgExtracted: "페이지 추출 완료!",
    msgRotated: "회전 완료!",
    msgWatermarked: "워터마크가 추가되었습니다!",
    msgNumbered: "페이지에 번호가 추가되었습니다!",
    msgDeleteAll: "모든 페이지를 삭제할 수 없습니다.",
    msgDeleted: "페이지 삭제 완료!",
    msgRemaining: "페이지 남음",
    msgError: "처리 중 오류가 발생했습니다.",
  },
  en: {
    heroTag: "All-in-One PDF Solution",
    heroTitle1: "PDF Toolkit",
    heroTitle2: "Pro",
    heroSub: "Unlock, merge, split, compress, watermark and more\nSafely processed right in your browser",
    tools: "Tools",
    privacy: "Private",
    processed: "Processed",
    whyTitle: "Why PDF Toolkit Pro",
    faqTitle: "FAQ",
    recentTitle: "Recent Activity",
    compareTitle: "Compare with others",
    compareFeature: "Feature",
    compareUs: "PDF Toolkit Pro",
    compareOthers: "Typical PDF tools",
    cmpPrivacy: "100% browser processing",
    cmpUpload: "No server upload needed",
    cmpFree: "Completely free (no limits)",
    cmpSignup: "No sign-up required",
    cmpSpeed: "Works offline too",
    deleteConfirm: "Are you sure you want to delete the selected pages?",
    allTools: "All Tools",
    execute: "Execute",
    processing: "Processing...",
    download: "Download",
    downloadZip: " files download (ZIP)",
    uploadHint: "Drag PDF files here or",
    uploadClick: "click",
    uploadSuffix: "to upload",
    multiHint: "Multiple files supported",
    addMore: "Click to add more files",
    footer1: "All processing happens in your browser. No data is stored on any server.",
    footer2: "No data collection · No cookies",
    heroCta: "Start with the most popular tool",
    heroCtaSub: "View all tools",
    rating: "4.8/5",
    ratingText: "User satisfaction",
    howTitle: "3 Simple Steps",
    how1: "Upload your PDF",
    how1Desc: "Drag and drop or click to select your file",
    how2: "Adjust settings",
    how2Desc: "Choose the options you need",
    how3: "Download result",
    how3Desc: "Get your processed file instantly",
    securityNote: "Your files never leave your device. All processing happens in your browser.",
    relatedTools: "You might also need",
    footerTools: "Tools",
    footerResources: "Resources",
    footerLegal: "Legal",
    footerFaq: "FAQ",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",
    footerContact: "Contact",
    footerAbout: "About",
    mergeWarn: "Please upload 2 or more files.",
    rangeMode: "By Range",
    allPages: "Every Page",
    rangePlaceholder: "e.g. 1-3, 4-6, 7-10",
    pagesPlaceholder: "e.g. 1, 3, 5, 7-10",
    rotAngle: "Rotation",
    rotScope: "Scope",
    rotAll: "All",
    rotSpecific: "Specific",
    rotPagesPlaceholder: "e.g. 1, 3, 5",
    wmText: "Watermark text",
    wmSize: "Size",
    wmOpacity: "Opacity",
    wmAngle: "Angle",
    wmLayout: "Layout",
    wmCenter: "Center",
    wmDiagonal: "Diagonal",
    wmTiled: "Tiled",
    pnFormat: "Format",
    pnSize: "Font size",
    pnPosition: "Position",
    pnBL: "Bottom L",
    pnBC: "Bottom C",
    pnBR: "Bottom R",
    pnTC: "Top C",
    pnTR: "Top R",
    deletePlaceholder: "Pages to delete (e.g. 2, 5, 8-10)",
    infoInvalid: "Unable to read PDF information.",
    extractInvalid: "Please enter valid page numbers.",
    compressAlready: "This file is already optimized. No further compression possible.",
    compressSaved: "saved!",
    compressPercent: "reduction",
    original: "Original",
    compressed: "Compressed",
    saved: "Saved",
    metadata: "Metadata",
    metaTitle: "Title",
    metaAuthor: "Author",
    metaCreator: "Creator",
    metaProducer: "Producer",
    encWarning: "This PDF is password-protected.",
    dragReorder: "Drag to reorder",
    infoPages: "Pages",
    infoSize: "Size",
    infoEncrypted: "Encrypted",
    infoPerPage: "Per Page",
    feat1Title: "100% Private",
    feat1Desc: "All processing happens in your browser. No file ever leaves your device.",
    feat2Title: "Lightning Fast",
    feat2Desc: "No server wait times. Processing happens instantly regardless of internet speed.",
    feat3Title: "No Install Needed",
    feat3Desc: "Works in any web browser. Supports Windows, Mac, Linux, and mobile devices.",
    feat4Title: "Completely Free",
    feat4Desc: "All features with no limits. No account required.",
    faq1Q: "Are my files safe?",
    faq1A: "Yes, all PDF processing happens within your browser. Files are never sent to any external server, and all data is deleted when you close the page.",
    faq2Q: "Is there a file size limit?",
    faq2A: "Since there's no server upload, there's no official limit. However, very large files (100MB+) may process slower depending on your browser's memory.",
    faq3Q: "What kind of PDF passwords can be removed?",
    faq3A: "We can remove owner passwords (print, copy, edit restrictions). If the PDF has a user password (open password), you'll need to enter it first.",
    faq4Q: "Does it work on mobile?",
    faq4A: "Yes, all features work perfectly on mobile browsers. The responsive design ensures a great experience on any screen size.",
    trust1: "Browser Processing",
    trust2: "Zero Server Upload",
    trust3: "No Sign-up",
    trust4: "100% Free",
    unlockLabel: "Unlock PDF",
    unlockDesc: "Remove passwords and restrictions instantly",
    mergeLabel: "Merge PDF",
    mergeDesc: "Combine multiple PDFs into one file",
    splitLabel: "Split PDF",
    splitDesc: "Divide PDF by page ranges",
    extractLabel: "Extract Pages",
    extractDesc: "Pick specific pages to extract",
    rotateLabel: "Rotate Pages",
    rotateDesc: "Rotate pages to any angle",
    compressLabel: "Optimize PDF",
    compressDesc: "Strip metadata and optimize structure to reduce file size",
    watermarkLabel: "Watermark",
    watermarkDesc: "Add text watermark to pages",
    pagenumLabel: "Page Numbers",
    pagenumDesc: "Insert automatic page numbering",
    deleteLabel: "Delete Pages",
    deleteDesc: "Remove unwanted pages",
    infoLabel: "PDF Info",
    infoDesc: "View file metadata details",
    msgUnlocked: "PDF unlocked successfully!",
    msgMerged: " files merged",
    msgMergedPages: "{n} pages total",
    msgSplit: " files split!",
    msgExtracted: " pages extracted!",
    msgRotated: " rotation complete!",
    msgWatermarked: "Watermark added!",
    msgNumbered: " pages numbered!",
    msgDeleteAll: "Cannot delete all pages.",
    msgDeleted: " pages deleted!",
    msgRemaining: " remaining",
    msgError: "An error occurred during processing.",
  },
};

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function fmtTime() {
  return new Date().toLocaleTimeString(undefined, { hour12: false });
}

function download(data: Uint8Array, filename: string, mime = "application/pdf") {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadZip(files: { name: string; data: Uint8Array }[]) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.data));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pdf_toolkit_output.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parsePageRanges(input: string, total: number): number[] {
  const pages: number[] = [];
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [s, e] = trimmed.split("-");
      const start = Math.max(1, parseInt(s));
      const end = Math.min(total, parseInt(e));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) pages.push(i);
      }
    } else {
      const n = parseInt(trimmed);
      if (!isNaN(n) && n >= 1 && n <= total) pages.push(n);
    }
  }
  return Array.from(new Set(pages)).sort((a, b) => a - b);
}

// ━━━ PDF Operations (all lazy-load pdf-lib) ━━━━━━━━━━━━━━
async function unlockPDF(data: ArrayBuffer): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  return doc.save();
}

async function mergePDFs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}

async function splitPDF(
  data: ArrayBuffer,
  rangesStr: string
): Promise<{ name: string; data: Uint8Array }[]> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const results: { name: string; data: Uint8Array }[] = [];
  for (const part of rangesStr.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    let start: number, end: number;
    if (trimmed.includes("-")) {
      const [s, e] = trimmed.split("-");
      start = Math.max(1, parseInt(s));
      end = Math.min(total, parseInt(e));
    } else {
      start = end = Math.max(1, Math.min(total, parseInt(trimmed)));
    }
    if (isNaN(start) || isNaN(end)) continue;
    const newDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
    const pages = await newDoc.copyPages(doc, indices);
    pages.forEach((p) => newDoc.addPage(p));
    results.push({ name: `pages_${start}-${end}.pdf`, data: await newDoc.save() });
  }
  return results;
}

async function extractPages(data: ArrayBuffer, pageNums: number[]): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const newDoc = await PDFDocument.create();
  const valid = pageNums.filter((p) => p >= 1 && p <= total).map((p) => p - 1);
  const pages = await newDoc.copyPages(doc, valid);
  pages.forEach((p) => newDoc.addPage(p));
  return newDoc.save();
}

async function rotatePages(
  data: ArrayBuffer,
  deg: number,
  pageNums?: number[]
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const targets = pageNums || Array.from({ length: total }, (_, i) => i + 1);
  for (const p of targets) {
    if (p >= 1 && p <= total) {
      const page = doc.getPage(p - 1);
      const cur = page.getRotation().angle;
      page.setRotation(degrees(((cur + deg) % 360 + 360) % 360));
    }
  }
  return doc.save();
}

async function compressPDF(data: ArrayBuffer): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
  return doc.save({ useObjectStreams: true });
}

async function deletePagesFromPDF(data: ArrayBuffer, pageNums: number[]): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const sorted = Array.from(new Set(pageNums))
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => b - a);
  for (const p of sorted) {
    doc.removePage(p - 1);
  }
  return doc.save();
}

async function addWatermark(
  data: ArrayBuffer,
  text: string,
  fontSize: number,
  opacity: number,
  rotation: number,
  position: "center" | "diagonal" | "tiled"
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb, degrees } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    if (position === "tiled") {
      const textW = font.widthOfTextAtSize(text, fontSize);
      const gapX = textW + 80;
      const gapY = fontSize + 120;
      for (let y = 0; y < height + gapY; y += gapY) {
        for (let x = -textW; x < width + gapX; x += gapX) {
          page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.6, 0.6, 0.6), opacity, rotate: degrees(rotation) });
        }
      }
    } else {
      const textW = font.widthOfTextAtSize(text, fontSize);
      const x = (width - textW * Math.abs(Math.cos((rotation * Math.PI) / 180))) / 2;
      page.drawText(text, { x, y: height / 2, size: fontSize, font, color: rgb(0.6, 0.6, 0.6), opacity, rotate: degrees(rotation) });
    }
  }
  return doc.save();
}

async function addPageNumbers(
  data: ArrayBuffer,
  format: "simple" | "total",
  position: string,
  fontSize: number
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;
  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const text = format === "simple" ? `${i + 1}` : `${i + 1} / ${total}`;
    const textW = font.widthOfTextAtSize(text, fontSize);
    let x: number, y: number;
    switch (position) {
      case "bottom-center": x = (width - textW) / 2; y = 30; break;
      case "bottom-right": x = width - textW - 40; y = 30; break;
      case "bottom-left": x = 40; y = 30; break;
      case "top-center": x = (width - textW) / 2; y = height - 35; break;
      case "top-right": x = width - textW - 40; y = height - 35; break;
      default: x = (width - textW) / 2; y = 30;
    }
    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3), opacity: 0.8 });
  });
  return doc.save();
}

async function getPdfInfo(data: ArrayBuffer, size: number): Promise<PdfInfo> {
  try {
    const { PDFDocument } = await getPdfLib();
    const doc = await PDFDocument.load(data, { ignoreEncryption: true });
    return {
      pages: doc.getPageCount(),
      title: doc.getTitle() || "\u2014",
      author: doc.getAuthor() || "\u2014",
      creator: doc.getCreator() || "\u2014",
      producer: doc.getProducer() || "\u2014",
      encrypted: false,
      size,
    };
  } catch {
    return { pages: 0, title: "", author: "", creator: "", producer: "", encrypted: true, size };
  }
}

async function getPageCount(file: File): Promise<number> {
  try {
    const { PDFDocument } = await getPdfLib();
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    return 0;
  }
}

// ━━━ Components ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <button
      onClick={() => setLang(lang === "ko" ? "en" : "ko")}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all text-xs font-medium text-gray-500 hover:text-gray-700"
      aria-label="Toggle language"
    >
      <span className={lang === "ko" ? "text-blue-600" : "text-gray-400"}>KR</span>
      <span className="text-gray-300">/</span>
      <span className={lang === "en" ? "text-blue-600" : "text-gray-400"}>EN</span>
    </button>
  );
}

function Toast({
  type,
  text,
  onDismiss,
}: {
  type: "success" | "error" | "warning";
  text: string;
  onDismiss?: () => void;
}) {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };
  const icons = { success: "\u2713", error: "\u2715", warning: "\u26A0" };

  const durations = { success: 3000, warning: 5000, error: 8000 };
  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(onDismiss, durations[type]);
      return () => clearTimeout(timer);
    }
  }, [onDismiss]);

  return (
    <div className={`${styles[type]} border rounded-xl px-4 py-3 flex items-center gap-3 animate-toastIn text-sm font-medium`}>
      <span className="text-lg">{icons[type]}</span>
      <span className="flex-1">{text}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-gray-300 hover:text-gray-500 transition-colors text-xs">{"\u2715"}</button>
      )}
    </div>
  );
}

function FileDropzone({
  files,
  onSelect,
  onRemove,
  onReorder,
  multiple = false,
  pageInfo,
  t,
}: {
  files: File[];
  onSelect: (f: File[]) => void;
  onRemove?: (i: number) => void;
  onReorder?: (from: number, to: number) => void;
  multiple?: boolean;
  pageInfo: Record<string, number>;
  t: Record<string, string>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <div
        className={`dropzone p-6 sm:p-8 text-center cursor-pointer ${dragging ? "dragging" : ""}`}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!dragIdx && dragIdx !== 0) setDragging(true); }}
        onDragLeave={() => { if (!dragIdx && dragIdx !== 0) setDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (dragIdx !== null) return;
          const dropped = Array.from(e.dataTransfer.files).filter(
            (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
          );
          onSelect(multiple ? [...files, ...dropped] : dropped.slice(0, 1));
        }}
      >
        <input ref={ref} type="file" accept=".pdf" multiple={multiple} className="hidden"
          onChange={(e) => {
            const nf = Array.from(e.target.files || []);
            onSelect(multiple ? [...files, ...nf] : nf);
            e.target.value = "";
          }}
        />
        {files.length === 0 ? (
          <>
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 32l8-8 4 4 8-8 12 12M8 32V12a4 4 0 014-4h24a4 4 0 014 4v20M8 32h32a4 4 0 004-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M24 22v12m0 0l-4-4m4 4l4-4" />
            </svg>
            <p className="text-gray-500 text-sm font-medium">
              {t.uploadHint} <span className="text-blue-600 font-semibold">{t.uploadClick}</span>{t.uploadSuffix}
            </p>
            <button type="button" onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
              className="mt-3 px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all">
              {t.uploadClick}
            </button>
            {multiple && <p className="text-gray-400 text-xs mt-3">{t.multiHint}</p>}
          </>
        ) : (
          <div className="text-left space-y-1.5" onClick={(e) => e.stopPropagation()}>
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                draggable={!!onReorder}
                onDragStart={(e) => { e.stopPropagation(); setDragIdx(i); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropIdx(i); }}
                onDragEnd={() => { if (dragIdx !== null && dropIdx !== null && dragIdx !== dropIdx && onReorder) onReorder(dragIdx, dropIdx); setDragIdx(null); setDropIdx(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border group transition-all
                  ${dragIdx === i ? "opacity-40 scale-[0.98]" : ""}
                  ${dropIdx === i && dragIdx !== null && dragIdx !== i ? "border-blue-300 bg-blue-50" : "bg-gray-50 border-gray-200"}
                  ${onReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                {multiple && (
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                )}
                {onReorder && <span className="text-gray-400 text-xs flex-shrink-0 select-none">⠿</span>}
                <span className="text-gray-800 text-sm font-medium flex-1 truncate">{f.name}</span>
                {pageInfo[f.name + f.size + f.lastModified] > 0 && (
                  <span className="text-blue-400 text-[10px] font-mono flex-shrink-0">{pageInfo[f.name + f.size + f.lastModified]}p</span>
                )}
                <span className="text-gray-400 text-xs font-mono flex-shrink-0">{fmtSize(f.size)}</span>
                {onRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                    className="w-6 h-6 rounded-md bg-gray-50 text-gray-300 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >{"\u2715"}</button>
                )}
              </div>
            ))}
            {multiple && (
              <p className="text-center text-gray-300 text-xs pt-2 cursor-pointer" onClick={() => ref.current?.click()}>
                {t.addMore}{onReorder && <span className="text-gray-400"> · {t.dragReorder}</span>}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AccentButton({ children, onClick, disabled = false, loading = false }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all duration-300
        ${disabled || loading
          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
          : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
        }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : children}
    </button>
  );
}

function ProgressBar() {
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-4">
      <div className="progress-bar w-full h-full" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="text-sm font-semibold text-gray-800">{q}</span>
        <span className={`text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>&#9662;</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const duration = 600;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const interval = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(interval); }
      else setCount(start);
    }, 16);
    return () => clearInterval(interval);
  }, [target]);
  return <>{count}</>;
}

// ━━━ localStorage helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function saveStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function detectLang(): Lang {
  if (typeof window === "undefined") return "ko";
  const stored = localStorage.getItem("pdftk_lang");
  if (stored === "en" || stored === "ko") return stored;
  const nav = navigator.language.toLowerCase();
  return nav.startsWith("ko") ? "ko" : "en";
}

// ━━━ Main Page ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ToolkitApp({ initialTool = "home" }: { initialTool?: View }) {
  const [view, setView] = useState<View>(initialTool);
  const [lang, setLang] = useState<Lang>("ko");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [processCount, setProcessCount] = useState(0);
  const [pageInfo, setPageInfo] = useState<Record<string, number>>({});

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLang(detectLang());
    setHistory(loadStorage<HistoryItem[]>("pdftk_history", []));
    setProcessCount(loadStorage<number>("pdftk_count", 0));
  }, []);

  // Persist lang, history, count
  useEffect(() => { saveStorage("pdftk_lang", lang); document.documentElement.lang = lang === "ko" ? "ko" : "en"; }, [lang]);
  useEffect(() => { if (history.length > 0) saveStorage("pdftk_history", history); }, [history]);
  useEffect(() => { if (processCount > 0) saveStorage("pdftk_count", processCount); }, [processCount]);

  // Tool-specific state
  const [rangeInput, setRangeInput] = useState("");
  const [pagesInput, setPagesInput] = useState("");
  const [rotateDeg, setRotateDeg] = useState(90);
  const [rotateScope, setRotateScope] = useState<"all" | "specific">("all");
  const [rotatePagesInput, setRotatePagesInput] = useState("");
  const [splitMode, setSplitMode] = useState<"range" | "all">("range");
  const [deleteInput, setDeleteInput] = useState("");
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [wmSize, setWmSize] = useState(48);
  const [wmOpacity, setWmOpacity] = useState(0.15);
  const [wmRotation, setWmRotation] = useState(-30);
  const [wmPosition, setWmPosition] = useState<"center" | "diagonal" | "tiled">("tiled");
  const [pnFormat, setPnFormat] = useState<"simple" | "total">("total");
  const [pnPosition, setPnPosition] = useState("bottom-center");
  const [pnSize, setPnSize] = useState(11);

  // Result state
  const [resultData, setResultData] = useState<Uint8Array | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultMulti, setResultMulti] = useState<{ name: string; data: Uint8Array }[]>([]);
  const [pdfInfoResult, setPdfInfoResult] = useState<PdfInfo | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{ before: number; after: number } | null>(null);

  const t = T[lang];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view !== "home" && !processing) goHome();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Preload pdf-lib when entering a tool page
  useEffect(() => {
    if (view !== "home") getPdfLib();
  }, [view]);

  const addHistory = useCallback((action: string, file: string, ok: boolean) => {
    setHistory((prev) => [{ time: fmtTime(), action, file, ok }, ...prev].slice(0, 30));
  }, []);

  const resetState = () => {
    setFiles([]);
    setMessage(null);
    setResultData(null);
    setResultMulti([]);
    setPdfInfoResult(null);
    setCompressionInfo(null);
    setRangeInput("");
    setPagesInput("");
    setRotatePagesInput("");
    setDeleteInput("");
    setPageInfo({});
  };

  const goTool = (tool: Tool) => {
    setView(tool);
    resetState();
    window.history.pushState(null, "", `/${tool}`);
    window.scrollTo(0, 0);
  };
  const goHome = () => {
    setView("home");
    resetState();
    window.history.pushState(null, "", "/");
    window.scrollTo(0, 0);
  };

  // Sync URL with browser back/forward
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname.slice(1);
      if (VALID_TOOLS.includes(path as Tool)) {
        setView(path as Tool);
      } else {
        setView("home");
      }
      resetState();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const reorderFiles = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  // Get page count for uploaded files
  const loadPageInfo = async (fileList: File[]) => {
    const newEntries: Record<string, number> = {};
    for (const f of fileList) {
      const key = f.name + f.size + f.lastModified;
      newEntries[key] = await getPageCount(f);
    }
    setPageInfo((prev) => ({ ...prev, ...newEntries }));
  };

  const handleFiles = async (newFiles: File[]) => {
    // Validate PDF files
    const pdfFiles = newFiles.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    const rejected = newFiles.length - pdfFiles.length;
    if (rejected > 0 && pdfFiles.length === 0) {
      setMessage({ type: "error", text: lang === "ko" ? "PDF 파일만 업로드할 수 있습니다." : "Only PDF files are supported." });
      return;
    }
    if (rejected > 0) {
      setMessage({ type: "warning", text: lang === "ko" ? `${rejected}개의 비PDF 파일이 제외되었습니다.` : `${rejected} non-PDF file(s) were excluded.` });
    }
    setFiles(pdfFiles);
    setResultData(null);
    setResultMulti([]);
    if (rejected === 0) setMessage(null);
    setPdfInfoResult(null);
    setCompressionInfo(null);
    loadPageInfo(pdfFiles);
    // Large file warning
    const totalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      setMessage({ type: "warning", text: lang === "ko"
        ? `총 ${fmtSize(totalSize)} — 대용량 파일은 처리 시간이 길어질 수 있습니다.`
        : `Total ${fmtSize(totalSize)} — Large files may take longer to process.` });
    }
    if (view === "info" && newFiles.length > 0) {
      try {
        const buf = await newFiles[0].arrayBuffer();
        setPdfInfoResult(await getPdfInfo(buf, newFiles[0].size));
      } catch {
        setMessage({ type: "error", text: t.infoInvalid });
      }
    }
  };

  // ─── Execute ───
  const [procTime, setProcTime] = useState<number | null>(null);

  const execute = async () => {
    if (files.length === 0) return;
    const startTime = performance.now();
    setProcessing(true);
    setMessage(null);
    setResultData(null);
    setResultMulti([]);
    // Pre-warm pdf-lib on first use (shows loading state)
    if (!_pdfLib) {
      setMessage({ type: "warning", text: lang === "ko" ? "PDF 엔진 로딩 중..." : "Loading PDF engine..." });
      await getPdfLib();
      setMessage(null);
    }
    setProcTime(null);
    setCompressionInfo(null);

    try {
      const toolLabel = t[TOOLS.find((td) => td.id === view)?.labelKey || ""] || "";
      switch (view) {
        case "unlock": {
          if (files.length === 1) {
            const buf = await files[0].arrayBuffer();
            const data = await unlockPDF(buf);
            setResultData(data);
            setResultName(files[0].name.replace(/\.pdf$/i, "_unlocked.pdf"));
            setMessage({ type: "success", text: t.msgUnlocked });
            addHistory(toolLabel, files[0].name, true);
          } else {
            // Batch unlock with progress
            const results: { name: string; data: Uint8Array }[] = [];
            for (let idx = 0; idx < files.length; idx++) {
              setMessage({ type: "warning", text: `${lang === "ko" ? "처리 중" : "Processing"} ${idx + 1}/${files.length}...` });
              const buf = await files[idx].arrayBuffer();
              const data = await unlockPDF(buf);
              results.push({ name: files[idx].name.replace(/\.pdf$/i, "_unlocked.pdf"), data });
            }
            setResultMulti(results);
            setMessage({ type: "success", text: `${files.length}${lang === "ko" ? "개 파일 잠금해제 완료!" : " files unlocked!"}` });
            addHistory(toolLabel, `${files.length} files`, true);
          }
          break;
        }
        case "merge": {
          const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
          const data = await mergePDFs(buffers);
          setResultData(data);
          setResultName("merged.pdf");
          const info = await getPdfInfo(new Uint8Array(data).buffer, data.length);
          setMessage({ type: "success", text: `${files.length}${t.msgMerged} (${t.msgMergedPages.replace("{n}", String(info.pages))})` });
          addHistory(toolLabel, `${files.length} files`, true);
          break;
        }
        case "split": {
          const buf = await files[0].arrayBuffer();
          const info = await getPdfInfo(buf, files[0].size);
          const ranges = splitMode === "all"
            ? Array.from({ length: info.pages }, (_, i) => String(i + 1)).join(",")
            : rangeInput;
          const results = await splitPDF(buf, ranges);
          setResultMulti(results);
          setMessage({ type: "success", text: `${results.length}${t.msgSplit}` });
          addHistory(toolLabel, files[0].name, true);
          break;
        }
        case "extract": {
          const buf = await files[0].arrayBuffer();
          const info = await getPdfInfo(buf, files[0].size);
          const pages = parsePageRanges(pagesInput, info.pages);
          if (pages.length === 0) { setMessage({ type: "warning", text: t.extractInvalid }); break; }
          const data = await extractPages(buf, pages);
          setResultData(data);
          setResultName(files[0].name.replace(/\.pdf$/i, "_extracted.pdf"));
          setMessage({ type: "success", text: `${pages.length}${t.msgExtracted}` });
          addHistory(toolLabel, files[0].name, true);
          break;
        }
        case "rotate": {
          const buf = await files[0].arrayBuffer();
          let pageNums: number[] | undefined;
          if (rotateScope === "specific" && rotatePagesInput) {
            pageNums = rotatePagesInput.split(",").map((p) => parseInt(p.trim())).filter((n) => !isNaN(n));
          }
          const data = await rotatePages(buf, rotateDeg, pageNums);
          setResultData(data);
          setResultName(files[0].name.replace(/\.pdf$/i, "_rotated.pdf"));
          setMessage({ type: "success", text: `${rotateDeg}°${t.msgRotated}` });
          addHistory(toolLabel, files[0].name, true);
          break;
        }
        case "compress": {
          const buf = await files[0].arrayBuffer();
          const data = await compressPDF(buf);
          const saved = files[0].size - data.length;
          setResultData(data);
          setResultName(files[0].name.replace(/\.pdf$/i, "_compressed.pdf"));
          setCompressionInfo({ before: files[0].size, after: data.length });
          if (saved > 0) {
            setMessage({ type: "success", text: `${fmtSize(saved)} ${t.compressSaved} (${Math.round((saved / files[0].size) * 100)}% ${t.compressPercent})` });
          } else {
            setMessage({ type: "warning", text: t.compressAlready });
          }
          addHistory(toolLabel, files[0].name, true);
          break;
        }
        case "watermark": {
          const buf = await files[0].arrayBuffer();
          const data = await addWatermark(buf, wmText, wmSize, wmOpacity, wmRotation, wmPosition);
          setResultData(data);
          setResultName(files[0].name.replace(/\.pdf$/i, "_watermarked.pdf"));
          setMessage({ type: "success", text: t.msgWatermarked });
          addHistory(toolLabel, files[0].name, true);
          break;
        }
        case "pagenum": {
          const buf = await files[0].arrayBuffer();
          const data = await addPageNumbers(buf, pnFormat, pnPosition, pnSize);
          setResultData(data);
          setResultName(files[0].name.replace(/\.pdf$/i, "_numbered.pdf"));
          const info = await getPdfInfo(new Uint8Array(data).buffer, data.length);
          setMessage({ type: "success", text: `${info.pages}${t.msgNumbered}` });
          addHistory(toolLabel, files[0].name, true);
          break;
        }
        case "delete": {
          if (!window.confirm(t.deleteConfirm)) break;
          const buf = await files[0].arrayBuffer();
          const info = await getPdfInfo(buf, files[0].size);
          const pages = parsePageRanges(deleteInput, info.pages);
          if (pages.length === 0) { setMessage({ type: "warning", text: t.extractInvalid }); break; }
          if (pages.length >= info.pages) {
            setMessage({ type: "error", text: t.msgDeleteAll });
            break;
          }
          const data = await deletePagesFromPDF(buf, pages);
          setResultData(data);
          setResultName(files[0].name.replace(/\.pdf$/i, "_edited.pdf"));
          setMessage({ type: "success", text: `${pages.length}${t.msgDeleted} (${info.pages - pages.length}${t.msgRemaining})` });
          addHistory(toolLabel, files[0].name, true);
          break;
        }
        case "info": {
          const buf = await files[0].arrayBuffer();
          setPdfInfoResult(await getPdfInfo(buf, files[0].size));
          break;
        }
      }
      setProcessCount((c) => c + 1);
    } catch (err: unknown) {
      let errMsg = t.msgError;
      if (err instanceof Error) {
        if (err.message.includes("encrypt") || err.message.includes("password")) {
          errMsg = lang === "ko" ? "이 PDF는 열기 비밀번호가 설정되어 있습니다. 비밀번호를 알아야 처리할 수 있습니다." : "This PDF requires an open password. You need the password to process it.";
        } else if (err.message.includes("invalid") || err.message.includes("Failed to parse")) {
          errMsg = lang === "ko" ? "손상되었거나 유효하지 않은 PDF 파일입니다." : "This file is corrupted or not a valid PDF.";
        } else {
          errMsg = err.message;
        }
      }
      setMessage({ type: "error", text: errMsg });
      if (files[0]) addHistory(t[TOOLS.find((td) => td.id === view)?.labelKey || ""] || "", files[0].name, false);
    } finally {
      setProcessing(false);
      setProcTime(Math.round(performance.now() - startTime));
      setTimeout(() => {
        const el = document.getElementById("results-area");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  const canExecute = (() => {
    if (files.length === 0 || processing) return false;
    if (view === "merge" && files.length < 2) return false;
    if (view === "split" && splitMode === "range" && !rangeInput.trim()) return false;
    if (view === "extract" && !pagesInput.trim()) return false;
    if (view === "delete" && !deleteInput.trim()) return false;
    if (view === "watermark" && !wmText.trim()) return false;
    if (view === "info") return false;
    return true;
  })();

  const activeTool = TOOLS.find((td) => td.id === view);

  // Header rendered inline (depends on goHome, view, t, lang, setLang)
  const headerEl = (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <button onClick={goHome} className="flex items-center gap-2.5 group" aria-label="Go home">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm group-hover:bg-blue-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="1.5" stroke="#2563eb" strokeWidth="1.5"/><path d="M5 4.5h6M5 7h6M5 9.5h4" stroke="#2563eb" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>
          </div>
          <span className="text-sm font-bold tracking-tight hidden sm:block">
            PDF Toolkit <span className="text-blue-600">Pro</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          {view !== "home" && (
            <button onClick={goHome} className="text-xs text-gray-400 hover:text-gray-500 transition-colors hidden sm:block">
              {t.allTools}
            </button>
          )}
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>
    </header>
  );

  // ─── HOME VIEW ───
  if (view === "home") {
    const features = [
      { icon: "\uD83D\uDD12", title: t.feat1Title, desc: t.feat1Desc },
      { icon: "\u26A1", title: t.feat2Title, desc: t.feat2Desc },
      { icon: "\uD83C\uDF10", title: t.feat3Title, desc: t.feat3Desc },
      { icon: "\uD83D\uDCB0", title: t.feat4Title, desc: t.feat4Desc },
    ];
    const faqs = [
      { q: t.faq1Q, a: t.faq1A },
      { q: t.faq2Q, a: t.faq2A },
      { q: t.faq3Q, a: t.faq3A },
      { q: t.faq4Q, a: t.faq4A },
    ];

    return (
      <>
        {headerEl}
        <div className="min-h-screen pt-14" key="home">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 view-enter">
            {/* Hero */}
            <div className="relative text-center mb-14 sm:mb-20 animate-fadeInUp">
              <div className="hero-gradient" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-semibold px-4 py-1.5 rounded-full uppercase tracking-[2px] mb-6">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)] animate-pulse" />
                  {t.heroTag}
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1]">
                  {t.heroTitle1} <span className="gradient-text">{t.heroTitle2}</span>
                </h1>
                <p className="text-gray-500 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed whitespace-pre-line">
                  {t.heroSub}
                </p>

                {/* CTA Buttons */}
                <div className="flex justify-center gap-3 mt-8">
                  <button onClick={() => goTool("unlock")}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    {t.heroCta}
                  </button>
                  <button onClick={() => { const el = document.getElementById("tool-grid"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-all">
                    {t.heroCtaSub} &darr;
                  </button>
                </div>

                {/* Rating + Trust row */}
                <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} className="w-4 h-4" viewBox="0 0 20 20" fill="#f59e0b" opacity={s <= 4 ? 1 : 0.6}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{t.rating}</span>
                    <span className="text-xs text-gray-400">{t.ratingText}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                  <div className="flex gap-4">
                    {[t.trust1, t.trust2, t.trust3].map((label) => (
                      <span key={label} className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tool Grid */}
            <div id="tool-grid" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {TOOLS.map((td) => (
                <button key={td.id} onClick={() => goTool(td.id)}
                  className="tool-card rounded-2xl p-6 text-left group relative overflow-hidden"
                  aria-label={`${t[td.labelKey]} - ${t[td.descKey]}`}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${td.hex}30`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `${td.hex}15`, boxShadow: `0 0 0 1px ${td.hex}20` }}
                  >
                    {td.icon}
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-gray-900 mb-0.5">{t[td.labelKey]}</h3>
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: `${td.hex}80` }}>{td.labelEn}</span>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2 hidden sm:block">{t[td.descKey]}</p>
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 30% 20%, ${td.hex}08 0%, transparent 60%)` }} />
                </button>
              ))}
            </div>

            {/* How It Works */}
            <div className="mt-20 sm:mt-24">
              <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-[3px] mb-10">{t.howTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
                {[
                  { num: "1", icon: "\u2B06\uFE0F", title: t.how1, desc: t.how1Desc },
                  { num: "2", icon: "\u2699\uFE0F", title: t.how2, desc: t.how2Desc },
                  { num: "3", icon: "\u2B07\uFE0F", title: t.how3, desc: t.how3Desc },
                ].map((step, i) => (
                  <div key={i} className="text-center relative">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">{step.num}</div>
                    {i < 2 && <div className="hidden sm:block absolute top-6 left-[60%] w-[80%] h-px bg-gray-200" />}
                    <h3 className="text-sm font-bold text-gray-800 mb-1">{step.title}</h3>
                    <p className="text-xs text-gray-400">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mt-20 sm:mt-24 section-alt -mx-4 sm:-mx-6 px-4 sm:px-6 py-16 rounded-3xl">
              <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-[3px] mb-10">{t.whyTitle}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {features.map((f, i) => (
                  <div key={i} className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mx-auto mb-4">{f.icon}</div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1.5">{f.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison */}
            <div className="mt-20 sm:mt-24 max-w-2xl mx-auto">
              <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-[3px] mb-10">{t.compareTitle}</h2>
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-3 bg-gray-50 border-b border-gray-200 text-[11px] sm:text-xs font-semibold">
                  <div className="px-3 sm:px-5 py-3 text-gray-500">{t.compareFeature}</div>
                  <div className="px-2 sm:px-5 py-3 text-blue-600 text-center truncate">{t.compareUs}</div>
                  <div className="px-2 sm:px-5 py-3 text-gray-400 text-center truncate">{t.compareOthers}</div>
                </div>
                {[t.cmpPrivacy, t.cmpUpload, t.cmpFree, t.cmpSignup, t.cmpSpeed].map((feat, i) => (
                  <div key={i} className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-3 text-xs sm:text-sm ${i < 4 ? "border-b border-gray-100" : ""}`}>
                    <div className="px-3 sm:px-5 py-3 text-gray-600">{feat}</div>
                    <div className="px-2 sm:px-5 py-3 text-center">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="px-2 sm:px-5 py-3 text-center">
                      <svg className="w-5 h-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-20 sm:mt-24 max-w-2xl mx-auto">
              <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-[3px] mb-10">{t.faqTitle}</h2>
              <div className="space-y-2">
                {faqs.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-16 max-w-2xl mx-auto">
                <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-[3px] mb-6">{t.recentTitle}</h2>
                <div className="space-y-1">
                  {history.slice(0, 8).map((h, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.ok ? "bg-green-500" : "bg-red-400"}`} />
                      <span className="text-sm text-gray-500 font-medium flex-1">
                        <span className="text-gray-700">{h.action}</span> — {h.file}
                      </span>
                      <span className="text-[10px] text-gray-300 font-mono">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-100 bg-gray-50 mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="1.5" stroke="white" strokeWidth="1.5"/><path d="M5 4.5h6M5 7h6M5 9.5h4" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7"/></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-800">PDF Toolkit <span className="text-blue-600">Pro</span></span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{t.footer1}</p>
                </div>
                {/* Tools */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3">{t.footerTools}</h4>
                  <ul className="space-y-2">
                    {TOOLS.slice(0, 5).map((td) => (
                      <li key={td.id}><button onClick={() => goTool(td.id)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">{t[td.labelKey]}</button></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3">&nbsp;</h4>
                  <ul className="space-y-2">
                    {TOOLS.slice(5).map((td) => (
                      <li key={td.id}><button onClick={() => goTool(td.id)} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">{t[td.labelKey]}</button></li>
                    ))}
                  </ul>
                </div>
                {/* Resources */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3">{t.footerResources}</h4>
                  <ul className="space-y-2">
                    <li><button onClick={() => goHome()} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">{t.footerAbout}</button></li>
                    <li><button onClick={() => goHome()} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">{t.footerFaq}</button></li>
                    <li><span className="text-xs text-gray-300">{t.footerPrivacy}</span></li>
                    <li><span className="text-xs text-gray-300">{t.footerTerms}</span></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[11px] text-gray-400">&copy; {new Date().getFullYear()} PDF Toolkit Pro. {t.footer2}</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className="w-3 h-3" viewBox="0 0 20 20" fill="#f59e0b" opacity={s <= 4 ? 1 : 0.6}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-[11px] text-gray-400 ml-1">{t.rating} {t.ratingText}</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </>
    );
  }

  // ─── TOOL VIEW ───
  return (
    <>
      {headerEl}
      <div className="min-h-screen pt-14" key={view}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 view-enter">
          {/* Back + Header */}
          <div>
            <button onClick={goHome}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-500 transition-colors mb-6 group">
              <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
              {t.allTools} <span className="text-gray-400 text-xs ml-1">(Esc)</span>
            </button>
            {activeTool && (
              <div className="flex items-center gap-4 mb-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${activeTool.hex}15`, boxShadow: `0 0 0 1px ${activeTool.hex}25` }}
                >
                  {activeTool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-xl font-bold tracking-tight">{t[activeTool.labelKey]}</h1>
                    <span className="text-[10px] text-gray-300 uppercase tracking-wider font-medium">{activeTool.labelEn}</span>
                  </div>
                  <p className="text-sm text-gray-400">{t[activeTool.descKey]}</p>
                </div>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: `${t[activeTool.labelKey]} — PDF Toolkit Pro`, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      setMessage({ type: "success", text: lang === "ko" ? "링크가 복사되었습니다" : "Link copied" });
                    }
                  }}
                  className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all flex-shrink-0"
                  aria-label="Share"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
              </div>
            )}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-5" />
          </div>

          {processing && <ProgressBar />}

          <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: "100ms" }}>
            {/* File Upload */}
            <FileDropzone
              files={files}
              onSelect={handleFiles}
              onRemove={files.length > 0 ? removeFile : undefined}
              onReorder={view === "merge" ? reorderFiles : undefined}
              multiple={view === "merge" || view === "unlock"}
              pageInfo={pageInfo}
              t={t}
            />

            {/* Security callout */}
            {files.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-100">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-xs text-green-700">{t.securityNote}</span>
              </div>
            )}

            {/* Clear button */}
            {files.length > 0 && !processing && !resultData && resultMulti.length === 0 && (
              <button onClick={() => { setFiles([]); setMessage(null); setPageInfo({}); }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors self-end">
                {lang === "ko" ? "파일 초기화" : "Clear files"}
              </button>
            )}

            {/* Tool-specific options */}
            {view === "merge" && files.length > 0 && files.length < 2 && (
              <Toast type="warning" text={t.mergeWarn} />
            )}
            {view === "merge" && files.length >= 2 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-sm animate-fadeIn">
                <span className="text-blue-700 font-medium">{files.length} {lang === "ko" ? "개 파일 선택됨" : "files selected"}</span>
                {(() => {
                  const total = files.reduce((sum, f) => sum + (pageInfo[f.name + f.size + f.lastModified] || 0), 0);
                  return total > 0 ? <span className="text-blue-500 text-xs font-mono">{lang === "ko" ? `총 ${total}페이지` : `${total} pages total`}</span> : null;
                })()}
              </div>
            )}

            {/* Page count hint for single-file tools */}
            {["split", "extract", "delete", "rotate"].includes(view) && files.length === 1 && (() => {
              const pc = pageInfo[files[0].name + files[0].size + files[0].lastModified];
              return pc > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs animate-fadeIn">
                  <span className="text-gray-500">{lang === "ko" ? `이 PDF는 ${pc}페이지입니다` : `This PDF has ${pc} pages`}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400 font-mono">{fmtSize(files[0].size)}</span>
                </div>
              ) : null;
            })()}

            {view === "split" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex gap-2">
                  {(["range", "all"] as const).map((m) => (
                    <button key={m} onClick={() => setSplitMode(m)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                        ${splitMode === m ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-500"}`}>
                      {m === "range" ? t.rangeMode : t.allPages}
                    </button>
                  ))}
                </div>
                {splitMode === "range" && (
                  <input type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)}
                    placeholder={t.rangePlaceholder}
                    className="input-field" />
                )}
              </div>
            )}

            {view === "extract" && files.length > 0 && (
              <input type="text" value={pagesInput} onChange={(e) => setPagesInput(e.target.value)}
                placeholder={t.pagesPlaceholder}
                className="input-field animate-fadeIn" />
            )}

            {view === "delete" && files.length > 0 && (
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={t.deletePlaceholder}
                className="input-field animate-fadeIn" />
            )}

            {view === "rotate" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.rotAngle}</label>
                    <div className="flex gap-2">
                      {[90, 180, 270].map((d) => (
                        <button key={d} onClick={() => setRotateDeg(d)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                            ${rotateDeg === d ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-500"}`}>
                          {d}°
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.rotScope}</label>
                    <div className="flex gap-2">
                      {(["all", "specific"] as const).map((s) => (
                        <button key={s} onClick={() => setRotateScope(s)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                            ${rotateScope === s ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-500"}`}>
                          {s === "all" ? t.rotAll : t.rotSpecific}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {rotateScope === "specific" && (
                  <input type="text" value={rotatePagesInput} onChange={(e) => setRotatePagesInput(e.target.value)}
                    placeholder={t.rotPagesPlaceholder}
                    className="input-field" />
                )}
              </div>
            )}

            {view === "watermark" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.wmText}</label>
                  <input type="text" value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder={t.wmText}
                    className="input-field" />
                  {/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(wmText) && (
                    <p className="text-xs text-amber-600 mt-1">{lang === "ko" ? "한글은 지원되지 않습니다. 영문으로 입력해주세요." : "Korean characters are not supported. Please use English text."}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.wmSize}</label>
                    <input type="number" value={wmSize} onChange={(e) => setWmSize(Math.min(120, Math.max(12, Number(e.target.value) || 12)))} min={12} max={120}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.wmOpacity} ({Math.round(wmOpacity * 100)}%)</label>
                    <input type="range" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} min={0.05} max={0.5} step={0.05} className="w-full mt-3 accent-[#2563eb]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.wmAngle}</label>
                    <input type="number" value={wmRotation} onChange={(e) => setWmRotation(Math.min(90, Math.max(-90, Number(e.target.value) || 0)))} min={-90} max={90}
                      className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.wmLayout}</label>
                  <div className="flex gap-2">
                    {([["center", t.wmCenter], ["diagonal", t.wmDiagonal], ["tiled", t.wmTiled]] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setWmPosition(val as "center" | "diagonal" | "tiled")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                          ${wmPosition === val ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-500"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {view === "pagenum" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.pnFormat}</label>
                    <div className="flex gap-2">
                      {([["simple", "1, 2, 3"], ["total", "1/10"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setPnFormat(val as "simple" | "total")}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                            ${pnFormat === val ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-500"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.pnSize}</label>
                    <input type="number" value={pnSize} onChange={(e) => setPnSize(Math.min(24, Math.max(8, Number(e.target.value) || 11)))} min={8} max={24}
                      className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">{t.pnPosition}</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {([["bottom-left", t.pnBL], ["bottom-center", t.pnBC], ["bottom-right", t.pnBR], ["top-center", t.pnTC], ["top-right", t.pnTR]] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setPnPosition(val)}
                        className={`py-2 rounded-xl text-xs font-medium border transition-all
                          ${pnPosition === val ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-500"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            {view !== "info" && files.length > 0 && (
              <AccentButton onClick={execute} disabled={!canExecute} loading={processing}>
                {processing ? t.processing : `${t[activeTool?.labelKey || ""]} ${t.execute}`}
              </AccentButton>
            )}

            {/* Messages */}
            {message && <Toast type={message.type} text={message.text} onDismiss={() => setMessage(null)} />}

            <div id="results-area" />

            {/* Compression info */}
            {compressionInfo && (
              <div className="grid grid-cols-3 gap-3 animate-fadeIn">
                {[
                  { label: t.original, value: fmtSize(compressionInfo.before), accent: false },
                  { label: t.compressed, value: fmtSize(compressionInfo.after), accent: true },
                  { label: t.saved, value: compressionInfo.before > compressionInfo.after ? `-${Math.round(((compressionInfo.before - compressionInfo.after) / compressionInfo.before) * 100)}%` : "0%", accent: true },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <div className="text-[10px] text-gray-300 uppercase tracking-wider mb-1 font-semibold">{item.label}</div>
                    <div className={`text-sm font-bold font-mono ${item.accent ? "text-blue-600" : "text-gray-500"}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Results: Single file */}
            {resultData && (
              <div className="animate-scaleIn space-y-3">
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-green-700">{message?.text}</span>
                </div>
                <button onClick={() => download(resultData, resultName)}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {resultName} ({fmtSize(resultData.length)})
                </button>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setFiles([]); setResultData(null); setResultMulti([]); setMessage(null); setProcTime(null); setPageInfo({}); }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    {lang === "ko" ? "다른 파일 처리하기" : "Process another file"}
                  </button>
                  {procTime !== null && <span className="text-[10px] text-gray-400">{procTime < 1000 ? `${procTime}ms` : `${(procTime / 1000).toFixed(1)}s`}</span>}
                </div>
              </div>
            )}

            {/* Results: Multiple files */}
            {resultMulti.length > 0 && (
              <div className="space-y-2 animate-fadeIn">
                {resultMulti.length > 1 && (
                  <button onClick={() => downloadZip(resultMulti)}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                    {resultMulti.length}{t.downloadZip}
                  </button>
                )}
                {resultMulti.map((r, i) => (
                  <button key={i} onClick={() => download(r.data, r.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-200 hover:bg-gray-100 transition-all text-left group">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-gray-800 text-sm font-medium flex-1 truncate">{r.name}</span>
                    <span className="text-gray-400 text-[10px] font-mono flex-shrink-0">{fmtSize(r.data.length)}</span>
                    <span className="text-blue-600 text-xs font-semibold opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">{t.download}</span>
                  </button>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => { setFiles([]); setResultData(null); setResultMulti([]); setMessage(null); setProcTime(null); setPageInfo({}); }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    {lang === "ko" ? "다른 파일 처리하기" : "Process another file"}
                  </button>
                  {procTime !== null && <span className="text-[10px] text-gray-400">{procTime < 1000 ? `${procTime}ms` : `${(procTime / 1000).toFixed(1)}s`}</span>}
                </div>
              </div>
            )}

            {/* PDF Info Result */}
            {view === "info" && pdfInfoResult && (
              <div className="space-y-4 animate-fadeIn">
                {pdfInfoResult.encrypted ? (
                  <Toast type="warning" text={t.encWarning} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { icon: "\uD83D\uDCD1", val: String(pdfInfoResult.pages), label: t.infoPages },
                        { icon: "\uD83D\uDCBE", val: fmtSize(pdfInfoResult.size), label: t.infoSize },
                        { icon: "\uD83D\uDD10", val: "No", label: t.infoEncrypted },
                        { icon: "\uD83D\uDCCA", val: fmtSize(Math.round(pdfInfoResult.size / Math.max(pdfInfoResult.pages, 1))), label: t.infoPerPage },
                      ].map((s, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 text-center hover:border-blue-200 hover:-translate-y-0.5 transition-all">
                          <div className="text-xl mb-1">{s.icon}</div>
                          <div className="text-lg font-extrabold font-mono text-gray-900">{s.val}</div>
                          <div className="text-[10px] text-gray-300 uppercase tracking-wider mt-1 font-semibold">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-500">{t.metadata}</h3>
                        <button
                          onClick={() => {
                            const text = `Pages: ${pdfInfoResult.pages}\nSize: ${fmtSize(pdfInfoResult.size)}\nTitle: ${pdfInfoResult.title}\nAuthor: ${pdfInfoResult.author}\nCreator: ${pdfInfoResult.creator}\nProducer: ${pdfInfoResult.producer}`;
                            navigator.clipboard.writeText(text);
                            setMessage({ type: "success", text: lang === "ko" ? "클립보드에 복사됨" : "Copied to clipboard" });
                          }}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
                        >{lang === "ko" ? "복사" : "Copy"}</button>
                      </div>
                      {[
                        [t.metaTitle, pdfInfoResult.title],
                        [t.metaAuthor, pdfInfoResult.author],
                        [t.metaCreator, pdfInfoResult.creator],
                        [t.metaProducer, pdfInfoResult.producer],
                      ].map(([k, v], i) => (
                        <div key={i} className={`flex px-5 py-3 text-sm hover:bg-gray-50 transition-colors ${i < 3 ? "border-b border-gray-200" : ""}`}>
                          <span className="w-32 text-gray-400 font-medium flex-shrink-0">{k}</span>
                          <span className="text-gray-700">{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Related Tools */}
          <div className="mt-14 pt-8 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.relatedTools}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(() => {
                // Contextual suggestions based on current tool
                const related: Record<string, Tool[]> = {
                  unlock: ["merge", "compress", "info", "split"],
                  merge: ["split", "compress", "pagenum", "unlock"],
                  split: ["merge", "extract", "delete", "pagenum"],
                  extract: ["split", "delete", "merge", "rotate"],
                  rotate: ["extract", "split", "compress", "pagenum"],
                  compress: ["unlock", "merge", "watermark", "info"],
                  watermark: ["pagenum", "compress", "merge", "unlock"],
                  pagenum: ["watermark", "merge", "compress", "split"],
                  delete: ["extract", "split", "merge", "rotate"],
                  info: ["unlock", "compress", "merge", "split"],
                };
                const ids = related[view as string] || [];
                return ids.map((id) => TOOLS.find((td) => td.id === id)!).filter(Boolean);
              })().map((td) => (
                <button key={td.id} onClick={() => goTool(td.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${td.hex}10` }}>
                    {td.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-600">{t[td.labelKey]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 pb-20 sm:pb-6 text-center">
            <p className="text-[11px] text-gray-400">{t.footer1}</p>
          </div>
        </div>
      </div>

      {/* Mobile fixed CTA bar */}
      {view !== "info" && files.length > 0 && !resultData && !resultMulti.length && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-3 sm:hidden">
          <button
            onClick={canExecute ? execute : undefined}
            disabled={!canExecute}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              canExecute
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {processing ? t.processing : `${t[activeTool?.labelKey || ""]} ${t.execute}`}
          </button>
        </div>
      )}

      {/* Mobile fixed download bar */}
      {resultData && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-3 sm:hidden">
          <button
            onClick={() => download(resultData, resultName)}
            className="w-full py-3 rounded-xl font-bold text-sm bg-green-600 text-white shadow-lg shadow-green-500/20"
          >
            {resultName} {t.download}
          </button>
        </div>
      )}
    </>
  );
}
