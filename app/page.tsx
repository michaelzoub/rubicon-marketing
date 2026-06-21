"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Coins,
  Copy,
  FileText,
  Github,
  Link2,
  LockKeyhole,
  MessageSquare,
  Search,
  Settings2,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SellerGlyph } from "./_components/agent-glyphs";
import { HowItWorks } from "./_components/how-it-works";
import { StreamTheater } from "./_components/stream-theater";
import { WordStreamDemo } from "./_components/word-stream";

const githubUrl = "https://github.com/michaelzoub/rubicon";
const skillUrl = "https://www.rubiconpay.xyz/skill.md";
const setupSkillPrompt = `Set up the Rubicon skill from ${skillUrl}. Help me fund my buyer wallet, then find and summarize the first available article. Spend no more than $0.01.`;

const ease = [0.16, 1, 0.3, 1] as const;

const fade = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease },
} as const;

function StackPanel({
  id,
  className,
  children,
}: {
  id?: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
}

const developerCode = {
  sdk: `import Rubicon from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL,
});

const receipt = await rubicon.run({
  articleId: "rubicon-streaming-001",
  goal: "Find the resale-fee clause",
  maxSpendAtomic: "20000",
});

console.log(receipt);`,
  stream: `const receipt = await rubicon.run({
  articleId: "rubicon-streaming-001",
  goal: "Find the resale-fee clause",
  maxSpendAtomic: "20000",
  onWord: (word) => {
    process.stdout.write(\`\${word} \`);
  },
});`,
} as const;

function CodeShowcase() {
  const [active, setActive] = useState<keyof typeof developerCode>("sdk");
  const [copied, setCopied] = useState(false);
  const tabs: Array<{ id: keyof typeof developerCode; label: string }> = [
    { id: "sdk", label: "sdk" },
    { id: "stream", label: "stream" },
  ];
  const copyCode = async () => {
    await navigator.clipboard.writeText(developerCode[active]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="code-showcase min-w-0">
      <div className="flex items-center gap-7 border-b border-[var(--faint)] px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`mono border-b-2 px-2 pb-3 pt-1 text-sm transition-colors ${
              active === tab.id
                ? "border-[var(--ink)] text-[var(--ink)]"
                : "border-transparent text-[var(--quiet)] hover:text-[var(--muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--line)] bg-[#1d1d1f]">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f58bb2]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f2d18f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8fdc9b]" />
            <span className="mono ml-4 text-sm text-[var(--quiet)]">ts</span>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="mono flex items-center gap-2 text-sm text-[var(--quiet)] transition-colors hover:text-[var(--ink)]"
            aria-label="Copy code"
          >
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} {copied ? "copied" : "copy"}
          </button>
        </div>
        <pre className="mono max-h-[420px] max-w-full overflow-auto p-5 text-[0.82rem] leading-6 text-[#d6d6d9] md:p-7 md:text-[0.9rem] md:leading-7">
          <code>{developerCode[active]}</code>
        </pre>
      </div>
    </div>
  );
}

