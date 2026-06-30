import type { Metadata } from "next";
import { listPublicCreators, PublicDirectoryUnavailable, type PublicCreator } from "@/lib/rubicon/public";
import { ExploreDirectory } from "./_components/explore-directory";
import { ExploreTrackedNotice } from "./_components/explore-tracked-notice";
import { SiteFooter } from "../_components/marketing/site-footer";
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
    <ExploreTrackedNotice failed={failed} />
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

  return (
    <div className="landing-page explore-page">
      <SiteHeader variant="explore" />
      <main className="explore-main dashboard-theme">
        <section className="landing-section-block explore-hero" aria-labelledby="explore-heading">
          <div className="container landing-copy-stack explore-hero-copy">
            <div className="landing-section-kicker">
              <h1 id="explore-heading" className="landing-hero-title explore-hero-title">
                Find writing your agent can use.
              </h1>
            </div>
          </div>
        </section>

        <section className="container explore-directory-section">
          {failed || creators.length === 0 ? <Notice failed={failed} /> : <ExploreDirectory creators={creators} />}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
