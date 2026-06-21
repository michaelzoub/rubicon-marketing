"use client";

/**
 * /demo-video — a deterministic, scripted ~30s product demo built to be
 * screen-recorded.
 *
 * Direction: a cinematic "spotlight stage". Only ONE idea is on screen at a
 * time — a headline, then the proof card beneath it — over a living ambient
 * field. A camera-style push-in + light sweep fires on every cut. No backend,
 * auth, wallet, or env vars: a rAF engine drives a fixed timeline and exposes a
 * per-scene `progress` for the streaming "magic moment".
 *
 * "At every moment, the viewer should know exactly what to look at."
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type SceneId =
  | "problem"
  | "solution"
  | "transact"
  | "retrieval"
  | "paid-stream"
  | "receipt"
  | "end";

const SCENES: Array<{ id: SceneId; ms: number }> = [
  { id: "problem", ms: 4000 },
  { id: "solution", ms: 4000 },
  { id: "transact", ms: 4000 },
  { id: "retrieval", ms: 4800 },
  { id: "paid-stream", ms: 6200 },
  { id: "receipt", ms: 4600 },
  { id: "end", ms: 3400 },
];

/* Cinematic easing — long, confident deceleration. */
const CINE = [0.16, 1, 0.3, 1] as const;

const TARGET_SPEND = 0.0068;
const TARGET_WORDS = 137;
const BUDGET_CAP = 0.02;
const BUDGET_UNUSED = BUDGET_CAP - TARGET_SPEND; // 0.0132

const ARTICLE_TITLE = "The Hidden Economics of Resale Fees";
const PRICE_LABEL = "$0.00005 / word";

const STREAM_TEXT =
  "The resale fee applies only when the asset transfers through a secondary-market venue covered by the original agreement. It is assessed against the realized sale price, not the appraised value, and the seller of record remains liable until settlement clears.";
const STREAM_WORDS = STREAM_TEXT.split(" ");

const BEATS = ["Problem", "Solution", "Transact", "Retrieval", "Stream", "Settle"] as const;
const beatOf: Record<SceneId, number> = {
  problem: 0,
  solution: 1,
  transact: 2,
  retrieval: 3,
  "paid-stream": 4,
  receipt: 5,
  end: 5,
};

type Node = "buyer" | "rubicon" | "creator";
const activeNodes: Record<SceneId, Node[]> = {
  problem: ["buyer"],
  solution: ["creator"],
  transact: ["buyer", "rubicon"],
  retrieval: ["rubicon"],
  "paid-stream": ["rubicon"],
  receipt: ["rubicon", "creator"],
  end: [],
};

/* ------------------------------------------------------------------ */
/* DemoVideoPage — rAF engine + chrome                                 */
/* ------------------------------------------------------------------ */

