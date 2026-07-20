"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { APP_URL, AnalyticsPageView, PageEngagementTracker } from "./_components/analytics-links";
import { trackMarketingCtaClicked } from "./_components/analytics/events";
import { LandingReveal } from "./_components/marketing/motion";
import { SiteFooter } from "./_components/marketing/site-footer";
import { SiteHeader } from "./_components/site-header";
import { LandingAgentsSection } from "./_components/marketing/landing-agents-section";
import { DashboardAppPreview } from "./_components/marketing/dashboard-app-preview";
import { LiveReadingAppPreview } from "./_components/marketing/live-reading-app-preview";
import { RubiconAgentChat } from "./_components/marketing/agent-chat/agent-chat";
function Hero() {
  return (
    <div className="landing-hero-content">
      <div className="container">
        <LandingReveal className="landing-copy-stack landing-hero-copy">
          <h1 className="landing-hero-title">
            <span className="landing-hero-title-emphasis">Sell your writing to AI</span>
            <br />
            <span className="landing-hero-title-muted">
              Agents pay for words read. You set the price, you stay in control.
            </span>
          </h1>
          <div className="landing-hero-cta">
            <div className="landing-hero-actions">
              <Link
                href={APP_URL}
                className="button button-primary"
                onClick={() =>
                  trackMarketingCtaClicked({
                    cta_id: "home_hero_start_publishing",
                    label: "Start publishing",
                    page: "home",
                    section: "hero",
                    audience: "creator",
                    intent: "publish",
                    position: "hero",
                    target_type: "app",
                    target_url: APP_URL,
                  })
                }
              >
                Start publishing <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                href="/developers"
                className="button button-secondary"
                onClick={() =>
                  trackMarketingCtaClicked({
                    cta_id: "home_hero_set_up_agent",
                    label: "Set up an agent",
                    page: "home",
                    section: "hero",
                    audience: "developer",
                    intent: "setup_agent",
                    position: "hero",
                    target_type: "internal_page",
                    target_url: "/developers",
                  })
                }
              >
                Set up an agent
              </Link>
            </div>
          </div>
        </LandingReveal>
      </div>
    </div>
  );
}

function DashboardShowcase() {
  return (
    <section
      className="landing-section-block landing-dashboard-showcase"
      aria-label="Creator dashboard preview"
      data-analytics-section="creator_dashboard_preview"
    >
      <LandingReveal className="container landing-dashboard-showcase-inner">
        <div className="landing-dashboard-showcase-column">
          <DashboardAppPreview />
        </div>
      </LandingReveal>
    </section>
  );
}

function ProductSection() {
  return (
    <section
      className="landing-section-block landing-product-section"
      aria-labelledby="product-heading"
      data-analytics-section="paid_reading_product"
    >
      <LandingReveal className="container landing-product-showcase-inner">
        <div className="landing-copy-stack landing-product-showcase-header">
          <div className="landing-section-kicker">
            <h2 id="product-heading" className="landing-section-title">
              <span className="landing-section-title-emphasis">How agents pay creators, word by word.</span>
              <br />
              <span className="landing-section-title-muted">
                Agents read only the sections they need and pay per word. Creators earn for exactly what&apos;s read.
              </span>
            </h2>
          </div>
          <ul className="landing-product-points">
            <li>
              <Check size={14} className="text-[var(--muted)]" aria-hidden="true" />
              Per-word pricing: no subscriptions, no paywalls
            </li>
            <li>
              <Check size={14} className="text-[var(--muted)]" aria-hidden="true" />
              You set your price and keep 100% — 0% platform fee
            </li>
            <li>
              <Check size={14} className="text-[var(--muted)]" aria-hidden="true" />
              Unpaid words stay locked until they&apos;re paid for
            </li>
          </ul>
        </div>

        <div className="landing-product-showcase-column">
          <LiveReadingAppPreview />
        </div>
      </LandingReveal>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <div className="landing-page">
        <SiteHeader variant="home" />
        <AnalyticsPageView page="home" audience="mixed" />
        <PageEngagementTracker page="home" />
        <div className="landing-hero-stage">
          <section className="landing-hero" data-analytics-section="hero">
            <Hero />
          </section>
        </div>
        <DashboardShowcase />
        <LandingAgentsSection />
        <ProductSection />
        <RubiconAgentChat />
      </div>
      <SiteFooter />
    </>
  );
}
