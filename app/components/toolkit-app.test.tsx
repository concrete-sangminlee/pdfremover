import { describe, expect, it } from "vitest";
import { TOOLS } from "../lib/config";
import { T } from "./toolkit-app";

const LANGS = ["ko", "en"] as const;

describe("toolkit translations", () => {
  it("keeps Korean and English dictionaries aligned", () => {
    expect(Object.keys(T.ko).sort()).toEqual(Object.keys(T.en).sort());
  });

  it("has labels and descriptions for every registered tool", () => {
    for (const lang of LANGS) {
      for (const tool of TOOLS) {
        expect(T[lang][tool.labelKey], `${lang}.${tool.labelKey}`).toBeTypeOf("string");
        expect(T[lang][tool.labelKey].trim(), `${lang}.${tool.labelKey}`).not.toBe("");
        expect(T[lang][tool.descKey], `${lang}.${tool.descKey}`).toBeTypeOf("string");
        expect(T[lang][tool.descKey].trim(), `${lang}.${tool.descKey}`).not.toBe("");
      }
    }
  });

  it("does not include Unicode replacement characters in user-facing text", () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(T[lang])) {
        expect(value, `${lang}.${key}`).not.toContain("\uFFFD");
      }
    }
  });
});
