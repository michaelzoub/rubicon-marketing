"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RubiconBrand } from "./rubicon-brand";

interface NavItem {
  href: string;
  label: string;
  matchPath: string;
}

const primaryNav: NavItem[] = [
  { href: "/", label: "Home", matchPath: "/" },
  { href: "/creators", label: "Creators", matchPath: "/creators" },
  { href: "/developers", label: "Developers", matchPath: "/developers" },
  { href: "/explore", label: "Explore", matchPath: "/explore" },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.matchPath;
  const className = `site-nav-link${isActive ? " site-nav-link--active" : ""}`;

  return (
    <Link className={className} href={item.href} aria-current={isActive ? "page" : undefined}>
      {item.label}
    </Link>
  );
}

export function SiteHeader({
  overlay = false,
}: {
  variant?: "home" | "explore" | "marketing";
  overlay?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header${overlay ? " site-header--overlay" : ""}${scrolled ? " site-header--scrolled" : ""}`}
    >
      <nav className="container site-header-inner" aria-label="Main navigation">
        <Link href="/" className="site-header-logo" aria-label="Rubicon home">
          <RubiconBrand className="h-7" />
        </Link>

        <div className="site-header-links">
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="site-header-actions" aria-label="Primary actions">
          <Link href="/dashboard" className="site-nav-cta site-nav-cta--creator">
            List an article
          </Link>
          <Link href="https://calendly.com/michaezl/new-meeting" className="site-nav-cta site-nav-cta--sales">
            Book a call
          </Link>
        </div>
      </nav>
    </header>
  );
}
