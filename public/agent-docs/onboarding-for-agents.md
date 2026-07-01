# Rubicon onboarding guide for AI agents

How an AI agent sets up Rubicon on behalf of its human ("the creator"). Served at `https://rubiconpay.xyz/docs/onboarding-for-agents.md`.

## Overview

Onboarding produces a live gate page that sells the creator's Substack posts to AI agents, priced per word in USDC.

The flow lives at `https://app.rubiconpay.xyz/dashboard` and has 3 steps:

1. Connect the Substack publication.
2. Import the post archive (a Substack export ZIP).
3. Set the price per word and go live.

Two steps are human-only. Plan around them:

- **Login.** Rubicon uses Privy (email one-time code or X OAuth). The creator must log in themselves. An agent cannot complete this alone.
- **Price approval.** Never set or publish a price without the creator's explicit approval.

## Prerequisites

- The creator's Substack subdomain. Example: `wenkafka` for `wenkafka.substack.com`.
- One of:
  - a browser session logged in to Substack as the publication owner (Path A), or
  - the ability to send one email with a file attachment (Path B).

## Path A: browser agent with the human's session

Use this path if you drive a browser that is logged in to Substack as the publication owner.

1. Ask the creator to log in at `https://app.rubiconpay.xyz/dashboard`. Privy offers an email one-time code or X OAuth. Only the creator can do this. For new accounts, the onboarding dialog opens automatically.
2. **Step 1 — connect.** Enter the publication. Accepted forms: `wenkafka`, `wenkafka.substack.com`, `https://wenkafka.substack.com`, or the URL of any post on the publication. Rubicon validates that the publication exists.
3. **Step 2 — import.** Open `https://{subdomain}.substack.com/publish/settings#import-export-settings`. This page works only in a browser logged in as the publication owner.
4. Click `New export`. Substack takes several minutes to prepare the export. Wait, then reload the page if needed.
5. Download the export ZIP.
6. Drop the ZIP on the Rubicon import step.
7. **Step 3 — price.** Rubicon asks for one global price per word in USDC. Per-post overrides are available later in the dashboard.
8. Show the price to the creator and get explicit approval. Never set pricing autonomously.
9. After approval, click `Go live`. This publishes the gate page.

## Path B: email import

Use this path if you cannot drive the creator's browser. Agents with their own inboxes (for example AgentMail) can complete this path end-to-end once they have the ZIP.

1. Obtain the Substack export ZIP. Only the publication owner can download it (steps 3–5 of Path A); have the creator do that once and hand you the file.
2. Send one email:
   - To: `micacao15@gmail.com`
     <!-- TEMPORARY ADDRESS: a dedicated import inbox is planned. When it ships, update this address here and in /llms.txt by hand. -->
   - Subject: `Rubicon import — {subdomain}`, exactly. Example: `Rubicon import — wenkafka`.
   - Attachment: the export ZIP.
3. The ZIP must be ATTACHED. Substack's "export ready" email contains a login-gated download link that is useless to Rubicon. Forwarding that email without the attachment does nothing.
4. On success, the sender receives a reply containing the live gate page link.
5. If the ZIP is missing or unreadable, the reply explains what to send instead.

## Failure modes

| Problem | Fix |
| --- | --- |
| Publication not found | If the publication uses a custom domain, enter the `*.substack.com` address shown in the publication's settings, not the custom domain. |
| Export not ready | Substack takes minutes to prepare it. Wait, reload the export settings page, retry the download. |
| Wrong ZIP | Attach the original Substack export ZIP, unmodified. Do not re-zip its contents or send a different archive. |
| Import email not matched | Put the subdomain in the subject (`Rubicon import — {subdomain}`) and send from the email address the creator used to sign up for Rubicon. |

## Boundaries for agents

- Do not bypass or automate the Privy login. The creator logs in themselves.
- Do not touch payout or wallet settings. Those are human-only.
- Do not set, change, or publish prices without the creator's explicit approval.
- Only operate a Substack session that belongs to your human. Never use anyone else's session or credentials.
