// Shared config — importable from both server and client components

export type Tool =
  | "unlock"
  | "merge"
  | "split"
  | "extract"
  | "rotate"
  | "compress"
  | "watermark"
  | "pagenum"
  | "delete"
  | "info"
  | "img2pdf"
  | "pdf2img"
  | "docx2html"
  | "pdftext"
  | "imgcompress"
  | "imgresize"
  | "html2pdf"
  | "imgconvert"
  | "txt2pdf"
  | "imgstitch";

export type View = "home" | Tool;
export type Lang = "ko" | "en";

export type ToolCategory = "pdf" | "image" | "document";

export interface ToolDef {
  id: Tool;
  icon: string;
  labelKey: string;
  descKey: string;
  labelEn: string;
  hex: string;
  tint: string;
  category: ToolCategory;
  multi?: boolean;
  /** Accept file types other than PDF */
  accept?: string;
  /** Show "New" badge */
  isNew?: boolean;
}

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const TOOLS: ToolDef[] = [
  { id: "unlock",    icon: "\uD83D\uDD13", labelKey: "unlockLabel",    descKey: "unlockDesc",    labelEn: "Unlock",    hex: "#16a34a", tint: "#f0fdf4", category: "pdf" },
  { id: "merge",     icon: "\uD83D\uDCCB", labelKey: "mergeLabel",     descKey: "mergeDesc",     labelEn: "Merge",     hex: "#2563eb", tint: "#eff6ff", category: "pdf", multi: true },
  { id: "split",     icon: "\u2702\uFE0F", labelKey: "splitLabel",     descKey: "splitDesc",     labelEn: "Split",     hex: "#ea580c", tint: "#fff7ed", category: "pdf" },
  { id: "extract",   icon: "\uD83D\uDCC4", labelKey: "extractLabel",   descKey: "extractDesc",   labelEn: "Extract",   hex: "#7c3aed", tint: "#f5f3ff", category: "pdf" },
  { id: "rotate",    icon: "\uD83D\uDD04", labelKey: "rotateLabel",    descKey: "rotateDesc",    labelEn: "Rotate",    hex: "#db2777", tint: "#fdf2f8", category: "pdf" },
  { id: "compress",  icon: "\uD83D\uDCE6", labelKey: "compressLabel",  descKey: "compressDesc",  labelEn: "Optimize",  hex: "#0d9488", tint: "#f0fdfa", category: "pdf" },
  { id: "watermark", icon: "\uD83D\uDCA7", labelKey: "watermarkLabel", descKey: "watermarkDesc", labelEn: "Watermark", hex: "#0284c7", tint: "#f0f9ff", category: "pdf" },
  { id: "pagenum",   icon: "\uD83D\uDD22", labelKey: "pagenumLabel",   descKey: "pagenumDesc",   labelEn: "Numbers",   hex: "#d97706", tint: "#fffbeb", category: "pdf" },
  { id: "delete",    icon: "\uD83D\uDDD1\uFE0F", labelKey: "deleteLabel",    descKey: "deleteDesc",    labelEn: "Delete",    hex: "#dc2626", tint: "#fef2f2", category: "pdf" },
  { id: "info",      icon: "\u2139\uFE0F", labelKey: "infoLabel",      descKey: "infoDesc",      labelEn: "Info",      hex: "#64748b", tint: "#f8fafc", category: "pdf" },
  { id: "img2pdf",   icon: "\uD83D\uDDBC\uFE0F", labelKey: "img2pdfLabel",   descKey: "img2pdfDesc",   labelEn: "IMG to PDF", hex: "#059669", tint: "#ecfdf5", category: "image", multi: true, accept: IMAGE_ACCEPT },
  { id: "pdf2img",   icon: "\uD83D\uDCF7",      labelKey: "pdf2imgLabel",   descKey: "pdf2imgDesc",   labelEn: "PDF to IMG", hex: "#8b5cf6", tint: "#f5f3ff", category: "image" },
  { id: "imgcompress", icon: "\uD83D\uDDDC\uFE0F", labelKey: "imgcompressLabel", descKey: "imgcompressDesc", labelEn: "IMG Compress", hex: "#ca8a04", tint: "#fefce8", category: "image", multi: true, accept: IMAGE_ACCEPT },
  { id: "imgresize",  icon: "\uD83D\uDD0D",      labelKey: "imgresizeLabel",  descKey: "imgresizeDesc",  labelEn: "IMG Resize",  hex: "#6366f1", tint: "#eef2ff", category: "image", multi: true, accept: IMAGE_ACCEPT },
  { id: "imgstitch", icon: "\uD83E\uDDE9",      labelKey: "imgstitchLabel", descKey: "imgstitchDesc", labelEn: "IMG Stitch", hex: "#7c3aed", tint: "#f5f3ff", category: "image", multi: true, accept: IMAGE_ACCEPT, isNew: true },
  { id: "imgconvert", icon: "\uD83C\uDFA8",      labelKey: "imgconvertLabel", descKey: "imgconvertDesc", labelEn: "IMG Convert", hex: "#e11d48", tint: "#fff1f2", category: "image", multi: true, accept: IMAGE_ACCEPT, isNew: true },
  { id: "docx2html", icon: "\uD83D\uDCDD",      labelKey: "docx2htmlLabel", descKey: "docx2htmlDesc", labelEn: "DOCX View", hex: "#2563eb", tint: "#eff6ff", category: "document", accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { id: "pdftext",   icon: "\uD83D\uDCCB",      labelKey: "pdftextLabel",   descKey: "pdftextDesc",   labelEn: "PDF Text",  hex: "#0891b2", tint: "#ecfeff", category: "document" },
  { id: "txt2pdf",   icon: "\uD83D\uDCDD",      labelKey: "txt2pdfLabel",   descKey: "txt2pdfDesc",   labelEn: "Text to PDF", hex: "#475569", tint: "#f8fafc", category: "document" },
  { id: "html2pdf",  icon: "\uD83C\uDF10",      labelKey: "html2pdfLabel",  descKey: "html2pdfDesc",  labelEn: "HTML to PDF", hex: "#0ea5e9", tint: "#f0f9ff", category: "document", accept: ".html,.htm,text/html", isNew: true },
];

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool])) as Record<Tool, ToolDef>;
export const VALID_TOOLS = TOOLS.map((t) => t.id);

