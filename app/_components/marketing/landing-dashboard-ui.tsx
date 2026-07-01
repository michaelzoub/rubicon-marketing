import {
  BookOpen,
  Copy,
  FileText,
  LayoutGrid,
  PanelLeft,
  Plus,
  RefreshCw,
  Settings,
  Wallet2,
} from "lucide-react";
import { RubiconBrand } from "../rubicon-brand";

const earningsSpark = [42, 48, 44, 58, 52, 64, 55, 72, 61, 50];
const wordsSpark = [38, 41, 39, 46, 44, 49, 47, 52, 50, 48];

const earningsBreakdownSlices = [
  { label: "The Agent Economy Is Already Here", percent: 33, color: "#2f7df6" },
  { label: "Why Interfaces Become Markets", percent: 28, color: "#6aa6f7" },
  { label: "AI Distribution After Search", percent: 39, color: "#b8d4fd" },
];

const chartStages = [
  { label: "Listed", value: 65.2 },
  { label: "Previewed", value: 48.1 },
  { label: "Paid", value: 36.4 },
  { label: "Settled", value: 28.8 },
  { label: "Withdrawn", value: 19.5 },
];

const topArticles = [
  { title: "The Agent Economy Is Already Here", earnings: "$142.60", rank: 1 },
  { title: "Why Interfaces Become Markets", earnings: "$119.40", rank: 2 },
  { title: "AI Distribution After Search", earnings: "$102.75", rank: 3 },
];

const payments = [
  { title: "The Agent Economy Is Already Here", meta: "Just now · 1,900 words read", amount: "$19.00", status: "settled" as const },
  { title: "Why Interfaces Become Markets", meta: "1d ago · 4,118 words read", amount: "$41.18", status: "settled" as const },
  { title: "AI Distribution After Search", meta: "2d ago · 5,508 words read", amount: "$55.08", status: "settled" as const },
];

const workspaceNav = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Articles", icon: FileText, active: false },
  { label: "Earnings", icon: Wallet2, active: false },
];

