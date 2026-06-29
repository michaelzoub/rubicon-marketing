interface CreatorsDemoVideoProps {
  className?: string;
}

const DEMO_VIDEO_SRC = "/creators-how-it-works.mp4";
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
