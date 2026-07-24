"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Copy, Link2, MousePointer2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trackClick } from "../analytics-links";
import { trackVisualOnce } from "../analytics/events";
import { setupSkillPrompt } from "./agent-skill-setup";
import { SuccessCelebration } from "./success-celebration";
import { motionEase } from "./motion";

/**
 * Once-only onboarding sequence for the landing "For agents" section:
 * a fake cursor copies the setup prompt from the panel on the right, pastes it
 * into the terminal on the left, then the agent analyzes the prompt, fetches
 * articles, and prints a summary with the cost receipt. Both cards sit on a
 * shared backdrop panel.
 */

const PHASES = [
  "idle",
  "move-copy",
  "click-copy",
  "move-terminal",
  "paste",
  "analyze",
  "fetch",
  "output",
] as const;

type Phase = (typeof PHASES)[number];

const PHASE_MS: Record<Phase, number> = {
  idle: 1300,
  "move-copy": 1100,
  "click-copy": 900,
  "move-terminal": 1100,
  paste: 1000,
  analyze: 1700,
  fetch: 3200,
  output: 6200,
};

const EASE = motionEase.out;

const FETCH_LINES = [
  { id: "01", method: "GET", path: "/search?q=available+articles", status: "200", note: "3 results", tone: "ok", delay: 0.1 },
  { id: "02", method: "GET", path: "/articles/resale-fees", status: "402", note: "payment_required", tone: "warn", delay: 0.85 },
  { id: "03", method: "POST", path: "/v1/sessions", status: "201", note: "cap $0.0100", tone: "ok", delay: 1.6 },
  { id: "04", method: "READ", path: "/articles/resale-fees §2", status: "200", note: "137 words", tone: "ok", delay: 2.35 },
] as const;

interface CursorPoint {
  x: number;
  y: number;
}

