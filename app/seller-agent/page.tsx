import type { Metadata } from "next";
import { SellerAgentSection } from "../_components/marketing/seller-agent-section";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "Seller agent · Rubicon",
  description: "Every Rubicon article has a seller agent that routes buyers, protects unpaid content, and streams paid words.",
};

export default function SellerAgentPage() {
  return (
    <>
      <SiteHeader variant="marketing" />
      <main className="bg-[var(--background)] pt-20 md:pt-24">
        <SellerAgentSection showPageIntro />
      </main>
      <SiteFooter />
    </>
  );
}
