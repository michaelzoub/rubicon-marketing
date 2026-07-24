"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DashboardAppPreview } from "./dashboard-app-preview";
import { heroArtwork, heroGroup, heroItem } from "./motion";
import { APP_URL } from "../analytics-links";
import { trackMarketingCtaClicked } from "../analytics/events";

export function CreatorsHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="creators-hero"
      aria-labelledby="creators-hero-heading"
      data-analytics-section="creator_hero"
      data-analytics-section-index="0"
    >
      <motion.div
        className="container creators-hero-inner"
        variants={heroGroup}
        initial={reduceMotion ? false : "initial"}
        animate="enter"
      >
        <motion.div className="creators-hero-copy" variants={heroItem}>
          <h1 id="creators-hero-heading" className="creators-hero-title">
            <span className="landing-section-title-emphasis">Creators</span>{" "}
            <span className="landing-section-title-muted">deserve credit and compensation</span>
          </h1>
          <div className="creators-hero-cta">
            <Link
              href={APP_URL}
              className="button button-primary"
              onClick={() =>
                trackMarketingCtaClicked({
                  cta_id: "creators_hero_start_publishing",
                  label: "Start publishing",
                  page: "creators",
                  section: "creator_hero",
                  audience: "creator",
                  intent: "publish",
                  position: "hero",
                  target_type: "app",
                  target_url: APP_URL,
                })
              }
            >
              Start publishing <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        <motion.div className="creators-hero-visual" variants={heroArtwork}>
          <DashboardAppPreview
            className="creators-hero-dashboard-panel"
            backgroundImage="/painting4.png"
            showSubstack={false}
            showHoverCta
            align="right"
            analyticsPage="creators"
            analyticsSection="creator_hero"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
