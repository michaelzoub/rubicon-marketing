"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./evidence-read-simulation.module.css";

const SECTION_PRICE = 0.6;
const WORDS_PER_TICK = 1;
const WORD_INTERVAL_MS = 92;
const SELECT_DELAY_MS = 520;
const COMPLETE_DELAY_MS = 350;
const REPLAY_INTERVAL_MS = 9000;

const PASSAGE = [
  "Agents read only the passage they need. Each word unlocks as a tiny payment settles, and the writer earns instantly.",
] as const;

const LOCKED_CONTEXT = [
  "The surrounding analysis remains unavailable until the agent chooses another relevant passage.",
  "That keeps the read scoped to the evidence needed for this task.",
] as const;

const PASSAGE_WORDS = PASSAGE.map((paragraph) => paragraph.split(" "));
const TOTAL_WORDS = PASSAGE_WORDS.reduce((total, words) => total + words.length, 0);
const REPLAY_HOLD_MS = Math.max(
  3000,
  REPLAY_INTERVAL_MS - SELECT_DELAY_MS - TOTAL_WORDS * WORD_INTERVAL_MS - COMPLETE_DELAY_MS,
);

type Phase = "select" | "read" | "complete";

export function EvidenceReadSimulation() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(rootRef, { amount: 0.35, margin: "0px 0px -48px 0px" });
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

    if (phase !== "select") return;

    const timer = window.setTimeout(() => setPhase("read"), SELECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [inView, phase, reduceMotion]);

  useEffect(() => {
    if (phase !== "read" || !inView || reduceMotion) return;
    const interval = window.setInterval(() => {
      setWordsRead((current) => Math.min(current + WORDS_PER_TICK, TOTAL_WORDS));
    }, WORD_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [inView, phase, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !inView) return;

    if (phase === "read" && wordsRead >= TOTAL_WORDS) {
      const timer = window.setTimeout(() => setPhase("complete"), COMPLETE_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    if (phase === "complete") {
      const timer = window.setTimeout(() => {
        setWordsRead(0);
        setPhase("select");
      }, REPLAY_HOLD_MS);
      return () => window.clearTimeout(timer);
    }
  }, [inView, phase, reduceMotion, wordsRead]);

  const visiblePhase: Phase = reduceMotion ? "complete" : phase;
  const visibleWordsRead = reduceMotion ? TOTAL_WORDS : wordsRead;
  const complete = visiblePhase === "complete";
  const writerEarned = (visibleWordsRead / TOTAL_WORDS) * SECTION_PRICE;
  const stateLabel = complete
    ? "Payment settled"
    : visiblePhase === "read"
      ? "Unlocking as payment settles"
      : "Passage selected";

  return (
    <div
      ref={rootRef}
      className={styles.panel}
      data-phase={visiblePhase}
      style={{ "--read-progress": visibleWordsRead / TOTAL_WORDS } as CSSProperties}
      aria-label="Rubicon evidence viewer showing a selected article section unlocking"
    >
      <div className={styles.viewer}>
        <div className={styles.liveBar}>
          <span>Example read</span>
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
                      const isCurrent = visiblePhase === "read" && wordNumber === visibleWordsRead;
                      return (
                        <span
                          className={
                            wordNumber <= visibleWordsRead
                              ? `${styles.wordRevealed}${isCurrent ? ` ${styles.wordCurrent}` : ""}`
                              : styles.wordLocked
                          }
                          key={`${word}-${wordIndex}`}
                        >
                          {word}{wordIndex < paragraph.length - 1 ? " " : ""}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
              {LOCKED_CONTEXT.map((paragraph) => <p className={styles.lockedContext} key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
            <p className={styles.screenReaderStatus} aria-live="polite">
              {visibleWordsRead} of {TOTAL_WORDS} words unlocked.
            </p>

            <footer className={styles.footer}>
              <div><span>Words read</span><strong>{visibleWordsRead}</strong></div>
              <div><span>Writer earned</span><strong>${writerEarned.toFixed(2)}</strong></div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
