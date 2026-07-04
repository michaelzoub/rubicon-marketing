"use client";

import Link from "next/link";
import { trackClick } from "../analytics-links";
import { RubiconBrand } from "../rubicon-brand";

const githubUrl = "https://github.com/michaelzoub/rubicon";

const footerLinks = {
  product: [
    { href: "/", label: "Home" },
    { href: "/creators", label: "Creators" },
    { href: "/developers", label: "Developers" },
    { href: "/explore", label: "Explore" },
  ],
  resources: [
    { href: "/docs", label: "Docs" },
    { href: "/docs/onboarding-for-agents.md", label: "For agents", external: true },
    { href: "/faq", label: "FAQ" },
    { href: githubUrl, label: "GitHub", external: true },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className = "site-footer-link";

  const handleClick = () => {
    trackClick("footer_link_clicked", { label, external: external ?? false });
  };

  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer" onClick={handleClick}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {label}
    </Link>
  );
}

const footerLogoSrc = "/Header-logo_w.svg";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-main">
        <div className="site-footer-brand">
          <Link
            href="/"
            className="site-footer-logo site-header-logo"
            aria-label="Rubicon home"
            onClick={() => trackClick("nav_logo_clicked", { location: "footer" })}
          >
            <RubiconBrand className="site-header-brand site-header-brand--new" src={footerLogoSrc} />
          </Link>
          <p className="site-footer-tagline">Pay-per-word, between agents and creators.</p>
        </div>

        <div className="site-footer-columns">
          <div className="site-footer-column">
            <h3 className="site-footer-column-title">Product</h3>
            <div className="site-footer-links">
              {footerLinks.product.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </div>
          <div className="site-footer-column">
            <h3 className="site-footer-column-title">Resources</h3>
            <div className="site-footer-links">
              {footerLinks.resources.map((item) => (
                <FooterLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  external={"external" in item ? item.external : undefined}
                />
              ))}
            </div>
          </div>
          <div className="site-footer-column">
            <h3 className="site-footer-column-title">Company</h3>
            <div className="site-footer-links">
              {footerLinks.company.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer-bar">
        <div className="container site-footer-bar-inner">
          <p className="site-footer-bar-credit">Built by Caliga</p>
          <p className="site-footer-bar-copy">© 2026 Rubicon</p>
        </div>
      </div>
    </footer>
  );
}
