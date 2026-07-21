"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { Check, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./evidence-read-simulation.module.css";

const SECTION_PRICE = 0.6;
const SPENDING_CAP = 2;
const WORDS_PER_TICK = 3;
const WORD_INTERVAL_MS = 145;

const PASSAGE = [
  "Credit looks calm. The refinancing wall does not. Watch the maturities, not the spread.",
] as const;

const PASSAGE_WORDS = PASSAGE.map((paragraph) => paragraph.split(" "));
const TOTAL_WORDS = PASSAGE_WORDS.reduce((total, words) => total + words.length, 0);

type Phase = "inspect" | "select" | "unlock" | "read" | "complete";

const SECTIONS = [
  ["01", "What spreads miss"],
  ["02", "The refinancing wall"],
  ["03", "Where the pain lands"],
] as const;

export function EvidenceReadSimulation() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(rootRef, { amount: 0.4, margin: "0px 0px -48px 0px" });
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("inspect");
  const [wordsRead, setWordsRead] = useState(0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setPhase("complete");
      setWordsRead(TOTAL_WORDS);
      return;
    }

    if (!inView) {
      setPhase("inspect");
      setWordsRead(0);
      return;
    }

    const timers = [
      window.setTimeout(() => setPhase("select"), 700),
      window.setTimeout(() => setPhase("unlock"), 1450),
      window.setTimeout(() => setPhase("read"), 2100),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, reduceMotion, runId]);

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

  const selected = phase !== "inspect";
  const purchasing = phase === "unlock" || phase === "read";
  const complete = phase === "complete";
  const spent = (wordsRead / TOTAL_WORDS) * SECTION_PRICE;
  const stateLabel = complete ? "Section unlocked" : purchasing ? "Purchasing passage" : selected ? "Passage selected" : "Inspecting article";

  function replaySelection() {
    if (reduceMotion) return;
    setPhase("inspect");
    setWordsRead(0);
    setRunId((current) => current + 1);
  }

  return (
    <div ref={rootRef} className={styles.panel} aria-label="Rubicon evidence viewer showing a selected article section unlocking within a spending cap">
      <div className={styles.viewer}>
        <header className={styles.header}>
          <div>
            <p>Market commentary <i aria-hidden="true" /> Scion Capital note</p>
            <h3>The refinancing wall is closer than it looks</h3>
            <span className={styles.byline}>Michael Burry · July 14, 2026</span>
          </div>
          <div className={styles.cap}>
            <span>Spending cap</span>
            <strong>${SPENDING_CAP.toFixed(2)}</strong>
          </div>
        </header>

        <div className={styles.body}>
          <aside className={styles.sections} aria-label="Article sections">
            <h4>Article sections</h4>
            <div className={styles.sectionList}>
              {SECTIONS.map(([number, title]) => {
                const isTarget = number === "02";
                const content = (
                  <>
                    <span>{number}</span>
                    <strong>{title}</strong>
                    {isTarget && selected ? <small>${SECTION_PRICE.toFixed(2)}</small> : null}
                  </>
                );

                if (isTarget) {
                  return (
                    <button
                      type="button"
                      key={number}
                      className={`${styles.sectionRow} ${styles.sectionRowTarget}${selected ? ` ${styles.sectionRowSelected}` : ""}`}
                      aria-pressed={selected}
                      onClick={replaySelection}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div key={number} className={styles.sectionRow}>{content}</div>
                );
              })}
            </div>
          </aside>

          <main className={styles.reader}>
            <div className={styles.readerHeader}>
              <div>
                <span>Selected section</span>
                    <h4>The refinancing wall</h4>
              </div>
              <strong>${SECTION_PRICE.toFixed(2)}</strong>
            </div>

            <div className={styles.passage} aria-hidden="true">
              {PASSAGE_WORDS.map((paragraph, paragraphIndex) => {
                const wordsBefore = PASSAGE_WORDS.slice(0, paragraphIndex).reduce((total, words) => total + words.length, 0);
                return (
                  <p key={paragraphIndex}>
                    {paragraph.map((word, wordIndex) => {
                      const wordNumber = wordsBefore + wordIndex + 1;
                      return (
                        <span
                          className={wordNumber <= wordsRead ? styles.wordRevealed : styles.wordLocked}
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
            <p className={styles.screenReaderStatus} aria-live="polite">
              {wordsRead} of {TOTAL_WORDS} words unlocked. ${spent.toFixed(2)} spent from the ${SPENDING_CAP.toFixed(2)} cap.
            </p>

            <footer className={styles.footer}>
              <div className={`${styles.unlockState}${complete ? ` ${styles.unlockStateDone}` : ""}`}>
                <span className={styles.unlockIcon} aria-hidden="true">
                  <LockKeyhole size={15} className={styles.iconLock} />
                  <Check size={15} className={styles.iconCheck} />
                </span>
                <span>{stateLabel}</span>
              </div>
              <dl className={styles.stats}>
                <div><dt>Words unlocked</dt><dd>{wordsRead} / {TOTAL_WORDS}</dd></div>
                <div><dt>Spent from cap</dt><dd>${spent.toFixed(2)} / ${SPENDING_CAP.toFixed(2)}</dd></div>
              </dl>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
