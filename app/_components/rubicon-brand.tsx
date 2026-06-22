export function RubiconBrand({
  className = "h-7",
  onLight = false,
}: {
  className?: string;
  onLight?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center ${onLight ? "rounded-lg bg-[#0d0e11] px-2 py-1.5" : ""} ${className}`}
      aria-label="Rubicon"
    >
      <svg viewBox="95 825 1745 340" className="h-full w-auto max-w-full" role="img" aria-hidden="true">
        <image href="/rubicon-new.png" width="2000" height="2000" />
      </svg>
    </span>
  );
}
