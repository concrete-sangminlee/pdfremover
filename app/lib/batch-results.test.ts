import { describe, expect, it } from "vitest";
import {
  createBatchFailureInfo,
  createBatchHistoryStats,
  formatBatchFailureReport,
  getBatchFailureDetails,
  getRetryableBatchRunItems,
  type BatchFailureInfo,
  type BatchRunItem,
} from "./batch-results";

describe("getBatchFailureDetails", () => {
  it("returns trimmed strings and error messages", () => {
    expect(getBatchFailureDetails("  failed  ")).toBe("failed");
    expect(getBatchFailureDetails(new Error("broken"))).toBe("broken");
  });

  it("includes custom stacks when they add useful detail", () => {
    const error = new Error("broken");
    error.stack = "worker stack";

    expect(getBatchFailureDetails(error)).toBe("broken\nworker stack");
  });

  it("extracts object messages and handles unserializable values", () => {
    expect(getBatchFailureDetails({ message: "object failure" })).toBe("object failure");

    const circular: { child?: unknown } = {};
    circular.child = circular;

    expect(getBatchFailureDetails(circular)).toBeUndefined();
  });
});

describe("getRetryableBatchRunItems", () => {
  const files = [
    new File(["0"], "a.pdf"),
    new File(["1"], "b.pdf"),
    new File(["2"], "c.pdf"),
  ];
  const runItems: BatchRunItem[] = files.map((file, index) => ({ file, sourceIndex: index + 10 }));

  it("returns only items whose source indexes failed", () => {
    const failures: BatchFailureInfo[] = [
      { index: 12, fileName: "c.pdf", reason: "bad" },
      { index: 10, fileName: "a.pdf", reason: "bad" },
    ];

    expect(getRetryableBatchRunItems(failures, runItems).map((item) => item.file.name)).toEqual([
      "a.pdf",
      "c.pdf",
    ]);
  });

  it("returns an empty list without failures or previous run items", () => {
    expect(getRetryableBatchRunItems([], runItems)).toEqual([]);
    expect(getRetryableBatchRunItems([{ index: 10, fileName: "a.pdf", reason: "bad" }], [])).toEqual([]);
  });
});

describe("createBatchHistoryStats", () => {
  it("summarizes successful and failed batch counts", () => {
    expect(createBatchHistoryStats({
      values: [1, 2],
      failures: [{ index: 1, fileName: "b.pdf", reason: "bad" }],
      aborted: false,
    }, 3)).toEqual({
      totalFiles: 3,
      successFiles: 2,
      failedFiles: 1,
    });
  });
});

describe("createBatchFailureInfo", () => {
  it("maps raw failures to source-indexed user-facing failures", () => {
    const file = new File(["x"], "source.pdf");
    const failure = createBatchFailureInfo(
      { index: 0, fileName: "internal.pdf", error: new Error("raw failure") },
      (error) => error instanceof Error ? `classified: ${error.message}` : "classified",
      { file, sourceIndex: 9 }
    );

    expect(failure).toEqual({
      index: 9,
      fileName: "source.pdf",
      reason: "classified: raw failure",
      details: "raw failure",
    });
  });

  it("falls back to raw failure index and file name", () => {
    expect(createBatchFailureInfo(
      { index: 2, fileName: "fallback.pdf", error: "" },
      () => "classified"
    )).toEqual({
      index: 2,
      fileName: "fallback.pdf",
      reason: "classified",
    });
  });
});

describe("formatBatchFailureReport", () => {
  it("formats a copyable failure report", () => {
    expect(formatBatchFailureReport([
      { index: 3, fileName: "broken.pdf", reason: "Password required", details: "Encrypted" },
      { index: 4, fileName: "bad.pdf", reason: "Invalid PDF" },
    ])).toBe([
      "1. broken.pdf",
      "Reason: Password required",
      "Details:",
      "Encrypted",
      "",
      "2. bad.pdf",
      "Reason: Invalid PDF",
    ].join("\n"));
  });

  it("returns an empty report for empty failures", () => {
    expect(formatBatchFailureReport([])).toBe("");
  });

  it("uses localized report labels", () => {
    expect(formatBatchFailureReport([
      { index: 3, fileName: "broken.pdf", reason: "Password required", details: "Encrypted" },
    ], { reason: "사유", details: "상세" })).toBe([
      "1. broken.pdf",
      "사유: Password required",
      "상세:",
      "Encrypted",
    ].join("\n"));
  });
});
