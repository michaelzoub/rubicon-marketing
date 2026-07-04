# Writer outreach links & attribution

How personalized outreach links work, and how to see whether each writer
converted.

## URL params

Append these to any marketing URL (normally the root):

```
?ref=<code>            e.g. writer_outreach
?target=<handle>       the writer's username/handle (leading @ is stripped)
?utm_source=outreach
?utm_medium=dm
?utm_campaign=writer_pilot
&force_ref=1           optional — overwrite an existing first-touch record
```

Example:

```
https://rubiconpay.xyz/?ref=writer_outreach&target=dwarkesh&utm_source=outreach&utm_medium=dm&utm_campaign=writer_pilot
```

## What happens on landing

`AttributionCapture` (mounted in the root layout,
`app/_components/analytics/attribution-capture.tsx`) runs once per page load:

1. Reads the params above.
2. Persists them in `localStorage` so attribution survives navigation into
   `/dashboard` and later sessions:
   - `rubicon_first_touch_attribution` — written only if absent (or
     `force_ref=1`). Includes `first_landing_path` / `first_landing_at`.
   - `rubicon_latest_touch_attribution` — always updated. Includes
     `latest_landing_path` / `latest_landing_at`.
3. Registers PostHog **super properties**: the canonical keys
   (`referral_code`, `referral_target`, `outreach_handle`, `utm_source`,
   `utm_medium`, `utm_campaign`) come from first touch, plus a `latest_*`
   prefixed copy of latest touch.
4. Fires `referral_captured` with `attribution_type` = `"both"` (first touch
   written) or `"latest_touch"` (first touch already existed).

On sign-in, `attachAttributionToPerson()` (called from the dashboard shell)
copies first-touch onto the PostHog person as set-once properties and
latest-touch as `latest_*` overwriting properties.

**First-touch vs latest-touch:** first-touch answers "which outreach
originally brought this writer" and is never silently overwritten;
latest-touch answers "what was the most recent campaign they clicked".
Canonical event properties use first-touch (falling back to latest when no
first-touch exists), so funnels credit the original outreach.

`@handle` values are normalized: `referral_target` and `outreach_handle` are
stored without the `@`; the original spelling is preserved as
`referral_target_display` when it differed.

Every analytics event from the typed wrapper automatically includes the
canonical referral properties, so all writer funnel events are sliceable by
`referral_target`.

## Generating links

```bash
node scripts/generate-writer-links.mjs writers.txt            # CSV to stdout
node scripts/generate-writer-links.mjs writers.txt out.csv    # CSV to file
```

Base URL comes from `NEXT_PUBLIC_SITE_URL` (default `https://rubiconpay.xyz`).

Example input (`writers.txt` — one handle per line, `@` optional):

```
dwarkesh
patrick_oshag
@some_writer
```

Example output:

```csv
username,personalized_url,dm_message
dwarkesh,https://rubiconpay.xyz/?ref=writer_outreach&target=dwarkesh&utm_source=outreach&utm_medium=dm&utm_campaign=writer_pilot,"Hey dwarkesh — saw you checked out Rubicon / thought your writing would be a strong fit.

Quick question: would you be open to listing one article for our mainnet pilot?

If you’re unsure, I’m mainly trying to learn whether the blocker is setup friction, agent demand skepticism, wallet/mainnet concerns, or something else."
```

The `dm_message` column contains real newlines, so open the CSV in a
spreadsheet app (or parse it properly) rather than splitting on lines.

## Interpreting `referral_target` in PostHog

- `referral_target` on any event = the writer this session is attributed to
  (first touch). The "Outreach conversion by writer" insight on the **Writer
  Conversion** dashboard breaks `writer_cta_clicked`, `signup_completed`,
  `article_published`, and `writer_objection_selected` down by it — one row
  per outreach target showing how far they got and what objection they gave.
- No value means the visitor never arrived through an outreach link.
- Since one writer might open the link on two devices, treat counts as
  sessions/persons, not exact people; identification on sign-in merges what
  it can.
- The dashboard is created by
  `POSTHOG_PERSONAL_API_KEY=phx_... node scripts/create-posthog-dashboard.mjs`.
