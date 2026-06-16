import Link from "next/link";
import { Layers3 } from "lucide-react";
import { readArticleRegistry } from "@/lib/articles";
import { CreatorDashboard } from "./creator-dashboard";

const githubUrl = "https://github.com/michaelzoub/rubicon";

export default async function DashboardPage() {
  const registry = await readArticleRegistry();

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--faint)] bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Layers3 size={20} className="text-[var(--river)]" aria-hidden="true" />
            Rubicon Creator Registry
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-[var(--muted)] hover:text-[var(--ink)]">
              Landing
            </Link>
            <a href={githubUrl} className="button button-primary">
              GitHub
            </a>
          </div>
        </div>
      </header>

      <CreatorDashboard initialRegistry={registry} />
    </main>
  );
}
