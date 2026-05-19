export interface PageRange {
  start: number;
  end: number;
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
