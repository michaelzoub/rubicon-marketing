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
6. Identify the article network and prepare the matching payment wallet.
7. Always run a dry-run before spending real funds.
8. Always require an explicit spend cap with `--max-usdc` or `--max-atomic`.
9. Prefer `--json` for automated workflows so outputs can be parsed safely.
10. Inspect receipts after paid reads.

## CLI Setup

Install or run the package that provides the `rubicon` binary. For one-off
terminal use, prefer:

```bash
pnpm dlx @rubicon-caliga/cli
```

Global installation is also acceptable:

```bash
pnpm add -g @rubicon-caliga/cli
```

Configure the hosted gateway:

```bash
rubicon config set gateway-url https://rubicon-caligagateway-production.up.railway.app
```

## Discovery And Inspection

List the repository:

```bash
rubicon repository --json
```

For a "find the first article and summarize it under $0.01" task, use the
first available repository article returned by this command unless the user
gave a more specific selection rule.

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

## Circle CLI Payment Mode

Rubicon may use Circle CLI payment mode. In this mode, the buyer must be logged
in with a Circle agent wallet before paid reads can complete. Do not ask for or
handle private keys. Use the Circle CLI login flow only.

Check agent wallet status:

```bash
circle wallet status --type agent --output json
```

If login is required, initialize the agent wallet login:

```bash
circle wallet login <email> --type agent --init
```

Then complete login with the request id and one-time code supplied through the
supported Circle flow:

```bash
circle wallet login --type agent --request <request-id> --otp <code>
```

## Network Mapping

Map the article network to the Circle chain name before checking balances or
funding wallets.

| Rubicon network | Rubicon networkLabel | Circle chain |
| --- | --- | --- |
| `eip155:5042002` | `Arc Testnet` | `ARC-TESTNET` |

For example, an article with `network` set to `eip155:5042002` and
`networkLabel` set to `Arc Testnet` should use Circle chain `ARC-TESTNET`.

## Testnet Funding

If the selected article is on a testnet, check the Circle agent wallet balance
on the mapped chain before attempting a paid read:

```bash
circle wallet list --chain ARC-TESTNET --type agent --output json
circle wallet balance --address <addr> --chain ARC-TESTNET --output json
```

If the testnet balance is too low for the approved cap, use Circle's faucet
behavior:

```bash
circle wallet fund --address <addr> --chain ARC-TESTNET --token usdc --output json
```

Do not tell users to use fiat funding, crypto on-ramps, or mainnet funding
paths for testnet articles.

## Reading Paid Content

Before any paid read, confirm the user-approved budget for the exact request.
Do not infer the budget from wallet balance or previous sessions.

Always dry-run first. For a "find the first article and summarize it under
$0.01" task, use:

```bash
rubicon read <article-id> --goal "summarize the article" --max-usdc 0.01 --dry-run --json
```

For other goals or budgets, keep the user's exact goal and cap:

```bash
rubicon read <article-id> --goal "find pricing" --max-usdc 0.10 --dry-run --json
```

Only after the dry-run looks correct, run the paid read with the same explicit
goal and spend cap. For the first-article summary task:

```bash
rubicon read <article-id> --goal "summarize the article" --max-usdc 0.01 --json
```

For other goals or budgets:

```bash
rubicon read <article-id> --goal "find pricing" --max-usdc 0.10 --json
```

`--max-atomic` is also acceptable when the caller needs atomic USDC units:

```bash
rubicon read <article-id> --goal "find pricing" --max-atomic 100000 --dry-run --json
```

Never run `rubicon read` for a paid attempt without either `--max-usdc` or
`--max-atomic`.

Paid reads currently stream word-by-word and can be slow. Wait until the read
reports completion, including `article.completed` and `receipt.saved`, before
final reporting. Do not summarize partial paid-read output as final.

## Receipts

List receipts:

```bash
rubicon receipts list --json
```

Inspect a receipt:

```bash
rubicon receipts show <receipt-id> --json
```

When reporting results, inspect the saved receipt and include:

- Article id.
- Title and author.
- Goal.
- Approved budget.
- Amount paid in atomic units and USDC.
- Words read.
- Stop reason.
- Receipt id.

If the receipt buyer wallet differs from the wallet listed by Circle for the
mapped chain, this may be due to payment abstraction or Gateway behavior.
Report the receipt value exactly and do not try to manually "fix" or rewrite
wallet values.

## Safety Rules

- Use CLI commands first for terminal-native agents.
- Use the SDK for custom embedded runtimes.
- Use `--json` for scripts, CI, and other automated workflows.
- Dry-run before spending.
- Require `--max-usdc` or `--max-atomic` before any paid read.
- Never exceed the user-approved cap.
- Do not request, store, infer, print, export, or use raw private keys.
- Do not bypass configured wallet authentication, policies, or allowlists.
- Do not recommend raw HTTP unless the user is testing the protocol.

## Troubleshooting

If Rubicon or Circle CLI authentication is missing, stop and ask the wallet
controller to log in through the supported wallet flow. For Circle CLI payment
mode, use the agent wallet commands in the "Circle CLI Payment Mode" section.

If the available balance is missing or too low for the requested cap, check
whether the article is on a testnet. For testnet articles, use the Circle
faucet funding flow in the "Testnet Funding" section. For non-testnet articles,
ask the wallet controller to fund the payment balance through the appropriate
supported production funding flow. Do not substitute another wallet or balance
source.

If the gateway URL is wrong or missing, re-run:

```bash
rubicon config set gateway-url https://rubicon-caligagateway-production.up.railway.app
```
