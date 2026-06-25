"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { fade } from "./motion";

export function CreatorsHero() {
  return (
    <section className="creators-hero" aria-label="Quote from Jack Conte, Patreon CEO">
      <div className="landing-hero-bg" aria-hidden="true">
        <img
          src="/roman-senate-blue-transparent.png"
          alt=""
          className="landing-hero-image"
          decoding="async"
          fetchPriority="high"
        />
        <div className="landing-hero-overlay" />
        <div className="landing-hero-scrim" />
      </div>
      <div className="creators-hero-content">
        <div className="container">
          <motion.div {...fade} className="creators-hero-inner">
            <blockquote className="creators-hero-quote">
              <p className="creators-hero-quote-text">
                &ldquo;I&apos;m angry that we aren&apos;t being paid for the value that we created for these models.
                Creators deserve consent, <strong>credit</strong> and <strong>compensation</strong>.&rdquo;
              </p>
              <footer className="creators-hero-quote-attribution">&mdash; Jack Conte, Patreon CEO</footer>
            </blockquote>
            <div className="creators-hero-cta">
              <Link href="/dashboard" className="button button-primary">
                Start publishing <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
