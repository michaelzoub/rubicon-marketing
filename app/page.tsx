"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { APP_URL, AnalyticsPageView, PageEngagementTracker } from "./_components/analytics-links";
import { trackMarketingCtaClicked } from "./_components/analytics/events";
import { SiteFooter } from "./_components/marketing/site-footer";
import { SiteHeader } from "./_components/site-header";
import { AgentWorkflow } from "./_components/marketing/agent-workflow";
import { AgentUseCases } from "./_components/marketing/agent-use-cases";
import { EvidenceReadSimulation } from "./_components/marketing/evidence-read-simulation";
import { LazyDashboardShowcase } from "./_components/marketing/lazy-dashboard-showcase";
// import { RubiconAgentChat } from "./_components/marketing/agent-chat/agent-chat";
import { gsap } from "./_components/marketing/motion";

function Hero() {
  return (
    <div className="landing-hero-content">
      <div className="container landing-hero-layout">
        <div className="landing-copy-stack landing-hero-copy">
          <h1 className="landing-hero-title" data-hero-headline>
            <span className="landing-hero-title-emphasis">Give agents better material to reason from.</span>
          </h1>
          <p className="landing-hero-lead" data-hero-lead>
            Rubicon helps agents discover high-quality tech, finance, and economic writing, identify the passage
            relevant to their task, and pay only to unlock that evidence.
          </p>
          <div className="landing-hero-cta" data-hero-actions>
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
        <div className="landing-hero-preview" data-hero-preview>
          <EvidenceReadSimulation />
        </div>
      </div>
    </div>
  );
}

const HERO_MOTION_COMPLETE = "landing-hero-motion-complete";
const HERO_MOTION_RUNNING = "landing-hero-motion-running";

// Once per full document load. Survives client-side route navigation, so
// returning to the homepage shows the hero statically instead of replaying.
let heroIntroDone = false;

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  // When returning to the homepage via client-side navigation, set the
  // motion-complete class synchronously before paint so the CSS visibility
  // rule never hides the hero content.
  if (heroIntroDone && typeof document !== "undefined") {
    document.documentElement.classList.add(HERO_MOTION_COMPLETE);
    document.documentElement.classList.remove(HERO_MOTION_RUNNING);
  }

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;

    const showStatic = () => {
      html.classList.add(HERO_MOTION_COMPLETE);
      html.classList.remove(HERO_MOTION_RUNNING);
    };

    if (heroIntroDone) {
      showStatic();
      return;
    }

    const headline = root.querySelector<HTMLElement>("[data-hero-headline]");
    const lead = root.querySelector<HTMLElement>("[data-hero-lead]");
    const actions = root.querySelector<HTMLElement>("[data-hero-actions]");
    const preview = root.querySelector<HTMLElement>("[data-hero-preview]");

    if (!headline || !lead || !actions || !preview) {
      heroIntroDone = true;
      showStatic();
      return;
    }

    html.classList.remove(HERO_MOTION_COMPLETE, HERO_MOTION_RUNNING);

    const media = gsap.matchMedia();
    let cancelled = false;
    media.add(
      {
        allowMotion: "(prefers-reduced-motion: no-preference)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions as {
          allowMotion: boolean;
          reduceMotion: boolean;
        };

        if (reduceMotion || heroIntroDone) {
          gsap.set([headline, lead, actions, preview], { clearProps: "all" });
          heroIntroDone = true;
          showStatic();
          return;
        }

        if (cancelled || heroIntroDone) return;

        const animatedTargets = [headline, lead, actions, preview];
        const timeline = gsap.timeline({
          defaults: { ease: "power4.out" },
          onComplete: () => {
            heroIntroDone = true;
            showStatic();
            gsap.set(animatedTargets, {
              clearProps: "willChange,transform,opacity,visibility,filter,clipPath",
            });
          },
        });

        gsap.set(animatedTargets, { willChange: "transform,opacity,filter" });

        timeline
          .fromTo(
            headline,
            { autoAlpha: 0, y: 28, filter: "blur(10px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.9 },
            0.08,
          )
          .fromTo(
            lead,
            { autoAlpha: 0, y: 18, filter: "blur(6px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7 },
            0.48,
          )
          .fromTo(
            actions,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.62 },
            0.68,
          )
          .fromTo(
            preview,
            { autoAlpha: 0, y: 30, scale: 0.975, filter: "blur(8px)" },
            { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.05 },
            0.28,
          );

        html.classList.add(HERO_MOTION_RUNNING);
      },
    );

    return () => {
      cancelled = true;
      media.revert();
      showStatic();
    };
  }, []);

  return (
    <>
      <div ref={rootRef} className="landing-page">
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
        {/* <RubiconAgentChat /> */}
      </div>
      <SiteFooter />
    </>
  );
}
