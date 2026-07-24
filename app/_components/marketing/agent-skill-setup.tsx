"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { trackClick } from "../analytics-links";
import { trackCopyActionCompleted } from "../analytics/events";
import { SuccessCelebration } from "./success-celebration";

const skillUrl = "https://www.rubiconpay.xyz/skill.md";
export const setupSkillPrompt = `Set up the Rubicon skill from ${skillUrl}. Help me fund my buyer wallet, then answer this question using paid evidence: What are the biggest limitations to reaching AGI? Spend no more than $0.01.`;

export function AgentSkillSetup({
  className,
  layout = "default",
}: {
  className?: string;
  layout?: "default" | "landing";
}) {
  const [copied, setCopied] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const copySetupPrompt = async () => {
    await navigator.clipboard.writeText(setupSkillPrompt);
    setCopied(true);
    setCelebrationKey((key) => key + 1);
    // Canonical copy event with stable cta_id.
    trackCopyActionCompleted({
      cta_id: "developers_copy_skill_prompt",
      label: "Copy prompt",
      page: "developers",
      section: "agent_skill_setup",
      audience: "developer",
      intent: "copy_prompt",
    });
    // Legacy alias kept so existing PostHog insights keep working.
    trackClick("copy_agent_prompt_clicked", { layout });
    window.setTimeout(() => setCopied(false), 1400);
  };

  const isLanding = layout === "landing";

  return (
    <div
      className={`developers-skill-panel${isLanding ? " developers-skill-panel--landing" : ""}${className ? ` ${className}` : ""}`}
      data-analytics-section="agent_skill_setup"
      data-analytics-section-index="1"
    >
      <div className={`developers-skill-panel-header${isLanding ? " developers-skill-panel-header--landing" : ""}`}>
        <div className="developers-skill-panel-intro">
          <div className="developers-skill-panel-title">
            <Link2 size={17} className="text-[var(--river)]" aria-hidden="true" /> Add Rubicon to your agent
          </div>
          <p className="developers-skill-panel-copy">
            Paste this into Codex or another agent. It installs the Rubicon skill, funds a buyer wallet, and runs a
            capped research read.
          </p>
          {isLanding && (
            <div className="relative w-fit"><button
              type="button"
              onClick={copySetupPrompt}
              className="button button-secondary min-h-10 w-fit text-sm"
            >
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{" "}
              {copied ? "Copied" : "Copy prompt"}
            </button><SuccessCelebration active={copied} celebrationKey={celebrationKey} /></div>
          )}
        </div>
        {!isLanding && (
          <div className="relative shrink-0"><button type="button" onClick={copySetupPrompt} className="button button-secondary min-h-10 text-sm">
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{" "}
            {copied ? "Copied" : "Copy prompt"}
          </button><SuccessCelebration active={copied} celebrationKey={celebrationKey} /></div>
        )}
      </div>
      <code className="developers-skill-prompt mono">{setupSkillPrompt}</code>
    </div>
  );
}
