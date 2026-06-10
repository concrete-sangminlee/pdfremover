export interface OperationErrorMessages {
  msgError: string;
  msgPassword: string;
  msgCorrupt: string;
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
  onStep?: (index: number, total: number, file: File) => void
): Promise<T[]> {
  const total = files.length;
  const results: T[] = [];

  for (const [index, file] of files.entries()) {
    onStep?.(index, total, file);
    onProgress?.(batchProgressFromIndex(index, total));
    results.push(await processFile(file, index));
  }

  onProgress?.(100);
  return results;
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
