"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { LandingReveal } from "./motion";

type DashboardPreviewComponent = ComponentType;

export function LazyDashboardShowcase() {
  const hostRef = useRef<HTMLElement>(null);
  const [DashboardPreview, setDashboardPreview] = useState<DashboardPreviewComponent | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || DashboardPreview) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void import("./dashboard-app-preview").then(({ DashboardAppPreview }) => {
          setDashboardPreview(() => DashboardAppPreview);
        });
      },
      { rootMargin: "360px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [DashboardPreview]);

  return (
    <section
      ref={hostRef}
      className="landing-section-block landing-dashboard-showcase"
      aria-labelledby="writer-dashboard-heading"
      data-analytics-section="creator_dashboard_preview"
    >
      <LandingReveal className="container landing-dashboard-showcase-inner">
        <div className="landing-copy-stack landing-dashboard-showcase-header">
          <p className="landing-section-eyebrow">For writers</p>
          <h2 id="writer-dashboard-heading" className="landing-section-title">
            <span className="landing-section-title-emphasis">Writers earn when agents use their work.</span>
            <br />
            <span className="landing-section-title-muted">
              List selected articles, choose a price, and track which sources agents access.
            </span>
          </h2>
        </div>
        <div className="landing-dashboard-showcase-column">
          {DashboardPreview ? <DashboardPreview /> : <div className="landing-dashboard-preview-placeholder" aria-hidden="true" />}
        </div>
      </LandingReveal>
    </section>
  );
}
