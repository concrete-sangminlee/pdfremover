import { describe, expect, it } from "vitest";
import { analyzePageRangeInputForSplit, countPagesInRanges, formatPageRanges, isValidPageRangeInput, parsePageRangeGroups, parsePageRanges, rangeToFileLabel } from "./page-ranges";

describe("parsePageRangeGroups", () => {
  it("parses single pages and inclusive ranges", () => {
    expect(parsePageRangeGroups("1, 3-5, 8", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
      { start: 8, end: 8 },
    ]);
  });

  it("rejects malformed, reversed, and out-of-range groups", () => {
    expect(parsePageRangeGroups("1,,", 10)).toBeNull();
    expect(parsePageRangeGroups(",2", 10)).toBeNull();
    expect(parsePageRangeGroups("2-a", 10)).toBeNull();
    expect(parsePageRangeGroups("5-3", 10)).toBeNull();
    expect(parsePageRangeGroups("11", 10)).toBeNull();
    expect(parsePageRangeGroups("", 10)).toBeNull();
  });

  it("supports whitespace around commas and ranges", () => {
    expect(parsePageRangeGroups("1, 3 - 5,  7", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
      { start: 7, end: 7 },
    ]);
  });

  it("supports semicolons and line breaks as separators", () => {
    expect(parsePageRangeGroups("1; 3 - 5\n7, 9", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
      { start: 7, end: 7 },
      { start: 9, end: 9 },
    ]);
    expect(parsePageRangeGroups("1\r\n3-4,9", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 4 },
      { start: 9, end: 9 },
    ]);
  });

  it("supports slash as a page separator", () => {
    expect(parsePageRangeGroups("1 / 2 / 4-5", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 2, end: 2 },
      { start: 4, end: 5 },
    ]);
    expect(parsePageRangeGroups("3/1-2", 10)).toEqual([
      { start: 3, end: 3 },
      { start: 1, end: 2 },
    ]);
  });

  it("supports pipe as a page separator", () => {
    expect(parsePageRangeGroups("1 | 2 | 4-5", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 2, end: 2 },
      { start: 4, end: 5 },
    ]);
    expect(parsePageRangeGroups("3|1-2| 7", 10)).toEqual([
      { start: 3, end: 3 },
      { start: 1, end: 2 },
      { start: 7, end: 7 },
    ]);
  });

  it("supports full-width separators", () => {
    expect(parsePageRangeGroups("1\uFF0C2\uFF1B4-5", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 2, end: 2 },
      { start: 4, end: 5 },
    ]);
    expect(isValidPageRangeInput("3\uFF0C4\uFF1B5")).toBe(true);
  });

  it("expands all keyword when total is provided", () => {
    expect(parsePageRangeGroups("all", 5)).toEqual([{ start: 1, end: 5 }]);
  });

  it("allows uppercase all keyword", () => {
    expect(parsePageRangeGroups("ALL", 5)).toEqual([{ start: 1, end: 5 }]);
  });

  it("supports odd and even keywords", () => {
    expect(parsePageRangeGroups("odd", 6)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 3 },
      { start: 5, end: 5 },
    ]);
    expect(parsePageRangeGroups("even", 6)).toEqual([
      { start: 2, end: 2 },
      { start: 4, end: 4 },
      { start: 6, end: 6 },
    ]);
  });

  it("supports first and last keywords", () => {
    expect(parsePageRangeGroups("first", 5)).toEqual([{ start: 1, end: 1 }]);
    expect(parsePageRangeGroups("last", 5)).toEqual([{ start: 5, end: 5 }]);
    expect(parsePageRangeGroups("first,last", 5)).toEqual([
      { start: 1, end: 1 },
      { start: 5, end: 5 },
    ]);
  });

  it("supports first/last count aliases", () => {
    expect(parsePageRangeGroups("first-3", 5)).toEqual([{ start: 1, end: 3 }]);
    expect(parsePageRangeGroups("last-2", 7)).toEqual([{ start: 6, end: 7 }]);
    expect(parsePageRangeGroups("start-4", 3)).toEqual([{ start: 1, end: 3 }]);
    expect(parsePageRangeGroups("end-4", 3)).toEqual([{ start: 1, end: 3 }]);
    expect(parsePageRangeGroups("first - 2", 5)).toEqual([{ start: 1, end: 2 }]);
    expect(parsePageRangeGroups("last - 2", 5)).toEqual([{ start: 4, end: 5 }]);
    expect(parsePageRangeGroups("first-1,last-1", 10)).toEqual([{ start: 1, end: 1 }, { start: 10, end: 10 }]);
    expect(parsePageRangeGroups("first-0", 10)).toBeNull();
    expect(parsePageRangeGroups("last-0", 10)).toBeNull();
  });

  it("supports middle/center aliases", () => {
    expect(parsePageRangeGroups("middle", 5)).toEqual([{ start: 3, end: 3 }]);
    expect(parsePageRangeGroups("center", 10)).toEqual([{ start: 5, end: 5 }]);
  });

});

