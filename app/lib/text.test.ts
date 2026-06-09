import { describe, expect, it } from "vitest";
import { hasCjkText, isPdfStandardLatinText, needsImagePdfRendering } from "./text";

describe("text helpers", () => {
  it("detects Korean, Japanese, and CJK ideographs", () => {
    expect(hasCjkText("한글")).toBe(true);
    expect(hasCjkText("かな")).toBe(true);
    expect(hasCjkText("漢字")).toBe(true);
    expect(hasCjkText("Latin only")).toBe(false);
  });

  it("accepts PDF standard Latin text for direct font rendering", () => {
    expect(isPdfStandardLatinText("CONFIDENTIAL 123")).toBe(true);
    expect(isPdfStandardLatinText("Cafe\u00A0resume")).toBe(true);
    expect(isPdfStandardLatinText("line 1\nline 2\tend")).toBe(true);
  });

  it("routes unsupported glyphs through image PDF rendering", () => {
    expect(isPdfStandardLatinText("한글")).toBe(false);
    expect(isPdfStandardLatinText("emoji \u{1F512}")).toBe(false);
    expect(needsImagePdfRendering("한글 PDF")).toBe(true);
    expect(needsImagePdfRendering("Plain PDF")).toBe(false);
  });
});
