"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  NO_PAGE_INFO_TOOLS,
  NO_PDF_LIB_PRELOAD_TOOLS,
  PAGE_INPUT_TOOLS,
  TOOLS,
  TOOL_BY_ID,
  isImageInputTool,
  isValidTool,
  type Lang,
  type Tool,
  type View,
} from "../lib/config";
import { sanitizeOutputFilename } from "../lib/file-names";
import { parsePageRangeGroups, parsePageRanges, type PageRange } from "../lib/page-ranges";

// Lazy-load pdf-lib and jszip — only when user actually uses a tool (~325KB saved on homepage)
let _pdfLib: typeof import("pdf-lib") | null = null;
async function getPdfLib() {
  if (!_pdfLib) {
    try {
      _pdfLib = await import("pdf-lib");
    } catch (err) {
      throw new Error("Failed to load PDF engine. Please reload the page.");
    }
  }
  return _pdfLib;
}

interface HistoryItem {
  time: string;
  action: string;
  file: string;
  ok: boolean;
  toolId?: string;
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
    heroTag: "올인원 문서 솔루션",
    heroTitle1: "File",
    heroTitle2: "Forge",
    heroSub: "PDF, DOCX, 이미지 — 암호 해제, 병합, 분할, 변환까지\n브라우저에서 안전하고 빠르게 처리하세요",
    tools: "Tools",
    privacy: "Private",
    processed: "Processed",
    whyTitle: "Why FileForge",
    faqTitle: "FAQ",
    recentTitle: "Recent Activity",
    compareTitle: "다른 도구와 비교",
    compareFeature: "기능",
    compareUs: "FileForge",
    compareOthers: "일반 PDF 도구",
    cmpPrivacy: "100% 브라우저 처리",
    cmpUpload: "서버 업로드 불필요",
    cmpFree: "완전 무료 (제한 없음)",
    cmpSignup: "회원가입 불필요",
    cmpSpeed: "오프라인에서도 작동",
    deleteConfirm: "정말 선택한 페이지를 삭제하시겠습니까?",
    allTools: "모든 도구",
    searchPlaceholder: "도구 검색...",
    catPdf: "PDF 도구",
    catImage: "이미지 도구",
    catDocument: "문서 도구",
    copyText: "텍스트 복사",
    copied: "클립보드에 복사됨",
    processAnother: "다른 파일 처리하기",
    clearFiles: "파일 초기화",
    backToTop: "맨 위로",
    footerImgDoc: "이미지 & 문서",
    noResults: "검색 결과가 없습니다",
    engineLoading: "PDF 엔진 로딩 중...",
    linkCopied: "링크가 복사되었습니다",
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
    rotPagesPlaceholder: "예: 1, 3, 5-7",
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
    img2pdfLabel: "이미지 → PDF",
    img2pdfDesc: "JPG, PNG, WebP 이미지를 PDF로 변환합니다",
    img2pdfHint: "이미지 파일을 업로드하세요 (JPG, PNG, WebP)",
    pdf2imgLabel: "PDF → 이미지",
    pdf2imgDesc: "PDF 페이지를 JPG/PNG 이미지로 변환합니다",
    docx2htmlLabel: "DOCX 뷰어",
    docx2htmlDesc: "Word 문서를 브라우저에서 바로 확인합니다",
    docxPreview: "DOCX 미리보기",
    pdftextLabel: "PDF 텍스트 추출",
    pdftextDesc: "PDF에서 텍스트를 추출합니다",
    imgcompressLabel: "이미지 압축",
    imgcompressDesc: "이미지를 압축하여 파일 크기를 줄입니다",
    imgQuality: "품질",
    imgresizeLabel: "이미지 리사이즈",
    imgresizeDesc: "이미지 크기를 원하는 비율로 조절합니다",
    imgScale: "크기 비율",
    imgstitchLabel: "이미지 합치기",
    imgstitchDesc: "여러 이미지를 하나로 합칩니다 (세로/가로)",
    imgDirection: "합치기 방향",
    imgVertical: "세로",
    imgHorizontal: "가로",
    txt2pdfLabel: "텍스트 → PDF",
    txt2pdfDesc: "텍스트를 입력하여 PDF를 만듭니다",
    txtPlaceholder: "여기에 텍스트를 입력하세요...",
    imgconvertLabel: "이미지 변환",
    imgconvertDesc: "PNG↔JPG↔WebP 포맷을 변환합니다",
    imgFormat: "출력 형식",
    html2pdfLabel: "HTML → PDF",
    html2pdfDesc: "HTML 파일을 PDF로 변환합니다",
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
    msgPassword: "이 PDF는 열기 비밀번호가 설정되어 있습니다. 비밀번호를 알아야 처리할 수 있습니다.",
    msgCorrupt: "손상되었거나 유효하지 않은 PDF 파일입니다.",
    copyBtn: "복사",
    infoYes: "예",
    infoNo: "아니오",
    msgBatchProcess: "처리 중",
    msgBatchUnlocked: "개 파일 잠금해제 완료!",
    msgStitched: "개 이미지 합치기 완료!",
    msgTxtDone: "텍스트 → PDF 변환 완료!",
    msgHtmlDone: "HTML → PDF 변환 완료!",
    msgEmptyTxt: "텍스트를 입력해주세요.",
    msgEmptyHtml: "HTML 파일이 비어있습니다.",
    msgNeedImages: "2개 이상의 이미지를 업로드하세요.",
    msgPdfToImg: "페이지를 이미지로 변환 중...",
    msgTextExtracted: "텍스트 추출 완료!",
    msgDocxDone: "DOCX 변환 완료!",
    warnExcludedImg: "개의 비이미지 파일이 제외되었습니다.",
    warnExcludedPdf: "개의 비PDF 파일이 제외되었습니다.",
    msgImgConverted: "개 이미지 변환 완료!",
    msgImgResized: "개 이미지 리사이즈 완료!",
    msgPdfToImgDone: "페이지 → 이미지 변환 완료!",
    msgImgToPdfDone: "개 이미지 → PDF 변환 완료!",
    confirmDeleteBtn: "삭제 확인",
    maxCompress: "최대 압축",
    origQuality: "원본 품질",
    toolCount: "개 도구",
    imgStitchWarn: "2개 이상의 이미지를 업로드해주세요.",
    errImgOnly: "이미지 파일만 업로드할 수 있습니다 (JPG, PNG, WebP).",
    errHtmlOnly: "HTML 파일만 업로드할 수 있습니다.",
    errDocxOnly: "DOCX 파일만 업로드할 수 있습니다.",
    errPdfOnly: "PDF 파일만 업로드할 수 있습니다.",
    warnLargeFile: "대용량 파일은 처리 시간이 길어질 수 있습니다.",
  },
  en: {
    heroTag: "All-in-One Document Solution",
    heroTitle1: "File",
    heroTitle2: "Forge",
    heroSub: "PDF, DOCX, Images — unlock, merge, split, convert and more\nAll processed safely in your browser",
    tools: "Tools",
    privacy: "Private",
    processed: "Processed",
    whyTitle: "Why FileForge",
    faqTitle: "FAQ",
    recentTitle: "Recent Activity",
    compareTitle: "Compare with others",
    compareFeature: "Feature",
    compareUs: "FileForge",
    compareOthers: "Typical PDF tools",
    cmpPrivacy: "100% browser processing",
    cmpUpload: "No server upload needed",
    cmpFree: "Completely free (no limits)",
    cmpSignup: "No sign-up required",
    cmpSpeed: "Works offline too",
    deleteConfirm: "Are you sure you want to delete the selected pages?",
    allTools: "All Tools",
    searchPlaceholder: "Search tools...",
    catPdf: "PDF Tools",
    catImage: "Image Tools",
    catDocument: "Document Tools",
    copyText: "Copy text",
    copied: "Copied to clipboard",
    processAnother: "Process another file",
    clearFiles: "Clear files",
    backToTop: "Back to top",
    footerImgDoc: "Image & Docs",
    noResults: "No tools found",
    engineLoading: "Loading PDF engine...",
    linkCopied: "Link copied",
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
    rotPagesPlaceholder: "e.g. 1, 3, 5-7",
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
    img2pdfLabel: "Image to PDF",
    img2pdfDesc: "Convert JPG, PNG, WebP images to PDF",
    img2pdfHint: "Upload image files (JPG, PNG, WebP)",
    pdf2imgLabel: "PDF to Image",
    pdf2imgDesc: "Convert PDF pages to JPG/PNG images",
    docx2htmlLabel: "DOCX Viewer",
    docx2htmlDesc: "Preview Word documents in your browser",
    docxPreview: "DOCX Preview",
    pdftextLabel: "Extract PDF Text",
    pdftextDesc: "Extract text content from PDF files",
    imgcompressLabel: "Image Compress",
    imgcompressDesc: "Compress images to reduce file size",
    imgQuality: "Quality",
    imgresizeLabel: "Image Resize",
    imgresizeDesc: "Resize images to any scale",
    imgScale: "Scale",
    imgstitchLabel: "Image Stitch",
    imgstitchDesc: "Combine multiple images into one (vertical/horizontal)",
    imgDirection: "Direction",
    imgVertical: "Vertical",
    imgHorizontal: "Horizontal",
    txt2pdfLabel: "Text to PDF",
    txt2pdfDesc: "Type text and create a PDF",
    txtPlaceholder: "Type or paste your text here...",
    imgconvertLabel: "Image Convert",
    imgconvertDesc: "Convert between PNG, JPG, and WebP",
    imgFormat: "Output format",
    html2pdfLabel: "HTML to PDF",
    html2pdfDesc: "Convert HTML files to PDF",
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
    msgPassword: "This PDF requires an open password. You need the password to process it.",
    msgCorrupt: "This file is corrupted or not a valid PDF.",
    copyBtn: "Copy",
    infoYes: "Yes",
    infoNo: "No",
    msgBatchProcess: "Processing",
    msgBatchUnlocked: " files unlocked!",
    msgStitched: " images stitched!",
    msgTxtDone: "Text converted to PDF!",
    msgHtmlDone: "HTML converted to PDF!",
    msgEmptyTxt: "Please enter some text.",
    msgEmptyHtml: "HTML file is empty.",
    msgNeedImages: "Upload 2 or more images.",
    msgPdfToImg: "Converting pages to images...",
    msgTextExtracted: "Text extracted!",
    msgDocxDone: "DOCX converted!",
    warnExcludedImg: " non-image file(s) were excluded.",
    warnExcludedPdf: " non-PDF file(s) were excluded.",
    msgImgConverted: " images converted!",
    msgImgResized: " images resized!",
    msgPdfToImgDone: " pages converted to images!",
    msgImgToPdfDone: " images converted to PDF!",
    confirmDeleteBtn: "Confirm Delete",
    maxCompress: "Max compression",
    origQuality: "Original quality",
    toolCount: " tools",
    imgStitchWarn: "Please upload 2 or more images.",
    errImgOnly: "Only image files are supported (JPG, PNG, WebP).",
    errHtmlOnly: "Only HTML files are supported.",
    errDocxOnly: "Only DOCX files are supported.",
    errPdfOnly: "Only PDF files are supported.",
    warnLargeFile: "Large files may take longer to process.",
  },
};

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

