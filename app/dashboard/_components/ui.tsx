"use client";

import Link from "next/link";
import { AlertTriangle, Inbox, Loader2, LogIn, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { RubiconError } from "@/lib/rubicon/client";
import type { ArticleStatus, PaymentStatus, WalletVerificationState } from "@/lib/rubicon/types";
import { ARTICLE_STATUS_LABELS } from "@/lib/rubicon/types";

/* ---------- layout ---------- */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--faint)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-[var(--line)] bg-white ${className}`}>{children}</div>;
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--faint)] px-5 py-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.01em]">{value}</div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
    </Card>
  );
}

/* ---------- states ---------- */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-[var(--faint)] bg-white px-6 py-16 text-sm text-[var(--muted)]">
      <Loader2 size={18} className="animate-spin text-[var(--river)]" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-[var(--line)] bg-white px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--river-pale)] text-[var(--river)]">
        {icon ?? <Inbox size={22} aria-hidden="true" />}
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: RubiconError; onRetry?: () => void }) {
  const isAuth = error.kind === "auth";
  const isConfig = error.code === "not_configured";
  return (
    <div className="flex flex-col items-center rounded-xl border border-[#e7c9a3] bg-[#fdf6ec] px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f6e6cf] text-[#9a6516]">
        {isAuth ? <LogIn size={22} aria-hidden="true" /> : <AlertTriangle size={22} aria-hidden="true" />}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-[#7b4e12]">
        {isAuth ? "Your session expired" : isConfig ? "Rubicon isn’t connected yet" : "We couldn’t load this"}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#8a6326]">{error.message}</p>
      {onRetry && !isConfig && (
        <button type="button" onClick={onRetry} className="button button-secondary mt-5">
          <RefreshCw size={15} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

/* ---------- pills ---------- */

const statusStyles: Record<ArticleStatus, string> = {
  draft: "border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]",
  live: "border-[#69b88c] bg-[#e8f6ef] text-[#165c3e]",
  paused: "border-[#e0b15f] bg-[#fff8ed] text-[#7b4e12]",
  archived: "border-[var(--line)] bg-white text-[var(--muted)]",
};

export function ArticleStatusPill({ status }: { status: ArticleStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {ARTICLE_STATUS_LABELS[status]}
    </span>
  );
}

const paymentStyles: Record<PaymentStatus, string> = {
  settled: "border-[#69b88c] bg-[#e8f6ef] text-[#165c3e]",
  pending: "border-[#e0b15f] bg-[#fff8ed] text-[#7b4e12]",
  failed: "border-[#e3a2a0] bg-[#fff1f0] text-[#8d2f2d]",
};

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${paymentStyles[status]}`}>
      {status}
    </span>
  );
}

const walletStyles: Record<WalletVerificationState, string> = {
  verified: "border-[#69b88c] bg-[#e8f6ef] text-[#165c3e]",
  pending: "border-[#e0b15f] bg-[#fff8ed] text-[#7b4e12]",
  unverified: "border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]",
};

export function WalletStatePill({ state }: { state: WalletVerificationState }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${walletStyles[state]}`}>
      {state}
    </span>
  );
}

/* ---------- misc ---------- */

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="button button-primary text-sm">
      {children}
    </Link>
  );
}

export function shortWallet(address: string | null | undefined): string {
  if (!address) return "Not connected";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never";
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
