"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { useRubiconMutation, useRubiconQuery } from "@/lib/rubicon/hooks";
import {
  atomicForWords,
  formatUsd,
  usdToAtomic,
} from "@/lib/rubicon/pricing";
import { parseSections } from "@/lib/rubicon/sections";
import type { ArticleSectionInput } from "@/lib/rubicon/types";
import { MarkdownEditor } from "../../_components/markdown-editor";
import { Card, PageHeader, shortWallet, WalletStatePill } from "../../_components/ui";

interface EditableSection {
  title: string;
  wordCount: number;
}

const steps = ["Add your article", "Review sections", "Choose pricing", "Publish"] as const;

export default function NewArticlePage() {
  const router = useRouter();
  const creator = useRubiconQuery((c) => c.getCreator(), []);
  const wallet = useRubiconQuery((c) => c.getWallet(), []);
  const createArticle = useRubiconMutation((c, ...args: Parameters<typeof c.createArticle>) => c.createArticle(...args));
  const publishArticle = useRubiconMutation((c, id: string) => c.publishArticle(id));

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [sections, setSections] = useState<EditableSection[]>([]);
  const lastParsed = useRef<string>("");

  const [pricePerWord, setPricePerWord] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill the schema-required author from the creator display name once.
  const prefilledAuthor = useRef(false);
  useEffect(() => {
    if (prefilledAuthor.current) return;
    const displayName = creator.data?.displayName;
    if (!displayName) return;
    setAuthor(displayName);
    prefilledAuthor.current = true;
  }, [creator.data?.displayName]);

  function enterReview() {
    if (content !== lastParsed.current) {
      const parsed = parseSections(content);
      setSections(parsed.map((s) => ({ title: s.title, wordCount: s.wordCount })));
      lastParsed.current = content;
    }
    setStep(1);
  }

  const includedWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
  const atomicPerWord = pricePerWord ? usdToAtomic(Number(pricePerWord)) : "0";
  const estFullPrice = atomicForWords(atomicPerWord, includedWords);

  function buildInput() {
    const sectionInput: ArticleSectionInput[] = sections.map((s, i) => ({
      heading: s.title,
      ordinal: i,
    }));
    return {
      title: title.trim(),
      author: author.trim(),
      body: content,
      sections: sectionInput,
      pricePerWordAtomic: atomicPerWord,
      maxArticlePriceAtomic: null,
    };
  }

  async function submit(publish: boolean) {
    setSubmitError(null);
    try {
      const article = await createArticle.run(buildInput());
      if (publish) await publishArticle.run(article.id);
      router.push(`/dashboard/articles/${article.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save the article.");
    }
  }

  const submitting = createArticle.pending || publishArticle.pending;

  return (
    <div className="grid gap-6">
      <PageHeader title="New article" description="Add your content, review sections, choose a price, and publish." />

      <Stepper current={step} />

      {step === 0 && (
        <StepAddArticle
          title={title}
          author={author}
          content={content}
          onTitle={setTitle}
          onAuthor={setAuthor}
          onContent={setContent}
          onNext={enterReview}
        />
      )}

      {step === 1 && (
        <StepReviewSections
          sections={sections}
          onChange={setSections}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepPricing
          pricePerWord={pricePerWord}
          atomicPerWord={atomicPerWord}
          includedWords={includedWords}
          estFullPrice={estFullPrice}
          onPrice={setPricePerWord}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepPublish
          title={title}
          includedWords={includedWords}
          sectionCount={sections.length}
          atomicPerWord={atomicPerWord}
          estFullPrice={estFullPrice}
          walletAddress={wallet.data?.address ?? null}
          walletVerified={wallet.data?.verified ?? false}
          submitting={submitting}
          error={submitError}
          onBack={() => setStep(2)}
          onSaveDraft={() => submit(false)}
          onPublish={() => submit(true)}
        />
      )}
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              active
                ? "border-[var(--river)] bg-[var(--river-pale)] text-[var(--river-deep)]"
                : done
                  ? "border-[#69b88c] bg-[#e8f6ef] text-[#165c3e]"
                  : "border-[var(--line)] bg-white text-[var(--muted)]"
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

const inputClass =
  "h-11 rounded-lg border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]";

function StepAddArticle({
  title,
  author,
  content,
  onTitle,
  onAuthor,
  onContent,
  onNext,
}: {
  title: string;
  author: string;
  content: string;
  onTitle: (v: string) => void;
  onAuthor: (v: string) => void;
  onContent: (v: string) => void;
  onNext: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onContent(text);
    if (!title) onTitle(file.name.replace(/\.(md|markdown|txt)$/i, ""));
  }

  const ready = title.trim() && author.trim() && content.trim();

  return (
    <Card className="p-6">
      <div className="grid gap-5">
        <Field label="Article title">
          <input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="A clear, descriptive title" className={inputClass} />
        </Field>
        <Field label="Author">
          <input value={author} onChange={(e) => onAuthor(e.target.value)} placeholder="Author name" className={inputClass} />
        </Field>
        <Field label="Editor" hint="Paste a whole article from Substack or X, or write it here. Each heading starts a new section — shown boxed below — and becomes a section agents can navigate.">
          <MarkdownEditor
            value={content}
            onChange={onContent}
            placeholder="Paste your article from Substack or X, or start writing…"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".md,.markdown,.txt" onChange={onUpload} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="button button-secondary text-sm">
            <Upload size={15} aria-hidden="true" /> Upload Markdown
          </button>
        </div>
      </div>
      <div className="mt-6 flex justify-end border-t border-[var(--faint)] pt-5">
        <button type="button" onClick={onNext} disabled={!ready} className="button button-primary disabled:opacity-50">
          Review sections <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}

function StepReviewSections({
  sections,
  onChange,
  onBack,
  onNext,
}: {
  sections: EditableSection[];
  onChange: (s: EditableSection[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  function update(index: number, patch: Partial<EditableSection>) {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Sections agents can navigate</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Section titles help your seller agent guide buyers without revealing unpaid text. Rename, reorder, or exclude any section.
      </p>

      {sections.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">
          No headings detected. Your article will be offered as a single section. Add Markdown <code className="mono">#</code> headings to split it.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {sections.map((section, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-lg border border-[var(--line)] bg-white p-4 sm:grid-cols-[auto_1fr] sm:items-center"
            >
              <div className="flex flex-col">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-30" aria-label="Move up">
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === sections.length - 1} className="text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-30" aria-label="Move down">
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="min-w-0">
                <input
                  value={section.title}
                  onChange={(e) => update(index, { title: e.target.value })}
                  className="w-full rounded-md border border-transparent bg-transparent py-1 font-medium outline-none hover:border-[var(--faint)] focus:border-[var(--river)]"
                />
                <div className="mt-1 text-xs text-[var(--muted)]">{section.wordCount.toLocaleString()} words</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-between border-t border-[var(--faint)] pt-5">
        <button type="button" onClick={onBack} className="button button-secondary">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <button type="button" onClick={onNext} className="button button-primary">
          Choose pricing <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}

function StepPricing({
  pricePerWord,
  atomicPerWord,
  includedWords,
  estFullPrice,
  onPrice,
  onBack,
  onNext,
}: {
  pricePerWord: string;
  atomicPerWord: string;
  includedWords: number;
  estFullPrice: string;
  onPrice: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const valid = Number(atomicPerWord) > 0;
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Choose pricing</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Set what agents pay to read. You earn for exactly the words they read.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5">
          <Field label="Price per word" hint="Enter the USDC amount per word. Minimum billable value is 0.000001.">
            <div className="flex items-center rounded-lg border border-[var(--line)] focus-within:border-[var(--river)]">
              <span className="px-3 text-[var(--muted)]">$</span>
              <input
                value={pricePerWord}
                onChange={(e) => onPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="0.0001"
                className="h-11 w-full rounded-r-lg border-0 px-0 outline-none"
              />
            </div>
          </Field>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-5">
          <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Pricing preview</div>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row term="Price per word" value={formatUsd(atomicPerWord)} />
            <Row term="Estimated full-article price" value={`${formatUsd(estFullPrice)}`} hint={`${includedWords.toLocaleString()} words`} />
            <Row term="Earnings for 100 words" value={formatUsd(atomicForWords(atomicPerWord, 100))} />
            <Row term="Earnings for 1,000 words" value={formatUsd(atomicForWords(atomicPerWord, 1000))} />
            <Row term="Rubicon platform fee" value="0%" />
          </dl>
          <p className="mt-4 border-t border-[var(--faint)] pt-3 text-xs leading-5 text-[var(--muted)]">
            Estimates use a preview word count. Billing always reflects the exact words an agent reads, measured by Rubicon.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-between border-t border-[var(--faint)] pt-5">
        <button type="button" onClick={onBack} className="button button-secondary">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <button type="button" onClick={onNext} disabled={!valid} className="button button-primary disabled:opacity-50">
          Review <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}

function StepPublish({
  title,
  includedWords,
  sectionCount,
  atomicPerWord,
  estFullPrice,
  walletAddress,
  walletVerified,
  submitting,
  error,
  onBack,
  onSaveDraft,
  onPublish,
}: {
  title: string;
  includedWords: number;
  sectionCount: number;
  atomicPerWord: string;
  estFullPrice: string;
  walletAddress: string | null;
  walletVerified: boolean;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  const noWallet = !walletAddress;
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Review and publish</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Confirm the details below. You can save a draft or publish it live to agents.</p>

      <dl className="mt-5 grid gap-3 rounded-xl border border-[var(--line)] p-5 text-sm">
        <Row term="Article title" value={title || "Untitled"} />
        <Row term="Word count" value={includedWords.toLocaleString()} />
        <Row term="Sections" value={sectionCount.toLocaleString()} />
        <Row term="Price per word" value={formatUsd(atomicPerWord)} />
        <Row term="Estimated full price" value={formatUsd(estFullPrice)} />
        <Row
          term="Receiving wallet"
          value={
            <span className="flex items-center gap-2">
              <span className="mono">{shortWallet(walletAddress)}</span>
              {walletAddress && <WalletStatePill verified={walletVerified} />}
            </span>
          }
        />
        <Row term="Platform fee" value="0%" />
        <Row term="Article status" value="Draft until published" />
      </dl>

      {noWallet && (
        <p className="mt-4 rounded-lg border border-[#e7c9a3] bg-[#fdf6ec] px-4 py-3 text-sm text-[#7b4e12]">
          You can save this as a draft now. Connect a receiving wallet in Settings before publishing so payments have somewhere to go.
        </p>
      )}

      {error && <p className="mt-4 rounded-lg border border-[#e3a2a0] bg-[#fff1f0] px-4 py-3 text-sm text-[#8d2f2d]">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--faint)] pt-5">
        <button type="button" onClick={onBack} className="button button-secondary">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onSaveDraft} disabled={submitting} className="button button-secondary disabled:opacity-50">
            Save draft
          </button>
          <button type="button" onClick={onPublish} disabled={submitting || noWallet} className="button button-primary disabled:opacity-50">
            {submitting ? "Publishing…" : "Publish article"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function Row({ term, value, hint }: { term: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[var(--faint)] pb-3 last:border-0 last:pb-0">
      <dt className="text-[var(--muted)]">{term}</dt>
      <dd className="text-right font-medium">
        {value}
        {hint && <span className="ml-2 text-xs font-normal text-[var(--muted)]">{hint}</span>}
      </dd>
    </div>
  );
}
