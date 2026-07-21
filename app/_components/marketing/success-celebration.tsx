"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const CONFETTI = [
  [-150, -250, -38, "#246bfd"], [-112, -292, 42, "#18181b"], [-72, -235, -76, "#62c79b"],
  [-36, -320, 88, "#f0b64d"], [0, -260, -28, "#246bfd"], [34, -305, 64, "#e46d67"],
  [70, -242, -54, "#18181b"], [108, -286, 36, "#62c79b"], [148, -252, -82, "#f0b64d"],
  [-132, -190, 70, "#e46d67"], [-88, -214, -44, "#246bfd"], [-48, -178, 92, "#62c79b"],
  [46, -196, -62, "#f0b64d"], [88, -218, 52, "#e46d67"], [130, -188, -96, "#246bfd"],
] as const;

/** Shared with rubicon-app's original Copy success burst. */
export function SuccessCelebration({ active, celebrationKey }: { active: boolean; celebrationKey: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {active && <div key={celebrationKey} className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden="true">
        {CONFETTI.map(([x, y, rotate, color], index) => (
          <motion.span
            key={`${x}-${y}`}
            className="absolute bottom-1/2 left-1/2 h-2.5 w-1.5 rounded-[2px]"
            style={{ background: color }}
            initial={{ opacity: 0, transform: "translate(-50%, 0) rotate(0deg) scale(0.92)" }}
            animate={{ opacity: [0, 1, 1, 0], transform: ["translate(-50%, 0) rotate(0deg) scale(0.92)", `translate(calc(-50% + ${x * .45}px), ${y * .58}px) rotate(${rotate * .45}deg) scale(1)`, `translate(calc(-50% + ${x}px), ${y}px) rotate(${rotate}deg) scale(.96)`, `translate(calc(-50% + ${x * 1.08}px), ${y + 72}px) rotate(${rotate + 80}deg) scale(.9)`] }}
            exit={{ opacity: 0 }} transition={{ duration: .78, delay: index * .018, ease: [0.23, 1, .32, 1] }}
          />
        ))}
      </div>}
    </AnimatePresence>
  );
}