const supportNav = [
  { label: "Developer docs", icon: BookOpen, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function LandingDashboardUI() {
  return (
    <div className="landing-dashboard-ui" aria-hidden="true">
      <aside className="landing-dashboard-ui-sidebar">
        <div className="landing-dashboard-ui-sidebar-head">
          <RubiconBrand className="landing-dashboard-ui-logo" src="/w_logo.svg" />
          <button type="button" className="landing-dashboard-ui-sidebar-toggle" tabIndex={-1} aria-hidden="true">
            <PanelLeft size={14} strokeWidth={1.75} />
          </button>
        </div>

        <div className="landing-dashboard-ui-new-article">
          <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>New article</span>
          <kbd className="landing-dashboard-ui-kbd">⌘N</kbd>
        </div>

        <nav className="landing-dashboard-ui-nav" aria-label="Dashboard">
          <p className="landing-dashboard-ui-nav-label">Workspace</p>
          {workspaceNav.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`landing-dashboard-ui-nav-item${item.active ? " is-active" : ""}`}>
                <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
            );
          })}

          <p className="landing-dashboard-ui-nav-label">Support</p>
          {supportNav.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="landing-dashboard-ui-nav-item">
                <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="landing-dashboard-ui-main">
        <header className="landing-dashboard-ui-header">
          <div>
            <h2 className="landing-dashboard-ui-title">Overview</h2>
            <p className="landing-dashboard-ui-greeting">Hello, @creator</p>
          </div>
          <div className="landing-dashboard-ui-header-actions">
            <span className="landing-dashboard-ui-pill">Content protected</span>
            <span className="landing-dashboard-ui-pill landing-dashboard-ui-pill--dark">Export</span>
          </div>
        </header>

        <div className="landing-dashboard-ui-layout">
          <div className="landing-dashboard-ui-content">
            <div className="landing-dashboard-ui-stats">
              <MetricCard
                label="Total earnings"
                value="$501.09"
                hint="+14% from last period"
                sparkline={earningsSpark}
              />
              <MetricCard
                label="Words read"
                value="50,005"
                hint="+9% from last period"
                sparkline={wordsSpark}
              />
              <MetricCard label="Live articles" value="3" compact />
            </div>

            <section className="landing-dashboard-ui-card landing-dashboard-ui-chart-card">
              <div className="landing-dashboard-ui-card-head">
                <div>
                  <p className="landing-dashboard-ui-card-eyebrow">Total earnings</p>
                  <p className="landing-dashboard-ui-chart-total">
                    $501.09 <span className="landing-dashboard-ui-trend-badge is-up">+14%</span>
                  </p>
                </div>
                <span className="landing-dashboard-ui-muted">Last 14 days</span>
              </div>
              <div className="landing-dashboard-ui-stage-chart" aria-hidden="true">
                {chartStages.map((stage) => (
                  <div key={stage.label} className="landing-dashboard-ui-stage">
                    <span className="landing-dashboard-ui-stage-value">{stage.value}K</span>
                    <div className="landing-dashboard-ui-bar-3d">
                      <div
                        className="landing-dashboard-ui-bar-face"
                        style={{ height: `${(stage.value / 65.2) * 100}%` }}
                      />
                    </div>
                    <span className="landing-dashboard-ui-stage-label">{stage.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="landing-dashboard-ui-row">
              <section className="landing-dashboard-ui-card landing-dashboard-ui-breakdown">
                <div className="landing-dashboard-ui-card-head">
                  <h3>Earnings breakdown</h3>
                </div>
                <div className="landing-dashboard-ui-breakdown-grid">
                  <div className="landing-dashboard-ui-breakdown-stat">
                    <p className="landing-dashboard-ui-breakdown-value">$2.73</p>
                    <p className="landing-dashboard-ui-breakdown-caption">Average earned per agent read</p>
                  </div>
                  <div className="landing-dashboard-ui-breakdown-chart">
                    <BreakdownDonut slices={earningsBreakdownSlices} />
                    <ul className="landing-dashboard-ui-breakdown-legend">
                      {earningsBreakdownSlices.map((slice) => (
                        <li key={slice.label}>
                          <span className="landing-dashboard-ui-breakdown-swatch" style={{ background: slice.color }} />
                          <span className="landing-dashboard-ui-breakdown-label">{slice.label}</span>
                          <span className="landing-dashboard-ui-breakdown-percent">{slice.percent}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="landing-dashboard-ui-card landing-dashboard-ui-podium">
                <div className="landing-dashboard-ui-card-head">
                  <h3>Top articles</h3>
                </div>
                <ul className="landing-dashboard-ui-podium-list">
                  {topArticles.map((article) => (
                    <li key={article.title}>
                      <span className="landing-dashboard-ui-rank">{article.rank}</span>
                      <div className="landing-dashboard-ui-podium-copy">
                        <p>{article.title}</p>
                        <span>{article.earnings}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="landing-dashboard-ui-card landing-dashboard-ui-payments">
              <div className="landing-dashboard-ui-card-head">
                <h3>Recent payments</h3>
              </div>
              <ul className="landing-dashboard-ui-payment-list">
                {payments.map((payment) => (
                  <li key={payment.title}>
                    <div>
                      <p className="landing-dashboard-ui-payment-title">{payment.title}</p>
                      <p className="landing-dashboard-ui-payment-meta">{payment.meta}</p>
                    </div>
                    <div className="landing-dashboard-ui-payment-end">
                      <strong>{payment.amount}</strong>
                      <span className="landing-dashboard-ui-status">{payment.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="landing-dashboard-ui-wallet">
            <section className="landing-dashboard-ui-card landing-dashboard-ui-wallet-card">
              <div className="landing-dashboard-ui-card-head">
                <h3>Payout wallet</h3>
                <button type="button" className="landing-dashboard-ui-icon-btn" tabIndex={-1}>
                  <RefreshCw size={13} aria-hidden="true" />
                </button>
              </div>
              <div className="landing-dashboard-ui-wallet-body">
                <p className="landing-dashboard-ui-wallet-balance">
                  41.27 <span>USDC</span>
                </p>
                <p className="landing-dashboard-ui-wallet-network">Arc Testnet</p>
                <div className="landing-dashboard-ui-wallet-address">
                  <code>0x742d...8f44</code>
                  <Copy size={12} aria-hidden="true" />
                </div>
                <button type="button" className="landing-dashboard-ui-withdraw" tabIndex={-1}>
                  Withdraw
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  sparkline,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  sparkline?: number[];
  compact?: boolean;
}) {
  return (
    <article className={`landing-dashboard-ui-metric${compact ? " is-compact" : ""}`}>
      <div className="landing-dashboard-ui-metric-copy">
        <p className="landing-dashboard-ui-metric-label">{label}</p>
        <p className="landing-dashboard-ui-metric-value">{value}</p>
        {hint ? <p className="landing-dashboard-ui-metric-hint">{hint}</p> : null}
      </div>
      {sparkline ? <Sparkline points={sparkline} className="landing-dashboard-ui-sparkline" /> : null}
    </article>
  );
}

function BreakdownDonut({
  slices,
}: {
  slices: { label: string; percent: number; color: string }[];
}) {
  let offset = 0;
  const gradientStops = slices
    .map((slice) => {
      const start = offset;
      offset += slice.percent;
      return `${slice.color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <div
      className="landing-dashboard-ui-donut"
      style={{ background: `conic-gradient(${gradientStops})` }}
      aria-hidden="true"
    />
  );
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const polyline = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 36 - ((point - min) / (max - min || 1)) * 26;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={className} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}