export function LandingAgentsOnboarding() {
  const reduce = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);
  const [cycle] = useState(0);
  const [cursor, setCursor] = useState<CursorPoint | null>(null);
  const [realCopied, setRealCopied] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const promptLineRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.24, margin: "0px 0px -8%" });

  // With reduced motion, skip the choreography and show the finished run.
  const stage = reduce ? PHASES.length - 1 : stageIndex;
  const phase = PHASES[stage];
  const atLeast = (p: Phase) => stage >= PHASES.indexOf(p);

  useEffect(() => {
    if (reduce || !inView || stageIndex >= PHASES.length - 1) return;
    const timeout = window.setTimeout(() => {
      setStageIndex((i) => Math.min(i + 1, PHASES.length - 1));
    }, PHASE_MS[PHASES[stageIndex]]);
    return () => window.clearTimeout(timeout);
  }, [stageIndex, reduce, inView]);

  // Fire one `marketing_visual_interacted` per session when this animation plays.
  useEffect(() => {
    trackVisualOnce({
      page: "home",
      section: "agents_setup",
      visual_id: "agent_onboarding_animation",
      interaction: "viewed",
    });
  }, []);

  // The fake cursor targets real element positions, measured per phase.
  useEffect(() => {
    if (reduce) return;
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const stageBox = stageEl.getBoundingClientRect();
    const pointAt = (el: HTMLElement | null, dx = 0, dy = 0): CursorPoint | null => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return {
        x: box.left - stageBox.left + box.width / 2 + dx,
        y: box.top - stageBox.top + box.height / 2 + dy,
      };
    };

    let next: CursorPoint | null = null;
    if (phase === "idle") next = pointAt(copyButtonRef.current, 140, 90);
    else if (phase === "move-copy" || phase === "click-copy") next = pointAt(copyButtonRef.current, 8, 5);
    else if (phase === "move-terminal" || phase === "paste") next = pointAt(promptLineRef.current, 46, 8);
    if (next) setCursor(next);
  }, [phase, cycle, reduce]);

  useEffect(() => {
    function scrollToBottom() {
      const el = terminalBodyRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }

    scrollToBottom();
    const body = terminalBodyRef.current;
    if (!body) return;

    const observer = new ResizeObserver(scrollToBottom);
    observer.observe(body);
    return () => observer.disconnect();
  }, [stage, cycle]);

  const isClicking = phase === "click-copy" || phase === "paste";
  const cursorVisible = !atLeast("analyze");
  const fakeCopied = phase === "click-copy" || phase === "move-terminal";
  const copied = fakeCopied || realCopied;

  const copySetupPrompt = async () => {
    await navigator.clipboard.writeText(setupSkillPrompt);
    setRealCopied(true);
    setCelebrationKey((key) => key + 1);
    trackClick("copy_agent_prompt_clicked", { layout: "landing" });
    window.setTimeout(() => setRealCopied(false), 1400);
  };

  return (
    <div ref={stageRef} className="agents-onboarding-stage">
      <div className="agents-onboarding-backdrop" aria-hidden="true" />

      <div className="landing-agents-row agents-onboarding-row">
        <div className="landing-agents-demo">
          <div className="landing-agents-terminal agents-onboarding-terminal" aria-hidden="true">
            <div className="landing-agents-terminal-bar">
              <span className="landing-agents-terminal-dot landing-agents-terminal-dot-r" />
              <span className="landing-agents-terminal-dot landing-agents-terminal-dot-y" />
              <span className="landing-agents-terminal-dot landing-agents-terminal-dot-g" />
              <span className="landing-agents-terminal-name mono">codex — rubicon onboarding</span>
            </div>

            <div
              key={cycle}
              ref={terminalBodyRef}
              className="landing-agents-terminal-body mono agents-onboarding-body"
            >
              <div ref={promptLineRef} className="agents-onboarding-cmd">
                <span className="landing-agents-terminal-prompt agents-onboarding-cmd-mark">$</span>
                <div className="agents-onboarding-cmd-text-wrap">
                  {atLeast("paste") ? (
                    <motion.div
                      className="agents-onboarding-cmd-text"
                      initial={reduce ? false : { opacity: 0, backgroundColor: "rgba(110,165,255,0.28)" }}
                      animate={{ opacity: 1, backgroundColor: "rgba(110,165,255,0)" }}
                      transition={{ opacity: { duration: 0.12 }, backgroundColor: { duration: 0.9, ease: EASE } }}
                    >
                      {setupSkillPrompt}
                    </motion.div>
                  ) : (
                    <span className="agents-onboarding-caret" />
                  )}
                </div>
              </div>

              <div className="agents-onboarding-log">
              {atLeast("analyze") && (
                <motion.div
                  className="agents-onboarding-line agents-onboarding-line-quiet"
                  initial={reduce ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
                >
                  <span className="agents-onboarding-spin">▸</span>
                  <span>
                    analyzing prompt · installing rubicon skill
                    {!atLeast("fetch") && <span className="agents-onboarding-dots" />}
                  </span>
                </motion.div>
              )}

              {atLeast("fetch") && (
                <>
                  <motion.div
                    className="agents-onboarding-line agents-onboarding-line-ok"
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <span>✓</span>
                    <span>skill installed · buyer wallet funded</span>
                  </motion.div>

                  {FETCH_LINES.map((line) => (
                    <motion.div
                      key={line.id}
                      className={`agents-onboarding-request agents-onboarding-request-${line.tone}`}
                      initial={reduce ? false : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, ease: EASE, delay: reduce ? 0 : line.delay }}
                    >
                      <span className="agents-onboarding-request-order">{line.id}</span>
                      <span className="agents-onboarding-request-method">{line.method}</span>
                      <span className="agents-onboarding-request-path">{line.path}</span>
                      <span className="agents-onboarding-request-status">{line.status}</span>
                      <span className="agents-onboarding-request-note">{line.note}</span>
                    </motion.div>
                  ))}
                </>
              )}

              {atLeast("output") && (
                <>
                  <motion.div
                    className="agents-onboarding-summary"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.1 }}
                  >
                    <span>→</span>
                    <span>
                      Resale fees apply only to covered secondary-market transfers; the seller of record stays liable
                      until settlement clears.
                    </span>
                  </motion.div>

                  <motion.div
                    className="agents-onboarding-receipt"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.9 }}
                  >
                    <div>
                      <span>words read</span>
                      <strong>137</strong>
                    </div>
                    <div className="is-spent">
                      <span>spent</span>
                      <strong>$0.0068</strong>
                    </div>
                    <div>
                      <span>budget cap</span>
                      <strong>$0.0100</strong>
                    </div>
                  </motion.div>

                  <motion.div
                    className="agents-onboarding-line agents-onboarding-line-ok"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 1.6 }}
                  >
                    <span>✓</span>
                    <span>done — $0.0068 spent of $0.0100 cap</span>
                  </motion.div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>

        <div className="developers-skill-panel developers-skill-panel--landing agents-onboarding-panel">
          <div className="developers-skill-panel-header developers-skill-panel-header--landing">
            <div className="developers-skill-panel-intro">
              <div className="developers-skill-panel-title">
                <Link2 size={17} className="text-[var(--river)]" aria-hidden="true" /> Add Rubicon to your agent
              </div>
              <p className="developers-skill-panel-copy">
                Paste this into Codex or another agent. It installs the Rubicon skill, funds a buyer wallet, and runs
                a capped first read.
              </p>
              <div className="relative w-fit"><button
                ref={copyButtonRef}
                type="button"
                onClick={copySetupPrompt}
                className={`button button-secondary min-h-10 w-fit text-sm${phase === "click-copy" ? " agents-onboarding-press" : ""}`}
              >
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{" "}
                {copied ? "Copied" : "Copy prompt"}
              </button><SuccessCelebration active={realCopied} celebrationKey={celebrationKey} /></div>
            </div>
          </div>
          <code
            className={`developers-skill-prompt mono agents-onboarding-prompt${fakeCopied ? " is-selected" : ""}`}
          >
            {setupSkillPrompt}
          </code>
        </div>
      </div>

      {!reduce && cursor && (
        <motion.div
          className="agents-onboarding-cursor"
          aria-hidden="true"
          initial={false}
          animate={{ x: cursor.x, y: cursor.y, opacity: cursorVisible ? 1 : 0, scale: isClicking ? 0.96 : 1 }}
          transition={{
            x: { duration: 0.68, ease: motionEase.move },
            y: { duration: 0.68, ease: motionEase.move },
            opacity: { duration: 0.18, ease: EASE },
            scale: { duration: 0.14, ease: EASE },
          }}
        >
          <MousePointer2 size={20} fill="currentColor" />
          <AnimatePresence>
            {isClicking && (
              <motion.span
                key={phase}
                className="agents-onboarding-cursor-ring"
                initial={{ opacity: 0.72, scale: 0.82 }}
                animate={{ opacity: 0, scale: 1.28 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
