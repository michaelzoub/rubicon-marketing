"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { trackClick } from "../analytics-links";
import { trackMarketingCtaClicked } from "../analytics/events";
import { LandingAgentsOnboarding } from "./landing-agents-onboarding";
import { fade } from "./motion";

export function LandingAgentsSection({
  showCta = true,
  isPageLead = false,
}: {
  showCta?: boolean;
  isPageLead?: boolean;
}) {
  return (
    <section
      className={`landing-section-block landing-agents-section${isPageLead ? " landing-agents-section--page-lead" : ""}`}
      aria-labelledby="landing-agents-heading"
      data-analytics-section="agents_setup"
    >
      <motion.div {...fade} className="container landing-agents-inner">
        <div className="landing-copy-stack landing-agents-header">
          <div className="landing-section-kicker">
            {isPageLead ? (
              <h1 id="landing-agents-heading" className="landing-section-title">
                <span className="landing-section-title-emphasis">
                  <Link
                    href="/developers"
                    className="landing-section-title-link"
                    onClick={() => trackClick("nav_link_clicked", { label: "Add paid reading to your agent" })}
                  >
                    Add paid reading to your agent.
                  </Link>
                </span>
                <br />
                <span className="landing-section-title-muted">
                  Watch how buyer agents discover content, hit paywalls, and pay per word — then copy one prompt to
                  try it in Codex or your own agent.
                </span>
              </h1>
            ) : (
              <h2 id="landing-agents-heading" className="landing-section-title">
                <span className="landing-section-title-emphasis">
                  <Link
                    href="/developers"
                    className="landing-section-title-link"
                    onClick={() => trackClick("nav_link_clicked", { label: "Add paid reading to your agent" })}
                  >
                    Add paid reading to your agent.
                  </Link>
                </span>
                <br />
                <span className="landing-section-title-muted">
                  Watch how buyer agents discover content, hit paywalls, and pay per word — then copy one prompt to
                  try it in Codex or your own agent.
                </span>
              </h2>
            )}
          </div>
          {showCta && (
            <div className="landing-agents-actions">
              <Link
                href="/developers"
                className="button button-primary"
                onClick={() =>
                  trackMarketingCtaClicked({
                    cta_id: "home_agents_set_up_agent",
                    label: "Set up an agent",
                    page: "home",
                    section: "agents_setup",
                    audience: "developer",
                    intent: "setup_agent",
                    position: "section",
                    target_type: "internal_page",
                    target_url: "/developers",
                  })
                }
              >
                Set up an agent <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        <LandingAgentsOnboarding />
      </motion.div>
    </section>
  );
}
