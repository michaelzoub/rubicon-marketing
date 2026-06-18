/**
 * Supabase-backed dashboard client.
 *
 * The marketing app owns creator-facing CRUD and talks to the shared database
 * directly. The x402 streaming endpoint should read the same tables for live
 * article, pricing, and wallet data.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseSections } from "./sections";
import type {
  Article,
  ArticleDetail,
  ArticleSection,
  CreateArticleInput,
  Creator,
  EarningsSummary,
  PaymentActivity,
  PaymentStatus,
  SectionUsage,
  SellerAgentSession,
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

export interface CreatorIdentity {
  id: string;
  username: string;
  displayName: string;
}

export interface RubiconClientOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  getToken: () => Promise<string | null>;
  getIdentity: () => CreatorIdentity | null;
}

type CreatorRow = {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
};

type CreatorProfileRow = {
  creator_id: string;
  bio: string | null;
  avatar_url: string | null;
};

type WalletRow = {
  creator_id: string;
  address: string;
  network: string;
  verified: boolean;
};

type ArticleRow = {
  id: string;
  creator_id: string;
  title: string;
  author: string;
  state: Article["state"];
  price_per_word_atomic: string;
  max_article_price_atomic: string | null;
  total_words: number;
  revision: number;
  seller_agent_config: Record<string, unknown> | null;
  body: string;
  created_at: string;
  updated_at: string;
};

type ArticleSectionRow = {
  id: string;
  article_id: string;
  section_id: string;
  heading: string;
  level: number;
  word_start: number;
  word_count: number;
  ordinal: number;
};

type StreamSessionRow = {
  id: string;
  article_id: string;
  creator_id: string;
  words_delivered: number;
  paid_atomic: string;
  created_at: string;
};

type WordPaymentRow = {
  id: string;
  payment_id: string;
  article_id: string;
  creator_id: string;
  session_id: string;
  sequence: number;
  amount_atomic: string;
  creator_amount_atomic: string;
  rubicon_fee_atomic: string;
  transfer_id: string | null;
  settlement_id: string | null;
  settlement_ids: string[] | null;
  created_at: string;
};

// Circle Gateway nanopayments settle to a Gateway settlement/transfer UUID, not
// an on-chain ERC-20 transfer hash. Treat a payment as settled when any of
// transfer_id / settlement_id / settlement_ids is present, mirroring the
// gateway's own persistence (apps/gateway/src/repositories/postgres.ts).
function settlementReferenceOf(payment: WordPaymentRow): string | null {
  return payment.transfer_id ?? payment.settlement_id ?? payment.settlement_ids?.[0] ?? null;
}

// A Circle Gateway x402 transfer record, as proxied by /api/onchain/x402-transfers.
// This is the authoritative settlement ledger: the dashboard sources payment
// activity and settled earnings from here rather than the local DB. The record
// only knows the wallet it paid — it carries no article/session/fee metadata.
type GatewayTransfer = {
  id: string;
  status: "received" | "batched" | "confirmed" | "completed" | "failed";
  token: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
};

function paymentStatusFromTransfer(status: GatewayTransfer["status"]): PaymentStatus {
  if (status === "completed" || status === "confirmed") return "settled";
  if (status === "failed") return "failed";
  return "pending";
}

async function fetchGatewayTransfers(address: string): Promise<GatewayTransfer[]> {
  const res = await fetch(`/api/onchain/x402-transfers?address=${encodeURIComponent(address)}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new RubiconError("backend", res.status, "gateway_transfers_failed", "Could not load Gateway settlement records.");
  }
  const body = (await res.json()) as { transfers?: GatewayTransfer[] };
  return (body.transfers ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function toRubiconError(error: { code?: string; message?: string } | null, fallback = "Supabase request failed."): RubiconError {
  const code = error?.code ?? "supabase_error";
  const message = error?.message ?? fallback;
  const kind: RubiconErrorKind = code === "PGRST116" ? "not_found" : code.startsWith("23") ? "validation" : "backend";
  return new RubiconError(kind, 0, code, message);
}

function requireIdentity(getIdentity: () => CreatorIdentity | null): CreatorIdentity {
  const identity = getIdentity();
  if (!identity) {
    throw new RubiconError("auth", 401, "no_session", "Your session has expired. Sign in again.");
  }
  return identity;
}

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function sumAtomic(values: Iterable<string | null | undefined>): string {
  let total = BigInt(0);
  for (const value of values) {
    if (!value) continue;
    total += BigInt(value);
  }
  return total.toString();
}

function mapSection(row: ArticleSectionRow): ArticleSection {
  return {
    id: row.id,
    sectionId: row.section_id,
    heading: row.heading,
    level: row.level,
    wordStart: row.word_start,
    wordCount: row.word_count,
    ordinal: row.ordinal,
  };
}

function mapArticle(
  row: ArticleRow,
  sections: ArticleSectionRow[],
  payments: WordPaymentRow[],
  sessions: StreamSessionRow[],
): Article {
  const articlePayments = payments.filter((payment) => payment.article_id === row.id);
  const articleSessions = sessions.filter((session) => session.article_id === row.id);
  const lastReadAt = articlePayments.reduce<string | null>((latest, payment) => {
    if (!latest || payment.created_at > latest) return payment.created_at;
    return latest;
  }, null);

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    state: row.state,
    pricePerWordAtomic: row.price_per_word_atomic,
    maxArticlePriceAtomic: row.max_article_price_atomic,
    totalWords: row.total_words,
    revision: row.revision,
    sellerAgentConfig: row.seller_agent_config,
    sections: sections.filter((section) => section.article_id === row.id).sort((a, b) => a.ordinal - b.ordinal).map(mapSection),
    usage: {
      wordsRead: articlePayments.length,
      agentReads: new Set(articleSessions.map((session) => session.id)).size,
      earnings: sumAtomic(articlePayments.map((payment) => payment.creator_amount_atomic)),
      lastReadAt,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function must<T>(promise: PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>): Promise<NonNullable<T>> {
  const { data, error } = await promise;
  if (error) throw toRubiconError(error);
  if (data === null) throw new RubiconError("not_found", 404, "not_found", "Requested data was not found.");
  return data as NonNullable<T>;
}

async function maybe<T>(promise: PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>): Promise<T | null> {
  const { data, error } = await promise;
  if (error && error.code !== "PGRST116") throw toRubiconError(error);
  return data;
}

export function createRubiconClient({ supabaseUrl, supabaseAnonKey, getToken, getIdentity }: RubiconClientOptions) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: getToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }) as SupabaseClient;

  async function ensureCreator(): Promise<Creator> {
    const identity = requireIdentity(getIdentity);
    const creator = await must(
      supabase
        .from("creators")
        .upsert(
          {
            id: identity.id,
            username: identity.username,
            display_name: identity.displayName,
          },
          { onConflict: "id" },
        )
        .select("id, username, display_name, created_at")
        .single<CreatorRow>(),
    );

    const profile = await maybe(
      supabase
        .from("creator_profiles")
        .select("creator_id, bio, avatar_url")
        .eq("creator_id", identity.id)
        .maybeSingle<CreatorProfileRow>(),
    );

    return {
      id: creator.id,
      username: creator.username,
      displayName: creator.display_name,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      createdAt: creator.created_at,
    };
  }

  // The creator's receiving wallet is the `to` address used to query Circle's
  // Gateway transfers. Wallet config is creator settings, not the payment
  // ledger, so it stays in the DB.
  async function loadWalletAddress(creatorId: string): Promise<string | null> {
    const wallet = await maybe(
      supabase
        .from("creator_wallets")
        .select("address")
        .eq("creator_id", creatorId)
        .maybeSingle<{ address: string | null }>(),
    );
    return wallet?.address ?? null;
  }

  async function articleContext(creatorId: string, articleId?: string) {
    let articleQuery = supabase
      .from("articles")
      .select(
        "id, creator_id, title, author, state, price_per_word_atomic, max_article_price_atomic, total_words, revision, seller_agent_config, body, created_at, updated_at",
      )
      .eq("creator_id", creatorId)
      .neq("state", "deleted")
      .order("updated_at", { ascending: false });

    if (articleId) articleQuery = articleQuery.eq("id", articleId);

    const articles = await must(articleQuery.returns<ArticleRow[]>());
    const articleIds = articles.map((article) => article.id);

    if (articleIds.length === 0) {
      return { articles, sections: [], payments: [], sessions: [] };
    }

    const [sections, payments, sessions] = await Promise.all([
      must(
        supabase
          .from("article_sections")
          .select("id, article_id, section_id, heading, level, word_start, word_count, ordinal")
          .in("article_id", articleIds)
          .order("ordinal", { ascending: true })
          .returns<ArticleSectionRow[]>(),
      ),
      must(
        supabase
          .from("word_payments")
          .select("id, payment_id, article_id, creator_id, session_id, sequence, amount_atomic, creator_amount_atomic, rubicon_fee_atomic, transfer_id, settlement_id, settlement_ids, created_at")
          .eq("creator_id", creatorId)
          .in("article_id", articleIds)
          .order("created_at", { ascending: false })
          .returns<WordPaymentRow[]>(),
      ),
      must(
        supabase
          .from("stream_sessions")
          .select("id, article_id, creator_id, words_delivered, paid_atomic, created_at")
          .eq("creator_id", creatorId)
          .in("article_id", articleIds)
          .order("created_at", { ascending: false })
          .returns<StreamSessionRow[]>(),
      ),
    ]);

    return { articles, sections, payments, sessions };
  }

  async function replaceSections(articleId: string, body: string, inputSections: CreateArticleInput["sections"] = []) {
    const parsed = parseSections(body);
    const ordered = parsed.map((section, index) => ({
      ...section,
      heading: inputSections[index]?.heading?.trim() || section.title,
      ordinal: inputSections[index]?.ordinal ?? index,
    }));

    const rows = ordered
      .sort((a, b) => a.ordinal - b.ordinal)
      .reduce<Array<Omit<ArticleSectionRow, "article_id"> & { article_id: string }>>((acc, section, index) => {
        const wordStart = acc.reduce((sum, row) => sum + row.word_count, 0);
        acc.push({
          id: randomId("section"),
          article_id: articleId,
          section_id: `section-${index + 1}`,
          heading: section.heading,
          level: 1,
          word_start: wordStart,
          word_count: section.wordCount,
          ordinal: index,
        });
        return acc;
      }, []);

    await must(supabase.from("article_sections").delete().eq("article_id", articleId).select("id").returns<Array<{ id: string }>>());
    if (rows.length > 0) {
      await must(supabase.from("article_sections").insert(rows).select("id").returns<Array<{ id: string }>>());
    }

    return rows.reduce((sum, row) => sum + row.word_count, 0);
  }

  return {
    async getCreator() {
      return ensureCreator();
    },

    async updateCreator(input: UpdateCreatorInput) {
      const identity = requireIdentity(getIdentity);
      if (input.displayName !== undefined) {
        await must(
          supabase
            .from("creators")
            .update({ display_name: input.displayName })
            .eq("id", identity.id)
            .select("id")
            .single<{ id: string }>(),
        );
      }
      if (input.bio !== undefined || input.avatarUrl !== undefined) {
        await must(
          supabase
            .from("creator_profiles")
            .upsert(
              {
                creator_id: identity.id,
                ...(input.bio !== undefined ? { bio: input.bio } : {}),
                ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
              },
              { onConflict: "creator_id" },
            )
            .select("creator_id")
            .single<{ creator_id: string }>(),
        );
      }
      return ensureCreator();
    },

    async getWallet(): Promise<Wallet> {
      const identity = requireIdentity(getIdentity);
      const wallet = await maybe(
        supabase
          .from("creator_wallets")
          .select("creator_id, address, network, verified")
          .eq("creator_id", identity.id)
          .maybeSingle<WalletRow>(),
      );
      return {
        address: wallet?.address ?? null,
        network: wallet?.network ?? null,
        verified: wallet?.verified ?? false,
      };
    },

    async updateWallet(input: UpdateWalletInput): Promise<Wallet> {
      const identity = requireIdentity(getIdentity);
      const wallet = await must(
        supabase
          .from("creator_wallets")
          .upsert(
            {
              creator_id: identity.id,
              address: input.address,
              network: input.network,
              verified: input.verified ?? false,
            },
            { onConflict: "creator_id" },
          )
          .select("creator_id, address, network, verified")
          .single<WalletRow>(),
      );
      return {
        address: wallet.address,
        network: wallet.network,
        verified: wallet.verified,
      };
    },

    async listArticles(): Promise<Article[]> {
      const identity = requireIdentity(getIdentity);
      const { articles, sections, payments, sessions } = await articleContext(identity.id);
      return articles.map((article) => mapArticle(article, sections, payments, sessions));
    },

    async createArticle(input: CreateArticleInput): Promise<Article> {
      const identity = requireIdentity(getIdentity);
      await ensureCreator();

      const id = randomId("article");
      const now = new Date().toISOString();
      const totalWords = parseSections(input.body).reduce((sum, section) => sum + section.wordCount, 0);

      const article = await must(
        supabase
          .from("articles")
          .insert({
            id,
            creator_id: identity.id,
            title: input.title,
            author: input.author,
            state: "draft",
            price_per_word_atomic: input.pricePerWordAtomic,
            max_article_price_atomic: input.maxArticlePriceAtomic ?? null,
            total_words: totalWords,
            revision: 1,
            seller_agent_config: input.sellerAgentConfig ?? null,
            body: input.body,
            updated_at: now,
          })
          .select(
            "id, creator_id, title, author, state, price_per_word_atomic, max_article_price_atomic, total_words, revision, seller_agent_config, body, created_at, updated_at",
          )
          .single<ArticleRow>(),
      );

      await must(
        supabase
          .from("article_revisions")
          .insert({
            id: randomId("revision"),
            article_id: id,
            revision: 1,
            body: input.body,
          })
          .select("id")
          .single<{ id: string }>(),
      );

      const authoritativeWords = await replaceSections(id, input.body, input.sections);
      if (authoritativeWords !== totalWords) {
        await must(supabase.from("articles").update({ total_words: authoritativeWords }).eq("id", id).select("id").single<{ id: string }>());
        article.total_words = authoritativeWords;
      }

      return mapArticle(article, [], [], []);
    },

    async getArticle(articleId: string): Promise<ArticleDetail> {
      const identity = requireIdentity(getIdentity);
      const { articles, sections, payments, sessions } = await articleContext(identity.id, articleId);
      const article = articles[0];
      if (!article) throw new RubiconError("not_found", 404, "article_not_found", "Article not found.");

      const base = mapArticle(article, sections, payments, sessions);
      const articlePayments = payments.filter((payment) => payment.article_id === articleId);
      const articleSessions: SellerAgentSession[] = sessions
        .filter((session) => session.article_id === articleId)
        .map((session) => ({
          id: session.id,
          startedAt: session.created_at,
          wordsRead: session.words_delivered,
          earnings: sumAtomic(articlePayments.filter((payment) => payment.session_id === session.id).map((payment) => payment.creator_amount_atomic)),
        }));

      const sectionUsage: SectionUsage[] = base.sections.map((section) => ({
        sectionId: section.sectionId,
        heading: section.heading,
        wordsRead: articlePayments.filter((payment) => payment.sequence >= section.wordStart && payment.sequence < section.wordStart + section.wordCount).length,
      }));

      return {
        ...base,
        body: article.body,
        sessions: articleSessions,
        sectionUsage,
        paymentActivity: articlePayments.map((payment) => ({
          id: payment.id,
          date: payment.created_at,
          articleId: payment.article_id,
          articleTitle: article.title,
          wordsRead: 1,
          grossAmount: payment.amount_atomic,
          platformFee: payment.rubicon_fee_atomic,
          creatorAmount: payment.creator_amount_atomic,
          status: settlementReferenceOf(payment) ? "settled" : "pending",
          settlementReference: settlementReferenceOf(payment),
        })),
      };
    },

    async updateArticle(articleId: string, input: UpdateArticleInput): Promise<Article> {
      const identity = requireIdentity(getIdentity);
      const current = await this.getArticle(articleId);
      let nextRevision = current.revision;
      let totalWords = current.totalWords;

      if (input.body !== undefined || input.sections !== undefined) {
        const body = input.body ?? current.body;
        totalWords = await replaceSections(articleId, body, input.sections);
        nextRevision = current.revision + 1;
        await must(
          supabase
            .from("article_revisions")
            .insert({
              id: randomId("revision"),
              article_id: articleId,
              revision: nextRevision,
              body,
            })
            .select("id")
            .single<{ id: string }>(),
        );
      }

      const updates = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.author !== undefined ? { author: input.author } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.pricePerWordAtomic !== undefined ? { price_per_word_atomic: input.pricePerWordAtomic } : {}),
        ...(input.maxArticlePriceAtomic !== undefined ? { max_article_price_atomic: input.maxArticlePriceAtomic } : {}),
        ...(input.sellerAgentConfig !== undefined ? { seller_agent_config: input.sellerAgentConfig } : {}),
        total_words: totalWords,
        revision: nextRevision,
        updated_at: new Date().toISOString(),
      };

      await must(supabase.from("articles").update(updates).eq("id", articleId).eq("creator_id", identity.id).select("id").single<{ id: string }>());
      return this.getArticle(articleId);
    },

    async publishArticle(articleId: string): Promise<Article> {
      const identity = requireIdentity(getIdentity);
      await must(
        supabase
          .from("articles")
          .update({ state: "live", updated_at: new Date().toISOString() })
          .eq("id", articleId)
          .eq("creator_id", identity.id)
          .select("id")
          .single<{ id: string }>(),
      );
      return this.getArticle(articleId);
    },

    async pauseArticle(articleId: string): Promise<Article> {
      const identity = requireIdentity(getIdentity);
      await must(
        supabase
          .from("articles")
          .update({ state: "paused", updated_at: new Date().toISOString() })
          .eq("id", articleId)
          .eq("creator_id", identity.id)
          .select("id")
          .single<{ id: string }>(),
      );
      return this.getArticle(articleId);
    },

    async archiveArticle(articleId: string): Promise<void> {
      const identity = requireIdentity(getIdentity);
      await must(
        supabase
          .from("articles")
          .update({ state: "archived", updated_at: new Date().toISOString() })
          .eq("id", articleId)
          .eq("creator_id", identity.id)
          .select("id")
          .single<{ id: string }>(),
      );
    },

    async getEarnings(): Promise<EarningsSummary> {
      const identity = requireIdentity(getIdentity);
      // Settled earnings / words paid come from the Circle Gateway settlement
      // ledger. Article-level analytics (live count, top article) have no
      // Gateway equivalent — a transfer record doesn't say which article it
      // paid for — so they stay DB-derived.
      const [articles, payments, address] = await Promise.all([
        must(supabase.from("articles").select("id, title, state").eq("creator_id", identity.id).neq("state", "deleted").returns<Array<Pick<ArticleRow, "id" | "title" | "state">>>()),
        must(
          supabase
            .from("word_payments")
            .select("id, article_id, creator_amount_atomic")
            .eq("creator_id", identity.id)
            .returns<Array<Pick<WordPaymentRow, "id" | "article_id" | "creator_amount_atomic">>>(),
        ),
        loadWalletAddress(identity.id),
      ]);

      const transfers = address ? await fetchGatewayTransfers(address) : [];
      const settled = transfers.filter((transfer) => paymentStatusFromTransfer(transfer.status) === "settled");

      const topArticle = articles
        .map((article) => ({
          id: article.id,
          title: article.title,
          earnings: sumAtomic(payments.filter((payment) => payment.article_id === article.id).map((payment) => payment.creator_amount_atomic)),
        }))
        .sort((a, b) => Number(BigInt(b.earnings) - BigInt(a.earnings)))[0];

      return {
        settledEarnings: sumAtomic(settled.map((transfer) => transfer.amount)),
        wordsPaidFor: settled.length,
        // Distinct paying agents (by buyer wallet) from the Gateway ledger.
        agentReads: new Set(transfers.map((transfer) => transfer.fromAddress)).size,
        liveArticles: articles.filter((article) => article.state === "live").length,
        topArticle: topArticle && topArticle.earnings !== "0" ? topArticle : null,
      };
    },

    async getPaymentActivity(): Promise<PaymentActivity[]> {
      const identity = requireIdentity(getIdentity);
      const address = await loadWalletAddress(identity.id);
      if (!address) return [];
      const transfers = await fetchGatewayTransfers(address);
      // x402 transfers carry no article/session/fee metadata, so the per-row
      // article and word counts aren't available here — the settlement record
      // only knows the wallet it paid. Rubicon takes no fee, so gross == net.
      return transfers.map((transfer) => ({
        id: transfer.id,
        date: transfer.createdAt,
        articleId: "",
        articleTitle: "—",
        wordsRead: 1,
        grossAmount: transfer.amount,
        platformFee: "0",
        creatorAmount: transfer.amount,
        status: paymentStatusFromTransfer(transfer.status),
        settlementReference: transfer.id,
      }));
    },
  };
}

export type RubiconClient = ReturnType<typeof createRubiconClient>;
