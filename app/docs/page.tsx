import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  CircleDollarSign,
  Command,
  ExternalLink,
  Github,
  Package,
  Radio,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { RubiconBrand } from "../_components/rubicon-brand";
import { APP_URL } from "../_components/analytics-links";

const npmBase = "https://www.npmjs.com/package";
const githubUrl = "https://github.com/michaelzoub/rubicon";

const sections = [
  { href: "#quickstart", label: "Quickstart" },
  { href: "#agent-sdk", label: "Agent SDK" },
  { href: "#streaming", label: "Streaming reads" },
  { href: "#cli", label: "CLI" },
  { href: "#core", label: "Core primitives" },
  { href: "#payments", label: "Payment engines" },
  { href: "#receipts", label: "Receipts" },
  { href: "#api", label: "HTTP API" },
];

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="docs-code">
      <div className="docs-code-label">{label}</div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

function PackageCard({
  name,
  version,
  description,
  primary,
}: {
  name: string;
  version: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <a
      className={`docs-package ${primary ? "docs-package-primary" : ""}`}
      href={`${npmBase}/${name}`}
      target="_blank"
      rel="noreferrer"
    >
      <div className="flex items-start justify-between gap-4">
        <Package size={20} aria-hidden="true" />
        <span className="docs-version">v{version}</span>
      </div>
      <strong>{name}</strong>
      <p>{description}</p>
      <span className="docs-card-link">View package <ExternalLink size={13} aria-hidden="true" /></span>
    </a>
  );
}

