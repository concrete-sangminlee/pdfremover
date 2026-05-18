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

export function sanitizeOutputFilename(filename: string, fallback = "file") {
  const cleaned = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, "");

  const safe = cleaned || fallback;
  const dot = safe.lastIndexOf(".");
  const basename = (dot > 0 ? safe.slice(0, dot) : safe).toLowerCase();
  const prefixed = RESERVED_WINDOWS_NAMES.has(basename) ? `_${safe}` : safe;
  if (prefixed.length <= 180) return prefixed;

  const outputDot = prefixed.lastIndexOf(".");
  const ext = outputDot > 0 ? prefixed.slice(outputDot) : "";
  const stem = outputDot > 0 ? prefixed.slice(0, outputDot) : prefixed;
  const maxStemLength = Math.max(1, 180 - ext.length);
  return `${stem.slice(0, maxStemLength)}${ext}` || fallback;
}
