import { ArrowRight, BookOpen, Coins, FileText, Hash, Users, Waves } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { listPublicCreators, PublicDirectoryUnavailable, type PublicCreator } from "@/lib/rubicon/public";
import { atomicPerWordToPer1000Usd, atomicToUsd, formatUsd, formatUsdNumber } from "@/lib/rubicon/pricing";

export const metadata: Metadata = {
  title: "Explore creators · Rubicon",
  description: "Browse creators publishing on Rubicon and the articles their seller agents stream to AI buyers, with per-word pricing.",
};

// The directory should reflect newly published articles quickly.
export const revalidate = 30;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function per1000Label(atomicPerWord: string): string {
  return formatUsdNumber(atomicPerWordToPer1000Usd(atomicPerWord));
}

function ExploreNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--faint)] bg-[rgba(21,21,23,0.92)] backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between gap-6" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Waves size={21} strokeWidth={1.9} className="text-[var(--river)]" aria-hidden="true" />
          <span>Rubicon</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-[var(--muted)] lg:flex">
          <Link className="site-nav-link" href="/#product">Product</Link>
          <Link className="site-nav-link" href="/#creators">Creators</Link>
          <Link className="site-nav-link" href="/#developers">Developers</Link>
          <Link className="site-nav-link" href="/#docs">Docs</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="button button-primary button-nav hidden text-sm sm:inline-flex">
            Start publishing <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link href="/explore" className="explore-pill text-sm" aria-current="page">
            Explore <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function ArticleCard({ article }: { article: PublicCreator["articles"][number] }) {
  const headings = article.sectionHeadings.slice(0, 4);
  const extra = article.sectionHeadings.length - headings.length;
  const fullReadAtomic = (BigInt(article.pricePerWordAtomic || "0") * BigInt(Math.max(article.totalWords, 0))).toString();

  return (
    <div className="card-soft flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold leading-snug tracking-[-0.01em]">{article.title}</h4>
          <p className="mt-1 text-sm text-[var(--muted)]">by {article.author}</p>
        </div>
        <span className="mono shrink-0 rounded-full border border-[var(--river-line)] bg-[var(--river-pale)] px-2.5 py-1 text-[0.66rem] font-medium text-[var(--river-deep)]">
          {per1000Label(article.pricePerWordAtomic)} / 1k words
        </span>
      </div>

      {headings.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {headings.map((heading, i) => (
            <span
              key={`${heading}-${i}`}
              className="mono inline-flex items-center gap-1 rounded-md border border-[var(--faint)] bg-[var(--surface-muted)] px-2 py-0.5 text-[0.62rem] text-[var(--muted)]"
            >
              <Hash size={9} aria-hidden="true" />
              {heading}
            </span>
          ))}
          {extra > 0 && (
            <span className="mono inline-flex items-center rounded-md px-2 py-0.5 text-[0.62rem] text-[var(--muted)]">+{extra} more</span>
          )}
        </div>
      )}

      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-[var(--faint)] pt-4 text-sm">
        <div>
          <div className="mono text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)]">Per word</div>
          <div className="mt-1 font-semibold text-[var(--river-deep)]">{formatUsd(article.pricePerWordAtomic)}</div>
        </div>
        <div>
          <div className="mono text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)]">Words</div>
          <div className="mt-1 font-semibold">{article.totalWords.toLocaleString()}</div>
        </div>
        <div>
          <div className="mono text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)]">Full read</div>
          <div className="mt-1 font-semibold">
            {article.maxArticlePriceAtomic && atomicToUsd(article.maxArticlePriceAtomic) > 0
              ? `≤ ${formatUsd(article.maxArticlePriceAtomic)}`
              : formatUsd(fullReadAtomic)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorBlock({ creator }: { creator: PublicCreator }) {
  return (
    <section className="card-soft p-6 md:p-7">
      <div className="flex flex-col gap-4 border-b border-[var(--faint)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.avatarUrl} alt={creator.displayName} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--river-pale)] text-base font-semibold text-[var(--river-deep)]">
              {initials(creator.displayName)}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-[-0.01em]">{creator.displayName}</h3>
            <p className="mono text-xs text-[var(--muted)]">@{creator.username}</p>
          </div>
        </div>
        <span className="mono inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--faint)] bg-[var(--surface-muted)] px-3 py-1 text-[0.66rem] text-[var(--muted)]">
          <FileText size={12} aria-hidden="true" />
          {creator.articles.length} live {creator.articles.length === 1 ? "article" : "articles"}
        </span>
      </div>

      {creator.bio && <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">{creator.bio}</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {creator.articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

function Notice({ title, body, error }: { title: string; body: string; error?: boolean }) {
  return (
    <div
      className={`card-soft flex flex-col items-center px-6 py-16 text-center ${
        error ? "border-[#e0b15f]" : ""
      }`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--river-pale)] text-[var(--river)]">
        <BookOpen size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{body}</p>
      <Link href="/dashboard/articles/new" className="button button-primary mt-6 text-sm">
        Publish an article <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default async function ExplorePage() {
  let creators: PublicCreator[] = [];
  let failed = false;

  try {
    creators = await listPublicCreators();
  } catch (error) {
    console.error("[explore] failed to load public directory:", error);
    failed = error instanceof PublicDirectoryUnavailable || error instanceof Error;
  }

  const articleCount = creators.reduce((sum, creator) => sum + creator.articles.length, 0);

  return (
    <>
      <ExploreNav />
      <main>
        <section className="relative overflow-hidden border-b border-[var(--faint)]">
          <div className="aurora" aria-hidden="true" />
          <div className="grid-texture" aria-hidden="true" />
          <div className="container py-14 md:py-20">
            <p className="eyebrow inline-flex w-fit items-center gap-2 rounded-full border border-[var(--river-line)] bg-[var(--river-pale)] px-3 py-1">
              <Users size={13} className="text-[var(--river)]" aria-hidden="true" /> The catalog
            </p>
            <h1 className="mt-5 max-w-[680px] text-[clamp(2.1rem,4.4vw,3.6rem)] font-[800] leading-[1.02] tracking-[-0.04em]">
              Explore creators publishing for agents.
            </h1>
            <p className="mt-5 max-w-[620px] text-lg leading-8 text-[var(--muted)]">
              Every article here is live and readable by AI buyer agents, one paid word at a time. Browse who&apos;s
              publishing, what they cover, and the per-word price before a single word streams.
            </p>
            {!failed && creators.length > 0 && (
              <div className="mono mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
                <span className="flex items-center gap-1.5"><Users size={14} className="text-[var(--river)]" aria-hidden="true" /> {creators.length} {creators.length === 1 ? "creator" : "creators"}</span>
                <span className="flex items-center gap-1.5"><FileText size={14} className="text-[var(--river)]" aria-hidden="true" /> {articleCount} live {articleCount === 1 ? "article" : "articles"}</span>
                <span className="flex items-center gap-1.5"><Coins size={14} className="text-[var(--river)]" aria-hidden="true" /> Pay per word</span>
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="container grid gap-6">
            {failed ? (
              <Notice
                error
                title="The catalog isn’t available right now"
                body="We couldn’t load the directory. This usually means the database connection isn’t configured yet. Try again shortly."
              />
            ) : creators.length === 0 ? (
              <Notice
                title="No live articles yet"
                body="No creators have published a live article yet. Be the first—publish an article and let agents start paying to read it."
              />
            ) : (
              creators.map((creator) => <CreatorBlock key={creator.id} creator={creator} />)
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--faint)] bg-[var(--surface-muted)]">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-4">
            <div className="flex items-center gap-2 font-semibold">
              <Waves size={16} className="text-[var(--river)]" aria-hidden="true" /> Rubicon
            </div>
            <p className="text-sm text-[var(--muted)]">Let AI agents pay to read your work.</p>
            <div className="flex items-center gap-3 border-t border-[var(--faint)] pt-4 text-sm text-[var(--muted)]">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/caliga-logo.png" alt="Caliga" className="h-10 w-10 object-cover [filter:brightness(8)_contrast(2.4)]" />
              </span>
              <span>Built and maintained by Caliga</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-[var(--muted)]">
            <Link href="/#product">Product</Link>
            <Link href="/#creators">Creators</Link>
            <Link href="/explore">Explore</Link>
            <Link href="/#developers">Developers</Link>
            <Link href="https://github.com/michaelzoub/rubicon">GitHub</Link>
            <Link href="/dashboard">Sign in</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
