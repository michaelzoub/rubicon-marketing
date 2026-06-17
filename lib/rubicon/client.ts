/**
 * Typed client for the Rubicon creator API.
 *
 * Every request carries the authenticated Privy access token. The backend
 * derives creator identity and ownership from that verified token — the client
 * never sends a creator id or username.
 */
import type {
  Article,
  ArticleDetail,
  CreateArticleInput,
  Creator,
  EarningsSummary,
  PaymentActivity,
  RubiconErrorBody,
  UpdateArticleInput,
  UpdateCreatorInput,
  UpdateWalletInput,
  Wallet,
} from "./types";

export type RubiconErrorKind = "auth" | "network" | "backend" | "validation" | "not_found";

export class RubiconError extends Error {
  constructor(
    readonly kind: RubiconErrorKind,
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RubiconError";
  }
}

export interface RubiconClientOptions {
  baseUrl: string;
  /** Resolves the current Privy access token, or null if signed out. */
  getToken: () => Promise<string | null>;
}

function kindForStatus(status: number): RubiconErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "not_found";
  if (status === 400 || status === 422) return "validation";
  return "backend";
}

export function createRubiconClient({ baseUrl, getToken }: RubiconClientOptions) {
  const root = baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    if (!token) {
      throw new RubiconError("auth", 401, "no_session", "Your session has expired. Sign in again.");
    }

    let response: Response;
    try {
      response = await fetch(`${root}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new RubiconError("network", 0, "network_error", "Could not reach Rubicon. Check your connection and try again.");
    }

    if (response.status === 204) {
      return undefined as T;
    }

    let body: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      const errBody = body as RubiconErrorBody | null;
      const code = errBody?.error?.code ?? "backend_error";
      const message = errBody?.error?.message ?? "Something went wrong on Rubicon. Please try again.";
      throw new RubiconError(kindForStatus(response.status), response.status, code, message);
    }

    return body as T;
  }

  return {
    // Creator
    getCreator: () => request<Creator>("/v1/creator"),
    updateCreator: (input: UpdateCreatorInput) =>
      request<Creator>("/v1/creator", { method: "PATCH", body: JSON.stringify(input) }),

    // Wallet
    getWallet: () => request<Wallet>("/v1/creator/wallet"),
    updateWallet: (input: UpdateWalletInput) =>
      request<Wallet>("/v1/creator/wallet", { method: "PUT", body: JSON.stringify(input) }),

    // Articles
    listArticles: () => request<Article[]>("/v1/creator/articles"),
    createArticle: (input: CreateArticleInput) =>
      request<Article>("/v1/creator/articles", { method: "POST", body: JSON.stringify(input) }),
    getArticle: (articleId: string) => request<ArticleDetail>(`/v1/creator/articles/${articleId}`),
    updateArticle: (articleId: string, input: UpdateArticleInput) =>
      request<Article>(`/v1/creator/articles/${articleId}`, { method: "PATCH", body: JSON.stringify(input) }),
    publishArticle: (articleId: string) =>
      request<Article>(`/v1/creator/articles/${articleId}/publish`, { method: "POST" }),
    pauseArticle: (articleId: string) =>
      request<Article>(`/v1/creator/articles/${articleId}/pause`, { method: "POST" }),
    archiveArticle: (articleId: string) =>
      request<void>(`/v1/creator/articles/${articleId}`, { method: "DELETE" }),

    // Earnings
    getEarnings: () => request<EarningsSummary>("/v1/creator/earnings"),
    getPaymentActivity: () => request<PaymentActivity[]>("/v1/creator/payment-activity"),
  };
}

export type RubiconClient = ReturnType<typeof createRubiconClient>;
