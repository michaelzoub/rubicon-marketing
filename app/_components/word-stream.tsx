"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Coins, Layers, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PRICE_PER_WORD = 0.00001;
const ease = [0.16, 1, 0.3, 1] as const;

// "Small article": streamed one word at a time, one payment per word, the slow baseline.
const PERWORD_TARGET = 24;
// "Large article": the gateway bundles consecutive words into one chunk released by a
// single payment. BUNDLE_SIZE words land per payment, so the text fills in far quicker.
const BUNDLE_SIZE = 6;
const BUNDLE_COUNT = 7; // 7 bundles -> 42 words delivered across just 7 payments
const VISIBLE_WORD_ROWS = 6;
const VISIBLE_BUNDLES = 3;

const fmt = (n: number) => `$${(n * PRICE_PER_WORD).toFixed(5)}`;

// A small pool of real article words so bundles show tangible, contiguous runs.
const ARTICLE_WORDS =
  "each token is projected into query key and value vectors and attention scores are computed as the scaled dot product between every query and key so the model can weigh how much each word attends to the others the resulting weights blend the value vectors into a context aware representation"
    .split(" ");

const wordAt = (i: number) => ARTICLE_WORDS[i % ARTICLE_WORDS.length];

type Phase = "perword" | "gap" | "bundled" | "done";

/**
 * Two-phase demonstration of how Rubicon meters reads.
 *
 *  1. Per-word streaming (small article): every word is delivered and paid for
 *     individually, deliberately metronomic, one payment tick per word.
 *  2. Bundled reads (large article): the gateway bundles a contiguous run of
 *     words into a single chunk released by ONE payment, so more words land per
 *     payment and the text fills in noticeably faster.
 *
 * The loop runs per-word -> transition -> bundled, then settles and restarts.
 * Respects prefers-reduced-motion with a static before/after comparison.
 */
export function WordStreamDemo() {
  const reduced = useReducedMotion();

  if (reduced) return <WordStreamStatic />;
  return <WordStreamAnimated />;
}

