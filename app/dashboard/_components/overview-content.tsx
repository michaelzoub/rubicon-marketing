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
import { CountUp, Donut, InsightTile, Reveal, type DonutSlice, type TrendBar } from "./charts";
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

export interface DashboardActivityDay {
  date: string;
  count: number;
}

export interface DashboardOverviewProps {
  greeting: string;
  contentProtection: DashboardOverviewContentProtection;
  exportData?: DashboardOverviewExport;
  activityCalendar: DashboardActivityDay[];
  stats: DashboardOverviewStat[];
  trendBars: TrendBar[];
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
  activityCalendar,
  stats,
  trendBars,
  topArticle,
  breakdown,
  paymentRows,
  articleRows,
  wallet,
}: DashboardOverviewProps) {
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
            <Reveal delay={0.08} className="h-full">
              <AgentActivityCalendar days={activityCalendar} />
            </Reveal>

            {topArticle && (
              <Reveal delay={0.1} className="h-full">
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
                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]">
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <InsightTile value={<CountUp value={breakdown.avgPerRead} format={formatUsdDisplay} />} caption="Average earned per agent read" />
                    <InsightTile value={<CountUp value={breakdown.wordsAvailable} format={formatInt} />} caption="Words live and available to agents" />
                  </div>
                  <div className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-5">
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

function AgentActivityCalendar({ days }: { days: DashboardActivityDay[] }) {
  const max = Math.max(...days.map((day) => day.count), 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const interactions = days.reduce((sum, day) => sum + day.count, 0);
  const monthLabels = days.reduce<Array<{ key: string; label: string; index: number }>>((labels, day, index) => {
    const date = new Date(`${day.date}T00:00:00`);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (labels.some((label) => label.key === key)) return labels;
    labels.push({ key, label: date.toLocaleDateString(undefined, { month: "short" }), index });
    return labels;
  }, []);
  const leadingBlanks = days[0] ? new Date(`${days[0].date}T00:00:00`).getDay() : 0;
  const cells = [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ type: "blank" as const, key: `blank-${index}` })),
    ...days.map((day) => ({ type: "day" as const, key: day.date, day })),
  ];
  const weekColumns = Math.max(1, Math.ceil(cells.length / 7));

  return (
    <Card className="flex h-full min-h-[18rem] flex-col overflow-hidden p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Recent activity</h2>
          <p className="text-xs text-[var(--muted)]">Agent interactions with your author profile</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span>{activeDays} active days</span>
          <span>{interactions} interactions</span>
        </div>
      </div>

      <div className="flex flex-1 items-center pb-1 pt-3">
        <div className="w-full">
          <div
            className="relative ml-[2px] grid gap-1.5 text-xs text-[var(--muted)]"
            style={{ gridTemplateColumns: `repeat(${weekColumns}, minmax(0, 1fr))` }}
          >
            {monthLabels.map((month) => (
              <span key={month.key} className="whitespace-nowrap" style={{ gridColumnStart: Math.max(1, Math.floor((month.index + leadingBlanks) / 7) + 1) }}>
                {month.label}
              </span>
            ))}
          </div>
          <div
            className="mt-3 grid grid-flow-col gap-1.5"
            style={{ gridTemplateColumns: `repeat(${weekColumns}, minmax(0, 1fr))`, gridTemplateRows: "repeat(7, auto)" }}
          >
            {cells.map((cell) =>
              cell.type === "blank" ? (
                <span key={cell.key} className="aspect-square w-full" aria-hidden="true" />
              ) : (
                <span
                  key={cell.key}
                  title={`${cell.day.date}: ${cell.day.count} interaction${cell.day.count === 1 ? "" : "s"}`}
                  className={`aspect-square w-full rounded-[4px] ${activityCellClass(cell.day.count, max)}`}
                  aria-label={`${cell.day.date}: ${cell.day.count} interaction${cell.day.count === 1 ? "" : "s"}`}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function activityCellClass(count: number, max: number) {
  if (count <= 0 || max <= 0) return "bg-[#f0f1f3]";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-[#2f6de5]";
  if (ratio > 0.45) return "bg-[#5f94f1]";
  return "bg-[#a8c8ff]";
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
        title="Payout connection"
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
            title="Connection not confirmed"
            description="Confirm the secure Privy connection Rubicon uses for payouts."
            action={
              <Link href={wallet.settingsHref ?? "/dashboard/settings"} className="button button-primary text-sm">
                Confirm connection
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 px-3 pb-3">
          <p className="px-2 text-xs text-[var(--muted)]">Withdrawable earnings are sent through your confirmed payout connection.</p>
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
  const publicSummary = `Rubicon writer ${username} has earned ${formatUsdNumber(totalEarned)} from ${formatInt(agentReads)} agent reads across ${formatInt(wordsRead)} paid words.`;

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
    link.download = `rubicon-${username.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "writer"}-earnings.png`;
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
            className="w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--faint)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Export card</h2>
                <p className="text-xs text-[var(--muted)]">X-ready PNG · 1080 × 1350</p>
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
              <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[18px] border border-[var(--line)] bg-[#eceef4]">
                {pngUrl ? (
                  <img
                    src={pngUrl}
                    alt={`${username} Rubicon earnings export card`}
                    className="block aspect-[4/5] h-auto w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="aspect-[4/5] animate-pulse bg-[var(--surface-muted)]" />
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

/**
 * Renders the share card as a portrait "device" poster: a dark squircle card
 * with a blue top glow floating on a faint blueprint grid, holding a white
 * earnings panel. Numbers are drawn two-tone (solid integer, greyed decimals).
 * Palette is strictly white / black / Rubicon blue, plus a green gain accent.
 */
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
  const W = 1080;
  const H = 1350;
  // Render at 2x so the exported PNG stays crisp on retina and when scaled up
  // on social. All drawing below uses logical (1x) coordinates.
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  const INK = "#0b0d12";
  const BLUE = "#2f6de5";
  const LABEL = "#9aa2af";
  const MUTE = "#6b7280";
  const FRAC = "#c4cad4"; // greyed decimal part of two-tone numbers
  const LINE = "rgba(15,22,38,0.08)";
  const GREEN_BG = "#e7f6ec";
  const GREEN = "#1f8f4e";
  const FONT = '"Helvetica Neue", Arial, sans-serif';

  // letterSpacing lands on the 2d context in modern browsers but isn't yet in
  // the TS DOM lib; cast so the source type-checks.
  const setSpacing = (v: string) => {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = v;
  };

  const panel = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) => {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  const drawLabel = (text: string, x: number, y: number, align: CanvasTextAlign = "left") => {
    ctx.font = `700 13px ${FONT}`;
    ctx.fillStyle = LABEL;
    ctx.textAlign = align;
    setSpacing("1.4px");
    ctx.fillText(text, x, y);
    setSpacing("0px");
    ctx.textAlign = "left";
  };

  // ---- backdrop: faint blueprint grid ------------------------------------
  ctx.fillStyle = "#f4f6f9";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(20,40,80,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 40; x < W; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = 40; y < H; y += 40) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  // soft center light so the grid fades toward the edges
  const wash = ctx.createRadialGradient(W / 2, 600, 80, W / 2, 640, 780);
  wash.addColorStop(0, "rgba(255,255,255,0.85)");
  wash.addColorStop(1, "rgba(244,246,249,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // ---- top bar -----------------------------------------------------------
  ctx.font = `700 15px ${FONT}`;
  const chipLabel = "RUBICON";
  const chipTextW = ctx.measureText(chipLabel).width;
  const chipPadX = 18;
  const chipDot = 18;
  const chipH = 40;
  const chipX = 64;
  const chipY = 72;
  const chipW = chipPadX * 2 + chipDot + chipTextW;
  panel(chipX, chipY, chipW, chipH, chipH / 2, "#ffffff", "rgba(15,22,38,0.10)");
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(chipX + chipPadX + 4, chipY + chipH / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `700 15px ${FONT}`;
  ctx.fillText(chipLabel, chipX + chipPadX + chipDot, chipY + chipH / 2 + 5);
  ctx.fillStyle = MUTE;
  ctx.font = `600 18px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(truncateForCanvas(ctx, username, 320), W - 64, chipY + chipH / 2 + 6);
  ctx.textAlign = "left";

  // ---- earn card ---------------------------------------------------------
  const cardW = 588;
  const cardX = (W - cardW) / 2;
  const cardY = 300;
  const cardH = 712;
  const cardR = 64;

  // back "stacked layer" lip peeking above the dark card
  const backX = cardX + 26;
  const backW = cardW - 52;
  const backLip = ctx.createLinearGradient(0, cardY - 26, 0, cardY + 60);
  backLip.addColorStop(0, "#cfe0ff");
  backLip.addColorStop(1, "#eef4ff");
  roundRect(ctx, backX, cardY - 26, backW, 120, 58);
  ctx.fillStyle = backLip;
  ctx.fill();

  // dark card with a soft drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(15,23,45,0.22)";
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 46;
  ctx.fillStyle = "#0b0d12";
  roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();
  ctx.restore();

  // blue glow bleeding from the top edge / top-right corner
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.clip();
  const topSheen = ctx.createLinearGradient(0, cardY, 0, cardY + 160);
  topSheen.addColorStop(0, "rgba(47,109,229,0.45)");
  topSheen.addColorStop(1, "rgba(47,109,229,0)");
  ctx.fillStyle = topSheen;
  ctx.fillRect(cardX, cardY, cardW, 160);
  const corner = ctx.createRadialGradient(cardX + cardW - 30, cardY + 10, 0, cardX + cardW - 30, cardY + 10, 360);
  corner.addColorStop(0, "rgba(86,140,255,0.55)");
  corner.addColorStop(1, "rgba(47,109,229,0)");
  ctx.fillStyle = corner;
  ctx.fillRect(cardX, cardY, cardW, 320);
  ctx.restore();

  // dark-card header: title + brand orb
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText("Earnings", cardX + 46, cardY + 90);
  const orbR = 30;
  const orbCx = cardX + cardW - 46 - orbR;
  const orbCy = cardY + 48 + orbR;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(orbCx, orbCy, orbR, 0, Math.PI * 2);
  ctx.fill();
  drawWave(ctx, orbCx, orbCy - 6, 30, 4.2, BLUE);
  drawWave(ctx, orbCx, orbCy + 7, 30, 4.2, BLUE);

  // ---- white inner card --------------------------------------------------
  const innerX = cardX + 38;
  const innerW = cardW - 76;
  const innerY = cardY + 150;
  const innerH = cardH - 150 - 40;
  ctx.save();
  ctx.shadowColor = "rgba(18,26,48,0.12)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  panel(innerX, innerY, innerW, innerH, 44, "#ffffff");
  ctx.restore();

  const pad = 40;
  const cx = innerX + pad;
  const cr = innerX + innerW - pad;

  // total earned
  drawLabel("TOTAL EARNED", cx, innerY + 72);
  ctx.font = `800 64px ${FONT}`;
  drawTwoTone(ctx, amount, cx, innerY + 138, INK, FRAC);
  drawEye(ctx, cr - 14, innerY + 116, "#aab1bd");

  // gain pill + context
  const delta = computeTrendDelta(trendValues);
  ctx.font = `700 16px ${FONT}`;
  const pillTextW = ctx.measureText(delta.label).width;
  const pillH = 34;
  const pillW = pillTextW + 26;
  const pillTop = innerY + 170;
  panel(cx, pillTop, pillW, pillH, 10, delta.up ? GREEN_BG : "#eef2f8");
  ctx.fillStyle = delta.up ? GREEN : MUTE;
  ctx.font = `700 16px ${FONT}`;
  ctx.fillText(delta.label, cx + 13, pillTop + pillH / 2 + 5);
  ctx.fillStyle = MUTE;
  ctx.font = `500 16px ${FONT}`;
  ctx.fillText(`${words} words · 14 days`, cx + pillW + 14, pillTop + pillH / 2 + 5);

  // divider
  const div1 = innerY + 248;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, div1);
  ctx.lineTo(cr, div1);
  ctx.stroke();

  // two stat columns
  const col2 = cx + (innerW - pad * 2) / 2 + 8;
  const statLabelY = div1 + 46;
  const statValueY = statLabelY + 46;
  drawLabel("AGENT READS", cx, statLabelY);
  drawLabel("AVG / READ", col2, statLabelY);
  ctx.font = `800 34px ${FONT}`;
  drawTwoTone(ctx, reads, cx, statValueY, INK, FRAC);
  drawTwoTone(ctx, avgRead, col2, statValueY, INK, FRAC);

  // divider
  const div2 = statValueY + 46;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(cx, div2);
  ctx.lineTo(cr, div2);
  ctx.stroke();

  // cta row
  const ctaY = div2 + 58;
  ctx.fillStyle = BLUE;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText("Earn on Rubicon", cx, ctaY);
  const plusCx = cr - 22;
  const plusCy = ctaY - 8;
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(plusCx, plusCy, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(plusCx - 9, plusCy);
  ctx.lineTo(plusCx + 9, plusCy);
  ctx.moveTo(plusCx, plusCy - 9);
  ctx.lineTo(plusCx, plusCy + 9);
  ctx.stroke();

  // ---- footer ------------------------------------------------------------
  const footY = H - 70;
  ctx.fillStyle = MUTE;
  ctx.font = `600 15px ${FONT}`;
  ctx.fillText(wallet, 64, footY);
  ctx.textAlign = "right";
  ctx.fillText(truncateForCanvas(ctx, topArticle, 200), W - 64, footY);
  // center: "Built on Rubicon", brand emphasised
  ctx.textAlign = "left";
  const lead = "Built on ";
  ctx.font = `500 18px ${FONT}`;
  const leadW = ctx.measureText(lead).width;
  ctx.font = `700 18px ${FONT}`;
  const brandW = ctx.measureText("Rubicon").width;
  const startX = W / 2 - (leadW + brandW) / 2;
  ctx.fillStyle = MUTE;
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText(lead, startX, footY);
  ctx.fillStyle = INK;
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText("Rubicon", startX + leadW, footY);

  return canvas.toDataURL("image/png");
}

/** Draws a number with a solid integer part and a lighter fractional part. */
function drawTwoTone(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, intColor: string, fracColor: string) {
  const dot = text.lastIndexOf(".");
  if (dot < 0) {
    ctx.fillStyle = intColor;
    ctx.fillText(text, x, y);
    return;
  }
  const head = text.slice(0, dot);
  const tail = text.slice(dot);
  ctx.fillStyle = intColor;
  ctx.fillText(head, x, y);
  ctx.fillStyle = fracColor;
  ctx.fillText(tail, x + ctx.measureText(head).width, y);
}

/** Rubicon "river" mark: a single horizontal sine stroke. */
function drawWave(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, amp: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const steps = 24;
  const x0 = cx - width / 2;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const px = x0 + t * width;
    const py = cy + Math.sin(t * Math.PI * 2) * amp;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

/** Small outline "eye" glyph echoing the inspiration's privacy toggle. */
function drawEye(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy);
  ctx.quadraticCurveTo(cx, cy - 9, cx + 13, cy);
  ctx.quadraticCurveTo(cx, cy + 9, cx - 13, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Derives a green "gain" figure from the 14-day trend by comparing the recent
 * half against the earlier half. Falls back to "New" when there's no baseline.
 */
function computeTrendDelta(values: number[]): { label: string; up: boolean } {
  if (values.length === 0) return { label: "New", up: true };
  const half = Math.floor(values.length / 2) || 1;
  const prev = values.slice(0, half).reduce((a, b) => a + b, 0);
  const cur = values.slice(half).reduce((a, b) => a + b, 0);
  if (prev <= 0) return { label: cur > 0 ? "New" : "—", up: cur > 0 };
  const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
  return pct >= 0 ? { label: `+${pct.toFixed(1)}%`, up: true } : { label: `${pct.toFixed(1)}%`, up: false };
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
