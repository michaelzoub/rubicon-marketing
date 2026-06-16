"use client";

import { usePrivy } from "@privy-io/react-auth";
import { CheckCircle2, Database, FileText, Link2, Lock, LogOut, RefreshCw, Save, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { ArticleRegistry, StreamableArticle, VerificationStatus } from "@/lib/articles";
import { usePrivyConfigured } from "../providers";

const starterArticle = `# Background
Paste the gated article text here. Use markdown headings to preserve sections for streaming.

# Relevant Section
Agents can stream directly toward this section when their task matches the heading.

# Notes
Keep source paragraphs intact so the seller endpoint can send chunks without losing context.`;

type SaveState = "idle" | "saving" | "saved" | "failed";
type Source = "X/Twitter" | "Substack";

export function CreatorDashboard({ initialRegistry }: { initialRegistry: ArticleRegistry }) {
  const privyConfigured = usePrivyConfigured();

  if (!privyConfigured) {
    return <MissingPrivyConfig articles={initialRegistry.articles} />;
  }

  return <AuthenticatedCreatorDashboard initialRegistry={initialRegistry} />;
}

function AuthenticatedCreatorDashboard({ initialRegistry }: { initialRegistry: ArticleRegistry }) {
  const { ready, authenticated, user, login, logout, linkTwitter } = usePrivy();
  const [registry, setRegistry] = useState(initialRegistry);
  const [selectedSource, setSelectedSource] = useState<Source>("X/Twitter");
  const [substackUrl, setSubstackUrl] = useState("");
  const [gatedPostUrl, setGatedPostUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(starterArticle);
  const [pricePerWord, setPricePerWord] = useState("0.00001");
  const [maxPrice, setMaxPrice] = useState("0.02");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const twitter = user?.twitter ?? user?.linkedAccounts.find((account) => account.type === "twitter_oauth");
  const twitterUsername = twitter && "username" in twitter ? twitter.username : user?.twitter?.username;
  const walletAddress = user?.wallet?.address;
  const substackStatus: VerificationStatus = substackUrl ? "pending" : "pending";
  const sourceVerificationStatus: VerificationStatus = selectedSource === "X/Twitter" && twitterUsername ? "verified" : substackStatus;
  const canPublish = ready && authenticated && sourceVerificationStatus === "verified";
  const parsedSections = useMemo(() => parseSections(content), [content]);
  const authorUsername = selectedSource === "X/Twitter" ? twitterUsername ?? user?.id ?? "" : substackUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  async function saveArticle() {
    if (!canPublish || !authorUsername) return;

    setSaveState("saving");
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gated_post_url: gatedPostUrl,
          title,
          content,
          price_per_word: pricePerWord,
          max_price: maxPrice,
          connected_profile_source: selectedSource,
          author_username: authorUsername,
          author_wallet_address: walletAddress,
          verification_status: sourceVerificationStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to save article");

      const result = (await response.json()) as { article: StreamableArticle };
      setRegistry((current) => ({
        ...current,
        articles: [result.article, ...current.articles.filter((article) => article.article_id !== result.article.article_id)],
      }));
      setSaveState("saved");
    } catch {
      setSaveState("failed");
    }
  }

  return (
    <div className="container py-8">
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="eyebrow">Creator onboarding</p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-none">Publish gated article streams to agents.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Sign in with Privy, connect X/Twitter ownership, add gated posts, and save article sections for x402 word streaming.
          </p>
        </div>
        <AuthPanel
          ready={ready}
          authenticated={authenticated}
          twitterUsername={twitterUsername ?? null}
          walletAddress={walletAddress}
          onLogin={() => login({ loginMethods: ["twitter"] })}
          onLinkTwitter={linkTwitter}
          onLogout={logout}
          articleCount={registry.articles.length}
        />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <ProfilePanel
          ready={ready}
          authenticated={authenticated}
          selectedSource={selectedSource}
          twitterUsername={twitterUsername ?? null}
          substackUrl={substackUrl}
          onSelect={setSelectedSource}
          onSubstackUrlChange={setSubstackUrl}
          onLogin={() => login({ loginMethods: ["twitter"] })}
          onLinkTwitter={linkTwitter}
        />
        <EditorPanel
          canPublish={canPublish}
          selectedSource={selectedSource}
          sourceVerificationStatus={sourceVerificationStatus}
          gatedPostUrl={gatedPostUrl}
          title={title}
          content={content}
          pricePerWord={pricePerWord}
          maxPrice={maxPrice}
          parsedSections={parsedSections}
          saveState={saveState}
          onGatedPostUrlChange={setGatedPostUrl}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onPricePerWordChange={setPricePerWord}
          onMaxPriceChange={setMaxPrice}
          onSave={saveArticle}
        />
      </section>

      <ArticleRegistryPanel articles={registry.articles} />
    </div>
  );
}

function MissingPrivyConfig({ articles }: { articles: StreamableArticle[] }) {
  return (
    <div className="container py-8">
      <section className="border border-[var(--line)] bg-white p-6">
        <p className="eyebrow">Privy required</p>
        <h1 className="mt-3 text-3xl font-semibold">Configure real creator login.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Set <code className="mono border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-1">NEXT_PUBLIC_PRIVY_APP_ID</code> to enable Privy login and X/Twitter linking. Substack does not have a built-in Privy OAuth connector here, so its profile track stays pending until a verification adapter is configured.
        </p>
      </section>
      <ArticleRegistryPanel articles={articles} />
    </div>
  );
}

function AuthPanel({
  ready,
  authenticated,
  twitterUsername,
  walletAddress,
  articleCount,
  onLogin,
  onLinkTwitter,
  onLogout,
}: {
  ready: boolean;
  authenticated: boolean;
  twitterUsername: string | null;
  walletAddress?: string;
  articleCount: number;
  onLogin: () => void;
  onLinkTwitter: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="border border-[var(--line)] bg-white p-4">
      <div className="mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">Privy session</div>
      <div className="mt-3 grid gap-3">
        <StatusBadge icon={authenticated ? <CheckCircle2 size={15} /> : <Lock size={15} />} text={authenticated ? "authenticated" : ready ? "signed out" : "loading"} tone={authenticated ? "green" : "amber"} />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="X/Twitter" value={twitterUsername ? `@${twitterUsername}` : "not linked"} />
          <Stat label="Article streams" value={String(articleCount)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {!authenticated ? (
            <button type="button" onClick={onLogin} disabled={!ready} className="button button-primary disabled:opacity-45">
              Sign in with X
            </button>
          ) : (
            <>
              {!twitterUsername && (
                <button type="button" onClick={onLinkTwitter} className="button button-primary">
                  Connect X
                </button>
              )}
              <button type="button" onClick={onLogout} className="button button-secondary">
                <LogOut size={15} aria-hidden="true" /> Sign out
              </button>
            </>
          )}
        </div>
        <div className="mono break-all text-xs text-[var(--muted)]">{walletAddress ? `wallet ${walletAddress}` : "wallet not linked"}</div>
      </div>
    </div>
  );
}

function ProfilePanel({
  ready,
  authenticated,
  selectedSource,
  twitterUsername,
  substackUrl,
  onSelect,
  onSubstackUrlChange,
  onLogin,
  onLinkTwitter,
}: {
  ready: boolean;
  authenticated: boolean;
  selectedSource: Source;
  twitterUsername: string | null;
  substackUrl: string;
  onSelect: (source: Source) => void;
  onSubstackUrlChange: (value: string) => void;
  onLogin: () => void;
  onLinkTwitter: () => void;
}) {
  return (
    <section className="border border-[var(--line)] bg-white">
      <div className="grid gap-3 border-b border-[var(--faint)] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl font-semibold">Connection + verification</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Ownership gates publishing. Verified X can publish now; Substack stays pending until a real verification adapter is configured.</p>
        </div>
      </div>
      <div className="divide-y divide-[var(--faint)]">
        <ProfileRow
          source="X/Twitter"
          selected={selectedSource === "X/Twitter"}
          username={twitterUsername ? `@${twitterUsername}` : "not connected"}
          status={twitterUsername ? "verified" : "pending"}
          detail={twitterUsername ? "Verified by Privy Twitter OAuth" : authenticated ? "Privy session active; X not linked" : "Sign in with X to verify ownership"}
          actionLabel={!authenticated ? "Sign in" : twitterUsername ? "Selected" : "Connect X"}
          onSelect={() => onSelect("X/Twitter")}
          onAction={!authenticated ? onLogin : twitterUsername ? () => onSelect("X/Twitter") : onLinkTwitter}
          disabled={!ready}
        />
        <div className={`grid gap-4 p-5 ${selectedSource === "Substack" ? "bg-[var(--river-pale)]" : "bg-white"}`}>
          <ProfileRowShell
            source="Substack"
            selected={selectedSource === "Substack"}
            username={substackUrl || "profile URL required"}
            status="pending"
            detail="No Privy Substack OAuth connector is available in this app; ownership needs a separate verification adapter."
            actionLabel="Select"
            onSelect={() => onSelect("Substack")}
            onAction={() => onSelect("Substack")}
          />
          <label className="grid gap-2">
            <span className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">Substack profile URL</span>
            <input value={substackUrl} onChange={(event) => onSubstackUrlChange(event.target.value)} placeholder="https://creator.substack.com" className="h-11 border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]" />
          </label>
        </div>
      </div>
    </section>
  );
}

function ProfileRow({
  source,
  selected,
  username,
  status,
  detail,
  actionLabel,
  disabled,
  onSelect,
  onAction,
}: {
  source: Source;
  selected: boolean;
  username: string;
  status: VerificationStatus;
  detail: string;
  actionLabel: string;
  disabled?: boolean;
  onSelect: () => void;
  onAction: () => void;
}) {
  return (
    <div className={`p-5 ${selected ? "bg-[var(--river-pale)]" : "bg-white"}`}>
      <ProfileRowShell source={source} selected={selected} username={username} status={status} detail={detail} actionLabel={actionLabel} disabled={disabled} onSelect={onSelect} onAction={onAction} />
    </div>
  );
}

function ProfileRowShell({
  source,
  selected,
  username,
  status,
  detail,
  actionLabel,
  disabled,
  onSelect,
  onAction,
}: {
  source: Source;
  selected: boolean;
  username: string;
  status: VerificationStatus;
  detail: string;
  actionLabel: string;
  disabled?: boolean;
  onSelect: () => void;
  onAction: () => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <button type="button" onClick={onSelect} className="flex min-w-0 items-start gap-3 text-left">
        <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center border border-[var(--line)] bg-white text-[var(--river)]">
          <Link2 size={17} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{source}</span>
            <StatusPill status={status} />
          </span>
          <span className="mono mt-1 block truncate text-xs text-[var(--muted)]">{username}</span>
          <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">{detail}</span>
        </span>
      </button>
      <button type="button" onClick={onAction} disabled={disabled || selected && actionLabel === "Selected"} className="border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold hover:border-[var(--river)] disabled:opacity-45">
        {actionLabel}
      </button>
    </div>
  );
}

function EditorPanel({
  canPublish,
  selectedSource,
  sourceVerificationStatus,
  gatedPostUrl,
  title,
  content,
  pricePerWord,
  maxPrice,
  parsedSections,
  saveState,
  onGatedPostUrlChange,
  onTitleChange,
  onContentChange,
  onPricePerWordChange,
  onMaxPriceChange,
  onSave,
}: {
  canPublish: boolean;
  selectedSource: Source;
  sourceVerificationStatus: VerificationStatus;
  gatedPostUrl: string;
  title: string;
  content: string;
  pricePerWord: string;
  maxPrice: string;
  parsedSections: { heading: string; content: string }[];
  saveState: SaveState;
  onGatedPostUrlChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onPricePerWordChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onSave: () => void;
}) {
  const disabled = !canPublish || !gatedPostUrl || !title || !content || saveState === "saving";

  return (
    <section className="border border-[var(--line)] bg-white">
      <div className="grid gap-3 border-b border-[var(--faint)] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl font-semibold">Add gated article stream</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Paste a gated post, preserve headings, set word pricing, and save the stream record.</p>
        </div>
        {canPublish ? <StatusBadge icon={<ShieldCheck size={15} />} text={`${selectedSource} verified`} tone="green" /> : <StatusBadge icon={<Lock size={15} />} text={`${sourceVerificationStatus} verification`} tone="amber" />}
      </div>

      {!canPublish && <div className="border-b border-[var(--faint)] bg-[#fff8ed] p-4 text-sm leading-6 text-[#7b4e12]">Publishing is locked until the selected creator profile is verified through a real auth or verification adapter.</div>}

      <div className="grid gap-4 p-5">
        <label className="grid gap-2">
          <span className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">Gated post URL</span>
          <input value={gatedPostUrl} onChange={(event) => onGatedPostUrlChange(event.target.value)} placeholder="https://creator.substack.com/p/post-slug" className="h-11 border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]" />
        </label>

        <label className="grid gap-2">
          <span className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">Title</span>
          <input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Article title" className="h-11 border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">price_per_word</span>
            <input value={pricePerWord} onChange={(event) => onPricePerWordChange(event.target.value)} className="h-11 border border-[var(--line)] px-3 font-mono outline-none focus:border-[var(--river)]" />
          </label>
          <label className="grid gap-2">
            <span className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">max_price</span>
            <input value={maxPrice} onChange={(event) => onMaxPriceChange(event.target.value)} className="h-11 border border-[var(--line)] px-3 font-mono outline-none focus:border-[var(--river)]" />
          </label>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
          <label className="grid gap-2">
            <span className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">Article editor</span>
            <textarea value={content} onChange={(event) => onContentChange(event.target.value)} className="min-h-[320px] resize-y border border-[var(--line)] p-4 font-serif text-lg leading-8 outline-none focus:border-[var(--river)]" />
          </label>
          <div className="border border-[var(--line)] bg-[var(--surface-muted)] p-4">
            <div className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">Parsed sections</div>
            <div className="mt-4 grid gap-2">
              {parsedSections.map((section, index) => (
                <div key={`${section.heading}-${index}`} className="border border-[var(--faint)] bg-white p-3">
                  <div className="mono text-[0.62rem] text-[var(--river-deep)]">0{index + 1}</div>
                  <div className="mt-1 font-semibold">{section.heading}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{wordCount(section.content)} words</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onSave} disabled={disabled} className="button button-primary disabled:cursor-not-allowed disabled:opacity-45">
            {saveState === "saving" ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {saveState === "saving" ? "Saving" : "Save stream"}
          </button>
          <SaveStateMessage state={saveState} />
        </div>
      </div>
    </section>
  );
}

function ArticleRegistryPanel({ articles }: { articles: StreamableArticle[] }) {
  return (
    <section className="mt-8 border border-[var(--line)] bg-white">
      <div className="grid gap-3 border-b border-[var(--faint)] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl font-semibold">Streamable article registry</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Saved records include article IDs, creator profile source, pricing, content, and section structure for navigation.</p>
        </div>
        <StatusBadge icon={<Database size={15} />} text={`${articles.length} articles`} tone="blue" />
      </div>

      {articles.length === 0 ? (
        <div className="p-10">
          <FileText size={24} className="text-[var(--river)]" aria-hidden="true" />
          <h3 className="mt-5 text-xl font-semibold">No gated articles saved.</h3>
          <p className="mt-2 max-w-xl text-[var(--muted)]">Sign in, verify a creator profile, paste a gated post, and save the first article stream.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--faint)]">
          {articles.map((article) => (
            <article key={article.article_id} className="grid gap-5 p-5 xl:grid-cols-[1fr_280px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--river-deep)]">{article.article_id}</span>
                  <StatusPill status={article.verification_status} />
                </div>
                <h3 className="mt-2 text-xl font-semibold">{article.title}</h3>
                <div className="mt-3 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
                  <RegistryField label="author_username" value={article.author_username} />
                  <RegistryField label="profile/source" value={article.connected_profile_source} />
                  <RegistryField label="price_per_word" value={`$${article.price_per_word}`} />
                  <RegistryField label="max_price" value={`$${article.max_price}`} />
                </div>
                <a href={article.gated_post_url} className="mono mt-3 block truncate text-xs text-[var(--river-deep)]">
                  {article.gated_post_url}
                </a>
              </div>
              <div className="border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <div className="mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">Headings</div>
                <div className="mt-3 grid gap-2">
                  {article.sections.map((section, index) => (
                    <div key={`${article.article_id}-${section.heading}-${index}`} className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border border-[var(--faint)] bg-white px-2 py-2 text-sm">
                      <span className="mono text-xs text-[var(--river-deep)]">{index + 1}</span>
                      <span className="truncate font-medium">{section.heading}</span>
                      <span className="mono text-[0.62rem] text-[var(--muted)]">{wordCount(section.content)}w</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: VerificationStatus }) {
  const styles = {
    verified: "border-[#69b88c] bg-[#e8f6ef] text-[#165c3e]",
    pending: "border-[#e0b15f] bg-[#fff8ed] text-[#7b4e12]",
    failed: "border-[#e3a2a0] bg-[#fff1f0] text-[#8d2f2d]",
  } satisfies Record<VerificationStatus, string>;

  return <span className={`mono border px-2 py-1 text-[0.62rem] uppercase tracking-[0.1em] ${styles[status]}`}>{status}</span>;
}

function StatusBadge({ icon, text, tone }: { icon: ReactNode; text: string; tone: "green" | "amber" | "blue" }) {
  const styles = {
    green: "border-[#69b88c] bg-[#e8f6ef] text-[#165c3e]",
    amber: "border-[#e0b15f] bg-[#fff8ed] text-[#7b4e12]",
    blue: "border-[var(--line)] bg-[var(--river-pale)] text-[var(--river-deep)]",
  };

  return (
    <div className={`mono flex items-center gap-2 border px-3 py-2 text-xs ${styles[tone]}`}>
      {icon}
      {text}
    </div>
  );
}

function SaveStateMessage({ state }: { state: SaveState }) {
  if (state === "idle") return <span className="text-sm text-[var(--muted)]">Saved articles are written to the local article registry.</span>;
  if (state === "saving") return <span className="text-sm text-[var(--muted)]">Saving article sections.</span>;
  if (state === "saved") {
    return (
      <span className="flex items-center gap-2 text-sm text-[#165c3e]">
        <CheckCircle2 size={15} aria-hidden="true" /> Saved.
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm text-[#8d2f2d]">
      <XCircle size={15} aria-hidden="true" /> Save failed.
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--faint)] p-3">
      <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
      <div className="mono mt-2 break-words text-sm">{value}</div>
    </div>
  );
}

function RegistryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 border-b border-[var(--faint)] pb-2">
      <span className="mono text-xs text-[var(--muted)]">{label}</span>
      <span className="mono truncate text-xs text-[var(--ink)]">{value}</span>
    </div>
  );
}

function parseSections(content: string) {
  const sections: { heading: string; content: string }[] = [];
  let current = { heading: "Introduction", content: "" };

  for (const line of content.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      if (current.content.trim() || sections.length > 0) {
        sections.push({ ...current, content: current.content.trim() });
      }
      current = { heading: heading[2].trim(), content: "" };
    } else {
      current.content = `${current.content}${current.content ? "\n" : ""}${line}`;
    }
  }

  sections.push({ ...current, content: current.content.trim() });
  return sections.filter((section) => section.heading || section.content);
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}
