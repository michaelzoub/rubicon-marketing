"use client";

import Link from "next/link";
import { trackClick, APP_URL } from "../analytics-links";
import { LandingDashboardUI } from "./landing-dashboard-ui";
import { MacWindowFrame } from "./mac-window-frame";
import { SubstackAppOverlay } from "./substack-app-overlay";

interface DashboardAppPreviewProps {
  className?: string;
  backgroundImage?: string;
  showSubstack?: boolean;
  showHoverCta?: boolean;
  align?: "center" | "right";
}

/**
 * Landing showcase: macOS window with a built-in creator dashboard UI,
 * optionally with Substack overlay and painting background.
 */
export function DashboardAppPreview({
  className,
  backgroundImage = "/DB_BG.png",
  showSubstack = true,
  showHoverCta = true,
  align = "center",
}: DashboardAppPreviewProps) {
  return (
    <div
      className={[
        "landing-dashboard-app-panel",
        align === "right" ? "landing-dashboard-app-panel--right" : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundImage: `url("${backgroundImage}")` }}
    >
      <div className="landing-dashboard-app">
        <MacWindowFrame title="Rubicon" className="landing-dashboard-app-window">
          <div className="landing-dashboard-app-screen">
            <LandingDashboardUI />
            {showHoverCta ? (
              <Link
                href={APP_URL}
                className="landing-dashboard-hover-cta"
                aria-label="Visit the dashboard"
                onClick={() => trackClick("dashboard_showcase_clicked", { location: "dashboard_hover_cta" })}
              >
                <span>Visit me</span>
              </Link>
            ) : null}
          </div>
        </MacWindowFrame>
        {showSubstack ? <SubstackAppOverlay /> : null}
      </div>
    </div>
  );
}
