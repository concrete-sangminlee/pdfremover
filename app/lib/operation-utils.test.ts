import { describe, expect, it, vi } from "vitest";
import {
  assertNotAborted,
  batchProgressFromIndex,
  classifyExecutionError,
  isAbortError,
  processFileBatch,
  processFileBatchWithErrors,
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
});

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

describe("processFileBatchWithErrors", () => {
  const makeFiles = () => [
    new File(["a"], "a.txt"),
    new File(["b"], "b.txt"),
    new File(["c"], "c.txt"),
  ];

  it("returns all values and failures when continueOnError is true", async () => {
    const files = makeFiles();
    const onFailure = vi.fn();

    const result = await processFileBatchWithErrors(
      files,
      async (_file, index) => {
        if (index === 1) throw new Error("temporary");
        return index;
      },
      undefined,
      undefined,
      {
        continueOnError: true,
        onFailure,
      }
    );

    expect(result.values).toEqual([0, 2]);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.index).toBe(1);
    expect(result.failures[0]?.fileName).toBe("b.txt");
    expect(result.failures[0]?.error).toBeInstanceOf(Error);
    expect(result.aborted).toBe(false);
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it("throws immediately when continueOnError is false", async () => {
    const files = makeFiles();
    await expect(() =>
      processFileBatchWithErrors(files, async (_file, index) => {
        if (index === 1) throw new Error("temporary");
        return index;
      }, undefined, undefined, { continueOnError: false })
    ).rejects.toThrow("temporary");
  });

  it("returns aborted state when signal is already canceled", async () => {
    const files = makeFiles();
    const controller = new AbortController();
    controller.abort();
    const onFailure = vi.fn();

    const result = await processFileBatchWithErrors(files, async () => {
      return 1;
    }, undefined, undefined, {
      continueOnError: true,
      signal: controller.signal,
      onFailure,
    });

    expect(result.values).toEqual([]);
    expect(result.failures).toEqual([]);
    expect(result.aborted).toBe(true);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("returns aborted state when process throws AbortError", async () => {
    const files = makeFiles();
    const result = await processFileBatchWithErrors(files, async (_file, index) => {
      if (index === 1) {
        throw new DOMException("Operation cancelled", "AbortError");
      }
      return index;
    }, undefined, undefined, {
      continueOnError: true,
    });

    expect(result.values).toEqual([0]);
    expect(result.failures).toEqual([]);
    expect(result.aborted).toBe(true);
  });
});

describe("process abort helpers", () => {
  it("detects abort errors", () => {
    expect(isAbortError(new DOMException("Operation cancelled", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("Oops"))).toBe(false);
  });

  it("throws when signal is aborted", () => {
    const signal = new AbortController().signal;
    expect(() => assertNotAborted(signal)).not.toThrow();
    const cancelled = new AbortController();
    cancelled.abort();
    expect(() => assertNotAborted(cancelled.signal)).toThrow("Operation cancelled");
  });

  it("maps errors to user-facing messages", () => {
    const messages = {
      msgError: "An error occurred.",
      msgPassword: "Password is needed.",
      msgCorrupt: "The PDF is corrupt.",
    };

    expect(classifyExecutionError(new Error("Password protected"), messages)).toBe("Password is needed.");
    expect(classifyExecutionError(new Error("Document is encrypted"), messages)).toBe("Password is needed.");
    expect(classifyExecutionError(new Error("Failed to parse file"), messages)).toBe("The PDF is corrupt.");
    expect(classifyExecutionError(new Error("Corrupt document"), messages)).toBe("The PDF is corrupt.");
    expect(classifyExecutionError(new Error("Unknown failure"), messages)).toBe("Unknown failure");
    expect(classifyExecutionError("string", messages)).toBe("An error occurred.");
  });
});
