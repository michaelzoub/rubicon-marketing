"use client";

import { AnimatePresence, animate, motion, useInView } from "framer-motion";
import { Check, Coins } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BuyerGlyph, SellerGlyph } from "./agent-glyphs";

const PRICE_PER_WORD = 0.00001;
const FIRST_STOP = 34;
const DEEP_STOP = 42;
const ease = [0.16, 1, 0.3, 1] as const;

const DEMO_SESSION_ID = "sim-7f3a9c2d";
const DEMO_WALLET = "0x742d…demo";
const DEMO_TX_PLACEHOLDER = "0xa4f1…example";
const ARC_TESTNET_EXPLORER = "https://testnet.arcscan.app";

type Phase = "ask" | "route" | "stream" | "followup" | "routeDeeper" | "streamDeeper" | "answer";

type SettlementLogKind = "routed" | "word" | "stopped";

interface SettlementLogEntry {
  id: number;
  kind: SettlementLogKind;
  time: string;
  word?: string;
  amount?: string;
  latencyMs?: number;
  detail?: string;
}

let settlementLogSeq = 0;
let sessionClockOffset = 0;

function nextLogTime(): string {
  sessionClockOffset += 0.11 + Math.random() * 0.17;
  const totalSeconds = 14 * 3600 + 32 * 60 + sessionClockOffset;
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resetSessionClock() {
  sessionClockOffset = 0;
}

function randomLatencyMs() {
  return 180 + Math.floor(Math.random() * 161);
}

function springScrollTo(el: HTMLElement, target: number, onScroll?: () => void) {
  const from = el.scrollTop;
  const next = Math.max(0, target);
  if (Math.abs(next - from) < 1) return;

  onScroll?.();

  animate(from, next, {
    type: "spring",
    stiffness: 210,
    damping: 30,
    mass: 0.75,
    onUpdate: (value) => {
      el.scrollTop = value;
    },
  });
}

const SECTION_HEADER = "Self-Attention Mechanism";
const DEEP_HEADER = "Scaling the Context Window";

const ARTICLE_SECTIONS = [
  {
    header: SECTION_HEADER,
    words:
      "modern transformer models begin by converting every token into three learned vectors called queries keys and values the query asks what this position needs the keys describe what every other position can offer and the values carry the information that may be copied forward attention scores compare each query with every key then a softmax turns those comparisons into weights so the model can blend the most useful value vectors into a context aware representation instead of reading a sentence as a rigid left to right chain",
  },
  {
    header: DEEP_HEADER,
    words:
      "longer context windows let an agent inspect more source material before answering but vanilla attention becomes expensive because every token may compare itself with every other token production systems work around that cost by caching key and value tensors chunking documents around likely evidence using retrieval to jump to promising passages and applying positional methods that preserve order across thousands of tokens the practical tradeoff is not simply bigger windows it is deciding when the next paid words are worth the latency and spend",
  },
  {
    header: "Metered Reading Behavior",
    words:
      "a buyer agent does not need to license an entire article when the task only requires a definition a caveat or a single supporting quote Rubicon streams words from the seller agent records the exact count settles tiny payments as text is delivered and lets the buyer stop the moment the answer has enough evidence",
  },
];

const ARTICLE_WORDS = ARTICLE_SECTIONS.flatMap((section, sectionIndex) =>
  section.words.split(" ").map((word) => ({ word, sectionIndex })),
);
const SECTION_WORDS = ARTICLE_SECTIONS.map((section) => section.words.split(" "));
const SECTION_STARTS = SECTION_WORDS.reduce<number[]>((starts, words, index) => {
  starts.push(index === 0 ? 0 : starts[index - 1] + SECTION_WORDS[index - 1].length);
  return starts;
}, []);
const sectionRange = (sectionIndex: number, start: number, end: number) =>
  Array.from({ length: end - start }, (_, index) => SECTION_STARTS[sectionIndex] + start + index);
const READ_SEQUENCE = [...sectionRange(0, 0, FIRST_STOP), ...sectionRange(1, 0, DEEP_STOP)];
const TARGET_WORDS = READ_SEQUENCE.length;

let packetSeq = 0;
let paymentSeq = 0;
type Packet = { id: number; word: string };
type Payment = { id: number };

export function StreamTheater({ compact = false, embedded = false }: { compact?: boolean; embedded?: boolean }) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [words, setWords] = useState(0);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settlementLog, setSettlementLog] = useState<SettlementLogEntry[]>([]);
  const [scrollSweep, setScrollSweep] = useState(0);
  const [demoActive, setDemoActive] = useState(false);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const routedSections = useRef(new Set<string>());
  const isInView = useInView(revealRef, { once: false, amount: 0.28, margin: "0px 0px -64px 0px" });

  const appendLog = (entry: Omit<SettlementLogEntry, "id" | "time"> & { time?: string }) => {
    setSettlementLog((prev) => [...prev.slice(-14), { ...entry, id: ++settlementLogSeq, time: entry.time ?? nextLogTime() }]);
  };

  const resetDemo = () => {
    resetSessionClock();
    routedSections.current.clear();
    setPhase("ask");
    setWords(0);
    setPackets([]);
    setPayments([]);
    setSettlementLog([]);
  };

  useEffect(() => {
    setDemoActive(isInView);
    if (!isInView) resetDemo();
  }, [isInView]);

  useEffect(() => {
    if (!demoActive) return;

    const t = timers.current;
    const clearAll = () => {
      t.forEach(clearTimeout);
      t.length = 0;
    };

    if (phase === "ask") {
      t.push(setTimeout(() => setPhase("route"), 1900));
    } else if (phase === "route") {
      if (!routedSections.current.has(SECTION_HEADER)) {
        routedSections.current.add(SECTION_HEADER);
        appendLog({ kind: "routed", detail: `opening “${SECTION_HEADER}”` });
      }
      t.push(setTimeout(() => setPhase("stream"), 1900));
    } else if (phase === "stream" || phase === "streamDeeper") {
      let n = phase === "stream" ? 0 : FIRST_STOP;
      const tick = () => {
        n += 1;
        setWords(n);
        const word = ARTICLE_WORDS[READ_SEQUENCE[n - 1] ?? 0].word;
        const latencyMs = randomLatencyMs();
        appendLog({ kind: "word", word, amount: `$${PRICE_PER_WORD.toFixed(5)}`, latencyMs });
        const id = ++packetSeq;
        setPackets([{ id, word }]);
        t.push(setTimeout(() => setPackets((p) => p.filter((x) => x.id !== id)), 1050));
        t.push(
          setTimeout(() => {
            const pid = ++paymentSeq;
            setPayments((p) => [...p, { id: pid }]);
            t.push(setTimeout(() => setPayments((p) => p.filter((x) => x.id !== pid)), 700));
          }, 760),
        );
        if (phase === "stream" && n >= FIRST_STOP) {
          t.push(setTimeout(() => setPhase("followup"), 700));
          return;
        }
        if (n >= TARGET_WORDS) {
          t.push(setTimeout(() => setPhase("answer"), 700));
          return;
        }
        const delay = n < 5 || n === FIRST_STOP + 1 ? 320 : n < 14 || n < FIRST_STOP + 8 ? 150 : 74;
        t.push(setTimeout(tick, delay));
      };
      t.push(setTimeout(tick, 350));
    } else if (phase === "followup") {
      t.push(setTimeout(() => setPhase("routeDeeper"), 2100));
    } else if (phase === "routeDeeper") {
      if (!routedSections.current.has(DEEP_HEADER)) {
        routedSections.current.add(DEEP_HEADER);
        appendLog({ kind: "routed", detail: `jumping to “${DEEP_HEADER}”` });
      }
      t.push(setTimeout(() => setPhase("streamDeeper"), 1900));
    } else if (phase === "answer") {
      appendLog({ kind: "stopped", detail: `answer found · ${TARGET_WORDS} words paid` });
      t.push(
        setTimeout(() => {
          resetDemo();
        }, 4200),
      );
    }

    return clearAll;
  }, [phase, demoActive]);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    const active = el.querySelector<HTMLElement>("[data-active-word='true']");
    if (active) {
      const containerRect = el.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const activeTop = activeRect.top - containerRect.top + el.scrollTop;
      const activeBottom = activeRect.bottom - containerRect.top + el.scrollTop;
      const visibleTop = el.scrollTop;
      const visibleBottom = visibleTop + el.clientHeight;
      const lowerComfort = visibleTop + el.clientHeight * 0.72;
      const upperComfort = visibleTop + el.clientHeight * 0.18;

      if (activeBottom > lowerComfort) {
        const target = activeBottom - el.clientHeight * 0.72;
        springScrollTo(el, target, () => setScrollSweep((n) => n + 1));
      } else if (activeTop < upperComfort && visibleTop > 0) {
        const target = activeTop - el.clientHeight * 0.18;
        springScrollTo(el, target, () => setScrollSweep((n) => n + 1));
      } else if (activeBottom > visibleBottom) {
        springScrollTo(el, activeBottom - el.clientHeight, () => setScrollSweep((n) => n + 1));
      }
    } else if (words === 0) {
      el.scrollTo({ top: 0 });
    }
  }, [words, phase]);

  const paid = (words * PRICE_PER_WORD).toFixed(5);
  const pct = Math.min((words / TARGET_WORDS) * 100, 100);
  const streaming = phase === "stream" || phase === "streamDeeper";
  const routing = phase === "route" || phase === "routeDeeper";
  const asking = phase === "ask" || phase === "followup";
  const done = phase === "answer";
  const readWordSet = new Set(READ_SEQUENCE.slice(0, words));
  const highlightIndex = READ_SEQUENCE[Math.max(0, Math.min(words - 1, TARGET_WORDS - 1))] ?? 0;

  const sessionLabel = done ? "settled" : streaming ? "streaming" : routing ? "routing" : "simulated";
  const channelHeight = embedded ? "h-[112px]" : compact ? "h-[96px]" : "h-[120px]";
  const articleScrollClass = embedded
    ? "stream-theater-article-scroll--embedded overflow-y-auto"
    : `overflow-y-auto ${compact ? "h-[140px]" : "h-[180px]"}`;
  const settledHeight = embedded ? "min-h-[2rem]" : compact ? "min-h-[2rem]" : "min-h-[2.75rem]";

  return (
    <motion.div
      ref={revealRef}
      className="stream-theater-reveal w-full min-w-0"
      data-hidden={isInView ? undefined : true}
      initial={false}
      animate={
        embedded
          ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
          : isInView
            ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
            : { opacity: 0, y: 72, scale: 0.97, filter: "blur(8px)" }
      }
      transition={embedded ? { duration: 0 } : { type: "spring", stiffness: 92, damping: 20, mass: 0.88 }}
    >
    <div
      className={`stream-theater relative w-full min-w-0${compact ? " stream-theater--compact" : ""}${embedded ? " stream-theater--embedded" : ""}`}
    >
      <div className="stream-theater-chrome">
        <span className="stream-theater-demo-badge">Demo · simulated session</span>
        <div className={`stream-theater-chrome-status${streaming || routing ? " stream-theater-chrome-status--live" : ""}`}>
          <span
            className={`stream-theater-status-dot${done ? " stream-theater-status-dot--done" : streaming ? " stream-theater-status-dot--live" : ""}`}
            aria-hidden="true"
          />
          <span className="stream-theater-status-label">{sessionLabel}</span>
        </div>
      </div>

      <div className="stream-theater-meta" aria-label="Simulated session metadata">
        <span>
          Session <span className="stream-theater-meta-value">{DEMO_SESSION_ID}</span>
        </span>
        <span>
          Wallet{" "}
          <code className="stream-theater-mono" title="Example wallet — not a real address">
            {DEMO_WALLET}
          </code>
        </span>
        <span>
          Network <span className="stream-theater-meta-value">Arc Testnet</span>
        </span>
      </div>

      <div className="stream-theater-body">
        <div className="stream-theater-stack">
          <section className="stream-theater-section" aria-label="Agent channel">
            <h3 className="stream-theater-section-title">Agents</h3>
            <div className="stream-theater-section-body stream-theater-channel">
              <div className={`relative overflow-visible ${channelHeight}`}>
          <div className="absolute left-[20%] right-[20%] top-[28px] h-px -translate-y-1/2 bg-[var(--line)]" />
          <div
            className={`river-line absolute left-[20%] right-[20%] top-[28px] h-[2px] -translate-y-1/2 rounded-full transition-opacity duration-500 ${
              streaming ? "opacity-100" : "opacity-0"
            }`}
          />

          <Agent
            side="left"
            icon={<BuyerGlyph />}
            name="Buyer agent"
            sub={done ? "done" : streaming ? "receiving" : asking ? "asking" : "waiting"}
            active={phase === "ask" || phase === "followup" || done}
            role="buyer"
            compact={compact}
          />

          <Agent
            side="right"
            icon={<SellerGlyph />}
            name="Gateway agent"
            sub={streaming ? "streaming" : routing ? "routing" : "ready"}
            active={streaming || routing}
            role="gateway"
            compact={compact}
          />

          <AnimatePresence>
            {packets.map((p) => (
              <motion.div
                key={p.id}
                initial={{ left: "72%", opacity: 0, scale: 0.92 }}
                animate={{ left: "28%", opacity: [0, 1, 1, 0], scale: 1 }}
                transition={{ duration: 1.0, ease, times: [0, 0.18, 0.8, 1] }}
                className="stream-theater-packet pointer-events-none absolute top-[28px] z-10 w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-ui)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-center text-[0.75rem] text-[var(--ink)] ring-1 ring-[var(--faint)]"
              >
                {p.word}
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {payments.map((p) => (
              <motion.div
                key={p.id}
                initial={{ left: "28%", opacity: 0, scale: 0.6 }}
                animate={{ left: "72%", opacity: [0, 0.7, 0.7, 0], scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease, times: [0, 0.25, 0.8, 1] }}
                className="stream-theater-payment pointer-events-none absolute top-[40px] z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-[var(--radius-ui)] bg-[rgba(255,255,255,0.05)] px-1.5 py-[3px] text-[0.68rem] font-medium text-[var(--muted)] ring-1 ring-[var(--faint)]"
                aria-hidden="true"
              >
                <Coins size={8} aria-hidden="true" />
                <span className="stream-theater-mono text-[var(--stream-accent,#2d91ed)]">+$0.00001</span>
              </motion.div>
            ))}
            </AnimatePresence>
              </div>
            </div>
          </section>

          <section className="stream-theater-section" aria-label="Settlement log">
            <h3 className="stream-theater-section-title">Settlement log</h3>
            <div className="stream-theater-section-body">
              <SettlementEventLog events={settlementLog} demoActive={demoActive} compact={compact || embedded} />
            </div>
          </section>

          <section className="stream-theater-section stream-theater-article-panel" aria-label="Article stream">
            <h3 className="stream-theater-section-title">Article stream</h3>
            <div className="stream-theater-section-body stream-theater-article-viewport">
              <div
                ref={articleRef}
                className={`article-scroll ${articleScrollClass}`}
                aria-label="Streaming article excerpt"
              >
            {ARTICLE_SECTIONS.map((section, sectionIndex) => {
              let offset = 0;
              for (let i = 0; i < sectionIndex; i += 1) offset += ARTICLE_SECTIONS[i].words.split(" ").length;
              const sectionWords = section.words.split(" ");

              return (
                <div key={section.header} className={sectionIndex > 0 ? "mt-5" : undefined}>
                  <div className="mb-2 text-[0.875rem] font-medium tracking-[-0.01em] text-[var(--ink)]">
                    {section.header}
                  </div>
                  <p className="flex flex-wrap gap-x-1 gap-y-1">
                    {sectionWords.map((word, index) => {
                      const globalIndex = offset + index;
                      const active = streaming && globalIndex === highlightIndex;
                      const delivered = readWordSet.has(globalIndex);
                      const locked = !delivered && !active;
                      return (
                        <motion.span
                          key={`${section.header}-${word}-${index}`}
                          data-active-word={active ? "true" : undefined}
                          animate={
                            active
                              ? {
                                  color: "var(--river)",
                                  backgroundColor: "rgba(var(--river-rgb), 0.18)",
                                  filter: "blur(0px)",
                                  opacity: 1,
                                }
                              : delivered
                                ? {
                                    color: "var(--river)",
                                    backgroundColor: "rgba(var(--river-rgb), 0.12)",
                                    filter: "blur(0px)",
                                    opacity: 1,
                                  }
                                : {
                                    color: "var(--quiet)",
                                    backgroundColor: "rgba(255, 255, 255, 0)",
                                    filter: "blur(5px)",
                                    opacity: 0.42,
                                  }
                          }
                          transition={{ duration: 0.24, ease }}
                          className={`inline-flex rounded px-1 text-[0.875rem] leading-relaxed${locked ? " stream-theater-word--locked" : ""}`}
                        >
                          {word}
                        </motion.span>
                      );
                    })}
                  </p>
                </div>
              );
            })}
                </div>
                <AnimatePresence>
                  {scrollSweep > 0 && (
                    <motion.div
                      key={scrollSweep}
                      className="article-scroll-sweep"
                      initial={{ y: "-120%", opacity: 0.55 }}
                      animate={{ y: "120%", opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.62, ease }}
                      onAnimationComplete={() => {
                        setScrollSweep((current) => (current === scrollSweep ? 0 : current));
                      }}
                      aria-hidden="true"
                    />
                  )}
                </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      <div className="stream-theater-footer">
        <div className="stream-theater-ticker">
          <div className="stream-theater-metric">
            <span className="stream-theater-metric-label">Words read</span>
            <motion.strong
              key={words}
              className="stream-theater-metric-value"
              initial={{ opacity: 0.55, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease }}
            >
              {words}
            </motion.strong>
          </div>
          <div className="stream-theater-metric">
            <span className="stream-theater-metric-label">Paid · USDC</span>
            <motion.strong
              key={paid}
              className="stream-theater-metric-value stream-theater-metric-value--accent stream-theater-mono"
              initial={{ opacity: 0.55, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease }}
            >
              ${paid}
            </motion.strong>
          </div>
        </div>
        <div className="stream-theater-progress-track">
          <motion.div
            className={`stream-theater-progress-fill h-full${done ? " stream-theater-progress-fill--done" : ""}`}
            animate={{ width: `${Math.max(pct, 3)}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
        <div className={`stream-theater-settled-slot ${settledHeight}`}>
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease }}
                className="stream-theater-settled"
              >
                <span className="stream-theater-settled-text">
                  <Check size={15} aria-hidden="true" /> Simulated session complete · {TARGET_WORDS} words ·{" "}
                  <span className="stream-theater-mono">${paid}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="stream-theater-proof">
          <span className="stream-theater-proof-tx">
            Last tx{" "}
            <code className="stream-theater-mono" title="Example hash — not a real transaction">
              {DEMO_TX_PLACEHOLDER}
            </code>
          </span>
          <a
            href={ARC_TESTNET_EXPLORER}
            target="_blank"
            rel="noopener noreferrer"
            className="stream-theater-explorer-link"
          >
            Arc testnet explorer
          </a>
        </div>
      </div>
    </div>
    </motion.div>
  );
}

function Agent({
  side,
  icon,
  name,
  sub,
  active,
  role = "buyer",
  compact = false,
}: {
  side: "left" | "right";
  icon: React.ReactNode;
  name: string;
  sub: string;
  active: boolean;
  role?: "buyer" | "gateway";
  compact?: boolean;
}) {
  const pos = side === "left" ? "left-0 items-start" : "right-0 items-end";
  const tokenSize = compact ? "h-10 w-10" : "h-[52px] w-[52px]";
  return (
    <div className={`absolute top-0 flex w-[40%] min-w-0 flex-col gap-2 ${pos}`}>
      <div
        className={`agent-token agent-token--${role} grid ${tokenSize} place-items-center rounded-full transition-shadow duration-500 ${
          active ? "is-active" : ""
        }`}
      >
        {icon}
      </div>
      <div className={`flex min-w-0 max-w-full flex-col gap-1 ${side === "right" ? "items-end" : "items-start"}`}>
        <div className={`stream-theater-agent-name${compact ? " stream-theater-agent-name--compact" : ""}`}>{name}</div>
        <span className={`stream-theater-agent-status${active ? " stream-theater-agent-status--active" : ""}`}>{sub}</span>
      </div>
    </div>
  );
}

const chatEase = [0.22, 1, 0.36, 1] as const;

function SettlementEventLog({
  events,
  demoActive,
  compact,
}: {
  events: SettlementLogEntry[];
  demoActive: boolean;
  compact: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!demoActive) return;
    const el = scrollRef.current;
    if (!el) return;

    const frame = requestAnimationFrame(() => {
      springScrollTo(el, el.scrollHeight - el.clientHeight);
    });

    return () => cancelAnimationFrame(frame);
  }, [events, demoActive]);

  return (
    <div className={`stream-theater-messages-viewport stream-theater-settlement-log${compact ? " stream-theater-settlement-log--compact" : ""}`}>
      <div ref={scrollRef} className="stream-theater-messages-scroll">
        <div className="stream-theater-settlement-log-inner">
          {events.length === 0 ? (
            <p className="stream-theater-settlement-log-empty">Waiting for simulated session…</p>
          ) : (
            events.map((entry, index) => (
              <motion.p
                key={entry.id}
                initial={index === events.length - 1 ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: chatEase }}
                className="stream-theater-settlement-log-line"
              >
                <span className="stream-theater-settlement-log-time stream-theater-mono">{entry.time}</span>
                {entry.kind === "word" ? (
                  <>
                    <span className="stream-theater-settlement-log-action">bought</span>
                    <span className="stream-theater-settlement-log-word">&apos;{entry.word}&apos;</span>
                    <span className="stream-theater-settlement-log-amount stream-theater-mono">{entry.amount}</span>
                    <span className="stream-theater-settlement-log-latency">settled {entry.latencyMs}ms</span>
                  </>
                ) : entry.kind === "routed" ? (
                  <span className="stream-theater-settlement-log-detail">routed · {entry.detail}</span>
                ) : (
                  <span className="stream-theater-settlement-log-detail">stopped · {entry.detail}</span>
                )}
              </motion.p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
