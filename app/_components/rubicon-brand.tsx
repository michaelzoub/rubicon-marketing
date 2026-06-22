export function RubiconBrand({
  className = "h-7",
  onLight = false,
}: {
  className?: string;
  onLight?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center ${className}`}
      aria-label="Rubicon"
    >
      <svg viewBox="95 825 1745 340" className="h-full w-auto max-w-full" role="img" aria-hidden="true">
        <image href={onLight ? "/rubicon-new-dark.png" : "/rubicon-new.png"} width="2000" height="2000" />
      </svg>
    </span>
  );
}
