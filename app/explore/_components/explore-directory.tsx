"use client";

import { Check, Copy, ExternalLink, Search, Sparkles, Terminal, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicCreator } from "@/lib/rubicon/public";
import { atomicPerWordToPer1000Usd, formatUsdNumber } from "@/lib/rubicon/pricing";
import { trackClick } from "@/app/_components/analytics-links";
import { trackMarketingCtaClicked } from "@/app/_components/analytics/events";

type SortMode = "popular" | "newest" | "price" | "depth";

const installCommand = "npm install --global @rubicon-caliga/cli";
const promptCommand =
  "Find a live Rubicon article relevant to my task, inspect its sections, then read with a $0.10 max budget.";

const sortOptions: Array<{ id: SortMode; label: string }> = [
  { id: "popular", label: "Popular" },
  { id: "newest", label: "Newest" },
  { id: "price", label: "Lowest price" },
  { id: "depth", label: "Deep reads" },
];

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function compact(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function xAvatarUrl(username: string): string {
  const handle = username.replace(/^@/, "").trim();
  return handle ? `https://unavatar.io/x/${encodeURIComponent(handle)}` : "";
}

function xProfileUrl(username: string): string {
  const handle = username.replace(/^@/, "").trim();
  return handle ? `https://x.com/${encodeURIComponent(handle)}` : "";
}

function articlePrice(article: PublicCreator["articles"][number]) {
  return atomicPerWordToPer1000Usd(article.pricePerWordAtomic);
}

function sortArticles(articles: PublicCreator["articles"], sort: SortMode) {
  return [...articles].sort((a, b) => {
    if (sort === "popular") return b.popularityScore - a.popularityScore || b.totalWords - a.totalWords;
    if (sort === "price") return articlePrice(a) - articlePrice(b);
    if (sort === "depth") return b.totalWords - a.totalWords;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function sortCreators(creators: PublicCreator[], sort: SortMode) {
  return [...creators].sort((a, b) => {
    if (sort === "popular") return b.popularityScore - a.popularityScore || b.articles.length - a.articles.length || totalWords(b) - totalWords(a);
    if (sort === "price") return Math.min(...a.articles.map(articlePrice)) - Math.min(...b.articles.map(articlePrice));
    if (sort === "depth") return totalWords(b) - totalWords(a);
    return latestUpdated(b) - latestUpdated(a);
  });
}

function totalWords(creator: PublicCreator) {
  return creator.articles.reduce((sum, article) => sum + article.totalWords, 0);
}

function totalReads(articles: PublicCreator["articles"]) {
  return articles.reduce((sum, article) => sum + article.readCount, 0);
}

function xSourcedArticles(articles: PublicCreator["articles"]) {
  return articles.filter((article) => article.sourcePlatform === "x").length;
}

function sourceHandle(article: PublicCreator["articles"][number]) {
  return article.sourceAuthorHandle?.replace(/^@/, "").trim();
}

function latestUpdated(creator: PublicCreator) {
  return Math.max(...creator.articles.map((article) => new Date(article.updatedAt).getTime()));
}

function CopyCommand({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    trackClick("explore_copy_command_clicked", { label });
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="explore-command">
      <div className="explore-command-label">{label}</div>
      <div className="flex items-start gap-3">
        <code>{value}</code>
        <button type="button" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: PublicCreator["articles"][number] }) {
  const [copied, setCopied] = useState(false);
  const command = `rubicon article navigation ${article.id} --goal "<your goal>"`;
  const price = formatUsdNumber(articlePrice(article));

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    trackMarketingCtaClicked({
      cta_id: "explore_article_clicked",
      label: article.title.slice(0, 80),
      page: "explore",
      section: "explore_directory",
      audience: "agent",
      intent: "explore",
      position: "section",
      target_type: "copy",
    });
    trackClick("explore_article_use_clicked", { article_id: article.id });
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <article className="explore-article-card">
      <div className="min-w-0">
        <div className="explore-preview-label">Featured article</div>
        <h3>{article.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
          <span>{article.readCount.toLocaleString()} paid read{article.readCount === 1 ? "" : "s"}</span>
          <span>{article.totalWords.toLocaleString()} words</span>
          <span className="text-[var(--river)]">{price} / 1k words</span>
          {article.sourcePlatform === "x" && article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="explore-social-link"
              onClick={() => trackClick("explore_x_source_clicked", { article_id: article.id })}
            >
              X source{sourceHandle(article) ? ` · @${sourceHandle(article)}` : ""} <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
      <button type="button" onClick={copy} className="explore-row-action" aria-label={`Copy command for ${article.title}`}>
        {copied ? <Check size={15} /> : <Terminal size={15} />}
        <span>{copied ? "Copied" : "Use"}</span>
      </button>
    </article>
  );
}

function CreatorRoom({ creator, sort }: { creator: PublicCreator; sort: SortMode }) {
  const articles = sortArticles(creator.articles, sort);
  const featuredArticle = articles[0];
  const remainingArticles = Math.max(0, articles.length - 1);
  const readCount = totalReads(articles);
  const wordCount = totalWords(creator);
  const xArticleCount = xSourcedArticles(articles);
  const avatarSrc = xAvatarUrl(creator.username);
  const profileUrl = xProfileUrl(creator.username);
  return (
    <section id={`creator-${creator.id}`} className="explore-room">
      <div className="explore-room-cover">
        {avatarSrc && (
          // Personal banner derived from the creator's X profile image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt="" aria-hidden="true" className="explore-room-cover-img" />
        )}
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="explore-room-profile"
            onClick={() => trackClick("explore_x_profile_clicked", { creator_id: creator.id, username: creator.username })}
          >
            X profile <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
      </div>

      <span className="explore-room-avatar">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt="" />
        ) : (
          <span className="explore-avatar">{initials(creator.username)}</span>
        )}
      </span>

      <div className="explore-room-body">
        <div className="explore-room-id">
          <div className="flex flex-wrap items-center gap-2">
            <h2>@{creator.username}</h2>
            <span className="explore-author-tag"><UserRound size={11} /> Author</span>
          </div>
        </div>

        <dl className="explore-room-stats">
          <div>
            <dt>{compact(readCount)}</dt>
            <dd>Paid read{readCount === 1 ? "" : "s"}</dd>
          </div>
          <div>
            <dt>{compact(articles.length)}</dt>
            <dd>Live article{articles.length === 1 ? "" : "s"}</dd>
          </div>
          <div>
            <dt>{compact(wordCount)}</dt>
            <dd>Words</dd>
          </div>
        </dl>

        {xArticleCount > 0 && (
          <p className="explore-room-source">{xArticleCount} article{xArticleCount === 1 ? "" : "s"} sourced from X</p>
        )}

        {featuredArticle && (
          <div className="explore-room-feature">
            <ArticleCard article={featuredArticle} />
            {remainingArticles > 0 && (
              <div className="explore-more-articles">+{remainingArticles} more article{remainingArticles === 1 ? "" : "s"} from this author</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function ExploreDirectory({ creators }: { creators: PublicCreator[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("popular");
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const matches = creators.map((creator) => ({
      ...creator,
      articles: creator.articles.filter((article) => {
        if (!normalizedQuery) return true;
        return [creator.username, article.title, article.sourceAuthorHandle ?? "", ...article.sectionHeadings]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    })).filter((creator) => creator.articles.length > 0);

    return sortCreators(matches, sort);
  }, [creators, normalizedQuery, sort]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <div className="explore-directory" data-analytics-section="explore_directory">
      <aside className="explore-author-rail">
        <div className="explore-rail-label">Authors</div>
        <div className="grid gap-1.5">
          {filtered.map((creator) => {
            const avatarSrc = xAvatarUrl(creator.username);
            return (
              <a
                key={creator.id}
                href={`#creator-${creator.id}`}
                className="explore-author-link"
                onClick={() => trackClick("explore_author_clicked", { creator_id: creator.id, username: creator.username })}
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="" />
                ) : (
                  <span>{initials(creator.username)}</span>
                )}
                <span className="min-w-0 truncate">@{creator.username}</span>
                <span className="explore-author-proof">{totalReads(creator.articles).toLocaleString()} reads</span>
              </a>
            );
          })}
        </div>
        <div className="explore-agent-panel">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--river)]" />
            <h2>Try a paid read</h2>
          </div>
          <CopyCommand label="Install" value={installCommand} />
          <CopyCommand label="Agent prompt" value={promptCommand} />
          <a
            href="/docs#cli"
            className="explore-docs-link"
            onClick={() => trackClick("explore_cli_reference_clicked")}
          >
            CLI reference
          </a>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="explore-toolbar">
          <label className="explore-search">
            <Search size={18} aria-hidden="true" />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search authors, articles, sections" />
            <kbd>⌘K</kbd>
          </label>
          <div className="explore-sort" aria-label="Sort articles">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={sort === option.id ? "is-active" : ""}
                onClick={() => {
                  setSort(option.id);
                  trackClick("explore_sort_clicked", { sort: option.id });
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="explore-room-grid">
          {filtered.length === 0 ? <div className="explore-no-results">No matching articles.</div> : filtered.map((creator) => <CreatorRoom key={creator.id} creator={creator} sort={sort} />)}
        </div>
      </section>
    </div>
  );
}
