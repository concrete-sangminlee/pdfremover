const RESERVED_WINDOWS_NAMES = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
]);

const MAX_FILENAME_LENGTH = 180;

function sanitizeSegment(value: string): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*\x00-\x1F\x7F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, "");

  const withoutPunctuation = cleaned.replace(/[-_\. ]/g, "");
  if (!withoutPunctuation) return "";

  return cleaned;
}

export function sanitizeOutputFilename(filename: string, fallback = "file") {
  const cleaned = sanitizeSegment(filename);
  const safeFallback = sanitizeSegment(fallback) || "file";

  const safe = cleaned || safeFallback || "file";
  const dot = safe.lastIndexOf(".");
  const basename = (dot > 0 ? safe.slice(0, dot) : safe).toLowerCase();
  const prefixed = RESERVED_WINDOWS_NAMES.has(basename) ? `_${safe}` : safe;
  if (prefixed.length <= MAX_FILENAME_LENGTH) return prefixed;

  const outputDot = prefixed.lastIndexOf(".");
  const ext = outputDot > 0 && outputDot < prefixed.length - 1 ? prefixed.slice(outputDot) : "";
  const stem = outputDot > 0 ? prefixed.slice(0, outputDot) : prefixed;
  const maxStemLength = Math.max(1, MAX_FILENAME_LENGTH - ext.length);
  return `${stem.slice(0, maxStemLength)}${ext}` || fallback;
}
