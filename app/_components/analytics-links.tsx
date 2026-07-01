"use client";

import Link, { type LinkProps } from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Canonical URL of the creator app. The dashboard now lives in the separate
 * `rubicon-app` deployment (root redirects to /dashboard), so marketing CTAs
 * that used to point at the local `/dashboard` route link out to here.
 */
export const APP_URL = "https://app.rubiconpay.xyz";

function currentPathname() {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

/**
 * Generic click tracker — call inside any onClick handler:
 *   onClick={() => { trackClick("button_name", { extra: "props" }); doThing(); }}
 */
export function trackClick(
  eventName: string,
  properties?: Record<string, string | number | boolean>,
) {
  posthog.capture(eventName, {
    current_url: currentPathname(),
    ...properties,
  });
}

// ---------------------------------------------------------------------------
// Typed analytics-wrapped <Link> components
// ---------------------------------------------------------------------------

type AnalyticsLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    location: string;
  };

// -- Existing funnel events (keep backwards-compatible) --

export function StartPublishingLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
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
    posthog.capture("explore_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

// -- New CTAs --

export function SetUpAgentLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("set_up_agent_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function BookDemoLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("book_demo_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function ReadDocsLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("read_docs_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

// -- Navigation --

export function NavLink({
  location,
  label,
  onClick,
  ...props
}: AnalyticsLinkProps & { label: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("nav_link_clicked", {
      location,
      label,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

// -- Footer --

export function FooterAnalyticsLink({
  location,
  label,
  onClick,
  ...props
}: AnalyticsLinkProps & { label: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("footer_link_clicked", {
      location,
      label,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

// -- Generic "marketing CTA" for anything not covered by a typed component --

export function MarketingCtaLink({
  eventName,
  location,
  onClick,
  ...props
}: AnalyticsLinkProps & { eventName: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture(eventName, {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

// ---------------------------------------------------------------------------
// Page engagement tracker (scroll depth + time on page)
// ---------------------------------------------------------------------------

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
