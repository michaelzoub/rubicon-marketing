---
name: rubicon
version: 1.0.0
description: Set up Rubicon for AI agents with the Rubicon CLI, SDK, and hosted gateway
homepage: https://github.com/michaelzoub/rubicon
---

# Rubicon Agent Runbook

Rubicon lets terminal agents buy paid article reads with a hard budget. Use the
CLI first. Use the SDK only inside custom embedded runtimes. Avoid raw HTTP
unless the user is testing the protocol.

Default task: find the first available article and summarize it under `$0.01`.

## Hard Rules

- Never request, handle, print, store, infer, or export private keys.
- Never accept Circle Terms on the user's behalf.
- Always require an explicit budget: `--max-usdc` or `--max-atomic`.
- Always dry-run before a paid read. `quickstart-read` is acceptable only when
  its JSON output documents that it performed or enforced this preflight.
- Never exceed the approved cap.
- Use the testnet faucet only for testnet articles.
- Do not recommend fiat, crypto on-ramp, or mainnet funding for Arc Testnet.
- Prefer `--json` for every agent-executed command.

## Fast Path

Use this first when the CLI supports it:

```bash
rubicon doctor --json
rubicon quickstart-read --first --goal "summarize the article" --max-usdc 0.01 --json
```

If `doctor` or `quickstart-read` is unknown, unavailable, too old, or does not
enforce a dry-run preflight, use the manual fallback below. If the local skill
seems stale, fetch the latest runbook:

```bash
curl -L https://www.rubiconpay.xyz/skill.md
```

## Manual Fallback

Configure the hosted gateway:

```bash
rubicon config set gateway-url https://rubicon-caligagateway-production.up.railway.app
```

Discover articles and select the first available article:

```bash
rubicon repository --json
```

Inspect the selected article:

```bash
rubicon article show <article-id> --json
rubicon article navigation <article-id> --goal "summarize the article" --json
```

Dry-run with the exact budget:

```bash
rubicon read <article-id> --goal "summarize the article" --max-usdc 0.01 --dry-run --json
```

Check Circle auth in the same network-capable context you will use for wallet
and read commands:

```bash
circle wallet status --type agent --output json
```

For Arc Testnet articles, require `data.testnet.tokenStatus` to be `VALID`.
Map Rubicon `eip155:5042002` / `Arc Testnet` to Circle `ARC-TESTNET`.

List wallet and check balance:

```bash
circle wallet list --chain ARC-TESTNET --type agent --output json
circle wallet balance --address <addr> --chain ARC-TESTNET --output json
```

If, and only if, the selected article is on a testnet and the balance is below
the approved cap, use the faucet:

```bash
circle wallet fund --address <addr> --chain ARC-TESTNET --token usdc --output json
```

Run the paid read with the same goal and cap:

```bash
rubicon read <article-id> --goal "summarize the article" --max-usdc 0.01 --json
```

Inspect the saved receipt:

```bash
rubicon receipts show <receipt-id> --json
```

## Circle Login

If Circle auth is required, use the supported agent-wallet flow only:

```bash
circle wallet login <email> --type agent --init
circle wallet login --type agent --request <request-id> --otp <code>
```

Do not ask for private keys. Do not accept legal terms for the user.

## Recovery Branches

- Stale local skill: fetch `https://www.rubiconpay.xyz/skill.md` and follow the
  latest instructions.
- Circle `fetch failed`: retry the same Circle command in a network-capable or
  escalated execution context.
- Expired OTP request: start a fresh OTP request with
  `circle wallet login <email> --type agent --init`.
- Auth valid in network context but not sandbox: keep Circle and Rubicon
  commands in the same network-capable context that reports valid auth.
- Buyer wallet differs from Circle wallet: report it as expected payment
  abstraction behavior; do not rewrite receipt values or switch wallets.
- Missing or wrong gateway: rerun the gateway config command above.
- Low testnet balance: faucet only if the selected article is testnet.
- Low non-testnet balance: ask the wallet controller to fund through supported
  production funding; do not suggest Arc Testnet mainnet or fiat funding.

## Final Report

After receipt inspection, report all fields below. If a field is absent in CLI
output, say `not provided`.

- Article title.
- Author.
- Article id.
- Session id.
- Receipt id.
- Words read.
- Amount paid atomic.
- Amount paid USDC.
- Budget.
- Completed.
- Stop reason.
- Payment ids.
- Settlement ids.
- Transaction hashes.
- Short summary.
