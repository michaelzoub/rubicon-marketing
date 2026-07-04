"use client";

import { useInView } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const QUOTE =
  "\u201CI\u2019m angry that we aren\u2019t being paid for the value that we created for these models. Creators deserve consent, credit and compensation.\u201D";
const ATTRIBUTION = "\u2014 Jack Conte, Patreon CEO";
const ATTRIBUTION_REVEAL_AT = QUOTE.length - 1;
const CHAR_MS = 26;

interface TypewriterTextProps {
  text: string;
  revealedCount: number;
}

function TypewriterText({ text, revealedCount }: TypewriterTextProps) {
  return (
    <span aria-hidden="true">
      {text.split("").map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={`creators-scroll-quote-char${index < revealedCount ? " is-revealed" : " is-pending"}`}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export function CreatorsScrollQuote() {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const hasStartedRef = useRef(false);

  const quoteLength = QUOTE.length;
  const inView = useInView(sectionRef, { amount: 0.38, once: true });

  useLayoutEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setRevealedCount(quoteLength);
      return;
    }

    if (!inView || hasStartedRef.current) return;

    hasStartedRef.current = true;
    setRevealedCount(0);

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setRevealedCount(index);
      if (index >= quoteLength) window.clearInterval(timer);
    }, CHAR_MS);

    return () => window.clearInterval(timer);
  }, [inView, quoteLength, reduceMotion]);

  const showAttribution = reduceMotion || revealedCount >= ATTRIBUTION_REVEAL_AT;

  return (
    <section
      ref={sectionRef}
      className="creators-scroll-quote"
      aria-label="Quote from Jack Conte, Patreon CEO"
      data-analytics-section="creator_quote"
      data-analytics-section-index="2"
    >
      <div className="container">
        <blockquote className="creators-scroll-quote-block">
          <p className="creators-scroll-quote-text">
            <TypewriterText text={QUOTE} revealedCount={revealedCount} />
          </p>
          <footer className={`creators-scroll-quote-attribution${showAttribution ? " is-visible" : ""}`}>
            <span className="creators-scroll-quote-attribution-text">{ATTRIBUTION}</span>
          </footer>
          <span className="sr-only">
            {QUOTE} {ATTRIBUTION}
          </span>
        </blockquote>
      </div>
    </section>
  );
}
