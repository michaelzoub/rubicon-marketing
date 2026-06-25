"use client";

import { motion } from "framer-motion";
import { LockKeyhole, Search } from "lucide-react";
import { SellerGlyph } from "../agent-glyphs";
import { fade } from "./motion";

export function SellerAgentSection({ showPageIntro = false }: { showPageIntro?: boolean }) {
  return (
    <section className="section stack-panel stack-panel-muted border-y border-[var(--faint)] bg-[var(--surface-muted)]">
      <motion.div {...fade} className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          {showPageIntro ? (
            <div className="pb-4 pt-4 md:pt-6">
              <p className="eyebrow">The seller agent</p>
              <h1 className="mt-4 max-w-3xl section-title">Every article has a seller agent.</h1>
            </div>
          ) : (
            <>
              <p className="eyebrow">The seller agent</p>
              <h2 className="mt-4 section-title">Every article has a seller agent.</h2>
            </>
          )}
          <p className="section-copy mt-5">
            It understands the article, helps buyer agents find the relevant section, protects unpaid content, and
            releases the article one paid word at a time.
          </p>
        </div>
        <div className="seller-agent-visual" aria-label="Seller agent routes a buyer to a protected article section">
          <div className="seller-query">
            <Search size={15} aria-hidden="true" />
            <span>Where are resale fees defined?</span>
          </div>
          <div className="seller-route" aria-hidden="true">
            <span />
          </div>
          <div className="seller-agent-node">
            <span className="seller-agent-icon">
              <SellerGlyph size={26} />
            </span>
            <div>
              <strong>Seller agent</strong>
              <span className="seller-agent-status">
                <i aria-hidden="true" />
                Routing query
              </span>
            </div>
          </div>
          <div className="seller-document">
            <div className="seller-document-head">
              <LockKeyhole size={14} className="text-[var(--muted)]" />
            </div>
            <div className="seller-section">
              <span>01</span>
              <div>
                <strong>Market overview</strong>
                <i />
              </div>
            </div>
            <div className="seller-section seller-section-active">
              <span>02</span>
              <div>
                <strong>Consent decree language</strong>
                <i />
              </div>
            </div>
            <div className="seller-section">
              <span>03</span>
              <div>
                <strong>Enforcement mechanics</strong>
                <i />
              </div>
            </div>
            <div className="seller-scan" aria-hidden="true" />
          </div>
          <div className="seller-result">
            <span>Section found</span>
            <strong>Start at section 02</strong>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