export default function DocsPage() {
  return (
    <div className="docs-shell">
      <header className="docs-header">
        <div className="docs-header-inner">
          <Link href="/" className="flex items-center" aria-label="Rubicon home">
            <RubiconBrand className="h-7" />
          </Link>
          <span className="docs-header-divider" />
          <span className="text-sm font-semibold">Documentation</span>
          <div className="ml-auto flex items-center gap-2">
            <a href={githubUrl} target="_blank" rel="noreferrer" className="docs-header-link">
              <Github size={16} aria-hidden="true" /> <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link href={APP_URL} className="docs-header-cta">
              Publish <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <div className="docs-mobile-nav" aria-label="Documentation sections">
        {sections.map((section) => <a key={section.href} href={section.href}>{section.label}</a>)}
      </div>

      <div className="docs-grid">
        <aside className="docs-sidebar">
          <nav aria-label="Documentation navigation">
            <p className="docs-nav-label">Get started</p>
            <a className="docs-nav-active" href="#overview"><BookOpen size={15} /> Overview</a>
            <a href="#quickstart"><ChevronRight size={15} /> Quickstart</a>
            <p className="docs-nav-label">Build</p>
            <a href="#agent-sdk"><Boxes size={15} /> Agent SDK</a>
            <a href="#streaming"><Radio size={15} /> Streaming reads</a>
            <a href="#cli"><Terminal size={15} /> CLI</a>
            <a href="#core"><Package size={15} /> Core primitives</a>
            <p className="docs-nav-label">Reference</p>
            <a href="#payments"><CircleDollarSign size={15} /> Payments</a>
            <a href="#receipts"><ShieldCheck size={15} /> Receipts</a>
            <a href="#api"><Command size={15} /> HTTP API</a>
          </nav>
        </aside>

        <main className="docs-content">
          <section id="overview" className="docs-hero docs-anchor">
            <p className="docs-kicker">Developer documentation</p>
            <h1>Build agents that pay only for what they read.</h1>
            <p className="docs-lead">
              Rubicon gives buyer agents a budgeted path from content discovery to metered delivery. Start with the
              SDK for application control, use the CLI for terminal workflows, or import core protocol types directly.
            </p>
            <div className="docs-packages">
              <PackageCard primary name="@rubicon-caliga/agent-sdk" version="0.1.4" description="High-level discovery, navigation, paid streaming, and receipts." />
              <PackageCard primary name="@rubicon-caliga/cli" version="0.1.5" description="Terminal-native discovery and budgeted reads for agents." />
              <PackageCard name="@rubicon-caliga/core" version="0.1.3" description="Shared protocol types, pricing math, and session primitives." />
            </div>
          </section>

          <section id="quickstart" className="docs-section docs-anchor">
            <p className="docs-kicker">Quickstart</p>
            <h2>Run your first budgeted read</h2>
            <p>Install the SDK, create a client, and pass a hard spend ceiling in atomic USDC. One USDC has 1,000,000 atomic units.</p>
            <CodeBlock label="Terminal">npm install @rubicon-caliga/agent-sdk</CodeBlock>
            <CodeBlock label="TypeScript">{`import Rubicon from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL,
  authorization: \`Bearer \${process.env.RUBICON_AGENT_API_KEY}\`,
});

const receipt = await rubicon.run({
  articleId: "live-article-id",
  goal: "Find the resale-fee clause",
  maxSpendAtomic: "20000",
  maxWords: 200,
  stopWhen: ({ text }) => /resale fee/i.test(text),
  onWord: (word) => process.stdout.write(\`\${word} \`),
});

console.log(receipt.stopReason, receipt.amountPaidAtomic);`}</CodeBlock>
            <div className="docs-callout">
              <ShieldCheck size={19} aria-hidden="true" />
              <div><strong>Budget enforcement is part of the read.</strong><span>`maxSpendAtomic`, `maxWords`, and `stopWhen` can all end delivery before the full article is purchased.</span></div>
            </div>
          </section>

          <section id="agent-sdk" className="docs-section docs-anchor">
            <p className="docs-kicker">Agent SDK</p>
            <h2>Choose the right level of control</h2>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead><tr><th>Method</th><th>Use it for</th><th>Returns</th></tr></thead>
                <tbody>
                  <tr><td><code>run(options)</code></td><td>A complete read with callbacks</td><td><code>ReadReceipt</code></td></tr>
                  <tr><td><code>read(options)</code></td><td>Handling every event in your own loop</td><td><code>AsyncGenerator</code></td></tr>
                  <tr><td><code>getRepository()</code></td><td>Discovering public articles</td><td>Article summaries</td></tr>
                  <tr><td><code>getNavigation(id, goal)</code></td><td>Finding the most relevant section</td><td>Seller navigation</td></tr>
                  <tr><td><code>abort(sessionId)</code></td><td>Stopping an active read explicitly</td><td><code>Promise&lt;void&gt;</code></td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="streaming" className="docs-section docs-anchor">
            <p className="docs-kicker">Streaming reads</p>
            <h2>React to delivery as it happens</h2>
            <p><code>read()</code> yields session, seller, content, usage, completion, and error events. Bundled mode is the default and reduces payment round trips without changing per-word accounting.</p>
            <CodeBlock label="TypeScript">{`for await (const event of rubicon.read({
  articleId,
  goal: "Extract the contract termination conditions",
  maxSpendAtomic: "100000",
  chunkWords: 32,
  streamMode: "bundled",
})) {
  if (event.type === "article.bundle") {
    process.stdout.write(event.bundleText);
  }

  if (event.type === "article.completed") {
    console.log(event.receipt.settlementIds);
  }
}`}</CodeBlock>
            <div className="docs-event-grid">
              {["session.started", "seller.message", "article.bundle", "article.usage", "article.completed", "article.error"].map((event) => <code key={event}>{event}</code>)}
            </div>
          </section>

          <section id="cli" className="docs-section docs-anchor">
            <p className="docs-kicker">CLI</p>
            <h2>Use Rubicon from the terminal</h2>
            <p>The CLI is the shortest path for coding agents and shell workflows. Add <code>--json</code> when another process will consume the output.</p>
            <CodeBlock label="Terminal">{`npm install --global @rubicon-caliga/cli

rubicon doctor --json
rubicon repository
rubicon search "stablecoin settlement"
rubicon article navigation <article-id> --goal "Find fee terms"
rubicon read <article-id> --max-usdc 0.10 --goal "Find fee terms" --summary`}</CodeBlock>
            <div className="docs-steps">
              <div><span>01</span><strong>Discover</strong><p>List or search public articles.</p></div>
              <div><span>02</span><strong>Navigate</strong><p>Ask the seller agent for the best section.</p></div>
              <div><span>03</span><strong>Read</strong><p>Set a budget and store the final receipt.</p></div>
            </div>
          </section>

          <section id="core" className="docs-section docs-anchor">
            <p className="docs-kicker">Core primitives</p>
            <h2>Share contracts across your stack</h2>
            <p>Use <code>core</code> when implementing gateway integrations, validating accounting, or sharing Rubicon types between services.</p>
            <CodeBlock label="TypeScript">{`import {
  quotePerWord,
  usageForWords,
  settlementNetworkInfo,
  type Budget,
} from "@rubicon-caliga/core";

const quote = quotePerWord({
  pricePerWordAtomic: 10n,
  gatewayFeeBps: 0,
});

const usage = usageForWords({
  wordsDelivered: 137,
  pricePerWordAtomic: 10n,
});`}</CodeBlock>
          </section>

          <section id="payments" className="docs-section docs-anchor">
            <p className="docs-kicker">Payment engines</p>
            <h2>Develop locally, settle through Circle</h2>
            <div className="docs-split-cards">
              <div><strong>StaticPaymentEngine</strong><p>Default development engine for a dev-mode gateway. It declares authorized amounts and does not settle real funds.</p></div>
              <div><strong>CircleCliGatewayPaymentEngine</strong><p>Signs Circle and Arc authorization payloads through a Circle Agent Wallet without exposing raw private keys to the SDK.</p></div>
              <div><strong>CircleAgentWalletEngine</strong><p>API-backed custody using Circle Developer-Controlled Wallets. Provision and fund the wallet before starting reads.</p></div>
            </div>
            <CodeBlock label="TypeScript">{`import Rubicon, {
  CircleCliGatewayPaymentEngine,
} from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL,
  paymentEngine: new CircleCliGatewayPaymentEngine({
    agentWalletAddress: process.env.CIRCLE_AGENT_WALLET_ADDRESS as \`0x\${string}\`,
    chain: "ARC-TESTNET",
  }),
});`}</CodeBlock>
          </section>

          <section id="receipts" className="docs-section docs-anchor">
            <p className="docs-kicker">Receipts</p>
            <h2>Keep settlement evidence</h2>
            <p>A completed read returns its word count, total paid amount, text, stop reason, and payment evidence. For Gateway nanopayments, treat <code>settlementIds</code> as primary proof; a transaction hash may not exist for every payment.</p>
            <div className="docs-checklist">
              {["Persist sessionId and articleId", "Store amountPaidAtomic and wordsRead", "Index settlementIds for reconciliation", "Record stopReason for agent audits"].map((item) => <div key={item}><Check size={15} /> {item}</div>)}
            </div>
          </section>

          <section id="api" className="docs-section docs-anchor">
            <p className="docs-kicker">HTTP API</p>
            <h2>Gateway endpoints</h2>
            <p>The SDK wraps the public gateway flow. Use the endpoints directly only when building another language client or a custom runtime.</p>
            <div className="docs-endpoints">
              <div><span>GET</span><code>/v1/repository</code><p>List public articles.</p></div>
              <div><span>GET</span><code>/v1/articles/:id/navigation</code><p>Ask for goal-aware section routing.</p></div>
              <div><span>POST</span><code>/v1/seller-agent/conversations</code><p>Start a seller conversation.</p></div>
              <div><span>POST</span><code>/v1/sessions</code><p>Open a budgeted reading session.</p></div>
            </div>
          </section>

          <div className="docs-footer-nav">
            <Link href="/"><ArrowLeft size={15} /> Back to Rubicon</Link>
            <a href={githubUrl} target="_blank" rel="noreferrer">Explore the source <ArrowRight size={15} /></a>
          </div>
        </main>

        <aside className="docs-toc">
          <p>On this page</p>
          {sections.map((section) => <a key={section.href} href={section.href}>{section.label}</a>)}
          <a className="docs-edit-link" href={`${githubUrl}/tree/main/packages`} target="_blank" rel="noreferrer"><Github size={13} /> Package source</a>
        </aside>
      </div>
    </div>
  );
}
