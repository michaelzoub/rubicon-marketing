"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
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
import { formatUsdDisplay } from "@/lib/rubicon/pricing";
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

export interface DashboardActivityDay {
  date: string;
  count: number;
}

export interface DashboardOverviewProps {
  greeting: string;
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
    <div className="grid gap-7">
      <PageHeader
        title="Overview"
        action={
          <div className="flex items-center gap-3">
            <ContentProtectionPolicy />
            {exportData && <ExportButton {...exportData} />}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="grid min-w-0 gap-6">
          <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatTile
                key={stat.label}
                label={stat.label}
                value={<CountUp value={stat.value} format={stat.format} />}
                hint={stat.deltaPct !== undefined ? <DeltaHint pct={stat.deltaPct} /> : undefined}
              />
            ))}
          </Reveal>

          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
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
                  <div className="flex items-end justify-between gap-4 pt-4">
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
                </div>
                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]">
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <InsightTile value={<CountUp value={breakdown.avgPerRead} format={formatUsdDisplay} />} caption="Average earned per agent read" />
                    <InsightTile value={<CountUp value={breakdown.wordsAvailable} format={formatInt} />} caption="Words live and available to agents" />
                  </div>
                  <div className="min-w-0 rounded-lg bg-[var(--surface-muted)] p-5">
                    <Donut slices={breakdown.slices} centerValue={breakdown.totalEarned} centerLabel="Total earned" />
                  </div>
                </div>
              </Card>
            </Reveal>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <PaymentActivityRows rows={paymentRows} />
            <ArticleRows rows={articleRows} />
          </div>
        </div>

        <aside className="grid h-fit gap-6 xl:sticky xl:top-8">
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
  if (count <= 0 || max <= 0) return "bg-[#eeeeef]";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-[#2f6de5]";
  if (ratio > 0.45) return "bg-[#5f94f1]";
  return "bg-[#a8c8ff]";
}

const CONTENT_PROTECTION_RULES = [
  {
    title: "Drafts stay private",
    detail: "Draft text is available only inside your creator workspace. It is not listed or previewed to agents.",
  },
  {
    title: "Discovery never includes the article body",
    detail: "Before payment, agents can see listing metadata and section headings, but not paragraphs or the full article text.",
  },
  {
    title: "Payment is required before delivery",
    detail: "Protected words are returned only after the payment requirement for that request has been satisfied.",
  },
  {
    title: "Only purchased words are released",
    detail: "Rubicon returns the paid section or word range. Everything outside that purchase remains unavailable.",
  },
  {
    title: "Your workspace and source remain closed",
    detail: "Agents receive a paid response, never access to your editor, drafts, or complete stored article.",
  },
];

