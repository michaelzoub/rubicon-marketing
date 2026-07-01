"use client";

/**
 * /demo-video-creators: a deterministic, scripted product demo for *writers*,
 * built to be screen-recorded. It keeps the cinematic "one thing on stage at a
 * time" grammar of /demo-video, but on a light, on-brand white surface — and
 * crucially it stages the *real product*: every product beat renders the actual
 * shipped components (the writer auth screen, the Substack onboarding dialog,
 * the publish wizard, and the dashboard), not a lookalike.
 *
 *   problem  →  hook: "Tired of your articles not being discoverable by agents?"
 *   kicker   →  the promise: "Rubicon lets you safely list your articles,
 *               accessible to agents on a granular basis." (a punchy beat change)
 *   sign in  →  the real WriterAuthScreen
 *   onboard  →  the real SubstackOnboardingDialog (welcome → connect Substack)
 *   publish  →  the real CreatorPublishFlow wizard (add → sections → price → publish)
 *   earn     →  the real CreatorDashboardPreview (the /dashboard-preview surface)
 *   end      →  brand card
 *
 * Each scene enters with its own camera move so no two cuts feel alike, and the
 * kicker breaks the funnel rhythm so the montage never reads as a flat list.
 * A rAF engine drives a fixed timeline and hands each scene a 0..1 `progress`.
 */

import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition, type Transition } from "framer-motion";
import { ArrowUp, Check, MousePointer2, Plus, Video } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DashboardFrame, WriterAuthScreen } from "../../dashboard/_components/shell";
import { SubstackOnboardingDialog } from "../../dashboard/_components/substack-onboarding-dialog";
import { Card, PageHeader } from "../../dashboard/_components/ui";
import { CreatorPublishFlow } from "../marketing/creator-publish-flow";
import { CreatorDashboardPreview } from "../marketing/creator-dashboard-preview";
import { demoSounds, useDemoSoundEngine } from "./demo-sounds";

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type SceneId = "chat" | "kicker" | "signin" | "onboard" | "import" | "publish" | "earn" | "end";

const SCENES: Array<{ id: SceneId; ms: number }> = [
  { id: "chat", ms: 13000 },
  { id: "kicker", ms: 2400 },
  { id: "signin", ms: 2400 },
  { id: "onboard", ms: 4200 },
  { id: "import", ms: 4500 },
  { id: "publish", ms: 12000 },
  { id: "earn", ms: 5500 },
  { id: "end", ms: 3000 },
];

/* Cinematic easing with a long, confident deceleration. */
const CINE = [0.16, 1, 0.3, 1] as const;
/* Mirror of CINE for exits: build momentum before departure (ease-in). */
const CINE_IN = [0.7, 0, 0.84, 0] as const;
/* One shared exit for every cut. With AnimatePresence mode="wait" the outgoing
 * scene must fully clear before the next enters, so a slow exit reads as dead
 * air between cuts — the single biggest drag on the video's cadence. A quick
 * ease-in departure (principle: exits build momentum, then leave) snaps one
 * beat into the next while entrances still arrive gently. */
const CUT_EXIT: Transition = { duration: 0.34, ease: CINE_IN };

const BEATS = ["Why", "Promise", "Sign in", "Publish", "Earn"] as const;
const beatOf: Record<SceneId, number> = {
  chat: 0,
  kicker: 1,
  signin: 2,
  onboard: 2,
  import: 3,
  publish: 3,
  earn: 4,
  end: 4,
};
/* The first scene index a rail beat should jump to. */
const beatTarget = [0, 1, 2, 4, 6];
const playPublishSound = (step: number) => demoSounds.play(step === 4 ? "success" : "click");

