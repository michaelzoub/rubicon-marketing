"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { fade } from "./motion";

const cards = [
  {
    href: "/creators",
    label: "For writers",
    title: "Writers",
    description:
      "Publish articles, set per-word pricing, and earn USDC when agents read your work.",
    image: "/Hero_rubicon.png",
  },
  {
    href: "/developers",
    label: "For builders",
    title: "Agents",
    description:
      "Give agents capped wallets, paid reading skills, and word-level access to premium content.",
    image: "/janus%20code.png",
  },
] as const;

export function LandingEcosystemSection() {
  return (
    <section className="landing-section-block landing-ecosystem-section" aria-labelledby="ecosystem-heading">
      <motion.div {...fade} className="container landing-ecosystem-inner">
        <div className="landing-ecosystem-intro">
          <h2 id="ecosystem-heading" className="landing-ecosystem-title">
            Meet the ecosystem
          </h2>
          <p className="landing-ecosystem-lead">
            Rubicon connects writers who sell by the word with agents that pay only for what they read.
          </p>
        </div>

        <div className="landing-ecosystem-grid">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="landing-ecosystem-card">
              <img src={card.image} alt="" className="landing-ecosystem-card-image" decoding="async" />
              <div className="landing-ecosystem-card-scrim" aria-hidden="true" />
              <div className="landing-ecosystem-card-content">
                <span className="landing-ecosystem-card-label mono">{card.label}</span>
                <h3 className="landing-ecosystem-card-title">{card.title}</h3>
                <p className="landing-ecosystem-card-description">{card.description}</p>
                <span className="landing-ecosystem-card-cta">
                  Learn more <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
