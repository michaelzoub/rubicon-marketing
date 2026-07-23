"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import styles from "./evidence-read-simulation.module.css";

const SECTION_PRICE = 0.6;
const WORDS_PER_TICK = 1;
const WORD_INTERVAL_MS = 92;

const PASSAGE = [
  "Credit spreads can remain calm even as refinancing risk accumulates beneath them. The signal is not today’s default rate; it is the volume of debt that must be replaced at materially higher coupons over the next eighteen months.",
  "For weaker issuers, that repricing lands before earnings have time to recover. Liquidity gets consumed first, covenants tighten next, and solvency becomes visible only after the market has already moved.",
] as const;

const PASSAGE_WORDS = PASSAGE.map((paragraph) => paragraph.split(" "));
const TOTAL_WORDS = PASSAGE_WORDS.reduce((total, words) => total + words.length, 0);

type Phase = "select" | "read" | "complete";

export function EvidenceReadSimulation() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(rootRef, { amount: 0.4, margin: "0px 0px -48px 0px" });
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("select");
  const [wordsRead, setWordsRead] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setPhase("complete");
      setWordsRead(TOTAL_WORDS);
      return;
    }

    if (!inView) {
      setPhase("select");
      setWordsRead(0);
      return;
    }

    const timer = window.setTimeout(() => setPhase("read"), 720);
    return () => window.clearTimeout(timer);
  }, [inView, reduceMotion]);

  useEffect(() => {
    if (phase !== "read") return;
    const interval = window.setInterval(() => {
      setWordsRead((current) => Math.min(current + WORDS_PER_TICK, TOTAL_WORDS));
    }, WORD_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === "read" && wordsRead >= TOTAL_WORDS) {
      const timer = window.setTimeout(() => setPhase("complete"), 350);
      return () => window.clearTimeout(timer);
    }
  }, [phase, wordsRead]);

  const complete = phase === "complete";
  const writerEarned = (wordsRead / TOTAL_WORDS) * SECTION_PRICE;
  const stateLabel = complete
    ? "Payment settled"
    : phase === "read"
      ? "Unlocking as payment settles"
      : "Passage selected";

  return (
    <div ref={rootRef} className={styles.panel} aria-label="Rubicon evidence viewer showing a selected article section unlocking">
      <div className={styles.viewer}>
        <div className={styles.liveBar}>
          <span>Live reading</span>
          <span className={styles.liveState}><i aria-hidden="true" />{stateLabel}</span>
        </div>
        <header className={styles.header}>
          <span>Northstar Credit Letter</span>
          <h3>The refinancing wall is closer than it looks</h3>
        </header>

        <div className={styles.body}>
          <main className={styles.reader}>
            <div className={styles.passageFrame}>
              <div className={styles.passage} aria-hidden="true">
              {PASSAGE_WORDS.map((paragraph, paragraphIndex) => {
                const wordsBefore = PASSAGE_WORDS.slice(0, paragraphIndex).reduce((total, words) => total + words.length, 0);
                return (
                  <p key={paragraphIndex}>
                    {paragraph.map((word, wordIndex) => {
                      const wordNumber = wordsBefore + wordIndex + 1;
                      const isCurrent = phase === "read" && wordNumber === wordsRead;
                      return (
                        <span
                          className={
                            wordNumber <= wordsRead
                              ? `${styles.wordRevealed}${isCurrent ? ` ${styles.wordCurrent}` : ""}`
                              : styles.wordLocked
                          }
                          key={`${word}-${wordIndex}`}
                        >
                          {word}{" "}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
              </div>
            </div>
            <p className={styles.screenReaderStatus} aria-live="polite">
              {wordsRead} of {TOTAL_WORDS} words unlocked.
            </p>

            <footer className={styles.footer}>
              <div><span>Words read</span><strong>{wordsRead}</strong></div>
              <div><span>Writer earned</span><strong>${writerEarned.toFixed(2)}</strong></div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
