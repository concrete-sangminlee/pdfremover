import type { MetadataRoute } from "next";
import { TOOLS } from "./lib/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pdfcontrol.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...TOOLS.map((tool) => ({
      url: `${BASE_URL}/${tool.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
