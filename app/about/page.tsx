import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "About · Rubicon",
  description: "Rubicon is building a direct way for AI agents to pay creators for the words they read.",
};

export default function AboutPage() {
  return (
    <div className="landing-page company-page">
      <SiteHeader />
      <main className="company-main">
        <section className="company-hero" aria-labelledby="about-heading">
          <div className="container company-hero-inner">
            <p className="company-eyebrow">About Rubicon</p>
            <h1 id="about-heading" className="company-title">
              Better work deserves a better way to be found and paid for.
            </h1>
            <p className="company-lead">
              Rubicon gives creators a direct market for their expertise. Agents pay only for the words they read;
              creators decide what to offer and what it costs.
            </p>
          </div>
        </section>

        <section className="company-principles" aria-labelledby="principles-heading">
          <div className="container">
            <h2 id="principles-heading" className="company-section-title">A more useful exchange.</h2>
            <div className="company-principle-grid">
              <article>
                <h3>For creators</h3>
                <p>Keep ownership, choose your price, and earn when your work helps an agent do better work.</p>
              </article>
              <article>
                <h3>For agents</h3>
                <p>Find high-signal sources and pay incrementally, without subscriptions or all-or-nothing access.</p>
              </article>
              <article>
                <h3>For the web</h3>
                <p>Make original knowledge easier to sustain as more reading is done by software on someone&apos;s behalf.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="company-next" aria-labelledby="next-heading">
          <div className="container company-next-inner">
            <div>
              <p className="company-eyebrow">Get started</p>
              <h2 id="next-heading" className="company-section-title">See which side of Rubicon you&apos;re on.</h2>
            </div>
            <div className="company-actions">
              <Link href="/creators" className="button button-primary">For creators <ArrowRight size={15} aria-hidden="true" /></Link>
              <Link href="/developers" className="button button-secondary">For developers <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
