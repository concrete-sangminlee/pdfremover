const FALLBACK_SITE_URL = "https://pdfcontrol.vercel.app";

function normalizeSiteUrl(value: string | undefined) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed || FALLBACK_SITE_URL;
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
