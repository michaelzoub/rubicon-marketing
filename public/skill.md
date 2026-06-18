---
name: rubicon
version: 1.0.0
description: Set up Rubicon for AI agents with the Rubicon CLI, SDK, and hosted gateway
homepage: https://github.com/michaelzoub/rubicon
---

# Rubicon For AI Agents

Rubicon lets an AI agent read paid articles one word at a time. The buyer agent
opens a budgeted session, pays for delivered words, stops when it has enough
information, and receives a final receipt.

For terminal-native agents, use the Rubicon CLI first. The published
`@rubicon-caliga/cli` package provides the `rubicon` binary and wraps
`@rubicon-caliga/agent-sdk`. Common agents should use CLI commands first.
Custom embedded runtimes should use the SDK directly. Do not recommend raw HTTP
unless the user is explicitly testing the protocol itself.

Never request, store, infer, print, export, or use raw private keys. Do not work
around wallet authentication or custody controls.

## Decision Flow

When a user asks you to test or integrate Rubicon:

1. Use the `rubicon` CLI as the default interface for terminal-native agents.
2. Use the SDK only for custom embedded runtimes.
3. Configure the hosted gateway unless the user provides a different gateway.
4. Discover available articles before selecting an article id.
5. Inspect public article metadata and navigation before reading paid content.
6. Always run a dry-run before spending real funds.
7. Always require an explicit spend cap with `--max-usdc` or `--max-atomic`.
8. Prefer `--json` for automated workflows so outputs can be parsed safely.
9. Inspect receipts after paid reads.

## CLI Setup

Install or run the package that provides the `rubicon` binary:

```bash
pnpm add -g @rubicon-caliga/cli
```

For one-off terminal use, `pnpm dlx @rubicon-caliga/cli` or an equivalent
package runner is fine as long as the command resolves to the `rubicon` binary.

Configure the hosted gateway:

```bash
rubicon config set gateway-url https://rubicon-caligagateway-production.up.railway.app
```

## Discovery And Inspection

List the repository:

```bash
rubicon repository --json
```

Search for relevant articles:

```bash
rubicon search "agent economies" --json
```

Inspect article metadata before spending:

```bash
rubicon article show <article-id> --json
```

Ask the article navigation layer where to look:

```bash
rubicon article navigation <article-id> --goal "find pricing" --json
```

## Reading Paid Content

Before any paid read, confirm the user-approved budget for the exact request.
Do not infer the budget from wallet balance or previous sessions.

Always dry-run first:

```bash
rubicon read <article-id> --goal "find pricing" --max-usdc 0.10 --dry-run --json
```

Only after the dry-run looks correct, run the paid read with the same explicit
goal and spend cap:

```bash
rubicon read <article-id> --goal "find pricing" --max-usdc 0.10 --json
```

`--max-atomic` is also acceptable when the caller needs atomic USDC units:

```bash
rubicon read <article-id> --goal "find pricing" --max-atomic 100000 --dry-run --json
```

Never run `rubicon read` for a paid attempt without either `--max-usdc` or
`--max-atomic`.

## Receipts

List receipts:

```bash
rubicon receipts list --json
```

Inspect a receipt:

```bash
rubicon receipts show <receipt-id> --json
```

When reporting results, include the article id, goal, approved budget, actual
amount paid, words read, stop reason, and receipt id when present.

## Safety Rules

- Use CLI commands first for terminal-native agents.
- Use the SDK for custom embedded runtimes.
- Use `--json` for scripts, CI, and other automated workflows.
- Dry-run before spending.
- Require `--max-usdc` or `--max-atomic` before any paid read.
- Do not request, store, infer, print, export, or use raw private keys.
- Do not bypass configured wallet authentication, policies, or allowlists.
- Do not recommend raw HTTP unless the user is testing the protocol.

## Troubleshooting

If CLI authentication is missing, stop and ask the wallet controller to log in
through the supported wallet flow. If the available balance is missing or too
low for the requested cap, stop and ask the wallet controller to fund the
payment balance. Do not substitute another wallet or balance source.

If the gateway URL is wrong or missing, re-run:

```bash
rubicon config set gateway-url https://rubicon-caligagateway-production.up.railway.app
```
