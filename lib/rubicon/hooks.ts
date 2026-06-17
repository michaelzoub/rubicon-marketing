"use client";

/**
 * Data-fetching hooks that surface explicit loading / success / error states
 * (including auth-expired) for the creator dashboard. No silent fallback to
 * fake or local data — when Rubicon is unreachable, the UI says so.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { RubiconError, type RubiconClient } from "./client";
import { useRubiconClient } from "./auth";

export type QueryStatus = "loading" | "success" | "error";

export interface QueryResult<T> {
  status: QueryStatus;
  data: T | null;
  error: RubiconError | null;
  refetch: () => void;
}

const notConfiguredError = new RubiconError(
  "backend",
  0,
  "not_configured",
  "Supabase is not connected yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load live data.",
);

/**
 * Runs `fetcher` against the Rubicon client and tracks its state. Re-runs when
 * `deps` change. Pass `enabled: false` to defer until prerequisites are ready
 * (e.g. the user is authenticated).
 */
export function useRubiconQuery<T>(
  fetcher: (client: RubiconClient) => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: { enabled?: boolean } = {},
): QueryResult<T> {
  const enabled = options.enabled ?? true;
  const client = useRubiconClient();
  const [status, setStatus] = useState<QueryStatus>("loading");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<RubiconError | null>(null);
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    if (!client) {
      setStatus("error");
      setError(notConfiguredError);
      setData(null);
      return;
    }

    let active = true;
    setStatus("loading");
    setError(null);

    fetcherRef
      .current(client)
      .then((result) => {
        if (!active) return;
        setData(result);
        setStatus("success");
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof RubiconError ? err : new RubiconError("backend", 0, "unknown", "Unexpected error."));
        setStatus("error");
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, enabled, nonce, ...deps]);

  return { status, data, error, refetch };
}

export interface MutationState {
  pending: boolean;
  error: RubiconError | null;
}

/** Minimal mutation helper with pending/error tracking. */
export function useRubiconMutation<TArgs extends unknown[], TResult>(
  mutator: (client: RubiconClient, ...args: TArgs) => Promise<TResult>,
): {
  run: (...args: TArgs) => Promise<TResult>;
  pending: boolean;
  error: RubiconError | null;
} {
  const client = useRubiconClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<RubiconError | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      if (!client) throw notConfiguredError;
      setPending(true);
      setError(null);
      try {
        return await mutator(client, ...args);
      } catch (err) {
        const rubiconErr = err instanceof RubiconError ? err : new RubiconError("backend", 0, "unknown", "Unexpected error.");
        setError(rubiconErr);
        throw rubiconErr;
      } finally {
        setPending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client],
  );

  return { run, pending, error };
}
