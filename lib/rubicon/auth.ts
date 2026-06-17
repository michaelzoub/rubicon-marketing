"use client";

/**
 * Wires the Supabase dashboard client to Privy authentication.
 *
 * The Privy access token is forwarded to Supabase as the bearer token. The
 * database must enforce RLS so creators can only read/write their own rows.
 */
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { createRubiconClient, type RubiconClient } from "./client";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isRubiconConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Returns a Supabase-backed dashboard client bound to the current Privy session,
 * or null when Supabase is not configured.
 */
export function useRubiconClient(): RubiconClient | null {
  const { getAccessToken, user } = usePrivy();

  return useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    const username =
      user?.twitter?.username ??
      user?.email?.address?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") ??
      user?.wallet?.address?.slice(2, 10) ??
      user?.id.slice(0, 8) ??
      "creator";
    const displayName = user?.twitter?.name ?? user?.twitter?.username ?? user?.email?.address ?? "Creator";

    return createRubiconClient({
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      getToken: () => getAccessToken(),
      getIdentity: () =>
        user
          ? {
              id: user.id,
              username,
              displayName,
            }
          : null,
    });
  }, [getAccessToken, user]);
}
