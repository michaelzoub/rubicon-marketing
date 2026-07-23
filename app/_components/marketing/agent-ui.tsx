import type { ReactNode } from "react";
import styles from "./agent-ui.module.css";

export function PromptBubble({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.prompt}${className ? ` ${className}` : ""}`}>{children}</div>;
}

export function ProcessRow({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className={`${styles.process}${icon ? ` ${styles.processWithIcon}` : ""}`}>
      {icon ? <span className={styles.processIcon} aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}

export function AgentSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.surface}${className ? ` ${className}` : ""}`}>{children}</div>;
}

export function SurfaceLabel({ children }: { children: ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}
