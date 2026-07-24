"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { APP_URL, AnalyticsPageView, PageEngagementTracker } from "./_components/analytics-links";
import { trackMarketingCtaClicked } from "./_components/analytics/events";
import { SiteFooter } from "./_components/marketing/site-footer";
import { SiteHeader } from "./_components/site-header";
import { AgentComparison, AgentWorkflow } from "./_components/marketing/agent-workflow";
import { AgentUseCases } from "./_components/marketing/agent-use-cases";
import { EvidenceReadSimulation } from "./_components/marketing/evidence-read-simulation";
import { LazyDashboardShowcase } from "./_components/marketing/lazy-dashboard-showcase";
// import { RubiconAgentChat } from "./_components/marketing/agent-chat/agent-chat";
import { gsap, SplitText } from "./_components/marketing/motion";

function Hero() {
  return (
    <div className="landing-hero-content">
      <div className="container landing-hero-layout">
        <div className="landing-copy-stack landing-hero-copy">
          <h1 className="landing-hero-title" data-hero-headline>
            <span className="landing-hero-title-emphasis">Give agents better material to reason from.</span>
          </h1>
          <p className="landing-hero-lead" data-hero-lead>
            Rubicon helps agents discover high-quality human writing, identify the passage relevant to their task, and
            pay only to unlock that evidence.
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
        <div className="landing-hero-preview">
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

    if (!headline || !lead || !actions) {
      heroIntroDone = true;
      showStatic();
      return;
    }

    html.classList.remove(HERO_MOTION_COMPLETE, HERO_MOTION_RUNNING);

    const media = gsap.matchMedia();
    let cancelled = false;
    let elapsed = 0;
    let split: ReturnType<typeof SplitText.create> | null = null;

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
          gsap.set([headline, lead, actions], { clearProps: "all" });
          heroIntroDone = true;
          showStatic();
          return;
        }

        split = SplitText.create(headline, {
          type: "lines,chars",
          mask: "lines",
          autoSplit: true,
          linesClass: "landing-hero-title-line",
          onSplit(self) {
            if (cancelled || heroIntroDone) return;

            const animatedTargets = [headline, ...self.chars, lead, actions];
            const timeline = gsap.timeline({
              defaults: { ease: "power4.out" },
              onUpdate: () => {
                elapsed = timeline.totalTime();
              },
              onComplete: () => {
                heroIntroDone = true;
                showStatic();
                gsap.set(animatedTargets, {
                  clearProps: "willChange,transform,opacity,visibility",
                });
              },
            });

            gsap.set(animatedTargets, { willChange: "transform,opacity" });

            timeline
              .fromTo(
                self.chars,
                { yPercent: -105 },
                { yPercent: 0, duration: 0.55, stagger: 0.01 },
                0,
              )
              .fromTo(
                lead,
                { autoAlpha: 0, y: -10 },
                { autoAlpha: 1, y: 0, duration: 0.5 },
                0.22,
              )
              .fromTo(
                actions,
                { autoAlpha: 0, y: -10 },
                { autoAlpha: 1, y: 0, duration: 0.5 },
                0.34,
              );

            if (elapsed > 0) timeline.totalTime(elapsed);

            gsap.set(headline, { autoAlpha: 1 });
            html.classList.add(HERO_MOTION_RUNNING);

            return timeline;
          },
        });
      },
    );

    return () => {
      cancelled = true;
      split?.revert();
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
        <AgentComparison />
        {/* <RubiconAgentChat /> */}
      </div>
      <SiteFooter />
    </>
  );
}
