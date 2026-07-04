"use client";

import { useEffect, useRef } from "react";
import { captureAttributionFromUrl } from "./attribution";
import { trackReferralCaptured } from "./events";

/**
 * Mounted once in the root layout. On every full page load it reads outreach
 * params (?ref, ?target, utm_*) from the URL, persists first/latest-touch
 * attribution, registers PostHog super properties, and fires
 * `referral_captured` when the URL actually carried attribution.
 */
export function AttributionCapture() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const captured = captureAttributionFromUrl();
    if (captured) {
      trackReferralCaptured({ ...captured.params, attribution_type: captured.attribution_type });
    }
  }, []);
  return null;
}
