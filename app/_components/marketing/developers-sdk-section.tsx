"use client";

import { motion } from "framer-motion";
import { BookOpen, Check, Copy, Github } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { trackClick } from "../analytics-links";
import { fade } from "./motion";

const githubUrl = "https://github.com/michaelzoub/rubicon";

const developerCode = {
  sdk: `import Rubicon from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL,
});

const receipt = await rubicon.run({
  articleId: "rubicon-streaming-001",
  goal: "Find the resale-fee clause",
  maxSpendAtomic: "20000",
});

console.log(receipt);`,
  stream: `const receipt = await rubicon.run({
  articleId: "rubicon-streaming-001",
  goal: "Find the resale-fee clause",
  maxSpendAtomic: "20000",
  onWord: (word) => {
    process.stdout.write(\`\${word} \`);
  },
});`,
} as const;

function CodeShowcase() {
  const [active, setActive] = useState<keyof typeof developerCode>("sdk");
  const [copied, setCopied] = useState(false);
  const tabs: Array<{ id: keyof typeof developerCode; label: string }> = [
    { id: "sdk", label: "sdk" },
    { id: "stream", label: "stream" },
  ];
  const copyCode = async () => {
    await navigator.clipboard.writeText(developerCode[active]);
    setCopied(true);
    trackClick("copy_code_clicked", { tab: active });
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="code-showcase min-w-0">
      <div className="flex items-center gap-7 border-b border-[var(--faint)] px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActive(tab.id);
              trackClick("sdk_tab_clicked", { tab: tab.id });
            }}
            className={`mono border-b-2 px-2 pb-3 pt-1 text-sm transition-colors ${
              active === tab.id
                ? "border-[var(--ink)] text-[var(--ink)]"
                : "border-transparent text-[var(--quiet)] hover:text-[var(--muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-[10px] bg-[#1d1d1f]">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f58bb2]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f2d18f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8fdc9b]" />
            <span className="mono ml-4 text-sm text-[var(--quiet)]">ts</span>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="mono flex items-center gap-2 text-sm text-[var(--quiet)] transition-colors hover:text-[var(--ink)]"
            aria-label="Copy code"
          >
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{" "}
            {copied ? "copied" : "copy"}
          </button>
        </div>
        <pre className="mono max-h-[420px] max-w-full overflow-auto p-5 text-[0.82rem] leading-6 text-[#d6d6d9] md:p-7 md:text-[0.9rem] md:leading-7">
          <code>{developerCode[active]}</code>
        </pre>
      </div>
    </div>
  );
}

export function DevelopersSdkSection() {
  return (
    <section
      id="developers"
      className="landing-section-block developers-sdk-section scroll-mt-24"
      aria-labelledby="developers-sdk-heading"
    >
      <motion.div {...fade} className="container">
        <div className="developers-sdk-layout">
          <div className="developers-sdk-copy">
            <div className="landing-section-kicker">
              <p className="landing-section-eyebrow">For developers</p>
              <h2 id="developers-sdk-heading" className="landing-section-title developers-sdk-title">
                Use the SDK when you want direct control.
              </h2>
            </div>
            <p className="landing-section-lead developers-sdk-lead">
              Wire Rubicon into your own agent loop, set a spend cap, and stream paid words when your workflow needs
              them.
            </p>
            <div className="developers-sdk-install mono">npm install @rubicon-caliga/agent-sdk</div>
            <div className="developers-sdk-links">
              <a
                href={githubUrl}
                className="button button-secondary text-sm"
                onClick={() => trackClick("github_clicked", { location: "sdk_section" })}
              >
                <Github size={15} aria-hidden="true" /> View on GitHub
              </a>
              <Link
                href="/docs"
                className="button button-secondary text-sm"
                onClick={() => trackClick("read_docs_clicked", { location: "sdk_section" })}
              >
                <BookOpen size={15} aria-hidden="true" /> Read the docs
              </Link>
            </div>
          </div>
          <CodeShowcase />
        </div>
      </motion.div>
    </section>
  );
}
