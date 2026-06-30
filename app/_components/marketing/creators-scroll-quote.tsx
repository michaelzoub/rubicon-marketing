"use client";

import { useScroll } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const QUOTE =
  "\u201CI\u2019m angry that we aren\u2019t being paid for the value that we created for these models. Creators deserve consent, credit and compensation.\u201D";
const ATTRIBUTION = "\u2014 Jack Conte, Patreon CEO";
const ATTRIBUTION_REVEAL_AT = QUOTE.length - 1;

/** Finish typing over the first ~42% of scroll through the quote section. */
const TYPING_SCROLL_FRACTION = 0.42;

interface ScrollRevealTextProps {
  text: string;
  revealedCount: number;
}

function ScrollRevealText({ text, revealedCount }: ScrollRevealTextProps) {
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

function isSectionBelowViewport(section: HTMLElement) {
  return section.getBoundingClientRect().top >= window.innerHeight * 0.96;
}

function getScrollProgress(section: HTMLElement, scrollYProgressValue: number) {
  const fromFramer = Math.max(0, Math.min(1, scrollYProgressValue / TYPING_SCROLL_FRACTION));

  const viewportHeight = window.innerHeight;
  const { top, height } = section.getBoundingClientRect();
  const runway = Math.max(height - viewportHeight * 0.85, viewportHeight * 0.35);
  const traveled = viewportHeight * 0.92 - top;
  const fromGeometry = Math.max(0, Math.min(1, traveled / runway));

  return Math.max(fromFramer, fromGeometry);
}

export function CreatorsScrollQuote() {
  const sectionRef = useRef<HTMLElement>(null);
  const maxProgressRef = useRef(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const quoteLength = QUOTE.length;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.92", "end 0.08"],
  });

  useLayoutEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setRevealedCount(quoteLength);
      return;
    }

    const syncFromScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      if (isSectionBelowViewport(section)) {
        if (maxProgressRef.current > 0) {
          maxProgressRef.current = 0;
          setRevealedCount(0);
        }
        return;
      }

      const progress = getScrollProgress(section, scrollYProgress.get());
      if (progress <= maxProgressRef.current) return;

      maxProgressRef.current = progress;
      setRevealedCount(Math.round(progress * quoteLength));
    };

    syncFromScroll();
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("resize", syncFromScroll);
    };
  }, [quoteLength, reduceMotion, scrollYProgress]);

  const showAttribution = reduceMotion || revealedCount >= ATTRIBUTION_REVEAL_AT;

  return (
    <section ref={sectionRef} className="creators-scroll-quote" aria-label="Quote from Jack Conte, Patreon CEO">
      <div className="creators-scroll-quote-sticky">
        <div className="container creators-scroll-quote-inner">
          <blockquote className="creators-scroll-quote-block">
            <p className="creators-scroll-quote-text">
              <ScrollRevealText text={QUOTE} revealedCount={revealedCount} />
            </p>
            <footer className={`creators-scroll-quote-attribution${showAttribution ? " is-visible" : ""}`}>
              <span className="creators-scroll-quote-attribution-text">{ATTRIBUTION}</span>
            </footer>
            <span className="sr-only">
              {QUOTE} {ATTRIBUTION}
            </span>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
