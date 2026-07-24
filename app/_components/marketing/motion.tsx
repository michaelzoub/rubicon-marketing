"use client";

import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { ComponentProps, ReactNode } from "react";

gsap.registerPlugin(useGSAP);

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText);
}

/**
 * Rubicon's marketing motion language.
 *
 * Timings are deliberately few: feedback is immediate, state changes are
 * concise, and editorial reveals have enough room to feel composed. None of
 * the curves overshoot. Keep new marketing motion on these tokens so separate
 * product scenes still feel like one directed film.
 */
export const motionDuration = {
  press: 0.14,
  fast: 0.18,
  state: 0.28,
  reveal: 0.48,
  hero: 0.64,
} as const;

export const motionEase = {
  out: [0.23, 1, 0.32, 1] as const,
  move: [0.65, 0, 0.35, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
} as const;

export const motionStagger = {
  item: 0.044,
  group: 0.09,
} as const;

/**
 * GSAP primitives for directed landing-page compositions. Framer exports below
 * remain for the other marketing routes while the homepage moves to GSAP.
 */
export const rubiconMotion = {
  duration: {
    micro: 0.18,
    state: 0.28,
    exit: 0.2,
    section: 0.82,
    hero: 0.86,
  },
  ease: {
    enter: "power4.out",
    state: "power2.inOut",
    exit: "power2.in",
  },
  stagger: {
    line: 0.08,
    item: 0.045,
  },
} as const;

export { gsap, SplitText, useGSAP };

// Backwards-compatible name used by existing marketing compositions.
export const ease = motionEase.out;

export const marketingViewport = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -7%",
} as const;

export function MarketingMotionConfig({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: motionDuration.state, ease: motionEase.out }}>
      {children}
    </MotionConfig>
  );
}

type LandingRevealProps = Omit<ComponentProps<typeof motion.div>, "initial" | "whileInView" | "transition" | "viewport"> & {
  children: ReactNode;
  delay?: number;
};

/** A once-only, composition-level scroll reveal that is readable from frame one. */
export function LandingReveal({ children, delay = 0, ...props }: LandingRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      initial={reduceMotion ? false : { opacity: 0.82, transform: "translate3d(0, 10px, 0)" }}
      whileInView={{ opacity: 1, transform: "translate3d(0, 0px, 0)" }}
      viewport={marketingViewport}
      transition={
        reduceMotion
          ? { duration: motionDuration.fast }
          : { duration: motionDuration.reveal, delay, ease: motionEase.out }
      }
    >
      {children}
    </motion.div>
  );
}

export const heroGroup = {
  initial: {},
  enter: {
    transition: {
      delayChildren: 0.06,
      staggerChildren: motionStagger.group,
    },
  },
} as const;

export const heroItem = {
  initial: { opacity: 0.72, transform: "translate3d(0, 12px, 0)" },
  enter: {
    opacity: 1,
    transform: "translate3d(0, 0px, 0)",
    transition: { duration: motionDuration.hero, ease: motionEase.out },
  },
} as const;

export const heroArtwork = {
  initial: { opacity: 0.68, clipPath: "inset(0 0 5% 0 round 18px)" },
  enter: {
    opacity: 1,
    clipPath: "inset(0 0 0% 0 round 18px)",
    transition: { duration: 0.72, delay: 0.34, ease: motionEase.out },
  },
} as const;

/** Shared Framer props retained for marketing routes that spread them directly. */
export const fade = {
  initial: { opacity: 0.82, transform: "translate3d(0, 10px, 0)" },
  whileInView: { opacity: 1, transform: "translate3d(0, 0px, 0)" },
  viewport: marketingViewport,
  transition: { duration: motionDuration.reveal, ease: motionEase.out },
} as const;

export const cardGrid = {
  hidden: {},
  show: { transition: { staggerChildren: motionStagger.item, delayChildren: 0.04 } },
} as const;

export const cardItem = {
  hidden: { opacity: 0.84, transform: "translate3d(0, 10px, 0)" },
  show: {
    opacity: 1,
    transform: "translate3d(0, 0px, 0)",
    transition: { duration: motionDuration.reveal, ease: motionEase.out },
  },
} as const;

export const cardGridProps = {
  variants: cardGrid,
  initial: "hidden",
  whileInView: "show",
  viewport: marketingViewport,
} as const;
