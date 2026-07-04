"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { APP_URL } from "../analytics-links";
import { trackMarketingCtaClicked } from "../analytics/events";
import { CreatorsPublishDemoPreview } from "./creators-publish-demo-preview";
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
      data-analytics-section="creator_how_it_works"
      data-analytics-section-index="4"
    >
      <motion.div {...fade} className="container">
        <div className="landing-copy-stack creators-how-header">
          <div className="landing-section-kicker">
            <h2 id="creators-how-heading" className="landing-section-title">
              <span className="landing-section-title-emphasis">From publish to paid, one word at a time.</span>
              <br />
              <span className="landing-section-title-muted">
                List your work, set your per-word price, and start earning when agents read.
              </span>
            </h2>
          </div>
        </div>

        <div className="creators-how-layout">
          <div className="creators-how-video">
            <CreatorsPublishDemoPreview />
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
              href={APP_URL}
              className="button button-primary creators-how-cta-button"
              onClick={() =>
                trackMarketingCtaClicked({
                  cta_id: "creators_how_start_publishing",
                  label: "Start publishing",
                  page: "creators",
                  section: "creator_how_it_works",
                  audience: "creator",
                  intent: "publish",
                  position: "bottom",
                  target_type: "app",
                  target_url: APP_URL,
                })
              }
            >
              Start publishing <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
