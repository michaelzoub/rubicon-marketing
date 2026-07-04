"use client";

import { useEffect, useRef } from "react";
import { AgentDemo } from "../_components/demo-video/agent-demo";
import { AnalyticsPageView } from "../_components/analytics-links";
import { trackVisualOnce } from "../_components/analytics/events";

export default function DemoVideoPage() {
  const firedStart = useRef(false);
  const firedComplete = useRef(false);

  // One `marketing_visual_interacted` for starting the demo, once per session.
  useEffect(() => {
    if (firedStart.current) return;
    firedStart.current = true;
    trackVisualOnce({
      page: "demo_video",
      section: "demo_video",
      visual_id: "demo_video",
      interaction: "started",
    });
  }, []);

  // Count a "completed" watch when the viewer leaves the page.
  useEffect(() => {
    const markCompleted = () => {
      if (firedComplete.current) return;
      firedComplete.current = true;
      trackVisualOnce({
        page: "demo_video",
        section: "demo_video",
        visual_id: "demo_video",
        interaction: "completed",
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") markCompleted();
    };
    window.addEventListener("pagehide", markCompleted);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", markCompleted);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <AnalyticsPageView page="demo_video" audience="mixed" />
      <AgentDemo />
    </>
  );
}