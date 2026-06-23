"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Eye,
  Link2,
  PieChart,
  RefreshCw,
  Share2,
  ShieldCheck,
  Wallet2,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRubiconQuery, type QueryResult } from "@/lib/rubicon/hooks";
import { atomicToUsd, formatUsd, formatUsdNumber } from "@/lib/rubicon/pricing";
import type { Article, PaymentActivity } from "@/lib/rubicon/types";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { explorerAddressUrl, formatBalance, useNativeBalance } from "@/lib/onchain";
import { WithdrawDialog } from "./_components/withdraw-dialog";
import { AgentPreviewDialog, AGENT_PREVIEW_EVENT, hasSeenAgentPreview } from "./articles/_components/agent-preview-dialog";
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
  const hasPricedArticle = (articles.data ?? []).some((a) => Number(a.pricePerWordAtomic) > 0);
  const hasLive = (articles.data ?? []).some((a) => a.state === "live");
  const onboardingComplete = walletConnected && hasLive && hasPricedArticle;
  const [previewSeen, setPreviewSeen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

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
  const totalEarned = atomicToUsd(earnings.data?.settledEarnings);

  useEffect(() => {
    setPreviewSeen(hasSeenAgentPreview());
    function onPreviewSeen() {
      setPreviewSeen(true);
    }
    window.addEventListener(AGENT_PREVIEW_EVENT, onPreviewSeen);
    return () => window.removeEventListener(AGENT_PREVIEW_EVENT, onPreviewSeen);
  }, []);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${greeting}.`}
        action={<ContentProtectionPolicy articles={articles.data ?? []} />}
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
            <OnboardingChecklistCard
              articles={articles.data ?? []}
              walletConnected={walletConnected}
              previewSeen={previewSeen}
              onPreview={() => setPreviewArticle((articles.data ?? [])[0] ?? null)}
            />
          )}

          {onboardingComplete && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid min-w-0 gap-5">
                <Reveal className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile
                    label="Total earnings"
                    value={<CountUp value={totalEarned} format={formatUsdNumber} />}
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

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
                  {hasTrend && (
                    <Reveal delay={0.08}>
                      <Card className="h-full p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--river-pale)] text-[var(--river)]">
                              <BarChart3 size={17} aria-hidden="true" />
                            </span>
                            <div>
                              <h2 className="text-base font-semibold">Activity over time</h2>
                              <p className="text-xs text-[var(--muted)]">Last 14 days</p>
                            </div>
                          </div>
                          <div className="inline-flex w-fit rounded-[10px] bg-[var(--surface-muted)] p-0.5 text-sm">
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
                            height={220}
                          />
                        </div>
                      </Card>
                    </Reveal>
                  )}

                  {earnings.data?.topArticle && (
                    <Reveal delay={0.1}>
                      <Card className="flex h-full flex-col justify-between gap-6 overflow-hidden p-5">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--surface-muted)] text-[var(--river)]">
                              <FileText size={17} aria-hidden="true" />
                            </span>
                            <div className="mono text-[0.66rem] uppercase tracking-[0.12em] text-[var(--muted)]">Top article</div>
                          </div>
                          <div className="mt-5 text-xl font-semibold leading-tight">{earnings.data.topArticle.title}</div>
                        </div>
                        <div className="flex items-end justify-between gap-4 border-t border-[var(--line)] pt-4">
                          <div>
                            <div className="text-2xl font-semibold">{formatUsd(earnings.data.topArticle.earnings)}</div>
                            <div className="text-xs text-[var(--muted)]">earned</div>
                          </div>
                          <Link href={`/dashboard/articles/${earnings.data.topArticle.id}`} className="button button-secondary text-sm">
                            View <ArrowRight size={15} aria-hidden="true" />
                          </Link>
                        </div>
                      </Card>
                    </Reveal>
                  )}
                </div>

                {hasBreakdown && (
                  <Reveal delay={0.12}>
                    <Card className="p-5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--river-pale)] text-[var(--river)]">
                          <PieChart size={17} aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="text-base font-semibold">Earnings breakdown</h2>
                          <p className="text-xs text-[var(--muted)]">Where your revenue comes from</p>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.25fr]">
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
                        <div className="rounded-[14px] bg-[var(--surface-muted)] p-5">
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

                <div className="grid gap-5 lg:grid-cols-2">
                  <PaymentActivityCard activity={activity} />
                  <ArticlesCard articles={articles.data ?? []} hasArticles={hasArticles} />
                </div>
              </div>

              <aside className="grid h-fit gap-5 xl:sticky xl:top-8">
                <ExportCard
                  username={greeting}
                  totalEarned={totalEarned}
                  wordsRead={earnings.data?.wordsPaidFor ?? 0}
                  agentReads={earnings.data?.agentReads ?? 0}
                  liveArticles={earnings.data?.liveArticles ?? 0}
                  topArticle={earnings.data?.topArticle?.title ?? null}
                  walletAddress={wallet.data?.address ?? null}
                  trendBars={trendBars}
                />
                <OnchainCard address={wallet.data?.address ?? null} />
              </aside>
            </div>
          )}

          {!onboardingComplete && (
            <>
              <OnchainCard address={wallet.data?.address ?? null} />
              <PaymentActivityCard activity={activity} />
              <ArticlesCard articles={articles.data ?? []} hasArticles={hasArticles} />
            </>
          )}
          <AgentPreviewDialog article={previewArticle} open={Boolean(previewArticle)} onClose={() => setPreviewArticle(null)} />
        </>
      )}
    </div>
  );
}

function ContentProtectionPolicy({ articles }: { articles: Article[] }) {
  const draftCount = articles.filter((article) => article.state === "draft").length;
  const pricedCount = articles.filter((article) => Number(article.pricePerWordAtomic) > 0).length;
  const sectionCount = articles.reduce((sum, article) => sum + article.sections.length, 0);
  const stats = [
    { label: "Full article hidden", value: articles.length > 0 ? `${articles.length.toLocaleString()} article${articles.length === 1 ? "" : "s"}` : "Ready" },
    { label: "Paid words only", value: pricedCount > 0 ? `${pricedCount.toLocaleString()} priced` : "Set in pricing" },
    { label: "Drafts private until published", value: draftCount > 0 ? `${draftCount.toLocaleString()} draft${draftCount === 1 ? "" : "s"}` : "Draft first" },
    { label: "Agent preview available", value: sectionCount > 0 ? `${sectionCount.toLocaleString()} headings` : "Metadata only" },
  ];

  return (
    <div className="group relative">
      <button type="button" className="button button-secondary text-sm">
        <ShieldCheck size={15} aria-hidden="true" /> Content Protection Policy
      </button>
      <div className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-2rem))] translate-y-1 rounded-[16px] border border-[var(--line)] bg-white p-5 text-left opacity-0 shadow-[0_18px_50px_rgba(20,35,60,0.16)] transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--river-pale)] text-[var(--river)]">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold">Content Protection Policy</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Your full articles are never exposed upfront. Agents only see metadata and paid words.
        </p>
        <div className="mt-4 grid gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[12px] bg-[var(--surface-muted)] p-3">
              <div className="text-sm font-medium">{stat.label}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OnboardingChecklistCard({
  articles,
  walletConnected,
  previewSeen,
  onPreview,
}: {
  articles: Article[];
  walletConnected: boolean;
  previewSeen: boolean;
  onPreview: () => void;
}) {
  const hasArticles = articles.length > 0;
  const hasPricedArticle = articles.some((article) => Number(article.pricePerWordAtomic) > 0);
  const hasLive = articles.some((article) => article.state === "live");
  const hasDraftOnly = hasArticles && !hasLive;
  const firstUnpriced = articles.find((article) => Number(article.pricePerWordAtomic) <= 0);
  const firstDraft = articles.find((article) => article.state !== "live");

  let cta: React.ReactNode = <PrimaryLink href="/dashboard/articles/new">Create article</PrimaryLink>;
  if (hasArticles && !hasPricedArticle) {
    cta = <PrimaryLink href={`/dashboard/articles/${firstUnpriced?.id ?? articles[0].id}`}>Set pricing</PrimaryLink>;
  } else if (hasArticles && !previewSeen) {
    cta = (
      <button type="button" onClick={onPreview} className="button button-primary text-sm">
        <Eye size={15} aria-hidden="true" /> Preview as agent
      </button>
    );
  } else if (hasDraftOnly) {
    cta = <PrimaryLink href={`/dashboard/articles/${firstDraft?.id ?? articles[0].id}`}>Publish article</PrimaryLink>;
  } else if (!walletConnected) {
    cta = <PrimaryLink href="/dashboard/settings">Connect wallet</PrimaryLink>;
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Start earning from agent reads</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Complete the setup steps agents need before paid reads can begin.</p>
        </div>
        <div className="shrink-0">{cta}</div>
      </div>
      <ol className="mt-5 grid gap-3">
        <ChecklistItem done={hasArticles} title="Create or import an article" description="Start from a draft or a supported URL." />
        <ChecklistItem done={hasPricedArticle} title="Set price per word" description="Add pricing to at least one article." />
        <ChecklistItem done={previewSeen} title="Preview what agents see" description="Check the metadata-only view before publishing." />
        <ChecklistItem done={hasLive} title="Publish article" description="Make one article available for paid reads." />
        <ChecklistItem done={walletConnected} title="Connect wallet / confirm payout details" description="Use a connected wallet for creator payouts." />
      </ol>
    </Card>
  );
}

function PaymentActivityCard({ activity }: { activity: QueryResult<PaymentActivity[]> }) {
  return (
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
        <ul className="grid gap-1 px-2 pb-2">
          {activity.data!.slice(0, 5).map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 rounded-[12px] px-3 py-4 hover:bg-[var(--surface-muted)]">
              <div className="min-w-0">
                <div className="truncate font-medium">{row.articleTitle}</div>
                <div className="text-xs text-[var(--muted)]">
                  {formatDate(row.date)} · {row.wordsRead.toLocaleString()} words read
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatUsd(row.creatorAmount)}</span>
                <PaymentStatusPill status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ArticlesCard({ articles, hasArticles }: { articles: Article[]; hasArticles: boolean }) {
  return (
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
        <ul className="grid gap-1 px-2 pb-2">
          {articles.slice(0, 4).map((a) => (
            <li key={a.id}>
              <Link href={`/dashboard/articles/${a.id}`} className="flex items-center justify-between gap-4 rounded-[12px] px-3 py-4 hover:bg-[var(--surface-muted)]">
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.title}</div>
                  <div className="text-xs text-[var(--muted)]">{a.usage.wordsRead.toLocaleString()} words read</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatUsd(a.usage.earnings)}</span>
                  <ArticleStatePill state={a.state} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ExportCard({
  username,
  totalEarned,
  wordsRead,
  agentReads,
  liveArticles,
  topArticle,
  walletAddress,
  trendBars,
}: {
  username: string;
  totalEarned: number;
  wordsRead: number;
  agentReads: number;
  liveArticles: number;
  topArticle: string | null;
  walletAddress: string | null;
  trendBars: TrendBar[];
}) {
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "downloaded">("idle");
  const publicSummary = `Rubicon creator ${username} has earned ${formatUsdNumber(totalEarned)} from ${formatInt(agentReads)} agent reads across ${formatInt(wordsRead)} paid words.`;

  useEffect(() => {
    let cancelled = false;
    setPngUrl(null);
    renderExportPng({
        username,
        amount: formatUsdNumber(totalEarned),
        reads: formatInt(agentReads),
        words: formatInt(wordsRead),
        liveArticles: formatInt(liveArticles),
        topArticle: topArticle ?? "Not available yet",
        wallet: shortWallet(walletAddress),
        avgRead: formatUsdNumber(agentReads > 0 ? totalEarned / agentReads : 0),
        trendValues: trendBars.map((bar) => bar.value),
      }).then((url) => {
        if (!cancelled) setPngUrl(url);
      });
    return () => {
      cancelled = true;
    };
  }, [agentReads, liveArticles, topArticle, totalEarned, trendBars, username, walletAddress, wordsRead]);

  const download = () => {
    if (!pngUrl) return;
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `rubicon-${username.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "creator"}-earnings.png`;
    link.click();
  };

  const copyImage = async () => {
    if (!pngUrl) return;
    try {
      const response = await fetch(pngUrl);
      const blob = await response.blob();
      if ("ClipboardItem" in window && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } else {
        await navigator.clipboard.writeText(publicSummary);
      }
      setCopyStatus("copied");
    } catch {
      download();
      setCopyStatus("downloaded");
    }
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <h2 className="text-base font-semibold">Export card</h2>
          <p className="text-xs text-[var(--muted)]">PNG image</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--surface-muted)] text-[var(--river)]">
          <Share2 size={17} aria-hidden="true" />
        </span>
      </div>

      <div className="overflow-hidden rounded-[14px] bg-[var(--surface-muted)]">
        {pngUrl ? (
          <img
            src={pngUrl}
            alt={`${username} Rubicon earnings export card`}
            className="block aspect-video h-auto w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="aspect-video animate-pulse bg-[var(--surface-muted)]" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={download} className="button button-primary justify-center text-sm" disabled={!pngUrl}>
          <Download size={15} aria-hidden="true" /> Download
        </button>
        <button type="button" onClick={copyImage} className="button button-secondary justify-center text-sm" disabled={!pngUrl}>
          <Copy size={15} aria-hidden="true" /> {copyStatus === "copied" ? "Copied" : copyStatus === "downloaded" ? "Downloaded" : "Copy PNG"}
        </button>
      </div>
      {copyStatus === "downloaded" && (
        <p className="mt-2 text-xs text-[var(--muted)]">Image copy was blocked, so the PNG was downloaded instead.</p>
      )}
    </Card>
  );
}

async function renderExportPng({
  username,
  amount,
  reads,
  words,
  liveArticles,
  topArticle,
  wallet,
  avgRead,
  trendValues,
}: {
  username: string;
  amount: string;
  reads: string;
  words: string;
  liveArticles: string;
  topArticle: string;
  wallet: string;
  avgRead: string;
  trendValues: number[];
}) {
  const width = 1600;
  const height = 900;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const logo = await loadImage("/rubicon-new-dark.png").catch(() => null);

  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, width, height);

  // Main card
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 48, 48, 1504, 804, 44);
  ctx.fill();
  ctx.strokeStyle = "rgba(30,40,62,0.10)";
  ctx.lineWidth = 3;
  ctx.stroke();

  if (logo) {
    drawRubiconLogo(ctx, logo, 96, 100, 330);
  } else {
    ctx.fillStyle = "#121722";
    ctx.font = "800 58px Arial, sans-serif";
    ctx.fillText("Rubicon", 96, 150);
  }

  ctx.fillStyle = "#687082";
  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillText(username, 100, 192);

  ctx.fillStyle = "#eef4ff";
  roundRect(ctx, 1215, 96, 245, 58, 29);
  ctx.fill();
  ctx.fillStyle = "#1f6ae0";
  ctx.font = "800 21px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CREATOR EARNINGS", 1337, 132);
  ctx.textAlign = "left";

  drawLightPanel(ctx, 100, 250, 640, 245);
  ctx.fillStyle = "#687082";
  ctx.font = "800 22px Arial, sans-serif";
  ctx.fillText("TOTAL EARNINGS", 146, 310);

  ctx.fillStyle = "#171a22";
  ctx.font = "900 104px Arial, sans-serif";
  ctx.fillText(amount, 146, 410);

  ctx.fillStyle = "#687082";
  ctx.font = "700 25px Arial, sans-serif";
  ctx.fillText("earned from paid agent reads", 150, 452);

  drawLightPanel(ctx, 805, 250, 655, 245);
  ctx.fillStyle = "#171a22";
  ctx.font = "800 40px Arial, sans-serif";
  ctx.fillText("Activity over time", 855, 325);
  ctx.fillStyle = "#687082";
  ctx.font = "700 23px Arial, sans-serif";
  ctx.fillText("Last 14 days", 856, 365);
  drawMiniBars(ctx, trendValues, 880, 402, 490, 62);

  drawLightMetric(ctx, 100, 548, 320, "READS", reads, "#1f6ae0");
  drawLightMetric(ctx, 460, 548, 320, "PAID WORDS", words, "#58d59b");
  drawLightMetric(ctx, 820, 548, 320, "AVG / READ", avgRead, "#f1b85b");
  drawLightMetric(ctx, 1180, 548, 280, "LIVE ARTICLES", liveArticles, "#8fb6fa");

  drawLightPanel(ctx, 100, 725, 860, 78);

  ctx.fillStyle = "#687082";
  ctx.font = "800 17px Arial, sans-serif";
  ctx.fillText("TOP ARTICLE", 140, 758);
  ctx.fillStyle = "#171a22";
  ctx.font = "800 28px Arial, sans-serif";
  ctx.fillText(truncateForCanvas(ctx, topArticle, 660), 140, 790);

  drawLightPanel(ctx, 1000, 725, 460, 78);
  ctx.fillStyle = "#687082";
  ctx.font = "800 17px Arial, sans-serif";
  ctx.fillText("WALLET", 1040, 758);
  ctx.fillStyle = "#171a22";
  ctx.font = "800 26px Arial, sans-serif";
  ctx.fillText(wallet, 1040, 790);

  return canvas.toDataURL("image/png");
}

function drawLightPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, width, height, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(30,40,62,0.09)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLightMetric(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, label: string, value: string, accent: string) {
  ctx.fillStyle = "#f1f5fb";
  roundRect(ctx, x, y, width, 120, 22);
  ctx.fill();

  ctx.fillStyle = accent;
  roundRect(ctx, x + 28, y + 30, 10, 60, 5);
  ctx.fill();

  ctx.fillStyle = "#171a22";
  ctx.font = "900 38px Arial, sans-serif";
  ctx.fillText(value, x + 58, y + 58);

  ctx.fillStyle = "#687082";
  ctx.font = "800 17px Arial, sans-serif";
  ctx.fillText(label, x + 58, y + 88);
}

function drawMiniBars(ctx: CanvasRenderingContext2D, values: number[], x: number, y: number, width: number, height: number) {
  const data = values.slice(-10);
  const max = Math.max(...data, 0);
  const gap = 8;
  const barWidth = (width - gap * (data.length - 1)) / Math.max(data.length, 1);
  data.forEach((value, index) => {
    const pct = max > 0 ? value / max : 0.12;
    const barHeight = Math.max(8, pct * height);
    ctx.fillStyle = value > 0 ? "#2f7df6" : "#dbe4f0";
    roundRect(ctx, x + index * (barWidth + gap), y + height - barHeight, barWidth, barHeight, 8);
    ctx.fill();
  });
}

function drawRubiconLogo(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number) {
  const sourceX = 95;
  const sourceY = 825;
  const sourceWidth = 1745;
  const sourceHeight = 340;
  const height = width * (sourceHeight / sourceWidth);
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function truncateForCanvas(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let next = text;
  while (next.length > 0 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}...`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
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
        <div className="grid gap-3 px-3 pb-3">
          <p className="px-2 text-xs text-[var(--muted)]">Withdrawable earnings are sent to your connected wallet.</p>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          {/* Wallet address */}
          <div className="rounded-[12px] bg-[var(--surface-muted)] p-5">
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
          <div className="rounded-[12px] bg-[var(--surface-muted)] p-5">
            <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Network</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium">
              <Link2 size={15} className="text-[var(--river)]" aria-hidden="true" /> {ACTIVE_CHAIN.name}
            </div>
            <div className="mt-2 text-xs text-[var(--muted)]">Chain ID {ACTIVE_CHAIN.id}</div>
          </div>

          {/* Balance */}
          <div className="rounded-[12px] bg-[var(--surface-muted)] p-5">
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
    <li className="flex items-start gap-3 rounded-lg bg-[var(--surface-muted)] p-4">
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
