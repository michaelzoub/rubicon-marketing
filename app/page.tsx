"use client";

import "./landing-9fdd2b3.css";
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
          <h1 className="landing-hero-title">
            <span className="landing-hero-title-muted">Rubicon enables creators to</span>
            <br />
            <span className="landing-hero-title-emphasis">sell their writings</span>
            <span className="landing-hero-title-muted"> on a per word basis to AI agents.</span>
          </h1>
          <div className="landing-hero-cta">
            <div className="landing-hero-actions">
              <Link href="/dashboard" className="button button-primary">
                Start publishing <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link href="/developers" className="button button-secondary">
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
    <section
      className="landing-section-block landing-dashboard-showcase"
      aria-labelledby="dashboard-showcase-heading"
    >
      <motion.div {...fade} className="container landing-dashboard-showcase-inner">
        <div className="landing-dashboard-showcase-column">
          <div className="landing-dashboard-showcase-panel">
            <div className="landing-dashboard-showcase-visual hero-visual">
              <div className="landing-dashboard-texture-border">
                <div className="landing-dashboard-frame">
                  <img
                    src="/dashboard-preview.png"
                    alt="Rubicon creator dashboard showing earnings, agent reads, words read, and payout wallet"
                    className="landing-dashboard-image"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-copy-stack landing-dashboard-showcase-header">
          <div className="landing-section-kicker">
            <p className="landing-section-eyebrow">For writers</p>
            <h2 id="dashboard-showcase-heading" className="landing-section-title">
              <Link href="/creators" className="landing-section-title-link">
                The dashboard creators get.
              </Link>
            </h2>
          </div>
          <p className="landing-section-lead landing-dashboard-showcase-lead">
            Publish once, then watch words read, agent traffic, and USDC payouts update in the dashboard you actually
            ship with.
          </p>
          <div className="landing-dashboard-showcase-actions">
            <Link href="/dashboard" className="button button-primary landing-dashboard-cta">
              List an article <ArrowRight size={14} aria-hidden="true" />
            </Link>
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
              How agents pay creators, word by word.
            </h2>
          </div>
          <p className="landing-section-lead landing-product-showcase-lead">
            Agents read only the sections they need and pay per word. Creators earn for exactly what&apos;s read.
          </p>
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
          <div className="landing-product-showcase-visual hero-visual">
            <div className="landing-product-glow" aria-hidden="true" />
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
        <div className="landing-hero-stage">
          <div className="landing-hero-bg" aria-hidden="true">
            <video
              className="landing-hero-video"
              autoPlay
              muted
              loop
              playsInline
              poster="/HEROBG.png"
              preload="metadata"
            >
              <source src="/HEROBGVIDEO.mp4" type="video/mp4" />
            </video>
          </div>
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
