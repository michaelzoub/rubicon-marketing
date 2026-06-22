"use client";

/**
 * /demo-video: a deterministic, scripted product demo built to be
 * screen-recorded.
 *
 * Direction: a cinematic "spotlight stage". Each scene narrates in strict
 * sequence. A full-stage text card reveals, holds, then leaves, and ONLY THEN
 * does the UI for that beat appear. Text and product are never on screen at the
 * same time, so the viewer reads one sentence, then watches one thing. A
 * camera-style push-in + light sweep fires on every cut. No backend, auth,
 * wallet, or env vars: a rAF engine drives a fixed timeline and exposes a
 * per-scene `progress` that each scene slices into its own segments.
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
  ArrowRight,
  Bot,
  Boxes,
  Check,
  FileText,
  LayoutGrid,
  MousePointer2,
  PenLine,
  Plus,
  Search,
  Settings,
  Unlink,
  Volume2,
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
  { id: "problem", ms: 12500 },
  { id: "solution", ms: 20800 },
  { id: "paid-stream", ms: 15600 },
  { id: "receipt", ms: 9600 },
  { id: "end", ms: 3800 },
];

/* Cinematic easing with long, confident deceleration. */
const CINE = [0.16, 1, 0.3, 1] as const;

const TARGET_SPEND = 0.0068;
const TARGET_WORDS = 137;
const BUDGET_CAP = 0.02;

const ARTICLE_TITLE = "The Hidden Economics of Resale Fees";

const STREAM_TEXT =
  "The resale fee applies only when the asset transfers through a secondary-market venue covered by the original agreement. It is assessed against the realized sale price, not the appraised value, and the seller of record remains liable until settlement clears.";
const STREAM_WORDS = STREAM_TEXT.split(" ");
const STREAM_VISIBLE_WORDS = STREAM_WORDS.slice(0, 18);

const BEATS = ["Problem", "Solution", "Stream", "Settle"] as const;

type DemoSound = "slide-soft" | "slide-deep" | "slide-reverse" | "click" | "confirm";
let demoSoundEnabled = false;
const demoSoundUrls = new Map<DemoSound, string>();
const activeDemoAudio = new Set<HTMLAudioElement>();
let slideSoundIndex = 0;

function playSlideSound() {
  const variants: DemoSound[] = ["slide-soft", "slide-deep", "slide-reverse"];
  const variant = variants[slideSoundIndex % variants.length];
  slideSoundIndex += 1;
  return playDemoSound(variant);
}

function createDemoSoundUrl(kind: DemoSound) {
  const cached = demoSoundUrls.get(kind);
  if (cached) return cached;

  const sampleRate = 32000;
  const isSlide = kind.startsWith("slide-");
  const duration = kind === "click" ? 0.16 : kind === "slide-soft" ? 0.5 : isSlide ? 0.64 : 1.05;
  const sampleCount = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));

  write(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  let noiseSeed = kind === "slide-soft" ? 0x1a2b3c4d : kind === "slide-deep" ? 0x13579bdf : kind === "slide-reverse" ? 0x2468ace0 : kind === "click" ? 0x31415926 : 0x27182818;
  let fastNoise = 0;
  let slowNoise = 0;
  let lowPhase = 0;
  const noise = () => {
    noiseSeed ^= noiseSeed << 13;
    noiseSeed ^= noiseSeed >>> 17;
    noiseSeed ^= noiseSeed << 5;
    return ((noiseSeed >>> 0) / 0xffffffff) * 2 - 1;
  };

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const progress = time / duration;
    const attack = Math.min(1, time / (kind === "click" ? 0.006 : 0.045));
    const release = Math.min(1, (duration - time) / (kind === "click" ? 0.055 : isSlide ? 0.2 : 0.24));
    const envelope = attack * release;
    const whiteNoise = noise();
    const fastAmount = isSlide ? (kind === "slide-reverse" ? 0.2 - progress * 0.15 : 0.045 + progress * (kind === "slide-deep" ? 0.1 : 0.16)) : 0.12;
    fastNoise += (whiteNoise - fastNoise) * fastAmount;
    slowNoise += (whiteNoise - slowNoise) * 0.012;
    const shapedNoise = fastNoise - slowNoise;
    let sample = 0;

    if (isSlide) {
      const movement = Math.pow(Math.sin(Math.PI * progress), 0.72);
      const lowFrequency = kind === "slide-deep" ? 52 + progress * 14 : kind === "slide-reverse" ? 94 - progress * 28 : 72 + progress * 24;
      lowPhase += (2 * Math.PI * lowFrequency) / sampleRate;
      const noiseLevel = kind === "slide-soft" ? 1.15 : kind === "slide-deep" ? 1.5 : 1.3;
      sample = shapedNoise * noiseLevel * movement + Math.sin(lowPhase) * (kind === "slide-deep" ? 0.13 : 0.07) * movement;
    } else if (kind === "click") {
      const lowFrequency = 105 - progress * 42;
      lowPhase += (2 * Math.PI * lowFrequency) / sampleRate;
      sample = Math.sin(lowPhase) * Math.exp(-34 * time) * 0.72 + fastNoise * Math.exp(-48 * time) * 0.5;
    } else {
      const lowFrequency = 88 - progress * 46;
      lowPhase += (2 * Math.PI * lowFrequency) / sampleRate;
      const subImpact = Math.sin(lowPhase) * Math.exp(-3.4 * time) * 0.8;
      const initialHit = fastNoise * Math.exp(-20 * time) * 0.65;
      const airTail = shapedNoise * Math.pow(Math.sin(Math.PI * progress), 0.8) * 0.24;
      sample = subImpact + initialHit + airTail;
    }
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample * envelope * 0.82)) * 32767, true);
  }

  const url = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  demoSoundUrls.set(kind, url);
  return url;
}

async function playDemoSound(kind: DemoSound, force = false) {
  if (!demoSoundEnabled && !force) return false;
  const audio = new Audio(createDemoSoundUrl(kind));
  audio.volume = kind === "click" ? 0.68 : 0.78;
  activeDemoAudio.add(audio);
  audio.addEventListener("ended", () => activeDemoAudio.delete(audio), { once: true });
  try {
    await audio.play();
    return true;
  } catch {
    activeDemoAudio.delete(audio);
    return false;
  }
}

