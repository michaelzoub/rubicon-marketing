import { Heart, MessageCircle, MoreHorizontal, Repeat2, Share, X } from "lucide-react";

export function SubstackAppOverlay() {
  return (
    <div className="landing-substack-overlay" aria-hidden="true">
      <div className="landing-substack-window">
        <div className="landing-substack-titlebar">
          <div className="landing-mac-traffic" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="landing-substack-titlebar-label">Substack</span>
        </div>

        <div className="landing-substack-app">
          <header className="landing-substack-app-header">
            <X size={17} strokeWidth={2} aria-hidden="true" />
            <div className="landing-substack-pub">
              <img src="/substacklogo.png" alt="" className="landing-substack-pub-mark" aria-hidden="true" />
              <span className="landing-substack-pub-name">Rubicon on Substack</span>
            </div>
            <MoreHorizontal size={17} strokeWidth={2} aria-hidden="true" />
          </header>

          <div className="landing-substack-scroll">
            <h3 className="landing-substack-headline">Why agents pay per word</h3>
            <p className="landing-substack-dek">Pricing writing for autonomous readers, not ad impressions.</p>

            <div className="landing-substack-byline">
              <span className="landing-substack-avatar" aria-hidden="true" />
              <div>
                <p className="landing-substack-author">Satoshi Nakamoto</p>
                <p className="landing-substack-date">Mar 4, 2026</p>
              </div>
            </div>

            <div className="landing-substack-body">
              <p>
                <strong>Agents do not browse.</strong> They request the smallest passage that answers a prompt.
              </p>
              <p className="landing-substack-body--muted">
                Rubicon lists the article, hides the rest, and settles each unlock as USDC.
              </p>
            </div>
          </div>

          <footer className="landing-substack-actions">
            <Heart size={18} strokeWidth={1.75} aria-hidden="true" />
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
            <Repeat2 size={18} strokeWidth={1.75} aria-hidden="true" />
            <Share size={18} strokeWidth={1.75} aria-hidden="true" />
          </footer>
        </div>
      </div>
    </div>
  );
}
