"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, ArrowRight, CheckCircle2, Circle, Copy, ExternalLink, FileText, Link2, RefreshCw, Wallet2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRubiconQuery } from "@/lib/rubicon/hooks";
import { formatUsd } from "@/lib/rubicon/pricing";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { explorerAddressUrl, formatBalance, useNativeBalance } from "@/lib/onchain";
import { WithdrawDialog } from "./_components/withdraw-dialog";
import {
  ArticleStatePill,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  formatDate,
  LoadingState,
  PageHeader,
  PaymentStatusPill,
  PrimaryLink,
  shortWallet,
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
  const hasLive = (articles.data ?? []).some((a) => a.state === "live");
  const onboardingComplete = walletConnected && hasLive;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${greeting}.`}
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
                  title="Set up a receiving wallet"
                  description="Your Privy wallet receives payments for your articles."
                  href="/dashboard/settings"
                  cta="Set up wallet"
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

          <OnchainCard address={wallet.data?.address ?? null} />

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
                        <ArticleStatePill state={a.state} />
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

function OnchainCard({ address }: { address: string | null }) {
  const balance = useNativeBalance(address);
  const [copied, setCopied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Card>
      {address && (
        <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} walletAddress={address} />
      )}
      <CardHeader
        title="On-chain"
        action={
          address ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--river-deep)] hover:underline"
              >
                <ArrowRight size={14} aria-hidden="true" /> Withdraw
              </button>
              <button
                type="button"
                onClick={() => balance.refetch()}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--river-deep)] hover:underline"
              >
                <RefreshCw size={14} aria-hidden="true" /> Refresh
              </button>
            </div>
          ) : undefined
        }
      />
      {!address ? (
        <div className="p-5">
          <EmptyState
            icon={<Wallet2 size={22} aria-hidden="true" />}
            title="No wallet set up yet"
            description="Set up your Privy wallet to see your on-chain address, network, and balance."
            action={<PrimaryLink href="/dashboard/settings">Set up wallet</PrimaryLink>}
          />
        </div>
      ) : (
        <div className="grid gap-px bg-[var(--faint)] sm:grid-cols-3">
          {/* Wallet address */}
          <div className="bg-white p-5">
            <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Wallet address</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="mono text-sm font-medium">{shortWallet(address)}</span>
              <button type="button" onClick={copy} className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]" aria-label="Copy address">
                <Copy size={14} aria-hidden="true" />
              </button>
              {copied && <span className="text-xs text-[var(--green)]">copied</span>}
            </div>
            <a
              href={explorerAddressUrl(address)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--river-deep)] hover:underline"
            >
              View on {ACTIVE_CHAIN.blockExplorers?.default.name ?? "explorer"} <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>

          {/* Network */}
          <div className="bg-white p-5">
            <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Network</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium">
              <Link2 size={15} className="text-[var(--river)]" aria-hidden="true" /> {ACTIVE_CHAIN.name}
            </div>
            <div className="mt-2 text-xs text-[var(--muted)]">Chain ID {ACTIVE_CHAIN.id}</div>
          </div>

          {/* Balance */}
          <div className="bg-white p-5">
            <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Balance</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.01em]">
              {balance.status === "loading" ? (
                <span className="text-base font-normal text-[var(--muted)]">Loading…</span>
              ) : balance.status === "error" ? (
                <span className="text-base font-normal text-[#8d2f2d]">Unavailable</span>
              ) : (
                <>
                  {formatBalance(balance.value)}
                  <span className="ml-1.5 text-sm font-medium text-[var(--muted)]">{balance.symbol}</span>
                </>
              )}
            </div>
            {balance.status === "error" && <div className="mt-1 text-xs text-[var(--muted)]">Could not reach the RPC. Try Refresh.</div>}
          </div>
        </div>
      )}
    </Card>
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
