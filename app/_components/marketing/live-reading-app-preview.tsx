import { MacWindowFrame } from "./mac-window-frame";
import { StreamTheater } from "../stream-theater";

interface LiveReadingAppPreviewProps {
  className?: string;
}

/**
 * Product showcase: macOS window with the live reading demo over painting3.
 */
export function LiveReadingAppPreview({ className }: LiveReadingAppPreviewProps) {
  return (
    <div className={["landing-live-reading-app-panel", className].filter(Boolean).join(" ")}>
      <div className="landing-live-reading-app">
        <MacWindowFrame title="Live reading">
          <div className="landing-live-reading-app-screen">
            <StreamTheater embedded />
          </div>
        </MacWindowFrame>
      </div>
    </div>
  );
}