function fmtTime() {
  return new Date().toLocaleTimeString(undefined, { hour12: false });
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy.buffer;
}

function getMimeTypeForFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".zip")) return "application/zip";
  return "application/pdf";
}

function isPreviewableImage(filename: string) {
  return /\.(png|jpe?g|webp)$/i.test(filename);
}

function isImageFile(file: File) {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type) || isPreviewableImage(file.name);
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isDocxFile(file: File) {
  return file.name.toLowerCase().endsWith(".docx") || file.type.includes("wordprocessingml");
}

function isHtmlFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".html") || name.endsWith(".htm") || file.type === "text/html";
}

function uniqueFilename(filename: string, seen: Map<string, number>) {
  const safeName = sanitizeOutputFilename(filename);
  const count = seen.get(safeName) ?? 0;
  seen.set(safeName, count + 1);
  if (count === 0) return safeName;

  const dot = safeName.lastIndexOf(".");
  const suffix = ` (${count + 1})`;
  return dot > 0
    ? `${safeName.slice(0, dot)}${suffix}${safeName.slice(dot)}`
    : `${safeName}${suffix}`;
}

function replaceExtension(filename: string, replacement: string) {
  const dot = filename.lastIndexOf(".");
  const output = dot > 0 ? `${filename.slice(0, dot)}${replacement}` : `${filename}${replacement}`;
  return sanitizeOutputFilename(output, `file${replacement}`);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (typeof document === "undefined" || !document.body) return false;
    // Fallback for non-secure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    try {
      ta.select();
      return document.execCommand("copy") === true;
    } catch {
      return false;
    } finally {
      ta.remove();
    }
  }
}

function isValidWatermarkText(text: string): boolean {
  if (!text.trim()) return false;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (
      code === undefined ||
      !(
        code === 9 ||
        code === 10 ||
        code === 13 ||
        (code >= 32 && code <= 126) ||
        (code >= 160 && code <= 255)
      )
    ) {
      return false;
    }
  }
  return true;
}

async function loadPdfForOperation(file: File): Promise<{ buffer: ArrayBuffer; info: PdfInfo }> {
  const buffer = await file.arrayBuffer();
  const info = await getPdfInfo(buffer, file.size);
  if (info.encrypted || info.pages === 0) {
    throw new Error("password protected");
  }
  return { buffer, info };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeOutputFilename(filename, "download");
  a.style.display = "none";
  document.body.appendChild(a);
  // Use setTimeout for Safari compatibility
  setTimeout(() => {
    try {
      a.click();
    } finally {
      a.remove();
      URL.revokeObjectURL(url);
    }
  }, 0);
}

function download(data: Uint8Array, filename: string, mime = "application/pdf") {
  downloadBlob(new Blob([toArrayBuffer(data)], { type: mime }), filename);
}

async function downloadZip(files: { name: string; data: Uint8Array }[], zipName = "fileforge_output.zip") {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const seen = new Map<string, number>();
  files.forEach((f) => zip.file(uniqueFilename(f.name, seen), toArrayBuffer(f.data)));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, sanitizeOutputFilename(zipName, "fileforge_output.zip"));
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    img.onload = () => {
      cleanup();
      resolve(img);
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Unable to load image file."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to encode image output."));
    }, type, quality);
  });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function needsImagePdfRendering(text: string) {
  return /[^\t\n\r\x20-\x7E\xA0-\xFF]/.test(text);
}

function normalizePdfText(text: string) {
  return text.replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
}

function isSafePreviewLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return true;
  }

  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isSafePreviewImage(value: string) {
  const trimmed = value.trim();
  if (/^data:image\/(?:png|gif|jpe?g|webp);base64,/i.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "blob:";
  } catch {
    return false;
  }
}

async function sanitizePreviewHtml(html: string) {
  const { default: DOMPurify } = await import("dompurify");
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "a", "b", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3", "h4",
      "h5", "h6", "i", "img", "li", "ol", "p", "pre", "s", "strong", "sub", "sup",
      "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
    ],
    ALLOWED_ATTR: ["alt", "colspan", "height", "href", "rowspan", "src", "start", "title", "width"],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style"],
    FORBID_TAGS: ["button", "embed", "form", "iframe", "input", "object", "script", "style"],
  });

  const parsed = new DOMParser().parseFromString(clean, "text/html");
  parsed.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!isSafePreviewLink(href)) {
      link.removeAttribute("href");
      return;
    }
    if (/^https?:/i.test(href)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });
  parsed.querySelectorAll<HTMLImageElement>("img[src]").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (!isSafePreviewImage(src)) img.removeAttribute("src");
  });

  return parsed.body.innerHTML;
}

function wrapCanvasLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number) {
  if (!line) return [""];
  const wrapped: string[] = [];
  let current = "";

  for (const char of line) {
    const next = current + char;
    if (current && ctx.measureText(next).width > maxWidth) {
      wrapped.push(current.trimEnd());
      current = char.trimStart();
    } else {
      current = next;
    }
  }

  wrapped.push(current);
  return wrapped;
}

async function textToImagePdf(text: string): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.create();
  const normalizedText = normalizePdfText(text);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const fontSize = 14;
  const lineHeight = 21;
  const fontFamily = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";
  const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;
  measureCtx.font = `${fontSize}px ${fontFamily}`;
  const lines = normalizedText.split("\n").flatMap((line) => wrapCanvasLine(measureCtx, line, pageWidth - margin * 2));
  const linesPerPage = Math.max(1, Math.floor((pageHeight - margin * 2) / lineHeight));

  for (let i = 0; i < Math.max(lines.length, 1); i += linesPerPage) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(pageWidth * scale);
    canvas.height = Math.round(pageHeight * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageWidth, pageHeight);
    ctx.fillStyle = "#1f2937";
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";

    const pageLines = lines.slice(i, i + linesPerPage);
    pageLines.forEach((line, j) => {
      ctx.fillText(line, margin, margin + j * lineHeight);
    });

    const blob = await canvasToBlob(canvas, "image/png");
    const image = await doc.embedPng(new Uint8Array(await blob.arrayBuffer()));
    const page = doc.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
  }

  return doc.save();
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
  ranges: PageRange[]
): Promise<{ name: string; data: Uint8Array }[]> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const results: { name: string; data: Uint8Array }[] = [];
  for (const { start, end } of ranges) {
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
  // Strip all metadata for maximum size reduction
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
  doc.setCreationDate(new Date(0));
  doc.setModificationDate(new Date(0));
  return doc.save({ useObjectStreams: true, addDefaultPage: false });
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
      const textH = font.heightAtSize(fontSize);
      const rad = (rotation * Math.PI) / 180;
      const x = (width - textW * Math.abs(Math.cos(rad))) / 2;
      const y = (height - textH) / 2;
      page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.6, 0.6, 0.6), opacity, rotate: degrees(rotation) });
    }
  }
  return doc.save();
}

async function stitchImages(imageFiles: File[], direction: "vertical" | "horizontal"): Promise<Uint8Array> {
  const imgs = await Promise.all(imageFiles.map(loadImageFromFile));
  const canvas = document.createElement("canvas");
  if (direction === "vertical") {
    canvas.width = Math.max(...imgs.map((i) => i.width));
    canvas.height = imgs.reduce((sum, i) => sum + i.height, 0);
    const ctx = canvas.getContext("2d")!;
    let y = 0;
    for (const img of imgs) { ctx.drawImage(img, 0, y); y += img.height; }
  } else {
    canvas.width = imgs.reduce((sum, i) => sum + i.width, 0);
    canvas.height = Math.max(...imgs.map((i) => i.height));
    const ctx = canvas.getContext("2d")!;
    let x = 0;
    for (const img of imgs) { ctx.drawImage(img, x, 0); x += img.width; }
  }
  const blob = await canvasToBlob(canvas, "image/png");
  return new Uint8Array(await blob.arrayBuffer());
}

async function convertImageFormat(file: File, format: "png" | "jpeg" | "webp"): Promise<{ name: string; data: Uint8Array }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  const ext = format === "jpeg" ? "jpg" : format;
  const blob = await canvasToBlob(canvas, `image/${format}`, 0.92);
  const data = new Uint8Array(await blob.arrayBuffer());
  const name = replaceExtension(file.name, `.${ext}`);
  return { name, data };
}

