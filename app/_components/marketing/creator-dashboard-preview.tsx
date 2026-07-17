"use client";

import { useMemo } from "react";
import { buildEarningsDonutSlices, type DonutSlice } from "../../dashboard/_components/chart-data";
import { type TrendBar } from "../../dashboard/_components/charts";
import { DashboardOverlayProvider } from "../../dashboard/_components/overlays";
import { DashboardFrame } from "../../dashboard/_components/shell";
import { DashboardOverviewContent, type DashboardOverviewProps } from "../../dashboard/_components/overview-content";
import type { AnalyticsSettlementStatus } from "@/lib/analytics/types";

const earningsTrend: TrendBar[] = [
  { label: "Jun 11", fullLabel: "Thu, Jun 11", value: 18.42, detail: "1,842 words" },
  { label: "Jun 12", fullLabel: "Fri, Jun 12", value: 31.85, detail: "3,185 words" },
  { label: "Jun 13", fullLabel: "Sat, Jun 13", value: 24.7, detail: "2,470 words" },
  { label: "Jun 14", fullLabel: "Sun, Jun 14", value: 52.1, detail: "5,210 words" },
  { label: "Jun 15", fullLabel: "Mon, Jun 15", value: 43.66, detail: "4,366 words" },
  { label: "Jun 16", fullLabel: "Tue, Jun 16", value: 61.25, detail: "6,125 words" },
  { label: "Jun 17", fullLabel: "Wed, Jun 17", value: 39.48, detail: "3,948 words" },
  { label: "Jun 18", fullLabel: "Thu, Jun 18", value: 75.92, detail: "7,592 words" },
  { label: "Jun 19", fullLabel: "Fri, Jun 19", value: 58.14, detail: "5,814 words" },
  { label: "Jun 20", fullLabel: "Sat, Jun 20", value: 46.33, detail: "4,633 words" },
  { label: "Jun 21", fullLabel: "Sun, Jun 21", value: 32.94, detail: "3,294 words" },
  { label: "Jun 22", fullLabel: "Mon, Jun 22", value: 55.08, detail: "5,508 words" },
  { label: "Jun 23", fullLabel: "Tue, Jun 23", value: 41.18, detail: "4,118 words" },
  { label: "Jun 24", fullLabel: "Wed, Jun 24", value: 19.0, detail: "1,900 words" },
];

const previewArticles = [
  { id: "article_agent_economy", title: "The Agent Economy Is Already Here", words: 12840, reads: 58, earnings: "$142.60", earningsValue: 142.6, state: "live" as const },
  { id: "article_interfaces_markets", title: "Why Interfaces Become Markets", words: 9640, reads: 43, earnings: "$119.40", earningsValue: 119.4, state: "live" as const },
  { id: "article_ai_distribution", title: "AI Distribution After Search", words: 11320, reads: 39, earnings: "$102.75", earningsValue: 102.75, state: "live" as const },
  { id: "article_autonomous_readers", title: "Designing for Autonomous Readers", words: 7280, reads: 21, earnings: "$64.25", earningsValue: 64.25, state: "paused" as const },
];

const earningsSlices: DonutSlice[] = buildEarningsDonutSlices(
  previewArticles.map((a) => ({ label: a.title, value: a.earningsValue })),
);

const earningsSparklineValues = earningsTrend.map((bar) => bar.value);
const earningsSparklineLabels = earningsTrend.map((bar) => bar.fullLabel);
const earningsSparklineDetails = earningsTrend.map((bar) => bar.detail ?? "");

const wordsSparklineValues = earningsTrend.map((bar) => Number(bar.detail?.replace(/[^0-9]/g, "") ?? 0));
const wordsSparklineLabels = earningsTrend.map((bar) => bar.fullLabel);
const wordsSparklineDetails = earningsTrend.map((bar) => `$${bar.value.toFixed(2)}`);

/**
 * The real creator dashboard overview (the same component shipped at
 * `/dashboard`) rendered with representative sample data. Used by the
 * `/dashboard-preview` route and embedded read-only in landing sections so the
 * marketing surfaces always show the actual, up-to-date dashboard UI.
 */
