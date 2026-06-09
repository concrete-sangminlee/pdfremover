import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolkitApp from "../components/toolkit-app";
import { TOOL_BY_ID, VALID_TOOLS, isValidTool } from "../lib/config";
import { CATEGORY_KEYWORDS, TOOL_PAGE_META } from "../lib/tool-metadata";

export const dynamicParams = false;

type ToolPageParams = {
  params: Promise<{ tool: string }>;
};

export function generateStaticParams() {
  return VALID_TOOLS.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: ToolPageParams): Promise<Metadata> {
  const { tool } = await params;
  if (!isValidTool(tool)) {
    notFound();
  }

  const meta = TOOL_PAGE_META[tool];

  return {
    title: meta.titleEn,
    description: meta.descEn,
    keywords: [
      meta.titleEn,
      meta.titleKo,
      ...CATEGORY_KEYWORDS[TOOL_BY_ID[tool].category],
      "FileForge",
    ],
    openGraph: {
      type: "website",
      title: `${meta.titleEn} — FileForge`,
      description: meta.descEn,
      siteName: "FileForge",
    },
    twitter: {
      card: "summary",
      title: `${meta.titleEn} — FileForge`,
      description: meta.descEn,
    },
    alternates: {
      canonical: `/${tool}`,
    },
  };
}

export default async function ToolPage({ params }: ToolPageParams) {
  const { tool } = await params;
  if (!isValidTool(tool)) notFound();

  return <ToolkitApp initialTool={tool} />;
}
