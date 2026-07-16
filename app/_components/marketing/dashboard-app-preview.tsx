"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { trackClick, APP_URL } from "../analytics-links";
import { trackVisualOnce } from "../analytics/events";
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
  analyticsPage?: string;
  analyticsSection?: string;
}

function DashboardPreviewFit() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({
    scale: 0,
    offsetX: 0,
    offsetY: 0,
    designWidth: PREVIEW_DESIGN_WIDTH,
    designHeight: PREVIEW_DESIGN_HEIGHT,
  });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let frame = 0;

    function updateLayout() {
      const el = hostRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      const designWidth = PREVIEW_DESIGN_WIDTH;
      const designHeight = PREVIEW_DESIGN_HEIGHT;

      const scale = Math.min(width / designWidth, height / designHeight);
      const scaledWidth = designWidth * scale;
      const scaledHeight = designHeight * scale;

      const next = {
        scale: Number(scale.toFixed(4)),
        offsetX: Number(((width - scaledWidth) / 2).toFixed(2)),
        offsetY: Number(((height - scaledHeight) / 2).toFixed(2)),
        designWidth,
        designHeight,
      };

      setLayout((current) => {
        if (
          current.scale === next.scale &&
          current.offsetX === next.offsetX &&
          current.offsetY === next.offsetY
        ) {
          return current;
        }
        return next;
      });
    }

    updateLayout();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateLayout);
    });
    observer.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={hostRef} className="landing-dashboard-preview-fit-host">
      <div
        className="landing-dashboard-preview-fit-inner"
        data-live-dashboard-preview="true"
        style={{
          width: layout.designWidth,
          height: layout.designHeight,
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
  analyticsPage = "home",
  analyticsSection = "creator_dashboard_preview",
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
      onMouseEnter={() =>
        trackVisualOnce({
          page: analyticsPage,
          section: analyticsSection,
          visual_id: "dashboard_preview",
          interaction: "hovered",
        })
      }
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
