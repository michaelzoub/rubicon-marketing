"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fade } from "./motion";
import { trackWriterFunnel } from "../analytics/events";

const CALENDLY_URL = "https://calendly.com/michaezl/new-meeting";

/**
 * Low-friction concierge offer, right under the writer hero: instead of asking
 * a skeptical writer to run the import themselves, we offer to do the first
 * article for them.
 */
export function CreatorsConcierge() {
  return (
    <section
      className="landing-section-block creators-concierge"
      aria-labelledby="creators-concierge-heading"
      data-analytics-section="creator_concierge"
      data-analytics-section-index="1"
    >
      <motion.div {...fade} className="container">
        <div className="landing-copy-stack">
          <div className="landing-section-kicker">
            <h2 id="creators-concierge-heading" className="landing-section-title">
              <span className="landing-section-title-emphasis">Want us to set up your first article?</span>
              <br />
              <span className="landing-section-title-muted">
                Send us one post and we’ll import it, suggest pricing, and show you the agent-read preview.
              </span>
            </h2>
          </div>
          <div>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              onClick={() =>
                trackWriterFunnel("writer_concierge_setup_clicked", {
                  cta_id: "writer_concierge_setup",
                  label: "Set up my first article",
                  page: "creators",
                  section: "creator_concierge",
                  intent: "concierge_setup",
                })
              }
            >
              Set up my first article <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
