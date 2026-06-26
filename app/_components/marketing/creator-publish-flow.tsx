"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Link2,
  MousePointer2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardFrame } from "../../dashboard/_components/shell";
import { Card, PageHeader } from "../../dashboard/_components/ui";

/**
 * A self-driving, looping simulation of the real "New article" publishing
 * wizard — rendered inside the actual dashboard chrome (DashboardFrame) and
 * reusing the dashboard's own building blocks and styles. It mirrors
 * app/dashboard/articles/new/page.tsx step for step (Add article → Review
 * sections → Choose pricing → Publish → Published) with simulated typing,
 * a cursor, and button presses, so the marketing page shows the genuine
 * dashboard UI rather than a snippet of the demo video.
 */

const STEPS = ["Add your article", "Review sections", "Choose pricing", "Publish"] as const;

const TITLE = "The Hidden Economics of Resale Fees";
const AUTHOR = "Mara Chen";
const BODY =
  "The resale fee applies only when the asset transfers through a covered secondary-market venue. It is assessed against the realized sale price, not the appraised value, and the seller of record remains liable until settlement clears.";
const PRICE = "0.00005";

const SECTIONS: Array<[string, string]> = [
  ["Market background", "842"],
  ["Consent Decree Language", "137"],
  ["Secondary-market mechanics", "1,439"],
];

// Absolute timeline boundaries (ms). The loop restarts at END.
const T = {
  s1: 4200,
  s1Click: 3600,
  s2: 6400,
  s2Click: 5800,
  s3: 9600,
  s3Click: 9000,
  s4: 12200,
  s4Click: 11600,
  published: 12200,
  end: 16000,
} as const;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const sliceText = (text: string, p: number) => text.slice(0, Math.round(text.length * clamp(p)));
const pressingAt = (t: number, start: number) => t >= start && t < start + 460;

export function CreatorPublishFlow() {
  return (
    <div className="creator-publish-flow" aria-hidden="true" tabIndex={-1}>
      <DashboardFrame identity="@writer" activePath="/dashboard/articles">
        <PublishWizard />
      </DashboardFrame>
    </div>
  );
}

