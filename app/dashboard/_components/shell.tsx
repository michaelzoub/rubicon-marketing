"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  PanelLeft,
  Plus,
  Settings,
  Wallet2,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { usePrivyConfigured } from "../../providers";
import { RubiconBrand } from "../../_components/rubicon-brand";

const navSections = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/articles", label: "Articles", icon: FileText, exact: false },
      { href: "/dashboard/earnings", label: "Earnings", icon: Wallet2, exact: true },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/#developers", label: "Developer docs", icon: BookOpen, exact: true },
      { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: true },
    ],
  },
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
        <RubiconBrand className="h-10" />
        <h1 className="mt-6 text-2xl font-semibold text-white">Sign in to Rubicon</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#a7abb4]">
          Manage articles, pricing, and earnings from one secure creator dashboard.
        </p>
        <button
          type="button"
          onClick={() => {
            // Funnel step: unauthenticated creator opens the sign-in modal.
            posthog.capture("sign_in_clicked", {
              location: "dashboard_auth_gate",
              current_url: window.location.pathname,
            });
            login();
          }}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-[#111318] transition hover:bg-[#f7f7f8]"
        >
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
  const { user, logout } = usePrivy();
  const identity =
    user?.twitter?.username
      ? `@${user.twitter.username}`
      : user?.email?.address ?? (user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}…` : "Creator");

  return (
    <DashboardFrame identity={identity} onLogout={() => logout()}>
      {children}
    </DashboardFrame>
  );
}

export function DashboardFrame({
  children,
  identity,
  onLogout,
  activePath,
}: {
  children: ReactNode;
  identity: string;
  onLogout?: () => void;
  activePath?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className={`dashboard-theme dashboard-canvas min-h-screen bg-[var(--surface-muted)] lg:grid ${
        sidebarOpen ? "lg:grid-cols-[224px_1fr]" : "lg:grid-cols-[64px_1fr]"
      }`}
    >
      <Sidebar identity={identity} onLogout={onLogout} activePath={activePath} open={sidebarOpen} onToggle={() => setSidebarOpen((open) => !open)} />
      <main className="min-w-0">
        <MobileBar onLogout={onLogout} activePath={activePath} />
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

function Sidebar({
  identity,
  onLogout,
  activePath,
  open,
  onToggle,
}: {
  identity: string;
  onLogout?: () => void;
  activePath?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <aside className="dashboard-sidebar sticky top-0 hidden h-screen border-r border-[var(--line)] bg-white lg:flex lg:flex-col">
      {!open ? (
        <div className="flex h-full flex-col items-center px-3 py-4">
          <button type="button" onClick={onToggle} className="dashboard-icon-button" aria-label="Open sidebar" aria-expanded={false}>
            <PanelLeft size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <div className="border-b border-[var(--line)] px-4 py-4">
            <div className="flex min-h-8 items-center justify-between gap-3">
              <Link href="/" className="min-w-0" aria-label="Rubicon home">
                <RubiconBrand className="h-7" onLight />
              </Link>
              <button type="button" onClick={onToggle} className="dashboard-icon-button" aria-label="Close sidebar" aria-expanded={true}>
                <PanelLeft size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="border-b border-[var(--line)] px-4 py-4">
            <Link href="/dashboard/articles/new" className="button button-primary dashboard-new-article-button w-full justify-center text-sm">
              <Plus size={16} aria-hidden="true" /> New article
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
            <div className="grid gap-5">
              {navSections.map((section) => (
                <section key={section.label}>
                  <div className="dashboard-nav-section-title px-3 pb-2">{section.label}</div>
                  <ul className="grid gap-1">
                    {section.items.map((item) => {
                      const active = item.exact ? currentPath === item.href : currentPath.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`dashboard-nav-link flex min-h-9 items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium ${
                              active ? "is-active" : ""
                            }`}
                          >
                            <Icon size={16} aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </nav>

          <div className="border-t border-[var(--line)] p-3">
            <div className="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--surface-muted)] px-3 py-2">
              <span className="mono truncate text-xs text-[var(--muted)]">{identity}</span>
              {onLogout && (
                <button type="button" onClick={onLogout} className="dashboard-icon-button" aria-label="Sign out">
                  <LogOut size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function MobileBar({ onLogout, activePath }: { onLogout?: () => void; activePath?: string }) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center" aria-label="Rubicon home">
          <RubiconBrand className="h-7" onLight />
        </Link>
        {onLogout && (
          <button type="button" onClick={onLogout} className="text-[var(--muted)]" aria-label="Sign out">
            <LogOut size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Dashboard">
        {navSections.flatMap((section) => section.items).map((item) => {
          const active = item.exact ? currentPath === item.href : currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
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
      <RubiconBrand className="h-10" />
      <h1 className="mt-6 text-2xl font-semibold text-white">Connect creator login</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#a7abb4]">
        Set <code className="mono rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5">NEXT_PUBLIC_PRIVY_APP_ID</code>,{" "}
        <code className="mono rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>, and{" "}
        <code className="mono rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable
        sign-in and load live data.
      </p>
      <Link href="/" className="mt-6 text-sm text-[#c8cad0] transition hover:text-white">
        Back to home
      </Link>
    </CenteredScreen>
  );
}