async function enableDemoAudio() {
  const started = await playDemoSound("confirm", true);
  demoSoundEnabled = started;
  return started;
}
const beatOf: Record<SceneId, number> = {
  problem: 0,
  solution: 1,
  "paid-stream": 2,
  receipt: 3,
  end: 3,
};

/* Each scene owns its mood: the ambient field shifts color to match. A calm
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
  // Smooth, confident spring rise for the resolution.
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
/* DemoVideoPage: rAF engine and chrome                                */
/* ------------------------------------------------------------------ */

export default function DemoVideoPage() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current scene
  const [minimal, setMinimal] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const skipNextSceneSound = useRef(false);

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

  useEffect(() => {
    if (!ready || !soundEnabled) return;
    if (skipNextSceneSound.current) {
      skipNextSceneSound.current = false;
      return;
    }
    void playSlideSound();
  }, [index, ready, soundEnabled]);

  return (
    <div className="dv-root">
      <DemoStyles />
      <AmbientBackground scene={scene} sceneIndex={index} />
      <div className="dv-vignette" aria-hidden="true" />

      {!minimal && (
        <button
          type="button"
          className={`dv-sound-toggle${soundEnabled ? " is-on" : ""}${soundBlocked ? " is-blocked" : ""}`}
          onClick={async () => {
            const enabled = await enableDemoAudio();
            if (enabled && !soundEnabled) skipNextSceneSound.current = true;
            setSoundEnabled(enabled);
            setSoundBlocked(!enabled);
          }}
          aria-pressed={soundEnabled}
          title={soundEnabled ? "Click to test sound" : "Enable demo sounds"}
        >
          <Volume2 size={14} /> {soundEnabled ? "Sound on · test" : soundBlocked ? "Sound blocked" : "Enable sound"}
        </button>
      )}

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
/* DemoStage: filmic cut, perpetual float, and light sweep             */
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
      return <ProblemScene progress={progress} />;
    case "solution":
      return <SolutionScene progress={progress} />;
    case "paid-stream":
      return <PaidStreamScene progress={progress} />;
    case "receipt":
      return <ReceiptScene progress={progress} />;
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
/* SceneStage plays a scene's segments one at a time (text, then UI).  */
/* ------------------------------------------------------------------ */

/**
 * A scene is an ordered list of segments. Each one is EITHER a full-stage text
 * card OR the UI, never both. `AnimatePresence mode="wait"` is the guarantee:
 * the next segment will not mount until the current one has fully animated out,
 * so the viewer reads the sentence, watches it leave, *then* sees the product.
 * One thing on screen at a time.
 */
type Segment =
  | { kind: "text"; weight: number; text: string }
  | { kind: "ui"; weight: number; wide?: boolean; render: (progress: number) => React.ReactNode };

function SceneStage({ progress, bg, segments, sound = false }: { progress: number; bg: string; segments: Segment[]; sound?: boolean }) {
  const total = segments.reduce((sum, segment) => sum + segment.weight, 0);
  let acc = 0;
  const bounds = segments.map((segment) => {
    const start = acc / total;
    acc += segment.weight;
    return { start, end: acc / total };
  });

  let activeIndex = 0;
  segments.forEach((_, index) => {
    if (progress >= bounds[index].start) activeIndex = index;
  });
  const segment = segments[activeIndex];
  const { start, end } = bounds[activeIndex];
  const local = Math.max(0, Math.min(1, (progress - start) / (end - start || 1)));

  useEffect(() => {
    if (sound && segment.kind === "ui") void playSlideSound();
  }, [activeIndex, segment.kind, sound]);

  return (
    <section className="dv-scene">
      <span className="dv-scene-bg" aria-hidden="true">
        {bg}
      </span>

      <AnimatePresence mode="wait">
        {segment.kind === "text" ? (
          <TextCard key={`t${activeIndex}`} text={segment.text} />
        ) : (
          <motion.div
            key={`u${activeIndex}`}
            className={`dv-scene-focal${segment.wide ? " dv-scene-focal-wide" : ""}`}
            initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -24, scale: 0.985, filter: "blur(10px)", transition: { duration: 0.34, ease: CINE } }}
            transition={{ duration: 0.62, ease: CINE }}
          >
            {segment.render(local)}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Full-stage narration card: word-by-word blur-in, blurs away on exit. */
function TextCard({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <motion.div
      className="dv-textcard"
      exit={{ opacity: 0, y: -18, filter: "blur(10px)", transition: { duration: 0.4, ease: CINE } }}
    >
      <h2 className="dv-mainline">
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="dv-mainline-word"
            initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.62, ease: CINE, delay: 0.12 + index * 0.06 }}
          >
            {word}
          </motion.span>
        ))}
      </h2>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 1: Problem                                                    */
/* ------------------------------------------------------------------ */

function ProblemScene({ progress }: { progress: number }) {
  // Two halves of the same wall, told one at a time: text, then the buyer agent
  // bouncing off the paywall; text again, then the creator who can't charge it.
  return (
    <SceneStage
      progress={progress}
      bg="🧩"
      sound
      segments={[
        { kind: "text", weight: 2, text: "Agents can’t buy paywalled content." },
        { kind: "ui", weight: 2.6, render: () => <BuyerBlocked /> },
        { kind: "text", weight: 2, text: "And creators can’t sell to them either." },
        { kind: "ui", weight: 2.6, render: () => <CreatorBlocked /> },
      ]}
    />
  );
}

/** Half one: a buyer agent's fetch dies on the subscription wall. */
function BuyerBlocked() {
  const requests = [
    { n: "01", method: "GET", path: "/search?q=resale+fee", status: "200", note: "application/json", tone: "ok", delay: 0.55 },
    { n: "02", method: "GET", path: "/articles/resale-fees", status: "402", note: "payment_required", tone: "warn", delay: 1.0 },
    { n: "03", method: "POST", path: "/checkout", status: "401", note: "browser_session_required", tone: "error", delay: 1.45 },
  ];
  return (
    <div className="dv-term">
      <div className="dv-term-bar">
        <span className="dv-term-dot dv-term-dot-r" />
        <span className="dv-term-dot dv-term-dot-y" />
        <span className="dv-term-dot dv-term-dot-g" />
        <span className="mono dv-term-name">buyer-agent: fetch</span>
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
          transition={{ duration: 0.4, ease: CINE, delay: 1.95 }}
        >
          <span className="dv-term-x">✗</span> fetch() can’t complete an interactive subscription
          <span className="dv-term-cursor" aria-hidden="true" />
        </motion.div>
      </div>
    </div>
  );
}

