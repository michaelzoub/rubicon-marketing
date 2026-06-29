"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { type ReactNode, useEffect, useState } from "react";
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
      { href: "/docs", label: "Developer docs", icon: BookOpen, exact: false },
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
    return <WriterAuthScreen onLogin={login} />;
  }

  return <Layout>{children}</Layout>;
}

function WriterAuthScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="writer-auth-screen">
      <div className="writer-auth-card">
        <section className="writer-auth-story">
          <span className="site-wordmark text-[1.6rem]">rubicon</span>
          <div>
            <h1>Start earning when agents read your work</h1>
            <p className="writer-auth-copy">
              List one article, set a per-word price, and let agents pay for only the sections they need. Your full piece
              stays private until words are paid for.
            </p>
          </div>
          <div className="writer-auth-benefits mono">Private by default · 0% platform fee · Paid per word</div>
        </section>
        <section className="writer-auth-panel" aria-label="Sign in">
          <figure className="writer-auth-quote">
            <blockquote>
              The <strong>creator economy</strong> is being <strong>left out</strong>, loudly and notably.
            </blockquote>
            <figcaption>Jack Conte, CEO of Patreon</figcaption>
          </figure>
          <div className="writer-auth-actions">
            <button
              type="button"
              onClick={() => {
                // Funnel step: unauthenticated writer opens the sign-in modal.
                posthog.capture("sign_in_clicked", {
                  location: "dashboard_auth_gate",
                  current_url: window.location.pathname,
                });
                onLogin();
              }}
              className="writer-auth-button"
            >
              Sign in
            </button>
            <p className="writer-auth-privy">Powered by Privy</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = usePrivy();
  const identity =
    user?.twitter?.username
      ? `@${user.twitter.username}`
      : user?.email?.address ?? (user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}…` : "Writer");

  return (
    <DashboardFrame identity={identity} onLogout={() => logout()}>
      {children}
    </DashboardFrame>
  );
}

export function DashboardFrame({
  children,
  identity: _identity,
  onLogout,
  activePath,
}: {
  children: ReactNode;
  identity: string;
  onLogout?: () => void;
  activePath?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // The landing page pins `overflow-x: clip` on <html>/<body>, which crops the
  // dashboard if its content ever exceeds the viewport (e.g. zoomed in) instead
  // of letting it scroll. Allow horizontal scrolling while the dashboard is
  // mounted, then restore the global clip on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const prevHtml = html.style.overflowX;
    const prevBody = body.style.overflowX;
    html.style.overflowX = "auto";
    body.style.overflowX = "auto";
    return () => {
      html.style.overflowX = prevHtml;
      body.style.overflowX = prevBody;
    };
  }, []);

  return (
    <div
      className={`dashboard-theme dashboard-canvas min-h-screen bg-[var(--surface-muted)] lg:grid ${
        sidebarOpen ? "lg:grid-cols-[224px_1fr]" : "lg:grid-cols-[64px_1fr]"
      }`}
    >
      <Sidebar onLogout={onLogout} activePath={activePath} open={sidebarOpen} onToggle={() => setSidebarOpen((open) => !open)} />
      <main className="min-w-0 lg:col-start-2">
        <MobileBar onLogout={onLogout} activePath={activePath} />
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8 lg:pr-12 xl:pr-16">{children}</div>
      </main>
    </div>
  );
}

function Sidebar({
  onLogout,
  activePath,
  open,
  onToggle,
}: {
  onLogout?: () => void;
  activePath?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = activePath ?? pathname;

  // Make the ⌘N hint real: jump straight to the new-article composer.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        const el = document.activeElement;
        const typing = el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
        if (typing) return;
        event.preventDefault();
        router.push("/dashboard/articles/new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <aside
      className={`dashboard-sidebar hidden h-screen border-r border-[var(--line)] bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col ${
        open ? "lg:w-56" : "lg:w-16"
      }`}
    >
      {!open ? (
        <div className="flex h-full flex-col items-center gap-4 px-3 py-4">
          <button type="button" onClick={onToggle} className="dashboard-icon-button" aria-label="Open sidebar" aria-expanded={false}>
            <PanelLeft size={16} aria-hidden="true" />
          </button>
          <nav className="grid gap-2" aria-label="Dashboard sections">
            {navSections.flatMap((section) => section.items).map((item) => {
              const active = item.exact ? currentPath === item.href : currentPath.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dashboard-nav-icon-link${active ? " is-active" : ""}`}
                  onClick={onToggle}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon size={16} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </div>
      ) : (
        <>
          <div className="dashboard-sidebar-chrome">
            <Link href="/" className="min-w-0" aria-label="Rubicon home">
              <span className="site-wordmark text-[1.3rem]">rubicon</span>
            </Link>
            <button type="button" onClick={onToggle} className="dashboard-icon-button" aria-label="Close sidebar" aria-expanded={true}>
              <PanelLeft size={15} aria-hidden="true" />
            </button>
          </div>

          <nav className="dashboard-nav flex-1 overflow-y-auto" aria-label="Dashboard">
            {/* Top-level action, styled like a plain Cursor row. */}
            <Link href="/dashboard/articles/new" className="dashboard-nav-link">
              <Plus size={17} aria-hidden="true" />
              <span className="dashboard-nav-link-label">New article</span>
              <kbd className="dashboard-kbd">⌘N</kbd>
            </Link>

            {navSections.map((section) => (
              <section key={section.label} className="dashboard-nav-group">
                <div className="dashboard-nav-section-title">{section.label}</div>
                {section.items.map((item) => {
                  const active = item.exact ? currentPath === item.href : currentPath.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`dashboard-nav-link${active ? " is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span className="dashboard-nav-link-label">{item.label}</span>
                    </Link>
                  );
                })}
              </section>
            ))}
          </nav>

          {onLogout && (
            <div className="dashboard-sidebar-foot">
              <button type="button" onClick={onLogout} className="dashboard-nav-link w-full">
                <LogOut size={17} aria-hidden="true" />
                <span className="dashboard-nav-link-label">Sign out</span>
              </button>
            </div>
          )}
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
          <span className="site-wordmark text-[1.25rem]">rubicon</span>
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
      <h1 className="mt-6 text-2xl font-semibold text-white">Connect writer login</h1>
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
