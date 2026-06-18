"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, ArrowLeft, Pause, Play } from "lucide-react";
import type { ArticleDetail } from "@/lib/rubicon/types";
import { useRubiconMutation, useRubiconQuery } from "@/lib/rubicon/hooks";
import {
  atomicToUsd,
  formatUsd,
  usdToAtomic,
} from "@/lib/rubicon/pricing";
import {
  ArticleStatePill,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  formatDate,
  formatRelative,
  LoadingState,
  PaymentStatusPill,
  StatTile,
} from "../../_components/ui";

export default function ArticleDetailPage() {
  const params = useParams<{ articleId: string }>();
  const articleId = params.articleId;
  const router = useRouter();
  const article = useRubiconQuery<ArticleDetail>((c) => c.getArticle(articleId), [articleId]);

  const publish = useRubiconMutation((c, id: string) => c.publishArticle(id));
  const pause = useRubiconMutation((c, id: string) => c.pauseArticle(id));
  const archive = useRubiconMutation((c, id: string) => c.archiveArticle(id));
  const update = useRubiconMutation((c, ...args: Parameters<typeof c.updateArticle>) => c.updateArticle(...args));

  const data = article.data;
  const [editing, setEditing] = useState(false);

  return (
    <div className="grid gap-6">
      <Link href="/dashboard/articles" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        <ArrowLeft size={15} aria-hidden="true" /> All articles
      </Link>

      {article.status === "loading" && <LoadingState />}
      {article.status === "error" && article.error && <ErrorState error={article.error} onRetry={article.refetch} />}

      {article.status === "success" && data && (
        <>
          <div className="flex flex-col gap-4 border-b border-[var(--faint)] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-[-0.01em] sm:text-3xl">{data.title}</h1>
                <ArticleStatePill state={data.state} />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => setEditing((v) => !v)} className="button button-secondary text-sm">
                {editing ? "Close" : "Edit article"}
              </button>
              {data.state !== "archived" && data.state !== "deleted" && (
                <button
                  type="button"
                  onClick={async () => {
                    if (data.state === "live") await pause.run(data.id);
                    else await publish.run(data.id);
                    article.refetch();
                  }}
                  disabled={publish.pending || pause.pending}
                  className="button button-secondary text-sm disabled:opacity-50"
                >
                  {data.state === "live" ? <><Pause size={15} aria-hidden="true" /> Pause</> : <><Play size={15} aria-hidden="true" /> Publish</>}
                </button>
              )}
              {data.state !== "archived" && data.state !== "deleted" && (
                <button
                  type="button"
                  onClick={async () => {
                    await archive.run(data.id);
                    router.push("/dashboard/articles");
                  }}
                  disabled={archive.pending}
                  className="button button-secondary text-sm text-[#8d2f2d] disabled:opacity-50"
                >
                  <Archive size={15} aria-hidden="true" /> Archive
                </button>
              )}
            </div>
          </div>

          {(publish.error || pause.error || archive.error) && (
            <div className="rounded-lg border border-[#e3a2a0] bg-[#fff1f0] px-4 py-3 text-sm text-[#8d2f2d]">
              {(publish.error ?? pause.error ?? archive.error)?.message}
            </div>
          )}

          {editing && (
            <EditPanel
              article={data}
              pending={update.pending}
              error={update.error?.message ?? null}
              onSave={async (input) => {
                await update.run(data.id, input);
                setEditing(false);
                article.refetch();
              }}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Words read" value={data.usage.wordsRead.toLocaleString()} />
            <StatTile label="Agent reads" value={data.usage.agentReads.toLocaleString()} />
            <StatTile label="Earnings" value={formatUsd(data.usage.earnings)} />
            <StatTile label="Price per word" value={formatUsd(data.pricePerWordAtomic)} hint={`${data.totalWords.toLocaleString()} words total`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Section usage" />
              {data.sectionUsage.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No reads yet" description="When agents read, you’ll see which sections they found useful." />
                </div>
              ) : (
                <ul className="divide-y divide-[var(--faint)]">
                  {data.sectionUsage.map((s) => {
                    const max = Math.max(...data.sectionUsage.map((x) => x.wordsRead), 1);
                    return (
                      <li key={s.sectionId} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium">{s.heading}</span>
                          <span className="shrink-0 text-[var(--muted)]">{s.wordsRead.toLocaleString()} words</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          <div className="h-full rounded-full bg-[var(--river)]" style={{ width: `${(s.wordsRead / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Recent seller-agent sessions" />
              {data.sessions.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No sessions yet" description="Each time a buyer agent reads through your seller agent, it appears here." />
                </div>
              ) : (
                <ul className="divide-y divide-[var(--faint)]">
                  {data.sessions.map((session) => (
                    <li key={session.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div>
                        <div className="font-medium">{formatRelative(session.startedAt)}</div>
                        <div className="text-xs text-[var(--muted)]">{session.wordsRead.toLocaleString()} words read</div>
                      </div>
                      <span className="font-semibold">{formatUsd(session.earnings)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Payment activity" />
            {data.paymentActivity.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No payments yet" description="Paid words for this article will be listed here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--faint)] text-left text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Words read</th>
                      <th className="px-5 py-3 font-medium">Creator amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Settlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.paymentActivity.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--faint)] last:border-0">
                        <td className="px-5 py-3">{formatDate(row.date)}</td>
                        <td className="px-5 py-3">{row.wordsRead.toLocaleString()}</td>
                        <td className="px-5 py-3 font-medium">{formatUsd(row.creatorAmount)}</td>
                        <td className="px-5 py-3"><PaymentStatusPill status={row.status} /></td>
                        <td className="px-5 py-3 mono text-xs text-[var(--muted)]">{row.settlementReference ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function EditPanel({
  article,
  pending,
  error,
  onSave,
}: {
  article: ArticleDetail;
  pending: boolean;
  error: string | null;
  onSave: (input: { title: string; author: string; pricePerWordAtomic: string; maxArticlePriceAtomic: string | null }) => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [author, setAuthor] = useState(article.author);
  const [pricePerWord, setPricePerWord] = useState(atomicToUsd(article.pricePerWordAtomic).toString());
  const [maxPrice, setMaxPrice] = useState(article.maxArticlePriceAtomic ? atomicToUsd(article.maxArticlePriceAtomic).toString() : "");

  useEffect(() => {
    setTitle(article.title);
    setAuthor(article.author);
    setPricePerWord(atomicToUsd(article.pricePerWordAtomic).toString());
    setMaxPrice(article.maxArticlePriceAtomic ? atomicToUsd(article.maxArticlePriceAtomic).toString() : "");
  }, [article]);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Edit article</h2>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Article title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-lg border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Author</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="h-11 rounded-lg border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Price per word ($)</span>
            <input value={pricePerWord} onChange={(e) => setPricePerWord(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="0.0001" className="h-11 rounded-lg border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Maximum article price ($)</span>
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="No cap" className="h-11 rounded-lg border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]" />
          </label>
        </div>
      </div>
      {error && <p className="mt-4 rounded-lg border border-[#e3a2a0] bg-[#fff1f0] px-4 py-3 text-sm text-[#8d2f2d]">{error}</p>}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={pending || !title.trim() || !author.trim() || !(Number(usdToAtomic(Number(pricePerWord))) > 0)}
          onClick={() =>
            onSave({
              title: title.trim(),
              author: author.trim(),
              pricePerWordAtomic: usdToAtomic(Number(pricePerWord)),
              maxArticlePriceAtomic: maxPrice ? usdToAtomic(Number(maxPrice)) : null,
            })
          }
          className="button button-primary disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Card>
  );
}
