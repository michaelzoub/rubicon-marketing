"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Coins,
  Copy,
  FileText,
  Github,
  MessageSquare,
  Quote,
  Settings2,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { StreamTheater } from "./_components/stream-theater";
import { WordStreamDemo } from "./_components/word-stream";

const githubUrl = "https://github.com/michaelzoub/rubicon";

const ease = [0.16, 1, 0.3, 1] as const;

const fade = {
  initial: { opacity: 0, y: 22, filter: "blur(6px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease },
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
  const ref = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 86%", "end 18%"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.992, 1]);
  const y = useTransform(scrollYProgress, [0, 0.55, 1], [0, -8, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.96, 1]);

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      style={reducedMotion ? undefined : { scale, y, opacity }}
    >
      {children}
    </motion.section>
  );
}

const developerCode = {
  sdk: `import Rubicon from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon();

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
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--line)] bg-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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

function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--faint)] bg-[rgba(21,21,23,0.92)] backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between gap-6" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Waves size={21} strokeWidth={1.9} className="text-[var(--river)]" aria-hidden="true" />
          <span>Rubicon</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-[var(--muted)] md:flex">
          <a className="transition-colors hover:text-[var(--ink)]" href="#product">Product</a>
          <a className="transition-colors hover:text-[var(--ink)]" href="#creators">Creators</a>
          <a className="transition-colors hover:text-[var(--ink)]" href="#developers">Developers</a>
          <a className="transition-colors hover:text-[var(--ink)]" href="#docs">Docs</a>
          <Link className="transition-colors hover:text-[var(--ink)]" href="/dashboard">Sign in</Link>
        </div>
        <Link href="/dashboard" className="button button-primary button-nav text-sm">
          Start publishing <ArrowRight size={15} aria-hidden="true" />
        </Link>
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
          <h1 className="mt-5 max-w-[640px] text-[clamp(2.4rem,5vw,4.6rem)] font-[800] leading-[0.98] tracking-[-0.045em]">
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
          <div className="mono mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> Pay per word</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> Stop anytime</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-[var(--river)]" aria-hidden="true" /> 0% platform fee</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.85, delay: 0.12, ease }}
          className="flex min-w-0 items-center"
        >
          <div className="hero-visual w-full min-w-0" style={{ animation: "soft-float 7s var(--ease-in-out) infinite" }}>
            <StreamTheater />
          </div>
        </motion.div>
      </div>
    </section>
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
    <StackPanel id="product" className="section stack-panel stack-panel-muted border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">How it works</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="card-soft p-6">
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
    </StackPanel>
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
    <StackPanel id="creators" className="section stack-panel stack-panel-base bg-[var(--background)]">
      <motion.div {...fade} className="container">
        <p className="eyebrow">For creators</p>
        <h2 className="mt-4 section-title">Built around what creators actually want.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="card-soft p-6">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--river-pale)] text-[var(--river)]">{card.icon}</span>
              <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 leading-7 text-[var(--muted)]">{card.copy}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </StackPanel>
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
        <div className="card-soft p-5">
          <div className="grid gap-3">
            {conversation.map((line, i) => (
              <div
                key={i}
                className={`rounded-2xl border px-4 py-3 ${
                  line.tone === "seller"
                    ? "border-[var(--river-line)] bg-[var(--river-pale)]"
                    : "border-[var(--faint)] bg-[var(--surface-muted)]"
                }`}
              >
                <div className={`mono text-[0.62rem] uppercase tracking-[0.12em] ${line.tone === "seller" ? "text-[var(--river-deep)]" : "text-[var(--river-deep)]"}`}>
                  {line.who}
                </div>
                <p className="mt-1.5 text-sm leading-6 text-[var(--ink)]">{line.text}</p>
              </div>
            ))}
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
            word as a USDC <strong>nanopayment</strong>—a transfer small enough to move per word, instantly, without a
            fee swallowing the payment.
          </p>
          <p className="section-copy mt-4">
            It runs on Circle’s stablecoin infrastructure and Arc, Circle’s USDC-native chain where stablecoins are the
            gas. That’s what makes paying for one word—then another, thousands of times over—economically real.
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

function Developers() {
  const steps = [
    "Install the Agent SDK",
    "Create a Rubicon client",
    "Set the article, goal, and budget",
    "Run the agent",
    "Stream words live when needed",
  ];
  return (
    <StackPanel id="developers" className="section stack-panel stack-panel-muted border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <p className="eyebrow">For developers</p>
        <h2 className="mt-4 section-title">Read paid articles in a few lines.</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <ol className="grid gap-3">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 rounded-lg border border-[var(--faint)] bg-[var(--card)] px-4 py-3">
                <span className="mono mt-0.5 text-sm text-[var(--river-deep)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium leading-6">{step}</span>
              </li>
            ))}
            <li className="mono mt-1 rounded-lg border border-[var(--river-line)] bg-[var(--river-pale)] px-4 py-3 text-sm text-[var(--river-deep)]">
              npm install @rubicon-caliga/agent-sdk
            </li>
          </ol>
          <CodeShowcase />
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
    </StackPanel>
  );
}

function Pricing() {
  return (
    <section id="docs" className="section">
      <motion.div {...fade} className="container">
        <div className="card-soft grid gap-8 p-8 md:grid-cols-[auto_1fr] md:items-center md:p-10">
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
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--faint)] bg-[var(--card)] px-4 py-4">
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
        <div className="card-soft relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(102,132,255,0.18),transparent_42%),var(--card)] p-8 text-center md:p-14">
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
            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden bg-white">
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
        <Settlement />
        <Developers />
        <Pricing />
        <Trust />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
