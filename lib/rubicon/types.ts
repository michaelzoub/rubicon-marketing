/**
 * Shared TypeScript contract between this frontend and the Rubicon backend
 * (https://github.com/michaelzoub/rubicon).
 *
 * The two sides must agree on: article states, price units, word counting,
 * earnings calculations, wallet behaviour, and error formats. Keep this file
 * as the single source of truth on the client and mirror it on the server.
 */

/** USDC is metered in atomic units (6 decimals). 1 USDC = 1_000_000 atomic. */
export const USDC_DECIMALS = 6;

/** Rubicon's platform fee during the current launch period. */
export const PLATFORM_FEE_PERCENT = 0;

/** Lifecycle states an article can be in. Shared with the gateway. */
export type ArticleStatus = "draft" | "live" | "paused" | "archived";

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "Draft",
  live: "Live",
  paused: "Paused",
  archived: "Archived",
};

/**
 * A navigable section of an article. The seller agent uses section titles to
 * guide buyer agents without revealing unpaid body text. Word counts come from
 * the gateway's tokenizer so the UI never diverges from billed usage.
 */
export interface ArticleSection {
  id: string;
  title: string;
  /** Word count as measured by the gateway tokenizer. */
  wordCount: number;
  /** Excluded sections are not offered to buyer agents. */
  excluded: boolean;
  order: number;
}

/** Aggregate usage for an article, as recorded by the gateway. */
export interface ArticleUsage {
  wordsRead: number;
  agentReads: number;
  /** Earnings in atomic USDC units. */
  earnings: string;
  /** ISO timestamp of the most recent agent read, or null if never read. */
  lastReadAt: string | null;
}

export interface Article {
  id: string;
  title: string;
  status: ArticleStatus;
  /** Original source URL, when the creator provided one. */
  originalSource: string | null;
  /** Price per single word, in atomic USDC units. */
  pricePerWord: string;
  /** Optional cap on the total an agent can be charged for one article. */
  maxArticlePrice: string | null;
  /** Total billable words, as measured by the gateway tokenizer. */
  wordCount: number;
  sections: ArticleSection[];
  usage: ArticleUsage;
  createdAt: string;
  updatedAt: string;
}

/**
 * A seller-agent session summary for the article detail page. Intentionally
 * omits buyer-sensitive information (identity, prompts, captured content).
 */
export interface SellerAgentSession {
  id: string;
  startedAt: string;
  wordsRead: number;
  /** Earnings from this session, in atomic USDC units. */
  earnings: string;
}

/** Per-section usage so creators can see what agents found useful. */
export interface SectionUsage {
  sectionId: string;
  title: string;
  wordsRead: number;
}

export interface ArticleDetail extends Article {
  sessions: SellerAgentSession[];
  sectionUsage: SectionUsage[];
  paymentActivity: PaymentActivity[];
}

export interface ConnectedProfile {
  type: "x";
  handle: string;
}

export interface Creator {
  id: string;
  name: string | null;
  email: string | null;
  connectedProfiles: ConnectedProfile[];
  /** Default price per word (atomic USDC) applied to new articles, if set. */
  defaultPricePerWord: string | null;
  defaultMaxArticlePrice: string | null;
}

export type WalletVerificationState = "unverified" | "pending" | "verified";

export interface Wallet {
  address: string | null;
  verificationState: WalletVerificationState;
}

export interface EarningsSummary {
  /** Settled earnings to date, in atomic USDC units. */
  settledEarnings: string;
  wordsPaidFor: number;
  agentReads: number;
  liveArticles: number;
  /** The highest-earning article, when there is activity. */
  topArticle: { id: string; title: string; earnings: string } | null;
}

export type PaymentStatus = "settled" | "pending" | "failed";

export interface PaymentActivity {
  id: string;
  /** ISO timestamp. */
  date: string;
  articleId: string;
  articleTitle: string;
  wordsRead: number;
  /** Gross amount for the words read, in atomic USDC units. */
  grossAmount: string;
  /** Rubicon platform fee, in atomic USDC units. Currently always "0". */
  platformFee: string;
  /** Amount routed to the creator's wallet, in atomic USDC units. */
  creatorAmount: string;
  status: PaymentStatus;
  /** Settlement reference from the payment provider, when available. */
  settlementReference: string | null;
}

/** Section definition sent when creating or updating an article. */
export interface ArticleSectionInput {
  title: string;
  order: number;
  excluded: boolean;
}

export interface CreateArticleInput {
  title: string;
  originalSource?: string | null;
  /** Raw article body. The gateway parses sections and counts words. */
  content: string;
  /** Optional creator overrides for parsed section titles/order/exclusion. */
  sections?: ArticleSectionInput[];
  /** Price per word in atomic USDC units. */
  pricePerWord: string;
  maxArticlePrice?: string | null;
}

export type UpdateArticleInput = Partial<
  Pick<CreateArticleInput, "title" | "originalSource" | "content" | "sections" | "pricePerWord" | "maxArticlePrice">
>;

export interface UpdateCreatorInput {
  name?: string | null;
  defaultPricePerWord?: string | null;
  defaultMaxArticlePrice?: string | null;
}

export interface UpdateWalletInput {
  address: string;
}

/** Error envelope the gateway returns on non-2xx responses. */
export interface RubiconErrorBody {
  error: {
    code: string;
    message: string;
  };
}
