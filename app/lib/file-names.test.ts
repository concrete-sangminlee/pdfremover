import { describe, expect, it } from "vitest";
import { sanitizeOutputFilename } from "./file-names";

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
});
