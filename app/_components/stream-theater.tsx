"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Coins, ScanSearch, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PRICE_PER_WORD = 0.00001;
const FIRST_STOP = 50;
const TARGET_WORDS = 96;
const ease = [0.16, 1, 0.3, 1] as const;

type Phase = "ask" | "route" | "stream" | "followup" | "routeDeeper" | "streamDeeper" | "answer";

const SECTION_HEADER = "Consent Decree Language";
const DEEP_HEADER = "Authorized Exchange Requirements";

const ARTICLE_SECTIONS = [
  {
    header: SECTION_HEADER,
    words:
      "the consent decree prohibits any resale fee exceeding the original face value when the ticket is transferred between unaffiliated holders through a verified marketplace operated by the issuer or its appointed exchange agent the clause also requires each transfer record to preserve the article identifier wallet receipt and settlement reference",
  },
  {
    header: DEEP_HEADER,
    words:
      "authorized exchanges must confirm that the buyer agent has accepted the posted price per word before releasing protected language the seller agent can search within this section again compare the exchange rules against the buyer question and continue streaming only the words needed to answer whether resale requires issuer approved routing",
  },
];

const ARTICLE_WORDS = ARTICLE_SECTIONS.flatMap((section, sectionIndex) =>
  section.words.split(" ").map((word) => ({ word, sectionIndex })),
);

let packetSeq = 0;
type Packet = { id: number; word: string };

