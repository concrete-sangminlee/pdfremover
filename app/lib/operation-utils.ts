export interface OperationErrorMessages {
  msgError: string;
  msgPassword: string;
  msgCorrupt: string;
}

export interface BatchFailure {
  index: number;
  fileName: string;
  file: File;
  error: unknown;
}

export interface BatchResult<T> {
  values: T[];
  failures: BatchFailure[];
  aborted: boolean;
}

export interface ProcessFileBatchOptions {
  continueOnError?: boolean;
  signal?: AbortSignal;
  onFailure?: (failure: BatchFailure) => void;
}

export function batchProgressFromIndex(index: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) {
    return 100;
  }
  if (index <= 0) return 0;
  return Math.round((index / total) * 100);
}

export async function processFileBatch<T>(
  files: readonly File[],
  processFile: (file: File, index: number) => Promise<T>,
  onProgress?: (percent: number) => void,
  onStep?: (index: number, total: number, file: File) => void,
  options: ProcessFileBatchOptions = {}
): Promise<T[]> {
  const result = await processFileBatchWithErrors(files, processFile, onProgress, onStep, options);
  return result.values;
}

export async function processFileBatchWithErrors<T>(
  files: readonly File[],
  processFile: (file: File, index: number) => Promise<T>,
  onProgress?: (percent: number) => void,
  onStep?: (index: number, total: number, file: File) => void,
  options: ProcessFileBatchOptions = {}
): Promise<BatchResult<T>> {
  const total = files.length;
  const results: T[] = [];
  const failures: BatchFailure[] = [];
  const { continueOnError = false, signal, onFailure } = options;

  for (const [index, file] of files.entries()) {
    if (signal?.aborted) {
      return { values: results, failures, aborted: true };
    }

    onStep?.(index, total, file);
    onProgress?.(batchProgressFromIndex(index, total));

    try {
      results.push(await processFile(file, index));
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) {
        return { values: results, failures, aborted: true };
      }

      const failure: BatchFailure = {
        index,
        fileName: file.name,
        file,
        error,
      };
      failures.push(failure);
      onFailure?.(failure);
      if (!continueOnError) throw error;
    }
  }

  if (results.length > 0 || files.length === 0) {
    onProgress?.(100);
  }
  return { values: results, failures, aborted: false };
}

export function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === "AbortError";
}

export function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Operation cancelled", "AbortError");
  }
}

export function classifyExecutionError(error: unknown, messages: OperationErrorMessages): string {
  if (!(error instanceof Error)) {
    return messages.msgError;
  }

  const message = error.message.toLowerCase();
  if (message.includes("password") || message.includes("encrypt") || message.includes("protected")) {
    return messages.msgPassword;
  }
  if (
    message.includes("invalid") ||
    message.includes("parse") ||
    message.includes("corrupt") ||
    message.includes("unsupported") ||
    message.includes("not a pdf")
  ) {
    return messages.msgCorrupt;
  }

  return error.message || messages.msgError;
}
