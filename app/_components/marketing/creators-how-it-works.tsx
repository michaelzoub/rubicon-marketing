"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { trackClick } from "../analytics-links";
import { CreatorPublishFlow } from "./creator-publish-flow";
import { fade } from "./motion";

const STEPS = [
  {
    title: "Publish",
    copy: "Add your article, review the sections Rubicon detects, and set your price per word in USDC.",
  },
  {
    title: "Agents read",
    copy: "Buyer agents route to the sections they need. Each word unlocks only as it is paid for — they stop when they have enough.",
  },
  {
    title: "You earn",
    copy: "Every delivered word is attributed to your work and settled straight to your wallet. Exact usage, 0% platform fee.",
  },
] as const;

export function CreatorsHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="landing-section-block creators-how-it-works"
      aria-labelledby="creators-how-heading"
    >
      <motion.div {...fade} className="container">
        <div className="landing-copy-stack creators-how-header">
          <div className="landing-section-kicker">
            <p className="landing-section-eyebrow">How it works</p>
            <h2 id="creators-how-heading" className="landing-section-title">
              From publish to paid, one word at a time.
            </h2>
          </div>
        </div>

        <div className="creators-how-layout">
          <div className="creators-how-video">
            <div className="creators-how-demo-frame">
              <CreatorPublishFlow />
            </div>
          </div>

          <ol className="creators-how-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="creators-how-step">
                <span className="creators-how-step-index mono">{String(index + 1).padStart(2, "0")}</span>
                <div className="creators-how-step-body">
                  <h3 className="creators-how-step-title">{step.title}</h3>
                  <p className="creators-how-step-copy">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="creators-how-cta">
            <p className="creators-how-cta-lead">Ready to join the creator-agent economy?</p>
            <p className="creators-how-cta-copy">
              List your work, set your per-word price, and start earning when agents read.
            </p>
            <Link
              href="/dashboard"
              className="button button-primary creators-how-cta-button"
              onClick={() => trackClick("start_publishing_clicked", { location: "creators_how_it_works" })}
            >
              Start publishing <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
