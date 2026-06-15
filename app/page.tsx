"use client";

import { Activity, ArrowDown, ArrowRight, ArrowRightLeft, BookOpen, Bot, CalendarDays, CheckCircle2, Cpu, Database, Github, KeyRound, Layers3, Percent, RadioTower, Search, ServerCog, WalletCards, Waves } from "lucide-react";
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
          <a className="hover:text-[var(--ink)]" href="#sdks">
            SDKs
          </a>
          <a className="hover:text-[var(--ink)]" href="#docs">
            Docs
          </a>
          <a className="hover:text-[var(--ink)]" href="/dashboard">
            Services
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

const trainingSequence = [
  { phase: 0, spent: 0, epoch: 0, paidThrough: "+00:01.4s" },
  { phase: 1, spent: 0, epoch: 0, paidThrough: "+00:03.2s" },
  { phase: 2, spent: 0.011, epoch: 1, paidThrough: "+00:08.6s" },
  { phase: 2, spent: 0.021, epoch: 2, paidThrough: "+00:14.1s" },
  { phase: 2, spent: 0.032, epoch: 3, paidThrough: "+00:19.7s" },
  { phase: 2, spent: 0.043, epoch: 4, paidThrough: "+00:24.8s" },
  { phase: 3, spent: 0.043, epoch: 4, paidThrough: "settled" },
] as const;

