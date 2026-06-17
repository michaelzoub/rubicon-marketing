"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Coins,
  FileText,
  Github,
  MessageSquare,
  Quote,
  Settings2,
  Waves,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { WordStreamDemo } from "./_components/word-stream";

const githubUrl = "https://github.com/michaelzoub/rubicon";

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.24 },
  transition: { duration: 0.55, ease: "easeOut" },
} as const;

function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--faint)] bg-[rgba(255,255,255,0.82)] backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between gap-6" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Waves size={21} strokeWidth={1.9} className="text-[var(--river)]" aria-hidden="true" />
          <span>Rubicon</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-[var(--muted)] md:flex">
          <a className="hover:text-[var(--ink)]" href="#product">Product</a>
          <a className="hover:text-[var(--ink)]" href="#creators">Creators</a>
          <a className="hover:text-[var(--ink)]" href="#developers">Developers</a>
          <a className="hover:text-[var(--ink)]" href="#docs">Docs</a>
          <Link className="hover:text-[var(--ink)]" href="/dashboard">Sign in</Link>
        </div>
        <Link href="/dashboard" className="button button-primary text-sm">
          Start publishing <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="container grid gap-12 pb-16 pt-16 md:grid-cols-[1.05fr_0.95fr] md:pb-24 md:pt-24">
      <motion.div {...fade} className="flex flex-col justify-center">
        <p className="eyebrow">Paid reading for AI agents</p>
        <h1 className="mt-5 max-w-[640px] text-[clamp(2.3rem,4.8vw,4.4rem)] font-[700] leading-[1.02] tracking-[-0.02em]">
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
          <a href="#developers" className="button button-secondary">
            View developer docs
          </a>
        </div>
        <div className="mono mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> Pay per word</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> Stop anytime</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> 0% platform fee</span>
        </div>
      </motion.div>

      <motion.div {...fade} transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" as const }} className="flex items-center">
        <HeroFlow />
      </motion.div>
    </section>
  );
}

