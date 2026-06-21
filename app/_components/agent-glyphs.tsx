/**
 * Custom, paired agent marks for the buyer and seller agents.
 *
 * The two glyphs read as a matched set: the seller is a *source* (a stored
 * article releasing lines outward) and the buyer is a *reader* (a focused lens
 * pulling those lines in). Drawn as solid monoline marks so they sit cleanly on
 * a solid-filled token instead of looking like a generic stock robot icon.
 */

type GlyphProps = { size?: number; className?: string };

/** Buyer agent, a reading lens collecting an incoming stream of words. */
export function BuyerGlyph({ size = 22, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* incoming stream */}
      <path d="M3 7.5h6" />
      <path d="M3 12h4.5" />
      <path d="M3 16.5h6" />
      {/* the reading lens / focus */}
      <circle cx="16" cy="12" r="5" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Seller agent, a stored article releasing words outward, one line at a time. */
export function SellerGlyph({ size = 22, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* the source article */}
      <rect x="3.5" y="4.5" width="7" height="15" rx="2.2" />
      <path d="M6 8.5h2" />
      <path d="M6 12h2" />
      {/* released stream */}
      <path d="M13.5 8h7" />
      <path d="M13.5 12h5" />
      <path d="M13.5 16h7" />
    </svg>
  );
}