export function CreatorDashboardPreview({ embedded = false }: { embedded?: boolean }) {
  const overviewProps: DashboardOverviewProps = useMemo(
    () => ({
      greeting: "@writer",
      exportData: {
        username: "@previewwriter",
        avatarUrl: null,
        totalEarned: 501.09,
        wordsRead: 50005,
        agentReads: 183,
        topArticle: "The Agent Economy Is Already Here",
        trendBars: earningsTrend,
      },
      stats: [
        {
          label: "Total earnings",
          value: 501.09,
          format: formatUsd,
          deltaPct: 14,
          context: "vs last week",
          sparklineValues: earningsSparklineValues,
          sparklineLabels: earningsSparklineLabels,
          sparklineMetricLabel: "Total earnings",
          sparklineDetails: earningsSparklineDetails,
        },
        {
          label: "Words read",
          value: 50005,
          format: formatInt,
          deltaPct: 9,
          context: "vs last week",
          sparklineValues: wordsSparklineValues,
          sparklineLabels: wordsSparklineLabels,
          sparklineMetricLabel: "Words read",
          sparklineDetails: wordsSparklineDetails,
        },
        { label: "Agent reads", value: 183, format: formatInt, deltaPct: 12, context: "vs last week" },
        { label: "Live articles", value: 3, format: formatInt, context: "1 paused" },
      ],
      trendBars: earningsTrend,
      topArticles: previewArticles.slice(0, 3).map((article) => ({
        id: article.id,
        title: article.title,
        earnings: article.earnings,
        value: article.earningsValue,
        href: `/dashboard/articles/${article.id}`,
      })),
      breakdown: {
        totalEarned: "$501.09",
        slices: earningsSlices,
      },
      paymentRows: [
        { id: "pay_1028", title: "The Agent Economy Is Already Here", occurredAt: "Just now · 1,900 words read", amount: "$19.00", status: "completed" as AnalyticsSettlementStatus },
        { id: "pay_1027", title: "Why Interfaces Become Markets", occurredAt: "1d ago · 4,118 words read", amount: "$41.18", status: "completed" as AnalyticsSettlementStatus },
        { id: "pay_1026", title: "AI Distribution After Search", occurredAt: "2d ago · 5,508 words read", amount: "$55.08", status: "completed" as AnalyticsSettlementStatus },
        { id: "pay_1025", title: "Designing for Autonomous Readers", occurredAt: "3d ago · 3,294 words read", amount: "$32.94", status: "pending" as AnalyticsSettlementStatus },
        { id: "pay_1024", title: "The New Bundle Economics", occurredAt: "4d ago · 4,633 words read", amount: "$46.33", status: "completed" as AnalyticsSettlementStatus },
      ],
      articleRows: previewArticles.map((article) => ({
        id: article.id,
        title: article.title,
        wordsRead: article.words,
        earnings: article.earnings,
        state: article.state,
        href: `/dashboard/articles/${article.id}`,
      })),
      wallet: {
        address: "0x742d35cc6634c0532925a3b844bc9e7595f08f44",
        addressLabel: "0x742d...8f44",
        explorerHref: "https://testnet.arcscan.app/address/0x742d35cc6634c0532925a3b844bc9e7595f08f44",
        explorerLabel: "ArcScan",
        networkName: "Arc Testnet",
        chainId: 5042002,
        balanceLabel: (
          <>
            41.27<span className="ml-1.5 text-sm font-medium text-[var(--muted)]">USDC</span>
          </>
        ),
        onCopy: () => undefined,
        onWithdraw: () => undefined,
        onRefresh: () => undefined,
      },
    }),
    [],
  );

  const frame = (
    <DashboardOverlayProvider>
      <DashboardFrame identity="@previewwriter" activePath="/dashboard">
        <DashboardOverviewContent {...overviewProps} />
      </DashboardFrame>
    </DashboardOverlayProvider>
  );

  if (!embedded) return frame;

  // Read-only showcase: inert so the marketing page doesn't navigate into it.
  return (
    <div className="creator-dashboard-preview-embed" aria-hidden="true" tabIndex={-1}>
      {frame}
    </div>
  );
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatInt(value: number): string {
  return Math.round(value).toLocaleString();
}
