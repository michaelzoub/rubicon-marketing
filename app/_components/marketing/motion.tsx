import { motion, useReducedMotion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

export const ease = [0.16, 1, 0.3, 1] as const;

type LandingRevealProps = Omit<ComponentProps<typeof motion.div>, "initial" | "whileInView" | "transition" | "viewport"> & {
  children: ReactNode;
};

/**
 * A shared, intentionally restrained entrance for the landing page.
 * It only moves compositor-friendly properties and becomes an immediate render
 * for people who ask for reduced motion.
 */
export function LandingReveal({ children, ...props }: LandingRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16, margin: "0px 0px -8%" }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.52 }}
    >
      {children}
    </motion.div>
  );
}

export const fade = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease },
} as const;

export const cardGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.06 } },
} as const;

export const cardItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
} as const;

export const cardGridProps = {
  variants: cardGrid,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, amount: 0.2 },
} as const;
