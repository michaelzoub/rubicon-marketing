import { promises as fs } from "node:fs";
import path from "node:path";

export type VerificationStatus = "pending" | "verified" | "failed";
export type ConnectionStatus = "connected" | "not_connected";

export type CreatorProfile = {
  source: string;
  username: string;
  profile_url: string;
  connection_status: ConnectionStatus;
  verification_status: VerificationStatus;
  verified_at?: string;
};

export type ArticleSection = {
  heading: string;
  content: string;
};

export type StreamableArticle = {
  article_id: string;
  author_username: string;
  author_wallet_address?: string;
  connected_profile_source: string;
  gated_post_url: string;
  title: string;
  sections: ArticleSection[];
  content: string;
  price_per_word: string;
  max_price: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
};

export type ArticleRegistry = {
  creator: {
    author_username: string;
    author_wallet_address?: string;
    profiles: CreatorProfile[];
  };
  articles: StreamableArticle[];
};

export type CreateArticleInput = {
  gated_post_url: string;
  title: string;
  content: string;
  price_per_word: string;
  max_price: string;
  connected_profile_source: string;
  author_username: string;
  author_wallet_address?: string;
  verification_status: VerificationStatus;
};

const articleRegistryPath = path.join(process.cwd(), "data", "articles.json");

export async function readArticleRegistry(): Promise<ArticleRegistry> {
  const file = await fs.readFile(articleRegistryPath, "utf8");
  return JSON.parse(file) as ArticleRegistry;
}

export async function createArticle(input: CreateArticleInput): Promise<StreamableArticle> {
  const registry = await readArticleRegistry();
  const now = new Date().toISOString();
  const article: StreamableArticle = {
    article_id: makeArticleId(input.title || input.gated_post_url),
    author_username: input.author_username,
    author_wallet_address: input.author_wallet_address,
    connected_profile_source: input.connected_profile_source,
    gated_post_url: input.gated_post_url,
    title: input.title,
    sections: parseArticleSections(input.content),
    content: input.content,
    price_per_word: input.price_per_word,
    max_price: input.max_price,
    verification_status: input.verification_status,
    created_at: now,
    updated_at: now,
  };

  const existingIndex = registry.articles.findIndex((entry) => entry.article_id === article.article_id);
  const articles = [...registry.articles];
  if (existingIndex >= 0) {
    articles[existingIndex] = {
      ...article,
      created_at: articles[existingIndex].created_at,
    };
  } else {
    articles.unshift(article);
  }

  await fs.writeFile(articleRegistryPath, `${JSON.stringify({ ...registry, articles }, null, 2)}\n`);
  return article;
}

export function parseArticleSections(content: string): ArticleSection[] {
  const lines = content.split(/\r?\n/);
  const sections: ArticleSection[] = [];
  let current: ArticleSection = { heading: "Introduction", content: "" };

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      if (current.content.trim() || sections.length > 0) {
        sections.push({ ...current, content: current.content.trim() });
      }
      current = { heading: heading[2].trim(), content: "" };
      continue;
    }

    current.content = `${current.content}${current.content ? "\n" : ""}${line}`;
  }

  if (current.heading || current.content.trim()) {
    sections.push({ ...current, content: current.content.trim() });
  }

  return sections.filter((section) => section.heading || section.content);
}

function makeArticleId(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return slug || `article-${Date.now()}`;
}
