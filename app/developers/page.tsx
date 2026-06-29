import type { Metadata } from "next";
import { DevelopersSdkSection } from "../_components/marketing/developers-sdk-section";
import { LandingAgentsSection } from "../_components/marketing/landing-agents-section";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "For developers · Rubicon",
  description: "Add paid reading to your agent with Rubicon skills, capped wallets, and the agent SDK.",
};

export default function DevelopersPage() {
  return (
    <>
      <div className="landing-page developers-page">
        <SiteHeader overlay />
        <LandingAgentsSection isPageLead showCta={false} />
        <DevelopersSdkSection />
      </div>
      <SiteFooter />
    </>
  );
}
