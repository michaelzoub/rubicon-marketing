import type { Metadata } from "next";
import { AnalyticsPageView, PageEngagementTracker } from "../_components/analytics-links";
import { AgentComparison, AgentWorkflow } from "../_components/marketing/agent-workflow";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "For agents · Rubicon",
  description: "Discover useful human writing, select the right passage before purchase, and unlock only the evidence an agent needs.",
};

export default function AgentsPage() {
  return (
    <div className="landing-page developers-page agents-page">
      <SiteHeader />
      <AnalyticsPageView page="agents" audience="agent" />
      <PageEngagementTracker page="agents" />
      <AgentWorkflow pageLead />
      <AgentComparison />
      <SiteFooter />
    </div>
  );
}
