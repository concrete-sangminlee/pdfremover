import { describe, expect, it } from "vitest";
import { TOOL_BY_ID, TOOLS, VALID_TOOLS } from "../lib/config";
import { RELATED_TOOLS, T } from "./toolkit-app";

const LANGS = ["ko", "en"] as const;
const PLACEHOLDER_PATTERN = /\{[A-Za-z0-9_]+\}/g;

function placeholders(value: string): string[] {
  return [...new Set(value.match(PLACEHOLDER_PATTERN) || [])].sort();
}

describe("toolkit translations", () => {
  it("keeps Korean and English dictionaries aligned", () => {
    expect(Object.keys(T.ko).sort()).toEqual(Object.keys(T.en).sort());
  });

  it("keeps dynamic placeholders aligned across languages", () => {
    for (const key of Object.keys(T.ko) as Array<keyof typeof T.ko>) {
      expect(placeholders(T.ko[key]), key).toEqual(placeholders(T.en[key]));
    }
  });

  it("has labels and descriptions for every registered tool", () => {
    for (const lang of LANGS) {
      for (const tool of TOOLS) {
        const bundle = T[lang];
        const label = bundle[tool.labelKey as keyof typeof bundle];
        const desc = bundle[tool.descKey as keyof typeof bundle];
        expect(label, `${lang}.${tool.labelKey}`).toBeTypeOf("string");
        expect(label.trim(), `${lang}.${tool.labelKey}`).not.toBe("");
        expect(desc, `${lang}.${tool.descKey}`).toBeTypeOf("string");
        expect(desc.trim(), `${lang}.${tool.descKey}`).not.toBe("");
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

  it("keeps history count templates renderable", () => {
    for (const lang of LANGS) {
      expect(T[lang].historyFileCount, `${lang}.historyFileCount`).toContain("{n}");
      expect(T[lang].historyImageCount, `${lang}.historyImageCount`).toContain("{n}");
      expect(T[lang].historyTextInput.trim(), `${lang}.historyTextInput`).not.toBe("");
    }
  });
});

describe("related tools", () => {
  it("keeps recommendations complete and valid for every tool", () => {
    expect(Object.keys(RELATED_TOOLS).sort()).toEqual([...VALID_TOOLS].sort());

    for (const tool of TOOLS) {
      const related = RELATED_TOOLS[tool.id];
      expect(related, tool.id).toHaveLength(4);
      expect(new Set(related).size, tool.id).toBe(related.length);
      expect(related, tool.id).not.toContain(tool.id);

      for (const relatedTool of related) {
        expect(TOOL_BY_ID[relatedTool], `${tool.id} -> ${relatedTool}`).toBeDefined();
      }
    }
  });
});
