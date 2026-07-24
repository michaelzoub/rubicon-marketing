"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { BookOpen, Github, MousePointer2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackClick } from "../analytics-links";
import {
  trackCopyActionCompleted,
  trackMarketingCtaClicked,
  trackVisualOnce,
} from "../analytics/events";
import { fade, motionEase } from "./motion";

const githubUrl = "https://github.com/michaelzoub/rubicon";

const INSTALL_CMD = "npm install @rubicon-caliga/agent-sdk";
const RUN_CMD = "node find-clause.mjs";

/**
 * Once-only demo for the SDK section: a fake cursor copies the install command,
 * pastes it into the terminal, npm installs the SDK, then a capped agent read
 * streams paid words Claude-style until the agent has its answer and closes
 * the stream early.
 */

const PHASES = [
  "idle",
  "move-copy",
  "click-copy",
  "move-terminal",
  "paste",
  "install",
  "run",
  "stream",
  "enough",
  "receipt",
] as const;

type Phase = (typeof PHASES)[number];

const PHASE_MS: Record<Phase, number> = {
  idle: 1200,
  "move-copy": 1000,
  "click-copy": 800,
  "move-terminal": 1000,
  paste: 900,
  install: 2100,
  run: 1600,
  stream: 4900,
  enough: 1500,
  receipt: 4200,
};

const EASE = motionEase.out;

/** The paid excerpt the agent streams word by word before stopping. */
const STREAM_WORDS =
  "The resale fee applies only to transfers executed through covered secondary-market venues. It is assessed against the realized sale price, not appraised value, and the seller of record remains liable until settlement clears.".split(
    " ",
  );

const PRICE_PER_WORD = 0.00005;
const STREAM_WORD_MS = 125;
const STREAM_START_DELAY_MS = 500;

function formatSpend(words: number) {
  return `$${(words * PRICE_PER_WORD).toFixed(4)}`;
}

interface CursorPoint {
  x: number;
  y: number;
}

