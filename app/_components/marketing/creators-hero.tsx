"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DashboardAppPreview } from "./dashboard-app-preview";
import { fade } from "./motion";
import { APP_URL } from "../analytics-links";

export function CreatorsHero() {
  return (
    <section className="creators-hero" aria-labelledby="creators-hero-heading">
      <motion.div {...fade} className="container creators-hero-inner">
        <div className="creators-hero-copy">
          <h1 id="creators-hero-heading" className="creators-hero-title">
            <span className="landing-section-title-emphasis">Creators</span>{" "}
            <span className="landing-section-title-muted">deserve credit and compensation</span>
          </h1>
          <div className="creators-hero-cta">
            <Link href={APP_URL} className="button button-primary">
              Start publishing <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="creators-hero-visual">
          <DashboardAppPreview
            className="creators-hero-dashboard-panel"
            backgroundImage="/painting4.png"
            showSubstack={false}
            showHoverCta
            align="right"
          />
        </div>
      </motion.div>
    </section>
  );
}