export const IMAGE_INPUT_TOOLS: readonly Tool[] = ["img2pdf", "imgcompress", "imgresize", "imgconvert", "imgstitch"];
export const NO_PAGE_INFO_TOOLS: readonly Tool[] = [...IMAGE_INPUT_TOOLS, "docx2html", "html2pdf"];
export const NO_PDF_LIB_PRELOAD_TOOLS: readonly Tool[] = ["imgcompress", "imgresize", "imgconvert", "imgstitch", "pdftext", "docx2html", "pdf2img"];
export const PAGE_INPUT_TOOLS: readonly Tool[] = ["split", "extract", "delete", "rotate"];

const VALID_TOOL_SET = new Set<Tool>(VALID_TOOLS);
const IMAGE_INPUT_TOOL_SET = new Set<Tool>(IMAGE_INPUT_TOOLS);
const PAGE_TOOL_SET = new Set<Tool>(PAGE_INPUT_TOOLS);
const NO_PAGE_TOOL_SET = new Set<Tool>(NO_PAGE_INFO_TOOLS);
const NO_PRELOAD_TOOL_SET = new Set<Tool>(NO_PDF_LIB_PRELOAD_TOOLS);

export function isValidTool(value: string): value is Tool {
  return VALID_TOOL_SET.has(value as Tool);
}

export function isImageInputTool(value: View): value is (typeof IMAGE_INPUT_TOOLS)[number] {
  return IMAGE_INPUT_TOOL_SET.has(value as Tool);
}

export function isPageInputTool(value: string): value is (typeof PAGE_INPUT_TOOLS)[number] {
  return PAGE_TOOL_SET.has(value as Tool);
}

export function hasNoPageInfo(value: string): value is (typeof NO_PAGE_INFO_TOOLS)[number] {
  return NO_PAGE_TOOL_SET.has(value as Tool);
}

export function hasNoPdfLibPreload(value: string): value is (typeof NO_PDF_LIB_PRELOAD_TOOLS)[number] {
  return NO_PRELOAD_TOOL_SET.has(value as Tool);
}
