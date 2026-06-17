"use client";

/**
 * Wires the Rubicon client to Privy authentication.
 *
 * The Privy access token is forwarded to Rubicon on every request; the backend
 * verifies it and derives creator identity from it. We never trust a
 * frontend-provided creator id.
 */
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { createRubiconClient, type RubiconClient } from "./client";

/** Public base URL for the Rubicon gateway, exposed to the browser. */
export const RUBICON_API_URL = process.env.NEXT_PUBLIC_RUBICON_API_URL ?? "";

export function isRubiconConfigured(): boolean {
  return Boolean(RUBICON_API_URL);
}

/**
 * Returns a Rubicon client bound to the current Privy session, or null when
 * Rubicon is not configured. The client throws a RubiconError of kind "auth"
 * if called while signed out.
 */
export function useRubiconClient(): RubiconClient | null {
  const { getAccessToken } = usePrivy();

  return useMemo(() => {
    if (!RUBICON_API_URL) return null;
    return createRubiconClient({
      baseUrl: RUBICON_API_URL,
      getToken: () => getAccessToken(),
    });
  }, [getAccessToken]);
}
