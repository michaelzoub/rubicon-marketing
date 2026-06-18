---
name: rubicon
version: 1.0.0
description: Set up Rubicon for AI agents - consume pay-per-word articles through the buyer SDK and hosted gateway
homepage: https://github.com/michaelzoub/rubicon
---

# Rubicon For AI Agents

Rubicon lets an AI agent read paid articles one word at a time. For normal
paid reads, use the buyer SDK and a Circle CLI Agent Wallet payment engine. Do
not ask users for raw private keys.

## Circle CLI Agent Wallet Paid Read

Use `@rubicon-caliga/agent-sdk` with `CircleCliGatewayPaymentEngine`. This is
the recommended real paid-read path for Circle Agent Wallet custody on Arc
Testnet.

```ts
import Rubicon, { CircleCliGatewayPaymentEngine } from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL,
  paymentEngine: new CircleCliGatewayPaymentEngine({
    walletAddress: process.env.CIRCLE_AGENT_WALLET_ADDRESS as `0x${string}` | undefined,
    chain: "ARC-TESTNET",
  }),
});

const receipt = await rubicon.run({
  articleId,
  goal,
  maxSpendAtomic: "20000",
});
```

Practical notes:

- Rubicon payment terms use `network: "eip155:5042002"`, which corresponds to
  Circle CLI chain `ARC-TESTNET`.
- Check Circle Gateway balance with:
  ```bash
  circle gateway balance --address <agent-wallet-address> --chain ARC-TESTNET --output json
  ```
- Gateway settlement ids may look like UUIDs, not EVM transaction hashes.
- A successful Gateway nanopayment may not appear as a direct ERC-20 seller
  transfer on Arcscan.
- Verify success with the SDK receipt, Rubicon events, and Circle Gateway
  balance before/after.
- `receipt.buyerWalletAddress` may differ from the Agent Wallet address used for
  Gateway balance checks.

## Decision Flow

When a user asks you to test or integrate Rubicon:

1. Use `@rubicon-caliga/agent-sdk`.
2. Use `CircleCliGatewayPaymentEngine`.
3. Use Circle CLI / Circle Agent Wallet custody.
4. Use Arc Testnet / Circle CLI chain `ARC-TESTNET`.
5. Do not ask for raw private keys.

Use the hosted Rubicon gateway from `RUBICON_GATEWAY_URL`, or the gateway URL
the user provides.

## Install

```bash
pnpm add @rubicon-caliga/agent-sdk
```

Useful environment variables:

```bash
RUBICON_GATEWAY_URL=https://rubicon-caligagateway-production.up.railway.app
CIRCLE_AGENT_WALLET_ADDRESS=0x...
```

## Buyer Budget

Before starting a paid Rubicon read, confirm the user's maximum budget for this
specific request. Use that limit as `maxSpendAtomic` and stop as soon as the
goal is satisfied or the approved budget would be exceeded.

Budgets are expressed in atomic USDC units with 6 decimals. For example,
`$0.02 USDC` equals `20000` atomic units.

## Raw HTTP Note

Prefer the SDK unless explicitly testing raw protocol behavior.

- SDK callers use `maxSpendAtomic`.
- Raw `POST /v1/sessions` callers must use nested `budget`.
- `circle services pay` is not the right tool for Rubicon's current
  session-first payment route.

For raw session creation, the budget shape is:

```json
{
  "articleId": "article_<uuid>",
  "budget": {
    "currency": "USDC",
    "maxAmountAtomic": "20000"
  }
}
```

## Output

Return the final SDK receipt to the user. Highlight `sessionId`, `articleId`,
`wordsRead`, `amountPaidAtomic`, `completed`, `stopReason`, and any payment or
Gateway settlement ids reported by the SDK.
