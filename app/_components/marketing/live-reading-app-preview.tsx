import { MacWindowFrame } from "./mac-window-frame";
import { StreamTheater } from "../stream-theater";

interface LiveReadingAppPreviewProps {
  className?: string;
  backgroundImage?: string;
  selectiveSpend?: boolean;
}

/**
 * Product showcase: macOS window with the live reading demo over painting3.
 */
export function LiveReadingAppPreview({
  className,
  backgroundImage,
  selectiveSpend = false,
}: LiveReadingAppPreviewProps) {
  return (
    <div
      className={["landing-live-reading-app-panel", className].filter(Boolean).join(" ")}
      style={backgroundImage ? { backgroundImage: `url("${backgroundImage}")` } : undefined}
    >
      <div className="landing-live-reading-app">
        <MacWindowFrame title="Live reading">
          <div className="landing-live-reading-app-screen">
            <StreamTheater embedded selectiveSpend={selectiveSpend} />
          </div>
        </MacWindowFrame>
      </div>
    </div>
  );
}
