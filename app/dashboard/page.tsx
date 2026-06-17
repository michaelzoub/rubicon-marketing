"use client";

import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Circle, FileText, Wallet2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRubiconQuery } from "@/lib/rubicon/hooks";
import { formatUsd } from "@/lib/rubicon/pricing";
import {
  ArticleStatusPill,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  formatDate,
  LoadingState,
  PageHeader,
  PaymentStatusPill,
  PrimaryLink,
  StatTile,
} from "./_components/ui";

export default function OverviewPage() {
  const { user } = usePrivy();
  const articles = useRubiconQuery((c) => c.listArticles(), []);
  const wallet = useRubiconQuery((c) => c.getWallet(), []);
  const earnings = useRubiconQuery((c) => c.getEarnings(), []);
  const activity = useRubiconQuery((c) => c.getPaymentActivity(), []);

  const loading = [articles, wallet, earnings].some((q) => q.status === "loading");
  const firstError = [articles, wallet, earnings].find((q) => q.status === "error");

  const greeting = user?.twitter?.username ? `@${user.twitter.username}` : user?.email?.address ?? "creator";

  const walletConnected = Boolean(wallet.data?.address);
  const hasArticles = (articles.data?.length ?? 0) > 0;
  const hasLive = (articles.data ?? []).some((a) => a.status === "live");
  const onboardingComplete = walletConnected && hasLive;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${greeting}.`}
        action={<PrimaryLink href="/dashboard/articles/new">New article</PrimaryLink>}
      />

      {loading && <LoadingState />}

      {!loading && firstError && firstError.error && (
        <ErrorState
          error={firstError.error}
          onRetry={() => {
            articles.refetch();
            wallet.refetch();
            earnings.refetch();
            activity.refetch();
          }}
        />
      )}

      {!loading && !firstError && (
        <>
          {!onboardingComplete && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Finish setting up</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">A few steps and agents can start paying to read your work.</p>
              <ol className="mt-5 grid gap-3">
                <ChecklistItem
                  done
                  title="Create your account"
                  description="Sign in to manage your articles and earnings."
                />
                <ChecklistItem
                  done={walletConnected}
                  title="Connect a receiving wallet"
                  description="Payments for your articles will be routed to this wallet."
                  href="/dashboard/settings"
                  cta="Connect wallet"
                />
                <ChecklistItem
                  done={hasLive}
                  title="Publish your first article"
                  description="Add your content, choose a price per word, and make it available to agents."
                  href="/dashboard/articles/new"
                  cta="New article"
                />
              </ol>
            </Card>
          )}

          {onboardingComplete && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Total earnings" value={formatUsd(earnings.data?.settledEarnings)} />
              <StatTile label="Words read" value={(earnings.data?.wordsPaidFor ?? 0).toLocaleString()} />
              <StatTile label="Agent reads" value={(earnings.data?.agentReads ?? 0).toLocaleString()} />
              <StatTile label="Live articles" value={earnings.data?.liveArticles ?? 0} />
            </div>
          )}

          {onboardingComplete && earnings.data?.topArticle && (
            <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Top article</div>
                <div className="mt-1 text-lg font-semibold">{earnings.data.topArticle.title}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatUsd(earnings.data.topArticle.earnings)}</div>
                  <div className="text-xs text-[var(--muted)]">earned</div>
                </div>
                <Link href={`/dashboard/articles/${earnings.data.topArticle.id}`} className="button button-secondary text-sm">
                  View <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Recent payment activity"
              action={
                <Link href="/dashboard/earnings" className="text-sm text-[var(--river-deep)] hover:underline">
                  View all
                </Link>
              }
            />
            {activity.status === "loading" && <div className="p-5"><LoadingState /></div>}
            {activity.status === "error" && activity.error && <div className="p-5"><ErrorState error={activity.error} onRetry={activity.refetch} /></div>}
            {activity.status === "success" && (activity.data?.length ?? 0) === 0 && (
              <div className="p-5">
                <EmptyState
                  icon={<Activity size={22} aria-hidden="true" />}
                  title="No payments yet"
                  description="When an agent reads your articles, every paid word shows up here."
                />
              </div>
            )}
            {activity.status === "success" && (activity.data?.length ?? 0) > 0 && (
              <ul className="divide-y divide-[var(--faint)]">
                {activity.data!.slice(0, 5).map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.articleTitle}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {formatDate(row.date)} · {row.wordsRead.toLocaleString()} words read
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatUsd(row.creatorAmount)}</span>
                      <PaymentStatusPill status={row.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Your articles"
              action={
                <Link href="/dashboard/articles" className="text-sm text-[var(--river-deep)] hover:underline">
                  Manage
                </Link>
              }
            />
            {!hasArticles ? (
              <div className="p-5">
                <EmptyState
                  icon={<FileText size={22} aria-hidden="true" />}
                  title="No articles yet"
                  description="Publish your first article to let agents pay to read it."
                  action={<PrimaryLink href="/dashboard/articles/new">New article</PrimaryLink>}
                />
              </div>
            ) : (
              <ul className="divide-y divide-[var(--faint)]">
                {(articles.data ?? []).slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link href={`/dashboard/articles/${a.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--surface-muted)]">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.title}</div>
                        <div className="text-xs text-[var(--muted)]">{a.usage.wordsRead.toLocaleString()} words read</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold">{formatUsd(a.usage.earnings)}</span>
                        <ArticleStatusPill status={a.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function ChecklistItem({
  done,
  title,
  description,
  href,
  cta,
}: {
  done: boolean;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-[var(--faint)] p-4">
      {done ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[var(--green)]" aria-hidden="true" />
      ) : (
        <Circle size={20} className="mt-0.5 shrink-0 text-[var(--line)]" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 text-sm text-[var(--muted)]">{description}</div>
      </div>
      {!done && href && cta && (
        <Link href={href} className="button button-secondary shrink-0 text-sm">
          {href.includes("wallet") || href.includes("settings") ? <Wallet2 size={15} aria-hidden="true" /> : null}
          {cta}
        </Link>
      )}
    </li>
  );
}