async function htmlToPdf(htmlContent: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await getPdfLib();
  // Strip HTML tags safely using DOMParser (no script execution)
  const parsed = new DOMParser().parseFromString(htmlContent, "text/html");
  const text = normalizePdfText(parsed.body.textContent || "");

  if (needsImagePdfRendering(text)) {
    return textToImagePdf(text);
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = text.split("\n").flatMap((line) => {
    // Word-wrap at ~80 chars
    const wrapped: string[] = [];
    let remaining = line;
    while (remaining.length > 80) {
      const breakAt = remaining.lastIndexOf(" ", 80);
      const idx = breakAt > 40 ? breakAt : 80;
      wrapped.push(remaining.slice(0, idx));
      remaining = remaining.slice(idx).trimStart();
    }
    wrapped.push(remaining);
    return wrapped;
  });
  // Collapse consecutive empty lines to max 2
  const filtered: string[] = [];
  let emptyCount = 0;
  for (const line of lines) {
    if (line.trim() === "") { emptyCount++; if (emptyCount <= 2) filtered.push(line); }
    else { emptyCount = 0; filtered.push(line); }
  }
  const linesPerPage = 50;
  const fontSize = 11;
  const pageCount = Math.max(1, Math.ceil(filtered.length / linesPerPage));
  for (let p = 0; p < pageCount; p++) {
    const page = doc.addPage([612, 792]); // US Letter
    const pageLines = filtered.slice(p * linesPerPage, (p + 1) * linesPerPage);
    pageLines.forEach((line, j) => {
      page.drawText(line, { x: 50, y: 742 - j * 14, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    });
  }
  return doc.save();
}

async function resizeImage(file: File, scale: number): Promise<{ name: string; data: Uint8Array; w: number; h: number }> {
  const img = await loadImageFromFile(file);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const isPng = file.name.toLowerCase().endsWith(".png");
  if (!isPng) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await canvasToBlob(canvas, isPng ? "image/png" : "image/jpeg", 0.92);
  const data = new Uint8Array(await blob.arrayBuffer());
  const name = replaceExtension(file.name, `_${w}x${h}${isPng ? ".png" : ".jpg"}`);
  return { name, data, w, h };
}

async function compressImage(file: File, quality: number): Promise<{ name: string; data: Uint8Array; before: number; after: number }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, "image/jpeg", quality);
  const data = new Uint8Array(await blob.arrayBuffer());
  const name = replaceExtension(file.name, "_compressed.jpg");
  return { name, data, before: file.size, after: data.length };
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const doc = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      try {
        const content = await page.getTextContent();
        const text = content.items.map((item: unknown) => (item as { str?: string }).str || "").join(" ");
        pages.push(`--- Page ${i} ---\n${text}`);
      } finally {
        page.cleanup();
      }
    }
    return pages.join("\n\n");
  } finally {
    await doc.destroy();
  }
}

async function docxToHtml(data: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ arrayBuffer: data });
  return sanitizePreviewHtml(result.value);
}

async function pdfToImages(data: ArrayBuffer, onProgress?: (pct: number) => void): Promise<{ name: string; data: Uint8Array }[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const doc = await loadingTask.promise;
  try {
    const results: { name: string; data: Uint8Array }[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      onProgress?.(Math.round(((i - 1) / doc.numPages) * 100));
      const page = await doc.getPage(i);
      let canvas: HTMLCanvasElement | null = null;
      try {
        const scale = 2;
        const viewport = page.getViewport({ scale });
        canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        const renderContext = { canvasContext: ctx, viewport };
        await page.render(renderContext as Parameters<typeof page.render>[0]).promise;
        const blob = await canvasToBlob(canvas, "image/png");
        const imageData = new Uint8Array(await blob.arrayBuffer());
        results.push({ name: `page_${i}.png`, data: imageData });
      } finally {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        page.cleanup();
      }
    }
    onProgress?.(100);
    return results;
  } finally {
    await doc.destroy();
  }
}

async function imagesToPDF(imageFiles: File[]): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.create();
  for (const file of imageFiles) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isJpg = file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    let img;
    if (isJpg) {
      img = await doc.embedJpg(bytes);
    } else if (isPng) {
      img = await doc.embedPng(bytes);
    } else {
      // Convert browser-decodable non-JPEG/PNG files such as WebP to PNG, then embed.
      const image = await loadImageFromFile(file);
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d")!.drawImage(image, 0, 0);
      const blob = await canvasToBlob(canvas, "image/png");
      const pngBytes = new Uint8Array(await blob.arrayBuffer());
      img = await doc.embedPng(pngBytes);
    }
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
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
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (!message.includes("encrypt") && !message.includes("password")) {
      throw err;
    }
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
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
      aria-label="Toggle language"
    >
      <span className={lang === "ko" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}>KR</span>
      <span className="text-gray-300 dark:text-slate-600">/</span>
      <span className={lang === "en" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}>EN</span>
    </button>
  );
}

function DarkModeToggle({ dark, setDark }: { dark: boolean; setDark: (d: boolean) => void }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all text-sm"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>
      ) : (
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
      )}
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
    success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400",
    error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
    warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
  };
  const icons = { success: "\u2713", error: "\u2715", warning: "\u26A0" };

  const duration = type === "error" ? 8000 : type === "warning" ? 5000 : 3000;
  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [onDismiss, duration]);

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