function CreatorBlocked() {
  return (
    <div className="dv-connect-fail">
      <div className="dv-connect-parties">
        <motion.div
          className="dv-party-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: CINE, delay: 0.2 }}
        >
          <span className="dv-party-icon dv-party-creator"><PenLine size={25} /></span>
          <div><span className="mono">CREATOR</span><strong>Premium article</strong><small>Needs a way to charge</small></div>
        </motion.div>

        <div className="dv-connect-rail" aria-hidden="true">
          <motion.span className="dv-connect-line dv-connect-line-left" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.65, delay: 0.55, ease: CINE }} />
          <motion.div className="dv-connect-blocker" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 1.05, ease: CINE }}>
            <Unlink size={20} />
            <span className="mono">NO PAYMENT RAIL</span>
          </motion.div>
          <motion.span className="dv-connect-line dv-connect-line-right" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.65, delay: 0.55, ease: CINE }} />
        </div>

        <motion.div
          className="dv-party-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: CINE, delay: 0.2 }}
        >
          <span className="dv-party-icon dv-party-agent"><Bot size={25} /></span>
          <div><span className="mono">AI AGENT</span><strong>Needs one answer</strong><small>Cannot use a checkout</small></div>
        </motion.div>
      </div>

      <motion.p
        className="dv-creatorblock-result"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: CINE, delay: 1.5 }}
      >
        <span className="dv-cl-red">The transaction fails before value can move.</span>
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2: Solution / publish                                         */
/* ------------------------------------------------------------------ */

function SolutionScene({ progress }: { progress: number }) {
  return (
    <SceneStage
      progress={progress}
      bg="🔨"
      segments={[
        { kind: "text", weight: 1.85, text: "We came up with a solution." },
        // Add the article, then break it into navigable sections.
        {
          kind: "ui",
          weight: 2.6,
          wide: true,
          render: (p) => (
            <CreatorDashboardDemo step={p >= 0.58 ? 1 : 0} phase={p} priced={false} published={false} />
          ),
        },
        { kind: "text", weight: 1.75, text: "Creators can price their articles per word. Rubicon’s cut is 0%." },
        // The pricing step.
        {
          kind: "ui",
          weight: 2.2,
          wide: true,
          render: (p) => <CreatorDashboardDemo step={2} phase={p} priced={p >= 0.48} published={false} />,
        },
        { kind: "text", weight: 1.65, text: "Publish once, and it’s instantly live to every agent." },
        // Review, then publish.
        {
          kind: "ui",
          weight: 2.6,
          wide: true,
          render: (p) => (
            <CreatorDashboardDemo step={3} phase={p} priced published={p >= 0.62} />
          ),
        },
      ]}
    />
  );
}

const CREATOR_STEPS = ["Add your article", "Review sections", "Choose pricing", "Publish"] as const;

function CreatorDashboardDemo({ step, phase, priced, published }: { step: number; phase: number; priced: boolean; published: boolean }) {
  const spotlight = step === 0
    ? (phase < 0.32 ? "content" : "action")
    : step === 1
      ? (phase < 0.82 ? "sections" : "action")
      : step === 2
        ? (phase < 0.48 ? "price" : phase < 0.74 ? "preview" : "action")
        : (phase < 0.4 ? "review" : "action");

  useEffect(() => {
    if (step !== 1) void playSlideSound();
  }, [step]);

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
              {step === 0 && <DashboardArticleStep focus={phase < 0.32 ? "content" : "action"} />}
              {step === 1 && <DashboardSectionsStep phase={phase} />}
              {step === 2 && <DashboardPricingStep phase={phase} priced={priced} />}
              {step === 3 && <DashboardReviewStep focus={phase < 0.4 ? "review" : "action"} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!published && <div className={`dv-dashboard-spotlight is-${spotlight}`} aria-hidden="true" />}
      {!published && <SolutionCursor target={spotlight} />}
    </div>
  );
}

function DashboardArticleStep({ focus }: { focus: "content" | "action" }) {
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
      <DashboardButton label="Review sections" focused={focus === "action"} />
    </>
  );
}

function DashboardField({ label, value }: { label: string; value: string }) {
  return <div className="dv-dashboard-field"><span>{label}</span><strong>{value}</strong></div>;
}

function DashboardSectionsStep({ phase }: { phase: number }) {
  const actionFocused = phase >= 0.82;
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
      <DashboardButton label="Choose pricing" focused={actionFocused} />
    </>
  );
}

function DashboardPricingStep({ phase, priced }: { phase: number; priced: boolean }) {
  const focus = phase < 0.48 ? "price" : phase < 0.74 ? "preview" : "action";
  return (
    <>
      <div className="dv-dashboard-title"><strong>Choose pricing</strong><span>Set what agents pay. You earn for exactly the words they read.</span></div>
      <div className="dv-dashboard-pricing">
        <div className={`dv-dashboard-price-input${priced ? " is-filled" : ""}`}>
          <span>Price per word</span>
          <div><small>$</small><strong className="mono">{priced ? "0.00005" : "0.0001"}</strong></div>
        </div>
        <div className="dv-dashboard-preview">
          <span className="mono">Pricing preview</span>
          <div><small>Price per word</small><strong>{priced ? "$0.00005" : "$0.00"}</strong></div>
          <div><small>Estimated full article</small><strong>{priced ? "$0.1209" : "$0.00"}</strong></div>
          <div><small>Earnings for 1,000 words</small><strong>{priced ? "$0.0500" : "$0.00"}</strong></div>
          <div><small>Rubicon platform fee</small><strong>0%</strong></div>
        </div>
      </div>
      {priced && <DashboardButton label="Review" focused={focus === "action"} />}
    </>
  );
}

