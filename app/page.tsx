"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { APP_URL, AnalyticsPageView, PageEngagementTracker } from "./_components/analytics-links";
import { trackMarketingCtaClicked } from "./_components/analytics/events";
import { SiteFooter } from "./_components/marketing/site-footer";
import { SiteHeader } from "./_components/site-header";
import { AgentComparison, AgentWorkflow } from "./_components/marketing/agent-workflow";
import { AgentUseCases } from "./_components/marketing/agent-use-cases";
import { EvidenceReadSimulation } from "./_components/marketing/evidence-read-simulation";
import { LazyDashboardShowcase } from "./_components/marketing/lazy-dashboard-showcase";
import { RubiconAgentChat } from "./_components/marketing/agent-chat/agent-chat";
function Hero() {
  return (
    <div className="landing-hero-content">
      <div className="container landing-hero-layout">
        <div className="landing-copy-stack landing-hero-copy">
          <h1 className="landing-hero-title">
            <span className="landing-hero-title-emphasis">Give agents better material to reason from.</span>
          </h1>
          <p className="landing-hero-lead">
            Rubicon helps agents discover high-quality human writing, identify the passage relevant to their task, and
            pay only to unlock that evidence.
          </p>
          <div className="landing-hero-cta">
            <div className="landing-hero-actions">
              <Link
                href="#agent-workflow"
                className="button button-primary"
                onClick={() =>
                  trackMarketingCtaClicked({
                    cta_id: "home_hero_see_how_it_works",
                    label: "See how it works",
                    page: "home",
                    section: "hero",
                    audience: "mixed",
                    intent: "explore",
                    position: "hero",
                    target_type: "internal_page",
                    target_url: "#agent-workflow",
                  })
                }
              >
                See how it works <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                href={APP_URL}
                className="button button-secondary"
                onClick={() =>
                  trackMarketingCtaClicked({
                    cta_id: "home_hero_list_writing",
                    label: "List your writing",
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
                List your writing
              </Link>
            </div>
          </div>
        </div>
        <div className="landing-hero-preview">
          <EvidenceReadSimulation />
        </div>
      </div>
    </div>
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
        <AgentWorkflow />
        <LazyDashboardShowcase />
        <AgentUseCases />
        <AgentComparison />
        <RubiconAgentChat />
      </div>
      <SiteFooter />
    </>
  );
}