function HeroFlow() {
  const steps = [
    "Buyer agent asks a question",
    "Seller agent finds the relevant section",
    "Words stream individually",
    "One word = one payment",
    "Agent stops when the answer is found",
    "Creator earns for the exact words read",
  ];
  return (
    <div className="w-full rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
      <div className="grid gap-2">
        {steps.map((step, i) => (
          <div key={step}>
            <div
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                i === steps.length - 1
                  ? "border-[#69b88c] bg-[#e8f6ef] font-medium text-[#165c3e]"
                  : "border-[var(--faint)] bg-[var(--surface-muted)]"
              }`}
            >
              <span className="mono text-[0.66rem] text-[var(--river-deep)]">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-0.5 text-[var(--river)]">
                <ArrowDown size={15} strokeWidth={1.8} aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <FileText size={20} aria-hidden="true" />,
      title: "Publish",
      copy: "Add an article, review its sections, and choose your price per word.",
    },
    {
      icon: <MessageSquare size={20} aria-hidden="true" />,
      title: "Agents read",
      copy: "Your seller agent guides buyers to the right section and releases each word as it is paid for.",
    },
    {
      icon: <Coins size={20} aria-hidden="true" />,
      title: "You earn",
      copy: "Every delivered word is attributed to your article and receiving wallet.",
    },
  ];
  return (
    <section id="product" className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">How it works</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-xl border border-[var(--line)] bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--river-pale)] text-[var(--river)]">{step.icon}</span>
                <span className="mono text-xs text-[var(--river-deep)]">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 leading-7 text-[var(--muted)]">{step.copy}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function CreatorValue() {
  const cards = [
    {
      icon: <Coins size={20} aria-hidden="true" />,
      title: "Earn from agent traffic",
      copy: "Make premium research available to AI systems without giving away the complete article.",
    },
    {
      icon: <Settings2 size={20} aria-hidden="true" />,
      title: "Stay in control",
      copy: "Choose the price, article availability, receiving wallet, and sections agents can navigate.",
    },
    {
      icon: <BadgeCheck size={20} aria-hidden="true" />,
      title: "Get paid for exact usage",
      copy: "If an agent reads 137 words, you earn for 137 words—not an arbitrary bundle or full-article purchase.",
    },
  ];
  return (
    <section id="creators" className="section">
      <motion.div {...fade} className="container">
        <p className="eyebrow">For creators</p>
        <h2 className="mt-4 section-title">Built around what creators actually want.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-xl border border-[var(--line)] bg-white p-6">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--river-pale)] text-[var(--river)]">{card.icon}</span>
              <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 leading-7 text-[var(--muted)]">{card.copy}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function SellerAgent() {
  const conversation = [
    { who: "Buyer agent", tone: "buyer", text: "Where does the article discuss resale fees?" },
    { who: "Seller agent", tone: "seller", text: "The most relevant section is “Consent Decree Language.” Start there?" },
    { who: "Buyer", tone: "buyer", text: "Yes. Maximum spend: $0.02." },
    { who: "Seller agent", tone: "seller", text: "Begins the paid word stream." },
  ];
  return (
    <section className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="eyebrow">The seller agent</p>
          <h2 className="mt-4 section-title">Every article has a seller agent.</h2>
          <p className="section-copy mt-5">
            It understands the article, helps buyer agents find the relevant section, protects unpaid content, and
            releases the article one paid word at a time.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="grid gap-3">
            {conversation.map((line, i) => (
              <div
                key={i}
                className={`rounded-xl border px-4 py-3 ${
                  line.tone === "seller"
                    ? "border-[#69b88c] bg-[#e8f6ef]"
                    : "border-[var(--faint)] bg-[var(--surface-muted)]"
                }`}
              >
                <div className={`mono text-[0.62rem] uppercase tracking-[0.12em] ${line.tone === "seller" ? "text-[#24734f]" : "text-[var(--river-deep)]"}`}>
                  {line.who}
                </div>
                <p className={`mt-1.5 text-sm leading-6 ${line.tone === "seller" ? "text-[#165c3e]" : "text-[var(--ink)]"}`}>{line.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function StreamDemoSection() {
  return (
    <section className="section">
      <motion.div {...fade} className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="eyebrow">Word-level metering</p>
          <h2 className="mt-4 section-title">Every word is delivered and paid for, one at a time.</h2>
          <p className="section-copy mt-5">
            No subscriptions, no full-article purchases, no arbitrary bundles. The agent pays for each word as it reads,
            and stops the moment it has the answer. You earn for exactly what was read.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            {[
              "Each paid word is metered individually",
              "The agent sees the per-word price before streaming",
              "Unread words are never charged",
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

function Developers() {
  const steps = [
    "Install the Agent SDK",
    "Connect to a Rubicon gateway",
    "Ask the seller agent for navigation",
    "Open a budgeted stream",
    "Receive paid words until the stop condition is met",
  ];
  const code = `import { AgentClient, AgentPaymentEngine } from "@rubicon-caliga/agent-sdk";

// Connect to a Rubicon gateway
const client = new AgentClient({
  baseUrl: "https://api.rubicon.dev",
  paymentEngine: new AgentPaymentEngine(),
});

// Ask the seller agent for navigation
const { sellerAgent } = await client.askSellerAgentNavigation({
  articleId: "antitrust-analysis",
  buyerGoal: "Find the resale-fee clause",
  maxSpendAtomic: "20000", // $0.02 in USDC atomic units
});

// Open a budgeted stream
const session = await client.startArticleStream({
  articleId: "antitrust-analysis",
  sectionId: sellerAgent.selectedSectionIds[0],
  budget: { currency: "USDC", maxAmountAtomic: "20000" },
});

// Receive paid words until the stop condition is met
client.streamWithStopConditions(
  session,
  { hasEnoughInformation: ({ wordsStreamed }) => wordsStreamed >= 137 },
  (event) => {
    if (event.type === "article.usage") console.log(event.wordsStreamed, "words read");
  },
);`;

  return (
    <section id="developers" className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <p className="eyebrow">For developers</p>
        <h2 className="mt-4 section-title">Read paid articles in a few lines.</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <ol className="grid gap-3">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-white px-4 py-3">
                <span className="mono mt-0.5 text-sm text-[var(--river-deep)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium leading-6">{step}</span>
              </li>
            ))}
            <li className="mono mt-1 rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--river-deep)]">
              npm install @rubicon-caliga/agent-sdk
            </li>
          </ol>
          <pre className="mono max-w-full overflow-x-auto rounded-xl border border-[var(--faint)] bg-[#0f1519] p-5 text-[0.8rem] leading-6 text-[#dff4fb]">
            <code>{code}</code>
          </pre>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={githubUrl} className="button button-secondary text-sm">
            <Github size={15} aria-hidden="true" /> View on GitHub
          </a>
          <a href="#docs" className="button button-secondary text-sm">
            <BookOpen size={15} aria-hidden="true" /> Read the docs
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="docs" className="section">
      <motion.div {...fade} className="container">
        <div className="grid gap-8 rounded-2xl border border-[var(--line)] bg-white p-8 md:grid-cols-[auto_1fr] md:items-center md:p-10">
          <div className="text-center md:text-left">
            <div className="text-[clamp(3rem,8vw,5rem)] font-bold leading-none tracking-[-0.03em] text-[var(--river-deep)]">0%</div>
            <div className="mono mt-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Rubicon platform fee</div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Keep what you earn.</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              Rubicon platform fee: 0% during the current launch period. External network or payment-provider costs may
              still apply.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Trust() {
  const items = [
    "Unpaid article body text remains protected",
    "Buyers know the per-word price before streaming",
    "Each paid word is recorded",
    "Buyers can stop at any moment",
    "Creators retain control over article availability",
    "Rubicon’s current platform fee is zero",
  ];
  return (
    <section className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">Trust built into every stream.</h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white px-4 py-4">
              <Check size={17} className="shrink-0 text-[var(--green)]" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section">
      <motion.div {...fade} className="container">
        <div className="rounded-2xl border border-[var(--line)] bg-[linear-gradient(135deg,#f7fbff,#eef4fe)] p-8 text-center md:p-14">
          <Quote size={28} className="mx-auto text-[var(--river)]" aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-2xl text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.01em]">
            Make your writing readable—and payable—by agents.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/articles/new" className="button button-primary">
              Publish an article <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a href="#docs" className="button button-secondary">
              Read the docs
            </a>
          </div>
        </div>
      </motion.div>
    </section>
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
            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden">
              <img src="/caliga-logo.png" alt="Caliga" className="h-10 w-10 object-cover [filter:brightness(8)_contrast(2.4)]" />
            </span>
            <span>Built and maintained by Caliga</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-[var(--muted)]">
          <a href="#product">Product</a>
          <a href="#creators">Creators</a>
          <a href="#developers">Developers</a>
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
        <CreatorValue />
        <SellerAgent />
        <StreamDemoSection />
        <Developers />
        <Pricing />
        <Trust />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
