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

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CircleDollarSign,
  FileText,
  LayoutGrid,
  MousePointer2,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  WalletCards,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type SceneId =
  | "problem"
  | "solution"
  | "paid-stream"
  | "receipt"
  | "end";

const SCENES: Array<{ id: SceneId; ms: number }> = [
  { id: "problem", ms: 5500 },
  { id: "solution", ms: 9000 },
  { id: "paid-stream", ms: 9000 },
  { id: "receipt", ms: 6000 },
  { id: "end", ms: 3400 },
];

/* Cinematic easing — long, confident deceleration. */
const CINE = [0.16, 1, 0.3, 1] as const;

const TARGET_SPEND = 0.0068;
const TARGET_WORDS = 137;
const BUDGET_CAP = 0.02;

const ARTICLE_TITLE = "The Hidden Economics of Resale Fees";

const STREAM_TEXT =
  "The resale fee applies only when the asset transfers through a secondary-market venue covered by the original agreement. It is assessed against the realized sale price, not the appraised value, and the seller of record remains liable until settlement clears.";
const STREAM_WORDS = STREAM_TEXT.split(" ");

const BEATS = ["Problem", "Solution", "Stream", "Settle"] as const;
const beatOf: Record<SceneId, number> = {
  problem: 0,
  solution: 1,
  "paid-stream": 2,
  receipt: 3,
  end: 3,
};

/* Each scene owns its mood: the ambient field shifts color to match — a calm
 * slate for the problem, green resolution at publish, river confidence through
 * the stream, settling green at payout. */
const TONE: Record<SceneId, { glow: string; glow2: string }> = {
  problem: { glow: "rgba(63,112,152,0.15)", glow2: "rgba(63,112,152,0.11)" },
  solution: { glow: "rgba(88,213,155,0.18)", glow2: "rgba(88,213,155,0.1)" },
  "paid-stream": { glow: "rgba(47,128,237,0.22)", glow2: "rgba(110,165,255,0.13)" },
  receipt: { glow: "rgba(88,213,155,0.17)", glow2: "rgba(63,112,152,0.1)" },
  end: { glow: "rgba(47,128,237,0.18)", glow2: "rgba(63,112,152,0.12)" },
};

