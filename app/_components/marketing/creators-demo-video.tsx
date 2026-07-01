import { APP_URL } from "../analytics-links";

interface CreatorsDemoVideoProps {
  className?: string;
}

// The creator demo video now lives in the `rubicon-app` deployment (single
// source of truth). Drop `creators-how-it-works.mp4` into
// rubicon-app/public/ to make this play on the marketing site.
const DEMO_VIDEO_SRC = `${APP_URL}/creators-how-it-works.mp4`;
const DEMO_VIDEO_POSTER = "/Rubicon_Dashboard.png";

export function CreatorsDemoVideo({ className }: CreatorsDemoVideoProps) {
  return (
    <div className={className ?? "creators-how-video"}>
      <video
        className="creators-how-video-player"
        controls
        playsInline
        preload="metadata"
        poster={DEMO_VIDEO_POSTER}
        aria-label="Rubicon creator flow demo video"
      >
        <source src={DEMO_VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  );
}
