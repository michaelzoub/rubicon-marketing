# Writer analytics

Internal reference for the writer-conversion event system. The #1 question it
answers: **why are writers not listing articles as much as we want?** — and
specifically whether the blocker is demand skepticism, pricing confusion,
wallet/trust concerns, content-exposure worry, setup friction, mainnet timing,
or auth-page confusion.

All events go through the typed wrapper in
`app/_components/analytics/events.ts`. Components never call
`posthog.capture()` directly for these. Every event automatically carries:

```
current_url, pathname, referrer, timestamp_client,
referral_code, referral_target, outreach_handle,
utm_source, utm_medium, utm_campaign
```

The sanitiser in `events.ts` strips key names matching tokens/secrets/
credentials/auth and redacts email addresses and wallet addresses inside
string values. No article bodies, tokens, wallet secrets, payment
credentials, or emails are ever sent.

## Core writer funnel events

Fired via `trackWriterFunnel(event, props)`; all carry `user_type: "writer"`.

| Event | Meaning | Fires from |
|---|---|---|
| `writer_page_viewed` | A creator-audience page was viewed | `trackPageViewed` mirror when `audience === "creator"` (today: `/creators`) |
| `writer_cta_clicked` | Any creator-audience CTA clicked | `trackMarketingCtaClicked` mirror when `audience === "creator"` — no per-callsite wiring needed |
| `app_opened_from_marketing` | Writer landed in the app with the marketing site as referrer | `DashboardShell` (`app/dashboard/_components/shell.tsx`), once per session |
| `signup_started` | Sign-in button clicked on the unauthenticated auth screen | `WriterAuthScreen` in `shell.tsx` |
| `signup_completed` | Writer is authenticated in the dashboard | `Layout` in `shell.tsx`, once per session |
| `wallet_connected` | Privy embedded wallet address exists post-auth | `Layout` in `shell.tsx`, once per session. Note: Privy provisions wallets for all users on login, so this measures provisioning failures/delays more than user choice |
| `import_started` | Substack export upload began | `app/dashboard/import/substack/page.tsx` (`import_method: "substack_export"`) |
| `import_completed` | Import produced usable content | Substack page (candidates parsed); `app/dashboard/articles/new/page.tsx` for URL-import handoff (`import_method: "url"`) and Markdown upload (`markdown_upload`) |
| `import_failed` | Import errored | Substack page — `error_code: "parse_failed"` (upload/parse) or `"commit_failed"` (draft creation) |
| `price_set` | Writer confirmed pricing | Substack commit (average across selections) and the new-article wizard pricing step. `price_per_word` is always **USD per word** |
| `article_published` | Article went live | New-article wizard publish success (`article_id`, `word_count`, `price_per_word`, `wallet_connected`) |

Common optional properties: `page`, `section`, `cta_id`, `label`, `flow_step`,
`step_index`, `source`, `import_method`, `article_id`, `word_count`,
`price_per_word`, `wallet_connected`, `error_code`.

## Pilot / concierge funnel

| Event | Status | Fires from |
|---|---|---|
| `writer_concierge_setup_clicked` | **Implemented** | "Set up my first article" CTA in `app/_components/marketing/creators-concierge.tsx` (links to Calendly) |
| `writer_pilot_cta_clicked` | **Pending** — no pilot-specific CTA exists in this repo yet. Vocabulary is reserved in `WriterFunnelEvent` | — |
| `setup_call_booked` | **Pending** — booking completes on Calendly; needs a Calendly webhook → PostHog server-side capture | — |
| `article_submitted_for_setup` | **Pending** — no submission flow in this repo | — |
| `manual_import_completed` | **Pending** — concierge imports are done by hand; capture server-side or via an internal tool | — |
| `writer_preview_sent` | **Pending** — outside this repo | — |
| `writer_approved_listing` | **Pending** — outside this repo | — |

## Exit intent + objection capture

Question shown: **"What’s stopping you from listing your first article?"**
(subtitle: "Optional — this helps us improve Rubicon for writers.")