/* Each section enters with its own camera move, so no two cuts feel alike. */
type Cut = { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition; transition: Transition };
const CUTS: Record<SceneId, Cut> = {
  // quiet, composed settle
  problem: {
    initial: { opacity: 0, y: 26, scale: 1.04, filter: "blur(12px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -20, filter: "blur(12px)" },
    transition: { duration: 0.75, ease: CINE },
  },
  // smooth, confident spring rise — the resolution
  solution: {
    initial: { opacity: 0, y: 58, scale: 0.95, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -32, filter: "blur(10px)" },
    transition: { type: "spring", stiffness: 88, damping: 15 },
  },
  // luminous iris-open for the magic moment
  "paid-stream": {
    initial: { opacity: 0, scale: 0.9, filter: "blur(24px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.05, filter: "blur(16px)" },
    transition: { duration: 1.0, ease: CINE },
  },
  // weighty settle from below
  receipt: {
    initial: { opacity: 0, y: 66, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -26, filter: "blur(10px)" },
    transition: { type: "spring", stiffness: 78, damping: 17 },
  },
  // gentle brand fade
  end: {
    initial: { opacity: 0, scale: 1.02, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(8px)" },
    transition: { duration: 0.9, ease: CINE },
  },
};

/* ------------------------------------------------------------------ */
/* DemoVideoPage — rAF engine + chrome                                 */
/* ------------------------------------------------------------------ */

export default function DemoVideoPage() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current scene
  const [minimal, setMinimal] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  const scene = SCENES[index].id;
  const isEnd = scene === "end";

  // Recording controls: hide chrome or seek to a deterministic frame.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMinimal(params.get("minimal") === "true");
    const requestedScene = params.get("scene") as SceneId | null;
    const requestedIndex = requestedScene ? SCENES.findIndex(({ id }) => id === requestedScene) : -1;
    const requestedProgress = Number(params.get("progress"));
    if (requestedIndex >= 0) setIndex(requestedIndex);
    if (Number.isFinite(requestedProgress)) setProgress(Math.max(0, Math.min(1, requestedProgress)));
    setPaused(params.get("paused") === "true");
    setReady(true);
  }, []);

  // rAF playback. Advances sequentially; holds on the final scene.
  const ms = SCENES[index].ms;
  useEffect(() => {
    if (!ready || paused) return;
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
  }, [index, ms, paused, ready]);

  return (
    <div className="dv-root">
      <DemoStyles />
      <AmbientBackground scene={scene} sceneIndex={index} />
      <div className="dv-vignette" aria-hidden="true" />

      <div className="dv-stage">
        {ready && <DemoStage scene={scene} progress={progress} />}

        {ready && !minimal && !isEnd && (
          <footer className="dv-bottombar">
            <ProgressRail scene={scene} onSelect={setIndex} />
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
  const cut = CUTS[scene];
  return (
    <div className="dv-spotlight">
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          className="dv-cut"
          initial={cut.initial}
          animate={cut.animate}
          exit={cut.exit}
          transition={cut.transition}
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
      return <SolutionScene progress={progress} />;
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
  scene,
  line,
  bg,
  children,
}: {
  scene: Exclude<SceneId, "end">;
  line: string;
  bg: string;
  children: React.ReactNode;
}) {
  const focalIntro = {
    problem: { delay: 1.35, initial: { opacity: 0, y: 16, scale: 0.985, filter: "blur(7px)" } },
    solution: { delay: 1.5, initial: { opacity: 0, y: 34, scale: 0.96, filter: "blur(9px)" } },
    "paid-stream": { delay: 1.65, initial: { opacity: 0, scale: 0.93, filter: "blur(15px)" } },
    receipt: { delay: 1.55, initial: { opacity: 0, y: 24, scale: 1.025, filter: "blur(10px)" } },
  }[scene];

  return (
    <section className="dv-scene">
      <span className="dv-scene-bg" aria-hidden="true">
        {bg}
      </span>

      <div className="dv-scene-head">
        <Headline text={line} scene={scene} />
      </div>

      <motion.div
        className="dv-scene-focal"
        initial={focalIntro.initial}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: scene === "paid-stream" ? 0.85 : 0.68, delay: focalIntro.delay, ease: CINE }}
      >
        {children}
      </motion.div>
    </section>
  );
}

/** Word-by-word blur-in headline (the reference's signature reveal). */
function Headline({ text, scene }: { text: string; scene: Exclude<SceneId, "end"> }) {
  const words = text.split(" ");
  const intro = {
    problem: { initial: { y: 12, x: 0, scale: 1 }, delay: 0.14, step: 0.038 },
    solution: { initial: { y: 22, x: 0, scale: 0.98 }, delay: 0.2, step: 0.05 },
    "paid-stream": { initial: { y: 0, x: 12, scale: 1 }, delay: 0.16, step: 0.042 },
    receipt: { initial: { y: 10, x: 0, scale: 0.95 }, delay: 0.22, step: 0.045 },
  }[scene];
  return (
    <h2 className="dv-mainline">
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="dv-mainline-word"
          initial={{ opacity: 0, ...intro.initial, filter: "blur(9px)" }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.58, ease: CINE, delay: intro.delay + i * intro.step }}
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
  const requests = [
    { n: "01", method: "GET", path: "/search?q=resale+fee", status: "200", note: "application/json", tone: "ok", delay: 1.75 },
    { n: "02", method: "GET", path: "/articles/resale-fees", status: "402", note: "payment_required", tone: "warn", delay: 2.4 },
    { n: "03", method: "POST", path: "/checkout", status: "401", note: "browser_session_required", tone: "error", delay: 3.05 },
  ];

  return (
    <SceneFrame scene="problem" bg="🧩" line="Agents can’t access paywalls, and open sources are often low quality.">
      <div className="dv-term">
        <div className="dv-term-bar">
          <span className="dv-term-dot dv-term-dot-r" />
          <span className="dv-term-dot dv-term-dot-y" />
          <span className="dv-term-dot dv-term-dot-g" />
          <span className="mono dv-term-name">buyer-agent — fetch</span>
        </div>
        <div className="dv-term-body mono">
          <div className="dv-term-cmd">
            <span className="dv-term-prompt">$</span>
            <span>
              <span className="dv-tok-fn">await fetch</span>(
              <span className="dv-tok-str">&quot;/articles/resale-fees&quot;</span>)
            </span>
          </div>

          {requests.map((request) => (
            <motion.div
              key={request.n}
              className={`dv-term-line dv-term-${request.tone}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.38, ease: CINE, delay: request.delay }}
            >
              <span className="dv-term-order">{request.n}</span>
              <span className="dv-term-method">{request.method}</span>
              <span className="dv-term-host">{request.path}</span>
              <span className="dv-term-status">{request.status}</span>
              <span className="dv-term-note">{request.note}</span>
            </motion.div>
          ))}

          <motion.div
            className="dv-term-fail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: CINE, delay: 3.72 }}
          >
            <span className="dv-term-x">✗</span> fetch() cannot complete an interactive subscription
            <span className="dv-term-cursor" aria-hidden="true" />
          </motion.div>
        </div>
      </div>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — Solution / publish                                        */
/* ------------------------------------------------------------------ */

function SolutionScene({ progress }: { progress: number }) {
  const step = progress >= 0.694 ? 3 : progress >= 0.456 ? 2 : progress >= 0.317 ? 1 : 0;
  const priced = progress >= 0.567;
  const published = progress >= 0.839;

  return (
    <SceneFrame scene="solution" bg="🔨" line="Creators publish once and choose their price per word.">
      <CreatorDashboardDemo step={step} priced={priced} published={published} />
    </SceneFrame>
  );
}

const CREATOR_STEPS = ["Add your article", "Review sections", "Choose pricing", "Publish"] as const;

function CreatorDashboardDemo({ step, priced, published }: { step: number; priced: boolean; published: boolean }) {
  return (
    <div className="dv-dashboard">
      <aside className="dv-dashboard-side">
        <div className="dv-dashboard-logo"><Waves size={17} /><strong>Rubicon</strong></div>
        <div className="dv-dashboard-new"><Plus size={13} /> New article</div>
        <div className="dv-dashboard-nav">
          <span><LayoutGrid size={13} /> Overview</span>
          <span className="is-active"><FileText size={13} /> Articles</span>
          <span><WalletCards size={13} /> Earnings</span>
          <span><Settings size={13} /> Settings</span>
        </div>
      </aside>

      <div className="dv-dashboard-main">
        <ol className="dv-dashboard-steps">
          {CREATOR_STEPS.map((label, index) => (
            <li key={label} className={`${index === step ? "is-active" : ""}${index < step || published ? " is-done" : ""}`}>
              <span className="mono">{index + 1}</span>{label}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          {published ? (
            <DashboardPublished key="published" />
          ) : (
            <motion.div
              key={step}
              className="dv-dashboard-panel"
              initial={{ opacity: 0, x: 24, filter: "blur(5px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -18, filter: "blur(4px)" }}
              transition={{ duration: 0.28, ease: CINE }}
            >
              {step === 0 && <DashboardArticleStep />}
              {step === 1 && <DashboardSectionsStep />}
              {step === 2 && <DashboardPricingStep priced={priced} />}
              {step === 3 && <DashboardReviewStep />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DashboardArticleStep() {
  return (
    <>
      <div className="dv-dashboard-fields">
        <DashboardField label="Article title" value={ARTICLE_TITLE} />
        <DashboardField label="Author" value="Mara Chen" />
      </div>
      <div className="dv-dashboard-editor">
        <div className="dv-dashboard-toolbar"><strong>H</strong><span>B</span><i>I</i><span>☷</span><span>❞</span><small>Each heading starts a new section</small></div>
        <div><strong>Consent Decree Language</strong><p>The resale fee applies only when the asset transfers through a covered venue…</p></div>
        <footer><span>3 sections</span><span className="mono">2,418 words</span></footer>
      </div>
      <DashboardButton label="Review sections" cursor cursorDelay={1.82} />
    </>
  );
}

function DashboardField({ label, value }: { label: string; value: string }) {
  return <div className="dv-dashboard-field"><span>{label}</span><strong>{value}</strong></div>;
}

function DashboardSectionsStep() {
  const sections = [["Market background", "842"], ["Consent Decree Language", "137"], ["Secondary-market mechanics", "1,439"]];
  return (
    <>
      <div className="dv-dashboard-title"><strong>Sections agents can navigate</strong><span>Seller agents route buyers without exposing unpaid text.</span></div>
      <div className="dv-section-list">
        {sections.map(([title, words], index) => (
          <motion.div key={title} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, ease: CINE }}>
            <span className="mono">0{index + 1}</span><strong>{title}</strong><small>{words} words</small><Check size={13} />
          </motion.div>
        ))}
      </div>
      <DashboardButton label="Choose pricing" cursor />
    </>
  );
}

function DashboardPricingStep({ priced }: { priced: boolean }) {
  return (
    <>
      <div className="dv-dashboard-title"><strong>Choose pricing</strong><span>Set what agents pay. You earn for exactly the words they read.</span></div>
      <div className="dv-dashboard-pricing">
        <div className={`dv-dashboard-price-input${priced ? " is-filled" : ""}`}>
          <span>Price per word</span>
          <div><small>$</small><strong className="mono">{priced ? "0.00005" : "0.0001"}</strong></div>
          {!priced && <DashboardCursor />}
        </div>
        <div className="dv-dashboard-preview">
          <span className="mono">Pricing preview</span>
          <div><small>Price per word</small><strong>{priced ? "$0.00005" : "$0.00"}</strong></div>
          <div><small>Estimated full article</small><strong>{priced ? "$0.1209" : "$0.00"}</strong></div>
          <div><small>Earnings for 1,000 words</small><strong>{priced ? "$0.0500" : "$0.00"}</strong></div>
          <div><small>Rubicon platform fee</small><strong>0%</strong></div>
        </div>
      </div>
      {priced && <DashboardButton label="Review" cursor />}
    </>
  );
}

function DashboardReviewStep() {
  return (
    <>
      <div className="dv-dashboard-title"><strong>Review and publish</strong><span>Confirm the creator listing before it goes live to agents.</span></div>
      <div className="dv-dashboard-review">
        <div><span>Article</span><strong>{ARTICLE_TITLE}</strong></div>
        <div><span>Sections</span><strong>3 · 2,418 words</strong></div>
        <div><span>Price per word</span><strong>$0.00005 USDC</strong></div>
        <div><span>Receiving wallet</span><strong className="mono">0x8f2…91c ✓</strong></div>
      </div>
      <DashboardButton label="Publish article" cursor />
    </>
  );
}

function DashboardPublished() {
  return (
    <motion.div className="dv-dashboard-published" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 190, damping: 18 }}>
      <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 16 }}><Check size={24} /></motion.span>
      <strong>Article published</strong>
      <p>3 navigable sections · $0.00005 per word · Live to agents</p>
    </motion.div>
  );
}

function DashboardButton({ label, cursor, cursorDelay = 0 }: { label: string; cursor?: boolean; cursorDelay?: number }) {
  return <div className="dv-dashboard-button">{label}<ArrowRight size={13} />{cursor && <DashboardCursor delay={cursorDelay} />}</div>;
}

function DashboardCursor({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="dv-dashboard-cursor"
      aria-hidden="true"
      initial={{ opacity: 0, x: 30, y: -20, scale: 1 }}
      animate={{ opacity: [0, 1, 1, 1], x: [30, 0, 0, 0], y: [-20, 0, 0, 0], scale: [1, 1, 0.84, 1] }}
      transition={{ duration: 0.82, delay, ease: CINE, times: [0, 0.58, 0.78, 1] }}
    >
      <MousePointer2 size={20} fill="currentColor" />
      <span />
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — Seller guides + paid word stream — the magic moment        */
/* ------------------------------------------------------------------ */

function PaidStreamScene({ progress }: { progress: number }) {
  const sellerReplied = progress >= 0.28;
  const sessionOpened = progress >= 0.39;
  const streaming = progress >= 0.46;
  const revealFrac = Math.max(0, Math.min(1, (progress - 0.46) / 0.36));
  const revealed = Math.round(STREAM_WORDS.length * revealFrac);
  const wordsRead = Math.round(TARGET_WORDS * revealFrac);
  const spent = TARGET_SPEND * revealFrac;
  const stopped = progress >= 0.86;

  return (
    <SceneFrame scene="paid-stream" bg="🌊" line="Seller agents guide buyers to the right section without exposing the full article.">
      <GlowCard
        glow="strong"
        head={
          <CardHead
            title="Rubicon"
            pill={stopped ? <Pill tone="green">Stopped</Pill> : <Pill tone="river" live>{streaming ? "Streaming" : "Routing"}</Pill>}
          />
        }
      >
        <div className="dv-convo">
          <motion.div
            className="dv-convo-row dv-convo-buyer"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: CINE, delay: 0.15 }}
          >
            <span className="dv-convo-icon"><Search size={13} /></span>
            <div><span className="mono dv-convo-name">Buyer agent</span><p>When do resale fees apply, and who remains liable?</p></div>
          </motion.div>
          <AnimatePresence>
            {sellerReplied && (
              <motion.div
                key="seller-reply"
                className="dv-convo-row dv-convo-seller"
                initial={{ opacity: 0, x: 12, filter: "blur(3px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.42, ease: CINE }}
              >
                <span className="dv-convo-icon"><Waves size={13} /></span>
                <div><span className="mono dv-convo-name">Seller agent</span><p>Opening “Consent Decree Language.” I’ll stream only that section.</p></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="dv-guide-strip">
          <span className="mono dv-guide-from">POST /v1/sessions</span>
          <span className="dv-guide-text">
            {sessionOpened ? <><strong className="dv-session-created">201 Created</strong> · session_7f2a · hard cap <span className="dv-highlight">$0.0200</span></> : "Waiting for route, then opening a capped session…"}
          </span>
        </div>

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
            {sessionOpened && !stopped && <span className="dv-caret" aria-hidden="true" />}
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
  const [batched, setBatched] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  useEffect(() => {
    const batchTimer = window.setTimeout(() => setBatched(true), 2300);
    const withdrawTimer = window.setTimeout(() => setWithdrawn(true), 3650);
    return () => {
      window.clearTimeout(batchTimer);
      window.clearTimeout(withdrawTimer);
    };
  }, []);

  const earned = useCountUp(TARGET_SPEND, withdrawn, 900);

  return (
    <SceneFrame scene="receipt" bg="🧾" line="Every session produces a verifiable receipt, withdrawable onchain via Circle nanopayments.">
      <div className="dv-settle-card">
        <div className="dv-settle-head">
          <div>
            <span className="mono dv-settle-kicker">SESSION_7F2A</span>
            <strong>Usage becomes withdrawable USDC</strong>
          </div>
          <Pill tone={withdrawn ? "green" : "river"} live={!withdrawn}>{withdrawn ? "Onchain" : "Settling"}</Pill>
        </div>

        <div className="dv-settle-flow">
          <SettlementNode
            active
            icon={<ShieldCheck size={18} />}
            label="Signed receipt"
            value="137 words"
            meta="sha256: 91b7…e42c"
          />
          <SettlementRail active={batched} amount="$0.0068" />
          <SettlementNode
            active={batched}
            icon={<CircleDollarSign size={18} />}
            label="Circle Nanopayments"
            value="Balance ready"
            meta="usage verified"
          />
          <SettlementRail active={withdrawn} amount="USDC" />
          <SettlementNode
            active={withdrawn}
            icon={<ArrowDownToLine size={18} />}
            label="Creator wallet"
            value={`+$${earned.toFixed(4)}`}
            meta="Arc · 0x71c…9e4"
            success
          />
        </div>

        <AnimatePresence>
          {withdrawn && (
            <motion.div
              className="dv-chain-confirm mono"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              <span className="dv-chain-check"><Check size={14} /></span>
              <span><strong>Withdrawal confirmed</strong><small>Final on Arc · unused cap never left the buyer</small></span>
              <span className="dv-chain-block">#18,492,771</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SceneFrame>
  );
}

function SettlementNode({ active, icon, label, value, meta, success }: { active: boolean; icon: React.ReactNode; label: string; value: string; meta: string; success?: boolean }) {
  return (
    <motion.div
      className={`dv-settle-node${active ? " is-active" : ""}${success ? " is-success" : ""}`}
      animate={{ opacity: active ? 1 : 0.3, y: active ? 0 : 7 }}
      transition={{ duration: 0.4, ease: CINE }}
    >
      <span className="dv-settle-node-icon">{icon}</span>
      <span className="mono dv-settle-node-label">{label}</span>
      <strong className="mono dv-settle-node-value">{value}</strong>
      <span className="mono dv-settle-node-meta">{meta}</span>
    </motion.div>
  );
}

function SettlementRail({ active, amount }: { active: boolean; amount: string }) {
  return (
    <div className={`dv-settle-rail${active ? " is-active" : ""}`} aria-hidden="true">
      <motion.span className="dv-settle-rail-fill" animate={{ scaleX: active ? 1 : 0 }} transition={{ duration: 0.55, ease: CINE }} />
      <AnimatePresence>
        {active && (
          <motion.div
            className="dv-settle-packet mono"
            initial={{ left: "0%", opacity: 0, scale: 0.92 }}
            animate={{ left: "100%", opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 0.95, ease: CINE, times: [0, 0.18, 0.78, 1] }}
          >
            {amount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      {/* <motion.span
        className="dv-end-cta"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: CINE, delay: 0.7 }}
      >
        Rubicon
      </motion.span> */}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressRail                                                        */
/* ------------------------------------------------------------------ */

function ProgressRail({ scene, onSelect }: { scene: SceneId; onSelect: (index: number) => void }) {
  const current = beatOf[scene];
  return (
    <div className="dv-rail">
      {BEATS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Jump to ${label}`}
          aria-current={i === current ? "step" : undefined}
          className={`dv-beat${i === current ? " is-on" : ""}${i < current ? " is-done" : ""}`}
        >
          <span className="dv-beat-dot" aria-hidden="true" />
          <span className="dv-beat-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ambient atmosphere — drifting glow that tracks the scene            */
/* ------------------------------------------------------------------ */

function AmbientBackground({ scene, sceneIndex }: { scene: SceneId; sceneIndex: number }) {
  const reduce = useReducedMotion();
  const x = 28 + (sceneIndex % 4) * 15;
  const tone = TONE[scene];
  return (
    <div className="dv-ambient" aria-hidden="true">
      <div className="dv-ambient-base" />
      <motion.div
        className="dv-ambient-glow"
        animate={
          reduce
            ? { left: `${x}%`, backgroundColor: tone.glow }
            : { left: `${x}%`, backgroundColor: tone.glow, opacity: [0.42, 0.64, 0.42], scale: [1, 1.12, 1] }
        }
        transition={{
          left: { duration: 1.6, ease: CINE },
          backgroundColor: { duration: 1.4, ease: CINE },
          opacity: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 9, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="dv-ambient-glow2"
        animate={
          reduce
            ? { backgroundColor: tone.glow2 }
            : { backgroundColor: tone.glow2, y: [0, 58, 0], opacity: [0.24, 0.44, 0.24] }
        }
        transition={{
          backgroundColor: { duration: 1.4, ease: CINE },
          y: { duration: 13, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 13, repeat: Infinity, ease: "easeInOut" },
        }}
      />
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
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: CINE, delay }}
    >
      <div className={`dv-card${compact ? " dv-card-compact" : ""}${glow === "strong" ? " dv-card-glow" : ""}`}>
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
        background: var(--background);
        color: var(--ink);
        font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
      }

      /* ---- ambient atmosphere (matches the landing aurora) ---- */
      .dv-ambient { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
      .dv-ambient-base { position: absolute; inset: 0; background: radial-gradient(100% 68% at 50% -10%, rgba(37,80,117,0.28), transparent 60%); }
      .dv-ambient-glow { position: absolute; top: 20%; width: 72vh; height: 72vh; margin-left: -36vh; border-radius: 50%; background: rgba(63,112,152,0.16); filter: blur(150px); }
      .dv-ambient-glow2 { position: absolute; top: 0; right: 6%; width: 60vh; height: 60vh; border-radius: 50%; background: rgba(63,112,152,0.12); filter: blur(150px); }
      .dv-ambient-fade { position: absolute; inset: auto 0 0 0; height: 50%; background: linear-gradient(to top, var(--background), transparent); }
      .dv-vignette {
        position: absolute; inset: 0; z-index: 1; pointer-events: none;
        background: radial-gradient(120% 120% at 50% 45%, transparent 58%, rgba(8,9,13,0.42) 100%);
      }

      .dv-stage {
        position: relative; z-index: 2;
        display: flex; flex-direction: column;
        width: min(1280px, 100%); height: 100%;
        margin-inline: auto;
        padding: clamp(18px, 3vh, 36px) clamp(24px, 4vw, 72px);
        gap: clamp(12px, 2vh, 22px);
        justify-content: center;
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
      .dv-scene-head { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .dv-mainline {
        max-width: 20ch; display: flex; flex-wrap: wrap; justify-content: center; gap: 0 0.3em;
        font-size: clamp(1.5rem, 3vw, 2.65rem); font-weight: 780; letter-spacing: -0.03em; line-height: 1.06; color: var(--ink);
      }
      .dv-mainline-word { display: inline-block; }

      .dv-scene-focal { position: relative; z-index: 2; width: 100%; max-width: 720px; display: flex; justify-content: center; }

      /* ---- card (flat: no border, no shadow — defined by fill only) ---- */
      .dv-card-wrap { position: relative; width: 100%; }
      .dv-card {
        position: relative; overflow: hidden;
        border: 0; border-radius: var(--radius-xl);
        background: #16181d;
      }
      .dv-card-glow { background: linear-gradient(180deg, rgba(47,128,237,0.10), #16181d 58%); }
      .dv-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 22px 4px; }
      .dv-card-title { font-size: 1rem; font-weight: 700; letter-spacing: -0.01em; }
      .dv-card-body { padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 14px; }
      .dv-card-compact .dv-card-body { padding: 14px 18px 18px; gap: 10px; }

      /* ---- pills (flat fill, no border) ---- */
      .dv-pill { display: inline-flex; align-items: center; gap: 6px; flex: none; padding: 4px 10px; border-radius: 999px; font-family: var(--font-mono), monospace; font-size: 0.6rem; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600; }
      .dv-pill-dot { width: 6px; height: 6px; border-radius: 50%; }
      .dv-pill-river { color: var(--river-deep); background: rgba(47,128,237,0.14); }
      .dv-pill-river .dv-pill-dot { background: var(--river-deep); }
      .dv-pill-amber { color: var(--amber); background: rgba(224,183,109,0.14); }
      .dv-pill-amber .dv-pill-dot { background: var(--amber); }
      .dv-pill-green { color: var(--green); background: rgba(88,213,155,0.14); }
      .dv-pill-green .dv-pill-dot { background: var(--green); }
      .dv-pill-red { color: var(--red); background: rgba(240,120,120,0.14); }
      .dv-pill-red .dv-pill-dot { background: var(--red); }
      .dv-pill-muted { color: var(--quiet); background: rgba(255,255,255,0.05); }
      .dv-pill-muted .dv-pill-dot { background: var(--quiet); }

      /* ---- note + guidance strip ---- */
      .dv-note { font-size: 0.9rem; color: var(--quiet); }
      .dv-highlight { color: var(--river-deep); font-weight: 600; }
      .dv-guide-strip { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; border-radius: 12px; background: rgba(47,128,237,0.1); padding: 12px 15px; }
      .dv-guide-from { font-size: 0.56rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--river-deep); white-space: nowrap; }
      .dv-guide-text { font-size: 0.86rem; color: var(--muted); }
      .dv-session-created { color: var(--green); font-weight: 700; }
      .dv-convo { display: grid; gap: 7px; min-height: 95px; }
      .dv-convo-row { display: flex; align-items: flex-start; gap: 9px; width: min(88%, 540px); padding: 9px 12px; border-radius: 12px; background: rgba(255,255,255,0.035); }
      .dv-convo-seller { justify-self: end; background: rgba(47,128,237,0.1); }
      .dv-convo-icon { display: grid; place-items: center; flex: none; width: 23px; height: 23px; border-radius: 7px; color: var(--river-deep); background: rgba(47,128,237,0.12); }
      .dv-convo-name { display: block; margin-bottom: 2px; color: var(--quiet); font-size: 0.52rem; letter-spacing: 0.08em; text-transform: uppercase; }
      .dv-convo-row p { color: var(--muted); font-size: 0.76rem; line-height: 1.4; }

      /* ---- terminal (problem) ---- */
      .dv-term { width: 100%; border-radius: 14px; overflow: hidden; background: #14161b; }
      .dv-term-bar { display: flex; align-items: center; gap: 7px; padding: 12px 15px; background: rgba(255,255,255,0.035); }
      .dv-term-dot { width: 11px; height: 11px; border-radius: 50%; }
      .dv-term-dot-r { background: #f58bb2; }
      .dv-term-dot-y { background: #f2d18f; }
      .dv-term-dot-g { background: #8fdc9b; }
      .dv-term-name { margin-left: 9px; font-size: 0.7rem; color: var(--quiet); }
      .dv-term-body { padding: 18px 20px; font-size: 0.95rem; line-height: 2; }
      .dv-term-cmd { display: flex; gap: 9px; color: var(--ink); margin-bottom: 6px; }
      .dv-term-prompt { color: var(--green); }
      .dv-tok-fn { color: var(--river-deep); }
      .dv-tok-str { color: #e0b76d; }
      .dv-term-line { display: grid; grid-template-columns: auto auto 1fr auto auto; align-items: center; gap: 13px; }
      .dv-term-order { color: var(--quiet); font-size: 0.7rem; }
      .dv-term-method { font-size: 0.82rem; color: var(--quiet); }
      .dv-term-host { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dv-term-status { font-weight: 700; font-variant-numeric: tabular-nums; }
      .dv-term-note { font-size: 0.84rem; }
      .dv-status-amber { color: var(--amber); }
      .dv-status-muted { color: var(--quiet); }
      .dv-status-red { color: var(--red); }
      .dv-term-ok .dv-term-status, .dv-term-ok .dv-term-note { color: var(--green); }
      .dv-term-warn .dv-term-status, .dv-term-warn .dv-term-note { color: var(--amber); }
      .dv-term-error .dv-term-status, .dv-term-error .dv-term-note { color: var(--red); }
      .dv-term-stomp { margin: 0 -9px; padding: 3px 9px; border-radius: 9px; transform-origin: center; }
      .dv-term-stomp .dv-term-host { color: var(--ink); }
      .dv-term-fail { display: flex; align-items: center; gap: 9px; margin-top: 6px; color: var(--red); }
      .dv-term-x { font-weight: 700; }
      .dv-term-cursor { display: inline-block; width: 8px; height: 1.05em; vertical-align: text-bottom; background: var(--river-deep); animation: dv-blink 1s steps(2) infinite; }

      /* ---- compressed creator dashboard ---- */
      .dv-dashboard { position: relative; display: grid; grid-template-columns: 132px minmax(0, 1fr); width: 100%; height: 390px; overflow: hidden; border-radius: 20px; color: #202127; background: #fff; box-shadow: 0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(119,157,230,0.24); }
      .dv-dashboard-side { display: flex; flex-direction: column; padding: 17px 12px; border-right: 1px solid #e7e9ee; background: #fff; }
      .dv-dashboard-logo { display: flex; align-items: center; gap: 7px; padding: 0 7px; font-size: 0.78rem; }
      .dv-dashboard-logo svg { color: #3c82f6; }
      .dv-dashboard-new { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 21px; padding: 10px 9px; border-radius: 999px; color: white; background: #24242b; font-size: 0.62rem; font-weight: 700; }
      .dv-dashboard-nav { display: grid; gap: 5px; margin-top: 23px; }
      .dv-dashboard-nav span { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 999px; color: #555963; font-size: 0.62rem; }
      .dv-dashboard-nav .is-active { color: #1f2733; background: #eaf1ff; }
      .dv-dashboard-main { min-width: 0; padding: 18px; background: radial-gradient(circle at 74% 5%, #eaf1ff, #f7f9fd 52%, #fff 100%); }
      .dv-dashboard-steps { display: flex; gap: 6px; height: 28px; }
      .dv-dashboard-steps li { display: flex; align-items: center; gap: 5px; padding: 6px 9px; border-radius: 999px; color: #82858e; background: white; box-shadow: 0 0 0 1px #e2e5eb; font-size: 0.54rem; white-space: nowrap; transition: color 180ms ease, background-color 180ms ease, box-shadow 180ms ease; }
      .dv-dashboard-steps li.is-active { color: #2f75e9; background: #e7efff; box-shadow: 0 0 0 1px #4789f6; }
      .dv-dashboard-steps li.is-done { color: #23734f; background: #eaf8f1; box-shadow: 0 0 0 1px #5ab98a; }
      .dv-dashboard-panel { position: relative; height: 311px; margin-top: 14px; padding: 17px; overflow: hidden; border-radius: 15px; background: rgba(255,255,255,0.94); box-shadow: 0 0 0 1px #d8e4fb; }
      .dv-dashboard-fields { display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 9px; }
      .dv-dashboard-field { display: grid; gap: 5px; }
      .dv-dashboard-field span, .dv-dashboard-title span { color: #787c86; font-size: 0.56rem; }
      .dv-dashboard-field strong { padding: 9px 11px; border-radius: 8px; color: #2a2b31; background: #f5f6f8; font-size: 0.65rem; font-weight: 600; }
      .dv-dashboard-editor { margin-top: 10px; overflow: hidden; border-radius: 11px; background: #f1f4fc; box-shadow: inset 0 0 0 1px #dfe3ea; }
      .dv-dashboard-toolbar { display: flex; align-items: center; gap: 13px; height: 31px; padding: 0 10px; color: #747984; background: white; font-size: 0.61rem; }
      .dv-dashboard-toolbar small { margin-left: auto; font-size: 0.48rem; }
      .dv-dashboard-editor > div:nth-child(2) { height: 72px; margin: 11px; padding: 10px; border-radius: 9px; color: #2d3037; background: white; }
      .dv-dashboard-editor > div:nth-child(2) strong { font-family: ui-serif, Georgia, serif; font-size: 0.68rem; }
      .dv-dashboard-editor > div:nth-child(2) p { margin-top: 5px; color: #7c808a; font-family: ui-serif, Georgia, serif; font-size: 0.57rem; line-height: 1.45; }
      .dv-dashboard-editor footer { display: flex; justify-content: space-between; padding: 6px 11px; color: #858993; background: white; font-size: 0.49rem; }
      .dv-dashboard-button { position: absolute; right: 17px; bottom: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 13px; overflow: visible; border-radius: 999px; color: white; background: #25262c; font-size: 0.59rem; font-weight: 700; }
      .dv-dashboard-cursor { position: absolute; z-index: 10; right: 10px; top: 55%; width: 20px; height: 20px; color: #11151c; filter: drop-shadow(0 1px 2px rgba(255,255,255,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.25)); }
      .dv-dashboard-button .dv-dashboard-cursor { color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55)); }
      .dv-dashboard-cursor > span { position: absolute; inset: -5px; border: 1px solid rgba(47,128,237,0.7); border-radius: 50%; animation: dv-cursor-pulse 700ms ease-out infinite; }
      @keyframes dv-cursor-pulse { to { transform: scale(1.55); opacity: 0; } }
      .dv-dashboard-title { display: grid; gap: 4px; }
      .dv-dashboard-title strong { font-size: 0.78rem; }
      .dv-section-list { display: grid; gap: 7px; margin-top: 13px; }
      .dv-section-list > div { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 9px; padding: 10px 11px; border-radius: 9px; color: #303139; background: #f3f5f8; }
      .dv-section-list span { color: #8b8f98; font-size: 0.49rem; }
      .dv-section-list strong { font-size: 0.63rem; }
      .dv-section-list small { color: #7e828c; font-size: 0.5rem; }
      .dv-section-list svg { color: #3ba271; }
      .dv-dashboard-pricing { display: grid; grid-template-columns: 1fr 0.75fr; gap: 12px; margin-top: 13px; }
      .dv-dashboard-price-input { position: relative; align-self: start; display: grid; gap: 7px; }
      .dv-dashboard-price-input > span { font-size: 0.58rem; font-weight: 650; }
      .dv-dashboard-price-input > div { display: flex; align-items: center; gap: 8px; height: 72px; padding: 0 14px; border-radius: 11px; color: #9599a2; background: #f5f6f8; box-shadow: inset 0 0 0 1px #e1e4ea; }
      .dv-dashboard-price-input.is-filled > div { color: #25272d; background: #fff; box-shadow: inset 0 0 0 2px #4b8cf5, 0 8px 24px rgba(75,140,245,0.1); }
      .dv-dashboard-price-input strong { font-size: 0.85rem; }
      .dv-dashboard-preview { padding: 11px; border-radius: 11px; background: #f1f4fc; }
      .dv-dashboard-preview > span { display: block; margin-bottom: 7px; color: #858996; font-size: 0.48rem; letter-spacing: 0.12em; text-transform: uppercase; }
      .dv-dashboard-preview > div { display: flex; justify-content: space-between; gap: 8px; padding: 6px 0; border-top: 1px solid #dfe3ec; }
      .dv-dashboard-preview small { color: #7e828c; font-size: 0.47rem; }
      .dv-dashboard-preview strong { font-size: 0.52rem; }
      .dv-dashboard-review { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 13px; }
      .dv-dashboard-review > div { display: grid; gap: 5px; min-height: 66px; padding: 10px; border-radius: 9px; background: #f3f5f8; }
      .dv-dashboard-review span { color: #838792; font-size: 0.49rem; }
      .dv-dashboard-review strong { font-size: 0.61rem; line-height: 1.35; }
      .dv-dashboard-published { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 311px; margin-top: 14px; border-radius: 15px; text-align: center; background: linear-gradient(145deg, #fff, #effbf5); box-shadow: 0 0 0 1px #a8dfc4, 0 18px 50px rgba(59,162,113,0.13); }
      .dv-dashboard-published > span { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 50%; color: white; background: #3ba271; box-shadow: 0 12px 30px rgba(59,162,113,0.25); }
      .dv-dashboard-published strong { margin-top: 14px; font-size: 1rem; }
      .dv-dashboard-published p { margin-top: 6px; color: #6d756f; font-size: 0.6rem; }

      /* ---- paid stream (flat tiles, no border) ---- */
      .dv-meters { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      .dv-meter { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.03); }
      .dv-meter-label { font-size: 0.56rem; letter-spacing: 0.07em; text-transform: uppercase; color: var(--quiet); }
      .dv-big-number { font-size: clamp(1.55rem, 2.6vw, 2.05rem); font-weight: 760; letter-spacing: -0.02em; color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1; }
      .dv-big-muted { color: var(--quiet); }
      .dv-big-green { color: var(--green); }
      .dv-stream-body { border-radius: 14px; background: rgba(47,128,237,0.07); padding: 18px 20px; min-height: 140px; }
      .dv-stream-text { font-size: 1.08rem; line-height: 1.85; font-family: ui-serif, Georgia, "Times New Roman", serif; }
      .dv-word { color: rgba(162,165,173,0.18); transition: color 360ms var(--ease-out, ease), background-color 360ms ease; }
      .dv-word-on { color: var(--ink); }
      .dv-word-edge { color: var(--river-deep); background: rgba(47,128,237,0.18); border-radius: 4px; padding: 0 2px; }
      .dv-caret { display: inline-block; width: 8px; height: 1.05em; vertical-align: text-bottom; margin-left: 1px; background: var(--river-deep); border-radius: 1px; animation: dv-blink 1s steps(2) infinite; }
      @keyframes dv-blink { 50% { opacity: 0; } }
      .dv-stop-chip { display: inline-flex; align-items: center; align-self: flex-start; font-size: 0.86rem; font-weight: 650; color: var(--green); padding: 8px 14px; border-radius: 999px; background: rgba(88,213,155,0.12); }

      /* ---- settlement journey ---- */
      .dv-settle-card { width: 100%; padding: 20px; border-radius: 20px; overflow: hidden; background: linear-gradient(155deg, rgba(47,128,237,0.12), rgba(22,24,29,0.98) 46%, rgba(88,213,155,0.07)); }
      .dv-settle-head { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-bottom: 18px; }
      .dv-settle-head > div { display: flex; flex-direction: column; gap: 4px; }
      .dv-settle-kicker { color: var(--river-deep); font-size: 0.55rem; letter-spacing: 0.11em; }
      .dv-settle-head strong { font-size: 0.96rem; }
      .dv-settle-flow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(52px, 0.42fr) minmax(0, 1fr) minmax(52px, 0.42fr) minmax(0, 1fr); align-items: center; }
      .dv-settle-node { position: relative; display: flex; flex-direction: column; min-height: 158px; padding: 17px; border-radius: 16px; background: rgba(255,255,255,0.035); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); }
      .dv-settle-node.is-active { box-shadow: inset 0 0 0 1px rgba(110,165,255,0.17), 0 14px 34px rgba(0,0,0,0.16); }
      .dv-settle-node.is-success { background: rgba(88,213,155,0.09); box-shadow: inset 0 0 0 1px rgba(88,213,155,0.2), 0 0 36px rgba(88,213,155,0.08); }
      .dv-settle-node-icon { display: grid; place-items: center; width: 34px; height: 34px; margin-bottom: 18px; border-radius: 10px; color: var(--river-deep); background: rgba(47,128,237,0.12); }
      .dv-settle-node.is-success .dv-settle-node-icon { color: var(--green); background: rgba(88,213,155,0.13); }
      .dv-settle-node-label { color: var(--quiet); font-size: 0.53rem; letter-spacing: 0.07em; text-transform: uppercase; }
      .dv-settle-node-value { margin-top: 6px; color: var(--ink); font-size: 0.95rem; font-variant-numeric: tabular-nums; }
      .dv-settle-node.is-success .dv-settle-node-value { color: var(--green); font-size: 1.2rem; }
      .dv-settle-node-meta { margin-top: auto; color: var(--quiet); font-size: 0.55rem; }
      .dv-settle-rail { position: relative; height: 2px; background: rgba(255,255,255,0.07); }
      .dv-settle-rail-fill { position: absolute; inset: 0; transform-origin: left center; background: linear-gradient(90deg, var(--river), var(--green)); }
      .dv-settle-packet { position: absolute; top: 50%; z-index: 2; min-width: 50px; padding: 4px 7px; border-radius: 999px; transform: translate(-50%, -50%); text-align: center; color: var(--green); background: #20342e; font-size: 0.52rem; box-shadow: 0 0 18px rgba(88,213,155,0.2); }
      .dv-chain-confirm { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 11px; margin-top: 14px; padding: 11px 13px; border-radius: 12px; color: var(--green); background: rgba(88,213,155,0.09); }
      .dv-chain-check { display: grid; place-items: center; width: 25px; height: 25px; border-radius: 50%; color: #0d1915; background: var(--green); }
      .dv-chain-confirm span:nth-child(2) { display: flex; flex-direction: column; gap: 2px; }
      .dv-chain-confirm strong { font-size: 0.68rem; }
      .dv-chain-confirm small { color: var(--quiet); font-size: 0.55rem; }
      .dv-chain-block { color: var(--muted); font-size: 0.58rem; }

      /* ---- end card ---- */
      .dv-end { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 640px; gap: 16px; }
      .dv-end-burst { position: absolute; top: -40px; left: 50%; width: 280px; height: 280px; margin-left: -140px; border-radius: 50%; background: rgba(47,128,237,0.25); filter: blur(100px); pointer-events: none; }
      .dv-end-mark { position: relative; display: inline-flex; align-items: center; gap: 12px; font-size: 1.6rem; font-weight: 760; letter-spacing: -0.03em; }
      .dv-end-title { position: relative; font-size: clamp(2.1rem, 4.6vw, 3.6rem); font-weight: 790; letter-spacing: -0.04em; line-height: 1.04; max-width: 15ch; }
      .dv-end-sub { position: relative; font-size: clamp(0.95rem, 1.5vw, 1.15rem); line-height: 1.6; color: var(--muted); max-width: 44ch; }
      .dv-end-cta { position: relative; margin-top: 8px; display: inline-flex; align-items: center; padding: 12px 28px; border-radius: 999px; background: var(--river); color: #fff; font-weight: 700; letter-spacing: -0.01em; }

      /* ---- bottom rail ---- */
      .dv-bottombar { display: flex; align-items: center; justify-content: center; min-height: 28px; }
      .dv-rail { display: flex; align-items: center; gap: clamp(12px, 1.8vw, 26px); flex-wrap: wrap; justify-content: center; }
      .dv-beat { display: inline-flex; align-items: center; gap: 7px; opacity: 0.38; background: none; border: 0; padding: 5px 5px; font: inherit; border-radius: 8px; cursor: pointer; transition: opacity 300ms ease; }
      .dv-beat:hover { opacity: 0.85; }
      .dv-beat:focus-visible { outline: 2px solid var(--river-deep); outline-offset: 2px; }
      .dv-beat.is-on, .dv-beat.is-done { opacity: 1; }
      .dv-beat-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--quiet); transition: background-color 450ms ease; }
      .dv-beat.is-done .dv-beat-dot { background: var(--river-deep); }
      .dv-beat.is-on .dv-beat-dot { background: var(--river-deep); }
      .dv-beat-label { font-size: 0.68rem; font-weight: 600; color: var(--muted); }
      .dv-beat.is-on .dv-beat-label { color: var(--ink); }

      @media (max-width: 720px) {
        .dv-settle-flow { grid-template-columns: 1fr; gap: 8px; }
        .dv-settle-rail { width: 2px; height: 18px; justify-self: center; }
        .dv-settle-node { min-height: 110px; }
        .dv-chain-block { display: none; }
        .dv-dashboard { grid-template-columns: 1fr; }
        .dv-dashboard-side { display: none; }
        .dv-dashboard-main { padding: 12px; }
        .dv-dashboard-steps li { padding-inline: 7px; }
        .dv-dashboard-steps li { font-size: 0; }
        .dv-dashboard-steps li span { font-size: 0.54rem; }
        .dv-rail { display: none; }
        .dv-scene-bg { font-size: 58vw; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dv-caret { animation: none !important; }
      }
    `}</style>
  );
}