export default function DemoVideoPage() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current scene
  const [minimal, setMinimal] = useState(false);

  const scene = SCENES[index].id;
  const isEnd = scene === "end";

  // ?minimal=true hides the progress rail for clean recording.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMinimal(params.get("minimal") === "true");
  }, []);

  // rAF playback. Advances sequentially; holds on the final scene.
  const ms = SCENES[index].ms;
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    setProgress(0);
    const loop = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setProgress(p);
      if (p >= 1) {
        if (index < SCENES.length - 1) setIndex((i) => i + 1);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [index, ms]);

  return (
    <div className="dv-root">
      <DemoStyles />
      <AmbientBackground sceneIndex={index} />
      <div className="dv-vignette" aria-hidden="true" />

      <div className="dv-stage">
        <header className="dv-topbar">
          <AnimatePresence>
            {!isEnd && <MiniSystemMap key="map" active={activeNodes[scene]} />}
          </AnimatePresence>
        </header>

        <DemoStage scene={scene} progress={progress} />

        {!minimal && !isEnd && (
          <footer className="dv-bottombar">
            <ProgressRail scene={scene} />
          </footer>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DemoStage — filmic cut + perpetual float + light sweep              */
/* ------------------------------------------------------------------ */

function DemoStage({ scene, progress }: { scene: SceneId; progress: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="dv-spotlight">
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          className="dv-cut"
          initial={{ opacity: 0, scale: 1.06, y: 26, filter: "blur(14px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.97, y: -20, filter: "blur(14px)" }}
          transition={{ duration: 0.85, ease: CINE }}
        >
          <motion.div
            className="dv-float"
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          >
            <SceneSwitch scene={scene} progress={progress} />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <LightSweep trigger={scene} />
    </div>
  );
}

function SceneSwitch({ scene, progress }: { scene: SceneId; progress: number }) {
  switch (scene) {
    case "problem":
      return <ProblemScene />;
    case "solution":
      return <SolutionScene />;
    case "transact":
      return <TransactScene />;
    case "retrieval":
      return <RetrievalScene />;
    case "paid-stream":
      return <PaidStreamScene progress={progress} />;
    case "receipt":
      return <ReceiptScene />;
    case "end":
      return <EndScene />;
  }
}

/* A single diagonal light sweep that replays on every cut. */
function LightSweep({ trigger }: { trigger: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      key={trigger}
      className="dv-sweep"
      aria-hidden="true"
      initial={{ x: "-120%", opacity: 0 }}
      animate={{ x: "120%", opacity: [0, 0.5, 0] }}
      transition={{ duration: 1.1, ease: CINE }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SceneFrame — headline above, focal proof card below                 */
/* ------------------------------------------------------------------ */

function SceneFrame({
  tag,
  line,
  bg,
  children,
}: {
  tag: string;
  line: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dv-scene">
      <span className="dv-scene-bg" aria-hidden="true">
        {bg}
      </span>

      <div className="dv-scene-head">
        <motion.span
          className="dv-eyebrow mono"
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: CINE }}
        >
          {tag}
        </motion.span>
        <Headline text={line} />
      </div>

      <div className="dv-scene-focal">{children}</div>
    </section>
  );
}

/** Word-by-word blur-in headline (the reference's signature reveal). */
function Headline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h2 className="dv-mainline">
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="dv-mainline-word"
          initial={{ opacity: 0, y: 18, filter: "blur(9px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: CINE, delay: 0.22 + i * 0.05 }}
        >
          {w}
        </motion.span>
      ))}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 1 — Problem                                                   */
/* ------------------------------------------------------------------ */

function ProblemScene() {
  const sources = [
    { label: "Open web result", badge: "low signal", tone: "amber" as const },
    { label: "Premium article", badge: "paywalled", tone: "muted" as const },
    { label: "Scraped copy", badge: "untrusted", tone: "red" as const },
  ];
  return (
    <SceneFrame tag="the problem" bg="🧩" line="The agent needs trusted access, not another scrape.">
      <GlowCard head={<CardHead title="Buyer Agent" pill={<Pill tone="amber">Searching</Pill>} />}>
        <p className="dv-prompt">Find the resale-fee clause from the best available source.</p>
        <div className="dv-sources">
          {sources.map((s, i) => (
            <motion.div
              key={s.label}
              className="dv-source"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: CINE, delay: 0.55 + i * 0.4 }}
            >
              <span className="dv-source-label">{s.label}</span>
              <Badge tone={s.tone}>{s.badge}</Badge>
            </motion.div>
          ))}
        </div>
      </GlowCard>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — Solution / publish                                        */
/* ------------------------------------------------------------------ */

function SolutionScene() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLive(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <SceneFrame tag="the solution" bg="🔨" line="Creators publish premium writing and price it per word.">
      <GlowCard head={<CardHead title="Creator" />}>
        <p className="dv-pub-title">{ARTICLE_TITLE}</p>
        <div className="dv-pub-meta">
          <MetaTile k="Price" v={PRICE_LABEL} accent />
          <MetaTile k="Wallet" v="Verified" green />
        </div>
        <div className={`dv-status-toggle${live ? " is-live" : ""}`}>
          <span className={`dv-status-step${!live ? " is-on" : ""}`}>Draft</span>
          <span className="dv-status-arrow">&rarr;</span>
          <span className={`dv-status-step${live ? " is-on" : ""}`}>
            <span className="dv-live-dot status-dot" aria-hidden="true" /> Live
          </span>
        </div>
      </GlowCard>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — How agents transact                                       */
/* ------------------------------------------------------------------ */

function TransactScene() {
  return (
    <SceneFrame tag="how agents transact" bg="🤝" line="The agent opens a capped reading session.">
      <div className="dv-duo">
        <GlowCard compact head={<CardHead title="Buyer Agent" pill={<Pill tone="river">Sending</Pill>} />}>
          <KV k="goal" v="find the resale-fee clause" />
          <KV k="max spend" v={`$${BUDGET_CAP.toFixed(2)}`} accent />
        </GlowCard>

        <motion.div
          className="dv-duo-link"
          aria-hidden="true"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, ease: CINE, delay: 0.55 }}
        />

        <GlowCard compact delay={0.2} head={<CardHead title="Rubicon" pill={<Pill tone="river">Session open</Pill>} />}>
          <KV k="budget cap" v={`$${BUDGET_CAP.toFixed(2)}`} accent />
          <KV k="seller agent" v="attached" />
        </GlowCard>
      </div>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 4 — Facilitating retrieval / seller agents                    */
/* ------------------------------------------------------------------ */

function RetrievalScene() {
  return (
    <SceneFrame
      tag="facilitating information retrieval · seller agents"
      bg="🧭"
      line="The seller agent guides the buyer without leaking unpaid content."
    >
      <GlowCard head={<CardHead title="Seller Agent" pill={<Pill tone="river">Routing</Pill>} />}>
        <div className="dv-convo">
          <ChatBubble side="seller" author="seller.agent">
            The most relevant section is{" "}
            <span className="dv-highlight">&ldquo;Consent Decree Language&rdquo;</span>. Start there?
          </ChatBubble>
          <ChatBubble side="buyer" author="buyer.agent" delay={0.85}>
            Yes. Stream only what is needed.
          </ChatBubble>
        </div>
        <motion.span
          className="dv-protected-chip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: CINE, delay: 1.6 }}
        >
          Unpaid content protected
        </motion.span>
      </GlowCard>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 5 — Paid word stream — the magic moment                       */
/* ------------------------------------------------------------------ */

function PaidStreamScene({ progress }: { progress: number }) {
  const revealFrac = Math.min(1, progress / 0.75);
  const revealed = Math.round(STREAM_WORDS.length * revealFrac);
  const wordsRead = Math.round(TARGET_WORDS * revealFrac);
  const spent = TARGET_SPEND * revealFrac;
  const stopped = progress >= 0.8;

  return (
    <SceneFrame tag="paid stream" bg="🌊" line="The agent pays only for the words it actually reads.">
      <GlowCard
        glow="strong"
        head={
          <CardHead
            title="Rubicon"
            pill={stopped ? <Pill tone="green">Stopped</Pill> : <Pill tone="river" live>Streaming</Pill>}
          />
        }
      >
        <div className="dv-meters">
          <div className="dv-meter">
            <span className="mono dv-meter-label">words read</span>
            <span className="dv-big-number mono">{wordsRead}</span>
          </div>
          <div className="dv-meter dv-meter-mid">
            <span className="mono dv-meter-label">spent</span>
            <span className="dv-big-number mono">${spent.toFixed(4)}</span>
          </div>
          <div className="dv-meter">
            <span className="mono dv-meter-label">budget cap</span>
            <span className="dv-big-number dv-big-muted mono">${BUDGET_CAP.toFixed(2)}</span>
          </div>
        </div>

        <div className="dv-stream-body">
          <p className="dv-stream-text">
            {STREAM_WORDS.map((w, i) => (
              <span
                key={i}
                className={`dv-word${i < revealed ? " dv-word-on" : ""}${i === revealed - 1 ? " dv-word-edge" : ""}`}
              >
                {w}{" "}
              </span>
            ))}
            {!stopped && <span className="dv-caret" aria-hidden="true" />}
          </p>
        </div>

        <AnimatePresence>
          {stopped && (
            <motion.div
              key="stop"
              className="dv-stop-chip"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: CINE }}
            >
              Enough context. Stop.
            </motion.div>
          )}
        </AnimatePresence>
      </GlowCard>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 6 — Receipt + creator earns                                   */
/* ------------------------------------------------------------------ */

function ReceiptScene() {
  const [transferred, setTransferred] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setTransferred(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  const words = useCountUp(TARGET_WORDS, true, 1100);
  const spent = useCountUp(TARGET_SPEND, true, 1300);
  const unused = useCountUp(BUDGET_UNUSED, true, 1300);
  const earned = useCountUp(TARGET_SPEND, transferred, 1200);

  const rows = [
    { k: "words read", v: Math.round(words).toString() },
    { k: "spent", v: `$${spent.toFixed(4)}` },
    { k: "unused", v: `$${unused.toFixed(4)}` },
  ];

  return (
    <SceneFrame tag="settle" bg="🧾" line="Creators earn from exact agent usage.">
      <div className="dv-settle">
        <div className="dv-receipt">
          <div className="dv-receipt-head">
            <span className="dv-receipt-title">Receipt</span>
            <Pill tone="green">Settled</Pill>
          </div>
          <div className="dv-receipt-rows">
            {rows.map((r, i) => (
              <motion.div
                key={r.k}
                className="dv-receipt-row"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: CINE, delay: 0.2 + i * 0.12 }}
              >
                <span className="mono dv-receipt-k">{r.k}</span>
                <span className="mono dv-receipt-v">{r.v}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="dv-transfer" aria-hidden="true">
          <motion.span
            className="dv-transfer-line"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: transferred ? 1 : 0 }}
            transition={{ duration: 0.5, ease: CINE }}
          />
          <AnimatePresence>
            {transferred && (
              <motion.span
                className="dv-transfer-dot"
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.9, ease: CINE, times: [0, 0.2, 0.8, 1] }}
              />
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className="dv-earn-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: transferred ? 1 : 0.16, y: transferred ? 0 : 14 }}
          transition={{ duration: 0.55, ease: CINE }}
        >
          <span className="mono dv-earn-label">Creator earns</span>
          <div className="dv-earn-value">
            <span className="dv-earn-plus">+</span>
            <span className="dv-big-number dv-big-green mono">${earned.toFixed(4)}</span>
          </div>
          <p className="dv-earn-note mono">Exact usage, not a subscription</p>
        </motion.div>
      </div>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 7 — End card                                                  */
/* ------------------------------------------------------------------ */

function EndScene() {
  const headline = "Let AI agents pay to read your work.".split(" ");
  return (
    <section className="dv-end">
      <motion.div
        className="dv-end-burst"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.7, 0.45], scale: 1.2 }}
        transition={{ duration: 1.6, ease: CINE }}
      />
      <motion.div
        className="dv-end-mark"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: CINE }}
      >
        <Waves size={30} strokeWidth={2} className="text-[var(--river-deep)]" aria-hidden="true" />
        <span>Rubicon</span>
      </motion.div>
      <h2 className="dv-end-title">
        {headline.map((w, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: CINE, delay: 0.25 + i * 0.07 }}
          >
            {w}{" "}
          </motion.span>
        ))}
      </h2>
      <motion.p
        className="dv-end-sub"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: CINE, delay: 0.5 }}
      >
        Creators earn. Agents access better sources. Every word is accounted for.
      </motion.p>
      <motion.span
        className="dv-end-cta"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: CINE, delay: 0.7 }}
      >
        Rubicon
      </motion.span>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* MiniSystemMap                                                       */
/* ------------------------------------------------------------------ */

function MiniSystemMap({ active }: { active: Node[] }) {
  const nodes: Array<{ id: Node; label: string }> = [
    { id: "buyer", label: "Buyer" },
    { id: "rubicon", label: "Rubicon" },
    { id: "creator", label: "Creator" },
  ];
  return (
    <motion.div
      className="dv-map"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: CINE }}
    >
      {nodes.map((n, i) => (
        <span key={n.id} className="dv-map-cell">
          {i > 0 && <span className={`dv-map-link${active.length > 1 ? " is-on" : ""}`} aria-hidden="true" />}
          <span className={`dv-map-node${active.includes(n.id) ? " is-on" : ""}`}>{n.label}</span>
        </span>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressRail                                                        */
/* ------------------------------------------------------------------ */

function ProgressRail({ scene }: { scene: SceneId }) {
  const current = beatOf[scene];
  return (
    <div className="dv-rail">
      {BEATS.map((label, i) => (
        <div key={label} className={`dv-beat${i === current ? " is-on" : ""}${i < current ? " is-done" : ""}`}>
          <span className="dv-beat-dot" aria-hidden="true" />
          <span className="dv-beat-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ambient atmosphere — drifting glow that tracks the scene            */
/* ------------------------------------------------------------------ */

function AmbientBackground({ sceneIndex }: { sceneIndex: number }) {
  const reduce = useReducedMotion();
  const x = 28 + (sceneIndex % 4) * 15;
  return (
    <div className="dv-ambient" aria-hidden="true">
      <div className="dv-ambient-base" />
      <motion.div
        className="dv-ambient-glow"
        animate={
          reduce
            ? { left: `${x}%` }
            : { left: `${x}%`, opacity: [0.35, 0.6, 0.35], scale: [1, 1.12, 1] }
        }
        transition={{
          left: { duration: 1.6, ease: CINE },
          opacity: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 9, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="dv-ambient-glow2"
        animate={reduce ? undefined : { y: [0, 58, 0], opacity: [0.22, 0.42, 0.22] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="dv-ambient-grid" />
      <div className="dv-ambient-fade" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function GlowCard({
  children,
  head,
  glow,
  compact,
  delay = 0,
}: {
  children: React.ReactNode;
  head: React.ReactNode;
  glow?: "strong";
  compact?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      className="dv-card-wrap"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: CINE, delay }}
    >
      <motion.span
        className={`dv-card-aura${glow === "strong" ? " is-strong" : ""}`}
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: [0, 0.8, 0.5], scale: 1 }}
        transition={{ duration: 1.3, ease: CINE, times: [0, 0.55, 1], delay }}
      />
      <div className={`dv-card${compact ? " dv-card-compact" : ""}`}>
        <motion.span
          className="dv-card-sheen"
          aria-hidden="true"
          initial={{ x: "-130%" }}
          animate={{ x: "130%" }}
          transition={{ duration: 1.2, ease: CINE, delay: delay + 0.25 }}
        />
        <div className="dv-card-head">{head}</div>
        <div className="dv-card-body">{children}</div>
      </div>
    </motion.div>
  );
}

function CardHead({ title, pill }: { title: string; pill?: React.ReactNode }) {
  return (
    <>
      <span className="dv-card-title">{title}</span>
      {pill}
    </>
  );
}

function ChatBubble({
  side,
  author,
  children,
  delay = 0,
}: {
  side: "buyer" | "seller";
  author: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className={`dv-bubble dv-bubble-${side}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: CINE, delay: 0.4 + delay }}
    >
      <span className="dv-bubble-author mono">{author}</span>
      <p className="dv-bubble-body">{children}</p>
    </motion.div>
  );
}

function KV({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="dv-kv">
      <span className="mono dv-kv-k">{k}</span>
      <span className={`mono dv-kv-v${accent ? " dv-kv-v-accent" : ""}`}>{v}</span>
    </div>
  );
}

function MetaTile({ k, v, accent, green }: { k: string; v: string; accent?: boolean; green?: boolean }) {
  return (
    <div className="dv-metatile">
      <span className="mono dv-metatile-k">{k}</span>
      <span
        className={`dv-metatile-v${accent ? " dv-metatile-v-accent mono" : ""}${green ? " dv-metatile-v-green" : ""}`}
      >
        {v}
      </span>
    </div>
  );
}

function Pill({
  tone,
  live,
  children,
}: {
  tone: "river" | "amber" | "green" | "red" | "muted";
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.span
      className={`dv-pill dv-pill-${tone}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: CINE }}
    >
      <span className={`dv-pill-dot${live ? " dv-pill-dot-live" : ""} status-dot`} aria-hidden="true" /> {children}
    </motion.span>
  );
}

function Badge({ tone, children }: { tone: "amber" | "muted" | "red"; children: React.ReactNode }) {
  return <span className={`dv-badge dv-badge-${tone}`}>{children}</span>;
}

/** rAF count-up driven by an `active` flag. */
function useCountUp(target: number, active: boolean, durationMs = 1200) {
  const [val, setVal] = useState(0);
  const reduce = useReducedMotion();
  const raf = useRef(0);
  useEffect(() => {
    if (!active) {
      setVal(0);
      return;
    }
    if (reduce) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setVal(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active, durationMs, reduce]);
  return val;
}

/* ------------------------------------------------------------------ */
/* Scoped styles                                                       */
/* ------------------------------------------------------------------ */

function DemoStyles() {
  return (
    <style>{`
      .dv-root {
        position: fixed; inset: 0; overflow: hidden;
        background: #08090c;
        color: var(--ink);
        font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
      }

      /* ---- ambient atmosphere ---- */
      .dv-ambient { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
      .dv-ambient-base { position: absolute; inset: 0; background: radial-gradient(120% 80% at 50% -10%, rgba(36,58,104,0.55) 0%, transparent 55%); }
      .dv-ambient-glow { position: absolute; top: 22%; width: 72vh; height: 72vh; margin-left: -36vh; border-radius: 50%; background: rgba(47,128,237,0.16); filter: blur(140px); }
      .dv-ambient-glow2 { position: absolute; top: 0; right: 6%; width: 60vh; height: 60vh; border-radius: 50%; background: rgba(110,165,255,0.1); filter: blur(150px); }
      .dv-ambient-grid {
        position: absolute; inset: 0; opacity: 0.04;
        background-image: linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px);
        background-size: 64px 64px;
        -webkit-mask-image: radial-gradient(120% 80% at 50% 40%, #000, transparent 85%);
        mask-image: radial-gradient(120% 80% at 50% 40%, #000, transparent 85%);
      }
      .dv-ambient-fade { position: absolute; inset: auto 0 0 0; height: 50%; background: linear-gradient(to top, #08090c, transparent); }
      .dv-vignette {
        position: absolute; inset: 0; z-index: 1; pointer-events: none;
        background: radial-gradient(120% 120% at 50% 45%, transparent 55%, rgba(2,4,10,0.6) 100%);
      }

      .dv-stage {
        position: relative; z-index: 2;
        display: flex; flex-direction: column;
        width: min(1280px, 100%); height: 100%;
        margin-inline: auto;
        padding: clamp(18px, 3vh, 36px) clamp(24px, 4vw, 72px);
        gap: clamp(12px, 2vh, 22px);
      }

      .dv-topbar { display: flex; align-items: center; justify-content: flex-end; min-height: 30px; }

      /* ---- mini system map (text only) ---- */
      .dv-map { display: inline-flex; align-items: center; }
      .dv-map-cell { display: inline-flex; align-items: center; }
      .dv-map-link { width: clamp(16px, 2.2vw, 30px); height: 1.5px; background: var(--faint); transition: background-color 450ms ease; }
      .dv-map-link.is-on { background: var(--river-line); }
      .dv-map-node {
        padding: 5px 12px; border-radius: 999px;
        font-size: 0.66rem; font-weight: 600; color: var(--muted);
        border: 1px solid var(--faint); background: rgba(255,255,255,0.02);
        opacity: 0.4; transition: opacity 450ms ease, color 450ms ease, border-color 450ms ease, background-color 450ms ease;
      }
      .dv-map-node.is-on {
        opacity: 1; color: var(--ink); border-color: var(--river-line); background: rgba(47,128,237,0.12);
        box-shadow: 0 0 0 1px rgba(47,128,237,0.12), 0 8px 24px -14px rgba(47,128,237,0.7);
      }

      /* ---- spotlight / cut / float ---- */
      .dv-spotlight { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
      .dv-cut { display: flex; width: 100%; align-items: center; justify-content: center; }
      .dv-float { display: flex; width: 100%; align-items: center; justify-content: center; }
      .dv-sweep {
        position: absolute; inset-block: 0; left: 0; z-index: 6; width: 34%;
        transform: skewX(-12deg);
        background: linear-gradient(90deg, transparent, rgba(110,165,255,0.12), transparent);
        filter: blur(28px); pointer-events: none;
      }

      /* ---- scene: headline above, card below ---- */
      .dv-scene { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: clamp(18px, 3vh, 32px); }
      .dv-scene-bg {
        position: absolute; inset: 0; z-index: 0; display: grid; place-items: center;
        font-size: clamp(240px, 38vw, 480px); line-height: 1; opacity: 0.07;
        filter: grayscale(0.4) brightness(1.05); pointer-events: none; user-select: none;
        -webkit-mask-image: radial-gradient(60% 60% at 50% 50%, #000 25%, transparent 78%);
        mask-image: radial-gradient(60% 60% at 50% 50%, #000 25%, transparent 78%);
      }
      .dv-scene-head { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
      .dv-eyebrow {
        display: inline-flex; align-items: center; padding: 5px 13px; border-radius: 999px;
        border: 1px solid var(--river-line); background: rgba(47,128,237,0.1); color: var(--river-deep);
        font-size: 0.6rem; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600;
      }
      .dv-mainline {
        max-width: 20ch; display: flex; flex-wrap: wrap; justify-content: center; gap: 0 0.3em;
        font-size: clamp(1.5rem, 3vw, 2.65rem); font-weight: 780; letter-spacing: -0.03em; line-height: 1.06; color: var(--ink);
      }
      .dv-mainline-word { display: inline-block; }

      .dv-scene-focal { position: relative; z-index: 2; width: 100%; max-width: 720px; display: flex; justify-content: center; }

      /* ---- glow card ---- */
      .dv-card-wrap { position: relative; width: 100%; }
      .dv-card-aura {
        position: absolute; inset: -6px; z-index: 0; border-radius: 28px; filter: blur(34px); pointer-events: none;
        background: radial-gradient(120% 120% at 50% 0%, rgba(47,128,237,0.4), transparent 62%);
      }
      .dv-card-aura.is-strong { background: radial-gradient(120% 120% at 50% 0%, rgba(47,128,237,0.6), transparent 64%); }
      .dv-card {
        position: relative; z-index: 1; overflow: hidden;
        border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
        background: rgba(17,19,24,0.72);
        backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05), 0 40px 120px -50px rgba(0,0,0,0.95);
      }
      .dv-card::before {
        content: ""; position: absolute; inset-inline: 0; top: 0; height: 1px; z-index: 3; pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(110,165,255,0.6), transparent);
      }
      .dv-card-sheen { position: absolute; inset-block: 0; left: 0; z-index: 2; width: 50%; transform: skewX(-12deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); pointer-events: none; }
      .dv-card-head { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 20px; border-bottom: 1px solid var(--faint); }
      .dv-card-title { font-size: 1rem; font-weight: 700; letter-spacing: -0.01em; }
      .dv-card-body { position: relative; z-index: 3; padding: 22px; display: flex; flex-direction: column; gap: 16px; }
      .dv-card-compact .dv-card-body { padding: 16px 18px; gap: 10px; }

      /* ---- pills ---- */
      .dv-pill { display: inline-flex; align-items: center; gap: 6px; flex: none; padding: 4px 10px; border-radius: 999px; font-family: var(--font-mono), monospace; font-size: 0.6rem; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600; border: 1px solid transparent; }
      .dv-pill-dot { width: 6px; height: 6px; border-radius: 50%; }
      .dv-pill-dot-live { box-shadow: 0 0 0 0 currentColor; animation: dv-ping 1.4s var(--ease-out, ease) infinite; }
      @keyframes dv-ping { 0% { box-shadow: 0 0 0 0 rgba(127,180,255,0.5); } 70%,100% { box-shadow: 0 0 0 6px rgba(127,180,255,0); } }
      .dv-pill-river { color: var(--river-deep); border-color: var(--river-line); background: rgba(47,128,237,0.12); }
      .dv-pill-river .dv-pill-dot { background: var(--river-deep); }
      .dv-pill-amber { color: var(--amber); border-color: rgba(224,183,109,0.32); background: rgba(224,183,109,0.1); }
      .dv-pill-amber .dv-pill-dot { background: var(--amber); }
      .dv-pill-green { color: var(--green); border-color: rgba(88,213,155,0.32); background: rgba(88,213,155,0.1); }
      .dv-pill-green .dv-pill-dot { background: var(--green); }
      .dv-pill-red { color: var(--red); border-color: rgba(240,120,120,0.32); background: rgba(240,120,120,0.1); }
      .dv-pill-red .dv-pill-dot { background: var(--red); }
      .dv-pill-muted { color: var(--quiet); border-color: var(--faint); background: rgba(255,255,255,0.04); }
      .dv-pill-muted .dv-pill-dot { background: var(--quiet); }

      /* ---- prompt + bubbles ---- */
      .dv-prompt { font-size: 1.16rem; line-height: 1.4; color: var(--ink); font-weight: 550; }
      .dv-convo { display: flex; flex-direction: column; gap: 12px; }
      .dv-bubble { max-width: 92%; border-radius: 16px; padding: 13px 16px; }
      .dv-bubble-author { display: block; font-size: 0.56rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--quiet); margin-bottom: 6px; }
      .dv-bubble-body { font-size: 1rem; line-height: 1.5; color: var(--ink); }
      .dv-bubble-seller { align-self: flex-start; border-bottom-left-radius: 5px; background: rgba(47,128,237,0.1); border: 1px solid var(--river-line); }
      .dv-bubble-buyer { align-self: flex-end; border-bottom-right-radius: 5px; background: rgba(255,255,255,0.05); border: 1px solid var(--faint); }
      .dv-highlight { color: var(--river-deep); font-weight: 600; }
      .dv-protected-chip { align-self: flex-start; font-size: 0.7rem; font-weight: 600; color: var(--river-deep); padding: 6px 12px; border-radius: 999px; border: 1px solid var(--river-line); background: rgba(47,128,237,0.1); }

      /* ---- sources ---- */
      .dv-sources { display: flex; flex-direction: column; gap: 9px; }
      .dv-source { display: flex; align-items: center; gap: 12px; border: 1px solid var(--faint); border-radius: 12px; background: rgba(255,255,255,0.02); padding: 13px 15px; }
      .dv-source-label { font-size: 0.95rem; margin-right: auto; color: var(--muted); }
      .dv-badge { font-family: var(--font-mono), monospace; font-size: 0.58rem; letter-spacing: 0.04em; text-transform: uppercase; padding: 4px 8px; border-radius: 7px; border: 1px solid transparent; white-space: nowrap; }
      .dv-badge-amber { color: var(--amber); border-color: rgba(224,183,109,0.3); background: rgba(224,183,109,0.08); }
      .dv-badge-muted { color: var(--quiet); border-color: var(--faint); background: rgba(255,255,255,0.03); }
      .dv-badge-red { color: var(--red); border-color: rgba(240,120,120,0.3); background: rgba(240,120,120,0.08); }

      /* ---- solution / publish ---- */
      .dv-pub-title { font-size: 1.55rem; font-weight: 730; letter-spacing: -0.025em; line-height: 1.18; }
      .dv-pub-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .dv-metatile { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--faint); border-radius: 13px; background: rgba(255,255,255,0.02); padding: 13px 15px; }
      .dv-metatile-k { font-size: 0.56rem; letter-spacing: 0.07em; text-transform: uppercase; color: var(--quiet); }
      .dv-metatile-v { font-size: 1rem; font-weight: 600; color: var(--ink); }
      .dv-metatile-v-accent { color: var(--river-deep); }
      .dv-metatile-v-green { color: var(--green); }
      .dv-status-toggle { display: inline-flex; align-items: center; gap: 13px; align-self: flex-start; padding: 10px 16px; border-radius: 12px; border: 1px solid var(--faint); background: rgba(255,255,255,0.02); transition: border-color 500ms ease; }
      .dv-status-toggle.is-live { border-color: rgba(88,213,155,0.3); }
      .dv-status-arrow { color: var(--quiet); font-size: 1rem; }
      .dv-status-step { display: inline-flex; align-items: center; gap: 7px; font-size: 0.92rem; font-weight: 600; color: var(--quiet); transition: color 500ms ease; }
      .dv-status-step.is-on { color: var(--ink); }
      .dv-status-toggle.is-live .dv-status-step.is-on { color: var(--green); }
      .dv-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }

      /* ---- transact (duo) ---- */
      .dv-duo { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: 100%; }
      .dv-duo-link { height: 2px; width: clamp(20px, 3vw, 48px); transform-origin: left center; background: linear-gradient(90deg, var(--river-line), rgba(110,165,255,0.1)); }
      .dv-kv { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
      .dv-kv-k { font-size: 0.6rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--quiet); }
      .dv-kv-v { font-size: 0.9rem; color: var(--ink); }
      .dv-kv-v-accent { color: var(--river-deep); font-weight: 700; }

      /* ---- paid stream ---- */
      .dv-meters { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid var(--faint); border-radius: 14px; overflow: hidden; background: rgba(255,255,255,0.02); }
      .dv-meter { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; }
      .dv-meter-mid { border-left: 1px solid var(--faint); border-right: 1px solid var(--faint); }
      .dv-meter-label { font-size: 0.56rem; letter-spacing: 0.07em; text-transform: uppercase; color: var(--quiet); }
      .dv-big-number { font-size: clamp(1.55rem, 2.6vw, 2.05rem); font-weight: 760; letter-spacing: -0.02em; color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1; }
      .dv-big-muted { color: var(--quiet); }
      .dv-big-green { color: var(--green); }
      .dv-stream-body { border: 1px solid var(--faint); border-radius: 14px; background: linear-gradient(180deg, rgba(47,128,237,0.06), rgba(255,255,255,0.01)); padding: 18px 20px; min-height: 140px; }
      .dv-stream-text { font-size: 1.08rem; line-height: 1.85; font-family: ui-serif, Georgia, "Times New Roman", serif; }
      .dv-word { color: rgba(162,165,173,0.18); transition: color 360ms var(--ease-out, ease), background-color 360ms ease; }
      .dv-word-on { color: var(--ink); }
      .dv-word-edge { color: var(--river-deep); background: rgba(47,128,237,0.18); border-radius: 4px; padding: 0 2px; }
      .dv-caret { display: inline-block; width: 8px; height: 1.05em; vertical-align: text-bottom; margin-left: 1px; background: var(--river-deep); border-radius: 1px; box-shadow: 0 0 10px rgba(47,128,237,0.8); animation: dv-blink 1s steps(2) infinite; }
      @keyframes dv-blink { 50% { opacity: 0; } }
      .dv-stop-chip { display: inline-flex; align-items: center; align-self: flex-start; font-size: 0.86rem; font-weight: 650; color: var(--green); padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(88,213,155,0.32); background: rgba(88,213,155,0.1); }

      /* ---- settle ---- */
      .dv-settle { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: 100%; }
      .dv-receipt { border: 1px solid var(--river-line); border-radius: 18px; background: linear-gradient(180deg, rgba(47,128,237,0.08), rgba(255,255,255,0.015)); padding: 18px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      .dv-receipt-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 13px; border-bottom: 1px dashed var(--faint); margin-bottom: 13px; }
      .dv-receipt-title { font-size: 1rem; font-weight: 700; }
      .dv-receipt-rows { display: flex; flex-direction: column; gap: 12px; }
      .dv-receipt-row { display: flex; align-items: baseline; justify-content: space-between; }
      .dv-receipt-k { font-size: 0.64rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--quiet); }
      .dv-receipt-v { font-size: 1.08rem; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
      .dv-transfer { position: relative; width: clamp(40px, 7vw, 96px); height: 2px; background: var(--faint); margin: 0 6px; }
      .dv-transfer-line { position: absolute; inset: 0; transform-origin: left center; background: linear-gradient(90deg, var(--river), var(--green)); }
      .dv-transfer-dot { position: absolute; top: 50%; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: var(--green); box-shadow: 0 0 10px rgba(88,213,155,0.85); }
      .dv-earn-card { border: 1px solid rgba(88,213,155,0.3); border-radius: 18px; background: linear-gradient(180deg, rgba(88,213,155,0.08), rgba(255,255,255,0.012)); padding: 18px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      .dv-earn-label { font-size: 0.58rem; letter-spacing: 0.07em; text-transform: uppercase; color: var(--quiet); }
      .dv-earn-value { display: flex; align-items: baseline; gap: 3px; margin-top: 8px; }
      .dv-earn-plus { font-size: 1.7rem; font-weight: 760; color: var(--green); line-height: 1; }
      .dv-earn-note { font-size: 0.64rem; letter-spacing: 0.02em; color: var(--quiet); margin-top: 12px; line-height: 1.5; }

      /* ---- end card ---- */
      .dv-end { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 640px; gap: 16px; }
      .dv-end-burst { position: absolute; top: -40px; left: 50%; width: 280px; height: 280px; margin-left: -140px; border-radius: 50%; background: rgba(47,128,237,0.25); filter: blur(100px); pointer-events: none; }
      .dv-end-mark { position: relative; display: inline-flex; align-items: center; gap: 12px; font-size: 1.6rem; font-weight: 760; letter-spacing: -0.03em; }
      .dv-end-title { position: relative; font-size: clamp(2.1rem, 4.6vw, 3.6rem); font-weight: 790; letter-spacing: -0.04em; line-height: 1.04; max-width: 15ch; }
      .dv-end-sub { position: relative; font-size: clamp(0.95rem, 1.5vw, 1.15rem); line-height: 1.6; color: var(--muted); max-width: 44ch; }
      .dv-end-cta { position: relative; margin-top: 8px; display: inline-flex; align-items: center; padding: 12px 28px; border-radius: 999px; background: var(--river); color: #fff; font-weight: 700; letter-spacing: -0.01em; box-shadow: 0 18px 54px -18px rgba(47,128,237,0.85); }

      /* ---- bottom rail ---- */
      .dv-bottombar { display: flex; align-items: center; justify-content: center; min-height: 28px; }
      .dv-rail { display: flex; align-items: center; gap: clamp(12px, 1.8vw, 26px); flex-wrap: wrap; justify-content: center; }
      .dv-beat { display: inline-flex; align-items: center; gap: 7px; opacity: 0.38; transition: opacity 450ms ease; }
      .dv-beat.is-on, .dv-beat.is-done { opacity: 1; }
      .dv-beat-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--quiet); transition: background-color 450ms ease, box-shadow 450ms ease; }
      .dv-beat.is-done .dv-beat-dot { background: var(--river-deep); }
      .dv-beat.is-on .dv-beat-dot { background: var(--river-deep); box-shadow: 0 0 9px rgba(47,128,237,0.7); }
      .dv-beat-label { font-size: 0.68rem; font-weight: 600; color: var(--muted); }
      .dv-beat.is-on .dv-beat-label { color: var(--ink); }

      @media (max-width: 720px) {
        .dv-duo, .dv-settle { grid-template-columns: 1fr; gap: 14px; }
        .dv-duo-link, .dv-transfer { display: none; }
        .dv-pub-meta { grid-template-columns: 1fr; }
        .dv-rail { display: none; }
        .dv-scene-bg { font-size: 58vw; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dv-caret, .dv-pill-dot-live { animation: none !important; }
      }
    `}</style>
  );
}
