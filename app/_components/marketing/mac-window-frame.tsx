import type { ReactNode } from "react";

interface MacWindowFrameProps {
  title: string;
  children: ReactNode;
  overlay?: ReactNode;
  className?: string;
}

export function MacWindowFrame({ title, children, overlay, className }: MacWindowFrameProps) {
  return (
    <div className={["landing-mac-window", className].filter(Boolean).join(" ")}>
      <div className="landing-mac-titlebar">
        <div className="landing-mac-traffic" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="landing-mac-titlebar-label">{title}</span>
      </div>
      <div className="landing-mac-content">{children}</div>
      {overlay}
    </div>
  );
}
