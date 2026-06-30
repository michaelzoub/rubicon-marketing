"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RubiconBrand } from "./rubicon-brand";

interface NavItem {
  href: string;
  label: string;
  matchPath: string;
}

const primaryNav: NavItem[] = [{ href: "/", label: "Home", matchPath: "/" }];

const exploreNav: NavItem = { href: "/explore", label: "Explore", matchPath: "/explore" };

const solutionsNav = [
  {
    href: "/creators",
    title: "For Writers",
    image: "/forwriters.webp",
    imageAlt: "Oranges in a basket by the sea",
    imageClassName: "site-nav-solutions-card-image site-nav-solutions-card-image--writers",
    cardClassName: "site-nav-solutions-card--writers",
    matchPath: "/creators",
  },
  {
    href: "/developers",
    title: "For Agents",
    image: "/foragents.png",
    imageAlt: "Abstract art for agents",
    imageClassName: "site-nav-solutions-card-image site-nav-solutions-card-image--agents",
    cardClassName: "site-nav-solutions-card--agents",
    matchPath: "/developers",
  },
] as const;

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.matchPath;
  const className = `site-nav-link${isActive ? " site-nav-link--active" : ""}`;

  return (
    <Link className={className} href={item.href} aria-current={isActive ? "page" : undefined}>
      {item.label}
    </Link>
  );
}

function SolutionsTrigger({
  pathname,
  onOpen,
  onClose,
}: {
  pathname: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  const isActive = solutionsNav.some((item) => pathname === item.matchPath);

  return (
    <div className="site-nav-dropdown" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={`site-nav-link site-nav-dropdown-trigger${isActive ? " site-nav-link--active" : ""}`}
        aria-haspopup="true"
      >
        Solutions
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

function SolutionsPanel({
  pathname,
  onOpen,
  onClose,
}: {
  pathname: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="site-nav-solutions-panel"
      role="menu"
      aria-label="Solutions"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <div className="site-nav-solutions-panel-inner">
        <div className="site-nav-solutions-grid">
          {solutionsNav.map((item, index) => {
            const itemActive = pathname === item.matchPath;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav-solutions-card ${item.cardClassName}${itemActive ? " site-nav-solutions-card--active" : ""}`}
                role="menuitem"
                aria-current={itemActive ? "page" : undefined}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="50vw"
                  unoptimized
                  className={item.imageClassName}
                />
                <span className="site-nav-solutions-card-scrim" aria-hidden="true" />
                <span className="site-nav-solutions-card-title">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
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
  const [headerHidden, setHeaderHidden] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const solutionsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY = useRef(0);

  const openSolutions = () => {
    if (solutionsCloseTimer.current) {
      clearTimeout(solutionsCloseTimer.current);
      solutionsCloseTimer.current = null;
    }
    setSolutionsOpen(true);
  };

  const closeSolutions = () => {
    solutionsCloseTimer.current = setTimeout(() => {
      setSolutionsOpen(false);
      solutionsCloseTimer.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (solutionsCloseTimer.current) clearTimeout(solutionsCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    setSolutionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (solutionsOpen) setHeaderHidden(false);
  }, [solutionsOpen]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      setScrolled(currentY > 16);

      if (solutionsOpen) {
        lastScrollY.current = currentY;
        return;
      }

      if (currentY < 64) {
        setHeaderHidden(false);
      } else if (delta > 10) {
        setHeaderHidden(true);
        setSolutionsOpen(false);
      } else if (delta < -8) {
        setHeaderHidden(false);
      }

      lastScrollY.current = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solutionsOpen]);

  return (
    <header
      className={`site-header${overlay ? " site-header--overlay" : ""}${scrolled ? " site-header--scrolled" : ""}${headerHidden ? " site-header--hidden" : ""}${solutionsOpen ? " site-header--solutions-open" : ""}`}
    >
      <nav className="container site-header-inner" aria-label="Main navigation">
        <Link href="/" className="site-header-logo" aria-label="Rubicon home">
          <RubiconBrand className="site-header-brand site-header-brand--new" src="/Header-logo_w.svg" />
        </Link>

        <div className="site-header-links">
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
          <SolutionsTrigger pathname={pathname} onOpen={openSolutions} onClose={closeSolutions} />
          <NavLink item={exploreNav} pathname={pathname} />
        </div>

        <div className="site-header-actions">
          <Link href="/dashboard" className="site-nav-cta site-nav-cta--creator">
            List an article
          </Link>
          <Link href="/demo-video" className="site-nav-cta site-nav-cta--sales">
            Book a demo
          </Link>
        </div>
      </nav>
      <SolutionsPanel pathname={pathname} onOpen={openSolutions} onClose={closeSolutions} />
    </header>
  );
}
