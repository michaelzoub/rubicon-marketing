"use client";

import { Check, Copy, FileText, Hash, Search, Terminal, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicCreator } from "@/lib/rubicon/public";
import { atomicPerWordToPer1000Usd, formatUsdNumber } from "@/lib/rubicon/pricing";

const installCommand = "npm install --global @rubicon-caliga/cli";
const promptCommand = "Use the Rubicon CLI to search for a relevant article, inspect its sections, then read with a $0.10 maximum budget. Stop when you have enough evidence.";

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function CopyCommand({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
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

function ArticleRow({ article }: { article: PublicCreator["articles"][number] }) {
  const [copied, setCopied] = useState(false);
  const command = `rubicon article navigation ${article.id} --goal "<your goal>"`;
  const price = formatUsdNumber(atomicPerWordToPer1000Usd(article.pricePerWordAtomic));

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <article className="explore-article-row">
      <div className="min-w-0">
        <h3>{article.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
          <span>{article.totalWords.toLocaleString()} words</span>
          <span className="text-[var(--river-deep)]">{price} / 1k words</span>
          <span className="mono truncate text-[0.64rem]">{article.id}</span>
        </div>
        {article.sectionHeadings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.sectionHeadings.slice(0, 3).map((heading) => (
              <span key={heading} className="explore-topic"><Hash size={9} /> {heading}</span>
            ))}
            {article.sectionHeadings.length > 3 && <span className="explore-topic">+{article.sectionHeadings.length - 3}</span>}
          </div>
        )}
      </div>
      <button type="button" onClick={copy} className="explore-row-action" aria-label={`Copy command for ${article.title}`}>
        {copied ? <Check size={15} /> : <Terminal size={15} />}
        <span>{copied ? "Copied" : "Command"}</span>
      </button>
    </article>
  );
}

export function ExploreDirectory({ creators }: { creators: PublicCreator[] }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => creators.map((creator) => ({
    ...creator,
    articles: creator.articles.filter((article) => {
      if (!normalizedQuery) return true;
      return [creator.displayName, creator.username, creator.bio ?? "", article.title, article.author, ...article.sectionHeadings]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    }),
  })).filter((creator) => creator.articles.length > 0), [creators, normalizedQuery]);

  const articleCount = filtered.reduce((sum, creator) => sum + creator.articles.length, 0);

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
    <div className="explore-layout">
      <div className="min-w-0">
        <div className="explore-toolbar">
          <label className="explore-search">
            <Search size={18} aria-hidden="true" />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search authors, articles, or topics" />
            <kbd>⌘K</kbd>
          </label>
          <span className="mono text-xs text-[var(--muted)]">{articleCount} {articleCount === 1 ? "article" : "articles"}</span>
        </div>

        <div className="explore-list">
          {filtered.length === 0 ? (
            <div className="explore-no-results">No matching articles.</div>
          ) : filtered.map((creator) => (
            <section key={creator.id} className="explore-creator">
              <div className="explore-creator-head">
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatarUrl} alt="" />
                ) : (
                  <span className="explore-avatar">{initials(creator.displayName)}</span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2>{creator.displayName}</h2>
                    <span className="explore-author-tag"><UserRound size={11} /> Author</span>
                  </div>
                  <p>@{creator.username}{creator.bio ? ` · ${creator.bio}` : ""}</p>
                </div>
                <span className="explore-article-count"><FileText size={13} /> {creator.articles.length}</span>
              </div>
              <div>
                {creator.articles.map((article) => <ArticleRow key={article.id} article={article} />)}
              </div>
            </section>
          ))}
        </div>
      </div>

      <aside className="explore-agent-panel">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-[var(--river-deep)]" />
          <h2>Use with agents</h2>
        </div>
        <CopyCommand label="Install the CLI" value={installCommand} />
        <CopyCommand label="Discover articles" value="rubicon repository --json" />
        <CopyCommand label="Search" value={'rubicon search "stablecoin settlement"'} />
        <CopyCommand label="Prompt your agent" value={promptCommand} />
        <a href="/docs#cli" className="explore-docs-link">CLI reference</a>
      </aside>
    </div>
  );
}
