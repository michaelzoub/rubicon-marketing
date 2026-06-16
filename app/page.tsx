"use client";

import { Activity, ArrowDown, ArrowRight, ArrowRightLeft, BookOpen, CalendarDays, CheckCircle2, Database, FileText, Github, KeyRound, Layers3, Percent, RadioTower, Search, WalletCards, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

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
        <a href="#" className="flex items-center gap-2 font-semibold">
          <Waves size={21} strokeWidth={1.9} className="text-[var(--river)]" aria-hidden="true" />
          <span>Rubicon</span>
        </a>
        <div className="hidden items-center gap-7 text-sm text-[var(--muted)] md:flex">
          <a className="hover:text-[var(--ink)]" href="#product">
            Product
          </a>
          <a className="hover:text-[var(--ink)]" href="#architecture">
            Architecture
          </a>
          <a className="hover:text-[var(--ink)]" href="#integration">
            Integration
          </a>
          <a className="hover:text-[var(--ink)]" href="#docs">
            Docs
          </a>
          <a className="hover:text-[var(--ink)]" href="/dashboard">
            Registry
          </a>
          <a className="hover:text-[var(--ink)]" href={githubUrl}>
            GitHub
          </a>
        </div>
        <a href="#docs" className="button button-primary text-sm">
          Get started <ArrowRight size={15} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}

const articleSequence = [
  { phase: 0, spent: 0, words: 0, snippet: "Looking for cartel price clause", status: "requesting article" },
  { phase: 1, spent: 0, words: 0, snippet: "Buyer asks for the exact section before reading", status: "clarifying section" },
  { phase: 2, spent: 0.001, words: 80, snippet: "Seller points to Consent Decree Language", status: "section selected" },
  { phase: 2, spent: 0.004, words: 310, snippet: "Context: pricing changed after the agency notice...", status: "streaming words" },
  { phase: 2, spent: 0.007, words: 620, snippet: "Key section found: the consent decree caps resale fees...", status: "reading section" },
  { phase: 3, spent: 0.007, words: 620, snippet: "Consent decree caps resale fees.", status: "stopped early" },
] as const;

