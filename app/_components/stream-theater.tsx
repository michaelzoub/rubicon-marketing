"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Coins, ScanText, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BuyerGlyph, SellerGlyph } from "./agent-glyphs";

const PRICE_PER_WORD = 0.00001;
const FIRST_STOP = 34;
const DEEP_STOP = 42;
const ease = [0.16, 1, 0.3, 1] as const;

type Phase = "ask" | "route" | "stream" | "followup" | "routeDeeper" | "streamDeeper" | "answer";

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

export function StreamTheater() {
  const [phase, setPhase] = useState<Phase>("ask");
  const [words, setWords] = useState(0);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    const clearAll = () => {
      t.forEach(clearTimeout);
      t.length = 0;
    };

    if (phase === "ask") {
      t.push(setTimeout(() => setPhase("route"), 1900));
    } else if (phase === "route") {
      t.push(setTimeout(() => setPhase("stream"), 1900));
    } else if (phase === "stream" || phase === "streamDeeper") {
      let n = phase === "stream" ? 0 : FIRST_STOP;
      const tick = () => {
        n += 1;
        setWords(n);
        const word = ARTICLE_WORDS[READ_SEQUENCE[n - 1] ?? 0].word;
        const id = ++packetSeq;
        setPackets([{ id, word }]);
        // remove packet after it finishes its glide across the channel
        t.push(setTimeout(() => setPackets((p) => p.filter((x) => x.id !== id)), 1050));
        // once the word lands, the buyer sends a tiny micropayment back the other way
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
        // ease into a quick, readable cadence
        const delay = n < 5 || n === FIRST_STOP + 1 ? 320 : n < 14 || n < FIRST_STOP + 8 ? 150 : 74;
        t.push(setTimeout(tick, delay));
      };
      t.push(setTimeout(tick, 350));
    } else if (phase === "followup") {
      t.push(setTimeout(() => setPhase("routeDeeper"), 2100));
    } else if (phase === "routeDeeper") {
      t.push(setTimeout(() => setPhase("streamDeeper"), 1900));
    } else if (phase === "answer") {
      t.push(
        setTimeout(() => {
          setWords(0);
          setPackets([]);
          setPayments([]);
          setPhase("ask");
        }, 4200),
      );
    }

    return clearAll;
  }, [phase]);

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
        el.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
      } else if (activeTop < upperComfort && visibleTop > 0) {
        const target = activeTop - el.clientHeight * 0.18;
        el.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
      } else if (activeBottom > visibleBottom) {
        el.scrollTo({ top: activeBottom - el.clientHeight, behavior: "smooth" });
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
  const collectedWords = READ_SEQUENCE.slice(0, Math.min(words, TARGET_WORDS)).map((index) => ARTICLE_WORDS[index].word);
  const visibleCollectedWords = collectedWords.slice(-14);
  const highlightIndex = READ_SEQUENCE[Math.max(0, Math.min(words - 1, TARGET_WORDS - 1))] ?? 0;

  return (
    <div className="stream-theater card-soft relative min-h-[560px] w-full min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="relative flex items-center justify-between gap-4 border-b border-[var(--faint)] pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`status-dot h-2.5 w-2.5 rounded-full ${done ? "bg-[var(--green)]" : "bg-[var(--river)]"}`}
          />
          <span className="truncate text-sm font-semibold">{done ? "Session settled" : "Live agent session"}</span>
        </div>
      </div>

      <div className="relative mt-6">
        <div className="relative h-[112px] overflow-visible">
          <div className="absolute left-[20%] right-[20%] top-[30px] h-px -translate-y-1/2 bg-[var(--line)]" />
          <div
            className={`river-line absolute left-[20%] right-[20%] top-[30px] h-[2px] -translate-y-1/2 rounded-full transition-opacity duration-500 ${
              streaming ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* buyer agent (left) */}
          <Agent
            side="left"
            icon={<BuyerGlyph />}
            name="Buyer agent"
            sub={done ? "answer received" : phase === "streamDeeper" ? "searching" : streaming ? "receiving" : asking ? "asking" : "searching"}
            active={phase === "ask" || phase === "followup" || done}
            tint="buyer"
          />

          {/* seller agent (right) */}
          <Agent
            side="right"
            icon={<SellerGlyph />}
            name="Seller agent"
            sub={streaming ? "streaming" : routing ? "routing" : "listening"}
            active={streaming || routing}
            tint="seller"
          />

          {/* in-flight word packets gliding seller → buyer along the channel */}
          <AnimatePresence>
            {packets.map((p) => (
              <motion.div
                key={p.id}
                initial={{ left: "72%", opacity: 0, scale: 0.92 }}
                animate={{ left: "28%", opacity: [0, 1, 1, 0], scale: 1 }}
                transition={{ duration: 1.0, ease, times: [0, 0.18, 0.8, 1] }}
                className="mono pointer-events-none absolute top-[30px] z-10 w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--river-line)] bg-[var(--surface)] px-2.5 py-1 text-center text-[0.62rem] text-[var(--river-deep)]"
              >
                {p.word}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* tiny micropayments drifting buyer → seller for each word received */}
          <AnimatePresence>
            {payments.map((p) => (
              <motion.div
                key={p.id}
                initial={{ left: "28%", opacity: 0, scale: 0.6 }}
                animate={{ left: "72%", opacity: [0, 0.7, 0.7, 0], scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease, times: [0, 0.25, 0.8, 1] }}
                className="mono pointer-events-none absolute top-[42px] z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full border border-[rgba(88,213,155,0.5)] bg-[var(--surface)] px-1.5 py-[1px] text-[0.5rem] font-medium text-[var(--green)]"
                aria-hidden="true"
              >
                <Coins size={8} aria-hidden="true" />
                +$0.00001
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-2 grid h-[132px] content-start gap-2">
          <AnimatePresence>
            {(phase === "ask" || phase === "route" || phase === "stream") && (
              <Bubble key="ask" side="left">
                Explain self-attention in practical terms and stop once the mechanism is clear.
              </Bubble>
            )}
            {(phase === "route" || phase === "stream") && (
              <Bubble key="route" side="right" tone="seller" icon={<ScanText size={13} aria-hidden="true" />}>
                Opening <span className="font-medium">“{SECTION_HEADER}.”</span> Streaming until the mechanism is clear.
              </Bubble>
            )}
            {(phase === "followup" || phase === "routeDeeper" || phase === "streamDeeper") && (
              <Bubble key="followup" side="left">
                Now check whether it covers long-context cost and when more paid text is worth it.
              </Bubble>
            )}
            {(phase === "routeDeeper" || phase === "streamDeeper") && (
              <Bubble key="route-deeper" side="right" tone="seller" icon={<ScanText size={13} aria-hidden="true" />}>
                Opening <span className="font-medium">“{DEEP_HEADER}.”</span> Continuing from the section start.
              </Bubble>
            )}
            {done && (
              <Bubble key="answer" side="left" tone="answer" icon={<Sparkles size={13} aria-hidden="true" />}>
                Answer grounded. Stopping before the full article is read.
              </Bubble>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 min-w-0 overflow-hidden rounded-[24px] border border-[var(--faint)] bg-[rgba(25,25,28,0.82)]">
          <div
            ref={articleRef}
            className="article-scroll h-[154px] overflow-y-auto px-3.5 py-3 text-sm leading-6 text-[var(--quiet)]"
            aria-label="Streaming article excerpt"
          >
            {ARTICLE_SECTIONS.map((section, sectionIndex) => {
              let offset = 0;
              for (let i = 0; i < sectionIndex; i += 1) offset += ARTICLE_SECTIONS[i].words.split(" ").length;
              const sectionWords = section.words.split(" ");

              return (
                <div key={section.header} className={sectionIndex > 0 ? "mt-5" : undefined}>
                  <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-[var(--ink)]">{section.header}</div>
                  <p className="flex flex-wrap gap-x-1 gap-y-1">
                    {sectionWords.map((word, index) => {
                      const globalIndex = offset + index;
                      const active = streaming && globalIndex === highlightIndex;
                      const delivered = readWordSet.has(globalIndex);
                      return (
                        <motion.span
                          key={`${section.header}-${word}-${index}`}
                          data-active-word={active ? "true" : undefined}
                          animate={
                            active
                              ? {
                                  color: "var(--ink)",
                                  backgroundColor: "rgba(var(--river-rgb), 0.24)",
                                  borderColor: "rgba(var(--river-rgb), 0.42)",
                                }
                              : delivered
                                ? {
                                    color: "var(--river-deep)",
                                    backgroundColor: "rgba(var(--river-rgb), 0.11)",
                                    borderColor: "rgba(var(--river-rgb), 0.2)",
                                  }
                                : {
                                    color: "var(--quiet)",
                                    backgroundColor: "rgba(255, 255, 255, 0)",
                                    borderColor: "rgba(255, 255, 255, 0)",
                                  }
                          }
                          transition={{ duration: 0.24, ease }}
                          className="inline-flex rounded-md border border-transparent px-1"
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
          <div className="mono h-[54px] border-t border-[var(--faint)] px-3.5 py-2 text-[0.66rem] leading-5 text-[var(--muted)]">
            {visibleCollectedWords.length > 0 ? visibleCollectedWords.join(" ") : "Awaiting a precise query from the buyer agent."}
          </div>
        </div>
      </div>

      {/* meter */}
      <div className="mt-5 border-t border-[var(--faint)] pt-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold tracking-[-0.02em]">
              {words}
              <span className="ml-1.5 text-sm font-medium text-[var(--muted)]">{words === 1 ? "word" : "words"} read</span>
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-lg font-bold text-[var(--river-deep)]">${paid}</div>
            <div className="mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">paid · usdc</div>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <motion.div
            className={`h-full rounded-full ${done ? "bg-[var(--green)]" : "bg-[var(--river-deep)]"}`}
            animate={{ width: `${Math.max(pct, 3)}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>

        {/* fixed-height slot keeps the panel from resizing when the banner appears */}
        <div className="mt-3 h-[54px]">
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease }}
                className="flex h-full items-center justify-between gap-3 rounded-xl border border-[rgba(88,213,155,0.34)] bg-[rgba(88,213,155,0.1)] px-3.5"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Check size={15} aria-hidden="true" /> Answer found — agent stopped
                </span>
                <span className="mono flex shrink-0 items-center gap-1.5 text-xs text-[var(--green)]">
                  <Coins size={13} aria-hidden="true" /> creator earned ${paid}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Agent({
  side,
  icon,
  name,
  sub,
  active,
  tint,
}: {
  side: "left" | "right";
  icon: React.ReactNode;
  name: string;
  sub: string;
  active: boolean;
  tint: "buyer" | "seller";
}) {
  // Solid, fixed token fills — the theater is always dark, so these don't follow
  // the theme vars. Two distinct blues read as two distinct agents.
  const color = tint === "buyer" ? "#2f567c" : "#3f7da1";
  const pos = side === "left" ? "left-0 items-start" : "right-0 items-end";
  return (
    <div className={`absolute top-0 flex w-[40%] min-w-0 flex-col gap-2.5 ${pos}`}>
      <div
        className={`agent-token grid h-[58px] w-[58px] place-items-center text-white transition-shadow duration-500 ${
          active ? "is-active" : ""
        }`}
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className={`flex min-w-0 max-w-full flex-col gap-1.5 ${side === "right" ? "items-end" : "items-start"}`}>
        <div className="text-[0.8rem] font-semibold leading-tight text-[var(--ink)]">{name}</div>
        <span
          className={`mono inline-flex items-center gap-1.5 rounded-md border px-1.5 py-[3px] text-[0.55rem] uppercase tracking-[0.1em] transition-colors duration-300 ${
            active
              ? "border-[rgba(145,185,220,0.4)] bg-[rgba(63,125,161,0.16)] text-[var(--river-deep)]"
              : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] text-[var(--muted)]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${active ? "status-dot bg-[var(--river-deep)]" : "bg-[var(--muted)]"}`}
            aria-hidden="true"
          />
          {sub}
        </span>
      </div>
    </div>
  );
}

function Bubble({
  side,
  tone = "buyer",
  icon,
  children,
}: {
  side: "left" | "right";
  tone?: "buyer" | "seller" | "answer";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles =
    tone === "seller"
      ? "border-[var(--river-line)] bg-[var(--river-pale)] text-[var(--ink)]"
      : tone === "answer"
        ? "border-[rgba(88,213,155,0.34)] bg-[rgba(88,213,155,0.1)] text-[var(--ink)]"
        : "border-[var(--faint)] bg-[var(--surface-muted)] text-[var(--ink)]";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.45, ease }}
      className={`flex max-w-[92%] items-start gap-2 rounded-2xl border px-3.5 py-2 text-[0.78rem] leading-5 ${styles} ${
        side === "right" ? "ml-auto rounded-br-sm" : "mr-auto rounded-bl-sm"
      }`}
    >
      {icon && <span className="mt-0.5 shrink-0 opacity-70">{icon}</span>}
      <span className="min-w-0">{children}</span>
    </motion.div>
  );
}
