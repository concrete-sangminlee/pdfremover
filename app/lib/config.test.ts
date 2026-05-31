import { describe, expect, it } from "vitest";
import {
  IMAGE_INPUT_TOOLS,
  NO_PAGE_INFO_TOOLS,
  NO_PDF_LIB_PRELOAD_TOOLS,
  PAGE_INPUT_TOOLS,
  isImageInputTool,
  isValidTool,
  TOOLS,
  TOOL_BY_ID,
  VALID_TOOLS,
} from "./config";

describe("tool config", () => {
  it("keeps tool ids unique and addressable", () => {
    expect(new Set(VALID_TOOLS).size).toBe(TOOLS.length);
    expect(Object.keys(TOOL_BY_ID).sort()).toEqual([...VALID_TOOLS].sort());
  });

  it("keeps tool groups aligned with registered tools", () => {
    const registered = new Set(VALID_TOOLS);
    const groups = [
      IMAGE_INPUT_TOOLS,
      NO_PAGE_INFO_TOOLS,
      NO_PDF_LIB_PRELOAD_TOOLS,
      PAGE_INPUT_TOOLS,
    ];

    for (const group of groups) {
      expect(group.every((tool) => registered.has(tool))).toBe(true);
    }
  });

  it("validates tool ids and image-tool view detection", () => {
    expect(isValidTool("split")).toBe(true);
    expect(isValidTool("missing-tool")).toBe(false);
    expect(isImageInputTool("img2pdf")).toBe(true);
    expect(isImageInputTool("home")).toBe(false);
  });
});
