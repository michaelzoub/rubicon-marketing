"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const PRICE_PER_WORD = 0.00001;
const SELECTIVE_PRICE_PER_WORD = 0.004;
const WORDS = "Agents read only the passage they need. Each word unlocks as a tiny payment settles, and the writer earns instantly.".split(" ");
const ease = [0.16, 1, 0.3, 1] as const;

export function StreamTheater({
  compact = false,
  embedded = false,
  selectiveSpend = false,
}: {
  compact?: boolean;
  embedded?: boolean;
  selectiveSpend?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(rootRef, { amount: 0.35, margin: "0px 0px -48px 0px" });
  const [wordsRead, setWordsRead] = useState(0);

  useEffect(() => {
    if (!inView) {
      setWordsRead(0);
      return;
    }

    const interval = window.setInterval(() => {
      setWordsRead((current) => Math.min(WORDS.length, current + 1));
    }, 360);

    return () => window.clearInterval(interval);
  }, [inView]);

  const accessedWords = selectiveSpend ? wordsRead * 16 : wordsRead;
  const costPerWord = selectiveSpend ? SELECTIVE_PRICE_PER_WORD : PRICE_PER_WORD;
  const paid = (accessedWords * costPerWord).toFixed(selectiveSpend ? 2 : 5);
  const remaining = Math.max(0, 5 - accessedWords * costPerWord).toFixed(2);
  const complete = wordsRead >= WORDS.length;
  const progress = Math.max(4, (wordsRead / WORDS.length) * 100);

  return (
    <div ref={rootRef} className={`stream-simple${compact ? " stream-simple--compact" : ""}${embedded ? " stream-simple--embedded" : ""}`}>
      <div className="stream-simple-header">
        <span>{selectiveSpend ? "Selective passage unlock" : "Live reading"}</span>
        <span className="stream-simple-status"><i aria-hidden="true" /> {selectiveSpend ? "Capped spend" : "Pay per word"}</span>
      </div>

      <div className="stream-simple-content">
        <div className="stream-simple-route" aria-label="Payment route">
          <span>Buyer agent</span>
          <div className="stream-simple-line"><motion.i animate={{ left: `${progress}%` }} transition={{ duration: 0.32, ease }} /></div>
          <span>{selectiveSpend ? "Selected passage" : "Writer"}</span>
        </div>

        <p className="stream-simple-copy" aria-label="Streaming article excerpt">
          {WORDS.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              className={index === wordsRead - 1 ? "stream-simple-word--current" : undefined}
              animate={
                index < wordsRead
                  ? { color: "#171717", opacity: 1, filter: "blur(0px)" }
                  : { color: "#8b8b8b", opacity: 0.34, filter: "blur(5px)" }
              }
              transition={{ duration: 0.18, ease }}
            >
              {word}{index === WORDS.length - 1 ? "" : " "}
            </motion.span>
          ))}
        </p>
        {selectiveSpend && complete ? <p className="stream-simple-cap-note">Stopped after enough evidence was found.</p> : null}
      </div>

      <div className="stream-simple-footer">
        <div><span>{selectiveSpend ? "Words accessed" : "Words read"}</span><strong>{accessedWords}</strong></div>
        <div><span>{selectiveSpend ? "Spent of $5.00 cap" : "Writer earned"}</span><strong>${paid}</strong></div>
        {selectiveSpend ? <div><span>Cap remaining</span><strong>${remaining}</strong></div> : null}
      </div>
    </div>
  );
}
