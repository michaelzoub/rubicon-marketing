"use client";

import posthog from "posthog-js";

import { referralEventProperties, type AttributionParams } from "./attribution";

/* =============================================================================
 * Rubicon analytics wrapper
 *
 * One disciplined event vocabulary for the marketing site + creator dashboard.
 * Components should NEVER call `posthog.capture()` directly — import a helper
 * from here so every event carries the same baseline context, names stay stable,
 * and sensitive material is never shipped to PostHog.
 *
 * Canonical event names:
 *   page_viewed
 *   section_viewed
 *   marketing_cta_clicked
 *   nav_clicked
 *   external_link_clicked
 *   copy_action_completed
 *   marketing_visual_interacted
 *   funnel_step_completed
 *   referral_captured
 *   writer_exit_intent_opened
 *   writer_objection_selected
 *   writer_exit_confirmed
 *   writer_exit_cancelled
 *   writer_page_viewed / writer_cta_clicked / app_opened_from_marketing /
 *   signup_started / signup_completed / wallet_connected / import_started /
 *   import_completed / import_failed / price_set / article_published /
 *   writer_pilot_cta_clicked / writer_concierge_setup_clicked
 *
 * Legacy event names (e.g. `start_publishing_clicked`) are kept as
 * backwards-compatible aliases in `analytics-links.tsx` so existing PostHog
 * insights keep working, but the canonical event above is the source of truth.
 * ==========================================================================*/

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type Audience = "creator" | "developer" | "agent" | "mixed";

export type CtaIntent =
  | "publish"
  | "setup_agent"
  | "book_demo"
  | "watch_demo"
  | "read_docs"
  | "inspect_code"
  | "fund_wallet"
  | "explore"
  | "copy_prompt"
  | "copy_install";

export type CtaPosition = "header" | "hero" | "section" | "bottom" | "footer";

export type CtaTargetType = "app" | "internal_page" | "external" | "copy";

/** Properties shared by every event. Computed from the browser at capture time. */
interface BaseProperties extends AttributionParams {
  current_url: string;
  pathname: string;
  referrer: string;
  timestamp_client: string;
}

/** The full CTA payload — every CTA event carries all of these. */
export interface CtaProperties extends BaseProperties {
  cta_id: string;
  label: string;
  page: string;
  section: string;
  audience: Audience;
  intent: CtaIntent;
  position: CtaPosition;
  target_type: CtaTargetType;
  target_url?: string;
}

// ---------------------------------------------------------------------------
// Internal: baseline context + sanitisation
// ---------------------------------------------------------------------------

function readBaseProperties(): BaseProperties {
  if (typeof window === "undefined") {
    return { current_url: "", pathname: "", referrer: "", timestamp_client: new Date().toISOString() };
  }
  return {
    current_url: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer,
    timestamp_client: new Date().toISOString(),
    // Outreach attribution (referral_code, referral_target, outreach_handle,
    // utm_*) rides on every event so writer funnels can always be sliced by
    // where the writer came from.
    ...referralEventProperties(),
  };
}

/**
 * Strip anything we promised never to send. PostHog property values are sparse
 * here on purpose — we only ever accept primitives and never raw article
 * bodies, tokens, wallet secrets, payment credentials, or full emails.
 */
// `auth` is word-bounded so legitimate keys like `authenticated` and
// `outreach_handle` survive while `auth_token` / `authorization` are dropped.
const SENSITIVE_KEY = /token|secret|password|credential|api[_-]?key|cookie|(^|_)auth(orization)?(_|$)/i;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const WALLET_RE = /0x[a-fA-F0-9]{40}/g;

function sanitise(properties: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (typeof value === "string") {
      const stripped = value.replace(EMAIL_RE, "[email]").replace(WALLET_RE, "[wallet]");
      cleaned[key] = stripped.slice(0, 500);
    } else if (typeof value === "number" || typeof value === "boolean") {
      cleaned[key] = value;
    } else if (value == null) {
      continue;
    } else {
      cleaned[key] = String(value).slice(0, 500);
    }
  }
  return cleaned;
}

