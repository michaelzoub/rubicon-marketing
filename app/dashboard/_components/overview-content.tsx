"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Link2,
  RefreshCw,
  ShieldCheck,
  Wallet2,
  X,
} from "lucide-react";
import type { ArticleState, PaymentStatus } from "@/lib/rubicon/types";
import { formatUsdDisplay, formatUsdNumber } from "@/lib/rubicon/pricing";
import { RubiconBrand } from "../../_components/rubicon-brand";
import { CountUp, Donut, InsightTile, Reveal, TrendChart, type DonutSlice, type TrendBar } from "./charts";
import {
  ArticleStatePill,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  PaymentStatusPill,
  shortWallet,
  StatTile,
} from "./ui";

export interface DashboardOverviewStat {
  label: string;
  value: number;
  format: (value: number) => string;
  deltaPct?: number | null;
}

export interface DashboardOverviewPaymentRow {
  id: string;
  title: string;
  meta: string;
  amount: string;
  status: PaymentStatus;
}

export interface DashboardOverviewArticleRow {
  id: string;
  title: string;
  meta: string;
  earnings: string;
  state: ArticleState;
  href?: string;
}

export interface DashboardOverviewWallet {
  address: string | null;
  addressLabel?: string;
  explorerHref?: string;
  explorerLabel?: string;
  networkName?: string;
  chainId?: string | number;
  balanceLabel?: ReactNode;
  balanceError?: string;
  onCopy?: () => void;
  copied?: boolean;
  onWithdraw?: () => void;
  onRefresh?: () => void;
  settingsHref?: string;
}

export interface DashboardOverviewExport {
  username: string;
  totalEarned: number;
  wordsRead: number;
  agentReads: number;
  topArticle: string | null;
  walletAddress: string | null;
  trendBars: TrendBar[];
}

export interface DashboardOverviewContentProtection {
  stats: Array<{ label: string; value: string }>;
}

export interface DashboardOverviewProps {
  greeting: string;
  contentProtection: DashboardOverviewContentProtection;
  exportData?: DashboardOverviewExport;
  stats: DashboardOverviewStat[];
  trendBars: TrendBar[];
  trendMetric: "earnings" | "words";
  onTrendMetricChange?: (metric: "earnings" | "words") => void;
  topArticle?: {
    id?: string;
    title: string;
    earnings: string;
    href?: string;
  } | null;
  breakdown?: {
    avgPerRead: number;
    wordsAvailable: number;
    totalEarned: string;
    slices: DonutSlice[];
  } | null;
  paymentRows: DashboardOverviewPaymentRow[];
  articleRows: DashboardOverviewArticleRow[];
  wallet: DashboardOverviewWallet;
}

