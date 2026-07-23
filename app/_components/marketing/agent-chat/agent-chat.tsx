"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, ExternalLink, Send, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackClick } from "../../analytics-links";
import { formatUsdNumber } from "@/lib/rubicon/pricing";
import {
  fullReadCost,
  useRubiconAgent,
  type AgentArticleHit,
  type AgentRun,
  type AgentStep,
} from "./use-rubicon-agent";

const accessLabels: Record<AgentArticleHit["state"], string> = {
  found: "Match",
  reviewing: "Reviewing",
  listed: "Ready",
};

const exampleQueries = [
  "What are the biggest limitations to reaching AGI?",
  "Which stablecoin is best for machine-to-machine payments?",
  "Can decentralized AI compete with centralized models?",
  "What makes AI agents reliable in production?",
] as const;

function StepRow({ step }: { step: AgentStep }) {
  return (
    <li className={`agent-chat-step agent-chat-step--${step.state}`}>
      <span className="agent-chat-step-icon" aria-hidden="true">
        {step.state === "active" && <span className="agent-chat-step-spinner" />}
        {step.state === "done" && <Check size={12} strokeWidth={2.5} />}
        {step.state === "error" && <AlertCircle size={12} />}
      </span>
      <span className="agent-chat-step-label">{step.label}</span>
    </li>
  );
}

function ArticleHitCard({ hit }: { hit: AgentArticleHit }) {
  const { article } = hit;
  return (
    <a
      className={`agent-chat-article agent-chat-article--${hit.state}`}
      href={`/explore#creator-${article.creatorId}`}
      onClick={() => trackClick("agent_chat_article_clicked", { article_id: article.id })}
    >
      <span className="agent-chat-article-top">
        <span className="agent-chat-article-title">{article.title}</span>
        <span className={`agent-chat-article-access agent-chat-article-access--${hit.state}`}>
          {hit.state === "reviewing" && <span className="agent-chat-spinner" aria-hidden="true" />}
          {accessLabels[hit.state]}
        </span>
      </span>
      <span className="agent-chat-article-meta">
        <span>@{article.author}</span>
        <span>{formatUsdNumber(article.pricePer1kUsd)} / 1k words</span>
        <span>{article.totalWords.toLocaleString()} words</span>
        <span>≈{fullReadCost(article)} full read</span>
      </span>
      <span className="agent-chat-article-reason">
        {hit.reason}
      </span>
      <span className="agent-chat-article-action">
        Preview <ExternalLink size={11} aria-hidden="true" />
      </span>
    </a>
  );
}

