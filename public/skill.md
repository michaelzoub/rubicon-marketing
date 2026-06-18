---
name: rubicon
version: 1.0.0
description: Set up Rubicon for AI agents - consume pay-per-word articles through the buyer SDK and hosted gateway
homepage: https://github.com/michaelzoub/rubicon
---

# Rubicon For AI Agents

Rubicon lets an AI agent read paid articles one word at a time. The buyer agent
opens a budgeted session, pays for each delivered word, stops when it has enough
information, and receives a final receipt. Use the SDK for normal integrations;
do not hand-wire the HTTP session/payment/abort routes unless the user asks for
a custom protocol test.

## Decision Flow

When a user asks you to test or integrate Rubicon:

1. **Use the SDK first** — prefer `@rubicon-caliga/agent-sdk` and
   `rubicon.run(...)` for the full flow.
2. **Pass the gateway URL explicitly** — use the hosted Rubicon gateway
   `https://rubicon-caligagateway-production.up.railway.app` unless the user
   provides a different hosted gateway.
3. **Use lower-level SDK methods only for custom flows** — `startSession`,
   `payForWord`, `abort`, and `streamEvents` exist, but the happy path is
   `run(...)`.

## Quick Start

Install the buyer SDK:

```bash
pnpm add @rubicon-caliga/agent-sdk
```

Then use the hosted gateway URL provided by the user or environment:

```ts
import Rubicon from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL ?? "https://rubicon-caligagateway-production.up.railway.app",
  authorization: process.env.RUBICON_AGENT_API_KEY
    ? `Bearer ${process.env.RUBICON_AGENT_API_KEY}`
    : undefined,
});

const receipt = await rubicon.run({
  articleId: "rubicon-streaming-001",
  goal: "Find the resale-fee clause",
  maxSpendAtomic: "20000",
  onWord: (word) => {
    process.stdout.write(`${word} `);
  },
});

console.log("\nreceipt:", receipt);
```

Expected result: words stream to stdout, followed by a receipt containing
`sessionId`, `articleId`, `wordsRead`, `amountPaidAtomic`, `payments`,
`transactionHashes`, `text`, `completed`, and `stopReason`.

## Agent Wallet Setup

Rubicon assumes the buyer is an agent with its own wallet. When the user asks
for wallet setup, use a **Circle Agent Wallet** managed through the **Circle
CLI**. This is the default path — do not fall back to a raw private-key wallet
(for example, passing `privateKey` to `CircleGatewayPaymentEngine`) unless the
user explicitly requests it.

For the latest Circle Agent Stack docs, fetch the documentation index first and
use it to discover the relevant setup, Agent Wallet, and Nanopayments pages:

```bash
curl -sL https://developers.circle.com/llms.txt
```

Then fetch Circle's Agent Wallet setup flow and follow it exactly:

```bash
curl -sL https://agents.circle.com/skills/setup.md
```

> The setup guide uses **BASE** as its default example chain. Circle Agent
> Wallets are **not** BASE-only — they also support Arc Testnet, which is the
> chain Rubicon uses for testnet reads. Substitute the Arc Testnet identifier
> wherever the guide shows `BASE`.

### Arc Testnet chain identifiers

Rubicon's testnet runs on Arc Testnet. Confirm the live identifiers with:

```bash
circle blockchain list
```

Expected values for Arc Testnet:

| Field            | Value                              |
| ---------------- | ---------------------------------- |
| CLI chain id     | `ARC-TESTNET`                      |
| EVM chain id     | `5042002`                          |
| RPC URL          | `https://rpc.testnet.arc.network`  |

Use `ARC-TESTNET` as the `--chain` value for all Circle CLI wallet commands on
Rubicon testnet. Mainnet and testnet Circle CLI sessions are separate — a
mainnet login does not authenticate testnet commands, and vice versa.

### Terms acceptance

Circle CLI may require Terms acceptance before any wallet command works. Show
the live output to the user:

```bash
circle terms show --init --output json
```

Review the URLs and notice from that JSON with the user, then accept **only
after explicit user consent**:

```bash
circle terms accept --output json
```

### Wallet login / authentication

If a wallet command such as

```bash
circle wallet list --chain ARC-TESTNET --type agent --output json
```

fails with an auth-required error, start a testnet agent login:

```bash
circle wallet login <email> --type agent --testnet --init
```

Circle emails an OTP. Pause for the wallet controller to provide the OTP and the
request id, then complete the login:

