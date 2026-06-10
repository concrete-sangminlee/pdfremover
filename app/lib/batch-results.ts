export interface BatchFailureInfo {
  index: number;
  fileName: string;
  reason: string;
  details?: string;
}

export interface BatchHistoryStats {
  totalFiles?: number;
  successFiles?: number;
  failedFiles?: number;
}

export interface BatchRunItem {
  file: File;
  sourceIndex: number;
}

export interface BatchFailureInput {
  index: number;
  fileName: string;
  error: unknown;
}

export type BatchSummaryResult<T> = {
  values: T[];
  failures: BatchFailureInfo[];
  aborted: boolean;
};

export function getBatchFailureDetails(error: unknown): string | undefined {
  if (error == null) return undefined;
  if (error instanceof Error) {
    const message = error.message?.trim();
    const stack = error.stack?.trim();
    if (!message) return undefined;
    if (!stack || stack.includes(message)) return message;
    return `${message}\n${stack}`;
  }
  if (typeof error === "string") {
    const text = error.trim();
    return text || undefined;
  }
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message.trim() || undefined;
  }
  try {
    const asJson = JSON.stringify(error);
    return asJson || undefined;
  } catch {
    return undefined;
  }
}

export function getRetryableBatchRunItems(
  failures: readonly BatchFailureInfo[],
  lastRunItems: readonly BatchRunItem[]
): BatchRunItem[] {
  if (failures.length === 0 || lastRunItems.length === 0) return [];
  const retryIndices = new Set<number>(failures.map((failure) => failure.index));
  return lastRunItems.filter((item) => retryIndices.has(item.sourceIndex));
}

export function createBatchHistoryStats<T>(
  result: BatchSummaryResult<T>,
  totalFiles: number
): Required<BatchHistoryStats> {
  return {
    totalFiles,
    successFiles: result.values.length,
    failedFiles: result.failures.length,
  };
}

export function createBatchFailureInfo(
  failure: BatchFailureInput,
  classifyError: (error: unknown) => string,
  runItem?: BatchRunItem
): BatchFailureInfo {
  const details = getBatchFailureDetails(failure.error);
  return {
    index: runItem?.sourceIndex ?? failure.index,
    fileName: runItem?.file.name || failure.fileName,
    reason: classifyError(failure.error),
    ...(details ? { details } : {}),
  };
}

export interface BatchFailureReportLabels {
  reason: string;
  details: string;
}

const DEFAULT_FAILURE_REPORT_LABELS: BatchFailureReportLabels = {
  reason: "Reason",
  details: "Details",
};

export function formatBatchFailureReport(
  failures: readonly BatchFailureInfo[],
  labels: BatchFailureReportLabels = DEFAULT_FAILURE_REPORT_LABELS
): string {
  return failures
    .map((failure, index) => {
      const lines = [
        `${index + 1}. ${failure.fileName}`,
        `${labels.reason}: ${failure.reason}`,
      ];
      if (failure.details) {
        lines.push(`${labels.details}:\n${failure.details}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}