function WordStreamAnimated() {
  const [phase, setPhase] = useState<Phase>("perword");
  const [pwCount, setPwCount] = useState(0);
  const [bundleCount, setBundleCount] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    const clearAll = () => {
      t.forEach(clearTimeout);
      t.length = 0;
    };

    if (phase === "perword") {
      let n = 0;
      const tick = () => {
        n += 1;
        setPwCount(n);
        if (n >= PERWORD_TARGET) {
          t.push(setTimeout(() => setPhase("gap"), 950));
          return;
        }
        // ease into a lively-but-readable, one-tick-per-word cadence
        const delay = n < 4 ? 360 : n < 10 ? 150 : 82;
        t.push(setTimeout(tick, delay));
      };
      t.push(setTimeout(tick, 420));
    } else if (phase === "gap") {
      t.push(setTimeout(() => setPhase("bundled"), 1150));
    } else if (phase === "bundled") {
      let b = 0;
      const tick = () => {
        b += 1;
        setBundleCount(b);
        if (b >= BUNDLE_COUNT) {
          t.push(setTimeout(() => setPhase("done"), 900));
          return;
        }
        // a whole block of words arrives per tick, far more text per payment
        t.push(setTimeout(tick, b < 2 ? 540 : 380));
      };
      t.push(setTimeout(tick, 520));
    } else if (phase === "done") {
      t.push(
        setTimeout(() => {
          setPwCount(0);
          setBundleCount(0);
          setPhase("perword");
        }, 4400),
      );
    }

    return clearAll;
  }, [phase]);

  const bundled = phase === "bundled" || phase === "done";
  const done = phase === "done";
  const settling = phase === "gap";

  const words = bundled ? bundleCount * BUNDLE_SIZE : pwCount;
  const payments = bundled ? bundleCount : pwCount;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-[var(--card)] transition-colors duration-500 ${
        done ? "border-[rgba(88,213,155,0.38)]" : bundled ? "border-[var(--river-line)]" : "border-[var(--line)]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[var(--faint)] bg-[var(--surface-muted)] px-5 py-3">
        <span className="mono text-[0.66rem] uppercase tracking-[0.16em] text-[var(--muted)]">Paid word stream</span>
        <span className={`mono text-xs ${done ? "text-[var(--green)]" : "text-[var(--river-deep)]"}`}>
          {done ? "settled" : "streaming"}
        </span>
      </div>

      <div className="px-5 py-4">
        {/* mode caption, switches between the per-word baseline and the bundled speedup */}
        <div className="mb-4 flex h-[40px] items-center">
          <AnimatePresence mode="wait" initial={false}>
            {bundled ? (
              <motion.div
                key="cap-bundled"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease }}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Layers size={15} className="text-[var(--river-deep)]" aria-hidden="true" />
                  Bundled reads · {BUNDLE_SIZE} words, 1 payment
                </span>
                <span className="mono flex shrink-0 items-center gap-1 rounded-full border border-[rgba(88,213,155,0.4)] bg-[rgba(88,213,155,0.1)] px-2 py-0.5 text-[0.62rem] font-medium text-[var(--green)]">
                  <Zap size={11} aria-hidden="true" /> ×{BUNDLE_SIZE} faster
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="cap-perword"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease }}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Coins size={15} className="text-[var(--river-deep)]" aria-hidden="true" />
                  Per-word streaming
                </span>
                <span className="mono shrink-0 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {settling ? "small article done" : "small article"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* fixed-height ledger so the surrounding page never reflows */}
        <div className="grid h-[228px] content-start gap-1.5 overflow-hidden">
          {bundled ? (
            <BundledLedger count={bundleCount} />
          ) : (
            <PerWordLedger count={pwCount} />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--faint)] pt-3">
          <span className="text-sm font-semibold">
            {words} words read
            <span className="mono ml-2 text-xs font-normal text-[var(--muted)]">{payments} payments</span>
          </span>
          <span className="mono text-sm font-semibold text-[var(--river-deep)]">{fmt(words)} paid</span>
        </div>

        {/* reserved slot keeps height constant whether or not the banner is shown */}
        <div className="mt-4 h-[64px]">
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease }}
                className="flex h-full flex-col justify-center rounded-lg border border-[rgba(88,213,155,0.38)] bg-[rgba(88,213,155,0.1)] px-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <CheckCircle2 size={16} aria-hidden="true" /> {BUNDLE_COUNT * BUNDLE_SIZE} words delivered in {BUNDLE_COUNT} payments
                </div>
                <div className="mt-1 text-xs text-[var(--green)]">
                  Same per-word price. Bundling just cut the payment round-trips.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PerWordLedger({ count }: { count: number }) {
  const rows = Array.from({ length: Math.min(count, VISIBLE_WORD_ROWS) }, (_, i) => count - i).filter((n) => n > 0);
  const aggregated = Math.max(count - VISIBLE_WORD_ROWS, 0);

  return (
    <>
      {aggregated > 0 && (
        <div className="mono flex items-center justify-between rounded-md bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--muted)]">
          <span>
            Words 001–{String(aggregated).padStart(3, "0")} · {aggregated} payments
          </span>
          <span>{fmt(aggregated)} paid</span>
        </div>
      )}
      {rows.map((n, i) => (
        <motion.div
          key={n}
          initial={i === 0 ? { opacity: 0, y: -6 } : false}
          animate={{ opacity: 1 - i * 0.12, y: 0 }}
          transition={{ duration: 0.28, ease }}
          className="mono flex items-center justify-between rounded-md border border-[var(--faint)] bg-[var(--surface)] px-3 py-1.5 text-xs"
        >
          <span className="flex items-center gap-1.5 text-[var(--ink)]">
            <Coins size={11} className="text-[var(--river-deep)]" aria-hidden="true" />
            Word {String(n).padStart(3, "0")} delivered
          </span>
          <span className="text-[var(--river-deep)]">$0.00001 paid</span>
        </motion.div>
      ))}
    </>
  );
}

