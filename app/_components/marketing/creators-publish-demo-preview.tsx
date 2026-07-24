"use client";

import { useInView } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { CreatorPublishFlow } from "./creator-publish-flow";
import { MacWindowFrame } from "./mac-window-frame";

const PUBLISH_DEMO_WIDTH = 1280;
const PUBLISH_DEMO_HEIGHT = 720;

function ScaledPublishFlow() {
  const hostRef = useRef<HTMLDivElement>(null);
  const inView = useInView(hostRef, { once: true, amount: 0.22, margin: "0px 0px -8%" });
  const [layout, setLayout] = useState({
    scale: 0,
    width: PUBLISH_DEMO_WIDTH,
    height: PUBLISH_DEMO_HEIGHT,
  });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateScale = () => {
      const hostWidth = host.getBoundingClientRect().width;
      if (hostWidth <= 0) return;

      const width = PUBLISH_DEMO_WIDTH;
      const height = PUBLISH_DEMO_HEIGHT;
      setLayout({ scale: hostWidth / width, width, height });
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="creators-publish-demo-fit-host">
      <div
        className="creators-publish-demo-fit-inner"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `scale(${layout.scale})`,
        }}
      >
        <CreatorPublishFlow active={inView} />
      </div>
    </div>
  );
}

interface CreatorsPublishDemoPreviewProps {
  className?: string;
}

/**
 * Creators how-it-works showcase: macOS window with the publish-flow demo
 * over painting6.
 */
export function CreatorsPublishDemoPreview({ className }: CreatorsPublishDemoPreviewProps) {
  return (
    <div className={["creators-publish-demo-panel", className].filter(Boolean).join(" ")}>
      <div className="creators-publish-demo-app">
        <MacWindowFrame title="Rubicon">
          <div className="creators-publish-demo-screen">
            <ScaledPublishFlow />
          </div>
        </MacWindowFrame>
      </div>
    </div>
  );
}