function HeroStreamDiagram() {
  const [step, setStep] = useState(0);
  const lastStep = trainingSequence.length - 1;
  const current = trainingSequence[step];
  const isComplete = step >= lastStep;

  useEffect(() => {
    if (isComplete) return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, lastStep));
    }, 1500);

    return () => window.clearInterval(id);
  }, [isComplete, lastStep]);

  const phase = current.phase;
  const usedPct = (current.spent / 0.1) * 100;
  const gpuSeconds = current.spent / 0.001;
  const stages = [
    ["01", "DISCOVER", "gpu-training-run"],
    ["02", "AUTHORIZE", "$0.10 max spend"],
    ["03", "EXECUTE", current.epoch > 0 ? `training epoch ${current.epoch} / 4` : "awaiting first epoch"],
    ["04", "COMPLETE", "receipt finalized"],
  ];

  return (
    <div className={`panel overflow-hidden transition-colors duration-500 ${isComplete ? "border-[#2f8f66] bg-[#e8f6ef]" : "bg-white"}`}>
      <div className="grid gap-3 border-b border-[var(--faint)] px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <span className="mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--muted)]">{isComplete ? "computation completed" : "training session live"}</span>
        <span className={`mono text-xs ${isComplete ? "text-[#24734f]" : "text-[var(--river-deep)]"}`}>{isComplete ? "final receipt issued" : `paid-through ${current.paidThrough}`}</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="SERVICE" value="gpu-training-run" />
          <MetricTile label="BUDGET" value={`$${current.spent.toFixed(3)} / $0.10`} />
          <MetricTile label="STATUS" value={isComplete ? "completed" : phase === 2 ? "training" : "active"} />
        </div>

        <div className={`relative mt-5 overflow-hidden border ${isComplete ? "border-[#69b88c] bg-[#d7f2e3]" : "border-[var(--line)] bg-[var(--surface-muted)]"}`}>
          {!isComplete && <div className="absolute left-8 right-8 top-1/2 hidden h-px bg-[var(--line)] sm:block" />}
          <motion.div
            className="absolute top-1/2 hidden h-px w-20 bg-[var(--river)] sm:block"
            animate={{ left: ["8%", "78%", "8%"] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {isComplete ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="grid min-h-[286px] place-items-center p-7 text-center"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <div className="absolute -inset-8 border border-[#69b88c] opacity-70" />
                <div className="grid h-28 w-28 place-items-center bg-[#1f8f5b] text-white">
                  <Bot size={58} strokeWidth={1.7} aria-hidden="true" />
                </div>
                <CheckCircle2 className="absolute -right-3 -top-3 bg-[#d7f2e3] text-[#1f8f5b]" size={30} aria-hidden="true" />
              </motion.div>
              <div className="mt-6">
                <div className="text-2xl font-semibold text-[#165c3e]">Training run completed.</div>
                <div className="mono mt-2 text-sm text-[#24734f]">response: model checkpoint ready · receipt settled</div>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-0 sm:grid-cols-4">
              {stages.map(([number, title, detail], index) => {
                const active = phase === index;
                const done = phase > index;
                return (
                  <div key={title} className={`relative min-h-[132px] border-b border-[var(--line)] p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${active ? "bg-[#eef8fc]" : "bg-white"}`}>
                    <div className="mono flex items-center justify-between text-[0.68rem] text-[var(--river-deep)]">
                      <span>{number}</span>
                      {done ? <CheckCircle2 size={15} className="text-[#24865f]" aria-hidden="true" /> : <span className={`h-2 w-2 ${active ? "bg-[var(--river)]" : "bg-[var(--line)]"}`} />}
                    </div>
                    <div className="mt-8 text-lg font-semibold">{title}</div>
                    <div className="mono mt-2 break-words text-xs leading-5 text-[var(--muted)]">{detail}</div>
                    {active && (
                      <motion.div
                        key={`${title}-${step}`}
                        className="absolute bottom-0 left-0 h-0.5 bg-[var(--river)]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "linear" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>{isComplete ? "Final usage" : "Training stream"}</span>
              <span className="mono">{gpuSeconds.toFixed(1)} gpu_seconds</span>
            </div>
            <div className="mt-2 h-2 border border-[var(--line)] bg-white">
              <motion.div className={`h-full ${isComplete ? "bg-[#24865f]" : "bg-[var(--river)]"}`} animate={{ width: `${Math.max(usedPct, 2)}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
            </div>
          </div>
          <div className="mono flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
            <Activity size={14} aria-hidden="true" /> {isComplete ? "completed · settled" : "usage · cost · output"}
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
        <p className="eyebrow">Metered infrastructure for agents</p>
        <h1 className="mt-5 max-w-[680px] text-[clamp(2.15rem,4.7vw,4.45rem)] font-[700] leading-[1] tracking-[-0.01em]">
          Give agents continuous access to paid resources.
        </h1>
        <p className="mt-6 max-w-[620px] text-lg leading-8 text-[var(--muted)]">
          Rubicon connects agents to compute and other metered services through persistent x402 payment streams. Agents pay as they consume. Providers expose services through a lightweight SDK.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#docs" className="button button-primary">
            Start building <ArrowRight size={16} aria-hidden="true" />
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
            <span>, only 0.01% per call afterwards</span>
          </p>
        </div>
        <PricingBadge icon={<CalendarDays size={18} />} label="Until July 10" value="0 fees" />
        <PricingBadge icon={<Percent size={18} />} label="Afterwards" value="0.01% / call" />
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
        <p>Built for agent runtimes, inference providers, compute platforms, and paid APIs.</p>
        <div className="mono flex flex-wrap gap-2 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--river-deep)]">
          <span className="border border-[var(--line)] bg-white px-2 py-1">x402-native</span>
          <span className="border border-[var(--line)] bg-white px-2 py-1">Usage-based</span>
          <span className="border border-[var(--line)] bg-white px-2 py-1">SDK-first</span>
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
            <p className="eyebrow">Service Registry</p>
            <h2 className="mt-4 section-title">Agents discover services before they open streams.</h2>
            <p className="section-copy mt-5">
              Providers register stable services with pricing, metering, capabilities, and public metadata. Agents list active services, choose a service ID, then start a budgeted paid session.
            </p>
            <div className="mt-6 border-l-2 border-[var(--river)] pl-4 text-sm leading-6 text-[var(--muted)]">
              Provider routing and credentials stay private to the gateway. Discovery responses expose service metadata, not secrets.
            </div>
          </div>
          <div className="grid gap-3">
            <DiscoveryRow icon={<Search size={17} />} title="List active services" command="GET /api/services" />
            <DiscoveryRow icon={<Database size={17} />} title="Fetch one service" command="GET /api/services/gpu-image-generation" />
            <DiscoveryRow icon={<WalletCards size={17} />} title="Start by service ID" command="POST /api/sessions { serviceId, input, maxSpend }" />
            <a href="/dashboard" className="button button-secondary mt-2 w-fit">
              View service dashboard <ArrowRight size={16} aria-hidden="true" />
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
    ["Start", "Agent sets the task input and maximum spend."],
    ["Stream", "The Agent SDK sends recurring authorizations while results arrive."],
    ["Settle", "The gateway pays the provider and retains a small facilitation fee."],
  ];
  return (
    <section id="product" className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">A persistent payment session, not a one-off API call.</h2>
        <p className="section-copy mt-5">
          A normal x402 request pays once. Rubicon maintains a live session in which the agent continuously authorizes the next increment of service while the provider continuously returns output.
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
    <section id="sdks" className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">Two SDKs. One gateway.</h2>
        <div className="mt-10 grid items-stretch gap-0 border border-[var(--line)] bg-white lg:grid-cols-[1fr_280px_1fr]">
          <SdkPanel
            title="Agent SDK"
            label="@rubicon/agent"
            description="Turns one agent call into a persistent, budget-controlled payment session."
            points={["Opens and maintains sessions", "Sends recurring nanopayments", "Receives streamed output and usage", "Enforces maximum spending"]}
            code={`const stream = await rubicon.run({\n  serviceId: "gpu-image-generation",\n  input,\n  maxSpend: "0.10"\n});`}
          />
          <div className="border-y border-[var(--line)] bg-[linear-gradient(180deg,#f7fbfd,#fff)] p-6 lg:border-x lg:border-y-0">
            <div className="mono text-[0.7rem] uppercase tracking-[0.13em] text-[var(--river-deep)]">Rubicon Gateway</div>
            <h3 className="mt-3 text-2xl font-semibold">Session control plane</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Verifies authorizations, tracks paid-through time, prices usage, and closes the stream when a terminal condition is reached.</p>
            <div className="mt-6 grid gap-3 text-sm">
              {["Authorization verification", "Session state", "Provider pricing", "Settlement receipt"].map((item) => (
                <div key={item} className="flex items-center gap-3 border-t border-[var(--faint)] pt-3">
                  <RadioTower size={15} className="text-[var(--river)]" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <SdkPanel
            title="Provider SDK"
            label="@rubicon/provider"
            description="Turns an existing compute service into a metered streaming endpoint."
            points={["Starts and cancels jobs", "Emits output and lifecycle events", "Reports metered usage", "Declares pricing and capabilities"]}
            code={`meteredService({\n  unit: "gpu_second",\n  pricePerUnit: "0.001",\n  run\n});`}
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
    <article className="p-6 sm:p-8">
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
      <pre className="mono mt-7 overflow-x-auto border border-[var(--faint)] bg-[#0f1519] p-4 text-sm leading-6 text-[#dff4fb]">
        <code>{code}</code>
      </pre>
    </article>
  );
}

function ArchitectureFlow() {
  const legend = [
    ["Agent SDK → gateway", "Session request · signed authorizations · stop signal"],
    ["Gateway → Agent SDK", "Quote · output · usage and cost · completion or error"],
    ["Provider SDK → gateway", "Output events · usage units · progress · completion or failure"],
    ["Gateway → Provider SDK", "Start · continue · cancel · timeout"],
  ];
  return (
    <section id="architecture" className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">A neutral control layer between demand and supply.</h2>
        <div className="mt-12 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="panel p-6">
            <div className="grid gap-3">
              <ArchitectureNode icon={<Layers3 size={18} />} label="Agent or application" />
              <FlowArrow direction="down" />
              <ArchitectureNode icon={<WalletCards size={18} />} label="Agent SDK" />
              <FlowArrow direction="both" />
              <ArchitectureNode icon={<KeyRound size={18} />} label="Rubicon Gateway" active />
              <FlowArrow direction="both" />
              <ArchitectureNode icon={<ServerCog size={18} />} label="Provider SDK" />
              <FlowArrow direction="down" />
              <ArchitectureNode icon={<Cpu size={18} />} label="Compute service" />
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
    ["Authorization received", "extend paid-through time", "var(--river)"],
    ["Agent stops", "Cancelled", "var(--purple)"],
    ["Provider completes", "Completed", "var(--green)"],
    ["Budget reached", "Exhausted", "var(--amber)"],
    ["Authorization missing", "Payment timeout", "var(--red)"],
    ["Provider fails", "Failed", "#717984"],
  ];
  return (
    <section className="section border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container">
        <h2 className="section-title">Every stream has a deterministic lifecycle.</h2>
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

function ProviderLifecycle() {
  const states = ["Queued", "Initializing", "Executing", "Finalizing", "Completed"];
  return (
    <section className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">A shared lifecycle for every provider.</h2>
        <p className="section-copy mt-5">
          Providers emit consistent lifecycle events through the SDK, giving agents visibility without forcing every service into the same implementation. Progress percentage is optional.
        </p>
        <div className="mt-10 overflow-x-auto">
          <div className="flex min-w-[720px] items-center">
            {states.map((state, index) => (
              <div key={state} className="flex flex-1 items-center">
                <div className={`mono w-full border ${state === "Executing" ? "border-[var(--river)] bg-[var(--river-pale)]" : "border-[var(--line)] bg-white"} px-4 py-5 text-center text-sm font-semibold`}>
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
          Each message includes the original spending guardrails and the latest usage totals, so agents and providers agree on what has been authorized, consumed, and charged.
        </p>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <EnvelopePanel
            title="Initial quote"
            values={[
              ["Service", "gpu-image-generation"],
              ["Metered unit", "GPU-second"],
              ["Price per unit", "$0.001"],
              ["Gateway fee", "0.01%"],
              ["Maximum charge", "$0.10"],
              ["Quote expiration", "90 seconds"],
            ]}
            note="The agent sets the maximum charge before the session begins."
          />
          <EnvelopePanel
            title="Live usage update"
            values={[
              ["Update number", "14"],
              ["Usage this interval", "2.1 GPU-seconds"],
              ["Total usage", "16.75 GPU-seconds"],
              ["Provider subtotal", "$0.01675"],
              ["Rubicon fee", "$0.000002"],
              ["Total charged", "$0.016752"],
            ]}
          />
        </div>
        <div className="mt-8 panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="mono text-sm text-[var(--river-deep)]">Provider subtotal + Rubicon fee = Agent total</div>
            <div className="text-sm text-[var(--muted)]">$0.016752 used of $0.10 maximum</div>
          </div>
          <div className="mt-4 h-2 border border-[var(--line)] bg-white">
            <motion.div
              className="h-full bg-[var(--river)]"
              initial={{ width: "11%" }}
              whileInView={{ width: "16.75%" }}
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
  const items = ["The agent cancels", "The provider finishes", "The authorized budget is exhausted", "A payment or provider failure occurs"];
  return (
    <section className="section">
      <motion.div {...fade} className="container">
        <h2 className="section-title">The stream stops automatically.</h2>
        <p className="section-copy mt-5">
          Rubicon closes the stream, stops the provider job where supported, and produces a final usage receipt.
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
          <h2 className="section-title">Integrate without rebuilding your service.</h2>
          <div className="mt-8 grid gap-3">
            <InstallLine label="For agents" command="npm install @rubicon/agent" />
            <InstallLine label="For providers" command="npm install @rubicon/provider" />
          </div>
        </div>
        <div className="grid content-center gap-5">
          {["Install the relevant SDK", "Discover an active service ID", "Open a budgeted metered stream"].map((step, index) => (
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
              <BookOpen size={16} aria-hidden="true" /> Read the Provider SDK guide
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
          <h2 className="mt-4 section-title">Make your service accessible to autonomous demand.</h2>
          <p className="section-copy mt-5">Expose a metered endpoint, connect an agent, and stream value in both directions.</p>
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
          <p className="text-sm text-[var(--muted)]">Continuous access for autonomous systems.</p>
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
          <a href="/dashboard">Services</a>
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
        <ProviderLifecycle />
        <QuoteUsageEnvelope />
        <Termination />
        <DeveloperExperience />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
