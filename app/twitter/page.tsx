"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { StreamTheater } from "../_components/stream-theater";

const ease = [0.16, 1, 0.3, 1] as const;

// Keep the rotation interval tied to the enter/exit animation so each beat fully
// transitions in, holds, then transitions out before the next one swaps in.
const TRANSITION = 0.6; // seconds, per enter and per exit
const HOLD = 3; // seconds a beat stays fully visible
const CYCLE_MS = (HOLD + TRANSITION * 2) * 1000;

const beats = [
  {
    kicker: "Writers",
    headline: "Feeling the FOMO as the agent economy takes off?",
    sub: "Your best work should be readable by agents without becoming free training paste.",
  },
  {
    kicker: "Agent users",
    headline: "Great taste. Terrible source diets.",
    sub: "Stop feeding agents garbage and wondering why garbage comes back.",
  },
  {
    kicker: "Rubicon",
    headline: "Writers upload paywalled articles. Agents pay to read them word by word.",
    sub: "The article streams just enough evidence for the answer, without handing over the whole sauce.",
  },
  {
    kicker: "Read more",
    headline: "rubiconpay.xyz",
    sub: "Paid reading for AI agents.",
  },
] as const;

export default function TwitterRecordingPage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % beats.length);
    }, CYCLE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const beat = beats[active];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="aurora" aria-hidden="true" />
      <div className="grid-texture" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_44%,rgba(var(--river-rgb),0.18),transparent_30rem)]" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-[1500px] gap-6 px-5 py-5 sm:px-6 sm:py-6 md:grid-cols-[0.88fr_1.12fr] md:items-center md:gap-8 md:px-10 lg:px-14">
        <div className="flex min-h-[360px] flex-col justify-center md:min-h-[560px]">
          <div className="relative flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={beat.kicker}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, filter: "blur(7px)" }}
                transition={{ duration: TRANSITION, ease }}
                className="absolute inset-0 flex max-w-[620px] flex-col items-start justify-center"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--river-line)] bg-[var(--river-pale)] px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--river-deep)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--river-deep)]" aria-hidden="true" />
                  {beat.kicker}
                </span>
                <h1 className="mt-5 text-[clamp(2.45rem,13vw,4rem)] font-[850] leading-[0.92] tracking-[-0.04em] md:text-[clamp(2.8rem,7vw,6.9rem)] md:leading-[0.9] md:tracking-[-0.05em]">
                  {beat.headline}
                </h1>
                <p className="mt-5 max-w-[570px] text-[clamp(0.98rem,4.5vw,1.12rem)] leading-7 text-[var(--muted)] md:mt-6 md:text-[clamp(1.05rem,2vw,1.45rem)] md:leading-8">
                  {beat.sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.85, delay: 0.12, ease }}
          className="min-w-0"
        >
          <div className="hero-visual mx-auto w-full max-w-[760px]" style={{ animation: "soft-float 7s var(--ease-in-out) infinite" }}>
            <StreamTheater />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
