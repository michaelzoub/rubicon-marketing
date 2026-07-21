"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AgentSkillSetup } from "./agent-skill-setup";
import { DevelopersTestnetFaucet } from "./developers-testnet-faucet";
import { cardGridProps, cardItem, fade } from "./motion";

const AGENT_STEPS = [
  {
    label: "01 · Connect",
    title: "Start from chat",
    copy: "Copy the prompt into Codex or another agent. Rubicon becomes part of the agent’s existing research workflow.",
  },
  {
    label: "02 · Control",
    title: "Set a spending cap",
    copy: "Choose the buyer wallet and maximum spend before the agent approves any passage.",
  },
  {
    label: "03 · Use",
    title: "Return the evidence",
    copy: "The selected passage is unlocked and returned to the agent for its grounded final answer.",
  },
] as const;

export function AgentsPaidReadingSection({ headingLevel = "h1" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return (
    <section
      className="landing-section-block developers-agents-section"
      aria-labelledby="developers-agents-heading"
      data-analytics-section="agents_paid_reading"
      data-analytics-section-index="0"
    >
      <motion.div {...fade} className="container">
        <div className="landing-copy-stack developers-agents-header">
          <div className="landing-section-kicker">
            <Heading id="developers-agents-heading" className="landing-section-title">
              <span className="landing-section-title-emphasis">Add paid reading to your agent.</span>
              <br />
              <span className="landing-section-title-muted">
                Use Rubicon from the agent you already work with. It can discover sources, select a relevant passage
                through the gateway, and approve only the evidence that fits your cap.
              </span>
            </Heading>
          </div>
        </div>

        <div className="developers-agents-onboarding-panel">
          <div className="developers-agents-onboarding-grid">
            <AgentSkillSetup className="developers-agents-onboarding-card" />
            <DevelopersTestnetFaucet />
          </div>
        </div>

        <motion.div {...cardGridProps} className="developers-agents-grid">
          {AGENT_STEPS.map((card) => (
            <motion.div key={card.title} variants={cardItem} className="developers-agent-card">
              <span className="developers-agent-card-label mono">{card.label}</span>
              <h2 className="developers-agent-card-title">{card.title}</h2>
              <p className="developers-agent-card-copy">{card.copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