function capture(eventName: string, properties: object = {}): void {
  const payload = sanitise({ ...readBaseProperties(), ...properties });
  if (process.env.NODE_ENV !== "production") {
    // Keep noisy analytics off the console in prod; useful while developing.
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${eventName}`, payload);
  }
  posthog.capture(eventName, payload);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type PageId = "home" | "creators" | "developers" | "explore" | "demo_video";

export interface PageViewProperties {
  page: PageId;
  audience: Audience;
  /** Optional first-touch source (e.g. "substack", "x", "calendly"). */
  source?: string;
}

export function trackPageViewed(properties: PageViewProperties): void {
  capture("page_viewed", properties);
  // Writer-funnel mirror: creator-audience pages double as the top of the
  // writer conversion funnel (`writer_page_viewed` → `writer_cta_clicked`).
  if (properties.audience === "creator") {
    trackWriterFunnel("writer_page_viewed", { page: properties.page, source: properties.source });
  }
}

export interface SectionViewProperties {
  page: string;
  section: string;
  section_index: number;
}

export function trackSectionViewed(properties: SectionViewProperties): void {
  capture("section_viewed", properties);
}

export interface MarketingCtaProperties {
  cta_id: string;
  label: string;
  page: string;
  section: string;
  audience: Audience;
  intent: CtaIntent;
  position: CtaPosition;
  target_type: CtaTargetType;
  target_url?: string;
}

export function trackMarketingCtaClicked(properties: MarketingCtaProperties): void {
  capture("marketing_cta_clicked", properties);
  // Writer-funnel mirror: any creator-audience CTA counts as writer_cta_clicked
  // so the Writer Conversion dashboard doesn't depend on per-callsite wiring.
  if (properties.audience === "creator") {
    trackWriterFunnel("writer_cta_clicked", {
      cta_id: properties.cta_id,
      label: properties.label,
      page: properties.page,
      section: properties.section,
    });
  }
}

export interface NavClickProperties {
  cta_id: string;
  label: string;
  page: string;
  section: string;
  target_type: CtaTargetType;
  target_url?: string;
}

export function trackNavClicked(properties: NavClickProperties): void {
  capture("nav_clicked", properties);
}

export interface ExternalLinkProperties {
  cta_id: string;
  label: string;
  page: string;
  section: string;
  target_url: string;
}

export function trackExternalLinkClicked(properties: ExternalLinkProperties): void {
  capture("external_link_clicked", properties);
}

export interface CopyActionProperties {
  cta_id: string;
  label: string;
  page: string;
  section: string;
  audience: Audience;
  intent: CtaIntent;
}

export function trackCopyActionCompleted(properties: CopyActionProperties): void {
  capture("copy_action_completed", properties);
}

export interface VisualInteractionProperties {
  page: string;
  section: string;
  visual_id: string;
  interaction: "hovered" | "viewed" | "started" | "completed";
}

export function trackVisualInteracted(properties: VisualInteractionProperties): void {
  capture("marketing_visual_interacted", properties);
}

// ---------------------------------------------------------------------------
// Product funnel events
//
// These only fire where a real flow exists in this repo (creator dashboard:
// sign-in, wallet, Substack import, article upload/price/publish). The agent
// buyer-side funnel (paid streaming, payments) lives in the agent SDK / x402
// gateway and is NOT instrumented here — see docs/analytics.md "Pending".
// ---------------------------------------------------------------------------

export type FunnelStep =
  | "signup_started"
  | "signup_completed"
  | "wallet_connected"
  | "substack_import_started"
  | "substack_import_completed"
  | "substack_import_failed"
  | "article_uploaded"
  | "article_published"
  | "article_price_set"
  // Agent/buyer-side steps. Kept in the vocabulary so PostHog insights can be
  // pre-created; they fire from the agent SDK / backend, not this repo.
  | "agent_request_received"
  | "article_metadata_viewed"
  | "paid_stream_started"
  | "paid_words_streamed"
  | "payment_authorized"
  | "payment_settled"
  | "payment_failed"
  | "paid_stream_completed"
  | "paid_stream_abandoned";

export interface FunnelStepProperties {
  step: FunnelStep;
  // Common, all-optional funnel context. Only send what the flow has.
  source?: "substack" | "manual" | "api";
  article_id?: string;
  author_id?: string;
  word_count?: number;
  price_per_word?: number;
  import_duration_ms?: number;
  agent_id?: string;
  buyer_id?: string;
  session_id?: string;
  paid_words?: number;
  amount_atomic?: string;
  amount_usd?: number;
  budget_cap?: number;
  stream_duration_ms?: number;
  error_code?: string;
}

export function trackFunnelStepCompleted(properties: FunnelStepProperties): void {
  capture("funnel_step_completed", properties);
}

// ---------------------------------------------------------------------------
// Once-per-session guard for visual interactions
//
// "Do not over-track every animation frame. Once per session/page for each
// major visual is enough." We key on `page:visual_id` so the same visual on a
// different page still records, but a looping animation never spams.
// ---------------------------------------------------------------------------

const SESSION_KEY = "rubicon.analytics.firedVisuals";

function firedVisuals(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function rememberVisual(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = firedVisuals();
    set.add(key);
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
  } catch {
    // sessionStorage can throw in private mode; the guard is best-effort.
  }
}

/**
 * Fire a visual interaction once per page load per session. Returns true if it
 * fired (so callers can skip other work), false if it was already recorded.
 */
export function trackVisualOnce(properties: VisualInteractionProperties): boolean {
  const key = `${properties.page}:${properties.visual_id}`;
  const set = firedVisuals();
  if (set.has(key)) return false;
  trackVisualInteracted(properties);
  rememberVisual(key);
  return true;
}

// ---------------------------------------------------------------------------
// Writer conversion funnel
//
// Flat, canonical event names (not funnel_step_completed) so PostHog funnels
// can be built directly on them. Everything here auto-carries
// `user_type: "writer"` plus the outreach attribution from the base props.
// ---------------------------------------------------------------------------

export type WriterFunnelEvent =
  // Core listing funnel
  | "writer_page_viewed"
  | "writer_cta_clicked"
  | "app_opened_from_marketing"
  | "signup_started"
  | "signup_completed"
  | "wallet_connected"
  | "import_started"
  | "import_completed"
  | "import_failed"
  | "price_set"
  | "article_published"
  // Pilot / concierge funnel
  | "writer_pilot_cta_clicked"
  | "writer_concierge_setup_clicked"
  | "setup_call_booked"
  | "article_submitted_for_setup"
  | "manual_import_completed"
  | "writer_preview_sent"
  | "writer_approved_listing";

export type ImportMethod = "substack_export" | "url" | "markdown_upload" | "chrome_extension" | "manual";

export interface WriterFunnelProperties {
  page?: string;
  section?: string;
  cta_id?: string;
  label?: string;
  intent?: string;
  flow_step?: string;
  step_index?: number;
  source?: string;
  import_method?: ImportMethod;
  article_id?: string;
  word_count?: number;
  /** Always USD per word, regardless of what the flow's UI displays. */
  price_per_word?: number;
  wallet_connected?: boolean;
  error_code?: string;
}

export function trackWriterFunnel(event: WriterFunnelEvent, properties: WriterFunnelProperties = {}): void {
  rememberWriterFunnelState(event);
  capture(event, { user_type: "writer", ...properties });
}

// Session-scoped memory of how far this writer got, so drop-off prompts can
// report `signup_completed` / `wallet_connected` / `article_import_started`
// without re-deriving auth state.
const WRITER_STATE_KEY = "rubicon_writer_funnel_state";

export interface WriterFunnelState {
  signup_completed: boolean;
  wallet_connected: boolean;
  article_import_started: boolean;
}

export function writerFunnelState(): WriterFunnelState {
  const empty: WriterFunnelState = { signup_completed: false, wallet_connected: false, article_import_started: false };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.sessionStorage.getItem(WRITER_STATE_KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<WriterFunnelState>) } : empty;
  } catch {
    return empty;
  }
}

function rememberWriterFunnelState(event: WriterFunnelEvent): void {
  const patch: Partial<WriterFunnelState> =
    event === "signup_completed"
      ? { signup_completed: true }
      : event === "wallet_connected"
        ? { wallet_connected: true }
        : event === "import_started"
          ? { article_import_started: true }
          : {};
  if (!Object.keys(patch).length || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(WRITER_STATE_KEY, JSON.stringify({ ...writerFunnelState(), ...patch }));
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Writer exit intent + objection capture
// ---------------------------------------------------------------------------

export type WriterObjection =
  | "not_sure_agents_will_pay"
  | "pricing_unclear"
  | "wallet_concern"
  | "content_exposure_concern"
  | "setup_too_much_work"
  | "waiting_for_mainnet"
  | "just_browsing"
  | "other";

export interface WriterExitProperties {
  page: string;
  section: string;
  flow_step: string;
  objection?: WriterObjection;
  signup_completed?: boolean;
  wallet_connected?: boolean;
  article_import_started?: boolean;
  authenticated?: boolean;
}

function captureWriterExit(event: string, properties: WriterExitProperties): void {
  capture(event, { user_type: "writer", ...writerFunnelState(), ...properties });
}

export function trackWriterExitIntentOpened(properties: WriterExitProperties): void {
  captureWriterExit("writer_exit_intent_opened", properties);
}

export function trackWriterObjectionSelected(properties: WriterExitProperties & { objection: WriterObjection }): void {
  captureWriterExit("writer_objection_selected", properties);
}

export function trackWriterExitConfirmed(properties: WriterExitProperties): void {
  captureWriterExit("writer_exit_confirmed", properties);
}

export function trackWriterExitCancelled(properties: WriterExitProperties): void {
  captureWriterExit("writer_exit_cancelled", properties);
}

// ---------------------------------------------------------------------------
// Referral capture
// ---------------------------------------------------------------------------

export interface ReferralCapturedProperties extends AttributionParams {
  attribution_type: "first_touch" | "latest_touch" | "both";
}

export function trackReferralCaptured(properties: ReferralCapturedProperties): void {
  capture("referral_captured", properties);
}

export { readBaseProperties };