```bash
circle wallet login --request <request-id> --otp <code>
```

Never invent, bypass, or retry OTP values without the controller's instruction.
Do not store OTPs, private keys, or API keys in this file, in env files, or in
logs.

### Funding via Circle Faucet

Circle's faucet supports Arc Testnet and can send testnet USDC. If the wallet is
unfunded, give the controller the Arc Testnet wallet address and direct them to
fund it at:

```
https://faucet.circle.com
```

The controller can also drip testnet USDC straight from the Circle CLI instead of
the web faucet:

```bash
circle wallet fund --address <agent-wallet-address> --chain ARC-TESTNET --token usdc
```

This delivers USDC to the agent wallet on Arc Testnet (you may see both the
native-gas 18-decimal balance and the 6-decimal ERC-20 USDC balance). Only the
wallet controller should run this, and only when they have asked you to fund.

### On-chain balance vs. Gateway/Nanopayments balance

**Funding the on-chain wallet is not the same as funding the Gateway
(Nanopayments) balance.** A wallet can hold 40 USDC on Arc Testnet while its
Gateway balance is still `0`, in which case a real (non-zero-priced) paid read is
blocked at payment time. Circle's Gateway batches signed x402 authorizations and
settles them from the Gateway balance, so the wallet controller must additionally
**deposit USDC into the Gateway balance** before paid reads work.

The deposit is a separate Circle CLI step. Confirm the exact subcommand and flags
against the live tooling rather than guessing — for example:

```bash
circle gateway --help
```

and the Gateway / Nanopayments pages discoverable from
`https://developers.circle.com/llms.txt`. Treat depositing as a wallet-controller
action with explicit consent, the same as wallet creation and funding.

### Pre-paid-read checklist

Before any paid Rubicon read:

1. **Confirm the budget** with the user for this specific request (see Buyer
   Budget Confirmation).
2. **List/find the wallet** on the requested chain — usually `ARC-TESTNET` for
   Rubicon testnet:
   ```bash
   circle wallet list --chain ARC-TESTNET --type agent --output json
   ```
