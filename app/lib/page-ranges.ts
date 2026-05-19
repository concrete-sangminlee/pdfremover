export interface PageRange {
  start: number;
  end: number;
}

export function isValidPageRangeInput(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  let hasRange = false;
  for (const part of trimmed.split(",")) {
    const segment = part.trim();
    if (!segment) return false;

    const match = segment.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return false;

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < 1 || start > end) return false;
    hasRange = true;
  }

  return hasRange;
}

export function parsePageRangeGroups(input: string, total: number): PageRange[] | null {
  const ranges: PageRange[] = [];
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return null;

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
    if (start < 1 || end < 1 || start > total || end > total || start > end) return null;

    ranges.push({ start, end });
  }
  return ranges.length > 0 ? ranges : null;
}

export function parsePageRanges(
  input: string,
  total: number,
  options: { preserveOrder?: boolean } = {}
): number[] {
  const ranges = parsePageRangeGroups(input, total);
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
