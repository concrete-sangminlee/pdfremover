import { describe, expect, it } from "vitest";
import {
  batchProgressFromIndex,
  classifyExecutionError,
  processFileBatch,
} from "./operation-utils";

describe("batchProgressFromIndex", () => {
  it("returns 0 at start and 100 at completion", () => {
    expect(batchProgressFromIndex(0, 3)).toBe(0);
    expect(batchProgressFromIndex(1, 3)).toBe(33);
    expect(batchProgressFromIndex(2, 3)).toBe(67);
    expect(batchProgressFromIndex(3, 3)).toBe(100);
  });

  it("guards invalid totals", () => {
    expect(batchProgressFromIndex(5, 0)).toBe(100);
    expect(batchProgressFromIndex(-1, 0)).toBe(100);
  });
}
);

describe("processFileBatch", () => {
  it("processes in order and reports progress", async () => {
    const files = [
      new File(["a"], "a.txt"),
      new File(["b"], "b.txt"),
      new File(["c"], "c.txt"),
    ];
    const progress: number[] = [];
    const items = await processFileBatch(files, async (file, index) => `${index}:${file.name}`, (pct) => {
      progress.push(pct);
    });

    expect(items).toEqual(["0:a.txt", "1:b.txt", "2:c.txt"]);
    expect(progress).toEqual([0, 33, 67, 100]);
  });
});

describe("classifyExecutionError", () => {
  const messages = {
    msgError: "An error occurred.",
    msgPassword: "Password is needed.",
    msgCorrupt: "The PDF is corrupt.",
  };

  it("maps encryption-related errors to password hint", () => {
    expect(classifyExecutionError(new Error("Password protected"), messages)).toBe("Password is needed.");
    expect(classifyExecutionError(new Error("Document is encrypted"), messages)).toBe("Password is needed.");
  });

  it("maps parse/corrupt errors to corrupt hint", () => {
    expect(classifyExecutionError(new Error("Failed to parse file"), messages)).toBe("The PDF is corrupt.");
    expect(classifyExecutionError(new Error("Corrupt document"), messages)).toBe("The PDF is corrupt.");
  });

  it("falls back to generic error", () => {
    expect(classifyExecutionError(new Error("Unknown failure"), messages)).toBe("Unknown failure");
    expect(classifyExecutionError("string", messages)).toBe("An error occurred.");
  });
});
