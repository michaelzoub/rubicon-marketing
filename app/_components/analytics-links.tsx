"use client";

import Link, { type LinkProps } from "next/link";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import {
  trackSectionViewed,
  trackPageViewed,
  type Audience,
  type PageId,
} from "./analytics/events";

// ---------------------------------------------------------------------------
// Re-exports — the canonical wrapper lives in `analytics/`. Importing from
// here keeps existing call sites working while we migrate them.
// ---------------------------------------------------------------------------

export {
  trackPageViewed,
  trackSectionViewed,
  trackMarketingCtaClicked,
  trackNavClicked,
  trackExternalLinkClicked,
  trackCopyActionCompleted,
  trackVisualInteracted,
  trackVisualOnce,
  trackFunnelStepCompleted,
} from "./analytics/events";
export type {
  Audience,
  CtaIntent,
  CtaPosition,
  CtaTargetType,
  MarketingCtaProperties,
  NavClickProperties,
  ExternalLinkProperties,
  CopyActionProperties,
  VisualInteractionProperties,
  FunnelStep,
  FunnelStepProperties,
  PageId,
} from "./analytics/events";

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
 * Legacy generic click tracker. Kept for backwards compatibility with existing
 * `trackClick("start_publishing_clicked", ...)` call sites. New code should
 * call the canonical helpers from `analytics/events` instead. Still routes
 * through `posthog.capture` so it carries the (legacy) shape those events
 * already have in PostHog — do not use for new canonical events.
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
// Page view + section engagement
// ---------------------------------------------------------------------------

/**
 * Fires the canonical `page_viewed` event exactly once on mount. The PostHog
 * SDK also has `capture_pageview` enabled, but that auto-event lacks the
 * stable `page` / `audience` taxonomy we want for the dashboard, so we layer
 * this on top.
 *
 * Usage: drop <AnalyticsPageView page="home" audience="mixed" /> into each
 * marketing route.
 */
export function AnalyticsPageView({ page, audience }: { page: PageId; audience: Audience }) {
  useEffectOnce(() => {
    trackPageViewed({ page, audience });
  });
  return null;
}

/**
 * Annotation contract for section tracking. Add `data-analytics-section`
 * (and optionally `data-analytics-section-index`) to the major sections of a
 * page; the PageEngagementTracker below observes them and fires the canonical
 * `section_viewed` event with `{ page, section, section_index }`.
 */
const SECTION_ATTR = "data-analytics-section";
const SECTION_INDEX_ATTR = "data-analytics-section-index";

export function PageEngagementTracker({ page }: { page: string }) {
  const startedAt = useRef(0);
  const deepestSection = useRef("");
  const deepestIndex = useRef(0);
  const capturedSummary = useRef(false);

  useEffect(() => {
    startedAt.current = performance.now();
    capturedSummary.current = false;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(`[${SECTION_ATTR}]`),
    );
    const seenSections = new Set<string>();

    // Stabilise the section_index from DOM order if the markup didn't pass one.
    sections.forEach((section, index) => {
      if (!section.hasAttribute(SECTION_INDEX_ATTR)) {
        section.setAttribute(SECTION_INDEX_ATTR, String(index));
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = entry.target.getAttribute(SECTION_ATTR);
          if (!section) continue;
          const index = Number(entry.target.getAttribute(SECTION_INDEX_ATTR) ?? "0");
          if (index >= deepestIndex.current) {
            deepestIndex.current = index;
            deepestSection.current = section;
          }
          if (!seenSections.has(section)) {
            seenSections.add(section);
            trackSectionViewed({ page, section, section_index: index });
          }
        }
      },
      { threshold: 0.4 },
    );

    sections.forEach((section) => observer.observe(section));

    const captureSummary = () => {
      if (capturedSummary.current || !startedAt.current) return;
      capturedSummary.current = true;
      const timeOnPageSeconds = Math.max(
        0,
        Math.round((performance.now() - startedAt.current) / 1000),
      );
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
  }, [page]);

  return null;
}

// A tiny effect that runs exactly once per mount (and survives StrictMode's
// double-invoke in dev by guarding with a ref).
function useEffectOnce(effect: () => void) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    effect();
  }, [effect]);
}

// ---------------------------------------------------------------------------
// Backwards-compatible typed <Link> wrappers.
//
// These keep the legacy event names that older PostHog insights depend on.
// They are intentionally thin: new canonical CTAs should call
// `trackMarketingCtaClicked` directly from an onClick, which the instrumented
// components below already do. Nothing new should use these.
// ---------------------------------------------------------------------------

type AnalyticsLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    location: string;
  };

export function StartPublishingLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("start_publishing_clicked", { location, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function SignInLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("sign_in_clicked", { location, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function ExploreLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("explore_clicked", { location, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function SetUpAgentLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("set_up_agent_clicked", { location, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function BookDemoLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("book_demo_clicked", { location, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function ReadDocsLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("read_docs_clicked", { location, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function NavLink({
  location,
  label,
  onClick,
  ...props
}: AnalyticsLinkProps & { label: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("nav_link_clicked", { location, label, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function FooterAnalyticsLink({
  location,
  label,
  onClick,
  ...props
}: AnalyticsLinkProps & { label: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture("footer_link_clicked", { location, label, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}

export function MarketingCtaLink({
  eventName,
  location,
  onClick,
  ...props
}: AnalyticsLinkProps & { eventName: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    posthog.capture(eventName, { location, current_url: currentPathname() });
    onClick?.(event);
  };
  return <Link {...props} onClick={handleClick} />;
}