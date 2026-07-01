"use client";

/**
 * Self-contained UI sound effects for the scripted product demos.
 *
 * Sounds are synthesized with the Web Audio API (no asset files), following the
 * `sounds-on-the-web` rules:
 *  - subtle default volume (impl-default-subtle)
 *  - preloaded noise buffer + lazily-warmed context (impl-preload-audio)
 *  - exponential gain ramps for natural decay (easing-natural-decay)
 *  - respects prefers-reduced-motion as a proxy for sound sensitivity
 *    (a11y-reduced-motion-check)
 *  - respects an explicit `?sound=false` toggle wired from the page
 *    (a11y-toggle-setting)
 *  - every cue maps to a visible event (a11y-visual-equivalent)
 *
 * Browsers gate audio behind a user gesture; a one-time pointerdown/keydown
 * listener resumes the context so the first real interaction unlocks playback.
 */

import { useEffect } from "react";

export type DemoSound = "click" | "pop" | "swipe";

const DEFAULT_VOLUME = 0.2;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = true;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = DEFAULT_VOLUME;
    master.connect(ctx.destination);
  }
  return ctx;
}

function getNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const len = Math.floor(c.sampleRate * 0.25);
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function env(gain: GainNode, t: number, peak: number, attack: number, decay: number) {
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function playClick() {
  const c = ensureCtx();
  if (!c || !master) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(1400, t);
  o.frequency.exponentialRampToValueAtTime(520, t + 0.045);
  const g = c.createGain();
  env(g, t, 0.5, 0.002, 0.05);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.07);
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2200;
  bp.Q.value = 0.9;
  const ng = c.createGain();
  env(ng, t, 0.32, 0.001, 0.035);
  src.connect(bp);
  bp.connect(ng);
  ng.connect(master);
  src.start(t);
  src.stop(t + 0.06);
}

function playPop() {
  const c = ensureCtx();
  if (!c || !master) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(920, t);
  o.frequency.exponentialRampToValueAtTime(360, t + 0.1);
  const g = c.createGain();
  env(g, t, 0.42, 0.006, 0.11);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.14);
}

function playSwipe() {
  const c = ensureCtx();
  if (!c || !master) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(420, t);
  bp.frequency.exponentialRampToValueAtTime(2800, t + 0.2);
  const g = c.createGain();
  env(g, t, 0.26, 0.05, 0.24);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + 0.32);
}

export const demoSounds = {
  setEnabled(value: boolean) {
    enabled = value;
  },
  play(name: DemoSound) {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ensureCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume().catch(() => undefined);
    if (name === "click") playClick();
    else if (name === "pop") playPop();
    else if (name === "swipe") playSwipe();
  },
};

export function useDemoSoundEngine(opts: { enabled: boolean }) {
  useEffect(() => {
    demoSounds.setEnabled(opts.enabled);
    if (!opts.enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const unlock = () => {
      const c = ensureCtx();
      if (c && c.state === "suspended") c.resume().catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [opts.enabled]);
}
