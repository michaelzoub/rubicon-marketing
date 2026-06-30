"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Coins, FileText, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { trackClick } from "./analytics-links";

const ease = [0.16, 1, 0.3, 1] as const;
const AUTO_ADVANCE_MS = 5200;

const STEPS = [
  {
    key: "publish",
    tag: "Step 01",
    title: "Publish",
    copy: "Add an article, review the sections Rubicon detects, and set your price per word. No paywall, no bundle. You decide what each word is worth.",
    visual: PublishVisual,
  },
  {
    key: "read",
    tag: "Step 02",
    title: "Agents read",
    copy: "Your gateway agent guides buyer agents to the right section and releases each word only as it is paid for. Agents stop the moment they have enough.",
    visual: ReadVisual,
  },
  {
    key: "earn",
    tag: "Step 03",
    title: "You earn",
    copy: "Every delivered word is attributed to your article and settled in USDC straight to your receiving wallet. Exact usage, zero platform fee.",
    visual: EarnVisual,
  },
] as const;

export function HowItWorks({ tone = "default" }: { tone?: "default" | "hero" | "landing" }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [active, paused]);

  const ActiveVisual = STEPS[active].visual;
  const isHero = tone === "hero";
  const isLanding = tone === "landing";

  return (
    <section
      id={isLanding ? "how-it-works" : "product"}
      data-analytics-section="product"
      className={
        isHero
          ? "landing-section-block landing-hero-product"
          : isLanding
            ? "landing-section-block creators-how-it-works"
            : "section stack-panel stack-panel-muted border-y border-[var(--faint)] bg-[var(--surface-muted)]"
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="container"
      >
        {isLanding ? (
          <div className="landing-copy-stack creators-how-header">
            <div className="landing-section-kicker">
              <p className="landing-section-eyebrow">How it works</p>
              <h2 className="landing-section-title">From publish to paid, one word at a time.</h2>
            </div>
            <p className="landing-section-lead creators-how-lead">
              Publish once, route agents to the right sections, and get paid for every word they read.
            </p>
          </div>
        ) : (
          <>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-4 section-title">From publish to paid, one word at a time.</h2>
          </>
        )}

        <div
          className={`grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch${isLanding ? " creators-how-grid" : " mt-12"}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* left: the visual that goes with the active step */}
          <div className="hiw-stage order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={STEPS[active].key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease }}
                className="h-full"
              >
                <ActiveVisual />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* right: vertically stacked steps */}
          <ol className="order-1 flex flex-col lg:order-2">
            {STEPS.map((step, i) => {
              const isActive = i === active;
              return (
                <li key={step.key} className={i > 0 ? "border-t border-[var(--faint)]" : undefined}>
                  <button
                    type="button"
                    onClick={() => {
                      trackClick("how_it_works_step_clicked", { step: step.key, step_index: i });
                      setActive(i);
                    }}
                    aria-pressed={isActive}
                    className={`hiw-step group w-full text-left transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-55 hover:opacity-80"
                    }`}
                  >
                    <span className={`hiw-rail ${isActive ? "is-active" : ""}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2.5">
                        <h3
                          className={`text-xl font-semibold tracking-[-0.01em] transition-colors duration-300 ${
                            isActive ? "text-[var(--ink)]" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <span className="mono text-[0.66rem] uppercase tracking-[0.12em] text-[var(--quiet)]">
                          {step.tag}
                        </span>
                      </div>
                      <p className="mt-2.5 leading-7 text-[var(--muted)]">{step.copy}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------- step visuals ---------------- */

function Stage({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="hiw-panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--faint)] px-5 py-3.5">
        <span className="mono text-[0.66rem] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">{children}</div>
    </div>
  );
}

function PublishVisual() {
  const sections = ["Self-Attention Mechanism", "Scaling the Context Window", "Metered Reading Behavior"];
  return (
    <Stage label="Publish · new article">
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <div className="mono mb-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--quiet)]">Article title</div>
          <div className="rounded-lg bg-[#20242b] px-3.5 py-3 text-sm font-medium text-[var(--ink)]">
            The Self-Attention Mechanism
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mono mb-2 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--quiet)]">Sections detected</div>
          <div className="grid flex-1 content-start gap-2">
            {sections.map((s, i) => (
              <div
                key={s}
                className="flex items-center gap-3 rounded-lg bg-[#20242b] px-3.5 py-3 text-[0.82rem]"
              >
                <span className="mono text-[0.62rem] text-[var(--quiet)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 truncate text-[var(--ink)]">{s}</span>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[rgba(88,213,155,0.16)] text-[var(--green)]">
                  <Check size={12} aria-hidden="true" />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[var(--river-pale)] px-3.5 py-3">
          <div>
            <div className="text-sm font-semibold text-[var(--ink)]">Price per word</div>
            <div className="mono text-[0.62rem] text-[var(--muted)]">Charged in USDC</div>
          </div>
          <span className="mono text-lg font-bold text-[var(--river-deep)]">$0.00001</span>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-lg bg-[var(--river)] py-3.5 text-sm font-semibold text-white">
          <FileText size={15} aria-hidden="true" /> Publish article
        </div>
      </div>
    </Stage>
  );
}

function ReadVisual() {
  const words = (
    "Modern transformer models begin by converting every token into three learned vectors: a query, " +
    "a key, and a value. The attention score between two tokens is the dot product of one token's query " +
    "with another token's key, scaled and passed through a softmax so the weights across the sequence sum " +
    "to one. Each token's output is then the weighted sum of every value vector"
  ).split(" ");
  const delivered = 34;
  return (
    <Stage label="Agents read · live stream">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col rounded-xl bg-[#20242b] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.82rem] font-semibold text-[var(--ink)]">Self-Attention Mechanism</span>
            <span className="mono flex items-center gap-1.5 rounded-full bg-[rgba(var(--river-rgb),0.18)] px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.1em] text-[var(--river-deep)]">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--river-deep)]" /> streaming
            </span>
          </div>
          <p className="flex flex-wrap gap-x-1 gap-y-1.5 text-[0.82rem] leading-7">
            {words.map((w, i) => (
              <span
                key={i}
                className={`rounded px-1 ${
                  i < delivered
                    ? "bg-[rgba(var(--river-rgb),0.18)] text-[var(--river-deep)]"
                    : i === delivered
                      ? "bg-[var(--river)] text-white"
                      : "text-[var(--quiet)]"
                }`}
              >
                {w}
              </span>
            ))}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div className="text-lg font-bold text-[var(--ink)]">
            {delivered}<span className="ml-1.5 text-sm font-medium text-[var(--muted)]">words read</span>
          </div>
          <div className="mono text-base font-bold text-[var(--river-deep)]">$0.00034 paid</div>
        </div>
      </div>
    </Stage>
  );
}

function EarnVisual() {
  const ledger = [
    { title: "Self-Attention Mechanism", words: 34, amount: "0.00034" },
    { title: "Scaling the Context Window", words: 42, amount: "0.00042" },
    { title: "Metered Reading Behavior", words: 19, amount: "0.00019" },
  ];
  return (
    <Stage label="You earn · payouts">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl bg-[var(--river-pale)] px-5 py-5">
          <div>
            <span className="mono text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)]">Earned this session</span>
            <div className="mono mt-1.5 text-3xl font-bold tracking-[-0.02em] text-[var(--river-deep)]">$0.00095</div>
            <div className="mt-1 text-[0.7rem] text-[var(--muted)]">95 words delivered · 0% platform fee</div>
          </div>
          <span className="mono flex items-center gap-1.5 rounded-full bg-[rgba(88,213,155,0.16)] px-2.5 py-1 text-[0.56rem] uppercase tracking-[0.1em] text-[var(--green)]">
            <span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" /> live
          </span>
        </div>

        <div className="grid flex-1 content-start gap-2">
          {ledger.map((row) => (
            <div key={row.title} className="flex items-center gap-3 rounded-lg bg-[#20242b] px-3.5 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--river)] text-white">
                <Coins size={15} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.82rem] font-medium text-[var(--ink)]">{row.title}</div>
                <div className="mono text-[0.62rem] text-[var(--quiet)]">{row.words} words read</div>
              </div>
              <span className="mono text-[0.82rem] font-semibold text-[var(--river-deep)]">+${row.amount}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-[#20242b] px-3.5 py-3">
          <Wallet size={15} className="text-[var(--muted)]" aria-hidden="true" />
          <span className="mono text-[0.72rem] text-[var(--ink)]">0x9f4c…2a18</span>
          <span className="mono ml-auto text-[0.62rem] uppercase tracking-[0.1em] text-[var(--quiet)]">
            receiving wallet
          </span>
        </div>
      </div>
    </Stage>
  );
}
