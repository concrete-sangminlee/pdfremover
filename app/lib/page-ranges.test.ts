import { describe, expect, it } from "vitest";
import { parsePageRangeGroups, parsePageRanges } from "./page-ranges";

describe("parsePageRangeGroups", () => {
  it("parses single pages and inclusive ranges", () => {
    expect(parsePageRangeGroups("1, 3-5, 8", 10)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
      { start: 8, end: 8 },
    ]);
  });

  it("rejects malformed, reversed, and out-of-range groups", () => {
    expect(parsePageRangeGroups("1,,", 10)).toEqual([{ start: 1, end: 1 }]);
    expect(parsePageRangeGroups("2-a", 10)).toBeNull();
    expect(parsePageRangeGroups("5-3", 10)).toBeNull();
    expect(parsePageRangeGroups("11", 10)).toBeNull();
    expect(parsePageRangeGroups("", 10)).toBeNull();
  });
});

describe("parsePageRanges", () => {
  it("deduplicates and sorts pages by default", () => {
    expect(parsePageRanges("3, 1, 3, 2-4", 5)).toEqual([1, 2, 3, 4]);
  });

  it("can preserve user-entered order for extraction workflows", () => {
    expect(parsePageRanges("3, 1, 3, 2-4", 5, { preserveOrder: true })).toEqual([3, 1, 2, 4]);
  });
});
