"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, ArrowRight, BarChart3, CheckCircle2, Circle, Copy, ExternalLink, FileText, Link2, PieChart, RefreshCw, Wallet2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRubiconQuery } from "@/lib/rubicon/hooks";
import { atomicToUsd, formatUsd, formatUsdNumber } from "@/lib/rubicon/pricing";
import type { Article, PaymentActivity } from "@/lib/rubicon/types";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { explorerAddressUrl, formatBalance, useNativeBalance } from "@/lib/onchain";
import { WithdrawDialog } from "./_components/withdraw-dialog";
import { CountUp, Donut, DONUT_COLORS, InsightTile, Reveal, TrendChart, type DonutSlice, type TrendBar } from "./_components/charts";
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

  const [trendMetric, setTrendMetric] = useState<"earnings" | "words">("earnings");

  const trendBars = useMemo(
    () => buildTrend(activity.data ?? [], trendMetric),
    [activity.data, trendMetric],
  );
  const hasTrend = useMemo(() => trendBars.some((b) => b.value > 0), [trendBars]);

  const earningsSlices = useMemo(() => buildEarningsSlices(articles.data ?? []), [articles.data]);
  const hasBreakdown = earningsSlices.length > 0;

  const avgPerRead =
    (earnings.data?.agentReads ?? 0) > 0
      ? atomicToUsd(earnings.data?.settledEarnings) / (earnings.data?.agentReads ?? 1)
      : 0;
  const wordsAvailable = (articles.data ?? [])
    .filter((a) => a.state === "live")
    .reduce((sum, a) => sum + a.totalWords, 0);

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
            <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Total earnings"
                value={<CountUp value={atomicToUsd(earnings.data?.settledEarnings)} format={formatUsdNumber} />}
              />
              <StatTile
                label="Words read"
                value={<CountUp value={earnings.data?.wordsPaidFor ?? 0} format={formatInt} />}
              />
              <StatTile
                label="Agent reads"
                value={<CountUp value={earnings.data?.agentReads ?? 0} format={formatInt} />}
              />
              <StatTile
                label="Live articles"
                value={<CountUp value={earnings.data?.liveArticles ?? 0} format={formatInt} />}
              />
            </Reveal>
          )}

          {onboardingComplete && earnings.data?.topArticle && (
            <Reveal delay={0.05}>
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
            </Reveal>
          )}

          {onboardingComplete && hasTrend && (
            <Reveal delay={0.1}>
              <Card className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-[12px] border border-[var(--river-line)] bg-[var(--river-pale)] text-[var(--river)]">
                      <BarChart3 size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold">Activity over time</h2>
                      <p className="text-xs text-[var(--muted)]">Last 14 days</p>
                    </div>
                  </div>
                  <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-muted)] p-0.5 text-sm">
                    <SegButton active={trendMetric === "earnings"} onClick={() => setTrendMetric("earnings")}>
                      Earnings
                    </SegButton>
                    <SegButton active={trendMetric === "words"} onClick={() => setTrendMetric("words")}>
                      Words read
                    </SegButton>
                  </div>
                </div>
                <div className="mt-6">
                  <TrendChart
                    bars={trendBars}
                    formatValue={trendMetric === "earnings" ? formatUsdNumber : formatInt}
                  />
                </div>
              </Card>
            </Reveal>
          )}

          {onboardingComplete && hasBreakdown && (
            <Reveal delay={0.12}>
              <Card className="p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-[12px] border border-[var(--river-line)] bg-[var(--river-pale)] text-[var(--river)]">
                    <PieChart size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold">Earnings breakdown</h2>
                    <p className="text-xs text-[var(--muted)]">Where your revenue comes from</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <InsightTile
                      value={<CountUp value={avgPerRead} format={formatUsdNumber} />}
                      caption="Average earned per agent read"
                    />
                    <InsightTile
                      value={<CountUp value={wordsAvailable} format={formatInt} />}
                      caption="Words live and available to agents"
                    />
                  </div>
                  <div className="rounded-[18px] bg-[var(--surface-muted)] p-5">
                    <Donut
                      slices={earningsSlices}
                      centerValue={formatUsd(earnings.data?.settledEarnings)}
                      centerLabel="Total earned"
                    />
                  </div>
                </div>
              </Card>
            </Reveal>
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
        <div className="grid gap-px overflow-hidden rounded-b-[22px] bg-[var(--faint)] sm:grid-cols-3">
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

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        active ? "bg-white text-[var(--ink)] shadow-[0_1px_3px_rgba(47,125,246,0.18)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString();
}

/** Local YYYY-MM-DD key so day buckets line up with the creator's calendar. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Buckets payment activity into the trailing 14 days for the trend chart. */
function buildTrend(activity: PaymentActivity[], metric: "earnings" | "words", days = 14): TrendBar[] {
  const buckets = new Map<string, { earnings: number; words: number; date: Date }>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.set(dayKey(d), { earnings: 0, words: 0, date: d });
  }
  for (const row of activity) {
    if (row.status === "failed") continue;
    const parsed = new Date(row.date);
    if (Number.isNaN(parsed.getTime())) continue;
    const bucket = buckets.get(dayKey(parsed));
    if (!bucket) continue;
    bucket.earnings += atomicToUsd(row.creatorAmount);
    bucket.words += row.wordsRead;
  }
  return [...buckets.values()].map(({ earnings, words, date }) => {
    const value = metric === "earnings" ? earnings : words;
    return {
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      fullLabel: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      value,
      detail:
        metric === "earnings"
          ? `${formatInt(words)} words`
          : earnings > 0
            ? formatUsdNumber(earnings)
            : undefined,
    };
  });
}

/** Top-earning articles as donut slices, with the remainder folded into "Other". */
function buildEarningsSlices(articles: Article[]): DonutSlice[] {
  const earners = articles
    .map((a) => ({ title: a.title, value: atomicToUsd(a.usage.earnings) }))
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value);
  if (earners.length === 0) return [];

  const top = earners.slice(0, 4);
  const rest = earners.slice(4);
  const slices: DonutSlice[] = top.map((a, i) => ({ label: a.title, value: a.value, color: DONUT_COLORS[i] }));
  if (rest.length > 0) {
    slices.push({
      label: `${rest.length} more`,
      value: rest.reduce((sum, a) => sum + a.value, 0),
      color: DONUT_COLORS[4],
    });
  }
  return slices;
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