describe("isValidPageRangeInput", () => {
  it("validates numeric pages and ranges with optional whitespace", () => {
    expect(isValidPageRangeInput("1")).toBe(true);
    expect(isValidPageRangeInput("1, 3-5, 7")).toBe(true);
    expect(isValidPageRangeInput("all")).toBe(true);
    expect(isValidPageRangeInput("first")).toBe(true);
    expect(isValidPageRangeInput("last")).toBe(true);
    expect(isValidPageRangeInput("start")).toBe(true);
    expect(isValidPageRangeInput("end")).toBe(true);
    expect(isValidPageRangeInput("first-3")).toBe(true);
    expect(isValidPageRangeInput("last-4")).toBe(true);
    expect(isValidPageRangeInput("start-2")).toBe(true);
    expect(isValidPageRangeInput("end-2")).toBe(true);
    expect(isValidPageRangeInput("first-0")).toBe(false);
    expect(isValidPageRangeInput("last-0")).toBe(false);
    expect(isValidPageRangeInput("middle")).toBe(true);
    expect(isValidPageRangeInput("center")).toBe(true);
    expect(isValidPageRangeInput("odd")).toBe(true);
    expect(isValidPageRangeInput("even, odd")).toBe(true);
    expect(isValidPageRangeInput("odd, 1-3")).toBe(true);
    expect(isValidPageRangeInput("1\r\n2, 3")).toBe(true);
    expect(isValidPageRangeInput("1 / 2 / 3")).toBe(true);
    expect(isValidPageRangeInput("1 | 2 | 3")).toBe(true);
  });

  it("rejects malformed, empty, and reversed segments", () => {
    expect(isValidPageRangeInput("")).toBe(false);
    expect(isValidPageRangeInput("1,,")).toBe(false);
    expect(isValidPageRangeInput("1|/2")).toBe(false);
    expect(isValidPageRangeInput("1//2")).toBe(false);
    expect(isValidPageRangeInput("1||2")).toBe(false);
    expect(isValidPageRangeInput(",2")).toBe(false);
    expect(isValidPageRangeInput("2-a")).toBe(false);
    expect(isValidPageRangeInput("5-3")).toBe(false);
    expect(isValidPageRangeInput("0-2")).toBe(false);
  });
});

describe("parsePageRanges", () => {
  it("deduplicates and sorts pages by default", () => {
    expect(parsePageRanges("3, 1, 3, 2-4", 5)).toEqual([1, 2, 3, 4]);
  });

  it("can preserve user-entered order for extraction workflows", () => {
    expect(parsePageRanges("3, 1, 3, 2-4", 5, { preserveOrder: true })).toEqual([3, 1, 2, 4]);
  });

  it("expands odd and even keywords into full odd/even page lists", () => {
    expect(parsePageRanges("odd", 6)).toEqual([1, 3, 5]);
    expect(parsePageRanges("even,2-3", 6, { preserveOrder: true })).toEqual([2, 4, 6, 3]);
  });

  it("expands first and last keywords with preserveOrder", () => {
    expect(parsePageRanges("first,last", 7, { preserveOrder: true })).toEqual([1, 7]);
    expect(parsePageRanges("2,first,6, last", 7, { preserveOrder: true })).toEqual([2, 1, 6, 7]);
  });

  it("supports first/last count aliases in page expansion", () => {
    expect(parsePageRanges("first-3", 7, { preserveOrder: true })).toEqual([1, 2, 3]);
    expect(parsePageRanges("start-2,last-2", 7, { preserveOrder: true })).toEqual([1, 2, 6, 7]);
    expect(parsePageRanges("end-3", 5)).toEqual([3, 4, 5]);
    expect(parsePageRanges("first - 2, end - 1", 10, { preserveOrder: true })).toEqual([1, 2, 10]);
    expect(parsePageRanges("center,middle, 4-4", 10)).toEqual([4, 5]);
  });

  it("supports mixed separators in expansion", () => {
    expect(parsePageRanges("1|3 /5\uFF0C7\uFF1B9", 20, { preserveOrder: true })).toEqual([1, 3, 5, 7, 9]);
    expect(parsePageRanges("1 / first - 2 / 3-4", 10, { preserveOrder: true })).toEqual([1, 2, 3, 4]);
  });
});

