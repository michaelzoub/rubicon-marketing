interface SolutionSymbolProps {
  className?: string;
}

export function WritersSymbol({ className }: SolutionSymbolProps) {
  return (
    <svg
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M44 22 V66 M22 44 H66" stroke="currentColor" strokeWidth="10" strokeLinecap="square" />
    </svg>
  );
}

export function AgentsSymbol({ className }: SolutionSymbolProps) {
  return (
    <svg
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 34 H66 M22 54 H66" stroke="currentColor" strokeWidth="10" strokeLinecap="square" />
    </svg>
  );
}
