/**
 * Pricing and word-counting helpers.
 *
 * All money on the wire is expressed in atomic USDC units (6 decimals) as
 * strings, to avoid floating-point drift. Creators only ever see and enter
 * friendly dollar amounts; these helpers convert at the UI boundary.
 *
 * Word counting here is only used for pre-publish *estimates*. The gateway is
 * the source of truth for billed word counts, and the UI displays the
 * gateway's numbers everywhere usage and earnings are shown.
 */
import { USDC_DECIMALS } from "./types";

const ATOMIC_PER_USDC = 10 ** USDC_DECIMALS; // 1_000_000

/** Convert a dollar amount to atomic USDC units (string). */
export function usdToAtomic(usd: number): string {
  if (!Number.isFinite(usd) || usd < 0) return "0";
  return Math.round(usd * ATOMIC_PER_USDC).toString();
}

/** Convert atomic USDC units (string) to a dollar number. */
export function atomicToUsd(atomic: string | null | undefined): number {
  if (!atomic) return 0;
  const n = Number(atomic);
  if (!Number.isFinite(n)) return 0;
  return n / ATOMIC_PER_USDC;
}

/**
 * Format an atomic amount as a dollar string. Picks enough decimals to show
 * sub-cent micro-amounts without misleading rounding to $0.00.
 */
export function formatUsd(atomic: string | null | undefined): string {
  const usd = atomicToUsd(atomic);
  if (usd === 0) return "$0.00";
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  // Sub-cent: show up to 6 decimals, trimming trailing zeros but keeping >= 2.
  const fixed = usd.toFixed(6).replace(/0+$/, "");
  const padded = fixed.endsWith(".") ? `${fixed}00` : fixed;
  return `$${padded}`;
}

/** Convert a creator's "price per 1,000 words" (USD) to atomic-per-word. */
export function per1000UsdToAtomicPerWord(usdPer1000: number): string {
  if (!Number.isFinite(usdPer1000) || usdPer1000 < 0) return "0";
  const perWordUsd = usdPer1000 / 1000;
  return usdToAtomic(perWordUsd);
}

/** Convert atomic-per-word back to a "price per 1,000 words" dollar number. */
export function atomicPerWordToPer1000Usd(atomicPerWord: string): number {
  return atomicToUsd(atomicPerWord) * 1000;
}

/** Multiply an atomic per-word price by a word count → atomic total (string). */
export function atomicForWords(atomicPerWord: string, words: number): string {
  const n = Number(atomicPerWord);
  if (!Number.isFinite(n) || words <= 0) return "0";
  return Math.round(n * words).toString();
}

/**
 * Estimate a word count from raw text. Mirrors a simple whitespace tokenizer.
 * Used ONLY for pre-publish estimates; the gateway's count governs billing.
 */
export function estimateWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