function AgentSkillSetup() {
  const [copied, setCopied] = useState(false);
  const copySetupPrompt = async () => {
    await navigator.clipboard.writeText(setupSkillPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="setup-skill-panel rounded-lg border border-[var(--river-line)] p-6 md:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold">
            <Link2 size={17} className="text-[var(--river)]" aria-hidden="true" /> Add Rubicon to your agent
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Paste this into Codex or another agent. It installs the Rubicon skill, funds a buyer wallet, and runs a
            capped first read.
          </p>
        </div>
        <button type="button" onClick={copySetupPrompt} className="button button-secondary min-h-10 shrink-0 text-sm">
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <code className="mono mt-5 block overflow-x-auto rounded-md border border-[var(--river-line)] bg-[rgba(0,0,0,0.28)] px-4 py-4 text-sm leading-7 text-[var(--ink)]">
        {setupSkillPrompt}
      </code>
    </div>
  );
}

function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--faint)] bg-[rgba(21,21,23,0.92)] backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between gap-6" aria-label="Main navigation">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
            <Waves size={21} strokeWidth={1.9} className="text-[var(--river)]" aria-hidden="true" />
            <span>Rubicon</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-[var(--muted)] lg:flex">
            <a className="site-nav-link" href="#product">Product</a>
            <a className="site-nav-link" href="#agents">Agents</a>
            <a className="site-nav-link" href="#creators">Creators</a>
            <Link className="site-nav-link" href="/docs">Docs</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="button button-primary button-nav hidden text-sm sm:inline-flex">
            Start publishing <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link href="/explore" className="explore-pill text-sm">
            Explore <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora" aria-hidden="true" />
      <div className="grid-texture" aria-hidden="true" />
      <div className="container grid gap-12 pb-16 pt-12 md:grid-cols-[1.02fr_0.98fr] md:pb-28 md:pt-16">
        <motion.div {...fade} className="flex flex-col justify-start md:pt-2">
          {/* <p className="eyebrow inline-flex w-fit items-center gap-2 rounded-full border border-[var(--river-line)] bg-[var(--river-pale)] px-3 py-1">
            <span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--river)]" /> Paid reading for AI agents
          </p> */}
          <h1 className="mt-5 max-w-[680px] text-[clamp(2.7rem,5.6vw,5.25rem)] font-[800] leading-[0.94] tracking-[-0.052em]">
            Let AI agents pay to read your work.
          </h1>
          <p className="mt-6 max-w-[560px] text-lg leading-8 text-[var(--muted)]">
            Publish premium articles, choose a price per word, and earn whenever an AI agent reads. Every word is paid, and
            agents can stop as soon as they have enough information.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="button button-primary">
              Start publishing <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a href="#agents" className="button button-secondary">
              Set up an agent
            </a>
          </div>
          <div className="mono mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> Pay per word</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> Stop anytime</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> 0% platform fee</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.14, ease }}
          className="flex min-w-0 items-center"
        >
          <div className="hero-visual w-full min-w-0">
            <StreamTheater />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CreatorValue() {
  const cards = [
    {
      icon: <Coins size={20} aria-hidden="true" />,
      title: "Earn from agent traffic",
      copy: "Make premium research readable by AI systems without giving away the full article. Every read is a sale, settled in USDC.",
      footer: "0% platform fee",
    },
    {
      icon: <Settings2 size={20} aria-hidden="true" />,
      title: "Stay in control",
      copy: "You set the price, the availability, and exactly which sections agents are allowed to navigate.",
      footer: "Your terms, always",
    },
    {
      icon: <BadgeCheck size={20} aria-hidden="true" />,
      title: "Get paid for exact usage",
      copy: "Read 137 words, earn for 137 words. Never an arbitrary bundle or a full-article purchase.",
      footer: "Word-for-word attribution",
    },
  ];
  return (
    <StackPanel id="creators" className="section stack-panel stack-panel-base bg-[var(--background)]">
      <motion.div {...fade} className="container">
        <p className="eyebrow">For creators</p>
        <h2 className="mt-4 section-title">Built around what creators actually want.</h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="card-soft flex flex-col p-7">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--river-pale)] text-[var(--river-deep)]">
                {card.icon}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 leading-7 text-[var(--muted)]">{card.copy}</p>
              <div className="mono mt-6 flex items-center gap-2 border-t border-[var(--faint)] pt-4 text-[0.72rem] uppercase tracking-[0.1em] text-[var(--river-deep)]">
                <Check size={13} aria-hidden="true" />
                {card.footer}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </StackPanel>
  );
}

function SellerAgent() {
  return (
    <StackPanel className="section stack-panel stack-panel-muted border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="eyebrow">The seller agent</p>
          <h2 className="mt-4 section-title">Every article has a seller agent.</h2>
          <p className="section-copy mt-5">
            It understands the article, helps buyer agents find the relevant section, protects unpaid content, and
            releases the article one paid word at a time.
          </p>
        </div>
        <div className="seller-agent-visual" aria-label="Seller agent routes a buyer to a protected article section">
          <div className="seller-query">
            <Search size={15} aria-hidden="true" />
            <span>Where are resale fees defined?</span>
          </div>
          <div className="seller-route" aria-hidden="true"><span /></div>
          <div className="seller-agent-node">
            <span className="seller-agent-icon"><SellerGlyph size={26} /></span>
            <div><strong>Seller agent</strong><span className="seller-agent-status"><i aria-hidden="true" />Routing query</span></div>
          </div>
          <div className="seller-document">
            <div className="seller-document-head">
              <div><FileText size={15} /> Premium research</div>
              <LockKeyhole size={14} className="text-[var(--muted)]" />
            </div>
            <div className="seller-section"><span>01</span><div><strong>Market overview</strong><i /></div></div>
            <div className="seller-section seller-section-active"><span>02</span><div><strong>Consent decree language</strong><i /></div></div>
            <div className="seller-section"><span>03</span><div><strong>Enforcement mechanics</strong><i /></div></div>
            <div className="seller-scan" aria-hidden="true" />
          </div>
          <div className="seller-result">
            <span>Section found</span>
            <strong>Start at section 02</strong>
          </div>
        </div>
      </motion.div>
    </StackPanel>
  );
}

function StreamDemoSection() {
  return (
    <section className="section bg-[var(--background)]">
      <motion.div {...fade} className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="eyebrow">Word-level metering</p>
          <h2 className="mt-4 section-title">Pay per word, bundled into one payment at scale.</h2>
          <p className="section-copy mt-5">
            Short reads stream and settle one word at a time. For large articles, the gateway bundles a contiguous run
            of words into a single chunk released by one payment, so there are fewer round-trips and faster delivery.
            Either way, you earn for exactly the words that were read.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            {[
              "Short reads stream and pay word by word",
              "Large articles bundle consecutive words into one payment",
              "Either way, you earn for exactly the words read",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check size={16} className="text-[var(--river)]" aria-hidden="true" /> {item}
              </div>
            ))}
          </div>
        </div>
        <WordStreamDemo />
      </motion.div>
    </section>
  );
}