3. **Check the wallet balance** to confirm it covers the budget, **and
   separately check the Gateway/Nanopayments balance** — an on-chain wallet
   balance does not imply a funded Gateway balance (see "On-chain balance vs.
   Gateway/Nanopayments balance"). For non-zero-priced articles, payment settles
   from the Gateway balance.
4. **If unfunded**, provide the Arc Testnet wallet address and tell the user to
   fund it via Circle Faucet (https://faucet.circle.com) or `circle wallet fund`,
   and to deposit into the Gateway balance for paid reads. Stop and wait.
5. **Only start the paid Rubicon read once both the wallet and the Gateway
   balance cover the confirmed budget.**

The person controlling the wallet/funds should create the Circle Agent Wallet,
fund it, and set spending policies such as transfer limits, recipient
allowlists, and contract blocklists before the agent starts a paid read. The SDK
should consume an already configured wallet-backed payment capability and keep
enforcing the user's confirmed Rubicon budget. Do not create wallets, fund
wallets, change wallet policies, or use a personal key unless the wallet
controller has explicitly asked for that action.

Circle Agent Nanopayments are the recommended Circle-native production path for
x402-compatible services. In that flow, the agent uses Circle CLI to deposit
USDC into a Gateway balance, discover services, and pay with gas-free batched
USDC nanopayments.

### Explicit private-key path (only on request)

> **Custody caveat — these are two different signing paths, not a bridge.** The
> Circle Agent Wallet / Nanopayments path is custodial: Circle CLI signs on your
> behalf and never exposes the backing EOA's private key.
> `CircleGatewayPaymentEngine({ privateKey, rpcUrl })` is the opposite — it calls
> viem `privateKeyToAccount` and needs the raw private key of the backing EOA. A
> custodial Circle CLI wallet therefore gives you **no key to hand this engine**.
> If all you have is the custodial wallet, do not extract, export, or paste a
> private key to satisfy this engine, and do not treat the two as interchangeable.
> A real paid read against the hosted gateway needs either (a) a backing EOA
> whose key the controller has deliberately provided for this engine, or (b) a
> Circle-native payment capability that signs through the custodial wallet. If
> neither is available, stop and report the gap to the controller rather than
> working around custody.

If — and only if — the user explicitly asks to use a raw private-key wallet
instead of a Circle Agent Wallet, set the agent wallet environment:

```bash
RUBICON_PAYMENTS=circle
CIRCLE_PRIVATE_KEY=0x...
CIRCLE_RPC_URL=https://rpc.testnet.arc.network
CIRCLE_FACILITATOR_URL=https://gateway-api-testnet.circle.com
CIRCLE_X402_NETWORKS=eip155:5042002
```

Then create the buyer with a wallet-backed payment engine. Import
`CircleGatewayPaymentEngine` from the package root — it is not exposed as a
deep-import subpath, so `@rubicon-caliga/agent-sdk/dist/payment-engine.js` fails
with `ERR_PACKAGE_PATH_NOT_EXPORTED`:

```ts
import Rubicon, { CircleGatewayPaymentEngine } from "@rubicon-caliga/agent-sdk";

const paymentEngine = new CircleGatewayPaymentEngine({
  chain: "arcTestnet",
  privateKey: process.env.CIRCLE_PRIVATE_KEY as `0x${string}`,
  rpcUrl: process.env.CIRCLE_RPC_URL,
});

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL ?? "https://rubicon-caligagateway-production.up.railway.app",
  authorization: process.env.RUBICON_AGENT_API_KEY
    ? `Bearer ${process.env.RUBICON_AGENT_API_KEY}`
    : undefined,
  paymentEngine,
});
```

The end-to-end buyer flow is:

1. Confirm the user's maximum budget for this specific request.
2. Use the agent wallet to call the x402-protected Rubicon backend endpoint.
3. Let the gateway communicate with the article's seller agent to find useful
   sections and negotiate what to reveal next.
4. Open a paid stream and pay word by word from the agent wallet.
5. Stop and close the stream as soon as the user's goal is satisfied, the
   stop condition matches, or the approved budget would be exceeded.
6. Return the final receipt, including words read, amount paid, payment
   receipts, transaction hashes, completion state, and stop reason.

Prefer `rubicon.run(...)` for this lifecycle. It handles seller-agent
conversation, x402 payment headers, streaming words, budget enforcement, abort,
and receipt collection. Use `rubicon.read(...)` or lower-level methods only
when the user asks to inspect or customize a specific part of the protocol.

## SDK Surface

Primary method:

```ts
rubicon.run({
  articleId,
  goal,
  maxSpendAtomic,
  stopWhen,
  onWord,
  onEvent,
});
```

Streaming method:

```ts
for await (const event of rubicon.read(options)) {
  // session.started, seller.message, article.word, article.usage, article.completed
}
```

Lower-level methods for custom flows:

```ts
rubicon.getRepository()
rubicon.getNavigation(articleId, goal)
rubicon.startConversation(input)
rubicon.sendConversationMessage(conversationId, message)
rubicon.startSession(request)
rubicon.payForWord(sessionId, payment)
rubicon.abort(sessionId, reason)
rubicon.streamEvents(sessionId, onEvent)
```

`payForWord` returns one released word plus a per-word `payment` receipt. The
same receipt is mirrored in the gateway's `PAYMENT-RESPONSE` header.

## Payment Modes

Unpaid dry-run mode uses `StaticPaymentEngine` and settles no real funds. This
is the default when no payment engine is passed. It is only suitable for local
dry runs: the hosted production gateway **rejects** the default static engine
(scheme `development-static`) — a paid call against it fails with
`500 Unsupported x402 version: undefined`. To read against the hosted gateway you
must pass a real payment capability backed by a funded Circle Agent Wallet /
Gateway balance, not the static dry-run engine.

Circle Agent Nanopayments mode uses Circle CLI and Gateway Nanopayments for
gas-free, batched USDC payments to x402-compatible services. Set up Circle
Agent Wallet and Gateway balance first, then use the Rubicon SDK only after the
Circle payment capability is configured. Circle CLI onboarding may require the
wallet controller to accept Circle's terms of service and complete an email OTP
challenge before deposits, service discovery, or payments are available.

Prefer the Circle Agent Wallet / Circle CLI flow above for real settlement.
`CircleGatewayPaymentEngine` with an explicit `privateKey` is the raw private-key
path and should only be used when the user explicitly asks for it:

```ts
import Rubicon, { CircleGatewayPaymentEngine } from "@rubicon-caliga/agent-sdk";

const rubicon = new Rubicon({
  baseUrl: process.env.RUBICON_GATEWAY_URL ?? "https://rubicon-caligagateway-production.up.railway.app",
  authorization: process.env.RUBICON_AGENT_API_KEY
    ? `Bearer ${process.env.RUBICON_AGENT_API_KEY}`
    : undefined,
  paymentEngine: new CircleGatewayPaymentEngine({
    chain: "arcTestnet",
    privateKey: process.env.CIRCLE_PRIVATE_KEY as `0x${string}`,
    rpcUrl: process.env.CIRCLE_RPC_URL ?? "https://rpc.testnet.arc.network",
  }),
});
```

## Hosted Gateway Environment

On Railway, set:

```bash
RUBICON_GATEWAY_URL=https://rubicon-caligagateway-production.up.railway.app
RUBICON_AGENT_API_KEY=your-shared-buyer-agent-secret
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
RUBICON_PAYMENTS=circle
CIRCLE_FACILITATOR_URL=https://gateway-api-testnet.circle.com
CIRCLE_X402_NETWORKS=eip155:5042002
```

`RUBICON_AGENT_API_KEY` protects the Rubicon HTTP API. `OPENAI_API_KEY` powers
the hosted seller agent's navigation/conversation model.

## Buyer Budget Confirmation

Before starting a paid Rubicon read, ask the user what maximum budget they
approve for the specific article/data request. Do not guess the budget, infer it
from wallet balance, or start paying just because credentials are configured.
Use the user's confirmed limit as `maxSpendAtomic` or `budget.maxAmountAtomic`,
and stop as soon as the task is satisfied or the approved budget would be
exceeded.

Budgets are expressed in atomic USDC units (6 decimals). For example,
`$0.02 USDC` equals `20000` atomic units.

## Raw HTTP Protocol

Prefer the SDK. `rubicon.run(...)` is the path that assembles the session, the
x402 payment payload, streaming, budget enforcement, abort, and the receipt
correctly. The hosted gateway's payment flow is **not** a stock x402 challenge
(see below), so a generic x402 client — including Circle's own `circle services
pay` — cannot drive it; reach for the raw routes only to inspect or debug, and
expect to reproduce what the SDK does by hand.

Gateway endpoints:

- `GET /v1/repository`
- `GET /v1/articles/:articleId/navigation`
- `POST /v1/seller-agent/conversations`
- `POST /v1/sessions`
- `POST /v1/sessions/:sessionId/payments`
- `GET /v1/sessions/:sessionId/events`
- `POST /v1/sessions/:sessionId/abort`

### Article discovery (observed quirk)

`GET /v1/repository` (and `GET /v1/articles`) can return `{"articles":[]}` even
when a catalog exists. Adding **any** query string surfaces the real catalog —
e.g. `GET /v1/articles?status=published`. If a discovery call comes back empty,
retry with a query string before concluding that no articles exist.

Article IDs use the form `article_<uuid>` (the `rubicon-streaming-001` style id
in the Quick Start is an illustrative placeholder). Read the real id from the
discovery response rather than assuming a slug.

### Session creation (`POST /v1/sessions`) — budget shape

The raw session body must carry the budget as a nested object, **not** a flat
`maxSpendAtomic` field (`maxSpendAtomic` is the SDK `run(...)` convenience
parameter; the SDK translates it into this object for you):

```jsonc
{
  "articleId": "article_<uuid>",
  "budget": { "currency": "USDC", "maxAmountAtomic": "20000" }
  // ...other session fields
}
```

If you omit the `budget` object, session creation currently still returns 200,
but the later payment call 500s with
`Cannot read properties of undefined (reading 'maxAmountAtomic')` because it
reads `session.budget.maxAmountAtomic`. Always send the exact `budget` object
above when hand-wiring.

The session-creation **200 response carries the payment challenge in its body**
(a `paymentRequired` field). The challenge is *not* delivered as a separate
`402` response on the payments route, which is why a stock x402 client that waits
for a `402` cannot pay this gateway.

### Paying (`POST /v1/sessions/:sessionId/payments`)

This route does not emit a `402` challenge; it consumes a signed payload built
from the `paymentRequired` challenge returned at session creation. Body shape:

```jsonc
{
  "paymentPayload": { /* signed x402 payload for the challenge */ },
  "idempotencyKey": "<unique-key>"
}
```

An empty or malformed body currently returns `500 Internal Server Error` rather
than a `400` with a schema, so validate the body locally before sending.
