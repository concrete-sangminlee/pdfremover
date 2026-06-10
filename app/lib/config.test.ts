import { describe, expect, it } from "vitest";
import {
  IMAGE_INPUT_TOOLS,
  NO_PAGE_INFO_TOOLS,
  NO_PDF_LIB_PRELOAD_TOOLS,
  PAGE_INPUT_TOOLS,
  isImageInputTool,
  hasNoPageInfo,
  hasNoPdfLibPreload,
  isPageInputTool,
  isValidTool,
  normalizeToolPath,
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

  it("marks image input tools with the image category", () => {
    for (const tool of IMAGE_INPUT_TOOLS) {
      expect(TOOL_BY_ID[tool].category, tool).toBe("image");
    }
  });

  it("validates tool ids and image-tool view detection", () => {
    expect(isValidTool("split")).toBe(true);
    expect(isValidTool("missing-tool")).toBe(false);
    expect(isImageInputTool("img2pdf")).toBe(true);
    expect(isImageInputTool("home")).toBe(false);
    expect(isImageInputTool("docx2html")).toBe(false);
    expect(isPageInputTool("split")).toBe(true);
    expect(isPageInputTool("img2pdf")).toBe(false);
    expect(isPageInputTool("docx2html")).toBe(false);
    expect(hasNoPageInfo("img2pdf")).toBe(true);
    expect(hasNoPageInfo("split")).toBe(false);
    expect(hasNoPdfLibPreload("imgcompress")).toBe(true);
    expect(hasNoPdfLibPreload("split")).toBe(false);
  });

  it("handles odd and malformed values explicitly", () => {
    expect(isValidTool("")).toBe(false);
    expect(isValidTool("home")).toBe(false);
    expect(isValidTool("COMpress")).toBe(false);
    expect(isPageInputTool("home")).toBe(false);
  });

  it("normalizes tool path safely and case-insensitively", () => {
    expect(normalizeToolPath("")).toBe("home");
    expect(normalizeToolPath("/split/")).toBe("split");
    expect(normalizeToolPath(" /split ")).toBe("split");
    expect(normalizeToolPath("SPLIT")).toBe("split");
    expect(normalizeToolPath("invalid-tool")).toBe("home");
    expect(normalizeToolPath("%%")).toBe("home");
    expect(normalizeToolPath("split%2F")).toBe("split");
  });
});