describe("analyzePageRangeInputForSplit", () => {
  it("normalizes unsorted ranges and keeps unique coverage", () => {
    const result = analyzePageRangeInputForSplit("5-6, 2, 3-4", 10);
    expect(result.ranges).toEqual([
      { start: 2, end: 2 },
      { start: 3, end: 4 },
      { start: 5, end: 6 },
    ]);
    expect(result.warningCodes).toEqual(["unordered"]);
  });

  it("flags overlaps and duplicates as merge warnings", () => {
    const result = analyzePageRangeInputForSplit("1-5, 2-3", 10);
    expect(result.ranges).toEqual([{ start: 1, end: 5 }]);
    expect(result.warningCodes).toEqual(["overlapOrDuplicate"]);
  });

  it("reports both unordered and overlap warnings together", () => {
    const result = analyzePageRangeInputForSplit("4-6, 1-3, 2-3", 10);
    expect(result.ranges).toEqual([
      { start: 1, end: 3 },
      { start: 4, end: 6 },
    ]);
    expect(result.warningCodes).toEqual(["unordered", "overlapOrDuplicate"]);
  });

  it("handles first/last count aliases during analysis and warning detection", () => {
    expect(analyzePageRangeInputForSplit("first-3,last-3", 5)).toEqual({
      ranges: [{ start: 1, end: 5 }],
      warningCodes: ["overlapOrDuplicate"],
    });
    expect(analyzePageRangeInputForSplit("last-2,start-2", 5)).toEqual({
      ranges: [{ start: 1, end: 2 }, { start: 4, end: 5 }],
      warningCodes: ["unordered"],
    });
    expect(analyzePageRangeInputForSplit("end-4,start-4", 3)).toEqual({
      ranges: [{ start: 1, end: 3 }],
      warningCodes: ["overlapOrDuplicate"],
    });
  });

  it("keeps ranges without warnings when clean", () => {
    const result = analyzePageRangeInputForSplit("1, 3-4, 6", 10);
    expect(result.ranges).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 4 },
      { start: 6, end: 6 },
    ]);
    expect(result.warningCodes).toEqual([]);
  });

  it("supports full-width and pipe separators in split analysis", () => {
    const result = analyzePageRangeInputForSplit("1/3|5,7", 10);
    expect(result.ranges).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 3 },
      { start: 5, end: 5 },
      { start: 7, end: 7 },
    ]);
    expect(result.warningCodes).toEqual([]);

    const chineseResult = analyzePageRangeInputForSplit("1\uFF0C3\uFF1B5", 10);
    expect(chineseResult.ranges).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 3 },
      { start: 5, end: 5 },
    ]);
    expect(chineseResult.warningCodes).toEqual([]);
  });
});

describe("formatPageRanges", () => {
  it("formats mixed single-page and span ranges as compact strings", () => {
    expect(formatPageRanges([
      { start: 1, end: 1 },
      { start: 3, end: 4 },
      { start: 6, end: 9 },
    ])).toBe("1, 3-4, 6-9");
  });

  it("returns empty string for empty input", () => {
    expect(formatPageRanges([])).toBe("");
  });
});

describe("countPagesInRanges", () => {
  it("returns total page count across merged ranges", () => {
    expect(countPagesInRanges([
      { start: 1, end: 1 },
      { start: 3, end: 4 },
      { start: 6, end: 9 },
    ])).toBe(7);
  });
});

describe("rangeToFileLabel", () => {
  it("returns a single-page file label", () => {
    expect(rangeToFileLabel(4, 4)).toBe("page_4.pdf");
  });

  it("returns a range file label", () => {
    expect(rangeToFileLabel(2, 5)).toBe("pages_2-5.pdf");
  });
});
