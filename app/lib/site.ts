const FALLBACK_SITE_URL = "https://pdfcontrol.vercel.app";

export function normalizeSiteUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return FALLBACK_SITE_URL;

  try {
    const url = new URL(trimmed);
    if (url.username || url.password || !url.hostname) {
      return FALLBACK_SITE_URL;
    }
    if (!/^(https?:)$/.test(url.protocol)) {
      return FALLBACK_SITE_URL;
    }

    const isDefaultPort =
      (url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443");
    const port = url.port && !isDefaultPort ? `:${url.port}` : "";
    const pathname = url.pathname.replace(/\/+$/, "");
    const normalizedPath = pathname === "/" ? "" : pathname;
    return `${url.protocol}//${url.hostname.toLowerCase()}${port}${normalizedPath}`;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
