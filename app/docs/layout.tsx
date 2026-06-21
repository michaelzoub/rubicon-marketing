import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Docs | Rubicon",
  description: "Build buyer agents that discover and consume metered content with the Rubicon SDK, CLI, and protocol primitives.",
};

export default function DocsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