export function StreamTheater() {
  const [phase, setPhase] = useState<Phase>("ask");
  const [words, setWords] = useState(0);
  const [packets, setPackets] = useState<Packet[]>([]);
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
        const word = ARTICLE_WORDS[(n - 1) % ARTICLE_WORDS.length].word;
        const id = ++packetSeq;
        setPackets([{ id, word }]);
        // remove packet after it finishes its glide across the channel
        t.push(setTimeout(() => setPackets((p) => p.filter((x) => x.id !== id)), 1050));
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
  const collectedWords = ARTICLE_WORDS.slice(0, Math.min(words, ARTICLE_WORDS.length)).map((item) => item.word);
  const visibleCollectedWords = collectedWords.slice(-14);
  const highlightIndex = Math.max(0, Math.min(words - 1, ARTICLE_WORDS.length - 1));

  return (
    <div className="stream-theater card-soft relative min-h-[560px] w-full min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_50%_0%,rgba(102,132,255,0.14),transparent_68%)]" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-4 border-b border-[var(--faint)] pb-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`status-dot h-2.5 w-2.5 rounded-full ${done ? "bg-[var(--green)]" : "bg-[var(--river)]"}`}
            style={{ boxShadow: `0 0 0 4px ${done ? "rgba(88,213,155,0.14)" : "rgba(102,132,255,0.14)"}` }}
          />
          <span className="text-sm font-semibold">{done ? "Session settled" : "Live agent session"}</span>
        </div>
        <span className="mono shrink-0 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">
          rbcn://resale-fee-clause
        </span>
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
            icon={<User size={19} strokeWidth={1.9} aria-hidden="true" />}
            name="Buyer agent"
            sub={done ? "answer received" : phase === "streamDeeper" ? "searching section" : streaming ? "receiving" : asking ? "asking" : "searching section"}
            active={phase === "ask" || phase === "followup" || done}
            tint="river"
          />

          {/* seller agent (right) */}
          <Agent
            side="right"
            icon={<Bot size={19} strokeWidth={1.9} aria-hidden="true" />}
            name="Seller agent"
            sub={streaming ? "streaming words" : routing ? "routing" : "listening"}
            active={streaming || routing}
            tint="blue"
          />

          {/* in-flight word packets gliding seller → buyer along the channel */}
          <AnimatePresence>
            {packets.map((p) => (
              <motion.div
                key={p.id}
                initial={{ left: "72%", opacity: 0, scale: 0.92 }}
                animate={{ left: "28%", opacity: [0, 1, 1, 0], scale: 1 }}
                transition={{ duration: 1.0, ease, times: [0, 0.18, 0.8, 1] }}
                className="mono pointer-events-none absolute top-[30px] z-10 w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--river-line)] bg-[var(--surface)] px-2.5 py-1 text-center text-[0.62rem] text-[var(--river-deep)] shadow-[0_10px_22px_-16px_rgba(102,132,255,0.8)]"
              >
                {p.word}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-2 grid h-[132px] content-start gap-2">
          <AnimatePresence>
            {(phase === "ask" || phase === "route" || phase === "stream") && (
              <Bubble key="ask" side="left">
                Where does the article discuss <span className="text-[var(--ink)]">resale fees</span>?
              </Bubble>
            )}
            {(phase === "route" || phase === "stream") && (
              <Bubble key="route" side="right" tone="seller" icon={<ScanSearch size={13} aria-hidden="true" />}>
                Found it — section <span className="font-medium">“{SECTION_HEADER}.”</span> Streaming paid words.
              </Bubble>
            )}
            {(phase === "followup" || phase === "routeDeeper" || phase === "streamDeeper") && (
              <Bubble key="followup" side="left">
                Does it require an authorized exchange?
              </Bubble>
            )}
            {(phase === "routeDeeper" || phase === "streamDeeper") && (
              <Bubble key="route-deeper" side="right" tone="seller" icon={<ScanSearch size={13} aria-hidden="true" />}>
                Searching header <span className="font-medium">“{DEEP_HEADER}.”</span> Continue there.
              </Bubble>
            )}
            {done && (
              <Bubble key="answer" side="left" tone="answer" icon={<Sparkles size={13} aria-hidden="true" />}>
                Got the clause. Stopping the stream — I have enough.
              </Bubble>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 min-w-0 overflow-hidden rounded-[24px] border border-[var(--faint)] bg-[rgba(25,25,28,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div
            ref={articleRef}
            className="article-scroll h-[128px] overflow-y-auto px-3.5 py-3 text-sm leading-6 text-[var(--quiet)]"
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
                      const delivered = globalIndex < words;
                      return (
                        <motion.span
                          key={`${section.header}-${word}-${index}`}
                          data-active-word={active ? "true" : undefined}
                          animate={
                            active
                              ? {
                                  color: "var(--ink)",
                                  backgroundColor: "rgba(154, 146, 255, 0.24)",
                                  borderColor: "rgba(154, 146, 255, 0.4)",
                                }
                              : delivered
                                ? {
                                    color: "var(--river-deep)",
                                    backgroundColor: "rgba(154, 146, 255, 0.1)",
                                    borderColor: "rgba(154, 146, 255, 0.16)",
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
          <div className="mono h-[74px] border-t border-[var(--faint)] px-3.5 py-2 text-[0.66rem] leading-5 text-[var(--muted)]">
            {visibleCollectedWords.length > 0 ? visibleCollectedWords.join(" ") : "Where does the article discuss resale fees?"}
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
            className={`h-full rounded-full ${done ? "bg-[var(--green)]" : "bg-[linear-gradient(90deg,var(--river),var(--river-deep))]"}`}
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
  tint: "river" | "blue";
}) {
  const color = tint === "river" ? "var(--river)" : "var(--river-deep)";
  const pos = side === "left" ? "left-0 items-start text-left" : "right-0 items-end text-right";
  return (
    <div className={`absolute top-0 flex w-[40%] min-w-0 flex-col gap-2 ${pos}`}>
      <motion.div
        animate={active ? { scale: 1, boxShadow: `0 0 0 6px ${color}1f` } : { scale: 0.94, boxShadow: `0 0 0 0px ${color}00` }}
        transition={{ duration: 0.6, ease }}
        className="grid h-[60px] w-[60px] place-items-center rounded-[20px] text-white"
        style={{ background: `linear-gradient(145deg, ${color}, ${tint === "river" ? "var(--river-deep)" : "#6684ff"})` }}
      >
        {icon}
      </motion.div>
      <div className={`min-w-0 max-w-full ${side === "right" ? "text-right" : "text-left"}`}>
        <div className="text-[0.8rem] font-semibold leading-tight">{name}</div>
        <div className="mono whitespace-normal text-[0.58rem] uppercase leading-4 tracking-[0.08em] text-[var(--muted)]">{sub}</div>
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
