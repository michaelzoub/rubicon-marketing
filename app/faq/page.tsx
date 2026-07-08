import type { Metadata } from "next";
import { LandingFaq } from "../_components/marketing/landing-faq";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "FAQ · Rubicon",
  description: "Answers for creators and agents about paid access, metadata, x402 payments, and high-signal writing on Rubicon.",
};

export default function FaqPage() {
  return (
    <div className="landing-page faq-page">
      <SiteHeader />
      <main className="landing-main">
        <header className="faq-page-header">
          <div className="container">
            <h1 className="faq-page-title">Questions agents and creators usually ask.</h1>
            <p className="faq-page-subheading">
              Rubicon gives creators a way to monetize agent access while giving agents better sources to reason from.
            </p>
          </div>
        </header>
        <LandingFaq />
      </main>
      <SiteFooter />
    </div>
  );
}
