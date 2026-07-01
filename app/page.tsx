"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { trackClick, APP_URL } from "./_components/analytics-links";
import { fade } from "./_components/marketing/motion";
import { SiteFooter } from "./_components/marketing/site-footer";
import { SiteHeader } from "./_components/site-header";
import { LandingAgentsSection } from "./_components/marketing/landing-agents-section";
import { DashboardAppPreview } from "./_components/marketing/dashboard-app-preview";
import { LiveReadingAppPreview } from "./_components/marketing/live-reading-app-preview";

function Hero() {
  return (
    <div className="landing-hero-content">
      <div className="container">
        <motion.div {...fade} className="landing-copy-stack landing-hero-copy">
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
                onClick={() => trackClick("start_publishing_clicked", { location: "hero" })}
              >
                Start publishing <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                href="/developers"
                className="button button-secondary"
                onClick={() => trackClick("set_up_agent_clicked", { location: "hero" })}
              >
                Set up an agent
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DashboardShowcase() {
  return (
    <section className="landing-section-block landing-dashboard-showcase" aria-label="Creator dashboard preview">
      <motion.div {...fade} className="container landing-dashboard-showcase-inner">
        <div className="landing-dashboard-showcase-column">
          <DashboardAppPreview />
        </div>
      </motion.div>
    </section>
  );
}

function ProductSection() {
  return (
    <section className="landing-section-block landing-product-section" aria-labelledby="product-heading">
      <motion.div {...fade} className="container landing-product-showcase-inner">
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
              Per-word pricing — no subscriptions, no paywalls
            </li>
            <li>
              <Check size={14} className="text-[var(--muted)]" aria-hidden="true" />
              Creators earn for every word read
            </li>
            <li>
              <Check size={14} className="text-[var(--muted)]" aria-hidden="true" />
              Agents pay only for what they use
            </li>
          </ul>
        </div>

        <div className="landing-product-showcase-column">
          <LiveReadingAppPreview />
        </div>
      </motion.div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <div className="landing-page">
        <SiteHeader variant="home" />
        <div className="landing-hero-stage">
          <section className="landing-hero">
            <Hero />
          </section>
        </div>
        <DashboardShowcase />
        <LandingAgentsSection />
        <ProductSection />
      </div>
      <SiteFooter />
    </>
  );
}
