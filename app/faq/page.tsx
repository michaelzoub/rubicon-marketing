import type { Metadata } from "next";
import { LandingFaq } from "../_components/marketing/landing-faq";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "FAQ · Rubicon",
  description: "Answers about word-level metering, micropayments, USDC settlement, and how Rubicon works for creators and agents.",
};

export default function FaqPage() {
  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="landing-main">
        <LandingFaq />
      </main>
      <SiteFooter />
    </div>
  );
}
