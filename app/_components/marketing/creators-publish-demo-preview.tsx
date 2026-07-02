import { CreatorPublishFlow } from "./creator-publish-flow";
import { MacWindowFrame } from "./mac-window-frame";

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
            <CreatorPublishFlow />
          </div>
        </MacWindowFrame>
      </div>
    </div>
  );
}
