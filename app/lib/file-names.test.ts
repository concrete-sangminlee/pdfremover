import { describe, expect, it } from "vitest";
import { sanitizeOutputFilename, uniqueOutputFilename } from "./file-names";

describe("sanitizeOutputFilename", () => {
  it("removes path separators and reserved filename characters", () => {
    expect(sanitizeOutputFilename("../bad:name?.pdf")).toBe("_bad_name_.pdf");
  });

  it("uses a fallback for empty or dot-only names", () => {
    expect(sanitizeOutputFilename("...", "download.pdf")).toBe("download.pdf");
  });

  it("guards reserved Windows device names", () => {
    expect(sanitizeOutputFilename("CON.pdf")).toBe("_CON.pdf");
  });

  it("keeps the extension when truncating long names", () => {
    const result = sanitizeOutputFilename(`${"a".repeat(220)}.pdf`);
    expect(result).toHaveLength(180);
    expect(result.endsWith(".pdf")).toBe(true);
  });

  it("strips reserved control characters including DEL", () => {
    const del = String.fromCharCode(127);
    expect(sanitizeOutputFilename(`bad${del}name.txt`)).toBe("bad_name.txt");
  });

  it("truncates correctly when extension is missing", () => {
    const result = sanitizeOutputFilename("a".repeat(220));
    expect(result).toHaveLength(180);
    expect(result).toBe("a".repeat(180));
  });

  it("sanitizes slash-like unicode characters", () => {
    expect(sanitizeOutputFilename("path\u2044to\\file.txt")).toBe("path_to_file.txt");
  });

  it("sanitizes fallback names before using them", () => {
    expect(sanitizeOutputFilename("", "inva/lid.txt")).toBe("inva_lid.txt");
    expect(sanitizeOutputFilename("", "///")).toBe("file");
  });

  it("truncates by UTF-8 byte length while preserving extension", () => {
    const longKoreanName = `${"한".repeat(130)}.pdf`;
    const result = sanitizeOutputFilename(longKoreanName);
    expect(result.endsWith(".pdf")).toBe(true);
    expect(new TextEncoder().encode(result).length).toBeLessThanOrEqual(180);
  });
});

describe("uniqueOutputFilename", () => {
  it("deduplicates sanitized output names without collisions", () => {
    const seen = new Set<string>();

    expect(uniqueOutputFilename("file.pdf", seen)).toBe("file.pdf");
    expect(uniqueOutputFilename("file.pdf", seen)).toBe("file (2).pdf");
    expect(uniqueOutputFilename("file (2).pdf", seen)).toBe("file (2) (2).pdf");
  });

  it("keeps duplicate suffixes within the UTF-8 byte limit", () => {
    const seen = new Set<string>();
    const longName = `${"a".repeat(220)}.pdf`;

    expect(uniqueOutputFilename(longName, seen)).toHaveLength(180);

    const duplicate = uniqueOutputFilename(longName, seen);
    expect(duplicate.endsWith(" (2).pdf")).toBe(true);
    expect(new TextEncoder().encode(duplicate).length).toBeLessThanOrEqual(180);
  });
});
