"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const PRICE_PER_WORD = 0.00001;
const WORDS = "Agents read only the passage they need. Each word unlocks as a tiny payment settles, and the writer earns instantly.".split(" ");
const ease = [0.16, 1, 0.3, 1] as const;

export function StreamTheater({ compact = false, embedded = false }: { compact?: boolean; embedded?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(rootRef, { amount: 0.35, margin: "0px 0px -48px 0px" });
  const [wordsRead, setWordsRead] = useState(0);

  useEffect(() => {
    if (!inView) {
      setWordsRead(0);
      return;
    }

    const interval = window.setInterval(() => {
      setWordsRead((current) => (current >= WORDS.length ? 0 : current + 1));
    }, 360);

    return () => window.clearInterval(interval);
  }, [inView]);

  const paid = (wordsRead * PRICE_PER_WORD).toFixed(5);
  const progress = Math.max(4, (wordsRead / WORDS.length) * 100);

  return (
    <div ref={rootRef} className={`stream-simple${compact ? " stream-simple--compact" : ""}${embedded ? " stream-simple--embedded" : ""}`}>
      <div className="stream-simple-header">
        <span>Live reading</span>
        <span className="stream-simple-status"><i aria-hidden="true" /> Pay per word</span>
      </div>

      <div className="stream-simple-content">
        <div className="stream-simple-route" aria-label="Payment route">
          <span>Buyer agent</span>
          <div className="stream-simple-line"><motion.i animate={{ left: `${progress}%` }} transition={{ duration: 0.32, ease }} /></div>
          <span>Writer</span>
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
      </div>

      <div className="stream-simple-footer">
        <div><span>Words read</span><strong>{wordsRead}</strong></div>
        <div><span>Writer earned</span><strong>${paid}</strong></div>
      </div>
    </div>
  );
}
