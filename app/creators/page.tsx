import type { Metadata } from "next";
import { CreatorsBenefits } from "../_components/marketing/creators-benefits";
import { CreatorsHero } from "../_components/marketing/creators-hero";
import { CreatorsHowItWorks } from "../_components/marketing/creators-how-it-works";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "For creators · Rubicon",
  description: "Publish premium articles, set per-word pricing, and earn from AI agent traffic on your terms.",
};

export default function CreatorsPage() {
  return (
    <div className="landing-page creators-page">
      <SiteHeader overlay />
      <CreatorsHero />
      <CreatorsBenefits />
      <CreatorsHowItWorks />
      <SiteFooter />
    </div>
  );
}
