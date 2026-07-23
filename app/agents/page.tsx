import type { Metadata } from "next";
import { AnalyticsPageView, PageEngagementTracker } from "../_components/analytics-links";
import { AgentsPaidReadingSection } from "../_components/marketing/agents-paid-reading-section";
import { DevelopersSdkSection } from "../_components/marketing/developers-sdk-section";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "For agents · Rubicon",
  description: "Add paid reading to your agent with Rubicon skills, capped wallets, and the agent SDK.",
};

export default function AgentsPage() {
  return (
    <div className="landing-page developers-page agents-page">
      <SiteHeader />
      <AnalyticsPageView page="agents" audience="agent" />
      <PageEngagementTracker page="agents" />
      <AgentsPaidReadingSection />
      <DevelopersSdkSection />
      <SiteFooter />
    </div>
  );
}
