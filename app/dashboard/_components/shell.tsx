"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, LayoutDashboard, Loader2, LogOut, Plus, Settings, Wallet2, Waves } from "lucide-react";
import { type ReactNode } from "react";
import { usePrivyConfigured } from "../../providers";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/articles", label: "Articles", icon: FileText, exact: false },
  { href: "/dashboard/earnings", label: "Earnings", icon: Wallet2, exact: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: true },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const privyConfigured = usePrivyConfigured();
  if (!privyConfigured) return <ConfigNotice />;
  return <AuthGate>{children}</AuthGate>;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <CenteredScreen>
        <Loader2 size={22} className="animate-spin text-[var(--river)]" aria-hidden="true" />
        <p className="mt-4 text-sm text-[var(--muted)]">Loading your workspace…</p>
      </CenteredScreen>
    );
  }

  if (!authenticated) {
    return (
      <CenteredScreen>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--river-pale)] text-[var(--river)]">
          <Waves size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Sign in to Rubicon</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
          Manage your articles, pricing, and earnings. Agents pay you for every word they read.
        </p>
        <button type="button" onClick={() => login()} className="button button-primary mt-6">
          Sign in
        </button>
        <Link href="/" className="mt-4 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          Back to home
        </Link>
      </CenteredScreen>
    );
  }

  return <Layout>{children}</Layout>;
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface-muted)] lg:grid lg:grid-cols-[256px_1fr]">
      <Sidebar />
      <main className="min-w-0">
        <MobileBar />
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = usePrivy();
  const identity =
    user?.twitter?.username
      ? `@${user.twitter.username}`
      : user?.email?.address ?? (user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}…` : "Creator");

  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-[var(--line)] bg-white lg:flex">
      <Link href="/" className="flex items-center gap-2 px-6 py-5 font-semibold">
        <Waves size={20} strokeWidth={1.9} className="text-[var(--river)]" aria-hidden="true" />
        Rubicon
      </Link>

      <div className="px-4">
        <Link href="/dashboard/articles/new" className="button button-primary w-full text-sm">
          <Plus size={16} aria-hidden="true" /> New article
        </Link>
      </div>

      <nav className="mt-6 flex-1 px-3" aria-label="Dashboard">
        <ul className="grid gap-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-[var(--river-pale)] text-[var(--river-deep)]" : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={17} aria-hidden="true" /> {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--faint)] p-3">
        <a
          href="/#developers"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
        >
          <BookOpen size={17} aria-hidden="true" /> Developer docs
        </a>
        <div className="mt-1 flex items-center justify-between gap-2 rounded-lg px-3 py-2">
          <span className="mono truncate text-xs text-[var(--muted)]">{identity}</span>
          <button type="button" onClick={() => logout()} className="text-[var(--muted)] hover:text-[var(--ink)]" aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileBar() {
  const pathname = usePathname();
  const { logout } = usePrivy();
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Waves size={18} className="text-[var(--river)]" aria-hidden="true" /> Rubicon
        </Link>
        <button type="button" onClick={() => logout()} className="text-[var(--muted)]" aria-label="Sign out">
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Dashboard">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                active ? "bg-[var(--river-pale)] text-[var(--river-deep)]" : "text-[var(--muted)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--surface-muted)] px-6">
      <div className="flex flex-col items-center text-center">{children}</div>
    </div>
  );
}

function ConfigNotice() {
  return (
    <CenteredScreen>
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--river-pale)] text-[var(--river)]">
        <Waves size={22} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold">Connect creator login</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
        Set <code className="mono rounded border border-[var(--line)] bg-white px-1.5 py-0.5">NEXT_PUBLIC_PRIVY_APP_ID</code>,{" "}
        <code className="mono rounded border border-[var(--line)] bg-white px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>, and{" "}
        <code className="mono rounded border border-[var(--line)] bg-white px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable
        sign-in and load live data.
      </p>
      <Link href="/" className="mt-6 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        Back to home
      </Link>
    </CenteredScreen>
  );
}