export function DashboardOverviewContent({
  greeting,
  contentProtection,
  exportData,
  stats,
  trendBars,
  trendMetric,
  onTrendMetricChange,
  topArticle,
  breakdown,
  paymentRows,
  articleRows,
  wallet,
}: DashboardOverviewProps) {
  const hasTrend = trendBars.some((bar) => bar.value > 0);
  return (
    <div className="grid gap-5">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${greeting}.`}
        action={
          <div className="flex items-center gap-3">
            <ContentProtectionPolicy stats={contentProtection.stats} />
            {exportData && <ExportButton {...exportData} />}
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-5">
          <Reveal className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatTile
                key={stat.label}
                label={stat.label}
                value={<CountUp value={stat.value} format={stat.format} />}
                hint={stat.deltaPct !== undefined ? <DeltaHint pct={stat.deltaPct} /> : undefined}
              />
            ))}
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
            {hasTrend && (
              <Reveal delay={0.08}>
                <Card className="h-full p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold">Activity over time</h2>
                      <p className="text-xs text-[var(--muted)]">Last 14 days</p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-1 rounded-[10px] border border-[var(--line)] bg-[var(--surface-muted)] p-1.5 text-sm">
                      <SegButton active={trendMetric === "earnings"} onClick={() => onTrendMetricChange?.("earnings")}>
                        Earnings
                      </SegButton>
                      <SegButton active={trendMetric === "words"} onClick={() => onTrendMetricChange?.("words")}>
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

            {topArticle && (
              <Reveal delay={0.1}>
                <Card className="flex h-full flex-col justify-between gap-6 overflow-hidden p-5">
                  <div className="flex min-h-[13rem] flex-col">
                    <h2 className="text-base font-semibold">Top article</h2>
                    <div className="flex flex-1 items-center py-6 text-2xl font-semibold leading-tight">{topArticle.title}</div>
                  </div>
                  <div className="flex items-end justify-between gap-4 border-t border-[var(--line)] pt-4">
                    <div>
                      <div className="text-2xl font-semibold">{topArticle.earnings}</div>
                      <div className="text-xs text-[var(--muted)]">earned</div>
                    </div>
                    {topArticle.href ? (
                      <Link href={topArticle.href} className="button button-secondary text-sm">
                        View <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="button button-secondary text-sm">
                        View <ArrowRight size={15} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Card>
              </Reveal>
            )}
          </div>

          {breakdown && breakdown.slices.length > 0 && (
            <Reveal delay={0.12}>
              <Card className="p-5">
                <div>
                  <h2 className="text-base font-semibold">Earnings breakdown</h2>
                  <p className="text-xs text-[var(--muted)]">Where your revenue comes from</p>
                </div>
                <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.25fr]">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <InsightTile value={<CountUp value={breakdown.avgPerRead} format={formatUsdDisplay} />} caption="Average earned per agent read" />
                    <InsightTile value={<CountUp value={breakdown.wordsAvailable} format={formatInt} />} caption="Words live and available to agents" />
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5">
                    <Donut slices={breakdown.slices} centerValue={breakdown.totalEarned} centerLabel="Total earned" />
                  </div>
                </div>
              </Card>
            </Reveal>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <PaymentActivityRows rows={paymentRows} />
            <ArticleRows rows={articleRows} />
          </div>
        </div>

        <aside className="grid h-fit gap-5 xl:sticky xl:top-8">
          <WalletCard wallet={wallet} />
        </aside>
      </div>
    </div>
  );
}

function ContentProtectionPolicy({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <div className="group relative">
      <button type="button" className="button button-secondary text-sm">
        <ShieldCheck size={15} aria-hidden="true" /> Content Protection Policy
      </button>
      <div className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-2rem))] translate-y-1 rounded-[10px] border border-[var(--line)] bg-white p-5 text-left opacity-0 transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--river-line)] bg-[var(--river-pale)] text-[var(--river)]">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold">Content Protection Policy</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Your full articles are never exposed upfront. Agents only see metadata and paid words.
        </p>
        <div className="mt-4 grid gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              <div className="text-sm font-medium">{stat.label}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentActivityRows({ rows }: { rows: DashboardOverviewPaymentRow[] }) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Recent payment activity
            {rows.length > 0 && <LiveDot />}
          </span>
        }
        action={
          <Link href="/dashboard/earnings" className="text-sm text-[var(--river-deep)] hover:underline">
            View all
          </Link>
        }
      />
      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<Wallet2 size={22} aria-hidden="true" />}
            title="No payments yet"
            description="When an agent reads your articles, every paid word shows up here."
          />
        </div>
      ) : (
        <ul className="grid gap-1 px-2 pb-2">
          {rows.slice(0, 5).map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 rounded-lg px-3 py-4 hover:bg-[var(--surface-muted)]">
              <div className="min-w-0">
                <div className="truncate font-medium">{row.title}</div>
                <div className="text-xs text-[var(--muted)]">{row.meta}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{row.amount}</span>
                <PaymentStatusPill status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ArticleRows({ rows }: { rows: DashboardOverviewArticleRow[] }) {
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
      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<FileText size={22} aria-hidden="true" />}
            title="No articles yet"
            description="Publish your first article to let agents pay to read it."
            action={
              <Link href="/dashboard/articles/new" className="button button-primary text-sm">
                New article
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-1 px-2 pb-2">
          {rows.slice(0, 4).map((row) => {
            const content = (
              <>
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.title}</div>
                  <div className="text-xs text-[var(--muted)]">{row.meta}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{row.earnings}</span>
                  <ArticleStatePill state={row.state} />
                </div>
              </>
            );
            return (
              <li key={row.id}>
                {row.href ? (
                  <Link href={row.href} className="flex items-center justify-between gap-4 rounded-lg px-3 py-4 hover:bg-[var(--surface-muted)]">
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-4 hover:bg-[var(--surface-muted)]">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function WalletCard({ wallet }: { wallet: DashboardOverviewWallet }) {
  return (
    <Card>
      <CardHeader
        title="Wallet & payouts"
        action={
          wallet.address ? (
            <div className="flex items-center gap-4">
              {wallet.onWithdraw && (
                <button type="button" onClick={wallet.onWithdraw} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--river-deep)] hover:underline">
                  <ArrowRight size={14} aria-hidden="true" /> Withdraw
                </button>
              )}
              {wallet.onRefresh && (
                <button type="button" onClick={wallet.onRefresh} className="inline-flex items-center gap-1.5 text-sm text-[var(--river-deep)] hover:underline">
                  <RefreshCw size={14} aria-hidden="true" /> Refresh
                </button>
              )}
            </div>
          ) : undefined
        }
      />
      {!wallet.address ? (
        <div className="p-5">
          <EmptyState
            icon={<Wallet2 size={22} aria-hidden="true" />}
            title="No wallet set up yet"
            description="Set up your Privy wallet to see your on-chain address, network, and balance."
            action={
              <Link href={wallet.settingsHref ?? "/dashboard/settings"} className="button button-primary text-sm">
                Set up wallet
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 px-3 pb-3">
          <p className="px-2 text-xs text-[var(--muted)]">Withdrawable earnings are sent to your connected wallet.</p>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5">
              <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Wallet address</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="mono text-sm font-medium">{wallet.addressLabel ?? shortWallet(wallet.address)}</span>
                {wallet.onCopy && (
                  <button type="button" onClick={wallet.onCopy} className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]" aria-label="Copy address">
                    <Copy size={14} aria-hidden="true" />
                  </button>
                )}
                {wallet.copied && <span className="text-xs text-[var(--green)]">copied</span>}
              </div>
              {wallet.explorerHref && (
                <a
                  href={wallet.explorerHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--river-deep)] hover:underline"
                >
                  View on {wallet.explorerLabel ?? "explorer"} <ExternalLink size={11} aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5">
              <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Network</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                <Link2 size={15} className="text-[var(--river)]" aria-hidden="true" /> {wallet.networkName ?? "Not connected"}
              </div>
              {wallet.chainId && <div className="mt-2 text-xs text-[var(--muted)]">Chain ID {wallet.chainId}</div>}
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5">
              <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Balance</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.01em]">{wallet.balanceLabel ?? <span className="text-base font-normal text-[var(--muted)]">Loading...</span>}</div>
              {wallet.balanceError && <div className="mt-1 text-xs text-[var(--muted)]">{wallet.balanceError}</div>}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function ExportButton({
  username,
  totalEarned,
  wordsRead,
  agentReads,
  topArticle,
  walletAddress,
  trendBars,
}: DashboardOverviewExport) {
  const [open, setOpen] = useState(false);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "downloaded">("idle");
  const publicSummary = `Rubicon creator ${username} has earned ${formatUsdNumber(totalEarned)} from ${formatInt(agentReads)} agent reads across ${formatInt(wordsRead)} paid words.`;

  useEffect(() => {
    let cancelled = false;
    setPngUrl(null);
    renderExportPng({
      username,
      amount: formatUsdDisplay(totalEarned),
      reads: formatInt(agentReads),
      words: formatInt(wordsRead),
      topArticle: topArticle ?? "Not available yet",
      wallet: shortWallet(walletAddress),
      avgRead: formatUsdDisplay(agentReads > 0 ? totalEarned / agentReads : 0),
      trendValues: trendBars.map((bar) => bar.value),
    }).then((url) => {
      if (!cancelled) setPngUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [agentReads, topArticle, totalEarned, trendBars, username, walletAddress, wordsRead]);

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
    <>
      <button type="button" onClick={() => setOpen(true)} className="button button-secondary text-sm">
        <Download size={15} aria-hidden="true" /> Export card
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Export card"
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--faint)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Export card</h2>
                <p className="text-xs text-[var(--muted)]">Twitter-ready PNG · 1200 × 720</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                aria-label="Close"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[#eceef4]">
                {pngUrl ? (
                  <img
                    src={pngUrl}
                    alt={`${username} Rubicon earnings export card`}
                    className="block aspect-[5/3] h-auto w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="aspect-[5/3] animate-pulse bg-[var(--surface-muted)]" />
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

async function renderExportPng({
  username,
  amount,
  reads,
  words,
  topArticle,
  wallet,
  avgRead,
  trendValues,
}: {
  username: string;
  amount: string;
  reads: string;
  words: string;
  topArticle: string;
  wallet: string;
  avgRead: string;
  trendValues: number[];
}) {
  const width = 1200;
  const height = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#e9edf5";
  ctx.fillRect(0, 0, width, height);
  const cardX = 32;
  const cardY = 32;
  const cardW = width - 64;
  const cardH = height - 64;
  const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGradient.addColorStop(0, "#ffffff");
  cardGradient.addColorStop(1, "#f7f9fc");
  drawExportGradientPanel(ctx, cardX, cardY, cardW, cardH, 30, cardGradient, "rgba(18,24,38,0.12)");

  const logo = await loadImage("/rubicon-new-dark.png");
  const padX = 84;

  if (logo && logo.width > 0) {
    const logoW = 188;
    const logoH = logoW * (logo.height / logo.width);
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(logo, padX, 78, logoW, logoH);
    ctx.restore();
  }

  ctx.fillStyle = "#0e1014";
  ctx.font = "750 46px Arial, sans-serif";
  ctx.fillText("Earnings snapshot", padX, 160);
  ctx.fillStyle = "#69707c";
  ctx.font = "600 22px Arial, sans-serif";
  ctx.fillText(`${username} on Rubicon`, padX, 193);

  drawExportPill(ctx, width - padX - 132, 86, 132, 48, "14 days");

  const heroX = padX;
  const heroY = 232;
  const heroW = 410;
  const heroH = 156;
  const heroGradient = ctx.createLinearGradient(heroX, heroY, heroX + heroW, heroY + heroH);
  heroGradient.addColorStop(0, "#111827");
  heroGradient.addColorStop(1, "#2b3343");
  drawExportGradientPanel(ctx, heroX, heroY, heroW, heroH, 20, heroGradient, "rgba(18,24,38,0.10)");
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "700 14px Arial, sans-serif";
  ctx.fillText("TOTAL EARNED", heroX + 28, heroY + 42);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 56px Arial, sans-serif";
  ctx.fillText(truncateForCanvas(ctx, amount, heroW - 56), heroX + 28, heroY + 104);
  ctx.fillStyle = "#7dd3fc";
  ctx.font = "600 18px Arial, sans-serif";
  ctx.fillText("Revenue from agent reads", heroX + 28, heroY + 134);

  const metricX = heroX + heroW + 22;
  const metricY = heroY;
  const metricGap = 16;
  const metricW = (width - padX - metricX - metricGap * 2) / 3;
  drawStatTile(ctx, metricX, metricY, metricW, heroH, "Words", words);
  drawStatTile(ctx, metricX + metricW + metricGap, metricY, metricW, heroH, "Reads", reads);
  drawStatTile(ctx, metricX + (metricW + metricGap) * 2, metricY, metricW, heroH, "Avg / read", avgRead);

  const chartX = padX;
  const chartY = 412;
  const chartW = width - padX * 2;
  const chartH = 188;
  drawExportPanel(ctx, chartX, chartY, chartW, chartH, 20, "#ffffff", "rgba(18,24,38,0.08)");
  ctx.fillStyle = "#0e1014";
  ctx.font = "700 22px Arial, sans-serif";
  ctx.fillText("14-day earning trend", chartX + 24, chartY + 42);
  ctx.fillStyle = "#8a9099";
  ctx.font = "600 15px Arial, sans-serif";
  ctx.fillText("Paid word activity over time", chartX + 24, chartY + 66);
  drawBarChart(ctx, chartX + 24, chartY + 76, chartW - 48, chartH - 104, trendValues);

  const footY = height - 58;
  ctx.fillStyle = "#eef2f7";
  roundRect(ctx, padX, footY - 34, width - padX * 2, 46, 14);
  ctx.fill();

  ctx.font = "700 16px Arial, sans-serif";
  ctx.fillStyle = "#7b838f";
  ctx.fillText("Top article", padX + 18, footY - 5);
  ctx.fillStyle = "#0e1014";
  ctx.font = "700 17px Arial, sans-serif";
  ctx.fillText(truncateForCanvas(ctx, topArticle, 470), padX + 112, footY - 5);

  ctx.font = "700 16px Arial, sans-serif";
  const walletLabel = "Wallet";
  const walletValue = wallet;
  const walletValueW = ctx.measureText(walletValue).width;
  const walletLabelW = ctx.measureText(walletLabel).width;
  const walletX = width - padX - 18 - walletValueW - walletLabelW - 12;
  ctx.fillStyle = "#7b838f";
  ctx.fillText(walletLabel, walletX, footY - 5);
  ctx.fillStyle = "#0e1014";
  ctx.fillText(walletValue, walletX + walletLabelW + 12, footY - 5);

  return canvas.toDataURL("image/png");
}

function drawStatTile(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, label: string, value: string) {
  const tileGradient = ctx.createLinearGradient(x, y, x, y + height);
  tileGradient.addColorStop(0, "#ffffff");
  tileGradient.addColorStop(1, "#f4f6fa");
  drawExportGradientPanel(ctx, x, y, width, height, 18, tileGradient, "rgba(18,24,38,0.09)");
  ctx.fillStyle = "#8d95a1";
  ctx.font = "700 14px Arial, sans-serif";
  ctx.fillText(label.toUpperCase(), x + 22, y + 44);
  ctx.fillStyle = "#0e1014";
  ctx.font = "760 38px Arial, sans-serif";
  ctx.fillText(truncateForCanvas(ctx, value, width - 44), x + 22, y + 104);
}

function drawBarChart(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, values: number[]) {
  const data = values.length > 0 ? values : [12, 20, 16, 28, 24, 32, 26, 36, 30, 22, 18, 28, 24, 14];
  const max = Math.max(...data, 0);
  const baseline = y + height;
  ctx.strokeStyle = "#eef1f5";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i += 1) {
    const gy = y + (height / 2) * i;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + width, gy);
    ctx.stroke();
  }

  const gap = 9;
  const barW = (width - gap * (data.length - 1)) / data.length;
  data.forEach((value, i) => {
    const barH = max > 0 && value > 0 ? Math.max((value / max) * height, 7) : 0;
    const bx = x + i * (barW + gap);
    const barGradient = ctx.createLinearGradient(bx, baseline - barH, bx, baseline);
    barGradient.addColorStop(0, "#4f8cff");
    barGradient.addColorStop(1, "#2563eb");
    ctx.fillStyle = barGradient;
    roundRect(ctx, bx, baseline - barH, barW, barH, 7);
    ctx.fill();
  });
}

function drawExportPill(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, label: string) {
  drawExportPanel(ctx, x, y, width, height, height / 2, "#ffffff", "rgba(18,24,38,0.14)");
  ctx.fillStyle = "#16181d";
  ctx.font = "600 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x + width / 2, y + height / 2 + 6);
  ctx.textAlign = "left";
}

function drawExportPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke = "rgba(30,40,62,0.12)",
) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawExportGradientPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: CanvasGradient,
  stroke = "rgba(30,40,62,0.12)",
) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
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

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
        active ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function DeltaHint({ pct, onDark = false }: { pct: number | null; onDark?: boolean }) {
  const muted = onDark ? "text-white/55" : "text-[var(--muted)]";
  if (pct === null) return <span className={muted}>New this week</span>;
  if (Math.abs(pct) < 1) return <span className={muted}>Flat vs last week</span>;
  const up = pct > 0;
  const color = up
    ? onDark
      ? "text-[var(--gain-on-dark)]"
      : "text-[var(--gain)]"
    : onDark
      ? "text-[var(--loss-on-dark)]"
      : "text-[var(--loss)]";
  return (
    <span className={`font-medium ${color}`}>
      {up ? "+" : "−"}
      {Math.abs(Math.round(pct))}% vs last week
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2" aria-label="Recent activity">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--green)]" />
    </span>
  );
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString();
}
