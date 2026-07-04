// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn(), register: vi.fn(), setPersonProperties: vi.fn() },
}));

import posthog from "posthog-js";
import {
  trackCopyActionCompleted,
  trackExternalLinkClicked,
  trackFunnelStepCompleted,
  trackMarketingCtaClicked,
  trackNavClicked,
  trackPageViewed,
  trackReferralCaptured,
  trackSectionViewed,
  trackVisualInteracted,
  trackWriterExitCancelled,
  trackWriterExitConfirmed,
  trackWriterExitIntentOpened,
  trackWriterFunnel,
  trackWriterObjectionSelected,
  writerFunnelState,
} from "./events";
import { FIRST_TOUCH_KEY } from "./attribution";

const capture = vi.mocked(posthog.capture);

function lastEvent(name: string): Record<string, unknown> {
  const call = [...capture.mock.calls].reverse().find(([event]) => event === name);
  expect(call, `expected a captured "${name}" event`).toBeDefined();
  return call![1] as Record<string, unknown>;
}

beforeEach(() => {
  capture.mockClear();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("baseline properties", () => {
  it("attaches url/path/referrer/timestamp to every event", () => {
    trackSectionViewed({ page: "home", section: "hero", section_index: 0 });
    const props = lastEvent("section_viewed");
    expect(props.current_url).toEqual(expect.any(String));
    expect(props.pathname).toEqual(expect.any(String));
    expect(props.timestamp_client).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(props.page).toBe("home");
    expect(props.section).toBe("hero");
  });

  it("attaches stored referral attribution to every event", () => {
    window.localStorage.setItem(
      FIRST_TOUCH_KEY,
      JSON.stringify({
        referral_code: "writer_outreach",
        referral_target: "dwarkesh",
        outreach_handle: "dwarkesh",
        utm_source: "outreach",
        utm_medium: "dm",
        utm_campaign: "writer_pilot",
        first_landing_path: "/",
        first_landing_at: "2026-07-03T00:00:00.000Z",
      }),
    );
    trackWriterFunnel("signup_started", { page: "dashboard_auth" });
    const props = lastEvent("signup_started");
    expect(props.referral_code).toBe("writer_outreach");
    expect(props.referral_target).toBe("dwarkesh");
    expect(props.outreach_handle).toBe("dwarkesh");
    expect(props.utm_source).toBe("outreach");
    expect(props.utm_medium).toBe("dm");
    expect(props.utm_campaign).toBe("writer_pilot");
  });
});

describe("sanitiser", () => {
  it("drops credential-looking keys but keeps authenticated/outreach_handle", () => {
    trackWriterExitConfirmed({
      page: "dashboard_auth",
      section: "writer_auth_screen",
      flow_step: "auth",
      authenticated: false,
      // @ts-expect-error — deliberately hostile extra keys
      auth_token: "supersecret",
      authorization: "Bearer x",
      api_key: "k",
      password: "p",
    });
    const props = lastEvent("writer_exit_confirmed");
    expect(props.authenticated).toBe(false);
    expect(props).not.toHaveProperty("auth_token");
    expect(props).not.toHaveProperty("authorization");
    expect(props).not.toHaveProperty("api_key");
    expect(props).not.toHaveProperty("password");
  });

  it("redacts emails and wallet addresses inside string values", () => {
    trackNavClicked({
      cta_id: "nav_home",
      label: "reach me at someone@example.com or 0x1234567890abcdef1234567890abcdef12345678",
      page: "home",
      section: "header",
      target_type: "internal_page",
    });
    const props = lastEvent("nav_clicked");
    expect(props.label).not.toContain("someone@example.com");
    expect(props.label).not.toContain("0x1234567890abcdef1234567890abcdef12345678");
    expect(props.label).toContain("[email]");
    expect(props.label).toContain("[wallet]");
  });
});

describe("canonical event names", () => {
  it("fires each typed helper under its canonical name", () => {
    trackPageViewed({ page: "home", audience: "mixed" });
    trackSectionViewed({ page: "home", section: "hero", section_index: 0 });
    trackMarketingCtaClicked({
      cta_id: "x", label: "x", page: "home", section: "hero",
      audience: "mixed", intent: "publish", position: "hero", target_type: "app",
    });
    trackNavClicked({ cta_id: "x", label: "x", page: "home", section: "header", target_type: "internal_page" });
    trackExternalLinkClicked({ cta_id: "x", label: "x", page: "home", section: "hero", target_url: "https://x.com" });
    trackCopyActionCompleted({ cta_id: "x", label: "x", page: "home", section: "hero", audience: "mixed", intent: "copy_install" });
    trackVisualInteracted({ page: "home", section: "hero", visual_id: "v", interaction: "viewed" });
    trackFunnelStepCompleted({ step: "signup_started" });
    trackReferralCaptured({ attribution_type: "both", referral_code: "writer_outreach" });

    const names = capture.mock.calls.map(([event]) => event);
    for (const expected of [
      "page_viewed", "section_viewed", "marketing_cta_clicked", "nav_clicked",
      "external_link_clicked", "copy_action_completed", "marketing_visual_interacted",
      "funnel_step_completed", "referral_captured",
    ]) {
      expect(names).toContain(expected);
    }
  });
});

describe("writer funnel mirroring", () => {
  it("creator page views also fire writer_page_viewed", () => {
    trackPageViewed({ page: "creators", audience: "creator" });
    expect(lastEvent("writer_page_viewed").user_type).toBe("writer");
  });

  it("non-creator page views do not fire writer_page_viewed", () => {
    trackPageViewed({ page: "home", audience: "mixed" });
    expect(capture.mock.calls.map(([event]) => event)).not.toContain("writer_page_viewed");
  });

  it("creator CTAs also fire writer_cta_clicked with cta context", () => {
    trackMarketingCtaClicked({
      cta_id: "creators_hero_start_publishing", label: "Start publishing", page: "creators",
      section: "creator_hero", audience: "creator", intent: "publish", position: "hero", target_type: "app",
    });
    const props = lastEvent("writer_cta_clicked");
    expect(props.cta_id).toBe("creators_hero_start_publishing");
    expect(props.page).toBe("creators");
    expect(props.user_type).toBe("writer");
  });
});

describe("writer funnel events + session state", () => {
  it("fires flat canonical writer events with user_type writer", () => {
    trackWriterFunnel("import_started", { page: "dashboard_import_substack", import_method: "substack_export" });
    const props = lastEvent("import_started");
    expect(props.user_type).toBe("writer");
    expect(props.import_method).toBe("substack_export");
  });

  it("remembers signup/wallet/import progress for drop-off context", () => {
    expect(writerFunnelState()).toEqual({
      signup_completed: false, wallet_connected: false, article_import_started: false,
    });
    trackWriterFunnel("signup_completed");
    trackWriterFunnel("wallet_connected");
    trackWriterFunnel("import_started");
    expect(writerFunnelState()).toEqual({
      signup_completed: true, wallet_connected: true, article_import_started: true,
    });
  });
});

describe("exit intent + objections", () => {
  const context = {
    page: "dashboard_auth",
    section: "writer_auth_screen",
    flow_step: "auth",
    authenticated: false,
  } as const;

  it("fires all four exit events with context and funnel state", () => {
    trackWriterFunnel("import_started");
    trackWriterExitIntentOpened(context);
    trackWriterObjectionSelected({ ...context, objection: "waiting_for_mainnet" });
    trackWriterExitConfirmed({ ...context, objection: "waiting_for_mainnet" });
    trackWriterExitCancelled(context);

    for (const name of [
      "writer_exit_intent_opened", "writer_objection_selected",
      "writer_exit_confirmed", "writer_exit_cancelled",
    ]) {
      const props = lastEvent(name);
      expect(props.page).toBe("dashboard_auth");
      expect(props.section).toBe("writer_auth_screen");
      expect(props.flow_step).toBe("auth");
      expect(props.user_type).toBe("writer");
      expect(props.article_import_started).toBe(true);
    }
    expect(lastEvent("writer_objection_selected").objection).toBe("waiting_for_mainnet");
    expect(lastEvent("writer_exit_confirmed").objection).toBe("waiting_for_mainnet");
  });
});
