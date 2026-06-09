const CJK_TEXT_PATTERN =
  /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/u;

export function hasCjkText(text: string): boolean {
  return CJK_TEXT_PATTERN.test(text);
}

export function isPdfStandardLatinText(text: string): boolean {
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (
      code === undefined ||
      !(
        code === 9 ||
        code === 10 ||
        code === 13 ||
        (code >= 32 && code <= 126) ||
        (code >= 160 && code <= 255)
      )
    ) {
      return false;
    }
  }

  return true;
}

export function needsImagePdfRendering(text: string): boolean {
  return !isPdfStandardLatinText(text);
}
