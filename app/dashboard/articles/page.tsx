"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, FileText, Pause, Pencil, Play } from "lucide-react";
import type { Article } from "@/lib/rubicon/types";
import { useRubiconMutation, useRubiconQuery } from "@/lib/rubicon/hooks";
import { formatUsd } from "@/lib/rubicon/pricing";
import {
  ArticleStatusPill,
  Card,
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
      if (article.status === "live") await pause.run(article.id);
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
        action={<PrimaryLink href="/dashboard/articles/new">New article</PrimaryLink>}
      />

      {articles.status === "loading" && <LoadingState />}
      {articles.status === "error" && articles.error && <ErrorState error={articles.error} onRetry={articles.refetch} />}

      {articles.status === "success" && (articles.data?.length ?? 0) === 0 && (
        <EmptyState
          icon={<FileText size={22} aria-hidden="true" />}
          title="No articles yet"
          description="Add your content, choose a price per word, and make it available to agents."
          action={<PrimaryLink href="/dashboard/articles/new">New article</PrimaryLink>}
        />
      )}

      {(publish.error || pause.error) && (
        <div className="rounded-lg border border-[#e3a2a0] bg-[#fff1f0] px-4 py-3 text-sm text-[#8d2f2d]">
          {(publish.error ?? pause.error)?.message}
        </div>
      )}

      {articles.status === "success" && (articles.data?.length ?? 0) > 0 && (
        <div className="grid gap-3">
          {articles.data!.map((article) => (
            <Card key={article.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/articles/${article.id}`} className="truncate text-lg font-semibold hover:underline">
                      {article.title}
                    </Link>
                    <ArticleStatusPill status={article.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
                    <span>{formatUsd(article.pricePerWord)} / word</span>
                    <span>{article.usage.wordsRead.toLocaleString()} words read</span>
                    <span>{article.usage.agentReads.toLocaleString()} agent reads</span>
                    <span className="font-medium text-[var(--ink)]">{formatUsd(article.usage.earnings)} earned</span>
                    <span>Last read {formatRelative(article.usage.lastReadAt)}</span>
                  </div>
                  {article.originalSource && (
                    <a
                      href={article.originalSource}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--river-deep)] hover:underline"
                    >
                      <ExternalLink size={12} aria-hidden="true" /> Original source
                    </a>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/dashboard/articles/${article.id}`} className="button button-secondary text-sm">
                    <Pencil size={15} aria-hidden="true" /> Edit
                  </Link>
                  {article.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => toggle(article)}
                      disabled={busyId === article.id}
                      className="button button-secondary text-sm disabled:opacity-50"
                    >
                      {article.status === "live" ? (
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
