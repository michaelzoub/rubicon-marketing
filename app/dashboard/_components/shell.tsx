"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, LayoutDashboard, Loader2, LogOut, Plus, Settings, Wallet2 } from "lucide-react";
import { type ReactNode } from "react";
import { usePrivyConfigured } from "../../providers";
import { RubiconBrand } from "../../_components/rubicon-brand";

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
        <RubiconBrand className="h-16" />
        <h1 className="mt-6 text-2xl font-semibold text-white">Sign in to Rubicon</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#a7abb4]">
          Manage articles, pricing, and earnings from one secure creator dashboard.
        </p>
        <button type="button" onClick={() => login()} className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-[#111318] shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#f7f7f8]">
          Sign in
        </button>
        <Link href="/" className="mt-5 text-sm text-[#c8cad0] transition hover:text-white">
          Back to home
        </Link>
      </CenteredScreen>
    );
  }

  return <Layout>{children}</Layout>;
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-theme dashboard-canvas min-h-screen bg-[var(--surface-muted)] lg:grid lg:grid-cols-[236px_1fr]">
      <Sidebar />
      <main className="min-w-0">
        <MobileBar />
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
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
    <aside className="dashboard-sidebar sticky top-0 hidden h-screen flex-col border-r border-[var(--line)] bg-white lg:flex">
      <Link href="/" className="flex items-center px-5 py-5" aria-label="Rubicon home">
        <RubiconBrand className="h-9" onLight />
      </Link>

      <div className="px-4">
        <Link href="/dashboard/articles/new" className="button button-primary w-full justify-center text-sm">
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
                  className={`dashboard-nav-link flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-[var(--river-pale)] text-[var(--river-deep)]" : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={17} aria-hidden="true" /> {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3">
        <a
          href="/#developers"
          className="dashboard-nav-link flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
        >
          <BookOpen size={17} aria-hidden="true" /> Developer docs
        </a>
        <div className="mt-2 flex items-center justify-between gap-2 rounded-[12px] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(20,35,60,0.05)]">
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
    <div className="sticky top-0 z-30 bg-white/90 shadow-[0_8px_24px_-20px_rgba(20,35,60,0.3)] backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center" aria-label="Rubicon home">
          <RubiconBrand className="h-9" onLight />
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
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
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
      <RubiconBrand className="h-16" />
      <h1 className="mt-6 text-2xl font-semibold text-white">Connect creator login</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#a7abb4]">
        Set <code className="mono rounded bg-[var(--surface-muted)] px-1.5 py-0.5">NEXT_PUBLIC_PRIVY_APP_ID</code>,{" "}
        <code className="mono rounded bg-[var(--surface-muted)] px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>, and{" "}
        <code className="mono rounded bg-[var(--surface-muted)] px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable
        sign-in and load live data.
      </p>
      <Link href="/" className="mt-6 text-sm text-[#c8cad0] transition hover:text-white">
        Back to home
      </Link>
    </CenteredScreen>
  );
}
