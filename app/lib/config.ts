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
  | "pdf2img";

export type View = "home" | Tool;
export type Lang = "ko" | "en";

export interface ToolDef {
  id: Tool;
  icon: string;
  labelKey: string;
  descKey: string;
  labelEn: string;
  hex: string;
  tint: string;
  multi?: boolean;
  /** Accept file types other than PDF */
  accept?: string;
}

export const TOOLS: ToolDef[] = [
  { id: "unlock",    icon: "\uD83D\uDD13", labelKey: "unlockLabel",    descKey: "unlockDesc",    labelEn: "Unlock",    hex: "#16a34a", tint: "#f0fdf4" },
  { id: "merge",     icon: "\uD83D\uDCCB", labelKey: "mergeLabel",     descKey: "mergeDesc",     labelEn: "Merge",     hex: "#2563eb", tint: "#eff6ff", multi: true },
  { id: "split",     icon: "\u2702\uFE0F", labelKey: "splitLabel",     descKey: "splitDesc",     labelEn: "Split",     hex: "#ea580c", tint: "#fff7ed" },
  { id: "extract",   icon: "\uD83D\uDCC4", labelKey: "extractLabel",   descKey: "extractDesc",   labelEn: "Extract",   hex: "#7c3aed", tint: "#f5f3ff" },
  { id: "rotate",    icon: "\uD83D\uDD04", labelKey: "rotateLabel",    descKey: "rotateDesc",    labelEn: "Rotate",    hex: "#db2777", tint: "#fdf2f8" },
  { id: "compress",  icon: "\uD83D\uDCE6", labelKey: "compressLabel",  descKey: "compressDesc",  labelEn: "Optimize",  hex: "#0d9488", tint: "#f0fdfa" },
  { id: "watermark", icon: "\uD83D\uDCA7", labelKey: "watermarkLabel", descKey: "watermarkDesc", labelEn: "Watermark", hex: "#0284c7", tint: "#f0f9ff" },
  { id: "pagenum",   icon: "\uD83D\uDD22", labelKey: "pagenumLabel",   descKey: "pagenumDesc",   labelEn: "Numbers",   hex: "#d97706", tint: "#fffbeb" },
  { id: "delete",    icon: "\uD83D\uDDD1\uFE0F", labelKey: "deleteLabel",    descKey: "deleteDesc",    labelEn: "Delete",    hex: "#dc2626", tint: "#fef2f2" },
  { id: "img2pdf",   icon: "\uD83D\uDDBC\uFE0F", labelKey: "img2pdfLabel",   descKey: "img2pdfDesc",   labelEn: "IMG to PDF", hex: "#059669", tint: "#ecfdf5", multi: true, accept: "image/*" },
  { id: "pdf2img",   icon: "\uD83D\uDCF7",      labelKey: "pdf2imgLabel",   descKey: "pdf2imgDesc",   labelEn: "PDF to IMG", hex: "#8b5cf6", tint: "#f5f3ff" },
  { id: "info",      icon: "\u2139\uFE0F", labelKey: "infoLabel",      descKey: "infoDesc",      labelEn: "Info",      hex: "#64748b", tint: "#f8fafc" },
];

export const VALID_TOOLS = TOOLS.map((t) => t.id);