Objection values: `not_sure_agents_will_pay`, `pricing_unclear`,
`wallet_concern`, `content_exposure_concern`, `setup_too_much_work`,
`waiting_for_mainnet`, `just_browsing`, `other`.

| Event | Meaning |
|---|---|
| `writer_exit_intent_opened` | The exit dialog was shown |
| `writer_objection_selected` | Writer picked an objection (fired once, on submit — dialog or inline) |
| `writer_exit_confirmed` | Writer left anyway (with or without an objection) |
| `writer_exit_cancelled` | Writer stayed ("Continue listing", Escape, or overlay click) |

All four carry `page`, `section`, `flow_step`, `objection?`, plus session
funnel state (`signup_completed`, `wallet_connected`,
`article_import_started`) and `authenticated`.

Placements (components in `app/dashboard/_components/writer-objection-prompt.tsx`):

1. **Auth screen "Back to Rubicon" link** (`flow_step: "auth"`) — the
   unauthenticated `WriterAuthScreen` has a compact top-left brand + "Back to
   Rubicon" escape hatch. Clicking it opens the dialog before navigating home
   (to `/` locally, `https://rubiconpay.xyz` on the app deployment).
2. **Import failure** (`flow_step: "import_failed"`) — inline prompt under the
   Substack import error state.
3. **Pricing abandonment** (`flow_step: "pricing_abandoned"`) — "Back to
   overview" on the Substack import page is intercepted when an export was
   parsed but drafts were never committed.
4. **Empty dashboard** (`flow_step: "empty_dashboard"`) — inline prompt in the
   overview's "No articles yet" state.

Anti-spam: one prompt per session, enforced with
`sessionStorage["rubicon_writer_objection_prompt_seen"]`. Once seen, the
auth-screen back link navigates home directly (still firing
`writer_exit_confirmed`). No `beforeunload` dialogs and no `popstate`
interception — only the explicit link is intercepted.

## Attribution events

| Event | Meaning |
|---|---|
| `referral_captured` | URL carried outreach params (`?ref` / `?target` / utm). `attribution_type`: `"both"` (first touch written) or `"latest_touch"` |

See `docs/writer-outreach.md` for the full attribution model.

## Which insight uses what (PostHog "Writer Conversion" dashboard)

Created by `scripts/create-posthog-dashboard.mjs` (needs
`POSTHOG_PERSONAL_API_KEY`).

| Insight | Type | Events |
|---|---|---|
| Writer CTA conversion | Funnel | `writer_page_viewed` → `writer_cta_clicked` |
| Writer signup conversion | Funnel | `writer_cta_clicked` → `signup_completed` |
| Writer listing funnel | Funnel | `signup_completed` → `import_started` → `import_completed` → `price_set` → `article_published` |
| Concierge setup interest | Trend | `writer_concierge_setup_clicked`, `writer_pilot_cta_clicked` |
| Writer objections | Trend (bar) | `writer_objection_selected` broken down by `objection` |
| Import health | Trend | `import_started`, `import_completed`, `import_failed` broken down by `error_code` |
| Wallet friction | Funnel | `signup_completed` → `wallet_connected` |
| Pricing friction | Funnel | `import_completed` → `price_set` |
| Outreach conversion by writer | Trend (table) | `writer_cta_clicked`, `signup_completed`, `article_published`, `writer_objection_selected` broken down by `referral_target` |
| Writer drop-off recordings | Replay playlist | Sessions with `writer_cta_clicked` or `signup_completed`; watch for ones that never reach `article_published` |

## Pending / not trackable from this repo

- The entire concierge back-office funnel after the Calendly click (see table
  above).
- `setup_call_booked` needs a Calendly webhook.
- Chrome-extension imports (`import_method: "chrome_extension"`) — the
  extension is a separate codebase; the value is reserved.
- Agent/buyer-side paid-reading events — they fire from the agent SDK / x402
  gateway, not this repo (vocabulary reserved in `FunnelStep`).
