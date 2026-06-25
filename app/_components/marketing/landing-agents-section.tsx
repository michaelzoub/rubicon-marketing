"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BuyerAgentTerminal } from "../demo-video/agent-demo";
import { AgentSkillSetup } from "./agent-skill-setup";
import { fade } from "./motion";

export function LandingAgentsSection() {
  return (
    <section className="landing-section-block landing-agents-section" aria-labelledby="landing-agents-heading">
      <motion.div {...fade} className="container landing-agents-inner">
        <div className="landing-copy-stack landing-agents-header">
          <div className="landing-section-kicker">
            <p className="landing-section-eyebrow">For agents</p>
            <h2 id="landing-agents-heading" className="landing-section-title landing-agents-title">
              Add paid reading to your agent.
            </h2>
          </div>
          <p className="landing-section-lead landing-agents-lead">
            Watch how buyer agents discover content, hit paywalls, and pay per word — then copy one prompt to try it in
            Codex or your own agent.
          </p>
          <div className="landing-agents-actions">
            <Link href="/developers" className="button button-primary">
              Set up an agent <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="landing-agents-row">
          <div className="landing-agents-demo">
            <BuyerAgentTerminal loop />
          </div>
          <AgentSkillSetup layout="landing" />
        </div>
      </motion.div>
    </section>
  );
}
