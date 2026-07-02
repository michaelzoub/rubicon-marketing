"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { trackClick, APP_URL } from "../analytics-links";
import { CreatorDashboardPreview } from "./creator-dashboard-preview";
import { MacWindowFrame } from "./mac-window-frame";
import { SubstackAppOverlay } from "./substack-app-overlay";

const PREVIEW_DESIGN_WIDTH = 1280;
const PREVIEW_DESIGN_HEIGHT = 800;

interface DashboardAppPreviewProps {
  className?: string;
  backgroundImage?: string;
  showSubstack?: boolean;
  showHoverCta?: boolean;
  align?: "center" | "right";
}

function DashboardPreviewFit() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    function updateLayout() {
      const el = hostRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      // Cover-scale the live dashboard so it fills the Mac window (no letterboxing).
      const scale = Math.max(width / PREVIEW_DESIGN_WIDTH, height / PREVIEW_DESIGN_HEIGHT);
      const scaledWidth = PREVIEW_DESIGN_WIDTH * scale;
      const scaledHeight = PREVIEW_DESIGN_HEIGHT * scale;

      setLayout({
        scale,
        offsetX: (width - scaledWidth) / 2,
        offsetY: (height - scaledHeight) / 2,
      });
    }

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="landing-dashboard-preview-fit-host">
      <div
        className="landing-dashboard-preview-fit-inner"
        data-live-dashboard-preview="true"
        style={{
          width: PREVIEW_DESIGN_WIDTH,
          height: PREVIEW_DESIGN_HEIGHT,
          transform: `translate(${layout.offsetX}px, ${layout.offsetY}px) scale(${layout.scale})`,
        }}
      >
        <CreatorDashboardPreview embedded />
      </div>
    </div>
  );
}

/**
 * Landing showcase: macOS window with the live creator dashboard UI
 * (`CreatorDashboardPreview` — same React tree as `/dashboard`), optionally
 * with Substack overlay and painting background. Not a screenshot.
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
            <DashboardPreviewFit />
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
