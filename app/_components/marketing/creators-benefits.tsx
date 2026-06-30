"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cardGridProps, cardItem, fade } from "./motion";

const BENEFITS = [
  {
    label: "Revenue",
    title: "Earn from agent traffic",
    copy: "Make premium research readable by AI systems without giving away the full article. Every read is a sale, settled in USDC.",
    footer: "0% platform fee",
  },
  {
    label: "Control",
    title: "Stay in control",
    copy: "You set the price, the availability, and exactly which sections agents are allowed to navigate.",
    footer: "Your terms, always",
  },
  {
    label: "Attribution",
    title: "Get paid for exact usage",
    copy: "Read 137 words, earn for 137 words. Never an arbitrary bundle or a full-article purchase.",
    footer: "Word-for-word attribution",
  },
] as const;

export function CreatorsBenefits() {
  return (
    <section className="landing-section-block creators-benefits" aria-labelledby="creators-benefits-heading">
      <motion.div {...fade} className="container">
        <div className="landing-copy-stack creators-benefits-header">
          <div className="landing-section-kicker">
            <h2 id="creators-benefits-heading" className="landing-section-title">
              <span className="landing-section-title-emphasis">How it benefits you</span>
              <br />
              <span className="landing-section-title-muted">
                Rubicon is built for creators who want agent revenue without giving up control of their work.
              </span>
            </h2>
          </div>
        </div>

        <motion.div {...cardGridProps} className="creators-benefits-grid">
          {BENEFITS.map((card) => (
            <motion.div key={card.title} variants={cardItem} className="creators-benefit-card">
              <span className="creators-benefit-label">{card.label}</span>
              <h3 className="creators-benefit-title">{card.title}</h3>
              <p className="creators-benefit-copy">{card.copy}</p>
              <div className="creators-benefit-footer mono">
                <Check size={13} className="text-[var(--river)]" aria-hidden="true" />
                {card.footer}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
