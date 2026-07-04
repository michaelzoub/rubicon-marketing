"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { trackClick, APP_URL } from "@/app/_components/analytics-links";
import { trackMarketingCtaClicked } from "@/app/_components/analytics/events";

export function ExploreTrackedNotice({ failed }: { failed: boolean }) {
  return (
    <div className="explore-notice">
      <BookOpen size={22} aria-hidden="true" />
      <h2>{failed ? "Catalog unavailable" : "No live articles"}</h2>
      <p>{failed ? "The public directory could not be loaded." : "Publish the first article."}</p>
      <Link
        href={`${APP_URL}/dashboard/articles/new`}
        className="button button-primary text-sm"
        onClick={() => {
          trackMarketingCtaClicked({
            cta_id: "explore_start_publishing",
            label: "Publish article",
            page: "explore",
            section: "tracked_notice",
            audience: "creator",
            intent: "publish",
            position: "section",
            target_type: "app",
            target_url: `${APP_URL}/dashboard/articles/new`,
          });
          trackClick("start_publishing_clicked", { location: "explore_empty_state" });
        }}
      >
        Publish article <ArrowRight size={15} />
      </Link>
    </div>
  );
}
