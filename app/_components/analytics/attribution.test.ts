// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn(), register: vi.fn(), setPersonProperties: vi.fn() },
}));

import posthog from "posthog-js";
import {
  attachAttributionToPerson,
  captureAttributionFromUrl,
  FIRST_TOUCH_KEY,
  LATEST_TOUCH_KEY,
  readFirstTouch,
  readLatestTouch,
  referralEventProperties,
} from "./attribution";

const register = vi.mocked(posthog.register);
const setPersonProperties = vi.mocked(posthog.setPersonProperties);

function setUrl(pathAndQuery: string) {
  window.history.pushState({}, "", pathAndQuery);
}

const OUTREACH_QUERY =
  "?ref=writer_outreach&target=%40dwarkesh&utm_source=outreach&utm_medium=dm&utm_campaign=writer_pilot";

beforeEach(() => {
  register.mockClear();
  setPersonProperties.mockClear();
  window.localStorage.clear();
  setUrl("/");
});

describe("captureAttributionFromUrl", () => {
  it("returns null and stores nothing when the URL has no attribution", () => {
    expect(captureAttributionFromUrl()).toBeNull();
    expect(readFirstTouch()).toBeNull();
    expect(readLatestTouch()).toBeNull();
  });

  it("stores first + latest touch, normalizes @handles, registers super properties", () => {
    setUrl(`/${OUTREACH_QUERY}`);
    const result = captureAttributionFromUrl();

    expect(result?.attribution_type).toBe("both");
    expect(result?.params.referral_target).toBe("dwarkesh");
    expect(result?.params.referral_target_display).toBe("@dwarkesh");
    expect(result?.params.outreach_handle).toBe("dwarkesh");

    const first = readFirstTouch();
    expect(first?.referral_code).toBe("writer_outreach");
    expect(first?.utm_campaign).toBe("writer_pilot");
    expect(first?.first_landing_path).toBe("/");
    expect(first?.first_landing_at).toMatch(/^\d{4}-/);

    const latest = readLatestTouch();
    expect(latest?.referral_target).toBe("dwarkesh");
    expect(latest?.latest_landing_path).toBe("/");

    const registered = register.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(registered.referral_code).toBe("writer_outreach");
    expect(registered.referral_target).toBe("dwarkesh");
    expect(registered.latest_referral_code).toBe("writer_outreach");
  });

  it("never overwrites first touch on a later visit, but updates latest touch", () => {
    setUrl(`/${OUTREACH_QUERY}`);
    captureAttributionFromUrl();

    setUrl("/creators?ref=second_campaign&target=someone_else&utm_source=x");
    const result = captureAttributionFromUrl();

    expect(result?.attribution_type).toBe("latest_touch");
    expect(readFirstTouch()?.referral_code).toBe("writer_outreach");
    expect(readLatestTouch()?.referral_code).toBe("second_campaign");
    expect(readLatestTouch()?.latest_landing_path).toBe("/creators");
  });

  it("overwrites first touch when force_ref=1", () => {
    setUrl(`/${OUTREACH_QUERY}`);
    captureAttributionFromUrl();

    setUrl("/?ref=corrected&target=dwarkesh&force_ref=1");
    const result = captureAttributionFromUrl();

    expect(result?.attribution_type).toBe("both");
    expect(readFirstTouch()?.referral_code).toBe("corrected");
  });

  it("re-registers stored attribution on later loads without params", () => {
    setUrl(`/${OUTREACH_QUERY}`);
    captureAttributionFromUrl();
    register.mockClear();

    setUrl("/dashboard");
    expect(captureAttributionFromUrl()).toBeNull();
    const registered = register.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(registered.referral_code).toBe("writer_outreach");
  });
});

describe("referralEventProperties", () => {
  it("prefers first touch and falls back to latest touch per key", () => {
    window.localStorage.setItem(
      FIRST_TOUCH_KEY,
      JSON.stringify({ referral_code: "first_code", first_landing_path: "/", first_landing_at: "x" }),
    );
    window.localStorage.setItem(
      LATEST_TOUCH_KEY,
      JSON.stringify({
        referral_code: "latest_code",
        referral_target: "latest_target",
        latest_landing_path: "/creators",
        latest_landing_at: "y",
      }),
    );
    const props = referralEventProperties();
    expect(props.referral_code).toBe("first_code");
    expect(props.referral_target).toBe("latest_target");
  });
});

describe("attachAttributionToPerson", () => {
  it("sets latest touch and set-onces first touch on the person", () => {
    setUrl(`/${OUTREACH_QUERY}`);
    captureAttributionFromUrl();
    attachAttributionToPerson();

    const [set, setOnce] = setPersonProperties.mock.calls.at(-1)!;
    expect((set as Record<string, unknown>).latest_referral_code).toBe("writer_outreach");
    expect((setOnce as Record<string, unknown>).referral_code).toBe("writer_outreach");
    expect((setOnce as Record<string, unknown>).first_landing_path).toBe("/");
  });

  it("does nothing when no attribution is stored", () => {
    attachAttributionToPerson();
    expect(setPersonProperties).not.toHaveBeenCalled();
  });
});