function AgentRunView({ run, onRetry }: { run: AgentRun; onRetry: (query: string) => void }) {
  const running = run.phase !== "done" && run.phase !== "error" && run.phase !== "cancelled";
  return (
    <motion.div
      className="agent-chat-run"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {running && (
        <div className="agent-chat-presence" role="status" aria-live="polite">
          <span className="agent-chat-orb" aria-hidden="true"><i /><b /></span>
          <span>Working</span>
        </div>
      )}
      <ol className="agent-chat-steps" aria-label="Agent progress">
        {run.steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </ol>

      {run.articles.length > 0 && (
        <section className="agent-chat-output" aria-label="Selected sources">
          <span className="agent-chat-output-label">Selected sources</span>
          <div className="agent-chat-articles">
            {run.articles.map((hit) => (
              <ArticleHitCard key={hit.article.id} hit={hit} />
            ))}
          </div>
        </section>
      )}

      {run.answer && (
        <section className="agent-chat-output agent-chat-output--recommendation" aria-label="Agent recommendation">
          <span className="agent-chat-output-label">Recommendation</span>
          <p className="agent-chat-answer">
            {run.answer}
            {running && <span className="agent-chat-caret" aria-hidden="true" />}
          </p>
        </section>
      )}

      {run.phase === "cancelled" && <p className="agent-chat-note">Stopped.</p>}

      {run.phase === "error" && run.error && (
        <div className="agent-chat-error" role="alert">
          <AlertCircle size={13} aria-hidden="true" />
          <span>{run.error}</span>
          <button type="button" onClick={() => onRetry(run.query)}>
            Retry
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function RubiconAgentChat() {
  const { items, busy, ask, cancel, reset } = useRubiconAgent();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const reduceMotion = useReducedMotion();

  const openChat = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    trackClick("agent_chat_opened");
  }, []);

  const closeChat = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const toggleChat = useCallback(() => {
    if (openRef.current) closeChat();
    else openChat();
  }, [closeChat, openChat]);

  // Follow live activity until the visitor scrolls away from the newest item.
  useEffect(() => {
    if (!open || !shouldAutoScrollRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [open, items, reduceMotion]);

  const updateAutoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    shouldAutoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 56;
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeChat, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (anchorRef.current?.contains(event.target as Node)) return;
      closeChat();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeChat, open]);

  const submit = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || busy) return;
      shouldAutoScrollRef.current = true;
      setDraft("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      trackClick("agent_chat_query_submitted");
      void ask(trimmed);
    },
    [ask, busy],
  );

  const startAnotherTask = useCallback(() => {
    if (busy) return;
    reset();
    setDraft("");
    shouldAutoScrollRef.current = true;
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [busy, reset]);

  const spring = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", bounce: 0, duration: 0.28 } as const);

  return (
    <>
      <div ref={anchorRef} className="agent-chat-anchor">
        <AnimatePresence initial={false}>
          {open && (
            <motion.section
              className="agent-chat-panel dashboard-theme"
              role="dialog"
              aria-label="Rubicon research workflow"
              aria-modal="false"
              id="rubicon-agent-chat"
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={spring}
            >
              <header className="agent-chat-header">
                <span className="agent-chat-header-title"><strong>Try the workflow</strong></span>
                <button type="button" onClick={closeChat} aria-label="Close research workflow">
                  <X size={15} aria-hidden="true" />
                </button>
              </header>

              <div className="agent-chat-scroll" ref={scrollRef} onScroll={updateAutoScroll} aria-live="polite" aria-atomic="false">
                {items.length === 0 ? (
                  <div className="agent-chat-empty">
                    <div className="agent-chat-intro">
                      <h2>What are you researching?</h2>
                    </div>
                    <div className="agent-chat-examples">
                      {exampleQueries.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => {
                            trackClick("agent_chat_example_clicked", { example });
                            shouldAutoScrollRef.current = true;
                            submit(example);
                          }}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  items.map((item) =>
                    item.kind === "user" ? (
                      <div key={item.id} className="agent-chat-msg agent-chat-msg--user">
                        <p className="agent-chat-user-msg">{item.text}</p>
                      </div>
                    ) : (
                      <div key={item.id} className="agent-chat-msg">
                        <AgentRunView run={item.run} onRetry={submit} />
                      </div>
                    ),
                  )
                )}
                {items.length > 0 && !busy && (
                  <button type="button" className="agent-chat-new-task" onClick={startAnotherTask}>
                    Try another research task
                  </button>
                )}
              </div>

              <div className="agent-chat-footer">
                <form
                  className="agent-chat-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit(draft);
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      event.currentTarget.style.height = "auto";
                      event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 128)}px`;
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        submit(draft);
                      }
                    }}
                    rows={1}
                    placeholder="Describe the writing you want to find…"
                    aria-label="Give the Rubicon buyer agent a research task"
                    aria-describedby="agent-chat-input-status"
                    maxLength={400}
                  />
                  <div className="agent-chat-composer-row">
                    <span id="agent-chat-input-status" className="agent-chat-composer-hint">
                      {busy ? "Working on this brief" : "Public metadata only · no content unlocked"}
                    </span>
                    {busy ? (
                      <button type="button" className="button button-secondary agent-chat-action" onClick={cancel}>
                        <Square size={11} fill="currentColor" aria-hidden="true" /> Stop
                      </button>
                    ) : (
                      <button type="submit" className="button button-primary agent-chat-action" disabled={!draft.trim()}>
                        <Send size={13} aria-hidden="true" /> Research
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {!open && (
            <motion.button
              ref={launcherRef}
              type="button"
              className="agent-chat-launcher dashboard-theme"
              aria-label="Try the Rubicon research workflow"
              aria-controls="rubicon-agent-chat"
              aria-expanded={false}
              onClick={toggleChat}
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 5, scale: 0.98 }}
              transition={spring}
            >
              <span className="agent-chat-launcher-orb" aria-hidden="true"><i /></span>
              <span>Try the workflow</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
