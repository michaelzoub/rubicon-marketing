#!/usr/bin/env node
/**
 * Create the "Writer Conversion" PostHog dashboard with its 9 insights and
 * the writer drop-off session-recording playlist.
 *
 * Usage:
 *   POSTHOG_PERSONAL_API_KEY=phx_... node scripts/create-posthog-dashboard.mjs
 *
 * Optional env:
 *   POSTHOG_API_HOST    — defaults to https://us.posthog.com
 *   POSTHOG_PROJECT_ID  — defaults to the first project the key can see
 *
 * The key needs insight/dashboard write scopes (or is unscoped). Safe to
 * re-run: it skips creation if a "Writer Conversion" dashboard already exists.
 */

const HOST = (process.env.POSTHOG_API_HOST || "https://us.posthog.com").replace(/\/+$/, "");
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;

if (!KEY) {
  console.error(
    "Missing POSTHOG_PERSONAL_API_KEY.\n" +
      "Create one at PostHog → Settings → Personal API keys, then run:\n" +
      "  POSTHOG_PERSONAL_API_KEY=phx_... node scripts/create-posthog-dashboard.mjs",
  );
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${HOST}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

function events(...names) {
  return names.map((event) => ({ kind: "EventsNode", event, name: event }));
}

function funnel(name, description, steps) {
  return {
    name,
    description,
    query: {
      kind: "InsightVizNode",
      source: { kind: "FunnelsQuery", series: events(...steps) },
    },
  };
}

function trend(name, description, series, { breakdown, display } = {}) {
  const source = { kind: "TrendsQuery", series: events(...series) };
  if (breakdown) source.breakdownFilter = { breakdown, breakdown_type: "event" };
  if (display) source.trendsFilter = { display };
  return { name, description, query: { kind: "InsightVizNode", source } };
}

const INSIGHTS = [
  funnel("Writer CTA conversion", "Do writers who land on writer pages click through?", [
    "writer_page_viewed",
    "writer_cta_clicked",
  ]),
  funnel("Writer signup conversion", "Do writers who click a CTA actually sign up?", [
    "writer_cta_clicked",
    "signup_completed",
  ]),
  funnel(
    "Writer listing funnel",
    "Signed-up writers → imported → priced → published. The core question: where do they stop?",
    ["signup_completed", "import_started", "import_completed", "price_set", "article_published"],
  ),
  trend(
    "Concierge setup interest",
    "Demand for done-for-you setup vs. the pilot CTA.",
    ["writer_concierge_setup_clicked", "writer_pilot_cta_clicked"],
  ),
  trend(
    "Writer objections",
    "Why writers say they aren't listing: demand skepticism, pricing, wallet, exposure, setup, mainnet.",
    ["writer_objection_selected"],
    { breakdown: "objection", display: "ActionsBarValue" },
  ),
  trend(
    "Import health",
    "Import attempts vs. completions vs. failures; failures split by error_code.",
    ["import_started", "import_completed", "import_failed"],
    { breakdown: "error_code" },
  ),
  funnel("Wallet friction", "Does the (auto-provisioned) wallet step lose writers after signup?", [
    "signup_completed",
    "wallet_connected",
  ]),
  funnel("Pricing friction", "Writers who imported but never set a price.", [
    "import_completed",
    "price_set",
  ]),
  trend(
    "Outreach conversion by writer",
    "Per-writer outcome of personalized outreach links (?target=<handle>).",
    ["writer_cta_clicked", "signup_completed", "article_published", "writer_objection_selected"],
    { breakdown: "referral_target", display: "ActionsTable" },
  ),
];

async function main() {
  const projectId =
    process.env.POSTHOG_PROJECT_ID ?? (await api("GET", "/api/projects/")).results?.[0]?.id;
  if (!projectId) throw new Error("Could not resolve a PostHog project id.");
  console.log(`Project: ${projectId}`);

  const existing = await api(
    "GET",
    `/api/projects/${projectId}/dashboards/?search=${encodeURIComponent("Writer Conversion")}`,
  );
  let dashboard = existing.results?.find((d) => d.name === "Writer Conversion" && !d.deleted);
  if (dashboard) {
    console.log(`Dashboard already exists (id ${dashboard.id}) — not recreating insights.`);
    return;
  }

  dashboard = await api("POST", `/api/projects/${projectId}/dashboards/`, {
    name: "Writer Conversion",
    description:
      "Tracks where writers drop off before listing an article and why they may be skeptical or blocked.",
  });
  console.log(`Created dashboard ${dashboard.id}: ${HOST}/project/${projectId}/dashboard/${dashboard.id}`);

  for (const insight of INSIGHTS) {
    const created = await api("POST", `/api/projects/${projectId}/insights/`, {
      ...insight,
      dashboards: [dashboard.id],
      saved: true,
    });
    console.log(`  insight ${created.id}: ${insight.name}`);
  }

  // 10th item: session-recording playlist for writers who engaged but never
  // published. PostHog playlists can't express "without article_published",
  // so we filter to engaged writers and note the caveat in the description.
  try {
    const playlist = await api("POST", `/api/projects/${projectId}/session_recording_playlists/`, {
      name: "Writer drop-off recordings",
      description:
        "Sessions with writer_cta_clicked or signup_completed. Watch for sessions that never reach article_published.",
      type: "filters",
      filters: {
        events: [
          { id: "writer_cta_clicked", type: "events", name: "writer_cta_clicked", order: 0 },
          { id: "signup_completed", type: "events", name: "signup_completed", order: 1 },
        ],
        operand: "OR",
      },
    });
    console.log(`  playlist ${playlist.short_id ?? playlist.id}: Writer drop-off recordings`);
  } catch (error) {
    console.warn(`  playlist creation failed (create it manually in Replay): ${error.message}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
