const FALLBACK_SITE_URL = "https://pdfcontrol.vercel.app";

export function normalizeSiteUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return FALLBACK_SITE_URL;

  try {
    const url = new URL(trimmed);
    if (!/^(https?:)$/.test(url.protocol)) {
      return FALLBACK_SITE_URL;
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${pathname === "/" ? "" : pathname}`;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
