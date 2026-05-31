export interface PageRange {
  start: number;
  end: number;
}

export type PageRangeAnalysisCode = "unordered" | "overlapOrDuplicate";

export interface PageRangeAnalysis {
  ranges: PageRange[] | null;
  warningCodes: PageRangeAnalysisCode[];
}

export function formatPageRanges(ranges: PageRange[]): string {
  return ranges
    .map((range) => (range.start === range.end ? String(range.start) : `${range.start}-${range.end}`))
    .join(", ");
}

export function isValidPageRangeInput(input: string): boolean {
  return parsePageRangeGroupsInternal(input) !== null;
}

export function parsePageRangeGroups(input: string, total: number): PageRange[] | null {
  return parsePageRangeGroupsInternal(input, total);
}

function parsePageRangeGroupsInternal(input: string, total?: number): PageRange[] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const ranges: PageRange[] = [];
  for (const part of trimmed.split(",")) {
    const segment = part.trim();
    if (!segment) return null;

    const match = segment.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return null;

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1 ||
      end < 1 ||
      start > end ||
      (typeof total === "number" && (start > total || end > total))
    ) {
      return null;
    }

    ranges.push({ start, end });
  }

  return ranges.length > 0 ? ranges : null;
}

export function parsePageRanges(
  input: string,
  total: number,
  options: { preserveOrder?: boolean } = {}
): number[] {
  const ranges = parsePageRangeGroupsInternal(input, total);
  if (!ranges) return [];

  const seen = new Set<number>();
  const pages: number[] = [];
  for (const { start, end } of ranges) {
    for (let i = start; i <= end; i++) {
      if (!seen.has(i)) {
        seen.add(i);
        pages.push(i);
      }
    }
  }

  return options.preserveOrder ? pages : pages.sort((a, b) => a - b);
}

export function analyzePageRangeInputForSplit(input: string, total: number): PageRangeAnalysis {
  const trimmed = input.trim();
  if (!trimmed) return { ranges: null, warningCodes: [] };

  const ranges = parsePageRangeGroups(trimmed, total);
  if (!ranges) return { ranges: null, warningCodes: [] };

  const warnings: PageRangeAnalysisCode[] = [];
  const sorted = [...ranges].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });

  const wasUnsorted = ranges.some((current, idx, arr) => {
    if (idx === 0) return false;
    const prev = arr[idx - 1];
    return current.start < prev.start || (current.start === prev.start && current.end < prev.end);
  });

  if (wasUnsorted) warnings.push("unordered");

  const normalized: PageRange[] = [];
  let hasOverlapOrDuplicate = false;

  for (const range of sorted) {
    const last = normalized[normalized.length - 1];
    if (!last || range.start > last.end) {
      normalized.push({ ...range });
      continue;
    }

    hasOverlapOrDuplicate = true;
    if (range.end > last.end) {
      last.end = range.end;
    }
  }

  if (hasOverlapOrDuplicate) warnings.push("overlapOrDuplicate");

  return { ranges: normalized, warningCodes: warnings };
}
