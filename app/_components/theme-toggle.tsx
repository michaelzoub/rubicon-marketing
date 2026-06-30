"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  el.style.colorScheme = dark ? "dark" : "light";
}

const OPTIONS: ReadonlyArray<[Theme, typeof Monitor, string]> = [
  ["system", Monitor, "System theme"],
  ["light", Sun, "Light theme"],
  ["dark", Moon, "Dark theme"],
];

/**
 * Deliberately tiny, low-contrast control (brightens on hover) for switching
 * between system / light / dark. The initial class is set pre-paint by the
 * inline script in the root layout; this keeps it in sync and persists choices.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(((localStorage.getItem("theme") as Theme | null) ?? "system"));
  }, []);

  // Track system changes while in "system" mode.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <div className={`theme-toggle ${className}`} role="group" aria-label="Color theme">
      {OPTIONS.map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => choose(value)}
          className={`theme-toggle-btn${theme === value ? " is-active" : ""}`}
          aria-pressed={theme === value}
          aria-label={label}
          title={label}
        >
          <Icon size={12} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
