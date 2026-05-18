import { describe, expect, it } from "vitest";
import { normalizeSiteUrl } from "./site";

describe("normalizeSiteUrl", () => {
  it("falls back when the value is missing or invalid", () => {
    expect(normalizeSiteUrl(undefined)).toBe("https://pdfcontrol.vercel.app");
    expect(normalizeSiteUrl("not a url")).toBe("https://pdfcontrol.vercel.app");
  });

  it("removes trailing slashes from valid site URLs", () => {
    expect(normalizeSiteUrl("https://example.com///")).toBe("https://example.com");
    expect(normalizeSiteUrl("https://example.com/tools/")).toBe("https://example.com/tools");
  });
});
