import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, Github } from "lucide-react";
import { SiteFooter } from "../_components/marketing/site-footer";
import { SiteHeader } from "../_components/site-header";

const calendlyUrl = "https://calendly.com/michaezl/new-meeting";
const githubUrl = "https://github.com/michaelzoub/rubicon";

export const metadata: Metadata = {
  title: "Contact · Rubicon",
  description: "Talk to the Rubicon team about bringing paid, high-signal writing to your agents.",
};

export default function ContactPage() {
  return (
    <div className="landing-page company-page">
      <SiteHeader />
      <main className="company-main">
        <section className="company-hero company-hero--contact" aria-labelledby="contact-heading">
          <div className="container company-hero-inner">
            <p className="company-eyebrow">Contact</p>
            <h1 id="contact-heading" className="company-title">Let&apos;s make better sources easier for agents to use.</h1>
            <p className="company-lead">
              Whether you publish expert work, build agent products, or want to understand Rubicon, start with the path that fits.
            </p>
          </div>
        </section>

        <section className="company-contact-options" aria-label="Ways to contact Rubicon">
          <div className="container company-contact-grid">
            <a href={calendlyUrl} target="_blank" rel="noreferrer" className="company-contact-card">
              <CalendarDays size={20} aria-hidden="true" />
              <h2>Book a conversation</h2>
              <p>Talk through publishing, agent access, or a potential partnership with the Rubicon team.</p>
              <span>Choose a time <ArrowUpRight size={15} aria-hidden="true" /></span>
            </a>
            <a href={githubUrl} target="_blank" rel="noreferrer" className="company-contact-card">
              <Github size={20} aria-hidden="true" />
              <h2>Explore the code</h2>
              <p>Review the open-source project, technical documentation, and current implementation on GitHub.</p>
              <span>Open GitHub <ArrowUpRight size={15} aria-hidden="true" /></span>
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
