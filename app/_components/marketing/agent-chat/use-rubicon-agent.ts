"use client";

/**
 * Browser-side agent loop for the landing-page "ask the Rubicon agent" demo.
 *
 * The loop is a linear state machine driven by real work — every status the
 * UI shows corresponds to an in-flight request:
 *
 *   understanding  → model call 1: validated search plan
 *   searching      → GET /api/agent/catalog (the live public directory)
 *   comparing      → model call 2: rank candidate articles for relevance
 *   reviewing      → assemble the selected articles' public metadata and wait
 *                    for the answer stream to open
 *   answering      → model call 3: stream the final answer, citing sources
 *
 * The agent only ever sees public metadata (titles, prices, section
 * headings). Paid body text stays locked; the UI never implies otherwise.
 */
import { useCallback, useRef, useState } from "react";
import type { AgentCatalogArticle } from "@/app/api/agent/catalog/route";
import { formatUsdNumber } from "@/lib/rubicon/pricing";

export type AgentPhase =
  | "understanding"
  | "searching"
  | "comparing"
  | "reading"
  | "answering"
  | "done"
  | "error"
  | "cancelled";

export type StepState = "active" | "done" | "error";

export interface AgentStep {
  id: string;
  label: string;
  state: StepState;
}

export type ArticleAccessState = "found" | "reviewing" | "listed";

export interface AgentArticleHit {
  article: AgentCatalogArticle;
  relevance: number;
  reason: string;
  state: ArticleAccessState;
}

export interface AgentRun {
  id: number;
  query: string;
  phase: AgentPhase;
  steps: AgentStep[];
  articles: AgentArticleHit[];
  answer: string;
  error: string | null;
}

export type ChatItem =
  | { kind: "user"; id: number; text: string }
  | { kind: "agent"; id: number; run: AgentRun };

type ModelTask = "plan" | "rank" | "answer";

class AgentFailure extends Error {}

const MAX_CANDIDATES = 12;
const MAX_SELECTIONS = 3;
const MAX_HISTORY_EXCHANGES = 3;

function isTestArticle(article: AgentCatalogArticle) {
  return article.title.trim().toLowerCase() === "test for rubicon";
}

/** Estimated cost of paying to read the whole article, as a display string. */
export function fullReadCost(article: AgentCatalogArticle): string {
  return formatUsdNumber((article.pricePer1kUsd / 1000) * article.totalWords);
}

function extractJson(raw: string): Record<string, unknown> | null {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1)) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
}

async function callModel(task: Exclude<ModelTask, "answer">, input: string, signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/agent/model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, input }),
    signal,
  });
  if (!response.ok) {
    throw new AgentFailure(await readErrorMessage(response, "The model request failed."));
  }
  const body = (await response.json()) as { content?: string };
  if (typeof body.content !== "string") throw new AgentFailure("The model returned an empty response.");
  return body.content;
}

/** Stream a completion; resolves once the stream ends. */
async function streamModel(
  input: string,
  signal: AbortSignal,
  onDelta: (text: string) => void,
  onOpen: () => void,
): Promise<void> {
  const response = await fetch("/api/agent/model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: "answer", input, stream: true }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new AgentFailure(await readErrorMessage(response, "The model request failed."));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let opened = false;
  let sawContent = false;

  const readSseLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") return;
    let delta = "";
    try {
      const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
      delta = parsed.choices?.[0]?.delta?.content ?? "";
    } catch {
      return;
    }
    if (!delta) return;
    if (!opened) {
      opened = true;
      onOpen();
    }
    sawContent = true;
    onDelta(delta);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) readSseLine(line);
  }

  if (buffer) readSseLine(buffer);

  if (!sawContent) throw new AgentFailure("The model returned an empty response.");
}

function keywordFallback(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3)
    .slice(0, 8);
}

