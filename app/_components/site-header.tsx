"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackClick, APP_URL } from "./analytics-links";
import { RubiconBrand } from "./rubicon-brand";

interface NavItem {
  href: string;
  label: string;
  matchPath: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", matchPath: "/" },
  { href: "/creators", label: "Writers", matchPath: "/creators" },
  { href: "/developers", label: "Agents", matchPath: "/developers" },
  { href: "/explore", label: "Explore", matchPath: "/explore" },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.matchPath;
  const className = `site-nav-link${isActive ? " site-nav-link--active" : ""}`;

  return (
    <Link
      className={className}
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={() => trackClick("nav_link_clicked", { label: item.label })}
    >
      {item.label}
    </Link>
  );
}

export function SiteHeader({
  variant = "marketing",
  overlay = false,
}: {
  variant?: "home" | "explore" | "marketing";
  overlay?: boolean;
}) {
  const pathname = usePathname();
  const isHome = variant === "home";
  const logoSrc = "/Header-logo_w.svg";
  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      setScrolled(currentY > 16);

      if (currentY < 64) {
        setHeaderHidden(false);
      } else if (delta > 10) {
        setHeaderHidden(true);
      } else if (delta < -8) {
        setHeaderHidden(false);
      }

      lastScrollY.current = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header${isHome ? " site-header--home" : ""}${overlay ? " site-header--overlay" : ""}${scrolled ? " site-header--scrolled" : ""}${headerHidden ? " site-header--hidden" : ""}`}
    >
      <nav className="container site-header-inner" aria-label="Main navigation">
        <Link href="/" className="site-header-logo" aria-label="Rubicon home" onClick={() => trackClick("nav_logo_clicked")}>
          <RubiconBrand className="site-header-brand site-header-brand--new" src={logoSrc} />
        </Link>

        <div className="site-header-links">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="site-header-actions">
          <Link
            href={APP_URL}
            className="site-nav-cta site-nav-cta--creator"
            onClick={() => trackClick("nav_list_article_clicked")}
          >
            List an article
          </Link>
          <Link
            href="https://calendly.com/michaezl/new-meeting"
            className="site-nav-cta site-nav-cta--sales"
            onClick={() => trackClick("nav_book_demo_clicked")}
          >
            Book a demo
          </Link>
        </div>
      </nav>
    </header>
  );
}
