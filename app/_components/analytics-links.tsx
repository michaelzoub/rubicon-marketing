"use client";

import Link, { type LinkProps } from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

type AnalyticsLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    location: string;
  };

function currentPathname() {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

export function StartPublishingLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Funnel step: visitor chooses to start the creator publishing flow.
    posthog.capture("start_publishing_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}

export function SignInLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Funnel step: visitor chooses to enter the creator sign-in flow.
    posthog.capture("sign_in_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}

export function ExploreLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Funnel step: visitor chooses to browse public articles.
    posthog.capture("explore_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}

export function PageEngagementTracker() {
  const startedAt = useRef(0);
  const deepestSection = useRef("hero");
  const deepestIndex = useRef(0);
  const capturedSummary = useRef(false);

  useEffect(() => {
    startedAt.current = performance.now();
    capturedSummary.current = false;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-analytics-section]"));
    const seenSections = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const section = entry.target.getAttribute("data-analytics-section");
          const index = Number(entry.target.getAttribute("data-analytics-section-index") ?? "0");
          if (!section) continue;

          if (index >= deepestIndex.current) {
            deepestIndex.current = index;
            deepestSection.current = section;
          }

          if (!seenSections.has(section)) {
            seenSections.add(section);
            // Funnel context: landing section reached during the visit.
            posthog.capture("section_viewed", {
              section,
              current_url: currentPathname(),
            });
          }
        }
      },
      { threshold: 0.4 },
    );

    sections.forEach((section, index) => {
      section.setAttribute("data-analytics-section-index", String(index));
      observer.observe(section);
    });

    const captureSummary = () => {
      if (capturedSummary.current || !startedAt.current) return;
      capturedSummary.current = true;

      const timeOnPageSeconds = Math.max(0, Math.round((performance.now() - startedAt.current) / 1000));
      // Funnel context: page dwell time and deepest landing section reached before exit.
      posthog.capture("page_engagement_recorded", {
        current_url: currentPathname(),
        time_on_page_seconds: timeOnPageSeconds,
        deepest_section: deepestSection.current,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") captureSummary();
    };

    window.addEventListener("pagehide", captureSummary);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      captureSummary();
      observer.disconnect();
      window.removeEventListener("pagehide", captureSummary);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