export function ContentProtectionPolicy() {
  return (
    <div className="group relative">
      <button type="button" className="button button-secondary text-sm">
        <ShieldCheck size={15} aria-hidden="true" /> Content Protection Policy
      </button>
      <div className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(27rem,calc(100vw-2rem))] translate-y-1 rounded-[10px] border border-[var(--line)] bg-white p-5 text-left opacity-0 transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--river-line)] bg-[var(--river-pale)] text-[var(--river)]">
            <ShieldCheck size={17} aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold">Content Protection Policy</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Rubicon separates discovery from delivery. Publishing makes your listing discoverable while the article text stays protected.
        </p>
        <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {CONTENT_PROTECTION_RULES.map((rule) => (
            <div key={rule.title} className="grid grid-cols-[18px_1fr] gap-3 py-3">
              <CheckCircle2 size={16} className="mt-0.5 text-[var(--river)]" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold">{rule.title}</div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{rule.detail}</p>
              </div>
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
            <li key={row.id} className="flex min-w-0 items-center justify-between gap-4 rounded-lg px-3 py-4 hover:bg-[var(--surface-muted)]">
              <div className="min-w-0">
                <div className="truncate font-medium">{row.title}</div>
                <div className="truncate text-xs text-[var(--muted)]">{row.meta}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
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
                  <div className="truncate text-xs text-[var(--muted)]">{row.meta}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold">{row.earnings}</span>
                  <ArticleStatePill state={row.state} />
                </div>
              </>
            );
            return (
              <li key={row.id} className="min-w-0">
                {row.href ? (
                  <Link href={row.href} className="flex min-w-0 flex-col gap-3 rounded-lg px-3 py-4 hover:bg-[var(--surface-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    {content}
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-col gap-3 rounded-lg px-3 py-4 hover:bg-[var(--surface-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-4">{content}</div>
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
        <div className="grid gap-3 px-3 pb-3 pt-5">
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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "blocked">("idle");

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
      if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
        throw new Error("Image clipboard is not available in this browser.");
      }
      const clipboard = ClipboardItem as typeof ClipboardItem & { supports?: (type: string) => boolean };
      if (clipboard.supports && !clipboard.supports("image/png")) {
        throw new Error("PNG clipboard writes are not supported in this browser.");
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": dataUrlToPngBlob(pngUrl) })]);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("blocked");
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
                  <Copy size={15} aria-hidden="true" /> {copyStatus === "copied" ? "Copied" : copyStatus === "blocked" ? "Copy blocked" : "Copy PNG"}
                </button>
              </div>
              {copyStatus === "blocked" && (
                <p className="mt-2 text-xs text-[var(--muted)]">This browser blocked image clipboard access. Use Download as a fallback.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Renders the share card as a portrait poster with subtle laurel art, a close
 * earnings card, and a white metrics panel.
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
  const GREEN_BG = "#e7f6ec";
  const GREEN = "#1f8f4e";
  const FONT = '"Helvetica Neue", Arial, sans-serif';
  const logo = await loadImage("/rubicon-new.png");
  const laurel = await loadImage("/laurelfooter.png");

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

  // ---- backdrop ----------------------------------------------------------
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  if (laurel) {
    const artW = 980;
    const artH = artW * (laurel.height / laurel.width);
    drawTintedImage(ctx, laurel, W - artW + 120, 34, artW, artH, "#dce7f8", 0.8);
  }

  // ---- top bar -----------------------------------------------------------
  const logoX = 64;
  const logoY = 64;
  if (logo) {
    drawTintedImage(ctx, logo, logoX, logoY, 230, 58, "#111827", 1, { x: 90, y: 790, width: 1780, height: 450 });
  } else {
    ctx.fillStyle = INK;
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText("Rubicon", logoX, logoY + 32);
  }
  ctx.fillStyle = MUTE;
  ctx.font = `600 18px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(truncateForCanvas(ctx, username, 320), W - 64, logoY + 32);
  ctx.textAlign = "left";

  // ---- earn card ---------------------------------------------------------
  const cardW = 744;
  const cardX = (W - cardW) / 2;
  const cardY = 210;
  const cardH = 878;
  const cardR = 58;

  // back "stacked layer" lip peeking above the dark card
  const backX = cardX + 30;
  const backW = cardW - 60;
  const backLip = ctx.createLinearGradient(0, cardY - 26, 0, cardY + 60);
  backLip.addColorStop(0, "#cfe0ff");
  backLip.addColorStop(1, "#eef4ff");
  roundRect(ctx, backX, cardY - 24, backW, 118, 54);
  ctx.fillStyle = backLip;
  ctx.fill();

  ctx.fillStyle = "#0b0d12";
  roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();

  // blue field across the top edge
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.clip();
  const topSheen = ctx.createLinearGradient(0, cardY, 0, cardY + 160);
  topSheen.addColorStop(0, "rgba(47,109,229,0.72)");
  topSheen.addColorStop(1, "rgba(47,109,229,0)");
  ctx.fillStyle = topSheen;
  ctx.fillRect(cardX, cardY, cardW, 210);
  ctx.restore();

  // dark-card header
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 38px ${FONT}`;
  ctx.fillText("Earnings", cardX + 54, cardY + 96);

  // ---- white inner card --------------------------------------------------
  const innerX = cardX + 42;
  const innerW = cardW - 84;
  const innerY = cardY + 148;
  const innerH = 594;
  panel(innerX, innerY, innerW, innerH, 38, "#ffffff");

  const pad = 40;
  const cx = innerX + pad;
  const cr = innerX + innerW - pad;

  // total earned
  drawLabel("TOTAL EARNED", cx, innerY + 72);
  ctx.font = `800 64px ${FONT}`;
  drawTwoTone(ctx, amount, cx, innerY + 138, INK, FRAC);

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
  ctx.strokeStyle = "rgba(15,22,38,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, div1);
  ctx.lineTo(cr, div1);
  ctx.stroke();

  // activity chart
  const chartY = div1 + 44;
  const chartH = innerY + innerH - chartY - 42;
  drawLabel("PAID WORD ACTIVITY", cx, chartY);
  ctx.fillStyle = MUTE;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(`${reads} reads · ${avgRead} avg / read`, cx, chartY + 28);
  drawMiniActivityChart(ctx, cx, chartY + 58, cr - cx, chartH - 58, trendValues, BLUE);

  // top article callout under the white panel
  const articleY = innerY + innerH + 54;
  ctx.fillStyle = "rgba(255,255,255,0.54)";
  ctx.font = `700 13px ${FONT}`;
  setSpacing("1.4px");
  ctx.fillText("TOP ARTICLE", cardX + 54, articleY);
  setSpacing("0px");
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 21px ${FONT}`;
  ctx.fillText(truncateForCanvas(ctx, topArticle, cardW - 108), cardX + 54, articleY + 34);

  // ---- footer ------------------------------------------------------------
  const footY = H - 70;
  ctx.fillStyle = MUTE;
  ctx.font = `600 15px ${FONT}`;
  ctx.fillText(wallet, 64, footY);
  // bottom-right: "Built on Rubicon", brand emphasised
  const lead = "Built on ";
  ctx.font = `500 18px ${FONT}`;
  const leadW = ctx.measureText(lead).width;
  ctx.font = `700 18px ${FONT}`;
  const brandW = ctx.measureText("Rubicon").width;
  const startX = W - 64 - leadW - brandW;
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

function drawMiniActivityChart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  values: number[],
  blue: string,
) {
  const data = normalizeFourteenDays(values);
  const max = Math.max(...data, 0);

  // Horizontal bar chart: one bar per day spread across the full width so the
  // 14-day window reads as a wide sparkline instead of a thin stacked grid.
  const labelGap = 28;
  const barsH = height - labelGap;
  const count = data.length;
  const gap = 8;
  const barW = (width - gap * (count - 1)) / count;
  const radius = Math.min(6, barW / 2);
  const minBar = Math.min(8, barsH); // visible stub so empty days still show

  data.forEach((value, i) => {
    const intensity = max > 0 ? value / max : 0;
    const barH = value > 0 ? Math.max(minBar, intensity * barsH) : minBar;
    const bx = x + i * (barW + gap);
    const by = y + barsH - barH;
    ctx.fillStyle = value > 0 ? mixActivityColor(blue, intensity) : "#eef2f8";
    roundRect(ctx, bx, by, barW, barH, radius);
    ctx.fill();
  });

  ctx.fillStyle = "#6b7280";
  ctx.font = "600 11px \"Helvetica Neue\", Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("14D", x, y + height);
  ctx.textAlign = "right";
  ctx.fillText("NOW", x + width, y + height);
  ctx.textAlign = "left";
}

function drawTintedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  alpha: number,
  source?: { x: number; y: number; width: number; height: number },
) {
  const buffer = document.createElement("canvas");
  buffer.width = Math.max(1, Math.round(width * 2));
  buffer.height = Math.max(1, Math.round(height * 2));
  const bufferCtx = buffer.getContext("2d");
  if (!bufferCtx) return;
  bufferCtx.scale(2, 2);
  if (source) {
    bufferCtx.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, width, height);
  } else {
    bufferCtx.drawImage(image, 0, 0, width, height);
  }
  bufferCtx.globalCompositeOperation = "source-in";
  bufferCtx.fillStyle = color;
  bufferCtx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(buffer, x, y, width, height);
  ctx.restore();
}

function normalizeFourteenDays(values: number[]) {
  const fallback = [0, 1, 0, 2, 1, 0, 3, 5, 2, 0, 4, 7, 3, 8];
  const source = values.length > 0 ? values : fallback;
  if (source.length === 14) return source;
  if (source.length > 14) return source.slice(source.length - 14);
  return [...Array.from({ length: 14 - source.length }, () => 0), ...source];
}

function mixActivityColor(blue: string, intensity: number) {
  if (intensity >= 0.78) return blue;
  if (intensity >= 0.5) return "#8db2f4";
  if (intensity >= 0.25) return "#c7d8fb";
  return "#e0e9ff";
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

function dataUrlToPngBlob(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/png" });
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function DeltaHint({ pct, onDark = false }: { pct: number | null; onDark?: boolean }) {
  const muted = onDark ? "text-white/55" : "text-[var(--muted)]";
  if (pct === null) return null;
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