function DashboardReviewStep({ focus }: { focus: "review" | "action" }) {
  return (
    <>
      <div className="dv-dashboard-title"><strong>Review and publish</strong><span>Confirm the creator listing before it goes live to agents.</span></div>
      <div className="dv-dashboard-review">
        <div><span>Article</span><strong>{ARTICLE_TITLE}</strong></div>
        <div><span>Sections</span><strong>3 · 2,418 words</strong></div>
        <div><span>Price per word</span><strong>$0.00005 USDC</strong></div>
        <div><span>Receiving wallet</span><strong className="mono">0x8f2…91c ✓</strong></div>
      </div>
      <DashboardButton label="Publish article" focused={focus === "action"} />
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

function DashboardButton({ label, focused }: { label: string; focused?: boolean }) {
  useEffect(() => {
    if (focused) void playDemoSound("click");
  }, [focused]);

  return <div className={`dv-dashboard-button${focused ? " is-pressing" : ""}`}>{label}<ArrowRight size={13} /></div>;
}

function SolutionCursor({ target }: { target: string }) {
  return (
    <motion.span
      className={`dv-solution-cursor is-${target}${target === "action" ? " is-clicking" : ""}`}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: CINE }}
    >
      <MousePointer2 size={20} fill="currentColor" />
      {target === "action" && <span />}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3: Seller guides and paid word stream                         */
/* ------------------------------------------------------------------ */

function PaidStreamScene({ progress }: { progress: number }) {
  return (
    <SceneStage
      progress={progress}
      bg="🌊"
      segments={[
        { kind: "text", weight: 1.85, text: "Agents can pay for what they need and see only that." },
        { kind: "ui", weight: 5, render: (p) => <PaidStreamCard progress={p} /> },
      ]}
    />
  );
}

function PaidStreamCard({ progress }: { progress: number }) {
  const sellerReplied = progress >= 0.23;
  const sessionOpened = progress >= 0.4;
  const streaming = progress >= 0.52;
  const revealFrac = Math.max(0, Math.min(1, (progress - 0.52) / 0.3));
  const revealed = Math.round(STREAM_VISIBLE_WORDS.length * revealFrac);
  const wordsRead = Math.round(TARGET_WORDS * revealFrac);
  const spent = TARGET_SPEND * revealFrac;
  const stopped = progress >= 0.86;
  const focus = !sellerReplied ? "question" : !sessionOpened ? "route" : !streaming ? "session" : stopped ? "stop" : "stream";

  useEffect(() => {
    if (focus === "session") void playSlideSound();
    if (focus === "stop") void playDemoSound("click");
  }, [focus]);

  return (
      <GlowCard
        glow="strong"
        head={
          <CardHead title="Rubicon" />
        }
      >
        <div className={`dv-focus-region has-label-slot${focus === "question" || focus === "route" ? " is-focused" : " is-dimmed"}`}>
          {(focus === "question" || focus === "route") && <span className="mono dv-focus-label">{focus === "question" ? "1 · Agent asks" : "2 · Seller routes"}</span>}
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
        </div>

        <div className={`dv-guide-strip dv-focus-region has-label-slot${focus === "session" ? " is-focused" : " is-dimmed"}`}>
          {focus === "session" && <span className="mono dv-focus-label">3 · Open capped session</span>}
          <span className="mono dv-guide-from">POST /v1/sessions</span>
          <span className="dv-guide-text">
            {sessionOpened ? <><strong className="dv-session-created">201 Created</strong> · session_7f2a · hard cap <span className="dv-highlight">$0.0200</span></> : "Waiting for route, then opening a capped session…"}
          </span>
        </div>

        <div className={`dv-meters dv-focus-region has-label-slot${focus === "stream" ? " is-focused" : " is-dimmed"}`}>
          {focus === "stream" && <span className="mono dv-focus-label">4 · Pay as words arrive</span>}
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

        <div className={`dv-stream-body dv-focus-region${focus === "stream" ? " is-focused" : " is-dimmed"}`}>
          <p className="dv-stream-text">
            {STREAM_VISIBLE_WORDS.map((w, i) => (
              <span
                key={i}
                className={`dv-word${i < revealed ? " dv-word-on" : ""}${i === revealed - 1 ? " dv-word-edge" : ""}`}
              >
                {w}{" "}
              </span>
            ))}
            {stopped && <span className="dv-stream-ellipsis"> …</span>}
            {sessionOpened && !stopped && <span className="dv-caret" aria-hidden="true" />}
          </p>
        </div>

        <div className="dv-stop-slot">
          <AnimatePresence>
            {stopped && (
              <motion.div
                key="stop"
                className="dv-stop-chip is-focused"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.32, ease: CINE }}
              >
                5 · Enough context. Stop paying.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlowCard>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 6: Receipt and creator earnings                               */
/* ------------------------------------------------------------------ */

function ReceiptScene({ progress }: { progress: number }) {
  return (
    <SceneStage
      progress={progress}
      bg="🧾"
      segments={[
        { kind: "text", weight: 1.75, text: "Every read settles to the creator, onchain." },
        { kind: "ui", weight: 3.7, render: (p) => <SettlementCard progress={p} /> },
      ]}
    />
  );
}

function SettlementCard({ progress }: { progress: number }) {
  const submitted = progress >= 0.3;
  const included = progress >= 0.58;
  const confirmed = progress >= 0.8;

  useEffect(() => {
    if (included) void playSlideSound();
  }, [included]);

  useEffect(() => {
    if (confirmed) void playDemoSound("confirm");
  }, [confirmed]);

  return (
    <div className="dv-simple-settlement">
      <header className="dv-simple-head">
        <div className="dv-tx-brand"><img src="/arc-logo.webp" alt="" /><div><span className="mono">ARC NETWORK</span><strong>Settling creator payment</strong></div></div>
      </header>

      <div className="dv-simple-transfer">
        <div><span className="mono">PAID READ</span><strong>137 words</strong></div>
        <ArrowRight size={18} />
        <div><span className="mono">CREATOR EARNS</span><strong>$0.0068 USDC</strong></div>
      </div>

      <div className="dv-simple-chain" aria-label="Transaction included in an Arc block">
        <span className="mono dv-simple-chain-label">ARC BLOCKS</span>
        <div className="dv-simple-blocks">
          {["769", "770"].map((block) => <div key={block} className="dv-simple-block is-past"><Boxes size={19} /><span className="mono">18,492,{block}</span></div>)}
          <div className="dv-block-slot">
            <motion.div className="dv-simple-block is-current" initial={{ opacity: 0, y: -70, scale: 0.9 }} animate={included ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -70, scale: 0.9 }} transition={{ type: "spring", stiffness: 150, damping: 18 }}>
              <Boxes size={22} /><strong className="mono">18,492,771</strong><small className="mono">0x8fc1…7a2e</small>
            </motion.div>
          </div>
        </div>
        <motion.div className="dv-simple-status" animate={{ color: included ? "var(--green)" : "var(--river-deep)" }}>
          {included ? <Check size={15} /> : <span className="status-dot" />}
          <strong>{included ? "Included in block 18,492,771" : submitted ? "Submitted to Arc" : "Preparing transaction"}</strong>
        </motion.div>
      </div>

      <div className="dv-simple-paid-slot">
        <AnimatePresence>
          {confirmed && (
            <motion.div className="dv-simple-paid" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }} transition={{ type: "spring", stiffness: 180, damping: 20 }}>
              <span className="dv-chain-check"><Check size={14} /></span>
              <div><strong>Creator paid</strong><small className="mono">+$0.0068 USDC · FINAL ON ARC</small></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 7: End card                                                   */
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
/* Ambient atmosphere with a drifting glow that tracks the scene.     */
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

function CardHead({ title }: { title: string }) {
  return <span className="dv-card-title">{title}</span>;
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
      .dv-sound-toggle {
        position: fixed; top: 18px; right: 20px; z-index: 30; display: inline-flex; align-items: center; gap: 7px;
        border: 0; border-radius: 999px; padding: 8px 12px; color: var(--muted); background: rgba(22,24,29,0.82);
        font-size: 0.68rem; font-weight: 650; backdrop-filter: blur(12px); cursor: pointer;
        transition: color 160ms var(--ease-out), background-color 160ms var(--ease-out), transform 140ms var(--ease-out);
      }
      .dv-sound-toggle.is-on { color: var(--ink); background: rgba(47,128,237,0.16); }
      .dv-sound-toggle.is-blocked { color: var(--red); background: rgba(240,120,120,0.12); }
      .dv-sound-toggle:active { transform: scale(0.97); }
      @media (hover: hover) and (pointer: fine) { .dv-sound-toggle:hover { color: var(--ink); } }

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

      /* Scene: one thing on stage at a time, text card OR component. */
      .dv-scene { position: relative; width: 100%; display: grid; place-items: center; min-height: clamp(360px, 58vh, 540px); }
      .dv-scene-bg {
        position: absolute; inset: 0; z-index: 0; display: grid; place-items: center;
        font-size: clamp(240px, 38vw, 480px); line-height: 1; opacity: 0.07;
        filter: grayscale(0.4) brightness(1.05); pointer-events: none; user-select: none;
        -webkit-mask-image: radial-gradient(60% 60% at 50% 50%, #000 25%, transparent 78%);
        mask-image: radial-gradient(60% 60% at 50% 50%, #000 25%, transparent 78%);
      }
      /* full-stage narration card, shown alone */
      .dv-textcard { position: relative; z-index: 2; grid-area: 1 / 1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 clamp(12px, 4vw, 40px); }
      .dv-mainline {
        max-width: 18ch; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.12em 0.32em;
        font-size: clamp(1.9rem, 4.4vw, 3.4rem); font-weight: 780; letter-spacing: -0.035em; line-height: 1.07; color: var(--ink);
      }
      .dv-mainline-word { display: inline-block; }

      .dv-scene-focal { position: relative; z-index: 2; grid-area: 1 / 1; justify-self: center; width: 100%; max-width: 720px; display: flex; justify-content: center; }
      .dv-scene-focal-wide { max-width: 920px; }

      /* Card is flat with no border or shadow, defined by fill only. */
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

      /* ---- problem: buyer terminal, then creator mismatch ---- */
      .dv-problem { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; min-height: 300px; }
      .dv-problem .dv-term { width: 100%; }
      .dv-cl-red { color: var(--red); font-weight: 650; }
      .dv-cl-amber { color: var(--amber); font-weight: 650; }

      /* ---- problem: transaction rail cannot connect ---- */
      .dv-connect-fail { display: grid; width: min(100%, 720px); gap: 24px; }
      .dv-connect-parties { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(210px, 1.1fr) minmax(180px, 1fr); align-items: center; gap: 18px; }
      .dv-party-card { display: flex; align-items: center; gap: 13px; min-height: 112px; padding: 18px; border-radius: 18px; background: rgba(255,255,255,0.045); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 18px 42px rgba(0,0,0,0.16); }
      .dv-party-icon { display: grid; flex: none; width: 50px; height: 50px; place-items: center; border-radius: 14px; color: white; }
      .dv-party-creator { background: linear-gradient(145deg, #477fdc, #2555a3); }
      .dv-party-agent { background: linear-gradient(145deg, #36a777, #19704d); }
      .dv-party-card div { display: grid; gap: 3px; }
      .dv-party-card div span { color: var(--quiet); font-size: 0.5rem; letter-spacing: 0.11em; }
      .dv-party-card strong { font-size: 0.8rem; }
      .dv-party-card small { color: var(--muted); font-size: 0.62rem; }
      .dv-connect-rail { position: relative; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; }
      .dv-connect-line { height: 2px; background: repeating-linear-gradient(90deg, rgba(240,120,120,0.55) 0 8px, transparent 8px 14px); }
      .dv-connect-line-left { transform-origin: right center; }
      .dv-connect-line-right { transform-origin: left center; }
      .dv-connect-blocker { display: grid; min-width: 112px; justify-items: center; gap: 7px; padding: 13px 11px; border-radius: 14px; color: var(--red); background: #251d22; box-shadow: 0 0 0 1px rgba(240,120,120,0.2), 0 15px 34px rgba(0,0,0,0.24); }
      .dv-connect-blocker span { font-size: 0.44rem; letter-spacing: 0.1em; }
      .dv-creatorblock { display: flex; flex-direction: column; align-items: stretch; gap: 11px; width: min(100%, 560px); }
      .dv-creatorblock-row { display: flex; align-items: center; gap: 13px; padding: 15px 17px; border-radius: 14px; background: rgba(255,255,255,0.035); }
      .dv-creatorblock-icon { display: grid; place-items: center; flex: none; width: 34px; height: 34px; border-radius: 10px; color: var(--river-deep); background: rgba(47,128,237,0.12); }
      .dv-creatorblock-row > div { display: flex; flex-direction: column; gap: 4px; }
      .dv-creatorblock-label { color: var(--quiet); font-size: 0.55rem; letter-spacing: 0.09em; text-transform: uppercase; }
      .dv-creatorblock-row strong { color: var(--ink); font-size: 0.96rem; font-weight: 600; }
      .dv-creatorblock-vs { align-self: center; display: inline-flex; align-items: center; gap: 6px; padding: 4px 13px; border-radius: 999px; color: var(--red); background: rgba(240,120,120,0.12); font-size: 0.62rem; font-weight: 650; letter-spacing: 0.02em; }
      .dv-creatorblock-result { margin-top: 5px; text-align: center; font-size: 1rem; line-height: 1.5; color: var(--muted); }
      .dv-creatorblock-result strong { font-size: 1.05rem; }

      /* ---- compressed creator dashboard ---- */
      .dv-dashboard { position: relative; display: grid; grid-template-columns: 156px minmax(0, 1fr); width: 100%; height: 470px; overflow: hidden; border-radius: 22px; color: #202127; background: #fff; box-shadow: 0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(119,157,230,0.24); }
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
      .dv-dashboard-panel { position: relative; height: 390px; margin-top: 14px; padding: 22px; overflow: hidden; border-radius: 15px; background: rgba(255,255,255,0.94); box-shadow: 0 0 0 1px #e1e4e9; }
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
      .dv-dashboard-button.is-pressing { animation: dv-button-press 900ms var(--ease-out) 1; }
      @keyframes dv-button-press { 0%, 55%, 100% { transform: scale(1); } 70% { transform: scale(0.96); } }
      .dv-solution-cursor { position: absolute; z-index: 12; width: 20px; height: 20px; color: #11151c; filter: drop-shadow(0 1px 2px rgba(255,255,255,0.95)) drop-shadow(0 3px 5px rgba(0,0,0,0.32)); transition: left 560ms var(--ease-in-out), top 560ms var(--ease-in-out); }
      .dv-solution-cursor.is-content { left: 70%; top: 45%; }
      .dv-solution-cursor.is-sections { left: 72%; top: 44%; }
      .dv-solution-cursor.is-price { left: 53%; top: 48%; }
      .dv-solution-cursor.is-preview { left: 82%; top: 49%; }
      .dv-solution-cursor.is-review { left: 72%; top: 48%; }
      .dv-solution-cursor.is-action { left: 88%; top: 84%; animation: dv-solution-click 900ms var(--ease-out) 1; }
      .dv-solution-cursor > span { position: absolute; inset: -5px; border: 1px solid rgba(47,128,237,0.7); border-radius: 50%; animation: dv-cursor-pulse 700ms var(--ease-out) 1; }
      @keyframes dv-solution-click { 0%, 55%, 100% { transform: scale(1); } 72% { transform: scale(0.82); } }
      @keyframes dv-cursor-pulse { to { transform: scale(1.55); opacity: 0; } }
      .dv-dashboard-spotlight {
        position: absolute; inset: 0; z-index: 8; pointer-events: none;
        background: rgba(18,21,27,0.12);
      }
      .dv-dashboard-spotlight::before {
        content: ""; position: absolute; border-radius: 22px;
        background: rgba(255,255,255,0.11); filter: blur(28px); transform: scale(1.05);
        transition: top 440ms var(--ease-in-out), right 440ms var(--ease-in-out), bottom 440ms var(--ease-in-out), left 440ms var(--ease-in-out), width 440ms var(--ease-in-out), height 440ms var(--ease-in-out), border-radius 440ms var(--ease-in-out);
      }
      .dv-dashboard-spotlight.is-content::before { top: 62px; right: 22px; left: 172px; height: 258px; }
      .dv-dashboard-spotlight.is-sections::before { top: 88px; right: 24px; left: 174px; height: 204px; }
      .dv-dashboard-spotlight.is-price::before { top: 92px; left: 172px; width: 430px; height: 170px; }
      .dv-dashboard-spotlight.is-preview::before { top: 92px; right: 20px; width: 348px; height: 192px; }
      .dv-dashboard-spotlight.is-review::before { top: 88px; right: 20px; left: 172px; height: 208px; }
      .dv-dashboard-spotlight.is-action::before { right: 8px; bottom: 4px; width: 220px; height: 92px; border-radius: 30px; }
      .is-dimmed { opacity: 0.38; filter: brightness(0.48) saturate(0.55); transition: opacity 320ms var(--ease-out), filter 320ms var(--ease-out); }
      .is-focused { z-index: 3; opacity: 1; filter: none; box-shadow: none; transition: opacity 320ms var(--ease-out), filter 320ms var(--ease-out); }
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
      .dv-dashboard-published { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 390px; margin-top: 14px; border-radius: 15px; text-align: center; background: linear-gradient(145deg, #fff, #effbf5); box-shadow: 0 0 0 1px #a8dfc4, 0 18px 50px rgba(59,162,113,0.13); }
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
      .dv-stop-slot { display: flex; min-height: 38px; align-items: flex-start; }
      .dv-focus-region { position: relative; transition: opacity 320ms var(--ease-out), filter 320ms var(--ease-out); }
      .dv-focus-region.is-focused { border-radius: 14px; }
      .dv-focus-region.has-label-slot { padding-top: 32px; }
      .dv-focus-label { position: absolute; top: 8px; left: 12px; z-index: 4; padding: 5px 9px; border: 0; border-radius: 999px; color: white; background: var(--river); font-size: 0.58rem; font-weight: 700; letter-spacing: 0.04em; white-space: nowrap; }
      .dv-stream-ellipsis { color: var(--quiet); }

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

      /* ---- literal block settling on Arc ---- */
      .dv-block-settlement { position: relative; display: grid; grid-template-columns: 190px minmax(280px, 1fr); grid-template-rows: 1fr auto; gap: 16px 24px; width: 100%; min-height: 410px; padding: 22px; overflow: hidden; border-radius: 22px; background: radial-gradient(circle at 70% 28%, rgba(72,129,231,0.18), transparent 38%), #15181e; box-shadow: 0 30px 80px rgba(0,0,0,0.3); }
      .dv-block-receipt { align-self: center; display: grid; gap: 8px; padding: 18px; border-radius: 16px; background: rgba(255,255,255,0.04); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); }
      .dv-block-receipt span { color: var(--river-deep); font-size: 0.54rem; letter-spacing: 0.12em; }
      .dv-block-receipt strong { font-size: 1rem; }
      .dv-block-receipt small { color: var(--quiet); font-size: 0.56rem; line-height: 1.5; }
      .dv-block-drop-zone { position: relative; min-height: 300px; perspective: 700px; }
      .dv-chain-cube { position: absolute; top: 34px; left: 50%; z-index: 3; width: 104px; height: 104px; margin-left: -52px; transform-style: preserve-3d; }
      .dv-chain-cube-face { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 4px; border-radius: 10px; color: white; background: linear-gradient(145deg, #4d91fa, #2556ac); box-shadow: 0 24px 55px rgba(37,86,172,0.35); }
      .dv-chain-cube-face strong { font-size: 0.72rem; letter-spacing: 0.14em; }
      .dv-chain-cube-face small { color: rgba(255,255,255,0.72); font-size: 0.52rem; }
      .dv-chain-cube-top { position: absolute; z-index: -1; top: -24px; left: 12px; width: 104px; height: 48px; border-radius: 8px 8px 4px 4px; background: #76aaf8; transform: skewX(-27deg); }
      .dv-chain-cube-side { position: absolute; z-index: -1; top: -12px; right: -24px; width: 48px; height: 104px; border-radius: 4px 8px 8px 4px; background: #1d4388; transform: skewY(-27deg); }
      .dv-arc-platform { position: absolute; right: 18px; bottom: 24px; left: 18px; z-index: 2; display: grid; grid-template-columns: 50px 1fr auto; align-items: center; gap: 13px; min-height: 76px; padding: 13px 16px; border-radius: 14px; background: linear-gradient(180deg, #252c39, #171b23); box-shadow: 0 14px 0 #0d1015, 0 26px 50px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(118,170,248,0.16); transform-origin: center bottom; }
      .dv-arc-platform img { width: 44px; height: 44px; object-fit: contain; border-radius: 10px; background: white; }
      .dv-arc-platform div { display: grid; gap: 3px; }
      .dv-arc-platform span { color: var(--quiet); font-size: 0.5rem; letter-spacing: 0.12em; }
      .dv-arc-platform strong { font-size: 0.94rem; }
      .dv-arc-platform a { color: var(--river-deep); font-size: 0.62rem; text-decoration: none; }
      .dv-block-impact { position: absolute; z-index: 1; right: 14%; bottom: 72px; left: 14%; height: 36px; border: 2px solid rgba(110,165,255,0.7); border-radius: 50%; box-shadow: 0 0 28px rgba(110,165,255,0.36); }
      .dv-block-payout { grid-column: 1 / -1; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; min-height: 62px; padding: 12px 14px; border-radius: 14px; color: var(--green); background: rgba(88,213,155,0.09); box-shadow: inset 0 0 0 1px rgba(88,213,155,0.18); }
      .dv-block-payout div { display: grid; gap: 3px; }
      .dv-block-payout div span { color: var(--quiet); font-size: 0.5rem; letter-spacing: 0.1em; }
      .dv-block-payout strong { font-size: 0.8rem; }
      .dv-block-payout > small { color: var(--quiet); font-size: 0.52rem; }

      /* ---- Arc transaction lifecycle ---- */
      .dv-tx-settlement { width: 100%; overflow: hidden; border-radius: 20px; background: #15181e; box-shadow: 0 30px 80px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.055); }
      .dv-tx-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .dv-tx-brand { display: flex; align-items: center; gap: 11px; }
      .dv-tx-brand img { width: 34px; height: 34px; border-radius: 9px; object-fit: contain; background: white; }
      .dv-tx-brand div { display: grid; gap: 2px; }
      .dv-tx-brand span { color: var(--quiet); font-size: 0.46rem; letter-spacing: 0.12em; }
      .dv-tx-brand strong { font-size: 0.78rem; }
      .dv-tx-summary { display: grid; grid-template-columns: 1.15fr 1fr 1fr; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.018); }
      .dv-tx-summary > div { display: grid; gap: 4px; padding: 14px 18px; border-right: 1px solid rgba(255,255,255,0.055); }
      .dv-tx-summary > div:last-child { border-right: 0; }
      .dv-tx-summary span { color: var(--quiet); font-size: 0.46rem; letter-spacing: 0.1em; }
      .dv-tx-summary strong { font-size: 0.78rem; }
      .dv-tx-summary small { color: var(--muted); font-size: 0.52rem; }
      .dv-tx-body { display: grid; grid-template-columns: 0.72fr 1.28fr; min-height: 222px; }
      .dv-tx-steps { display: grid; align-content: center; gap: 0; padding: 14px 18px; border-right: 1px solid rgba(255,255,255,0.06); }
      .dv-tx-steps li { position: relative; display: flex; align-items: center; gap: 10px; min-height: 45px; }
      .dv-tx-steps li:not(:last-child)::after { content: ""; position: absolute; top: 31px; bottom: -14px; left: 12px; width: 1px; background: rgba(255,255,255,0.1); }
      .dv-tx-step-icon { position: relative; z-index: 2; display: grid; flex: none; width: 25px; height: 25px; place-items: center; border-radius: 50%; color: var(--quiet); background: #242832; font-size: 0.58rem; }
      .dv-tx-steps li.is-active .dv-tx-step-icon { color: white; background: var(--river); box-shadow: 0 0 0 5px rgba(47,128,237,0.12); }
      .dv-tx-steps li.is-done .dv-tx-step-icon { color: #102018; background: var(--green); }
      .dv-tx-steps li div { display: grid; gap: 2px; }
      .dv-tx-steps strong { font-size: 0.68rem; }
      .dv-tx-steps small { color: var(--quiet); font-size: 0.49rem; }
      .dv-blockchain-viz { position: relative; display: grid; align-content: center; gap: 14px; padding: 18px 20px; overflow: hidden; background: radial-gradient(circle at 70% 30%, rgba(47,128,237,0.12), transparent 52%); }
      .dv-blockchain-label { color: var(--quiet); font-size: 0.47rem; letter-spacing: 0.12em; }
      .dv-blockchain-row { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3, 1fr); align-items: stretch; gap: 8px; }
      .dv-ledger-block { display: grid; justify-items: start; gap: 7px; min-height: 82px; padding: 12px; border-radius: 11px; color: var(--muted); background: #20242c; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06); }
      .dv-ledger-block span { font-size: 0.48rem; }
      .dv-ledger-block small { color: var(--quiet); font-size: 0.42rem; }
      .dv-ledger-block.is-current { color: var(--river-deep); background: linear-gradient(145deg, rgba(47,128,237,0.18), #202630); box-shadow: inset 0 0 0 1px rgba(110,165,255,0.3), 0 12px 32px rgba(47,128,237,0.13); }
      .dv-tx-hash { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.035); }
      .dv-tx-hash span { color: var(--quiet); font-size: 0.43rem; letter-spacing: 0.09em; }
      .dv-tx-hash strong { color: var(--muted); font-size: 0.51rem; }
      .dv-tx-hash small { color: var(--green); font-size: 0.45rem; }
      .dv-tx-confirmed { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 11px; margin: 0 18px 16px; padding: 10px 12px; border-radius: 11px; color: var(--green); background: rgba(88,213,155,0.09); box-shadow: inset 0 0 0 1px rgba(88,213,155,0.16); }
      .dv-tx-confirmed div { display: grid; gap: 2px; }
      .dv-tx-confirmed strong { font-size: 0.68rem; }
      .dv-tx-confirmed small { color: var(--muted); font-size: 0.53rem; }
      .dv-tx-confirmed > span:last-child { font-size: 0.47rem; }

      /* ---- simplified Arc block confirmation ---- */
      .dv-simple-settlement { width: 100%; overflow: hidden; border-radius: 22px; background: radial-gradient(circle at 50% 58%, rgba(47,128,237,0.1), transparent 48%), #15181e; box-shadow: 0 30px 80px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.055); }
      .dv-simple-head { display: flex; align-items: center; justify-content: space-between; padding: 17px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .dv-simple-transfer { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 22px; margin: 18px 20px 0; padding: 15px 18px; border-radius: 14px; background: rgba(255,255,255,0.035); }
      .dv-simple-transfer > div { display: grid; gap: 4px; }
      .dv-simple-transfer > div:last-child { text-align: right; }
      .dv-simple-transfer span { color: var(--quiet); font-size: 0.47rem; letter-spacing: 0.1em; }
      .dv-simple-transfer strong { font-size: 0.88rem; }
      .dv-simple-transfer > svg { color: var(--river-deep); }
      .dv-simple-chain { display: grid; justify-items: center; gap: 13px; padding: 20px 24px 18px; }
      .dv-simple-chain-label { color: var(--quiet); font-size: 0.46rem; letter-spacing: 0.13em; }
      .dv-simple-blocks { display: grid; grid-template-columns: 104px 104px 128px; align-items: end; gap: 12px; }
      .dv-simple-block { display: grid; align-content: center; justify-items: center; gap: 8px; height: 82px; border-radius: 13px; }
      .dv-simple-block.is-past { color: #6f7580; background: #20242b; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.045); }
      .dv-simple-block.is-past span { font-size: 0.47rem; }
      .dv-block-slot { display: grid; width: 128px; height: 104px; place-items: stretch; border: 1px dashed rgba(110,165,255,0.22); border-radius: 15px; background: rgba(47,128,237,0.025); }
      .dv-simple-block.is-current { width: 100%; height: 100%; color: #dceaff; background: linear-gradient(145deg, #2e67bb, #1c3f79); box-shadow: 0 18px 46px rgba(28,63,121,0.35), inset 0 0 0 1px rgba(153,194,255,0.24); }
      .dv-simple-block.is-current strong { font-size: 0.56rem; }
      .dv-simple-block.is-current small { color: rgba(220,234,255,0.66); font-size: 0.44rem; }
      .dv-simple-status { display: flex; align-items: center; gap: 8px; min-height: 22px; font-size: 0.64rem; }
      .dv-simple-status .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--river-deep); animation: status-pulse 1.8s var(--ease-in-out) infinite; }
      .dv-simple-paid { display: flex; align-items: center; justify-content: center; gap: 11px; margin: 0 20px 18px; padding: 12px 14px; border-radius: 13px; color: var(--green); background: rgba(88,213,155,0.09); box-shadow: inset 0 0 0 1px rgba(88,213,155,0.16); }
      .dv-simple-paid-slot { display: grid; min-height: 70px; align-content: start; }
      .dv-simple-paid div { display: grid; gap: 2px; }
      .dv-simple-paid strong { font-size: 0.72rem; }
      .dv-simple-paid small { color: var(--muted); font-size: 0.5rem; }

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
        .dv-connect-parties { grid-template-columns: 1fr; }
        .dv-connect-rail { order: 3; }
        .dv-tx-body { grid-template-columns: 1fr; }
        .dv-tx-steps { display: none; }
        .dv-tx-summary { grid-template-columns: 1fr; }
        .dv-tx-summary > div:not(:first-child) { display: none; }
        .dv-simple-blocks { grid-template-columns: 76px 76px 100px; }
        .dv-simple-block.is-past { width: 76px; }
        .dv-block-slot { width: 100px; }
        .dv-block-settlement { grid-template-columns: 1fr; min-height: 500px; }
        .dv-block-receipt { display: none; }
        .dv-block-payout { grid-column: 1; }
        .dv-block-payout > small { display: none; }
        .dv-settle-flow { grid-template-columns: 1fr; gap: 8px; }
        .dv-settle-rail { width: 2px; height: 18px; justify-self: center; }
        .dv-settle-node { min-height: 110px; }
        .dv-chain-block { display: none; }
        .dv-dashboard { grid-template-columns: 1fr; }
        .dv-dashboard-side { display: none; }
        .dv-dashboard-spotlight { display: none; }
        .dv-solution-cursor { display: none; }
        .dv-dashboard-main { padding: 12px; }
        .dv-dashboard-steps li { padding-inline: 7px; }
        .dv-dashboard-steps li { font-size: 0; }
        .dv-dashboard-steps li span { font-size: 0.54rem; }
        .dv-rail { display: none; }
        .dv-scene-bg { font-size: 58vw; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dv-caret { animation: none !important; }
        .dv-chain-cube { transform: translateY(104px) !important; }
      }
    `}</style>
  );
}
