"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Link2, Pause, Pencil, Play } from "lucide-react";
import type { Article } from "@/lib/rubicon/types";
import { useRubiconMutation, useRubiconQuery } from "@/lib/rubicon/hooks";
import { formatUsd } from "@/lib/rubicon/pricing";
import {
  ArticleStatePill,
  EmptyState,
  ErrorState,
  formatRelative,
  LoadingState,
  PageHeader,
  PrimaryLink,
} from "../_components/ui";

export default function ArticlesPage() {
  const articles = useRubiconQuery((c) => c.listArticles(), []);
  const publish = useRubiconMutation((c, id: string) => c.publishArticle(id));
  const pause = useRubiconMutation((c, id: string) => c.pauseArticle(id));
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(article: Article) {
    setBusyId(article.id);
    try {
      if (article.state === "live") await pause.run(article.id);
      else await publish.run(article.id);
      articles.refetch();
    } catch {
      /* surfaced via mutation error below */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Your articles"
        description="Everything you’ve published for agents to read."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/articles/import" className="button button-secondary text-sm">
              <Link2 size={15} aria-hidden="true" /> Import from URL
            </Link>
            <PrimaryLink href="/dashboard/articles/new">New article</PrimaryLink>
          </div>
        }
      />

      {articles.status === "loading" && <LoadingState />}
      {articles.status === "error" && articles.error && <ErrorState error={articles.error} onRetry={articles.refetch} />}

      {articles.status === "success" && (articles.data?.length ?? 0) === 0 && (
        <EmptyState
          icon={<FileText size={22} aria-hidden="true" />}
          title="No articles yet"
          description="Add your content, choose a price per word, and make it available to agents."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/dashboard/articles/import" className="button button-secondary text-sm">
                <Link2 size={15} aria-hidden="true" /> Import from URL
              </Link>
              <PrimaryLink href="/dashboard/articles/new">New article</PrimaryLink>
            </div>
          }
        />
      )}

      {(publish.error || pause.error) && (
        <div className="rounded-lg bg-[#fff1f0] px-4 py-3 text-sm text-[#8d2f2d]">
          {(publish.error ?? pause.error)?.message}
        </div>
      )}

      {articles.status === "success" && (articles.data?.length ?? 0) > 0 && (
        <ul className="grid gap-2 p-2">
          {articles.data!.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-4 py-5 first:pt-0 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/articles/${article.id}`} className="truncate text-lg font-semibold hover:underline">
                    {article.title}
                  </Link>
                  <ArticleStatePill state={article.state} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
                  <span>{formatUsd(article.pricePerWordAtomic)} / word</span>
                  <span>{article.usage.wordsRead.toLocaleString()} words read</span>
                  <span>{article.usage.agentReads.toLocaleString()} agent reads</span>
                  <span className="font-medium text-[var(--ink)]">{formatUsd(article.usage.earnings)} earned</span>
                  <span>Last read {formatRelative(article.usage.lastReadAt)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/dashboard/articles/${article.id}`} className="button button-secondary text-sm">
                  <Pencil size={15} aria-hidden="true" /> Edit
                </Link>
                {article.state !== "archived" && article.state !== "deleted" && (
                  <button
                    type="button"
                    onClick={() => toggle(article)}
                    disabled={busyId === article.id}
                    className="button button-secondary text-sm disabled:opacity-50"
                  >
                    {article.state === "live" ? (
                      <>
                        <Pause size={15} aria-hidden="true" /> Pause
                      </>
                    ) : (
                      <>
                        <Play size={15} aria-hidden="true" /> Publish
                      </>
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