function SdkTerminalDemo({
  phase,
  cycle,
  wordCount,
  reduce,
  atLeast,
  promptLineRef,
}: {
  phase: Phase;
  cycle: number;
  wordCount: number;
  reduce: boolean;
  atLeast: (p: Phase) => boolean;
  promptLineRef: React.RefObject<HTMLDivElement | null>;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function scrollToBottom() {
      const el = bodyRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }

    scrollToBottom();
    const body = bodyRef.current;
    if (!body) return;

    const observer = new ResizeObserver(scrollToBottom);
    observer.observe(body);
    return () => observer.disconnect();
  }, [phase, cycle]);

  const streaming = phase === "stream";
  const streamDone = atLeast("enough");
  const shownWords = streamDone ? STREAM_WORDS.length : wordCount;

  return (
    <div className="landing-agents-terminal agents-onboarding-terminal" aria-hidden="true">
      <div className="landing-agents-terminal-bar">
        <span className="landing-agents-terminal-dot landing-agents-terminal-dot-r" />
        <span className="landing-agents-terminal-dot landing-agents-terminal-dot-y" />
        <span className="landing-agents-terminal-dot landing-agents-terminal-dot-g" />
        <span className="landing-agents-terminal-name mono">zsh — rubicon agent sdk</span>
      </div>

      <div key={cycle} ref={bodyRef} className="landing-agents-terminal-body mono agents-onboarding-body">
        {/* $ npm install … */}
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
                {INSTALL_CMD}
              </motion.div>
            ) : (
              <span className="agents-onboarding-caret" />
            )}
          </div>
        </div>

        <div className="agents-onboarding-log">
          {phase === "install" && (
            <motion.div
              className="agents-onboarding-line agents-onboarding-line-quiet"
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <span className="agents-onboarding-spin">▸</span>
              <span>
                installing @rubicon-caliga/agent-sdk
                <span className="agents-onboarding-dots" />
              </span>
            </motion.div>
          )}

          {atLeast("run") && (
            <motion.div
              className="agents-onboarding-line agents-onboarding-line-ok"
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <span>✓</span>
              <span>added 14 packages in 1.2s</span>
            </motion.div>
          )}

          {/* $ node find-clause.mjs */}
          {atLeast("run") && (
            <motion.div
              className="agents-onboarding-cmd"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE, delay: reduce ? 0 : 0.5 }}
            >
              <span className="landing-agents-terminal-prompt agents-onboarding-cmd-mark">$</span>
              <div className="agents-onboarding-cmd-text-wrap">
                <span className="agents-onboarding-cmd-text">{RUN_CMD}</span>
              </div>
            </motion.div>
          )}

          {atLeast("stream") && (
            <>
              <motion.div
                className="agents-onboarding-line agents-onboarding-line-quiet"
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <span className="agents-onboarding-spin">→</span>
                <span>session opened · goal “find the resale-fee clause” · cap $0.0100</span>
              </motion.div>

              <motion.div
                className="agents-onboarding-line agents-onboarding-line-quiet"
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.2 }}
              >
                <span className="agents-onboarding-spin">▸</span>
                <span>streaming §2 · fee mechanics</span>
                <span className="sdk-demo-ticker">
                  {shownWords} words · {formatSpend(shownWords)}
                </span>
              </motion.div>

              <motion.div
                className="sdk-demo-stream"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.35 }}
              >
                {STREAM_WORDS.slice(0, shownWords).map((word, i) => (
                  <motion.span
                    key={`${cycle}-${i}`}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.22, ease: EASE }}
                  >
                    {word}{" "}
                  </motion.span>
                ))}
                {streaming && <span className="agents-onboarding-caret" />}
              </motion.div>
            </>
          )}

          {atLeast("enough") && (
            <motion.div
              className="agents-onboarding-line agents-onboarding-line-ok"
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.2 }}
            >
              <span>✓</span>
              <span>agent has the answer — ending stream early</span>
            </motion.div>
          )}

          {atLeast("receipt") && (
            <>
              <motion.div
                className="agents-onboarding-line agents-onboarding-line-quiet"
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <span className="agents-onboarding-spin">→</span>
                <span>stream closed · {STREAM_WORDS.length} of 2,418 words purchased</span>
              </motion.div>

              <motion.div
                className="agents-onboarding-receipt"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.5 }}
              >
                <div>
                  <span>words read</span>
                  <strong>{STREAM_WORDS.length}</strong>
                </div>
                <div className="is-spent">
                  <span>spent</span>
                  <strong>{formatSpend(STREAM_WORDS.length)}</strong>
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
                transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 1.2 }}
              >
                <span>✓</span>
                <span>done — settled in USDC, receipt attributed per word</span>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DevelopersSdkSection() {
  const reduce = useReducedMotion() ?? false;
  const [stageIndex, setStageIndex] = useState(0);
  const [cycle] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [cursor, setCursor] = useState<CursorPoint | null>(null);
  const [realCopied, setRealCopied] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const installPillRef = useRef<HTMLButtonElement>(null);
  const promptLineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.22, margin: "0px 0px -8%" });

  // Fire one `marketing_visual_interacted` per session when the SDK demo animates.
  useEffect(() => {
    trackVisualOnce({
      page: "developers",
      section: "sdk",
      visual_id: "sdk_demo_animation",
      interaction: "viewed",
    });
  }, []);

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

  // Claude-style word streaming during the stream phase.
  useEffect(() => {
    if (reduce || phase !== "stream") return;
    let interval = 0;
    const delay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setWordCount((count) => {
          if (count >= STREAM_WORDS.length) {
            window.clearInterval(interval);
            return count;
          }
          return count + 1;
        });
      }, STREAM_WORD_MS);
    }, STREAM_START_DELAY_MS);
    return () => {
      window.clearTimeout(delay);
      window.clearInterval(interval);
    };
  }, [phase, reduce]);

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
    if (phase === "idle") next = pointAt(installPillRef.current, 130, 110);
    else if (phase === "move-copy" || phase === "click-copy") next = pointAt(installPillRef.current, 20, 6);
    else if (phase === "move-terminal" || phase === "paste") next = pointAt(promptLineRef.current, 60, 8);
    if (next) setCursor(next);
  }, [phase, cycle, reduce]);

  const isClicking = phase === "click-copy" || phase === "paste";
  const cursorVisible = !atLeast("install");
  const fakeCopied = phase === "click-copy" || phase === "move-terminal";
  const copied = fakeCopied || realCopied;

  const copyInstallCmd = async () => {
    await navigator.clipboard.writeText(INSTALL_CMD);
    setRealCopied(true);
    // Canonical copy event with stable cta_id.
    trackCopyActionCompleted({
      cta_id: "developers_copy_install_command",
      label: INSTALL_CMD,
      page: "developers",
      section: "sdk",
      audience: "developer",
      intent: "copy_install",
    });
    // Legacy alias kept so existing PostHog insights keep working.
    trackClick("copy_code_clicked", { tab: "install" });
    window.setTimeout(() => setRealCopied(false), 1400);
  };

  return (
    <section
      id="developers"
      className="landing-section-block developers-sdk-section scroll-mt-24"
      aria-labelledby="developers-sdk-heading"
      data-analytics-section="sdk"
      data-analytics-section-index="3"
    >
      <motion.div {...fade} className="container">
        <div ref={stageRef} className="developers-sdk-layout sdk-demo-stage">
          <div className="developers-sdk-copy">
            <div className="landing-section-kicker">
              <h2 id="developers-sdk-heading" className="landing-section-title developers-sdk-title">
                <span className="landing-section-title-emphasis">Use the SDK when you want direct control.</span>
                <br />
                <span className="landing-section-title-muted">
                  Wire Rubicon into your own agent loop, set a spend cap, and stream paid words when your workflow needs
                  them.
                </span>
              </h2>
            </div>
            <button
              ref={installPillRef}
              type="button"
              onClick={copyInstallCmd}
              className={`developers-sdk-install mono${copied ? " is-copied" : ""}${phase === "click-copy" ? " agents-onboarding-press" : ""}`}
              aria-label="Copy install command"
            >
              {INSTALL_CMD}
              <span className="sdk-demo-copy-hint">{copied ? "copied" : "copy"}</span>
            </button>
            <div className="developers-sdk-links">
              <a
                href={githubUrl}
                className="button button-secondary text-sm"
                onClick={() => {
                  trackMarketingCtaClicked({
                    cta_id: "developers_github",
                    label: "View on GitHub",
                    page: "developers",
                    section: "sdk",
                    audience: "developer",
                    intent: "inspect_code",
                    position: "section",
                    target_type: "external",
                    target_url: githubUrl,
                  });
                  trackClick("github_clicked", { location: "sdk_section" });
                }}
              >
                <Github size={15} aria-hidden="true" /> View on GitHub
              </a>
              <Link
                href="/docs"
                className="button button-secondary text-sm"
                onClick={() => {
                  trackMarketingCtaClicked({
                    cta_id: "developers_docs",
                    label: "Read the docs",
                    page: "developers",
                    section: "sdk",
                    audience: "developer",
                    intent: "read_docs",
                    position: "section",
                    target_type: "internal_page",
                    target_url: "/docs",
                  });
                  trackClick("read_docs_clicked", { location: "sdk_section" });
                }}
              >
                <BookOpen size={15} aria-hidden="true" /> Read the docs
              </Link>
            </div>
          </div>

          <div className="sdk-demo-panel">
            <div className="sdk-demo-visual">
              <SdkTerminalDemo
                phase={phase}
                cycle={cycle}
                wordCount={wordCount}
                reduce={reduce}
                atLeast={atLeast}
                promptLineRef={promptLineRef}
              />
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
      </motion.div>
    </section>
  );
}