function BrandChip({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-16 items-center justify-center rounded-xl border border-[var(--faint)] bg-[var(--surface-muted)] px-5">
      {failed ? (
        <span className="text-lg font-semibold tracking-[-0.01em]">{name}</span>
      ) : (
        <img src={src} alt={`${name} logo`} className="max-h-7 w-auto object-contain" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

function Settlement() {
  return (
    <StackPanel className="section stack-panel stack-panel-base bg-[var(--background)]">
      <motion.div {...fade} className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="eyebrow">Settlement</p>
          <h2 className="mt-4 section-title">How thousands of micropayments actually clear.</h2>
          <p className="section-copy mt-5">
            A single word can cost a fraction of a cent. Card rails would lose that to fees, so Rubicon settles every
            word as a USDC <strong>nanopayment</strong>: a transfer small enough to move per word, instantly, without a
            fee swallowing the payment.
          </p>
          <p className="section-copy mt-4">
            It runs on Circle’s stablecoin infrastructure and Arc, Circle’s USDC-native chain where stablecoins are the
            gas. That makes paying for one word, then another, thousands of times over, economically real.
          </p>
        </div>
        <div className="card-soft grid gap-5 p-7">
          <div className="grid grid-cols-2 gap-4">
            <BrandChip name="Circle" src="/circle-logo.avif" />
            <BrandChip name="Arc" src="/arc-logo.webp" />
          </div>
          <div className="grid gap-3 text-sm">
            {[
              "Per-word price set by the creator",
              "Each word settles as its own USDC nanopayment",
              "No card fees eating sub-cent amounts",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check size={16} className="text-[var(--river)]" aria-hidden="true" /> {item}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </StackPanel>
  );
}

function Agents() {
  const agentCards = [
    {
      icon: <MessageSquare size={18} aria-hidden="true" />,
      title: "Start from chat",
      copy: "Copy the prompt into Codex or another agent. The skill setup happens in the agent's own workflow.",
    },
    {
      icon: <Coins size={18} aria-hidden="true" />,
      title: "Cap every read",
      copy: "Set the buyer wallet and maximum spend before paid words stream.",
    },
    {
      icon: <Check size={18} aria-hidden="true" />,
      title: "Stop when answered",
      copy: "The agent pays word by word and can stop before buying the full article.",
    },
  ];
  return (
    <StackPanel id="agents" className="section stack-panel stack-panel-muted border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <p className="eyebrow">For agents</p>
        <h2 className="mt-4 section-title">Add paid reading to your agent.</h2>
        <p className="section-copy mt-5">
          Use Rubicon from the agent you already work with. It can discover articles, pay from a capped wallet, and stop
          as soon as it has the answer.
        </p>
        <div className="mt-10">
          <AgentSkillSetup />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {agentCards.map((card) => (
            <div key={card.title} className="card-soft p-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--river-pale)] text-[var(--river)]">{card.icon}</span>
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.copy}</p>
            </div>
          ))}
        </div>
        <div id="developers" className="mt-10 grid gap-6 scroll-mt-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="eyebrow">For developers</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">Use the SDK when you want direct control.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Wire Rubicon into your own agent loop, set a spend cap, and stream paid words when your workflow needs
              them.
            </p>
            <div className="mono mt-5 rounded-lg border border-[var(--river-line)] bg-[var(--river-pale)] px-4 py-3 text-sm text-[var(--river-deep)]">
              npm install @rubicon-caliga/agent-sdk
            </div>
          </div>
          <CodeShowcase />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={githubUrl} className="button button-secondary text-sm">
            <Github size={15} aria-hidden="true" /> View on GitHub
          </a>
          <Link href="/docs" className="button button-secondary text-sm">
            <BookOpen size={15} aria-hidden="true" /> Read the docs
          </Link>
        </div>
      </motion.div>
    </StackPanel>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--faint)] bg-[var(--surface-muted)]">
      <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <Waves size={16} className="text-[var(--river)]" aria-hidden="true" /> Rubicon
          </div>
          <p className="text-sm text-[var(--muted)]">Let AI agents pay to read your work.</p>
          <div className="flex items-center gap-3 border-t border-[var(--faint)] pt-4 text-sm text-[var(--muted)]">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden bg-white">
              <img src="/caliga-logo.png" alt="Caliga" className="h-10 w-10 object-cover [filter:brightness(8)_contrast(2.4)]" />
            </span>
            <span>Built and maintained by Caliga</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-[var(--muted)]">
          <a href="#product">Product</a>
          <a href="#agents">Agents</a>
          <a href="#creators">Creators</a>
          <Link href="/explore">Explore</Link>
          <Link href="/docs">Docs</Link>
          <a href={githubUrl}>GitHub</a>
          <Link href="/dashboard">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <HowItWorks />
        <Agents />
        <CreatorValue />
        <SellerAgent />
        <StreamDemoSection />
        <Settlement />
      </main>
      <Footer />
    </>
  );
}