function scoreCandidates(articles: AgentCatalogArticle[], keywords: string[]): AgentCatalogArticle[] {
  const scored = articles.map((article) => {
    const haystack = [article.title, article.author, ...article.sectionHeadings].join(" ").toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      if (keyword && haystack.includes(keyword)) score += 3;
    }
    score += Math.min(article.readCount, 20) / 10;
    return { article, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_CANDIDATES).map((entry) => entry.article);
}

function candidateDigest(articles: AgentCatalogArticle[]): string {
  return articles
    .map((article) =>
      [
        `id: ${article.id}`,
        `title: ${article.title}`,
        `author: @${article.author}`,
        `words: ${article.totalWords}`,
        `price_per_1k_words_usd: ${article.pricePer1kUsd.toFixed(4)}`,
        `paid_reads: ${article.readCount}`,
        `sections: ${article.sectionHeadings.slice(0, 12).join(" | ") || "(none listed)"}`,
      ].join("\n"),
    )
    .join("\n---\n");
}

function metadataDigest(hits: AgentArticleHit[]): string {
  return hits
    .map(
      (hit) =>
        `“${hit.article.title}” by @${hit.article.author} — ${hit.article.totalWords.toLocaleString()} words, ` +
        `${formatUsdNumber(hit.article.pricePer1kUsd)} per 1k words (≈${fullReadCost(hit.article)} for a full read), ` +
        `${hit.article.readCount} paid reads. Relevance: ${hit.reason}. ` +
        `Section map: ${hit.article.sectionHeadings.join(" | ") || "(no section headings listed)"}`,
    )
    .join("\n\n");
}

function buildAnswerInput(
  history: Array<{ query: string; answer: string }>,
  query: string,
  hits: AgentArticleHit[],
  catalogSize: number,
): string {
  const context =
    hits.length > 0
      ? `Directory scan: ${catalogSize} articles. Selected metadata:\n\n${metadataDigest(hits)}`
      : `Directory scan: ${catalogSize} articles. No article was selected as a close match.`;
  const conversation = history.length
    ? `Earlier conversation (context only):\n${history.map((entry) => `Visitor: ${entry.query}\nAgent: ${entry.answer}`).join("\n")}`
    : "";
  return `${context}\n\n${conversation}\n\nVisitor question: ${query}`;
}

let nextItemId = 1;

export function useRubiconAgent() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<Array<{ query: string; answer: string }>>([]);
  const busyRef = useRef(false);

  const patchRun = useCallback((runId: number, patch: (run: AgentRun) => AgentRun) => {
    setItems((current) =>
      current.map((item) => (item.kind === "agent" && item.run.id === runId ? { ...item, run: patch(item.run) } : item)),
    );
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    if (busyRef.current) return;
    historyRef.current = [];
    setItems([]);
  }, []);

  const ask = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query || busyRef.current) return;

      const runId = nextItemId++;
      const controller = new AbortController();
      abortRef.current = controller;
      busyRef.current = true;
      setBusy(true);

      const run: AgentRun = { id: runId, query, phase: "understanding", steps: [], articles: [], answer: "", error: null };
      setItems((current) => [...current, { kind: "user", id: nextItemId++, text: query }, { kind: "agent", id: runId, run }]);

      const startStep = (id: string, label: string, phase: AgentPhase) =>
        patchRun(runId, (r) => ({
          ...r,
          phase,
          steps: [...r.steps.map((s) => (s.state === "active" ? { ...s, state: "done" as StepState } : s)), { id, label, state: "active" }],
        }));
      const relabelStep = (id: string, label: string) =>
        patchRun(runId, (r) => ({ ...r, steps: r.steps.map((s) => (s.id === id ? { ...s, label } : s)) }));

      try {
        // 1. Understand the request.
        startStep("understand", "Interpreting the research task", "understanding");
        const planRaw = await callModel("plan", query, controller.signal);
        const plan = extractJson(planRaw);
        const goal = typeof plan?.goal === "string" && plan.goal ? plan.goal : query;
        const keywords = Array.isArray(plan?.keywords)
          ? (plan.keywords as unknown[]).filter((k): k is string => typeof k === "string").map((k) => k.toLowerCase())
          : [];
        const searchTerms = keywords.length > 0 ? keywords : keywordFallback(query);

        // 2. Search the live directory.
        startStep("search", "Searching listed publications", "searching");
        const catalogRes = await fetch("/api/agent/catalog", { signal: controller.signal });
        if (!catalogRes.ok) {
          throw new AgentFailure(await readErrorMessage(catalogRes, "Couldn't reach the Rubicon directory."));
        }
        const { articles: rawCatalog } = (await catalogRes.json()) as { articles: AgentCatalogArticle[] };
        const catalog = (rawCatalog ?? []).filter((article) => !isTestArticle(article));
        relabelStep("search", `Searching ${catalog.length} listed article${catalog.length === 1 ? "" : "s"}`);

        if (catalog.length === 0) {
          patchRun(runId, (r) => ({
            ...r,
            phase: "done",
            steps: r.steps.map((s) => (s.state === "active" ? { ...s, state: "done" } : s)),
            answer:
              "The Rubicon directory has no live articles right now, so there is nothing for me to open. Check back soon, or browse /explore once creators publish.",
          }));
          return;
        }

        const candidates = scoreCandidates(catalog, searchTerms);

        // 3. Compare candidates for relevance.
        startStep("compare", `Inspecting ${candidates.length} candidate article${candidates.length === 1 ? "" : "s"}`, "comparing");
        let hits: AgentArticleHit[] = [];
        try {
          const rankRaw = await callModel(
            "rank",
            `Goal: ${goal}\nVisitor request: ${query}\n\nCandidate articles:\n${candidateDigest(candidates)}`,
            controller.signal,
          );
          const ranked = extractJson(rankRaw);
          const selections = Array.isArray(ranked?.selections) ? (ranked.selections as unknown[]) : [];
          hits = selections
            .map((entry) => {
              const id = (entry as { id?: unknown }).id;
              const article = candidates.find((candidate) => candidate.id === id);
              if (!article) return null;
              const relevanceRaw = (entry as { relevance?: unknown }).relevance;
              const reasonRaw = (entry as { reason?: unknown }).reason;
              const reason = typeof reasonRaw === "string" ? reasonRaw.trim().slice(0, 120) : "";
              return {
                article,
                relevance: typeof relevanceRaw === "number" ? Math.max(1, Math.min(100, relevanceRaw)) : 50,
                reason: reason || "Closest match in the live directory",
                state: "found" as ArticleAccessState,
              };
            })
            .filter((hit): hit is AgentArticleHit => hit !== null)
            .slice(0, MAX_SELECTIONS);
        } catch (error) {
          if (controller.signal.aborted) throw error;
          // Ranking is a nice-to-have; fall back to the local keyword score.
          hits = candidates.slice(0, MAX_SELECTIONS).map((article) => ({
            article,
            relevance: 50,
            reason: "Closest match by title and sections",
            state: "found" as ArticleAccessState,
          }));
        }
        patchRun(runId, (r) => ({ ...r, articles: hits }));

        // 4 + 5. Review catalog metadata, then stream the answer. No paid body
        // text is fetched by this demo.
        if (hits.length > 0) {
          startStep(
            "read",
            hits.length === 1 ? `Selecting “${hits[0].article.title}”` : `Comparing relevance and price across ${hits.length} sources`,
            "reading",
          );
          patchRun(runId, (r) => ({
            ...r,
            articles: r.articles.map((hit) => ({ ...hit, state: "reviewing" })),
          }));
        } else {
          startStep("read", "No close matches in the listed inventory", "reading");
        }

        if (hits.length === 0) {
          startStep("answer", "Preparing a broader search direction", "answering");
          const noMatchAnswer = "No exact match found in listed inventory. Try a broader topic or a related term to search the current catalog.";
          patchRun(runId, (r) => ({
            ...r,
            answer: noMatchAnswer,
            phase: "done",
            steps: r.steps.map((step) => (step.state === "active" ? { ...step, state: "done" } : step)),
          }));
          historyRef.current = [
            ...historyRef.current.slice(-(MAX_HISTORY_EXCHANGES - 1)),
            { query, answer: noMatchAnswer },
          ];
          return;
        }

        const answerInput = buildAnswerInput(historyRef.current, query, hits, catalog.length);
        await streamModel(
          answerInput,
          controller.signal,
          (delta) => patchRun(runId, (r) => ({ ...r, answer: r.answer + delta })),
          () => {
            startStep("answer", "Preparing selected sources", "answering");
            patchRun(runId, (r) => ({
              ...r,
              articles: r.articles.map((hit) => ({ ...hit, state: "listed" })),
            }));
          },
        );

        let finalAnswer = "";
        patchRun(runId, (r) => {
          finalAnswer = r.answer;
          return { ...r, phase: "done", steps: r.steps.map((s) => (s.state === "active" ? { ...s, state: "done" } : s)) };
        });

        historyRef.current = [
          ...historyRef.current.slice(-(MAX_HISTORY_EXCHANGES - 1)),
          { query, answer: finalAnswer.slice(0, 2_000) },
        ];
      } catch (error) {
        if (controller.signal.aborted) {
          patchRun(runId, (r) => ({
            ...r,
            phase: "cancelled",
            steps: r.steps.map((s) => (s.state === "active" ? { ...s, state: "done" } : s)),
          }));
        } else {
          const message = error instanceof AgentFailure ? error.message : "Something went wrong. Try again.";
          patchRun(runId, (r) => ({
            ...r,
            phase: "error",
            error: message,
            steps: r.steps.map((s) => (s.state === "active" ? { ...s, state: "error" } : s)),
          }));
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        if (busyRef.current) {
          busyRef.current = false;
          setBusy(false);
        }
      }
    },
    [patchRun],
  );

  return { items, busy, ask, cancel, reset };
}
