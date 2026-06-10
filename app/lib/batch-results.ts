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
