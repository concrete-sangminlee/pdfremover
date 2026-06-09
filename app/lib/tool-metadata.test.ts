import { describe, expect, it } from "vitest";
import { TOOL_BY_ID, TOOLS, VALID_TOOLS, type ToolCategory } from "./config";
import { CATEGORY_KEYWORDS, TOOL_PAGE_META } from "./tool-metadata";

const REPLACEMENT_CHARACTER = "\uFFFD";
const TOOL_CATEGORIES = ["pdf", "image", "document"] satisfies ToolCategory[];

function expectCleanText(value: string) {
  expect(value).toBe(value.trim());
  expect(value.length).toBeGreaterThan(4);
  expect(value).not.toContain(REPLACEMENT_CHARACTER);
  expect(value).not.toMatch(/\s{2,}/);
}

describe("tool metadata", () => {
  it("covers every registered tool exactly once", () => {
    expect(Object.keys(TOOL_PAGE_META).sort()).toEqual([...VALID_TOOLS].sort());
  });

  it("keeps every metadata field populated and encoding-safe", () => {
    for (const tool of VALID_TOOLS) {
      const metadata = TOOL_PAGE_META[tool];

      expectCleanText(metadata.titleKo);
      expectCleanText(metadata.titleEn);
      expectCleanText(metadata.descKo);
      expectCleanText(metadata.descEn);
    }
  });

  it("keeps category keywords aligned with registered tool categories", () => {
    const configuredCategories = new Set(TOOLS.map((tool) => tool.category));

    expect(Object.keys(CATEGORY_KEYWORDS).sort()).toEqual([...TOOL_CATEGORIES].sort());
    expect(configuredCategories).toEqual(new Set(TOOL_CATEGORIES));

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.every((keyword) => keyword === keyword.trim())).toBe(true);
      expect(TOOLS.some((tool) => tool.category === category)).toBe(true);
    }
  });

  it("keeps page metadata category lookups valid for each tool", () => {
    for (const tool of VALID_TOOLS) {
      const category = TOOL_BY_ID[tool].category;

      expect(CATEGORY_KEYWORDS[category].length).toBeGreaterThan(0);
    }
  });
});
