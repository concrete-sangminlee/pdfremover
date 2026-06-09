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

const MAX_FILENAME_LENGTH_BYTES = 180;
const TEXT_ENCODER = new TextEncoder();
const FORWARD_SLASH = "\u002F";
const FULL_WIDTH_SLASH = "\uFF0F";
const FULL_WIDTH_BACKSLASH = "\uFF3C";
const DIVISION_SLASH = "\u2215";
const FRACTION_SLASH = "\u2044";

const UNICODE_CONTROL_PATTERN = /[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\uFEFF]/g;

function isUtf8ByteLengthTooLong(value: string): boolean {
  return TEXT_ENCODER.encode(value).length > MAX_FILENAME_LENGTH_BYTES;
}

function truncateUtf8ToMaxBytes(value: string, maxBytes: number): string {
  if (TEXT_ENCODER.encode(value).length <= maxBytes) return value;

  let safe = value;
  while (safe && TEXT_ENCODER.encode(safe).length > maxBytes) {
    safe = safe.slice(0, -1);
  }
  return safe || "file";
}

function appendSuffixBeforeExtension(filename: string, suffix: string): string {
  const dot = filename.lastIndexOf(".");
  const ext = dot > 0 && dot < filename.length - 1 ? filename.slice(dot) : "";
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const maxStemBytes = Math.max(1, MAX_FILENAME_LENGTH_BYTES - TEXT_ENCODER.encode(`${suffix}${ext}`).length);
  return `${truncateUtf8ToMaxBytes(stem, maxStemBytes)}${suffix}${ext}`;
}

function sanitizeSegment(value: string): string {
  const normalized = value.normalize("NFKC");
  const cleaned = normalized
    .replace(/[<>:"/\\|?*\x00-\x1F\x7F]/g, "_")
    .replace(UNICODE_CONTROL_PATTERN, "_")
    .replace(
      new RegExp(`[${FORWARD_SLASH}${FULL_WIDTH_SLASH}${FULL_WIDTH_BACKSLASH}${DIVISION_SLASH}${FRACTION_SLASH}]`, "g"),
      "_"
    )
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
  if (!isUtf8ByteLengthTooLong(prefixed)) return prefixed;

  const outputDot = prefixed.lastIndexOf(".");
  const ext = outputDot > 0 && outputDot < prefixed.length - 1 ? prefixed.slice(outputDot) : "";
  const stem = outputDot > 0 ? prefixed.slice(0, outputDot) : prefixed;
  const extByteLength = TEXT_ENCODER.encode(ext).length;
  if (extByteLength > MAX_FILENAME_LENGTH_BYTES - 1) {
    return truncateUtf8ToMaxBytes("file", MAX_FILENAME_LENGTH_BYTES);
  }

  const maxStemLength = Math.max(1, MAX_FILENAME_LENGTH_BYTES - extByteLength);
  return `${truncateUtf8ToMaxBytes(stem, maxStemLength)}${ext}` || "file";
}

export function uniqueOutputFilename(filename: string, seen: Set<string>) {
  const safeName = sanitizeOutputFilename(filename);
  let candidate = safeName;
  let index = 2;

  while (seen.has(candidate)) {
    candidate = sanitizeOutputFilename(
      appendSuffixBeforeExtension(safeName, ` (${index})`),
      `file (${index})`
    );
    index += 1;
  }

  seen.add(candidate);
  return candidate;
}
