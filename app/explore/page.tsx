import { ArrowRight, BookOpen, FileText, Users } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { listPublicCreators, PublicDirectoryUnavailable, type PublicCreator } from "@/lib/rubicon/public";
import { ExploreDirectory } from "./_components/explore-directory";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "Explore articles · Rubicon",
  description: "Discover authors and live pay-per-word articles for AI agents.",
};

// The directory changes immediately after publishing. Always query it on a
// fresh request instead of serving an ISR or prefetched route snapshot.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function Notice({ failed }: { failed: boolean }) {
  return (
    <div className="explore-notice">
      <BookOpen size={22} aria-hidden="true" />
      <h2>{failed ? "Catalog unavailable" : "No live articles"}</h2>
      <p>{failed ? "The public directory could not be loaded." : "Publish the first article."}</p>
      <Link href="/dashboard/articles/new" className="button button-primary text-sm">Publish article <ArrowRight size={15} /></Link>
    </div>
  );
}

export default async function ExplorePage() {
  let creators: PublicCreator[] = [];
  let failed = false;

  try {
    creators = await listPublicCreators();
  } catch (error) {
    console.error("[explore] failed to load public directory:", error);
    failed = error instanceof PublicDirectoryUnavailable || error instanceof Error;
  }

  const articleCount = creators.reduce((sum, creator) => sum + creator.articles.length, 0);

  return (
    <>
      <SiteHeader variant="explore" />
      <main className="explore-page">
        <section className="container pb-10 pt-20 md:pb-14 md:pt-28">
          <p className="eyebrow">Public directory</p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.7rem,6vw,5.8rem)] font-[800] leading-[0.94] tracking-[-0.055em]">Discover writing for agents.</h1>
          {!failed && creators.length > 0 && (
            <div className="mt-7 flex items-center gap-5 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-2"><Users size={15} /> {creators.length} authors</span>
              <span className="flex items-center gap-2"><FileText size={15} /> {articleCount} live articles</span>
            </div>
          )}
        </section>

        <section className="container pb-24">
          {failed || creators.length === 0 ? <Notice failed={failed} /> : <ExploreDirectory creators={creators} />}
        </section>
      </main>
    </>
  );
}
