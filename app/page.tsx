"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { fade } from "./_components/marketing/motion";
import { SiteFooter } from "./_components/marketing/site-footer";
import { SiteHeader } from "./_components/site-header";
import { LandingAgentsSection } from "./_components/marketing/landing-agents-section";
import { StreamTheater } from "./_components/stream-theater";

function Hero() {
  return (
    <div className="landing-hero-content">
      <div className="container">
        <motion.div {...fade} className="landing-copy-stack landing-hero-copy">
          <h1 className="landing-hero-title">Earn when AI agents read your writing.</h1>
          <p className="landing-hero-lead">
            Let agents preview an article outline, pay for only the section they need, and access paid words without
            seeing the full piece.
          </p>
          <div className="landing-hero-cta">
            <div className="landing-hero-actions">
              <Link href="/dashboard" className="button button-primary">
                List one article <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/developers" className="button button-secondary">
                Preview as an agent
              </Link>
            </div>
            <div className="landing-hero-benefits mono text-xs text-[var(--muted)]">
              Private by default · Full article stays protected · 0% platform fee
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DashboardShowcase() {
  return (
    <section
      className="landing-section-block landing-dashboard-showcase"
      aria-labelledby="dashboard-showcase-heading"
    >
      <div className="landing-dashboard-showcase-bg" aria-hidden="true">
        <img
          src="/roman-senate-blue-transparent.png"
          alt=""
          className="landing-dashboard-showcase-bg-image"
          decoding="async"
        />
        <div className="landing-dashboard-showcase-overlay" />
        <div className="landing-dashboard-showcase-scrim" />
      </div>
      <motion.div {...fade} className="container landing-dashboard-showcase-inner">
        <div className="landing-copy-stack landing-dashboard-showcase-header">
          <div className="landing-section-kicker">
            <p className="landing-section-eyebrow">Writer dashboard</p>
            <h2 id="dashboard-showcase-heading" className="landing-section-title">
              The dashboard writers get.
            </h2>
          </div>
          <p className="landing-section-lead landing-dashboard-showcase-lead">
            Publish once, then watch words read, agent traffic, and USDC payouts update in the dashboard you actually
            ship with.
          </p>
          <div className="landing-dashboard-showcase-actions">
            <Link href="/dashboard" className="button button-primary landing-dashboard-cta">
              List one article <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="landing-dashboard-showcase-column">
          <div className="landing-dashboard-showcase-panel">
            <div className="landing-dashboard-showcase-visual hero-visual">
              <div className="landing-dashboard-frame">
                <img
                  src="/creator-dashboard.png"
                  alt="Rubicon writer dashboard showing total earnings, words read, agent reads, recent activity, and wallet payouts"
                  className="landing-dashboard-image"
                  decoding="async"
                />
              </div>
            </div>
          </div>
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
            <p className="landing-section-eyebrow">Our product</p>
            <h2 id="product-heading" className="landing-section-title">
              How agents pay writers, word by word.
            </h2>
          </div>
          <p className="landing-section-lead landing-product-showcase-lead">
            Agents read only the sections they need and pay per word. Writers earn for exactly what&apos;s read.
          </p>
          <ul className="landing-product-points">
            <li>
              <Check size={14} className="text-[var(--river)]" aria-hidden="true" />
              Per-word pricing — no subscriptions, no paywalls
            </li>
            <li>
              <Check size={14} className="text-[var(--river)]" aria-hidden="true" />
              Writers earn for every word read
            </li>
            <li>
              <Check size={14} className="text-[var(--river)]" aria-hidden="true" />
              Agents pay only for what they use
            </li>
          </ul>
        </div>

        <div className="landing-product-showcase-column">
          <div className="landing-product-showcase-visual hero-visual">
            <div className="landing-product-frame">
              <StreamTheater embedded />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <div className="landing-page">
        <SiteHeader variant="home" overlay />
        <section className="landing-hero">
          <div className="landing-hero-bg" aria-hidden="true">
            <img
              src="/rubicon-crossing-transparent.png"
              alt=""
              className="landing-hero-image"
              decoding="async"
              fetchPriority="high"
            />
            <div className="landing-hero-overlay" />
            <div className="landing-hero-scrim" />
          </div>
          <Hero />
        </section>
        <DashboardShowcase />
        <LandingAgentsSection />
        <ProductSection />
      </div>
      <SiteFooter />
    </>
  );
}
