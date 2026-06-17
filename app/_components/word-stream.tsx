"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PRICE_PER_WORD = 0.00001;
const TARGET_WORDS = 137;
const VISIBLE_ROWS = 6;

/**
 * Polished demonstration of word-level metering: each word is delivered and
 * paid for individually. Older rows aggregate into a running counter so the
 * panel stays compact while making clear every word is metered and paid.
 */
export function WordStreamDemo() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (done) {
      timer.current = setTimeout(() => {
        setCount(0);
        setDone(false);
      }, 4200);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }

    if (count >= TARGET_WORDS) {
      setDone(true);
      return;
    }

    // Accelerate after the first few words for a lively-but-readable cadence.
    const delay = count < 4 ? 420 : count < 12 ? 150 : 60;
    timer.current = setTimeout(() => setCount((c) => Math.min(c + 1, TARGET_WORDS)), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [count, done]);

  const paid = (count * PRICE_PER_WORD).toFixed(5);
  const rows = Array.from({ length: Math.min(count, VISIBLE_ROWS) }, (_, i) => count - i).filter((n) => n > 0);
  const aggregated = Math.max(count - VISIBLE_ROWS, 0);

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors duration-500 ${done ? "border-[#69b88c]" : "border-[var(--line)]"}`}>
      <div className="flex items-center justify-between border-b border-[var(--faint)] bg-[var(--surface-muted)] px-5 py-3">
        <span className="mono text-[0.66rem] uppercase tracking-[0.16em] text-[var(--muted)]">Paid word stream</span>
        <span className={`mono text-xs ${done ? "text-[#24734f]" : "text-[var(--river-deep)]"}`}>
          {done ? "stopped" : "streaming"}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="mono mb-4 rounded-lg border border-[var(--faint)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted)]">
          Goal: Find the resale-fee clause
        </div>

        <div className="grid gap-1.5">
          {aggregated > 0 && (
            <div className="mono flex items-center justify-between rounded-md bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--muted)]">
              <span>Words 001–{String(aggregated).padStart(3, "0")} delivered</span>
              <span>${(aggregated * PRICE_PER_WORD).toFixed(5)} paid</span>
            </div>
          )}
          {rows.map((n, i) => (
            <motion.div
              key={n}
              initial={i === 0 ? { opacity: 0, y: -6 } : false}
              animate={{ opacity: 1 - i * 0.12, y: 0 }}
              transition={{ duration: 0.18 }}
              className="mono flex items-center justify-between rounded-md border border-[var(--faint)] bg-white px-3 py-1.5 text-xs"
            >
              <span className="text-[var(--ink)]">Word {String(n).padStart(3, "0")} delivered</span>
              <span className="text-[var(--river-deep)]">$0.00001 paid</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--faint)] pt-3">
          <span className="text-sm font-semibold">{count} words read</span>
          <span className="mono text-sm font-semibold text-[var(--river-deep)]">${paid} paid</span>
        </div>

        {done && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-4 rounded-lg border border-[#69b88c] bg-[#e8f6ef] px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#165c3e]">
              <CheckCircle2 size={16} aria-hidden="true" /> Answer found — agent stopped
            </div>
            <div className="mt-1 text-xs text-[#24734f]">Unread words were not charged.</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
