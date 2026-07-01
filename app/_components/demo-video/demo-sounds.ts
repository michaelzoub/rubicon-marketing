"use client";

/**
 * Self-contained UI sound effects for the scripted product demos.
 *
 * Message cues use the native macOS Messages sounds; the remaining cues come
 * from the professionally designed `@web-kits/audio` Core patch, following the
 * `sounds-on-the-web` rules:
 *  - subtle default volume (impl-default-subtle)
 *  - eager message-asset preload (impl-preload-audio)
 *  - respects prefers-reduced-motion as a proxy for sound sensitivity
 *    (a11y-reduced-motion-check)
 *  - respects an explicit `?sound=false` toggle wired from the page
 *    (a11y-toggle-setting)
 *  - every cue maps to a visible event (a11y-visual-equivalent)
 *
 * Browsers gate audio behind a user gesture; a one-time pointerdown/keydown
 * listener resumes the context so the first real interaction unlocks playback.
 */

import { definePatch, ensureReady, setMasterVolume } from "@web-kits/audio";
import { useEffect } from "react";
import { _patch as corePatch } from "../../../.web-kits/core";

export type DemoSound = "click" | "receive" | "send" | "success" | "swipe";

let enabled = true;

const patch = definePatch(corePatch);
const messageSounds: Partial<Record<DemoSound, HTMLAudioElement>> | null =
  typeof window === "undefined"
    ? null
    : {
        send: new Audio("/sounds/message-sent.wav"),
        receive: new Audio("/sounds/message-received.wav"),
      };

messageSounds && Object.values(messageSounds).forEach((sound) => sound.load());

const PATCH_SOUND: Partial<Record<DemoSound, string>> = {
  click: "click",
  success: "success",
  swipe: "swoosh",
};

export const demoSounds = {
  setEnabled(value: boolean) {
    enabled = value;
  },
  setVolume(value: number) {
    const volume = Math.max(0, Math.min(1, value));
    setMasterVolume(volume * 0.72);
    if (messageSounds) {
      Object.values(messageSounds).forEach((sound) => {
        sound.volume = volume * 0.28;
      });
    }
  },
  play(name: DemoSound) {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const messageSound = messageSounds?.[name];
    if (messageSound) {
      messageSound.currentTime = 0;
      void messageSound.play().catch(() => undefined);
      return;
    }
    const patchSound = PATCH_SOUND[name];
    if (patchSound) patch.play(patchSound);
  },
};

export function useDemoSoundEngine(opts: { enabled: boolean; volume?: number }) {
  useEffect(() => {
    demoSounds.setEnabled(opts.enabled);
    demoSounds.setVolume(opts.volume ?? 1);
    if (!opts.enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const unlock = () => {
      void ensureReady();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [opts.enabled, opts.volume]);
}