function PublishWizard() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(reduce ? T.published + 1200 : 0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) % T.end);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const step = t < T.s1 ? 0 : t < T.s2 ? 1 : t < T.s3 ? 2 : t < T.published ? 3 : 4;

  return (
    <div className="grid gap-6">
      <PageHeader title="New article" description="Saved as a draft first. Nothing goes live until you publish." />

      {step < 4 && <Stepper current={Math.min(step, 3)} />}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="cpf-step"
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(4px)", transition: { duration: 0.25 } }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 0 && <StepAddArticle t={t} />}
          {step === 1 && <StepReviewSections t={t} />}
          {step === 2 && <StepPricing t={t} />}
          {step === 3 && <StepPublish t={t} />}
          {step === 4 && <StepPublished />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- shared wizard chrome (mirrors the real new-article page) ---------- */

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
              active
                ? "bg-[var(--river-pale)] text-[var(--river-deep)]"
                : done
                  ? "bg-[#e8f6ef] text-[#165c3e]"
                  : "bg-[var(--surface-muted)] text-[var(--muted)]"
            }`}
          >
            <span className="mono text-xs">{i + 1}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

const inputClass =
  "h-11 rounded-lg bg-[var(--surface-muted)] px-3 outline-none transition flex items-center";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

function Caret() {
  return <span className="cpf-caret" aria-hidden="true" />;
}

/** A primary action button with a hovering cursor that "clicks" on press. */
function PrimaryAction({ label, pressing, icon = "next" }: { label: string; pressing: boolean; icon?: "next" | "none" }) {
  return (
    <span className="relative inline-flex">
      <span className={`button button-primary ${pressing ? "cpf-pressing" : ""}`}>
        {label}
        {icon === "next" && <ArrowRight size={16} aria-hidden="true" />}
      </span>
      <span className={`cpf-cursor ${pressing ? "is-click" : ""}`} aria-hidden="true">
        <MousePointer2 size={18} fill="currentColor" />
      </span>
    </span>
  );
}

function SecondaryButton({ label }: { label: string }) {
  return (
    <span className="button button-secondary">
      <ArrowLeft size={16} aria-hidden="true" /> {label}
    </span>
  );
}

/* ---------- Step 0: Add your article ---------- */

function StepAddArticle({ t }: { t: number }) {
  const titleText = sliceText(TITLE, (t - 200) / 1100);
  const authorActive = t > 1500;
  const authorText = sliceText(AUTHOR, (t - 1600) / 600);
  const bodyActive = t > 2300;
  const bodyText = sliceText(BODY, (t - 2400) / 1100);
  const focus = t < 1500 ? "title" : t < 2300 ? "author" : "body";

  return (
    <Card className="p-6">
      <div className="grid gap-5">
        <Field label="Article title">
          <div className={`${inputClass} ${focus === "title" ? "cpf-input-focus" : ""}`}>
            <span>{titleText}</span>
            {focus === "title" && <Caret />}
          </div>
        </Field>
        <Field label="Author">
          <div className={`${inputClass} ${focus === "author" ? "cpf-input-focus" : ""}`}>
            <span>{authorActive ? authorText : <span className="text-[var(--muted)]">Author name</span>}</span>
            {focus === "author" && <Caret />}
          </div>
        </Field>
        <Field
          label="Editor"
          hint="Paste a whole article from Substack or X, or write it here. Headers and subheaders become sections agents can navigate."
        >
          <div className={`min-h-[120px] rounded-lg bg-[var(--surface-muted)] p-3 text-sm leading-6 ${focus === "body" ? "cpf-input-focus" : ""}`}>
            <strong className="font-semibold">Consent Decree Language</strong>
            <p className="mt-1 text-[var(--muted)]">
              {bodyActive ? bodyText : <span className="text-[var(--muted)]">Paste your article from Substack or X, or start writing…</span>}
              {focus === "body" && <Caret />}
            </p>
          </div>
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <span className="button button-secondary text-sm">
            <Upload size={15} aria-hidden="true" /> Upload Markdown
          </span>
          <span className="button button-secondary text-sm">
            <Link2 size={15} aria-hidden="true" /> Import from URL
          </span>
        </div>
      </div>
      <div className="mt-6 flex justify-end pt-2">
        <PrimaryAction label="Review sections" pressing={pressingAt(t, T.s1Click)} />
      </div>
    </Card>
  );
}

/* ---------- Step 1: Review sections ---------- */

function StepReviewSections({ t }: { t: number }) {
  const local = t - T.s1;
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Sections agents can navigate</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Section titles help your seller agent guide buyers without revealing unpaid text. Rename, reorder, or exclude any
        section.
      </p>
      <ul className="mt-5 grid gap-3">
        {SECTIONS.map(([title, words], index) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={local > index * 220 + 120 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-lg bg-[var(--surface-muted)] p-4"
          >
            <div className="flex flex-col text-[var(--muted)]">
              <ChevronUp size={16} aria-hidden="true" />
              <ChevronDown size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="py-1 font-medium">{title}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{words} words</div>
            </div>
          </motion.li>
        ))}
      </ul>
      <div className="mt-6 flex justify-between pt-2">
        <SecondaryButton label="Back" />
        <PrimaryAction label="Choose pricing" pressing={pressingAt(t, T.s2Click)} />
      </div>
    </Card>
  );
}

/* ---------- Step 2: Choose pricing ---------- */

function StepPricing({ t }: { t: number }) {
  const local = t - T.s2;
  const priceText = sliceText(PRICE, (local - 300) / 1100);
  const priced = priceText.length === PRICE.length;
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Choose pricing</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Set what agents pay to read. You earn for exactly the words they read.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          <Field label="Price per word" hint="Agents pay only for the words they reveal. You can update pricing anytime.">
            <div className="flex h-11 items-center gap-2 rounded-lg bg-[var(--surface-muted)] px-3 cpf-input-focus">
              <span className="shrink-0 text-[var(--muted)]">$</span>
              <span>{priceText || <span className="text-[var(--muted)]">0.0001</span>}</span>
              <Caret />
            </div>
          </Field>
        </div>

        <div className="rounded-xl bg-[var(--surface-muted)] p-5">
          <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Pricing preview</div>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row term="Price per word" value={priced ? "$0.00005" : "$0.00"} />
            <Row term="Estimated full-article price" value={priced ? "$0.1209" : "$0.00"} hint="2,418 words" />
            <Row term="Earnings for 1,000 words" value={priced ? "$0.0500" : "$0.00"} />
            <Row term="Rubicon platform fee" value="0%" />
          </dl>
        </div>
      </div>

      <div className="mt-6 flex justify-between pt-2">
        <SecondaryButton label="Back" />
        <PrimaryAction label="Review" pressing={pressingAt(t, T.s3Click)} />
      </div>
    </Card>
  );
}

/* ---------- Step 3: Review and publish ---------- */

function StepPublish({ t }: { t: number }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Review and publish</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Confirm the details below. You can save a draft or publish it live to agents.</p>

      <dl className="mt-5 grid gap-3 rounded-xl bg-[var(--surface-muted)] p-5 text-sm">
        <Row term="Article title" value={TITLE} />
        <Row term="Word count" value="2,418" />
        <Row term="Sections" value="3" />
        <Row term="Price per word" value="$0.00005" />
        <Row term="Estimated full price" value="$0.1209" />
        <Row term="Receiving wallet" value={<span className="mono">0x8f2…91c ✓</span>} />
        <Row term="Platform fee" value="0%" />
        <Row term="Article status" value="Draft until published" />
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
        <SecondaryButton label="Back" />
        <div className="flex flex-wrap items-center gap-3">
          <span className="button button-secondary">Save draft</span>
          <PrimaryAction label="Publish article" pressing={pressingAt(t, T.s4Click)} icon="none" />
        </div>
      </div>
      <p className="mt-3 text-right text-xs text-[var(--muted)]">
        Agents can preview metadata, but paid content remains hidden until purchased.
      </p>
    </Card>
  );
}

/* ---------- Step 4: Published ---------- */

function StepPublished() {
  return (
    <Card className="p-10">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
      >
        <motion.span
          className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f6ef] text-[#165c3e]"
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          <Check size={28} aria-hidden="true" />
        </motion.span>
        <h2 className="mt-5 text-xl font-semibold">Article published</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
          “{TITLE}” is live to agents — 3 navigable sections at $0.00005 per word, 0% platform fee.
        </p>
        <span className="mt-6 button button-primary">
          View article <ArrowRight size={16} aria-hidden="true" />
        </span>
      </motion.div>
    </Card>
  );
}

function Row({ term, value, hint }: { term: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 rounded-[14px] px-3 py-2 even:bg-[var(--surface-muted)]">
      <dt className="text-[var(--muted)]">{term}</dt>
      <dd className="text-right font-medium">
        {value}
        {hint && <span className="ml-2 text-xs font-normal text-[var(--muted)]">{hint}</span>}
      </dd>
    </div>
  );
}
