/**
 * Public, unauthenticated reads for the Explore directory.
 *
 * Visitors browse the catalog of creators and their *live* articles (title,
 * author, price, length). Nothing here exposes unpaid body text, drafts, or
 * any creator-private data — only what a buyer needs to decide what to read.
 *
 * Runs server-side. Prefers a server-only service-role key when present so the
 * directory works regardless of row-level-security policies; otherwise falls
 * back to the public anon key (which requires an RLS policy permitting anon
 * SELECT on live articles + creators).
 */
import { createClient } from "@supabase/supabase-js";
import type { ArticleState } from "./types";

export interface PublicArticle {
  id: string;
  title: string;
  author: string;
  /** Price per single word, in atomic USDC units. */
  pricePerWordAtomic: string;
  /** Optional cap on the total an agent can be charged for one article. */
  maxArticlePriceAtomic: string | null;
  /** Total billable words, as measured by the gateway tokenizer. */
  totalWords: number;
  /** Navigable section headings agents can steer toward (no body text). */
  sectionHeadings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicCreator {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  articles: PublicArticle[];
}

type ArticleRow = {
  id: string;
  creator_id: string;
  title: string;
  author: string;
  state: ArticleState;
  price_per_word_atomic: string;
  max_article_price_atomic: string | null;
  total_words: number;
  created_at: string;
  updated_at: string;
};

type SectionRow = { article_id: string; heading: string; ordinal: number };
type CreatorRow = { id: string; username: string; display_name: string; created_at: string };
type ProfileRow = { creator_id: string; bio: string | null; avatar_url: string | null };

export class PublicDirectoryUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicDirectoryUnavailable";
  }
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new PublicDirectoryUnavailable("Supabase is not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * List every creator that has at least one live article, each with their live
 * catalog. Sorted by most recently updated article first.
 */
export async function listPublicCreators(): Promise<PublicCreator[]> {
  const supabase = publicClient();

  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("id, creator_id, title, author, state, price_per_word_atomic, max_article_price_atomic, total_words, created_at, updated_at")
    .eq("state", "live")
    .order("updated_at", { ascending: false })
    .returns<ArticleRow[]>();

  if (articlesError) {
    throw new PublicDirectoryUnavailable(articlesError.message);
  }
  if (!articles || articles.length === 0) return [];

  const articleIds = articles.map((a) => a.id);
  const creatorIds = Array.from(new Set(articles.map((a) => a.creator_id)));

  const [sectionsRes, creatorsRes, profilesRes] = await Promise.all([
    supabase
      .from("article_sections")
      .select("article_id, heading, ordinal")
      .in("article_id", articleIds)
      .order("ordinal", { ascending: true })
      .returns<SectionRow[]>(),
    supabase
      .from("creators")
      .select("id, username, display_name, created_at")
      .in("id", creatorIds)
      .returns<CreatorRow[]>(),
    supabase
      .from("creator_profiles")
      .select("creator_id, bio, avatar_url")
      .in("creator_id", creatorIds)
      .returns<ProfileRow[]>(),
  ]);

  if (creatorsRes.error) {
    throw new PublicDirectoryUnavailable(creatorsRes.error.message);
  }

  const sectionsByArticle = new Map<string, string[]>();
  for (const row of sectionsRes.data ?? []) {
    const list = sectionsByArticle.get(row.article_id) ?? [];
    list.push(row.heading);
    sectionsByArticle.set(row.article_id, list);
  }

  const profileByCreator = new Map((profilesRes.data ?? []).map((p) => [p.creator_id, p]));
  const creatorById = new Map((creatorsRes.data ?? []).map((c) => [c.id, c]));

  const byCreator = new Map<string, PublicCreator>();
  for (const article of articles) {
    const creatorRow = creatorById.get(article.creator_id);
    if (!creatorRow) continue; // skip orphaned/private creators

    let creator = byCreator.get(article.creator_id);
    if (!creator) {
      const profile = profileByCreator.get(article.creator_id);
      creator = {
        id: creatorRow.id,
        username: creatorRow.username,
        displayName: creatorRow.display_name,
        bio: profile?.bio ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        createdAt: creatorRow.created_at,
        articles: [],
      };
      byCreator.set(article.creator_id, creator);
    }

    creator.articles.push({
      id: article.id,
      title: article.title,
      author: article.author,
      pricePerWordAtomic: article.price_per_word_atomic,
      maxArticlePriceAtomic: article.max_article_price_atomic,
      totalWords: article.total_words,
      sectionHeadings: sectionsByArticle.get(article.id) ?? [],
      createdAt: article.created_at,
      updatedAt: article.updated_at,
    });
  }

  // Most recently active creators first.
  return Array.from(byCreator.values()).sort((a, b) => {
    const aLatest = a.articles[0]?.updatedAt ?? a.createdAt;
    const bLatest = b.articles[0]?.updatedAt ?? b.createdAt;
    return bLatest < aLatest ? -1 : bLatest > aLatest ? 1 : 0;
  });
}