function HeroStreamDiagram() {
  const [step, setStep] = useState(0);
  const lastStep = articleSequence.length - 1;
  const current = articleSequence[step];
  const isComplete = step >= lastStep;

  useEffect(() => {
    if (isComplete) return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, lastStep));
    }, 1500);

    return () => window.clearInterval(id);
  }, [isComplete, lastStep]);

  const phase = current.phase;
  const isClarifying = phase === 1;
  const usedPct = (current.words / 1800) * 100;
  const stages = [
    ["01", "TASK", "agent needs one cited section"],
    ["02", "ASK", "buyer requests section guidance"],
    ["03", "READ", `${current.words} words streamed`],
    ["04", "STOP", "snippet captured"],
  ];

  return (
    <div className={`panel overflow-hidden transition-colors duration-500 ${isComplete ? "border-[#2f8f66] bg-[#e8f6ef]" : "bg-white"}`}>
      <div className="grid gap-3 border-b border-[var(--faint)] px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <span className="mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--muted)]">{isComplete ? "article stream complete" : "article stream live"}</span>
        <span className={`mono text-xs ${isComplete ? "text-[#24734f]" : "text-[var(--river-deep)]"}`}>{isComplete ? "only read words charged" : current.status}</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="ARTICLE" value="antitrust-analysis" />
          <MetricTile label="BUDGET" value={`$${current.spent.toFixed(3)} / $0.02`} />
          <MetricTile label="WORDS" value={`${current.words} / 1,800 read`} />
        </div>

        <div className={`relative mt-5 overflow-hidden border p-4 transition-colors duration-500 ${isComplete ? "border-[#69b88c] bg-[#d7f2e3]" : "border-[var(--line)] bg-[var(--surface-muted)]"}`}>
          <div className="grid gap-4">
            <div className={`relative overflow-hidden border ${isComplete ? "border-[#69b88c] bg-[#eefaf3]" : "border-[var(--line)] bg-white"} p-4`}>
              <div className="mono flex items-center justify-between text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                <span>Agent conversation + content stream</span>
                <span>{isComplete ? "success" : isClarifying ? "paused" : "live"}</span>
              </div>
              {isComplete ? (
                <div className="mt-4 grid gap-4 border border-[#69b88c] bg-white/70 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border border-[var(--faint)] bg-white p-3 text-left">
                      <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--river-deep)]">Buyer Agent asked</div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Which section contains the resale-fee clause?</p>
                    </div>
                    <div className="border border-[#69b88c] bg-[#e8f6ef] p-3 text-left">
                      <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[#24734f]">Seller Agent answered</div>
                      <p className="mt-2 text-sm leading-6 text-[#165c3e]">Consent Decree Language. Stream that section first.</p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="mx-auto min-w-[210px] max-w-[320px] text-center"
                  >
                    <CheckCircle2 className="mx-auto text-[#1f8f5b]" size={38} aria-hidden="true" />
                    <div className="mt-3 text-xl font-semibold leading-tight text-[#165c3e]">Required section found</div>
                    <div className="mono mt-2 text-xs leading-5 text-[#24734f]">620 words streamed · remainder untouched</div>
                  </motion.div>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <motion.div
                      key={`buyer-question-${step}`}
                      className={`border p-3 ${isClarifying ? "border-[var(--river)] bg-[var(--river-pale)]" : "border-[var(--faint)] bg-white"}`}
                      initial={{ opacity: 0.72, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--river-deep)]">Buyer Agent asks</div>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink)]">Do not stream the whole article. Which section contains the resale-fee clause?</p>
                    </motion.div>
                    <motion.div
                      key={`seller-answer-${step}`}
                      className={`border p-3 ${phase >= 2 ? "border-[#69b88c] bg-[#e8f6ef]" : "border-[var(--faint)] bg-white text-[var(--muted)]"}`}
                      initial={{ opacity: 0.72, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.08 }}
                    >
                      <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--river-deep)]">Seller Agent answers</div>
                      <p className="mt-2 text-sm leading-6">Start at “Consent Decree Language”. I will stream that section first.</p>
                    </motion.div>
                  </div>
                  <div className="relative mt-4 h-20">
                    <div className="absolute left-4 right-4 top-8 h-px bg-[var(--line)]" />
                    <div className="absolute left-4 right-4 top-14 h-px bg-[var(--line)]" />
                    {isClarifying ? (
                      <div className="absolute inset-x-4 top-9 border border-[var(--line)] bg-white px-3 py-2 text-center mono text-xs text-[var(--muted)]">stream paused · awaiting section spec</div>
                    ) : (
                      <>
                        {[0, 1, 2].map((packet) => (
                          <motion.div
                            key={`word-${packet}`}
                            className="absolute top-4 border border-[var(--river)] bg-[var(--river-pale)] px-2 py-1 mono text-[0.62rem] text-[var(--river-deep)]"
                            initial={{ left: "74%", opacity: 0 }}
                            animate={{ left: "8%", opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 2.4, delay: packet * 0.45, repeat: Infinity, ease: "easeInOut" }}
                          >
                            chunk
                          </motion.div>
                        ))}
                        {[0, 1, 2].map((pulse) => (
                          <motion.div
                            key={`pay-${pulse}`}
                            className="absolute top-[3.15rem] h-3 w-3 bg-[var(--river)]"
                            initial={{ left: "14%", opacity: 0 }}
                            animate={{ left: "82%", opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 2.4, delay: 0.25 + pulse * 0.45, repeat: Infinity, ease: "easeInOut" }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {stages.map(([number, title, detail], index) => {
                      const active = phase === index;
                      const done = phase > index;
                      return (
                        <div key={title} className={`relative min-h-[92px] border border-[var(--line)] p-3 ${active ? "bg-[#eef8fc]" : "bg-white"}`}>
                          <div className="mono flex items-center justify-between text-[0.62rem] text-[var(--river-deep)]">
                            <span>{number}</span>
                            {done ? <CheckCircle2 size={14} className="text-[#24865f]" aria-hidden="true" /> : <span className={`h-2 w-2 ${active ? "bg-[var(--river)]" : "bg-[var(--line)]"}`} />}
                          </div>
                          <div className="mt-3 text-sm font-semibold">{title}</div>
                          <div className="mono mt-1 break-words text-[0.66rem] leading-4 text-[var(--muted)]">{detail}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className={`border p-4 ${isComplete ? "border-[#69b88c] bg-white/70" : "border-[var(--line)] bg-white"}`}>
                <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Buyer side</div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center border border-[var(--line)] text-[var(--river)]">
                    <WalletCards size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="font-semibold">Buyer Agent</div>
                    <div className="mono mt-1 text-xs text-[var(--muted)]">task + $0.02 budget</div>
                  </div>
                </div>
                <motion.div
                  key={`snippet-${step}`}
                  className={`mt-4 border p-3 ${isComplete ? "border-[#69b88c] bg-[#e8f6ef]" : "border-[var(--faint)] bg-white"}`}
                  initial={{ opacity: 0.75 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">Captured snippet</div>
                  <p className={`mt-2 text-sm leading-6 ${isComplete ? "font-medium text-[#165c3e]" : "text-[var(--muted)]"}`}>{current.snippet}</p>
                </motion.div>
              </div>

              <div className={`border p-4 ${isComplete ? "border-[#69b88c] bg-white/70" : "border-[var(--line)] bg-white"}`}>
                <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">Seller side</div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center border border-[var(--line)] text-[var(--river)]">
                    <FileText size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="font-semibold">Seller Agent</div>
                    <div className="mono mt-1 text-xs text-[var(--muted)]">article routing + pricing</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-1">
                  {["Article + Pricing DB", "Pay per word", "Author Wallet"].map((item) => (
                    <div key={item} className="flex items-center gap-2 border-b border-[var(--faint)] pb-2">
                      <span className={`h-2 w-2 ${isComplete ? "bg-[#24865f]" : "bg-[var(--river)]"}`} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 mono text-xs leading-5 text-[var(--muted)]">Guides toward relevant sections before streaming the full article.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>{isComplete ? "Final usage" : "Words streamed"}</span>
              <span className="mono">{current.words} words</span>
            </div>
            <div className="mt-2 h-2 border border-[var(--line)] bg-white">
              <motion.div className={`h-full ${isComplete ? "bg-[#24865f]" : "bg-[var(--river)]"}`} animate={{ width: `${Math.max(usedPct, 2)}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
            </div>
          </div>
          <div className="mono flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
            <Activity size={14} aria-hidden="true" /> {isComplete ? "stopped · settled" : "words · cost · snippet"}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--line)] bg-white p-3">
      <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
      <div className="mono mt-2 truncate text-sm text-[var(--ink)]">{value}</div>
    </div>
  );
}

function Hero() {
  return (
    <section className="container grid gap-10 pb-14 pt-14 md:grid-cols-[0.9fr_1.1fr] md:pb-20 md:pt-24">
      <motion.div {...fade} className="flex flex-col justify-center">
        <p className="eyebrow">Streaming paid articles for agents</p>
        <h1 className="mt-5 max-w-[680px] text-[clamp(2.15rem,4.7vw,4.45rem)] font-[700] leading-[1] tracking-[-0.01em]">
          Pay for the flow, not the file.
        </h1>
        <p className="mt-6 max-w-[620px] text-lg leading-8 text-[var(--muted)]">
          Rubicon lets buyer agents open a budgeted content stream, read paid article words through x402 micropayments, and stop as soon as they have the facts they need.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#docs" className="button button-primary">
            Start streaming <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a href={githubUrl} className="button button-secondary">
            <Github size={16} aria-hidden="true" /> View on GitHub
          </a>
        </div>
        <div className="mono mt-5 w-fit border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--river-deep)]">
          npm install @rubicon/agent
        </div>
      </motion.div>
      <motion.div {...fade} transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" as const }}>
        <HeroStreamDiagram />
      </motion.div>
    </section>
  );
}

function FeeStrip() {
  return (
    <section className="border-y border-[var(--line)] bg-white">
      <div className="container grid gap-5 py-7 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div>
          <span className="mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--river-deep)]">Launch pricing</span>
          <p className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
            0 fees until <span className="border border-[var(--river)] bg-[var(--river-pale)] px-2 py-0.5 text-[var(--river-deep)]">July 10th</span>
            <span>, then 0.01% on settled x402 volume</span>
          </p>
        </div>
        <PricingBadge icon={<CalendarDays size={18} />} label="Until July 10" value="0 fees" />
        <PricingBadge icon={<Percent size={18} />} label="Afterwards" value="0.01% settled" />
      </div>
    </section>
  );
}

function PricingBadge({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-[180px] items-center gap-3 border border-[var(--line)] px-4 py-3">
      <span className="grid h-9 w-9 place-items-center border border-[var(--faint)] text-[var(--river)]">{icon}</span>
      <span>
        <span className="mono block text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</span>
        <span className="block text-sm font-semibold">{value}</span>
      </span>
    </div>
  );
}

function PositioningStrip() {
  return (
    <section className="border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <div className="container flex flex-col gap-5 py-5 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <p>Built for agent runtimes, publisher systems, research tools, and paid knowledge APIs.</p>
        <div className="mono flex flex-wrap gap-2 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--river-deep)]">
          <span className="border border-[var(--line)] bg-white px-2 py-1">x402-native</span>
          <span className="border border-[var(--line)] bg-white px-2 py-1">Pay per word</span>
          <span className="border border-[var(--line)] bg-white px-2 py-1">Stop anytime</span>
        </div>
      </div>
    </section>
  );
}

function DiscoveryLayer() {
  return (
    <section className="section border-b border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Article registry</p>
            <h2 className="mt-4 section-title">Agents price the article before opening a stream.</h2>
            <p className="section-copy mt-5">
              The seller-side endpoint looks up article metadata, author wallet routing, and word pricing before the buyer agent commits a budget.
            </p>
            <div className="mt-6 border-l-2 border-[var(--river)] pl-4 text-sm leading-6 text-[var(--muted)]">
              Discovery exposes enough context to budget a stream. Article text stays gated until words are streamed and paid.
            </div>
          </div>
          <div className="grid gap-3">
            <DiscoveryRow icon={<Search size={17} />} title="Find article terms" command="GET /api/articles/antitrust-analysis/quote" />
            <DiscoveryRow icon={<Database size={17} />} title="Load article + pricing" command="Article + Pricing DB" />
            <DiscoveryRow icon={<WalletCards size={17} />} title="Open budgeted stream" command="POST /api/streams { articleId, task, maxSpend }" />
            <a href="/dashboard" className="button button-secondary mt-2 w-fit">
              View registry <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DiscoveryRow({ icon, title, command }: { icon: ReactNode; title: string; command: string }) {
  return (
    <div className="grid gap-3 border border-[var(--line)] bg-white p-4 sm:grid-cols-[36px_1fr] sm:items-center">
      <span className="grid h-9 w-9 place-items-center border border-[var(--faint)] text-[var(--river)]">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <code className="mono mt-1 block overflow-x-auto text-xs text-[var(--muted)]">{command}</code>
      </span>
    </div>
  );
}

function ProductExplanation() {
  const steps = [
    ["Open", "Buyer agent sets the task, article target, and maximum spend."],
    ["Read", "Words and chunks stream forward while the Agent SDK pays continuously."],
    ["Stop", "The agent closes the stream once the relevant section is captured."],
  ];
  return (
    <section id="product" className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">No subscription. No article purchase. Only streamed words.</h2>
        <p className="section-copy mt-5">
          A buyer agent should not need to buy a whole file to answer one question. Rubicon keeps a live x402 stream open while words are read, then settles exactly what crossed the wire.
        </p>
        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          <div className="absolute left-[10%] right-[10%] top-7 hidden h-px river-line md:block" />
          {steps.map(([title, copy], index) => (
            <div key={title} className="relative bg-[var(--background)] pr-4">
              <div className="mono grid h-14 w-14 place-items-center border border-[var(--river)] bg-white text-sm text-[var(--river-deep)]">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
              <p className="mt-3 max-w-[280px] leading-7 text-[var(--muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function SDKComparison() {
  return (
    <section id="integration" className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">One Agent SDK. One seller-side streaming endpoint.</h2>
        <div className="mt-10 grid min-w-0 items-stretch gap-0 border border-[var(--line)] bg-white lg:grid-cols-[1fr_280px_1fr]">
          <SdkPanel
            title="Agent SDK"
            label="@rubicon/agent"
            description="Wraps the buyer agent with budget control, word accounting, payment signing, and early stop."
            points={["Opens budgeted article streams", "Tracks words read", "Sends x402 micropayments", "Stops once the answer is found"]}
            code={`const stream = await rubicon.read({\n  articleId: "antitrust-analysis",\n  task: "find resale-fee clause",\n  maxSpend: "0.02"\n});`}
          />
          <div className="min-w-0 border-y border-[var(--line)] bg-[linear-gradient(180deg,#f7fbfd,#fff)] p-6 lg:border-x lg:border-y-0">
            <div className="mono text-[0.7rem] uppercase tracking-[0.13em] text-[var(--river-deep)]">Content Stream</div>
            <h3 className="mt-3 text-2xl font-semibold">Words forward. Payments back.</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Chunks move from the seller endpoint to the buyer agent. Micropayments move the other way as each chunk is consumed.</p>
            <div className="mt-6 grid gap-3 text-sm">
              {["Word accounting", "Chunk delivery", "Payment verification", "Author settlement"].map((item) => (
                <div key={item} className="flex items-center gap-3 border-t border-[var(--faint)] pt-3">
                  <RadioTower size={15} className="text-[var(--river)]" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <SdkPanel
            title="x402 Streaming Endpoint"
            label="seller endpoint"
            description="Serves gated article chunks, prices words, receives continuous micropayments, and forwards settlement."
            points={["Looks up article + author pricing", "Guides the stream to relevant sections", "Charges by words streamed", "Forwards funds to the author wallet"]}
            code={`streamArticle({\n  unit: "word",\n  pricePerWord: "0.00001",\n  sellerWallet\n});`}
          />
        </div>
      </motion.div>
    </section>
  );
}

function SdkPanel({
  title,
  label,
  description,
  points,
  code,
}: {
  title: string;
  label: string;
  description: string;
  points: string[];
  code: string;
}) {
  return (
    <article className="min-w-0 p-6 sm:p-8">
      <p className="mono text-xs text-[var(--river-deep)]">{label}</p>
      <h3 className="mt-3 text-3xl font-semibold">{title}</h3>
      <p className="mt-4 leading-7 text-[var(--muted)]">{description}</p>
      <ul className="mt-6 grid gap-3 text-sm">
        {points.map((point) => (
          <li key={point} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--river)]" />
            {point}
          </li>
        ))}
      </ul>
      <pre className="mono mt-7 max-w-full overflow-x-auto border border-[var(--faint)] bg-[#0f1519] p-4 text-sm leading-6 text-[#dff4fb]">
        <code>{code}</code>
      </pre>
    </article>
  );
}

function ArchitectureFlow() {
  const legend = [
    ["Agent SDK → endpoint", "Article request · budget · x402 authorizations · stop signal"],
    ["Endpoint → Agent SDK", "Quote · article chunks · word totals · final receipt"],
    ["Article DB → endpoint", "Gated text · section map · pricing rules · author wallet"],
    ["Endpoint → Author Wallet", "Continuous settlement for words actually streamed"],
  ];
  return (
    <section id="architecture" className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">A content stream with economic state built in.</h2>
        <div className="mt-12 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="panel p-6">
            <div className="grid gap-3">
              <ArchitectureNode icon={<Layers3 size={18} />} label="Agent or application" />
              <FlowArrow direction="down" />
              <ArchitectureNode icon={<WalletCards size={18} />} label="Agent SDK" />
              <FlowArrow direction="both" />
              <ArchitectureNode icon={<KeyRound size={18} />} label="x402 Streaming Endpoint" active />
              <FlowArrow direction="both" />
              <ArchitectureNode icon={<Database size={18} />} label="Article + Pricing DB" />
              <FlowArrow direction="down" />
              <ArchitectureNode icon={<WalletCards size={18} />} label="Author Wallet" />
            </div>
          </div>
          <div className="grid gap-3">
            {legend.map(([title, copy]) => (
              <div key={title} className="border-b border-[var(--faint)] py-4">
                <div className="mono text-xs text-[var(--river-deep)]">{title}</div>
                <p className="mt-2 text-[var(--muted)]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function ArchitectureNode({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`mx-auto flex w-full max-w-[360px] items-center gap-3 border ${active ? "border-[var(--river)] bg-[var(--river-pale)]" : "border-[var(--line)] bg-white"} px-4 py-4 font-medium`}>
      <span className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-white text-[var(--river)]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function FlowArrow({ direction }: { direction: "down" | "both" }) {
  return (
    <div className="mx-auto grid h-8 place-items-center text-[var(--river)]">
      {direction === "both" ? <ArrowRightLeft size={18} strokeWidth={1.8} /> : <ArrowDown size={18} strokeWidth={1.8} />}
    </div>
  );
}

function SessionStateMachine() {
  const branches = [
    ["Payment received", "send next chunk", "var(--river)"],
    ["Agent stops", "Cancelled", "var(--purple)"],
    ["Section found", "Completed", "var(--green)"],
    ["Budget reached", "Exhausted", "var(--amber)"],
    ["Payment missing", "Paused", "var(--red)"],
    ["Article unavailable", "Failed", "#717984"],
  ];
  return (
    <section className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">Every article stream has a deterministic lifecycle.</h2>
        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="grid justify-items-center gap-4">
            <State label="CREATED" />
            <div className="h-10 w-px bg-[var(--river)]" />
            <State label="ACTIVE" active />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {branches.map(([event, result, color]) => (
              <div key={event} className="border border-[var(--faint)] bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5" style={{ background: color }} />
                  <span className="mono text-xs text-[var(--muted)]">{event}</span>
                </div>
                <div className="mt-3 font-semibold" style={{ color }}>
                  {result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function State({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className={`mono grid h-24 w-52 place-items-center border ${active ? "border-[var(--green)] bg-[#e8f5ef] text-[var(--green)]" : "border-[var(--line)] bg-white text-[var(--river-deep)]"} text-sm font-semibold tracking-[0.12em]`}>
      {label}
    </div>
  );
}

function EndpointLifecycle() {
  const states = ["Quoted", "Opened", "Streaming", "Stopped", "Settled"];
  return (
    <section className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">The endpoint helps the agent read selectively.</h2>
        <p className="section-copy mt-5">
          The seller-side endpoint can use article structure, headings, and pricing data to guide the stream toward the relevant section, instead of sending the whole article by default.
        </p>
        <div className="mt-10 overflow-x-auto">
          <div className="flex min-w-[720px] items-center">
            {states.map((state, index) => (
              <div key={state} className="flex flex-1 items-center">
                <div className={`mono w-full border ${state === "Streaming" ? "border-[var(--river)] bg-[var(--river-pale)]" : "border-[var(--line)] bg-white"} px-4 py-5 text-center text-sm font-semibold`}>
                  {state}
                </div>
                {index < states.length - 1 && <div className="h-px w-10 shrink-0 river-line" />}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function QuoteUsageEnvelope() {
  return (
    <section className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">Every update carries its economic context.</h2>
        <p className="section-copy mt-5">
          Each chunk includes the budget guardrail, word count, chunk price, and running total, so the buyer agent and seller endpoint agree on what was streamed and charged.
        </p>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <EnvelopePanel
            title="Initial quote"
            values={[
              ["Stream", "paid-article-words"],
              ["Metered unit", "word"],
              ["Price per word", "$0.00001"],
              ["Article", "antitrust-analysis"],
              ["Maximum charge", "$0.02"],
              ["Author wallet", "0xA17...91c"],
            ]}
            note="The buyer agent sets the maximum charge before the first words are released."
          />
          <EnvelopePanel
            title="Live stream update"
            values={[
              ["Chunk number", "08"],
              ["Words in chunk", "82"],
              ["Total words read", "620"],
              ["Seller subtotal", "$0.00620"],
              ["Rubicon fee", "$0.000001"],
              ["Total charged", "$0.006201"],
            ]}
          />
        </div>
        <div className="mt-8 panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="mono text-sm text-[var(--river-deep)]">Seller subtotal + Rubicon fee = Agent total</div>
            <div className="text-sm text-[var(--muted)]">$0.006201 used of $0.02 maximum</div>
          </div>
          <div className="mt-4 h-2 border border-[var(--line)] bg-white">
            <motion.div
              className="h-full bg-[var(--river)]"
              initial={{ width: "18%" }}
              whileInView={{ width: "31%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.3, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function EnvelopePanel({ title, values, note }: { title: string; values: string[][]; note?: string }) {
  return (
    <article className="panel p-6">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <dl className="mt-6 grid gap-3">
        {values.map(([term, value]) => (
          <div key={term} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--faint)] pb-3">
            <dt className="text-sm text-[var(--muted)]">{term}</dt>
            <dd className="mono text-right text-sm text-[var(--ink)]">{value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-5 border-l-2 border-[var(--river)] pl-4 text-sm leading-6 text-[var(--muted)]">{note}</p>}
    </article>
  );
}

function Termination() {
  const items = ["The agent has the snippet", "The buyer stops reading", "The budget is exhausted", "A payment or article error occurs"];
  return (
    <section className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">The stream stops the moment the answer is found.</h2>
        <p className="section-copy mt-5">
          Rubicon closes the content stream and produces a receipt for the words actually delivered. The unread remainder is never charged.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item} className="border-t border-[var(--river)] bg-[var(--surface-muted)] py-4 text-sm font-medium">
              {item}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function DeveloperExperience() {
  return (
    <section id="docs" className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="section-title">Integrate article streaming without changing the buyer agent.</h2>
          <div className="mt-8 grid gap-3">
            <InstallLine label="Buyer side" command="npm install @rubicon/agent" />
            <InstallLine label="Seller side" command="Expose an x402 streaming endpoint" />
          </div>
        </div>
        <div className="grid content-center gap-5">
          {["Wrap the buyer agent", "Request an article quote", "Open a budgeted content stream"].map((step, index) => (
            <div key={step} className="flex items-center gap-4 border-b border-[var(--faint)] pb-4">
              <span className="mono text-[var(--river-deep)]">0{index + 1}</span>
              <span className="text-xl font-medium">{step}</span>
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-3">
            <a className="button button-secondary" href="#docs">
              <BookOpen size={16} aria-hidden="true" /> Read the Agent SDK guide
            </a>
            <a className="button button-secondary" href="#docs">
              <BookOpen size={16} aria-hidden="true" /> Read endpoint guide
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function InstallLine({ label, command }: { label: string; command: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <code className="mono overflow-x-auto border border-[var(--line)] bg-white px-3 py-3 text-sm text-[var(--river-deep)]">{command}</code>
    </div>
  );
}

function CTA() {
  return (
    <section className="section">
      <motion.div {...fade} className="container">
        <div className="max-w-3xl">
          <p className="eyebrow">Continuous access</p>
          <h2 className="mt-4 section-title">Let agents buy exactly the article words they need.</h2>
          <p className="section-copy mt-5">Open a budgeted stream, guide the agent to the right section, and settle x402 micropayments to the author wallet.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#docs" className="button button-primary">
              Integrate Rubicon <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#docs" className="button button-secondary">
              Explore the docs
            </a>
          </div>
        </div>
        <div className="mt-14 h-px river-line" />
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="github" className="border-t border-[var(--faint)] bg-[var(--surface-muted)]">
      <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-5">
          <div className="flex items-center gap-2 font-semibold">
            <Waves size={16} className="text-[var(--river)]" aria-hidden="true" /> Rubicon
          </div>
          <p className="text-sm text-[var(--muted)]">Paid article streams for autonomous systems.</p>
          <div className="flex items-center gap-3 border-t border-[var(--faint)] pt-4 text-sm text-[var(--muted)]">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden">
              <img src="/caliga-logo.png" alt="Caliga" className="h-10 w-10 object-cover opacity-100 [filter:brightness(8)_contrast(2.4)]" />
            </span>
            <span>Built and maintained by Caliga</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-[var(--muted)]">
          <a href="#docs">Documentation</a>
          <a href={githubUrl}>GitHub</a>
          <a href="/dashboard">Registry</a>
          <a href="#architecture">Protocol</a>
          <a href="mailto:hello@rubicon.dev">Contact</a>
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
        <FeeStrip />
        <DiscoveryLayer />
        <PositioningStrip />
        <ProductExplanation />
        <SDKComparison />
        <ArchitectureFlow />
        <SessionStateMachine />
        <EndpointLifecycle />
        <QuoteUsageEnvelope />
        <Termination />
        <DeveloperExperience />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
