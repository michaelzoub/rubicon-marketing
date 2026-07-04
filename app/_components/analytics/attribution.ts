"use client";

import posthog from "posthog-js";

/* =============================================================================
 * Writer outreach attribution
 *
 * Personalized outreach links look like:
 *   https://rubiconpay.xyz/?ref=writer_outreach&target=dwarkesh
 *     &utm_source=outreach&utm_medium=dm&utm_campaign=writer_pilot
 *
 * On first page load we read those params, persist them in localStorage so
 * attribution survives navigation into /dashboard, and register them as
 * PostHog super properties so every event carries them. First-touch is never
 * overwritten (unless `force_ref=1`); latest-touch always updates.
 * ==========================================================================*/

export const FIRST_TOUCH_KEY = "rubicon_first_touch_attribution";
export const LATEST_TOUCH_KEY = "rubicon_latest_touch_attribution";

export interface AttributionParams {
  referral_code?: string;
  /** Normalized handle — leading `@` stripped. */
  referral_target?: string;
  /** The handle exactly as it appeared in the URL (may keep the `@`). */
  referral_target_display?: string;
  /** Normalized outreach handle; defaults to the normalized `target`. */
  outreach_handle?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface FirstTouchAttribution extends AttributionParams {
  first_landing_path: string;
  first_landing_at: string;
}

export interface LatestTouchAttribution extends AttributionParams {
  latest_landing_path: string;
  latest_landing_at: string;
}

export type AttributionType = "first_touch" | "latest_touch" | "both";

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

function readStored<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can be unavailable (private mode); attribution is best-effort.
  }
}

export function readFirstTouch(): FirstTouchAttribution | null {
  return readStored<FirstTouchAttribution>(FIRST_TOUCH_KEY);
}

export function readLatestTouch(): LatestTouchAttribution | null {
  return readStored<LatestTouchAttribution>(LATEST_TOUCH_KEY);
}

/** Attribution params present in the current URL, or null if there are none. */
function readParamsFromUrl(): { params: AttributionParams; forceRef: boolean } | null {
  if (typeof window === "undefined") return null;
  const search = new URLSearchParams(window.location.search);
  const ref = search.get("ref");
  const target = search.get("target");
  const utmSource = search.get("utm_source");
  const utmMedium = search.get("utm_medium");
  const utmCampaign = search.get("utm_campaign");
  if (!ref && !target && !utmSource && !utmCampaign) return null;

  const params: AttributionParams = {};
  if (ref) params.referral_code = ref;
  if (target) {
    params.referral_target = normalizeHandle(target);
    if (target !== params.referral_target) params.referral_target_display = target;
    params.outreach_handle = params.referral_target;
  }
  if (utmSource) params.utm_source = utmSource;
  if (utmMedium) params.utm_medium = utmMedium;
  if (utmCampaign) params.utm_campaign = utmCampaign;
  return { params, forceRef: search.get("force_ref") === "1" };
}

/**
 * The flat referral properties every analytics event should carry.
 * First-touch wins; latest-touch fills any gaps.
 */
export function referralEventProperties(): AttributionParams {
  const first = readFirstTouch();
  const latest = readLatestTouch();
  return {
    referral_code: first?.referral_code ?? latest?.referral_code,
    referral_target: first?.referral_target ?? latest?.referral_target,
    outreach_handle: first?.outreach_handle ?? latest?.outreach_handle,
    utm_source: first?.utm_source ?? latest?.utm_source,
    utm_medium: first?.utm_medium ?? latest?.utm_medium,
    utm_campaign: first?.utm_campaign ?? latest?.utm_campaign,
  };
}

function registerSuperProperties(): void {
  const canonical = Object.fromEntries(
    Object.entries(referralEventProperties()).filter(([, v]) => v != null),
  );
  const latest = readLatestTouch();
  const latestPrefixed = latest
    ? Object.fromEntries(
        Object.entries(latest)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k.startsWith("latest_") ? k : `latest_${k}`, v]),
      )
    : {};
  if (Object.keys(canonical).length || Object.keys(latestPrefixed).length) {
    posthog.register({ ...canonical, ...latestPrefixed });
  }
}

/**
 * Read attribution params from the URL, persist first/latest touch, and
 * register super properties. Returns what changed so the caller can fire
 * `referral_captured`, or null when the URL carried no attribution.
 *
 * Runs once per full page load (from <AttributionCapture /> in the root
 * layout). Even without URL params it re-registers stored attribution so
 * super properties survive a cleared PostHog state.
 */
export function captureAttributionFromUrl(): {
  attribution_type: AttributionType;
  params: AttributionParams;
} | null {
  if (typeof window === "undefined") return null;

  const fromUrl = readParamsFromUrl();
  if (!fromUrl) {
    registerSuperProperties();
    return null;
  }

  const { params, forceRef } = fromUrl;
  const now = new Date().toISOString();
  const path = window.location.pathname;

  const existingFirst = readFirstTouch();
  const wroteFirst = !existingFirst || forceRef;
  if (wroteFirst) {
    writeStored(FIRST_TOUCH_KEY, { ...params, first_landing_path: path, first_landing_at: now });
  }
  writeStored(LATEST_TOUCH_KEY, { ...params, latest_landing_path: path, latest_landing_at: now });

  registerSuperProperties();

  return { attribution_type: wroteFirst ? "both" : "latest_touch", params };
}

/**
 * Attach stored attribution to the PostHog person. Call after sign-in so the
 * identified writer keeps their outreach source: first-touch is set-once,
 * latest-touch overwrites.
 */
export function attachAttributionToPerson(): void {
  const first = readFirstTouch();
  const latest = readLatestTouch();
  if (!first && !latest) return;
  const set: Record<string, unknown> = {};
  if (latest) {
    for (const [k, v] of Object.entries(latest)) {
      if (v != null) set[k.startsWith("latest_") ? k : `latest_${k}`] = v;
    }
  }
  const setOnce: Record<string, unknown> = {};
  if (first) {
    for (const [k, v] of Object.entries(first)) {
      if (v != null) setOnce[k] = v;
    }
  }
  posthog.setPersonProperties(set, setOnce);
}
