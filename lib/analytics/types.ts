import type { ArticleState, PaymentStatus } from "@/lib/rubicon/types";

export type AnalyticsBackend = "clickhouse" | "postgres";

export type AnalyticsSettlementStatus =
  | "not_applicable"
  | "pending"
  | "confirmed"
  | "completed"
  | "failed";

/** Map legacy PaymentStatus values to the current AnalyticsSettlementStatus. */
export function convertPaymentStatus(status: PaymentStatus): AnalyticsSettlementStatus {
  if (status === "settled") return "completed";
  if (status === "pending") return "pending";
  if (status === "failed") return "failed";
  return "not_applicable";
}

export interface AnalyticsFreshness {
  latestEventAt: string | null;
  ingestionLagMs: number | null;
  stale: boolean;
}

export interface AnalyticsDailyMetric {
  date: string;
  wordsRead: number;
  paidWords: number;
  agentReads: number;
  uniqueAgents: number;
  grossAmountAtomic: string;
  creatorAmountAtomic: string;
  settledCreatorAmountAtomic: string;
}

export interface AnalyticsRecentRead {
  bundleId: string;
  sessionId: string;
  articleId: string;
  articleTitle: string;
  occurredAt: string;
  accessMode: "paid" | "free";
  wordsRead: number;
  creatorAmountAtomic: string;
  settledCreatorAmountAtomic: string;
  settlementStatus: AnalyticsSettlementStatus;
}

export interface AnalyticsOverviewResponse {
  generatedAt: string;
  freshness: AnalyticsFreshness;
  totals: {
    wordsRead: number;
    paidWords: number;
    agentReads: number;
    uniqueAgents: number;
    grossAmountAtomic: string;
    creatorAmountAtomic: string;
    settledCreatorAmountAtomic: string;
    pendingCreatorAmountAtomic: string;
  };
  daily: AnalyticsDailyMetric[];
  topArticles: Array<{
    articleId: string;
    title: string;
    state: ArticleState;
    accessMode: "paid" | "free";
    wordsRead: number;
    paidWords: number;
    agentReads: number;
    uniqueAgents: number;
    creatorAmountAtomic: string;
    settledCreatorAmountAtomic: string;
    pendingCreatorAmountAtomic: string;
    lastReadAt: string | null;
  }>;
  recentReads: AnalyticsRecentRead[];
}

export interface ArticleAnalyticsResponse {
  generatedAt: string;
  freshness: AnalyticsFreshness;
  article: {
    id: string;
    title: string;
    state: ArticleState;
    accessMode: "paid" | "free";
  };
  totals: {
    wordsRead: number;
    paidWords: number;
    agentReads: number;
    uniqueAgents: number;
    creatorAmountAtomic: string;
    settledCreatorAmountAtomic: string;
    pendingCreatorAmountAtomic: string;
  };
  daily: Array<Omit<AnalyticsDailyMetric, "uniqueAgents">>;
  sections: Array<{
    sectionId: string;
    heading: string;
    wordsRead: number;
    agentReads: number;
  }>;
  recentReads: AnalyticsRecentRead[];
}
