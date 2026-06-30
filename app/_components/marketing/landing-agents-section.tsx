"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { trackClick } from "../analytics-links";
import { AgentSkillSetup } from "./agent-skill-setup";
import { fade } from "./motion";

function AgentTerminalPlaceholder() {
  return (
    <div className="landing-agents-terminal" aria-hidden="true">
      <div className="landing-agents-terminal-bar">
        <span className="landing-agents-terminal-dot landing-agents-terminal-dot-r" />
        <span className="landing-agents-terminal-dot landing-agents-terminal-dot-y" />
        <span className="landing-agents-terminal-dot landing-agents-terminal-dot-g" />
        <span className="landing-agents-terminal-name mono">buyer-agent: fetch</span>
      </div>
      <div className="landing-agents-terminal-body mono">
        <div className="landing-agents-terminal-line">
          <span className="landing-agents-terminal-prompt">$</span>
          <span>
            <span className="landing-agents-terminal-fn">await fetch</span>
            (<span className="landing-agents-terminal-str">&quot;/articles/resale-fees&quot;</span>)
          </span>
        </div>
        <div className="landing-agents-terminal-line landing-agents-terminal-line-muted">
          <span>01</span>
          <span>GET</span>
          <span>/search?q=resale+fee</span>
          <span>200</span>
        </div>
        <div className="landing-agents-terminal-line landing-agents-terminal-line-warn">
          <span>02</span>
          <span>GET</span>
          <span>/articles/resale-fees</span>
          <span>402</span>
          <span>payment_required</span>
        </div>
        <div className="landing-agents-terminal-line landing-agents-terminal-line-error">
          <span>03</span>
          <span>POST</span>
          <span>/checkout</span>
          <span>401</span>
          <span>browser_session_required</span>
        </div>
        <div className="landing-agents-terminal-fail">
          <span>✗</span> fetch() can&apos;t complete an interactive subscription
        </div>
      </div>
    </div>
  );
}

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
    >
      <motion.div {...fade} className="container landing-agents-inner">
        <div className="landing-copy-stack landing-agents-header">
          <div className="landing-section-kicker">
            <p className="landing-section-eyebrow">For agents</p>
            {isPageLead ? (
              <h1 id="landing-agents-heading" className="landing-section-title landing-agents-title">
                <Link
                  href="/developers"
                  className="landing-section-title-link"
                  onClick={() => trackClick("nav_link_clicked", { label: "Add paid reading to your agent" })}
                >
                  Add paid reading to your agent.
                </Link>
              </h1>
            ) : (
              <h2 id="landing-agents-heading" className="landing-section-title landing-agents-title">
                <Link
                  href="/developers"
                  className="landing-section-title-link"
                  onClick={() => trackClick("nav_link_clicked", { label: "Add paid reading to your agent" })}
                >
                  Add paid reading to your agent.
                </Link>
              </h2>
            )}
          </div>
          <p className="landing-section-lead landing-agents-lead">
            Watch how buyer agents discover content, hit paywalls, and pay per word — then copy one prompt to try it in
            Codex or your own agent.
          </p>
          {showCta && (
            <div className="landing-agents-actions">
              <Link
                href="/developers"
                className="button button-primary"
                onClick={() => trackClick("set_up_agent_clicked", { location: "agents_section" })}
              >
                Set up an agent <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        <div className="landing-agents-row">
          <div className="landing-agents-demo">
            <AgentTerminalPlaceholder />
            <div className="landing-agents-demo-fade" aria-hidden="true" />
          </div>
          <AgentSkillSetup layout="landing" />
        </div>
      </motion.div>
    </section>
  );
}
