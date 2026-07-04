"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  trackWriterExitCancelled,
  trackWriterExitConfirmed,
  trackWriterObjectionSelected,
  type WriterExitProperties,
  type WriterObjection,
} from "../../_components/analytics/events";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const OBJECTION_OPTIONS: ReadonlyArray<{ value: WriterObjection; label: string }> = [
  { value: "not_sure_agents_will_pay", label: "I’m not sure agents will actually pay" },
  { value: "pricing_unclear", label: "I don’t understand how pricing works" },
  { value: "wallet_concern", label: "I don’t want to connect a wallet yet" },
  { value: "content_exposure_concern", label: "I’m worried about exposing my content" },
  { value: "setup_too_much_work", label: "Setup/import feels like too much work" },
  { value: "waiting_for_mainnet", label: "I’m waiting for mainnet" },
  { value: "just_browsing", label: "I was just browsing" },
  { value: "other", label: "Other" },
];

// One gentle prompt per session, across every placement (auth screen, import
// failure, empty dashboard). Product learning, not a hostage negotiation.
const PROMPT_SEEN_KEY = "rubicon_writer_objection_prompt_seen";

export function hasSeenObjectionPrompt(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(PROMPT_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markObjectionPromptSeen(): void {
  try {
    window.sessionStorage.setItem(PROMPT_SEEN_KEY, "1");
  } catch {
    // best-effort
  }
}

/**
 * Where "home" is for a writer leaving the app. On the app deployment
 * (app.rubiconpay.xyz) the local root redirects back into /dashboard, so home
 * has to be the marketing site itself.
 */
export function marketingHomeHref(): string {
  if (typeof window !== "undefined" && window.location.hostname.startsWith("app.")) {
    return "https://rubiconpay.xyz/";
  }
  return "/";
}

/**
 * Exit-intent dialog: shown when a writer explicitly heads for the door.
 * The opener is responsible for `trackWriterExitIntentOpened` and the
 * session guard; this dialog handles selection, the three buttons, and the
 * cancel/confirm events.
 */
export function WriterObjectionDialog({
  open,
  context,
  leaveHref,
  onClose,
}: {
  open: boolean;
  /** page/section/flow_step (+ auth flags) attached to every exit event. */
  context: WriterExitProperties;
  leaveHref: string;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [objection, setObjection] = useState<WriterObjection | null>(null);

  useEffect(() => {
    if (open) setObjection(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function cancel() {
    trackWriterExitCancelled(context);
    onClose();
  }

  function leave() {
    if (objection) {
      trackWriterObjectionSelected({ ...context, objection });
    }
    trackWriterExitConfirmed({ ...context, objection: objection ?? undefined });
    window.location.href = leaveHref;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
          onClick={cancel}
          role="presentation"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="writer-objection-title"
            className="w-full max-w-md rounded-lg border border-black/[0.08] bg-white p-6 text-left shadow-xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: EASE_OUT }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="writer-objection-title" className="text-lg font-semibold tracking-[-0.01em] text-[#171717]">
              What’s stopping you from listing your first article?
            </h2>
            <p className="mt-1 text-sm text-[#73757c]">Optional — this helps us improve Rubicon for writers.</p>

            <div className="mt-4 grid gap-1" role="radiogroup" aria-label="Reason for leaving">
              {OBJECTION_OPTIONS.map((option) => {
                const selected = objection === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      selected ? "bg-[#f1f1f2] font-medium text-[#171717]" : "text-[#3f4147] hover:bg-[#f7f7f8]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="writer-objection"
                      value={option.value}
                      checked={selected}
                      onChange={() => setObjection(option.value)}
                      className="accent-[#171717]"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={leave}
                className="rounded-md px-3.5 py-2 text-sm font-medium text-[#73757c] transition-colors hover:text-[#171717]"
              >
                {objection ? "Submit and go home" : "Go home"}
              </button>
              <button type="button" onClick={cancel} className="button button-primary text-sm">
                Continue listing
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact, non-modal objection question for drop-off states (import failure,
 * empty dashboard). Renders nothing once the session's one prompt has been
 * used; consumes the session budget when it appears.
 */
export function WriterObjectionInline({
  context,
  className = "",
}: {
  context: WriterExitProperties;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [objection, setObjection] = useState<WriterObjection | "">("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (hasSeenObjectionPrompt()) return;
    markObjectionPromptSeen();
    setVisible(true);
  }, []);

  if (!visible) return null;

  function submit() {
    if (!objection) return;
    trackWriterObjectionSelected({ ...context, objection });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={`rounded-lg bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)] ${className}`}>
        Thanks — this genuinely helps us make listing easier.
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-[var(--surface-muted)] p-4 ${className}`}>
      <p className="text-sm font-medium text-[var(--ink)]">What’s stopping you from listing your first article?</p>
      <p className="mt-0.5 text-xs text-[var(--muted)]">Optional — this helps us improve Rubicon for writers.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={objection}
          onChange={(event) => setObjection(event.target.value as WriterObjection | "")}
          className="h-9 min-w-0 flex-1 rounded-md bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--river-line)]"
          aria-label="Reason"
        >
          <option value="">Choose a reason…</option>
          {OBJECTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={submit} disabled={!objection} className="button button-secondary text-sm disabled:opacity-40">
          Send
        </button>
      </div>
    </div>
  );
}
