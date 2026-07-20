/**
 * Public article catalog for the landing-page agent demo.
 *
 * Flattens the same public directory that powers /explore into a compact,
 * agent-friendly list. Exposes only buyer-visible metadata (titles, prices,
 * section headings) — never unpaid body text.
 */
import { NextResponse } from "next/server";
import { listPublicCreators, PublicDirectoryUnavailable } from "@/lib/rubicon/public";
import { atomicPerWordToPer1000Usd } from "@/lib/rubicon/pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface AgentCatalogArticle {
  id: string;
  title: string;
  author: string;
  creatorId: string;
  /** Price for 1,000 words, in USD. */
  pricePer1kUsd: number;
  totalWords: number;
  sectionHeadings: string[];
  readCount: number;
  sourceUrl: string | null;
  updatedAt: string;
}

export async function GET() {
  try {
    const creators = await listPublicCreators();
    const articles: AgentCatalogArticle[] = creators.flatMap((creator) =>
      creator.articles.map((article) => ({
        id: article.id,
        title: article.title,
        author: creator.username,
        creatorId: creator.id,
        pricePer1kUsd: atomicPerWordToPer1000Usd(article.pricePerWordAtomic),
        totalWords: article.totalWords,
        sectionHeadings: article.sectionHeadings,
        readCount: article.readCount,
        sourceUrl: article.sourceUrl,
        updatedAt: article.updatedAt,
      })),
    );
    return NextResponse.json(
      { articles },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    const message =
      error instanceof PublicDirectoryUnavailable
        ? "The Rubicon directory is not available right now."
        : "Failed to load the article catalog.";
    console.error("[agent/catalog]", error);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