/* Each section enters with its own camera move. */
type Cut = { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition; transition: Transition };
const CUTS: Record<SceneId, Cut> = {
  chat: {
    initial: { opacity: 0, transform: "translateY(18px) scale(1.01)" },
    animate: { opacity: 1, transform: "translateY(0) scale(1)" },
    exit: { opacity: 0, transform: "translateY(-14px) scale(1)" },
    transition: { duration: 0.55, ease: CINE },
  },
  // Beat change — snap in with a spring so the "promise" lands like a downbeat.
  kicker: {
    initial: { opacity: 0, transform: "translateY(42px) scale(0.95)" },
    animate: { opacity: 1, transform: "translateY(0) scale(1)" },
    exit: { opacity: 0, transform: "translateY(-28px) scale(1.01)" },
    transition: { type: "spring", stiffness: 220, damping: 20 },
  },
  // Quick, decisive lateral slide between the punch-beats.
  signin: {
    initial: { opacity: 0, transform: "translateX(56px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
    exit: { opacity: 0, transform: "translateX(-38px)" },
    transition: { duration: 0.5, ease: CINE },
  },
  // Product reveal — a spring gives a subtle overshoot-and-settle so the real UI
  // arrives with life rather than gliding flatly into place.
  onboard: {
    initial: { opacity: 0, transform: "scale(0.95)" },
    animate: { opacity: 1, transform: "scale(1)" },
    exit: { opacity: 0, transform: "scale(1.02)" },
    transition: { type: "spring", stiffness: 170, damping: 19 },
  },
  import: {
    initial: { opacity: 0, transform: "translateX(50px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
    exit: { opacity: 0, transform: "translateX(-34px)" },
    transition: { duration: 0.5, ease: CINE },
  },
  publish: {
    initial: { opacity: 0, transform: "translateY(46px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
    exit: { opacity: 0, transform: "translateY(-22px)" },
    transition: { type: "spring", stiffness: 180, damping: 18 },
  },
  // The dashboard is a large, already-scaled surface — a scale/spring cut reads
  // as a jarring "zoom" on it, so this beat gets a clean fade + tiny lift only.
  earn: {
    initial: { opacity: 0, transform: "translateY(12px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
    exit: { opacity: 0, transform: "translateY(0)" },
    transition: { duration: 0.55, ease: CINE },
  },
  // The finish crossfades in cleanly (no scale) so the dashboard→end handoff
  // never looks like it zooms the dashboard as the end card appears.
  end: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.6, ease: CINE },
  },
};

/* ------------------------------------------------------------------ */
/* Engine + chrome                                                     */
/* ------------------------------------------------------------------ */

export function CreatorsDemo() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current scene
  const [minimal, setMinimal] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loop, setLoop] = useState(true);
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(true);
  const [volume, setVolume] = useState(1);
  const [footer, setFooter] = useState(true);

  const safeIndex = Math.min(index, SCENES.length - 1);
  const scene = SCENES[safeIndex].id;
  const isEnd = scene === "end";

  // Recording controls: hide chrome or seek to a deterministic frame.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMinimal(params.get("minimal") === "true");
    const requestedScene = params.get("scene") as SceneId | null;
    const requestedIndex = requestedScene ? SCENES.findIndex(({ id }) => id === requestedScene) : -1;
    const requestedProgress = Number(params.get("progress"));
    if (requestedIndex >= 0) setIndex(requestedIndex);
    if (params.has("progress") && Number.isFinite(requestedProgress)) {
      setProgress(Math.max(0, Math.min(1, requestedProgress)));
    }
    setPaused(params.get("paused") === "true");
    if (params.has("loop")) setLoop(params.get("loop") === "true");
    if (params.has("footer")) setFooter(params.get("footer") !== "false");
    if (params.has("rail")) setFooter(params.get("rail") !== "false");
    setSound(params.get("sound") !== "false");
    const requestedVolume = Number(params.get("volume"));
    if (params.has("volume") && Number.isFinite(requestedVolume)) {
      setVolume(Math.max(0, Math.min(1, requestedVolume)));
    }
    setReady(true);
  }, []);

  // Preloaded Howler sound engine. `?sound=false` disables; `?volume=0..1` trims.
  useDemoSoundEngine({ enabled: sound, volume });

  // Occasional swipe whoosh on scene cuts — alternating, never on the
  // contemplative kicker/end beats, so it stays a surprise, not a metronome.
  const prevSceneRef = useRef<SceneId>(scene);
  const swipeToggleRef = useRef(false);
  useEffect(() => {
    if (prevSceneRef.current === scene) return;
    prevSceneRef.current = scene;
    if (scene === "kicker" || scene === "end") return;
    swipeToggleRef.current = !swipeToggleRef.current;
    if (swipeToggleRef.current) demoSounds.play("swipe");
  }, [scene]);

  // rAF playback. Advances sequentially; loops at the end.
  const ms = SCENES[safeIndex].ms;
  useEffect(() => {
    if (!ready || paused) return;
    let raf = 0;
    const start = performance.now();
    let lastFrame = start - 34;
    let running = true;
    setProgress(0);
    const tick = (now: number) => {
      if (!running) return;
      const p = Math.min(1, (now - start) / ms);
      if (now - lastFrame >= 1000 / 30 || p >= 1) {
        lastFrame = now;
        setProgress(p);
      }
      if (p >= 1) {
        if (safeIndex < SCENES.length - 1) setIndex((i) => i + 1);
        else if (loop) setIndex(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [safeIndex, loop, ms, paused, ready]);

  return (
    <div className="cv-root">
      <CreatorsDemoStyles />
      <div className="cv-stage">
        {ready && <Stage scene={scene} progress={progress} />}
        {/* Hitting "Hide" removes the whole bottom bar — rail and button — for the
          * rest of the session; it only comes back on a page reload. */}
        <AnimatePresence>
          {ready && !minimal && !isEnd && footer && (
            <motion.footer
              key="bottombar"
              className="cv-bottombar"
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: CINE_IN }}
            >
              <ProgressRail scene={scene} onSelect={setIndex} />
              <button
                type="button"
                className="cv-rail-toggle"
                onClick={() => {
                  demoSounds.play("click");
                  setFooter(false);
                }}
              >
                Hide
              </button>
            </motion.footer>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* The filmic cut: each scene enters with its own move; a soft sweep replays. */
function Stage({ scene, progress }: { scene: SceneId; progress: number }) {
  const reduce = useReducedMotion();
  const cut = CUTS[scene];
  return (
    <div className="cv-spotlight">
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          className="cv-cut"
          initial={cut.initial}
          animate={cut.animate}
          exit={{ ...cut.exit, transition: CUT_EXIT }}
          transition={cut.transition}
        >
          <motion.div
            className="cv-float"
          >
            <SceneSwitch scene={scene} progress={progress} />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      {!reduce && (
        <motion.div
          key={scene + "-sweep"}
          className="cv-sweep"
          aria-hidden="true"
          initial={{ x: "-120%", opacity: 0 }}
          animate={{ x: "120%", opacity: [0, 0.45, 0] }}
          transition={{ duration: 1.1, ease: CINE }}
        />
      )}
    </div>
  );
}

function SceneSwitch({ scene, progress }: { scene: SceneId; progress: number }) {
  switch (scene) {
    case "chat":
      return <ChatScene progress={progress} />;
    case "kicker":
      return <KickerScene />;
    case "signin":
      return (
        <div className="cv-focal cv-focal-bleed">
          <Fit width={1180} designHeight={720} label="app.rubiconpay.xyz · sign in">
            <WriterAuthScreen onLogin={() => undefined} demo />
          </Fit>
        </div>
      );
    case "onboard":
      return (
        <div className="cv-focal cv-focal-bleed">
          <Fit width={1040} designHeight={660} label="app.rubiconpay.xyz · get started">
            <SubstackOnboardingDialog shouldOpen forceOpen demo />
          </Fit>
        </div>
      );
    case "import":
      return (
        <div className="cv-focal cv-focal-bleed">
          <Fit width={1280} designHeight={800} label="app.rubiconpay.xyz/dashboard/import/substack">
            <DashboardFrame identity="@marachen" activePath="/dashboard/articles">
              <SubstackImportFlow phase={progress} />
            </DashboardFrame>
          </Fit>
        </div>
      );
    case "publish":
      return (
        <SceneStage
          progress={progress}
          segments={[
            { kind: "text", weight: 1.55, text: "List your writing. Price it per word." },
            { kind: "ui", weight: 6.45, bleed: true, render: () => <Fit width={1280} designHeight={720} label="app.rubiconpay.xyz/dashboard/articles/new"><CreatorPublishFlow compact startAtStep={1} once onAction={playPublishSound} /></Fit> },
          ]}
        />
      );
    case "earn":
      return (
        <SceneStage
          progress={progress}
          segments={[
            { kind: "text", weight: 2.2, text: "You decide what's discoverable. Agents read it. You get paid per word." },
            { kind: "ui", weight: 3.6, bleed: true, flat: true, render: () => <Fit width={1280} designHeight={800} label="app.rubiconpay.xyz/dashboard"><CreatorDashboardPreview embedded /></Fit> },
          ]}
        />
      );
    case "end":
      return <EndScene />;
  }
}

/* ------------------------------------------------------------------ */
/* Fit: scale a fixed-width design surface to fit the stage width      */
/* ------------------------------------------------------------------ */

/**
 * The shipped product components are full-page surfaces. `Fit` renders one at a
 * FIXED `width` × `designHeight` (so it keeps its real desktop layout and a full
 * height — the sidebar fills, nothing collapses) and scales that whole box down
 * to fit the stage, framed like an inserted screen-recording clip. The box size
 * is fixed, so the scale depends only on the (stable) stage size — it does not
 * jitter as the embedded UI's own animations change its content height.
 */
function Fit({
  width,
  designHeight,
  label,
  children,
}: {
  width: number;
  designHeight: number;
  label: string;
  children: React.ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const hostEl = host.current;
    if (!hostEl) return;
    const spotlight = hostEl.closest(".cv-spotlight") as HTMLElement | null;
    const measure = () => {
      const availW = hostEl.clientWidth;
      // Leave room for the clip's chrome bar, a little breathing space, and the
      // lower-third caption that stays pinned beneath the clip during a scene.
      const availH = (spotlight?.clientHeight ?? window.innerHeight) - 128;
      setScale(Math.min(availW / width, availH / designHeight, 1));
    };
    measure();
    // Only re-measure on genuine host-width / viewport changes. We deliberately
    // do NOT observe the spotlight's height: it grows when the bottom bar hides
    // (e.g. on the end scene, or via "Hide"), which would otherwise rescale an
    // already-placed clip mid-scene and read as the dashboard "getting bigger".
    const ro = new ResizeObserver(measure);
    ro.observe(hostEl);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [width, designHeight]);

  const s = scale ?? Math.min(1, 0.6);
  return (
    <div ref={host} className="cv-clip-host" aria-hidden="true">
      <figure
        className="cv-clip"
        style={{ width: width * s, visibility: scale === null ? "hidden" : "visible" }}
      >
        <div className="cv-clip-bar">
          <span className="cv-dot" />
          <span className="cv-dot" />
          <span className="cv-dot" />
          <span className="cv-clip-url mono">{label}</span>
        </div>
        <div className="cv-clip-body" style={{ height: designHeight * s }}>
          <div className="cv-clip-inner" style={{ width, height: designHeight, transform: `scale(${s})` }}>
            {children}
          </div>
        </div>
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SceneStage: plays a scene's segments one at a time (text, then UI)  */
/* ------------------------------------------------------------------ */

type Segment =
  | { kind: "text"; weight: number; text: string }
  // `flat` drops the scale from the entrance/exit — used for large already-scaled
  // surfaces (the dashboard) where a scale cut reads as an unwanted "zoom".
  | { kind: "ui"; weight: number; bleed?: boolean; flat?: boolean; render: (progress: number) => React.ReactNode };

function SceneStage({ progress, segments }: { progress: number; segments: Segment[] }) {
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

  // Text only ever plays on its own, full-stage card *between* the screens —
  // never overlaid on the product UI. Once the UI is on stage, there is no
  // caption; the narration already had its own beat before the cut.
  return (
    <section className="cv-scene">
      <AnimatePresence mode="wait">
        {segment.kind === "text" ? (
          <TextCard key={`t${activeIndex}`} text={segment.text} />
        ) : (
          <motion.div
            key={`u${activeIndex}`}
            className={`cv-focal${segment.bleed ? " cv-focal-bleed" : ""}`}
            initial={{ opacity: 0, transform: segment.flat ? "translateY(16px)" : "translateY(22px) scale(0.98)" }}
            animate={{ opacity: 1, transform: segment.flat ? "translateY(0)" : "translateY(0) scale(1)" }}
            exit={{ opacity: 0, transform: segment.flat ? "translateY(-12px)" : "translateY(-16px) scale(0.99)", transition: { duration: 0.28, ease: CINE_IN } }}
            transition={{ duration: 0.6, ease: CINE }}
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
      className="cv-textcard"
      exit={{ opacity: 0, transform: "translateY(-14px)", transition: { duration: 0.3, ease: CINE_IN } }}
    >
      <h2 className="cv-mainline">
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="cv-mainline-word"
            initial={{ opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ duration: 0.6, ease: CINE, delay: 0.12 + index * 0.045 }}
          >
            {word}
          </motion.span>
        ))}
      </h2>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 1: Chat — two writers sell each other on Rubicon              */
/* ------------------------------------------------------------------ */

type ChatMsg = { from: "them" | "me"; text: string; at: number };

const CHAT: ChatMsg[] = [
  // Bursty, real-texting rhythm rather than an even metronome: the opener holds,
  // a considered reply, then a fast skeptical retort, then the closing line lands
  // quickly — leaving a held rest at the end so the CTA punchline sits.
  { from: "them", text: "everyone's shipping agent stuff and i'm just watching. money's moving and none of it's touching me", at: 0.03 },
  { from: "me", text: "gate your old posts, agents pay per word to read them. made ~$30 first week off that january piece, the nerdy one nobody read lol", at: 0.24 },
  { from: "them", text: "wait that's real? sounds fake", at: 0.52 },
  { from: "me", text: "yea kind of nice getting paid for the stuff i actually cared about", at: 0.66 },
];

function ChatScene({ progress }: { progress: number }) {
  // How many messages are fully in. A message "types" briefly before it lands.
  const shown = CHAT.filter((m) => progress >= m.at).length;
  const next = CHAT[shown]; // the one currently being typed, if any
  // In Messages you only see the *other* person typing — your own messages just appear.
  const typingSide = next && next.from === "them" && progress >= next.at - 0.06 ? "them" : null;

  // iMessage-style pop the moment a bubble lands.
  const prevShownRef = useRef(0);
  useEffect(() => {
    if (shown > prevShownRef.current) {
      demoSounds.play(CHAT[shown - 1]?.from === "me" ? "send" : "receive");
    }
    prevShownRef.current = shown;
  }, [shown]);

  return (
    <div className="cv-imsg">
      {/* macOS Messages toolbar: traffic lights · centered contact · facetime */}
      <div className="cv-imsg-bar">
        <span className="cv-tl cv-tl-r" />
        <span className="cv-tl cv-tl-y" />
        <span className="cv-tl cv-tl-g" />
        <div className="cv-imsg-contact">
          <span className="cv-imsg-avatar">D</span>
          <strong>Dani</strong>
        </div>
        <Video size={17} className="cv-imsg-facetime" aria-hidden="true" />
      </div>

      <div className="cv-imsg-body">
        <div className="cv-imsg-scroll">
          <div className="cv-imsg-stamp">
            <strong>iMessage</strong> · Today 9:41 AM
          </div>
          {CHAT.slice(0, shown).map((message, index) => {
            const followsSameSender = index > 0 && CHAT[index - 1].from === message.from;
            const hasFollowup = index < shown - 1 && CHAT[index + 1].from === message.from;
            return (
              <motion.div
                key={index}
                className={`cv-bubble cv-bubble-${message.from}${followsSameSender ? " is-grouped" : ""}${hasFollowup ? " has-followup" : ""}`}
                initial={{ opacity: 0, y: 12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
              >
                {message.text}
              </motion.div>
            );
          })}
          {typingSide && (
            <motion.div
              key={`typing-${shown}`}
              className={`cv-bubble cv-bubble-${typingSide} cv-bubble-typing`}
              initial={{ opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: CINE }}
            >
              <span className="cv-typing-dot" />
              <span className="cv-typing-dot" />
              <span className="cv-typing-dot" />
            </motion.div>
          )}
        </div>

        {/* iMessage compose field */}
        <div className="cv-imsg-compose">
          <Plus size={17} className="cv-imsg-plus" aria-hidden="true" />
          <div className="cv-imsg-field">
            <span>iMessage</span>
            <span className="cv-imsg-send">
              <ArrowUp size={14} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2: Kicker — the promise, as a beat change                     */
/* ------------------------------------------------------------------ */

function KickerScene() {
  return (
    <div className="cv-kicker">
      <motion.img
        src="/w_logo.png"
        alt=""
        className="cv-kicker-logo"
        initial={{ opacity: 0, y: 18, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: CINE }}
      />
      <motion.p
        className="cv-kicker-eyebrow mono"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: CINE, delay: 0.2 }}
      >
        THE FIX
      </motion.p>
      <h2 className="cv-kicker-line">
        {[
          { t: "Rubicon lets you safely", hot: false },
          { t: " list your articles", hot: true },
          { t: ", accessible to agents on a", hot: false },
          { t: " granular basis", hot: true },
          { t: ".", hot: false },
        ].map((chunk, index) => (
          <motion.span
            key={index}
            className={chunk.hot ? "cv-kicker-hot" : undefined}
            initial={{ opacity: 0, transform: "translateY(16px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ duration: 0.7, ease: CINE, delay: 0.32 + index * 0.05 }}
          >
            {chunk.t}
          </motion.span>
        ))}
      </h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 5: Substack import — bring existing writing in, fast          */
/* ------------------------------------------------------------------ */

const SUBSTACK_POSTS = [
  { title: "The Agent Economy Is Already Here", words: "12,840", price: "0.015" },
  { title: "Why Interfaces Become Markets", words: "9,640", price: "0.013" },
  { title: "AI Distribution After Search", words: "11,320", price: "0.014" },
  { title: "Designing for Autonomous Readers", words: "7,280", price: "0.012" },
];

function SubstackImportFlow({ phase }: { phase: number }) {
  const reduceMotion = useReducedMotion();
  const cursorVisible = phase >= 0.8 && phase < 0.86;
  const pressing = phase >= 0.83 && phase < 0.85;
  const imported = phase >= 0.86;

  // Click the moment the cursor "presses" the import action.
  const prevPressingRef = useRef(false);
  const prevImportedRef = useRef(false);
  useEffect(() => {
    if (pressing && !prevPressingRef.current) demoSounds.play("click");
    prevPressingRef.current = pressing;
  }, [pressing]);
  useEffect(() => {
    if (imported && !prevImportedRef.current) demoSounds.play("success");
    prevImportedRef.current = imported;
  }, [imported]);
  return (
    <div className="grid gap-5">
      <PageHeader
        title="Import Substack export"
        description="We only import published posts and keep your full article text private until it’s paid for."
      />
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface-muted)] text-xs text-[var(--muted)]">
            <tr>
              <th className="p-3"><span className="sr-only">Select</span></th>
              <th className="p-3">Post</th>
              <th className="p-3 text-right">Words</th>
              <th className="p-3 text-right">¢ / word</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {SUBSTACK_POSTS.map((post, index) => (
              <motion.tr
                key={post.title}
                className="border-b border-[var(--line)] last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08, ease: CINE }}
              >
                <td className="p-3 align-middle">
                  <span className="grid h-[18px] w-[18px] place-items-center rounded bg-[var(--ink)] text-white">
                    <Check size={12} />
                  </span>
                </td>
                <td className="p-3 font-medium">{post.title}</td>
                <td className="p-3 text-right tabular-nums">{post.words}</td>
                <td className="p-3 text-right tabular-nums">{post.price}</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#176342]">
                    <Check size={14} /> Ready
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">Agents only pay for the words they read.</p>
        <span className="relative inline-flex">
          <AnimatePresence>
            {imported && !reduceMotion && <ImportCelebration />}
          </AnimatePresence>
          <span className={`button button-primary ${pressing ? "cpf-pressing" : ""}`}>
            {imported ? (
              <>
                <Check size={16} /> Imported
              </>
            ) : (
              "Import selected posts (4)"
            )}
          </span>
          {cursorVisible && !imported && (
            <span className={`cpf-cursor ${pressing ? "is-click" : ""}`} aria-hidden="true">
              <MousePointer2 size={20} fill="#ffffff" stroke="#16181d" strokeWidth={1.5} />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

const IMPORT_CONFETTI = [
  [-118, -188, -62, "#246bfd"], [-92, -224, 46, "#18181b"], [-62, -174, -88, "#62c79b"],
  [-30, -238, 74, "#f0b64d"], [0, -204, -34, "#246bfd"], [32, -232, 84, "#e46d67"],
  [64, -178, -58, "#18181b"], [94, -216, 42, "#62c79b"], [122, -184, -80, "#f0b64d"],
  [-78, -152, 68, "#e46d67"], [-42, -164, -48, "#246bfd"], [46, -158, 58, "#f0b64d"],
  [82, -166, -72, "#e46d67"],
] as const;

function ImportCelebration() {
  return (
    <span className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
      {IMPORT_CONFETTI.map(([x, y, rotate, color], index) => (
        <motion.span
          key={`${x}-${y}`}
          className="absolute bottom-1/2 left-1/2 h-3 w-2 rounded-[2px]"
          style={{ background: color }}
          initial={{ opacity: 0, x: "-50%", y: 0, rotate: 0, scale: 0.92 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: ["-50%", `calc(-50% + ${x * 0.45}px)`, `calc(-50% + ${x}px)`, `calc(-50% + ${x * 1.06}px)`],
            y: [0, y * 0.58, y, y + 58],
            rotate: [0, rotate * 0.45, rotate, rotate + 80],
            scale: [0.92, 1, 0.96, 0.9],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.78, delay: index * 0.018, ease: [0.23, 1, 0.32, 1] }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 8: End card                                                   */
/* ------------------------------------------------------------------ */

function EndScene() {
  const headline = "Let agents discover and pay for your writing.".split(" ");
  return (
    <section className="cv-end">
      <motion.img
        src="/w_logo.png"
        alt="Rubicon"
        className="cv-end-logo"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: CINE }}
      />
      <h2 className="cv-end-title">
        {headline.map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, transform: "translateY(18px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ duration: 0.7, ease: CINE, delay: 0.25 + index * 0.05 }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </h2>
      <motion.p
        className="cv-end-sub"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: CINE, delay: 0.55 }}
      >
        You write. Agents read. Every word is paid for.
      </motion.p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressRail + ambient                                              */
/* ------------------------------------------------------------------ */

function ProgressRail({ scene, onSelect }: { scene: SceneId; onSelect: (index: number) => void }) {
  const current = beatOf[scene];
  return (
    <div className="cv-rail">
      {BEATS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => {
            demoSounds.play("click");
            onSelect(beatTarget[i]);
          }}
          aria-current={i === current ? "step" : undefined}
          className={`cv-beat${i === current ? " is-on" : ""}${i < current ? " is-done" : ""}`}
        >
          <span className="cv-beat-dot" aria-hidden="true" />
          <span className="cv-beat-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scoped styles — white, on-brand                                     */
/* ------------------------------------------------------------------ */

function CreatorsDemoStyles() {
  return (
    <style>{`
      .cv-root {
        /* App palette: monochrome charcoal-on-white. The accent is near-black
         * (--river: #303034 on the creators page; primary buttons #18181b), with
         * pale grey fills (#ededee) and green/amber/red reserved for status. */
        --ink: #16181d;
        --muted: #68686f;
        --line: rgba(18,18,22,0.09);
        --line-strong: rgba(18,18,22,0.16);
        --surface: #ffffff;
        --surface-2: #f5f5f6;
        --accent: #18181b;
        --accent-soft: rgba(18,18,22,0.06);
        --pale: #ededee;
        --green: #176342; --green-bg: #dff5e9;
        --amber: #80520f; --amber-bg: #fff0d5;
        --red: #963b37; --red-bg: #fde4e2;
        /* Force the app's "final" charcoal accent onto every embedded product
         * surface — the river tokens default to blue and only become charcoal
         * under .creators-page, which this route is not. */
        --river: #303034; --river-deep: #1d1d20; --river-pale: #ededee; --river-line: #dedee1; --river-rgb: 48,48,52;
        --ease: cubic-bezier(0.16,1,0.3,1);
        position: fixed; inset: 0; overflow: hidden;
        background: #ffffff; color: var(--ink);
        font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
      }
      .cv-root .mono { font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace); }
      /* .dashboard-theme and .dashboard-data-viz redefine --river to blue and are
       * closer ancestors than .cv-root, so they must be overridden at greater
       * specificity to keep the embedded dashboard/publish charts charcoal. This
       * is scoped to the demo only — the real /dashboard stays as shipped. */
      .cv-root .dashboard-theme,
      .cv-root .dashboard-data-viz {
        --river: #303034; --river-deep: #1d1d20; --river-pale: #ededee; --river-line: #dedee1; --river-rgb: 48,48,52;
      }

      .cv-stage {
        position: relative; z-index: 2; display: flex; flex-direction: column;
        width: min(1320px, 100%); height: 100%; margin-inline: auto;
        padding: clamp(16px,2.6vh,34px) clamp(20px,3.4vw,60px); gap: clamp(10px,1.8vh,20px);
        justify-content: center;
      }
      .cv-spotlight { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
      .cv-cut, .cv-float { display: flex; width: 100%; align-items: center; justify-content: center; }
      .cv-sweep {
        position: absolute; inset-block: 0; left: 0; z-index: 6; width: 34%; transform: skewX(-12deg);
        background: linear-gradient(90deg, transparent, rgba(18,18,22,0.045), transparent); pointer-events: none;
      }

      .cv-scene { position: relative; width: 100%; min-height: 0; display: flex; align-items: center; justify-content: center; }
      .cv-focal { width: 100%; max-width: min(100%, 680px); }
      .cv-focal-bleed { max-width: 100%; }

      /* text card */
      .cv-textcard { text-align: center; max-width: 1000px; padding: 0 16px; }
      .cv-mainline {
        font-size: clamp(1.7rem, 4.4vw, 3.25rem); line-height: 1.08; font-weight: 600; letter-spacing: -0.03em;
        color: var(--ink); display: flex; flex-wrap: wrap; gap: 0.28em; justify-content: center;
      }
      .cv-mainline-word { display: inline-block; }

      /* kicker — the promise */
      .cv-kicker { position: relative; display: grid; justify-items: center; text-align: center; gap: 14px; padding: 0 18px; max-width: 1040px; }
      .cv-kicker-logo { position: relative; z-index: 1; width: 54px; height: 54px; object-fit: contain; }
      .cv-kicker-eyebrow { position: relative; z-index: 1; font-size: 0.72rem; letter-spacing: 0.22em; color: var(--muted); font-weight: 600; }
      .cv-kicker-line { position: relative; z-index: 1; font-size: clamp(1.6rem, 4vw, 3rem); line-height: 1.18; font-weight: 600; letter-spacing: -0.03em; max-width: 18ch; }
      .cv-kicker-line span { display: inline; }
      .cv-kicker-hot { background: linear-gradient(transparent 58%, var(--pale) 58%); border-radius: 2px; }

      .cv-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(18,18,22,0.13); }

      /* Fit: a real product surface, scaled down + framed like an inserted clip */
      .cv-clip-host { width: 100%; display: flex; justify-content: center; }
      .cv-clip {
        margin: 0; max-width: 100%; border-radius: 14px; overflow: hidden;
        border: 1px solid var(--line-strong); background: #fff;
      }
      .cv-clip-bar { display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 13px; border-bottom: 1px solid var(--line); background: var(--surface-2); }
      .cv-clip-url { margin-left: 10px; font-size: 0.66rem; color: var(--muted); }
      .cv-clip-body { position: relative; overflow: hidden; }
      .cv-clip-inner { transform-origin: top left; }
      /* Make the shipped surfaces fill the fixed box height: the dashboard reads
       * like a real desktop window and its left sidebar stays full height. */
      .cv-clip-inner .min-h-screen { min-height: 0 !important; }
      .cv-clip-inner .dashboard-canvas { min-height: 100% !important; height: 100%; }
      .cv-clip-inner .creator-dashboard-preview-embed,
      .cv-clip-inner .creator-publish-flow { height: 100%; }
      /* Fill the frame: the wizard and its active step stretch to the bottom so
       * the review card reaches the bottom of the browser mock (as it used to). */
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .dashboard-main { display: flex; flex-direction: column; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .dashboard-main > div:last-child { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-wizard { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-step { flex: 1; min-height: 0; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-step > * { height: 100%; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .substack-compose-main { padding: 20px 20px 24px; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .substack-title-input { font-size: 2.15rem; line-height: 1.04; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .substack-subtitle-input { margin-top: 7px; font-size: 1.3rem; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-import-options { margin-block: 16px 12px; gap: 8px; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-import-options p { margin-top: 2px; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-manual-editor .substack-editor { min-height: 128px; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-review-card { padding: 16px; }
      /* The review step is the tallest: tighten its rows/gaps so the whole card —
       * including the bottom action buttons and note — fits inside the frame and
       * never clips (the mt-auto action row then sits flush at the bottom). */
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-review-list { margin-top: 12px; padding: 10px 12px; gap: 2px; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-review-list > div { padding-top: 5px; padding-bottom: 5px; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-review-actions { margin-top: 12px; padding-top: 12px; }
      .cv-clip-inner .creator-publish-flow[data-compact="true"] .cpf-review-note { margin-top: 6px; }
      .cv-clip-inner .dashboard-sidebar { height: 100% !important; }
      .cv-clip-inner .dashboard-main { min-height: 100%; }
      .cv-clip-inner .writer-auth-screen, .cv-clip-inner .writer-auth-card { min-height: 100% !important; height: 100%; }
      /* The onboarding dialog renders fixed inset-0; contain it to the box. */
      .cv-clip-inner .fixed.inset-0 { position: absolute; }

      /* chat (opening) — macOS Messages window, monochrome bubbles */
      .cv-imsg {
        width: min(470px, 92vw); height: min(580px, 72vh); display: flex; flex-direction: column;
        background: #fff; border: 1px solid var(--line-strong); border-radius: 16px; overflow: hidden;
      }
      .cv-imsg-bar { position: relative; display: flex; align-items: center; gap: 8px; height: 62px; padding: 10px 16px 0; border-bottom: 1px solid var(--line); background: #f6f6f6; }
      .cv-tl { width: 12px; height: 12px; border-radius: 50%; }
      .cv-tl-r { background: #ff5f57; } .cv-tl-y { background: #febc2e; } .cv-tl-g { background: #28c840; }
      .cv-imsg-contact { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 3px; }
      .cv-imsg-avatar { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--ink); color: #fff; font-weight: 600; font-size: 0.7rem; }
      .cv-imsg-contact strong { font-size: 0.78rem; font-weight: 600; letter-spacing: -0.01em; }
      .cv-imsg-facetime { margin-left: auto; color: #8aa0c4; opacity: 0.55; }
      .cv-imsg-body { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .cv-imsg-scroll { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; padding: 16px 20px 10px; overflow: hidden; }
      .cv-imsg-stamp { text-align: center; font-size: 0.68rem; color: #9b9ba2; padding: 4px 0 10px; }
      .cv-imsg-stamp strong { font-weight: 600; color: #6f6f77; }
      .cv-bubble {
        position: relative; max-width: 78%; padding: 9px 14px; border-radius: 18px; font-size: 0.9rem;
        line-height: 1.35; letter-spacing: -0.008em; overflow-wrap: anywhere; margin-top: 6px;
      }
      .cv-bubble.is-grouped { margin-top: 1px; }
      .cv-bubble-them { align-self: flex-start; background: #e9e9eb; color: #111114; }
      /* Authentic iMessage blue for the outgoing bubbles (the chat is a real
       * Messages window, not Rubicon's own UI). */
      .cv-bubble-me { align-self: flex-end; background: #1f8aff; color: #fff; }
      /* Two overlapping curves make the tail grow naturally from the bubble;
       * the white cutout removes the blunt outer half of the colored circle. */
      .cv-bubble:not(.has-followup)::before,
      .cv-bubble:not(.has-followup)::after { content: ""; position: absolute; bottom: 0; height: 18px; }
      .cv-bubble-them:not(.has-followup)::before { left: -7px; width: 18px; background: inherit; border-bottom-right-radius: 14px; }
      .cv-bubble-them:not(.has-followup)::after { left: -10px; width: 10px; background: #fff; border-bottom-right-radius: 9px; }
      .cv-bubble-me:not(.has-followup)::before { right: -7px; width: 18px; background: inherit; border-bottom-left-radius: 14px; }
      .cv-bubble-me:not(.has-followup)::after { right: -10px; width: 10px; background: #fff; border-bottom-left-radius: 9px; }
      .cv-bubble-typing { display: inline-flex; align-items: center; gap: 4px; padding: 12px 14px; }
      .cv-typing-dot { width: 7px; height: 7px; border-radius: 50%; background: #9b9ba2; animation: cv-typing 1.3s infinite ease-in-out; }
      .cv-typing-dot:nth-child(2) { animation-delay: 0.18s; }
      .cv-typing-dot:nth-child(3) { animation-delay: 0.36s; }
      @keyframes cv-typing { 0%,60%,100% { transform: translateY(0); opacity: 0.45; } 30% { transform: translateY(-4px); opacity: 0.95; } }
      .cv-imsg-compose { display: flex; align-items: center; gap: 10px; padding: 10px 14px 12px; }
      .cv-imsg-plus { color: #b7b7be; flex-shrink: 0; }
      .cv-imsg-field { flex: 1; display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 6px 0 13px; border: 1px solid var(--line-strong); border-radius: 999px; font-size: 0.84rem; color: #9b9ba2; }
      .cv-imsg-send { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #e3e3e6; color: #fff; }

      /* end */
      .cv-end { position: relative; display: grid; justify-items: center; text-align: center; gap: 18px; padding: 0 20px; }
      .cv-end-logo { position: relative; z-index: 1; width: 64px; height: 64px; object-fit: contain; }
      .cv-end-title { position: relative; z-index: 1; font-size: clamp(1.8rem,4.6vw,3.4rem); font-weight: 650; letter-spacing: -0.03em; line-height: 1.08; max-width: 16ch; }
      .cv-end-sub { position: relative; z-index: 1; font-size: clamp(0.95rem,1.6vw,1.2rem); color: var(--muted); }

      /* progress rail */
      .cv-bottombar { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 6px; }
      .cv-rail-toggle {
        display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px;
        background: rgba(255,255,255,0.94); border: 1px solid var(--line); cursor: pointer;
        color: var(--muted); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.02em;
        transition: color 160ms var(--ease), transform 140ms var(--ease);
      }
      .cv-rail-toggle:hover { color: var(--ink); }
      .cv-rail-toggle:active { transform: scale(0.97); }
      .cv-rail { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 999px; background: rgba(255,255,255,0.94); border: 1px solid var(--line); }
      .cv-beat { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; background: transparent; border: 0; cursor: pointer; color: var(--muted); font-size: 0.74rem; font-weight: 600; transition: color 160ms var(--ease), background 160ms var(--ease), transform 140ms var(--ease); }
      .cv-beat:active { transform: scale(0.97); }
      .cv-beat-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(17,19,28,0.18); transition: background 200ms var(--ease); }
      .cv-beat.is-done { color: var(--ink); }
      .cv-beat.is-done .cv-beat-dot { background: var(--green); }
      .cv-beat.is-on { color: var(--ink); background: var(--accent-soft); }
      .cv-beat.is-on .cv-beat-dot { background: var(--accent); outline: 3px solid rgba(18,18,22,0.12); }

      @media (max-width: 720px) {
        .cv-beat-label { display: none; }
      }
    `}</style>
  );
}