function ImgThumb({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />;
}

function ResultImagePreview({ result, index }: { result: { name: string; data: Uint8Array }; index: number }) {
  const mime = getMimeTypeForFilename(result.name);
  const url = useMemo(() => {
    const blob = new Blob([toArrayBuffer(result.data)], { type: mime });
    return URL.createObjectURL(blob);
  }, [result.data, mime]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <button onClick={() => download(result.data, result.name, mime)}
      className="relative aspect-[4/3] bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-400 transition-all">
      <img src={url} alt={result.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
        <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
      </div>
      <span className="absolute bottom-1 left-1 text-[9px] text-white/80 bg-black/40 px-1 rounded">{index + 1}</span>
    </button>
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
  acceptType = ".pdf",
}: {
  files: File[];
  onSelect: (f: File[]) => void;
  onRemove?: (i: number) => void;
  onReorder?: (from: number, to: number) => void;
  multiple?: boolean;
  pageInfo: Record<string, number>;
  t: Record<string, string>;
  acceptType?: string;
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
          const dropped = Array.from(e.dataTransfer.files);
          onSelect(multiple ? [...files, ...dropped] : dropped.slice(0, 1));
        }}
      >
        <input ref={ref} type="file" accept={acceptType} multiple={multiple} className="hidden"
          onChange={(e) => {
            const nf = Array.from(e.target.files || []);
            onSelect(multiple ? [...files, ...nf] : nf);
            e.target.value = "";
          }}
        />
        {files.length === 0 ? (
          <>
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth="1.5">
              {acceptType.includes("image/") ? (
                <>
                  <rect x="6" y="6" width="36" height="36" rx="4" />
                  <circle cx="18" cy="18" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 34l10-10 6 6 8-8 12 12" />
                </>
              ) : acceptType.includes(".docx") ? (
                <>
                  <rect x="10" y="4" width="28" height="40" rx="3" />
                  <path strokeLinecap="round" d="M18 16h12M18 22h12M18 28h8" />
                </>
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 32l8-8 4 4 8-8 12 12M8 32V12a4 4 0 014-4h24a4 4 0 014 4v20M8 32h32a4 4 0 004-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M24 22v12m0 0l-4-4m4 4l4-4" />
                </>
              )}
            </svg>
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">
              {(() => {
                const fileType = acceptType.includes("image/") ? (t.uploadHint.includes("PDF") ? t.uploadHint.replace("PDF ", "") : t.uploadHint)
                  : acceptType.includes(".docx") ? t.uploadHint.replace("PDF", "DOCX")
                  : acceptType.includes(".html") ? t.uploadHint.replace("PDF", "HTML")
                  : t.uploadHint;
                return fileType;
              })()} <span className="text-blue-600 dark:text-blue-400 font-semibold">{t.uploadClick}</span>{t.uploadSuffix}
            </p>
            <button type="button" onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
              className="mt-3 px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all">
              {t.uploadClick}
            </button>
            {multiple && <p className="text-gray-400 dark:text-slate-500 text-xs mt-3">{t.multiHint}{acceptType.includes("image/") ? " · Ctrl+V" : ""}</p>}
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
                  ${dropIdx === i && dragIdx !== null && dragIdx !== i ? "border-blue-300 bg-blue-50 dark:bg-blue-950" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"}
                  ${onReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                {multiple && (
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                )}
                {onReorder && <span className="text-gray-400 text-xs flex-shrink-0 select-none">⠿</span>}
                {f.type.startsWith("image/") && <ImgThumb file={f} />}
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                  f.type === "application/pdf" ? "bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400" :
                  f.type.startsWith("image/") ? "bg-violet-50 dark:bg-violet-950/30 text-violet-500 dark:text-violet-400" :
                  "bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400"
                }`}>{f.name.split(".").pop()?.toUpperCase().slice(0, 4) || "FILE"}</span>
                <span className="text-gray-800 dark:text-slate-200 text-sm font-medium flex-1 truncate">{f.name}</span>
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
          ? "bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 cursor-not-allowed"
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

function ProgressBar({ progress }: { progress?: number }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
      {progress !== undefined && progress >= 0 ? (
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      ) : (
        <div className="progress-bar w-full h-full" />
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
        <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{q}</span>
        <span className={`text-gray-400 dark:text-slate-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>&#9662;</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="px-5 pb-4 text-sm text-gray-400 dark:text-slate-400 leading-relaxed">{a}</p>
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
function loadNumberStorage(key: string, fallback: number): number {
  const value = loadStorage<unknown>(key, fallback);
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}
function detectLang(): Lang {
  if (typeof window === "undefined") return "ko";
  try {
    const stored = localStorage.getItem("pdftk_lang");
    if (stored === "en" || stored === "ko") return stored;
    const parsed = stored ? JSON.parse(stored) : null;
    if (parsed === "en" || parsed === "ko") return parsed;
  } catch {}
  const nav = navigator.language.toLowerCase();
  return nav.startsWith("ko") ? "ko" : "en";
}

// ━━━ Related tools map (extracted from render for performance) ━━━
const RELATED_TOOLS: Record<Tool, Tool[]> = {
  unlock: ["merge", "compress", "info", "split"],
  merge: ["split", "compress", "pagenum", "unlock"],
  split: ["merge", "extract", "delete", "pagenum"],
  extract: ["split", "delete", "merge", "rotate"],
  rotate: ["extract", "split", "compress", "pagenum"],
  compress: ["unlock", "merge", "watermark", "info"],
  watermark: ["pagenum", "compress", "merge", "unlock"],
  pagenum: ["watermark", "merge", "compress", "split"],
  delete: ["extract", "split", "merge", "rotate"],
  imgstitch: ["imgconvert", "imgresize", "img2pdf", "imgcompress"],
  imgconvert: ["imgstitch", "imgcompress", "imgresize", "img2pdf"],
  imgresize: ["imgconvert", "imgcompress", "img2pdf", "merge"],
  imgcompress: ["imgresize", "img2pdf", "pdf2img", "compress"],
  pdftext: ["info", "pdf2img", "extract", "docx2html"],
  txt2pdf: ["html2pdf", "img2pdf", "merge", "watermark"],
  html2pdf: ["txt2pdf", "docx2html", "img2pdf", "pdftext"],
  docx2html: ["html2pdf", "pdftext", "img2pdf", "pdf2img"],
  pdf2img: ["img2pdf", "docx2html", "extract", "split"],
  img2pdf: ["pdf2img", "merge", "compress", "watermark"],
  info: ["unlock", "compress", "merge", "img2pdf"],
};

// ━━━ Main Page ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ToolkitApp({ initialTool = "home" }: { initialTool?: View }) {
  const [view, setView] = useState<View>(initialTool);
  const [lang, setLang] = useState<Lang>("ko");
  const [dark, setDark] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [toolSearch, setToolSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [processCount, setProcessCount] = useState(0);
  const [pageInfo, setPageInfo] = useState<Record<string, number>>({});

  // Hydrate non-sensitive preferences from localStorage on mount
  useEffect(() => {
    setLang(detectLang());
    setProcessCount(loadNumberStorage("pdftk_count", 0));
    try { localStorage.removeItem("pdftk_history"); } catch {}
    // Dark mode: check stored preference or system preference
    let storedDark: string | null = null;
    try { storedDark = localStorage.getItem("pdftk_dark"); } catch {}
    if (storedDark !== null) {
      setDark(storedDark === "true");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Persist non-sensitive preferences only.
  useEffect(() => {
    try { localStorage.setItem("pdftk_lang", lang); } catch {}
    document.documentElement.lang = lang === "ko" ? "ko" : "en";
  }, [lang]);
  useEffect(() => { if (processCount > 0) saveStorage("pdftk_count", processCount); }, [processCount]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("pdftk_dark", String(dark)); } catch {}
  }, [dark]);

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
  const [imgQuality, setImgQuality] = useState(0.7);
  const [imgScale, setImgScale] = useState(0.5);
  const [imgOutputFormat, setImgOutputFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [textInput, setTextInput] = useState("");
  const [stitchDir, setStitchDir] = useState<"vertical" | "horizontal">("vertical");
  const [batchProgress, setBatchProgress] = useState<number>(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Result state
  const [resultData, setResultData] = useState<Uint8Array | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultMulti, setResultMulti] = useState<{ name: string; data: Uint8Array }[]>([]);
  const [pdfInfoResult, setPdfInfoResult] = useState<PdfInfo | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{ before: number; after: number } | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [procTime, setProcTime] = useState<number | null>(null);

  const t = T[lang];

  useEffect(() => {
    setConfirmDelete(false);
  }, [deleteInput, files, view]);

  // Search ref for "/" shortcut
  const searchRef = useRef<HTMLInputElement>(null);
  const goHomeRef = useRef<() => void>(() => {});
  const resetStateRef = useRef<() => void>(() => {});
  type ExecuteValidationContext = {
    processing: boolean;
    filesCount: number;
    splitMode: "range" | "all";
    rangeInput: string;
    pagesInput: string;
    rotateScope: "all" | "specific";
    rotatePagesInput: string;
    deleteInput: string;
    wmText: string;
    textInput: string;
  };
  const executeValidators: Record<string, (ctx: ExecuteValidationContext) => boolean> = useMemo(
    () => ({
      home: ({}) => false,
      unlock: ({ processing, filesCount }) => !processing && filesCount > 0,
      merge: ({ processing, filesCount }) => !processing && filesCount >= 2,
      split: ({ processing, filesCount, splitMode, rangeInput }) =>
        !processing && filesCount > 0 && (splitMode === "all" || rangeInput.trim().length > 0),
      extract: ({ processing, filesCount, pagesInput }) => !processing && filesCount > 0 && pagesInput.trim().length > 0,
      rotate: ({ processing, filesCount, rotateScope, rotatePagesInput }) =>
        !processing && filesCount > 0 && (rotateScope === "all" || rotatePagesInput.trim().length > 0),
      compress: ({ processing, filesCount }) => !processing && filesCount > 0,
      watermark: ({ processing, filesCount, wmText }) =>
        !processing && filesCount > 0 && isValidWatermarkText(wmText),
      pagenum: ({ processing, filesCount }) => !processing && filesCount > 0,
      delete: ({ processing, filesCount, deleteInput }) =>
        !processing && filesCount > 0 && deleteInput.trim().length > 0,
      info: () => false,
      imgstitch: ({ processing, filesCount }) => !processing && filesCount >= 2,
      imgconvert: ({ processing, filesCount }) => !processing && filesCount > 0,
      imgresize: ({ processing, filesCount }) => !processing && filesCount > 0,
      imgcompress: ({ processing, filesCount }) => !processing && filesCount > 0,
      pdftext: ({ processing, filesCount }) => !processing && filesCount > 0,
      txt2pdf: ({ processing, textInput }) => !processing && textInput.trim().length > 0,
      html2pdf: ({ processing, filesCount }) => !processing && filesCount > 0,
      docx2html: ({ processing, filesCount }) => !processing && filesCount > 0,
      pdf2img: ({ processing, filesCount }) => !processing && filesCount > 0,
      img2pdf: ({ processing, filesCount }) => !processing && filesCount > 0,
    }),
    []
  );

  // Basic keyboard shortcuts (Escape, /)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "Escape" && view !== "home" && !processing) goHomeRef.current();
      if (e.key === "/" && view === "home" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, processing]);

  // Preload pdf-lib when entering a tool page (skip for tools that don't need it)
  useEffect(() => {
    if (view !== "home" && !NO_PDF_LIB_PRELOAD_TOOLS.includes(view)) getPdfLib();
  }, [view]);

  const addHistory = useCallback((action: string, file: string, ok: boolean, toolId?: string) => {
    setHistory((prev) => [{ time: fmtTime(), action, file, ok, toolId }, ...prev].slice(0, 30));
  }, []);

  const clearResults = () => {
    setResultData(null);
    setResultMulti([]);
    setPdfInfoResult(null);
    setCompressionInfo(null);
    setHtmlPreview(null);
    setProcTime(null);
    setBatchProgress(-1);
  };

  const resetState = () => {
    setFiles([]);
    setMessage(null);
    setResultName("");
    setRangeInput("");
    setPagesInput("");
    setRotatePagesInput("");
    setDeleteInput("");
    setTextInput("");
    setPageInfo({});
    setConfirmDelete(false);
    clearResults();
  };
  resetStateRef.current = resetState;

  const goTool = (tool: Tool) => {
    setView(tool);
    resetState();
    setToolSearch("");
    window.history.pushState(null, "", `/${tool}`);
    window.scrollTo(0, 0);
  };
  const goHome = () => {
    setView("home");
    resetState();
    setToolSearch("");
    window.history.pushState(null, "", "/");
    window.scrollTo(0, 0);
  };
  goHomeRef.current = goHome;

  // Sync URL with browser back/forward
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname.slice(1);
      if (isValidTool(path)) {
        setView(path);
      } else {
        setView("home");
      }
      resetStateRef.current();
      setToolSearch("");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
    // Only compute page count for files not already cached
    const uncached = fileList.filter((f) => !pageInfo[f.name + f.size + f.lastModified]);
    if (uncached.length === 0) return;
    const entries = await Promise.all(
      uncached.map(async (f) => {
        const key = f.name + f.size + f.lastModified;
        return [key, await getPageCount(f)] as const;
      })
    );
    setPageInfo((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  };

  const handleFiles = async (newFiles: File[]) => {
    // Validate files based on current tool
    let validFiles: File[];
    let nextMessage: { type: "success" | "error" | "warning"; text: string } | null = null;
    if (isImageInputTool(view)) {
      validFiles = newFiles.filter(isImageFile);
      const rejected = newFiles.length - validFiles.length;
      if (rejected > 0 && validFiles.length === 0) {
        setMessage({ type: "error", text: t.errImgOnly });
        return;
      }
      if (rejected > 0) {
        nextMessage = { type: "warning", text: `${rejected}${t.warnExcludedImg}` };
      }
    } else if (view === "html2pdf") {
      validFiles = newFiles.filter(isHtmlFile);
      if (validFiles.length === 0) {
        setMessage({ type: "error", text: t.errHtmlOnly });
        return;
      }
    } else if (view === "docx2html") {
      validFiles = newFiles.filter(isDocxFile);
      if (validFiles.length === 0) {
        setMessage({ type: "error", text: t.errDocxOnly });
        return;
      }
    } else {
      validFiles = newFiles.filter(isPdfFile);
      const rejected = newFiles.length - validFiles.length;
      if (rejected > 0 && validFiles.length === 0) {
        setMessage({ type: "error", text: t.errPdfOnly });
        return;
      }
      if (rejected > 0) {
        nextMessage = { type: "warning", text: `${rejected}${t.warnExcludedPdf}` };
      }
    }
    setFiles(validFiles);
    setMessage(nextMessage);
    setConfirmDelete(false);
    clearResults();
    if (view !== "home" && !NO_PAGE_INFO_TOOLS.includes(view)) loadPageInfo(validFiles);
    // Large file warning
    const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      setMessage({ type: "warning", text: `${fmtSize(totalSize)} — ${t.warnLargeFile}` });
    }
    if (view === "info" && validFiles.length > 0) {
      try {
        const buf = await validFiles[0].arrayBuffer();
        setPdfInfoResult(await getPdfInfo(buf, validFiles[0].size));
      } catch {
        setMessage({ type: "error", text: t.infoInvalid });
      }
    }
  };

  // Clipboard paste support for image tools (uses refs to avoid stale closures)
  const filesRef = useRef(files);
  const handleFilesRef = useRef(handleFiles);
  filesRef.current = files;
  handleFilesRef.current = handleFiles;
  useEffect(() => {
    if (!isImageInputTool(view)) return;
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFilesRef.current([...filesRef.current, ...imageFiles]);
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [view]);

  // ─── Execute ───
  const execute = async () => {
    if (files.length === 0 && view !== "txt2pdf") return;
    const startTime = performance.now();
    setProcessing(true);
    setMessage(null);
    setResultName("");
    clearResults();
    // Pre-warm pdf-lib on first use — skip for pure image tools that don't need it
    if (view !== "home" && !_pdfLib && !NO_PDF_LIB_PRELOAD_TOOLS.includes(view)) {
      setMessage({ type: "warning", text: t.engineLoading });
      await getPdfLib();
      setMessage(null);
    }

    let completed = false;
    try {
      const toolLabel = t[activeTool?.labelKey || ""] || "";
      const recordSuccess = (fileLabel: string) => {
        completed = true;
        addHistory(toolLabel, fileLabel, true, view);
      };
      switch (view) {
        case "unlock": {
          if (files.length === 1) {
            const buf = await files[0].arrayBuffer();
            const data = await unlockPDF(buf);
            setResultData(data);
            setResultName(replaceExtension(files[0].name, "_unlocked.pdf"));
            setMessage({ type: "success", text: t.msgUnlocked });
            recordSuccess(files[0].name);
          } else {
            // Batch unlock with progress
            const results: { name: string; data: Uint8Array }[] = [];
            for (let idx = 0; idx < files.length; idx++) {
              setBatchProgress(Math.round((idx / files.length) * 100));
              setMessage({ type: "warning", text: `${t.msgBatchProcess} ${idx + 1}/${files.length}...` });
              const buf = await files[idx].arrayBuffer();
              const data = await unlockPDF(buf);
              results.push({ name: replaceExtension(files[idx].name, "_unlocked.pdf"), data });
            }
            setBatchProgress(100);
            setResultMulti(results);
            setMessage({ type: "success", text: `${files.length}${t.msgBatchUnlocked}` });
            recordSuccess(`${files.length} files`);
          }
          break;
        }
        case "merge": {
          const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
          const data = await mergePDFs(buffers);
          setResultData(data);
          setResultName("merged.pdf");
          const info = await getPdfInfo(toArrayBuffer(data), data.length);
          setMessage({ type: "success", text: `${files.length}${t.msgMerged} (${t.msgMergedPages.replace("{n}", String(info.pages))})` });
          recordSuccess(`${files.length} files`);
          break;
        }
        case "split": {
          const { buffer: buf, info } = await loadPdfForOperation(files[0]);
          const ranges = splitMode === "all"
            ? Array.from({ length: info.pages }, (_, i) => ({ start: i + 1, end: i + 1 }))
            : parsePageRangeGroups(rangeInput, info.pages);
          if (!ranges) { setMessage({ type: "warning", text: t.extractInvalid }); break; }
          const results = await splitPDF(buf, ranges);
          setResultMulti(results);
          setMessage({ type: "success", text: `${results.length}${t.msgSplit}` });
          recordSuccess(files[0].name);
          break;
        }
        case "extract": {
          const { buffer: buf, info } = await loadPdfForOperation(files[0]);
          const pages = parsePageRanges(pagesInput, info.pages, { preserveOrder: true });
          if (pages.length === 0) { setMessage({ type: "warning", text: t.extractInvalid }); break; }
          const data = await extractPages(buf, pages);
          setResultData(data);
          setResultName(replaceExtension(files[0].name, "_extracted.pdf"));
          setMessage({ type: "success", text: `${pages.length}${t.msgExtracted}` });
          recordSuccess(files[0].name);
          break;
        }
        case "rotate": {
          const { buffer: buf, info } = await loadPdfForOperation(files[0]);
          let pageNums: number[] | undefined;
          if (rotateScope === "specific" && rotatePagesInput) {
            pageNums = parsePageRanges(rotatePagesInput, info.pages);
            if (pageNums.length === 0) { setMessage({ type: "warning", text: t.extractInvalid }); break; }
          }
          const data = await rotatePages(buf, rotateDeg, pageNums);
          setResultData(data);
          setResultName(replaceExtension(files[0].name, "_rotated.pdf"));
          setMessage({ type: "success", text: `${rotateDeg}°${t.msgRotated}` });
          recordSuccess(files[0].name);
          break;
        }
        case "compress": {
          const buf = await files[0].arrayBuffer();
          const data = await compressPDF(buf);
          const saved = files[0].size - data.length;
          if (saved > 0) {
            setResultData(data);
            setResultName(replaceExtension(files[0].name, "_compressed.pdf"));
            setCompressionInfo({ before: files[0].size, after: data.length });
            setMessage({ type: "success", text: `${fmtSize(saved)} ${t.compressSaved} (${Math.round((saved / files[0].size) * 100)}% ${t.compressPercent})` });
          } else {
            setResultData(new Uint8Array(buf));
            setResultName(files[0].name);
            setMessage({ type: "warning", text: t.compressAlready });
          }
          recordSuccess(files[0].name);
          break;
        }
        case "watermark": {
          const buf = await files[0].arrayBuffer();
          const data = await addWatermark(buf, wmText, wmSize, wmOpacity, wmRotation, wmPosition);
          setResultData(data);
          setResultName(replaceExtension(files[0].name, "_watermarked.pdf"));
          setMessage({ type: "success", text: t.msgWatermarked });
          recordSuccess(files[0].name);
          break;
        }
        case "pagenum": {
          const buf = await files[0].arrayBuffer();
          const data = await addPageNumbers(buf, pnFormat, pnPosition, pnSize);
          setResultData(data);
          setResultName(replaceExtension(files[0].name, "_numbered.pdf"));
          const info = await getPdfInfo(toArrayBuffer(data), data.length);
          setMessage({ type: "success", text: `${info.pages}${t.msgNumbered}` });
          recordSuccess(files[0].name);
          break;
        }
        case "delete": {
          if (!confirmDelete) {
            setConfirmDelete(true);
            setMessage({ type: "warning", text: t.deleteConfirm });
            setProcessing(false);
            return;
          }
          setConfirmDelete(false);
          const { buffer: buf, info } = await loadPdfForOperation(files[0]);
          const pages = parsePageRanges(deleteInput, info.pages);
          if (pages.length === 0) { setMessage({ type: "warning", text: t.extractInvalid }); break; }
          if (pages.length >= info.pages) {
            setMessage({ type: "error", text: t.msgDeleteAll });
            break;
          }
          const data = await deletePagesFromPDF(buf, pages);
          setResultData(data);
          setResultName(replaceExtension(files[0].name, "_edited.pdf"));
          setMessage({ type: "success", text: `${pages.length}${t.msgDeleted} (${info.pages - pages.length}${t.msgRemaining})` });
          recordSuccess(files[0].name);
          break;
        }
        case "imgstitch": {
          if (files.length < 2) { setMessage({ type: "warning", text: t.msgNeedImages }); break; }
          const data = await stitchImages(files, stitchDir);
          setResultData(data);
          setResultName(`stitched_${stitchDir}.png`);
          setMessage({ type: "success", text: `${files.length}${t.msgStitched}` });
          recordSuccess(`${files.length} images`);
          break;
        }
        case "txt2pdf": {
          if (!textInput.trim()) { setMessage({ type: "warning", text: t.msgEmptyTxt }); break; }
          const data = await htmlToPdf(`<pre>${escapeHtml(textInput)}</pre>`);
          setResultData(data);
          setResultName("text.pdf");
          setMessage({ type: "success", text: t.msgTxtDone });
          recordSuccess("text input");
          break;
        }
        case "imgconvert": {
          const results: { name: string; data: Uint8Array }[] = [];
          for (let fi = 0; fi < files.length; fi++) {
            setBatchProgress(Math.round((fi / files.length) * 100));
            results.push(await convertImageFormat(files[fi], imgOutputFormat));
          }
          setBatchProgress(100);
          if (results.length === 1) {
            setResultData(results[0].data);
            setResultName(results[0].name);
          } else {
            setResultMulti(results);
          }
          setMessage({ type: "success", text: `${results.length}${t.msgImgConverted} (${imgOutputFormat.toUpperCase()})` });
          recordSuccess(`${files.length} images`);
          break;
        }
        case "html2pdf": {
          const text = await files[0].text();
          if (!text.trim()) { setMessage({ type: "warning", text: t.msgEmptyHtml }); break; }
          const data = await htmlToPdf(text);
          setResultData(data);
          setResultName(replaceExtension(files[0].name, ".pdf"));
          setMessage({ type: "success", text: t.msgHtmlDone });
          recordSuccess(files[0].name);
          break;
        }
        case "imgresize": {
          const results: { name: string; data: Uint8Array }[] = [];
          for (let fi = 0; fi < files.length; fi++) {
            setBatchProgress(Math.round((fi / files.length) * 100));
            const r = await resizeImage(files[fi], imgScale);
            results.push({ name: r.name, data: r.data });
          }
          setBatchProgress(100);
          if (results.length === 1) {
            setResultData(results[0].data);
            setResultName(results[0].name);
          } else {
            setResultMulti(results);
          }
          setMessage({ type: "success", text: `${results.length}${t.msgImgResized} (${Math.round(imgScale * 100)}%)` });
          recordSuccess(`${files.length} images`);
          break;
        }
        case "imgcompress": {
          const results: { name: string; data: Uint8Array }[] = [];
          let totalBefore = 0, totalAfter = 0;
          for (let fi = 0; fi < files.length; fi++) {
            setBatchProgress(Math.round((fi / files.length) * 100));
            const r = await compressImage(files[fi], imgQuality);
            results.push({ name: r.name, data: r.data });
            totalBefore += r.before;
            totalAfter += r.after;
          }
          setBatchProgress(100);
          if (results.length === 1) {
            setResultData(results[0].data);
            setResultName(results[0].name);
          } else {
            setResultMulti(results);
          }
          setCompressionInfo({ before: totalBefore, after: totalAfter });
          const saved = Math.max(0, totalBefore - totalAfter);
          const pct = totalBefore > 0 ? Math.round((saved / totalBefore) * 100) : 0;
          setMessage(saved > 0
            ? { type: "success", text: `${fmtSize(saved)} ${t.compressSaved} (${pct}% ${t.compressPercent})` }
            : { type: "warning", text: t.compressAlready });
          recordSuccess(`${files.length} images`);
          break;
        }
        case "pdftext": {
          const buf = await files[0].arrayBuffer();
          const text = await extractPdfText(buf);
          setHtmlPreview(`<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit">${escapeHtml(text)}</pre>`);
          setMessage({ type: "success", text: t.msgTextExtracted });
          recordSuccess(files[0].name);
          break;
        }
        case "docx2html": {
          const buf = await files[0].arrayBuffer();
          const html = await docxToHtml(buf);
          setHtmlPreview(html);
          setMessage({ type: "success", text: t.msgDocxDone });
          recordSuccess(files[0].name);
          break;
        }
        case "pdf2img": {
          const buf = await files[0].arrayBuffer();
          setMessage({ type: "warning", text: t.msgPdfToImg });
          const images = await pdfToImages(buf, (pct) => setBatchProgress(pct));
          setResultMulti(images);
          setMessage({ type: "success", text: `${images.length}${t.msgPdfToImgDone}` });
          recordSuccess(files[0].name);
          break;
        }
        case "img2pdf": {
          const data = await imagesToPDF(files);
          setResultData(data);
          setResultName(files.length === 1 ? replaceExtension(files[0].name, ".pdf") : `${files.length}_images.pdf`);
          const info = await getPdfInfo(toArrayBuffer(data), data.length);
          setMessage({ type: "success", text: `${files.length}${t.msgImgToPdfDone} (${info.pages}p)` });
          recordSuccess(`${files.length} images`);
          break;
        }
      }
      if (completed) setProcessCount((c) => c + 1);
    } catch (err: unknown) {
      let errMsg = t.msgError;
      if (err instanceof Error) {
        if (err.message.includes("encrypt") || err.message.includes("password")) {
          errMsg = t.msgPassword;
        } else if (err.message.includes("invalid") || err.message.includes("Failed to parse")) {
          errMsg = t.msgCorrupt;
        } else {
          errMsg = err.message;
        }
      }
      setMessage({ type: "error", text: errMsg });
      if (files[0]) addHistory(t[activeTool?.labelKey || ""] || "", files[0].name, false, view);
    } finally {
      setProcessing(false);
      setBatchProgress(-1);
      if (completed) {
        setProcTime(Math.round(performance.now() - startTime));
        setTimeout(() => {
          const el = document.getElementById("results-area");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  };

  const executeRef = useRef(execute);
  executeRef.current = execute;

  const canExecute = (executeValidators[view] || executeValidators.home)({
    filesCount: files.length,
    splitMode,
    rangeInput,
    pagesInput,
    rotateScope,
    rotatePagesInput,
    deleteInput,
    wmText,
    textInput,
    processing,
  });

  const activeTool = view === "home" ? undefined : TOOL_BY_ID[view];

  // Ctrl+Enter to execute (must be after canExecute/execute are defined)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && view !== "home" && canExecute && !processing) {
        e.preventDefault();
        executeRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, canExecute, processing]);

  // Header rendered inline (depends on goHome, view, t, lang, setLang)
  const headerEl = (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-slate-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <button onClick={goHome} className="flex items-center gap-2.5 group" aria-label="Go home">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-sm group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="1.5" stroke="#2563eb" strokeWidth="1.5"/><path d="M5 4.5h6M5 7h6M5 9.5h4" stroke="#2563eb" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>
          </div>
          <span className="text-sm font-bold tracking-tight hidden sm:block dark:text-slate-100">
            File<span className="text-blue-600 dark:text-blue-400">Forge</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          {view !== "home" && (
            <button onClick={goHome} className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300 transition-colors hidden sm:block">
              {t.allTools}
            </button>
          )}
          <DarkModeToggle dark={dark} setDark={setDark} />
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
        <div id="main-content" className="min-h-screen pt-14" key="home">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 view-enter">
            {/* Hero */}
            <div className="relative text-center mb-16 sm:mb-24 pt-4 sm:pt-8 animate-fadeInUp">
              <div className="hero-gradient" />
              <div className="relative">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-5 py-2 rounded-full uppercase tracking-[2px] mb-10 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                  {t.heroTag}
                </div>

                {/* Title */}
                <h1 className="text-[3.2rem] sm:text-7xl lg:text-[6rem] font-black tracking-[-0.04em] leading-[0.9]">
                  <span className="text-gray-900 dark:text-white">{t.heroTitle1}</span>
                  <span className="gradient-text">{t.heroTitle2}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-gray-600 dark:text-slate-300 text-lg sm:text-xl mt-6 font-medium max-w-lg mx-auto leading-relaxed">
                  {lang === "ko" ? "문서를 " : "The easiest way to "}
                  <span className="word-rotate gradient-text font-bold">
                    <span>{lang === "ko" ? "변환하고" : "convert"}</span>
                    <span>{lang === "ko" ? "병합하고" : "merge"}</span>
                    <span>{lang === "ko" ? "분할하고" : "split"}</span>
                    <span>{lang === "ko" ? "보호하고" : "protect"}</span>
                    <span>{lang === "ko" ? "편집하는" : "edit"}</span>
                  </span>
                  {lang === "ko" ? " 가장 쉬운 방법" : " your documents"}
                </p>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-3 max-w-md mx-auto">
                  {t.heroSub}
                </p>

                {/* CTA Buttons */}
                <div className="flex justify-center gap-3 mt-10">
                  <button onClick={() => goTool("unlock")}
                    className="group px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                    {t.heroCta}
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </button>
                  <button onClick={() => { const el = document.getElementById("tool-grid"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:-translate-y-0.5 transition-all shadow-sm">
                    {t.heroCtaSub} &darr;
                  </button>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-3 sm:gap-5 mt-10 flex-wrap">
                  {[t.trust1, t.trust2, t.trust3, t.trust4].map((label) => (
                    <span key={label} className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 text-[11px] font-medium">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {label}
                    </span>
                  ))}
                  {processCount > 0 && (
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                      <AnimatedCounter target={processCount} /> {t.processed}
                    </span>
                  )}
                </div>

                {/* Format pills */}
                <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
                  {["PDF", "DOCX", "JPG", "PNG", "WebP", "HTML"].map((fmt) => (
                    <span key={fmt} className="px-3 py-1 rounded-full bg-gray-100/80 dark:bg-slate-800/80 text-[10px] font-bold text-gray-500 dark:text-slate-400 tracking-wide">
                      {fmt}
                    </span>
                  ))}
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm shadow-blue-600/20">
                    {TOOLS.length}{t.toolCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Tool Grid */}
            <div id="tool-grid" />
            {/* Search */}
            <div className="relative mb-6">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                ref={searchRef}
                type="text"
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && toolSearch) {
                    const match = TOOLS.find((td) =>
                      t[td.labelKey].toLowerCase().includes(toolSearch.toLowerCase()) ||
                      td.labelEn.toLowerCase().includes(toolSearch.toLowerCase())
                    );
                    if (match) { goTool(match.id); setToolSearch(""); }
                  }
                  if (e.key === "Escape") { setToolSearch(""); searchRef.current?.blur(); }
                }}
                placeholder={t.searchPlaceholder}
                className="input-field pl-11 pr-16 py-3"
              />
              {toolSearch ? (
                <button onClick={() => setToolSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-xs">{"\u2715"}</button>
              ) : (
                <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 dark:text-slate-600 font-mono border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5">/</kbd>
              )}
            </div>
            {/* Categorized Grid */}
            {(["pdf", "image", "document"] as const).map((cat) => {
              const catTools = TOOLS.filter((td) => td.category === cat && (
                !toolSearch ||
                t[td.labelKey].toLowerCase().includes(toolSearch.toLowerCase()) ||
                td.labelEn.toLowerCase().includes(toolSearch.toLowerCase()) ||
                t[td.descKey].toLowerCase().includes(toolSearch.toLowerCase())
              ));
              if (catTools.length === 0) return null;
              const catLabel = cat === "pdf" ? t.catPdf : cat === "image" ? t.catImage : t.catDocument;
              return (
                <div key={cat} className="mb-8">
                  <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                    <span>{catLabel}</span>
                    <span className="text-[10px] font-mono text-gray-300 dark:text-slate-600">{catTools.length}</span>
                  </h2>
                  <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 ${!toolSearch ? "stagger-children" : ""}`}>
                    {catTools.map((td, idx) => (
                      <button key={td.id} onClick={() => goTool(td.id)}
                        style={!toolSearch ? { "--stagger-i": idx } as React.CSSProperties : undefined}
                        className="tool-card p-5 sm:p-6 text-left group relative overflow-hidden"
                        aria-label={`${t[td.labelKey]} - ${t[td.descKey]}`}>
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                          style={{ background: `${td.hex}12`, border: `1px solid ${td.hex}15` }}>
                          {td.icon}
                        </div>
                        <h3 className="text-[13px] sm:text-sm font-bold tracking-tight text-gray-900 dark:text-slate-100 mb-0.5 flex items-center gap-1.5">
                          {t[td.labelKey]}
                          {td.isNew && <span className="text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white leading-none">NEW</span>}
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-relaxed mt-1 line-clamp-2">{t[td.descKey]}</p>
                        {/* Hover gradient overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[20px]"
                          style={{ background: `linear-gradient(135deg, ${td.hex}06 0%, ${td.hex}02 100%)` }} />
                        {/* Bottom accent line on hover */}
                        <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: td.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {toolSearch && TOOLS.filter((td) => t[td.labelKey].toLowerCase().includes(toolSearch.toLowerCase()) || td.labelEn.toLowerCase().includes(toolSearch.toLowerCase()) || t[td.descKey].toLowerCase().includes(toolSearch.toLowerCase())).length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">
                {t.noResults}
              </div>
            )}

            {/* How It Works — hidden during search */}
            {!toolSearch && <div className="mt-20 sm:mt-28">
              <h2 className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-[3px] mb-12">{t.howTitle}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { num: "1", title: t.how1, desc: t.how1Desc, color: "from-blue-600 to-blue-700" },
                  { num: "2", title: t.how2, desc: t.how2Desc, color: "from-violet-600 to-violet-700" },
                  { num: "3", title: t.how3, desc: t.how3Desc, color: "from-emerald-600 to-emerald-700" },
                ].map((step, i) => (
                  <div key={i} className="text-center relative group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-105 transition-transform`}>{step.num}</div>
                    {i < 2 && <div className="hidden sm:block absolute top-7 left-[60%] w-[80%] h-px bg-gradient-to-r from-gray-200 dark:from-slate-700 to-transparent" />}
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-1.5">{step.title}</h3>
                    <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>}

            {/* Features — hidden during search */}
            {!toolSearch && <>
            <div className="mt-20 sm:mt-28 -mx-4 sm:-mx-6 px-4 sm:px-6 py-16 sm:py-20 rounded-[2rem] bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950 border border-gray-100/50 dark:border-slate-800/50">
              <h2 className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-[3px] mb-3">{t.whyTitle}</h2>
              <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-12 max-w-md mx-auto">{t.heroSub.split("\n")[0]}</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
                {features.map((f, i) => {
                  const gradients = [
                    "from-blue-500/10 to-violet-500/5",
                    "from-amber-500/10 to-orange-500/5",
                    "from-emerald-500/10 to-teal-500/5",
                    "from-pink-500/10 to-rose-500/5",
                  ];
                  return (
                    <div key={i} className={`relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br ${gradients[i]} border border-white/60 dark:border-slate-700/40 hover:-translate-y-1 transition-all group`}>
                      <div className="text-3xl mb-4">{f.icon}</div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-2">{f.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison */}
            <div className="mt-20 sm:mt-24 max-w-2xl mx-auto">
              <h2 className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-[3px] mb-10">{t.compareTitle}</h2>
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-[11px] sm:text-xs font-semibold">
                  <div className="px-3 sm:px-5 py-3 text-gray-500 dark:text-slate-400">{t.compareFeature}</div>
                  <div className="px-2 sm:px-5 py-3 text-blue-600 dark:text-blue-400 text-center truncate">{t.compareUs}</div>
                  <div className="px-2 sm:px-5 py-3 text-gray-400 dark:text-slate-500 text-center truncate">{t.compareOthers}</div>
                </div>
                {[t.cmpPrivacy, t.cmpUpload, t.cmpFree, t.cmpSignup, t.cmpSpeed].map((feat, i) => (
                  <div key={i} className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-3 text-xs sm:text-sm ${i < 4 ? "border-b border-gray-100 dark:border-slate-800" : ""}`}>
                    <div className="px-3 sm:px-5 py-3 text-gray-600 dark:text-slate-300">{feat}</div>
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
              <h2 className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-[3px] mb-10">{t.faqTitle}</h2>
              <div className="space-y-2">
                {faqs.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
              </div>
            </div>
            </>}

            {/* History */}
            {history.length > 0 && (
              <div className="mt-16 max-w-2xl mx-auto">
                <h2 className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-[3px] mb-6">{t.recentTitle}</h2>
                <div className="space-y-1">
                  {history.slice(0, 8).map((h, i) => (
                    <button key={i} onClick={() => h.toolId && isValidTool(h.toolId) && goTool(h.toolId)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors w-full text-left ${h.toolId ? "cursor-pointer" : "cursor-default"}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.ok ? "bg-green-500" : "bg-red-400"}`} />
                      <span className="text-sm text-gray-500 dark:text-slate-400 font-medium flex-1 truncate">
                        <span className="text-gray-700 dark:text-slate-300">{h.action}</span> — {h.file}
                      </span>
                      <span className="text-[10px] text-gray-300 dark:text-slate-600 font-mono flex-shrink-0">{h.time}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {/* Scroll to top */}
          <div className="flex justify-center mt-12">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
              {t.backToTop}
            </button>
          </div>

          <footer className="border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 mt-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="1.5" stroke="white" strokeWidth="1.5"/><path d="M5 4.5h6M5 7h6M5 9.5h4" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7"/></svg>
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-slate-200">File<span className="text-blue-600 dark:text-blue-400">Forge</span></span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">{t.footer1}</p>
                </div>
                {/* Tools */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3">{t.footerTools}</h4>
                  <ul className="space-y-2">
                    {TOOLS.slice(0, 10).map((td) => (
                      <li key={td.id}><button onClick={() => goTool(td.id)} className="text-xs text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t[td.labelKey]}</button></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3">{t.footerImgDoc}</h4>
                  <ul className="space-y-2">
                    {TOOLS.slice(10).map((td) => (
                      <li key={td.id}><button onClick={() => goTool(td.id)} className="text-xs text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t[td.labelKey]}</button></li>
                    ))}
                  </ul>
                </div>
                {/* Resources */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3">{t.footerResources}</h4>
                  <ul className="space-y-2">
                    <li><button onClick={() => goHome()} className="text-xs text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t.footerAbout}</button></li>
                    <li><button onClick={() => goHome()} className="text-xs text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t.footerFaq}</button></li>
                    <li><span className="text-xs text-gray-300 dark:text-slate-600">{t.footerPrivacy}</span></li>
                    <li><span className="text-xs text-gray-300 dark:text-slate-600">{t.footerTerms}</span></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[11px] text-gray-400 dark:text-slate-500">&copy; {new Date().getFullYear()} FileForge. {t.footer2}</p>
                {processCount > 0 ? (
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {processCount} {t.processed}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">{t.privacy}</span>
                )}
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
      <div id="main-content" className="min-h-screen pt-14" key={view}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 view-enter">
          {/* Back + Header */}
          <div>
            <button onClick={goHome}
              className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300 transition-colors mb-6 group">
              <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
              {t.allTools} <span className="text-gray-400 dark:text-slate-600 text-xs ml-1">(Esc)</span>
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
                    <h1 className="text-xl font-bold tracking-tight dark:text-white">{t[activeTool.labelKey]}</h1>
                    <span className="text-[10px] text-gray-300 dark:text-slate-600 uppercase tracking-wider font-medium">{activeTool.labelEn}</span>
                  </div>
                  <p className="text-sm text-gray-400 dark:text-slate-400">{t[activeTool.descKey]}</p>
                </div>
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: `${t[activeTool.labelKey]} — FileForge`, url: window.location.href });
                        return;
                      } catch (err) {
                        if (err instanceof DOMException && err.name === "AbortError") return;
                      }
                    }
                    const copied = await copyToClipboard(window.location.href);
                    setMessage(copied ? { type: "success", text: t.linkCopied } : { type: "error", text: t.msgError });
                  }}
                  className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all flex-shrink-0"
                  aria-label="Share"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
              </div>
            )}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent my-5" />
          </div>

          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {processing ? (batchProgress >= 0 ? `Processing ${batchProgress}%` : "Processing...") : message?.text || ""}
          </div>
          {processing && <ProgressBar progress={batchProgress >= 0 ? batchProgress : undefined} />}

          <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: "100ms" }}>
            {/* Text input for txt2pdf */}
            {view === "txt2pdf" ? (
              <div className="space-y-1">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.txtPlaceholder}
                  className="input-field min-h-[200px] resize-y font-mono text-sm leading-relaxed"
                  rows={10}
                />
                <div className="flex justify-end gap-3 text-[10px] text-gray-400 dark:text-slate-600 font-mono">
                  <span>{textInput.length} {lang === "ko" ? "자" : "chars"}</span>
                  <span>{textInput.split("\n").length} {lang === "ko" ? "줄" : "lines"}</span>
                  <span>~{Math.max(1, Math.ceil(textInput.split("\n").length / 50))} {lang === "ko" ? "페이지" : "pages"}</span>
                </div>
              </div>
            ) : (
            /* File Upload */
            <FileDropzone
              files={files}
              onSelect={handleFiles}
              onRemove={files.length > 0 ? removeFile : undefined}
              onReorder={view === "merge" ? reorderFiles : undefined}
              multiple={activeTool?.multi}
              pageInfo={pageInfo}
              t={t}
              acceptType={activeTool?.accept || ".pdf"}
            />
            )}

            {/* Security callout */}
            {files.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-xs text-green-700 dark:text-green-400">{t.securityNote}</span>
              </div>
            )}

            {/* Clear button */}
            {files.length > 0 && !processing && !resultData && resultMulti.length === 0 && (
              <button onClick={() => { setFiles([]); setMessage(null); setPageInfo({}); }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors self-end">
                {t.clearFiles}
              </button>
            )}

            {/* Tool-specific options */}
            {view === "merge" && files.length > 0 && files.length < 2 && (
              <Toast type="warning" text={t.mergeWarn} />
            )}
            {view === "merge" && files.length >= 2 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-sm animate-fadeIn">
                <span className="text-blue-700 dark:text-blue-400 font-medium">{files.length} {lang === "ko" ? "개 파일 선택됨" : "files selected"}</span>
                {(() => {
                  const total = files.reduce((sum, f) => sum + (pageInfo[f.name + f.size + f.lastModified] || 0), 0);
                  return total > 0 ? <span className="text-blue-500 text-xs font-mono">{lang === "ko" ? `총 ${total}페이지` : `${total} pages total`}</span> : null;
                })()}
              </div>
            )}

            {/* Multi-image summary */}
            {isImageInputTool(view) && files.length >= 2 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900 text-sm animate-fadeIn">
                <span className="text-violet-700 dark:text-violet-400 font-medium">{files.length} {lang === "ko" ? "개 이미지 선택됨" : "images selected"}</span>
                <span className="text-violet-500 dark:text-violet-400 text-xs font-mono">{fmtSize(files.reduce((sum, f) => sum + f.size, 0))}</span>
              </div>
            )}

            {/* Page count hint for single-file tools */}
            {PAGE_INPUT_TOOLS.includes(view) && files.length === 1 && (() => {
              const pc = pageInfo[files[0].name + files[0].size + files[0].lastModified];
              return pc > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-xs animate-fadeIn">
                  <span className="text-gray-500 dark:text-slate-400">{lang === "ko" ? `이 PDF는 ${pc}페이지입니다` : `This PDF has ${pc} pages`}</span>
                  <span className="text-gray-300 dark:text-slate-600">|</span>
                  <span className="text-gray-400 dark:text-slate-500 font-mono">{fmtSize(files[0].size)}</span>
                </div>
              ) : null;
            })()}

            {view === "split" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex gap-2">
                  {(["range", "all"] as const).map((m) => (
                    <button key={m} onClick={() => setSplitMode(m)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                        ${splitMode === m ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
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
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.rotAngle}</label>
                    <div className="flex gap-2">
                      {[90, 180, 270].map((d) => (
                        <button key={d} onClick={() => setRotateDeg(d)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                            ${rotateDeg === d ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
                          {d}°
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.rotScope}</label>
                    <div className="flex gap-2">
                      {(["all", "specific"] as const).map((s) => (
                        <button key={s} onClick={() => setRotateScope(s)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                            ${rotateScope === s ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
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

            {view === "imgstitch" && files.length > 0 && files.length < 2 && (
              <Toast type="warning" text={t.imgStitchWarn} />
            )}
            {view === "imgstitch" && files.length > 0 && (
              <div className="animate-fadeIn">
                <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.imgDirection}</label>
                <div className="flex gap-2">
                  {(["vertical", "horizontal"] as const).map((d) => (
                    <button key={d} onClick={() => setStitchDir(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                        ${stitchDir === d ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
                      {d === "vertical" ? t.imgVertical : t.imgHorizontal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "imgconvert" && files.length > 0 && (
              <div className="animate-fadeIn">
                <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.imgFormat}</label>
                <div className="flex gap-2">
                  {(["png", "jpeg", "webp"] as const).map((fmt) => (
                    <button key={fmt} onClick={() => setImgOutputFormat(fmt)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all uppercase
                        ${imgOutputFormat === fmt ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
                      {fmt === "jpeg" ? "JPG" : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "imgresize" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.imgScale} ({Math.round(imgScale * 100)}%)</label>
                <input type="range" value={imgScale} onChange={(e) => setImgScale(Number(e.target.value))} min={0.1} max={2} step={0.1} className="w-full" />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-600">
                  <span>10%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            )}

            {view === "imgcompress" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.imgQuality} ({Math.round(imgQuality * 100)}%)</label>
                <input type="range" value={imgQuality} onChange={(e) => setImgQuality(Number(e.target.value))} min={0.1} max={1} step={0.05} className="w-full" />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-600">
                  <span>{t.maxCompress}</span>
                  <span>{t.origQuality}</span>
                </div>
              </div>
            )}

            {view === "watermark" && files.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.wmText}</label>
                  <input type="text" value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder={t.wmText}
                    className="input-field" />
                  {/[가-힣ㄱ-ㅎㅏ-ㅣ\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(wmText) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{lang === "ko" ? "한글/한자/일본어는 지원되지 않습니다. 영문으로 입력해주세요." : "CJK characters are not supported. Please use Latin text."}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.wmSize}</label>
                    <input type="number" value={wmSize} onChange={(e) => setWmSize(Math.min(120, Math.max(12, Number(e.target.value) || 12)))} min={12} max={120}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.wmOpacity} ({Math.round(wmOpacity * 100)}%)</label>
                    <input type="range" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} min={0.05} max={0.5} step={0.05} className="w-full mt-3" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.wmAngle}</label>
                    <input type="number" value={wmRotation} onChange={(e) => setWmRotation(Math.min(90, Math.max(-90, Number(e.target.value) || 0)))} min={-90} max={90}
                      className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.wmLayout}</label>
                  <div className="flex gap-2">
                    {([["center", t.wmCenter], ["diagonal", t.wmDiagonal], ["tiled", t.wmTiled]] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setWmPosition(val as "center" | "diagonal" | "tiled")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                          ${wmPosition === val ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
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
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.pnFormat}</label>
                    <div className="flex gap-2">
                      {([["simple", "1, 2, 3"], ["total", "1/10"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setPnFormat(val as "simple" | "total")}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                            ${pnFormat === val ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.pnSize}</label>
                    <input type="number" value={pnSize} onChange={(e) => setPnSize(Math.min(24, Math.max(8, Number(e.target.value) || 11)))} min={8} max={24}
                      className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-slate-500 mb-1.5 block font-medium">{t.pnPosition}</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {([["bottom-left", t.pnBL], ["bottom-center", t.pnBC], ["bottom-right", t.pnBR], ["top-center", t.pnTC], ["top-right", t.pnTR]] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setPnPosition(val)}
                        className={`py-2 rounded-xl text-xs font-medium border transition-all
                          ${pnPosition === val ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-gray-500 dark:hover:text-slate-300"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            {view !== "info" && (files.length > 0 || view === "txt2pdf") && (
              <div className="relative">
                <AccentButton onClick={execute} disabled={!canExecute} loading={processing}>
                  {processing ? t.processing : confirmDelete ? t.confirmDeleteBtn : `${t[activeTool?.labelKey || ""]} ${t.execute}`}
                </AccentButton>
                {canExecute && !processing && (
                  <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-mono hidden sm:inline">Ctrl+Enter</kbd>
                )}
              </div>
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
                  <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
                    <div className="text-[10px] text-gray-300 dark:text-slate-600 uppercase tracking-wider mb-1 font-semibold">{item.label}</div>
                    <div className={`text-sm font-bold font-mono ${item.accent ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-slate-400"}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Results: Single file */}
            {resultData && (
              <div className="animate-scaleIn space-y-3">
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">{message?.text}</span>
                </div>
                <button onClick={() => download(resultData, resultName, getMimeTypeForFilename(resultName))}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {resultName} ({fmtSize(resultData.length)})
                </button>
                <div className="flex items-center justify-between">
                  <button onClick={resetState}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    {t.processAnother}
                  </button>
                  {procTime !== null && <span className="text-[10px] text-gray-400">{procTime < 1000 ? `${procTime}ms` : `${(procTime / 1000).toFixed(1)}s`}</span>}
                </div>
              </div>
            )}

            {/* Results: Multiple files */}
            {resultMulti.length > 0 && (
              <div className="space-y-2 animate-fadeIn">
                {resultMulti.length > 1 && (
                  <button onClick={() => downloadZip(resultMulti, `fileforge_${view}.zip`)}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                    {resultMulti.length}{t.downloadZip}
                  </button>
                )}
                {/* Image grid preview for image results */}
                {resultMulti.length > 0 && isPreviewableImage(resultMulti[0].name) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 rounded-xl overflow-hidden">
                    {resultMulti.slice(0, 8).map((r, i) => (
                      <ResultImagePreview key={`${r.name}-${i}`} result={r} index={i} />
                    ))}
                    {resultMulti.length > 8 && (
                      <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm font-bold">
                        +{resultMulti.length - 8}
                      </div>
                    )}
                  </div>
                )}
                {resultMulti.map((r, i) => (
                  <button key={i} onClick={() => download(r.data, r.name, getMimeTypeForFilename(r.name))}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all text-left group">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-gray-800 dark:text-slate-200 text-sm font-medium flex-1 truncate">{r.name}</span>
                    <span className="text-gray-400 dark:text-slate-500 text-[10px] font-mono flex-shrink-0">{fmtSize(r.data.length)}</span>
                    <span className="text-blue-600 text-xs font-semibold opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">{t.download}</span>
                  </button>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <button onClick={resetState}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    {t.processAnother}
                  </button>
                  {procTime !== null && <span className="text-[10px] text-gray-400">{procTime < 1000 ? `${procTime}ms` : `${(procTime / 1000).toFixed(1)}s`}</span>}
                </div>
              </div>
            )}

            {/* DOCX Preview */}
            {htmlPreview && (
              <div className="animate-fadeIn space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">{view === "pdftext" ? t.pdftextLabel : t.docxPreview}</h3>
                  <div className="flex items-center gap-3">
                    {view === "pdftext" && (
                      <button onClick={async () => {
                        const parsed = new DOMParser().parseFromString(htmlPreview || "", "text/html");
                        const text = parsed.body.textContent || "";
                        const ok = await copyToClipboard(text);
                        setMessage(ok ? { type: "success", text: t.copied } : { type: "error", text: t.msgError });
                      }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">{t.copyText}</button>
                    )}
                    <button onClick={() => downloadBlob(new Blob([htmlPreview || ""], { type: "text/html" }), "preview.html")}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium">HTML {t.download}</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 max-h-[500px] overflow-y-auto prose prose-sm prose-gray dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlPreview }} />
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
                        { icon: "\uD83D\uDD10", val: t.infoNo, label: t.infoEncrypted },
                        { icon: "\uD83D\uDCCA", val: fmtSize(Math.round(pdfInfoResult.size / Math.max(pdfInfoResult.pages, 1))), label: t.infoPerPage },
                      ].map((s, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-0.5 transition-all">
                          <div className="text-xl mb-1">{s.icon}</div>
                          <div className="text-lg font-extrabold font-mono text-gray-900 dark:text-white">{s.val}</div>
                          <div className="text-[10px] text-gray-300 dark:text-slate-600 uppercase tracking-wider mt-1 font-semibold">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400">{t.metadata}</h3>
                        <button
                          onClick={async () => {
                            const text = `Pages: ${pdfInfoResult.pages}\nSize: ${fmtSize(pdfInfoResult.size)}\nTitle: ${pdfInfoResult.title}\nAuthor: ${pdfInfoResult.author}\nCreator: ${pdfInfoResult.creator}\nProducer: ${pdfInfoResult.producer}`;
                            const ok = await copyToClipboard(text);
                            setMessage(ok ? { type: "success", text: t.copied } : { type: "error", text: t.msgError });
                          }}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
                        >{t.copyBtn}</button>
                      </div>
                      {[
                        [t.metaTitle, pdfInfoResult.title],
                        [t.metaAuthor, pdfInfoResult.author],
                        [t.metaCreator, pdfInfoResult.creator],
                        [t.metaProducer, pdfInfoResult.producer],
                      ].map(([k, v], i) => (
                        <div key={i} className={`flex px-5 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${i < 3 ? "border-b border-gray-200 dark:border-slate-700" : ""}`}>
                          <span className="w-32 text-gray-400 dark:text-slate-500 font-medium flex-shrink-0">{k}</span>
                          <span className="text-gray-700 dark:text-slate-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Related Tools */}
          <div className="mt-14 pt-8 border-t border-gray-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">{t.relatedTools}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RELATED_TOOLS[view as Tool].map((id) => TOOL_BY_ID[id]).map((td) => (
                <button key={td.id} onClick={() => goTool(td.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${td.hex}10` }}>
                    {td.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{t[td.labelKey]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 pb-20 sm:pb-6 text-center">
            <p className="text-[11px] text-gray-400 dark:text-slate-500">{t.footer1}</p>
          </div>
        </div>
      </div>

      {/* Mobile fixed CTA bar */}
      {view !== "info" && files.length > 0 && !resultData && !resultMulti.length && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 p-3 sm:hidden">
          <button
            onClick={canExecute ? execute : undefined}
            disabled={!canExecute}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              canExecute
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            {processing ? t.processing : confirmDelete ? t.confirmDeleteBtn : `${t[activeTool?.labelKey || ""]} ${t.execute}`}
          </button>
        </div>
      )}

      {/* Mobile fixed download bar */}
      {resultData && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 p-3 sm:hidden">
          <button
            onClick={() => download(resultData, resultName, getMimeTypeForFilename(resultName))}
            className="w-full py-3 rounded-xl font-bold text-sm bg-green-600 text-white shadow-lg shadow-green-500/20"
          >
            {resultName} {t.download}
          </button>
        </div>
      )}
    </>
  );
}