function BundledLedger({ count }: { count: number }) {
  const visible = Array.from({ length: Math.min(count, VISIBLE_BUNDLES) }, (_, i) => count - i).filter((n) => n > 0);
  const aggregatedBundles = Math.max(count - VISIBLE_BUNDLES, 0);
  const aggregatedWords = aggregatedBundles * BUNDLE_SIZE;

  return (
    <>
      {aggregatedBundles > 0 && (
        <div className="mono flex items-center justify-between rounded-md bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--muted)]">
          <span>
            {aggregatedWords} words · {aggregatedBundles} payments
          </span>
          <span>{fmt(aggregatedWords)} paid</span>
        </div>
      )}
      {visible.map((b, i) => {
        const startSeq = (b - 1) * BUNDLE_SIZE + 1;
        const endSeq = b * BUNDLE_SIZE;
        const words = Array.from({ length: BUNDLE_SIZE }, (_, k) => wordAt(startSeq - 1 + k));
        return (
          <motion.div
            key={b}
            // the whole bundle flies in as a single highlighted unit
            initial={i === 0 ? { opacity: 0, x: 18, scale: 0.96 } : false}
            animate={{ opacity: 1 - i * 0.16, x: 0, scale: 1 }}
            transition={{ duration: 0.34, ease }}
            className="rounded-lg border border-[var(--river-line)] bg-[var(--river-pale)] px-3 py-2"
          >
            <div className="mono flex items-center justify-between text-[0.62rem] text-[var(--muted)]">
              <span>
                Words {String(startSeq).padStart(3, "0")}–{String(endSeq).padStart(3, "0")} · {BUNDLE_SIZE} words
              </span>
              <span className="flex items-center gap-1 text-[var(--green)]">
                <Coins size={10} aria-hidden="true" /> 1 payment · {fmt(BUNDLE_SIZE)}
              </span>
            </div>
            <p className="mono mt-1.5 flex flex-wrap gap-x-1.5 gap-y-1 text-[0.7rem] leading-4 text-[var(--ink)]">
              {words.map((w, k) => (
                <span key={k} className="text-[var(--river-deep)]">
                  {w}
                </span>
              ))}
            </p>
          </motion.div>
        );
      })}
    </>
  );
}

/** Static before/after comparison shown when the visitor prefers reduced motion. */
function WordStreamStatic() {
  const compareWords = BUNDLE_SIZE * 4; // 24 words read either way
  const bundledPayments = compareWords / BUNDLE_SIZE;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--faint)] bg-[var(--surface-muted)] px-5 py-3">
        <span className="mono text-[0.66rem] uppercase tracking-[0.16em] text-[var(--muted)]">Paid word stream</span>
        <span className="mono text-xs text-[var(--river-deep)]">two modes</span>
      </div>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Coins size={15} className="text-[var(--river-deep)]" aria-hidden="true" /> Per-word streaming
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">Small article · one payment per word.</p>
          <dl className="mono mt-3 grid gap-1 text-xs">
            <Row k="Words read" v={String(compareWords)} />
            <Row k="Payments" v={String(compareWords)} />
            <Row k="Paid" v={fmt(compareWords)} accent />
          </dl>
        </div>

        <div className="rounded-lg border border-[var(--river-line)] bg-[var(--river-pale)] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <Layers size={15} className="text-[var(--river-deep)]" aria-hidden="true" /> Bundled reads
            </span>
            <span className="mono flex items-center gap-1 rounded-full border border-[rgba(88,213,155,0.4)] bg-[rgba(88,213,155,0.1)] px-2 py-0.5 text-[0.62rem] font-medium text-[var(--green)]">
              <Zap size={11} aria-hidden="true" /> ×{BUNDLE_SIZE} faster
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">Large article · {BUNDLE_SIZE} words per payment.</p>
          <dl className="mono mt-3 grid gap-1 text-xs">
            <Row k="Words read" v={String(compareWords)} />
            <Row k="Payments" v={String(bundledPayments)} />
            <Row k="Paid" v={fmt(compareWords)} accent />
          </dl>
        </div>
      </div>

      <p className="border-t border-[var(--faint)] px-5 py-3 text-xs text-[var(--muted)]">
        Same words read, same total paid. Bundling only cuts the payment round-trips.
      </p>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className={accent ? "text-[var(--river-deep)]" : "text-[var(--ink)]"}>{v}</dd>
    </div>
  );
}
