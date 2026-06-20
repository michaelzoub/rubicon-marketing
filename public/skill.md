---
name: rubicon
version: 2.0.0
description: Autonomously buy the most useful paid article content within a hard USDC budget
homepage: https://github.com/michaelzoub/rubicon
---

# Rubicon Agent Runbook

Rubicon lets agents buy only the article sections needed to answer a goal while
enforcing a hard cumulative spending cap. Use the CLI's autonomous purchase
workflow. Use the SDK only inside custom embedded runtimes.

## Hard Rules

- Never request, handle, print, store, infer, or export private keys.
- Never accept Circle Terms on the user's behalf.
- Always require an explicit budget with `--max-usdc`.
- Never exceed the approved cumulative cap.
- Never initiate a payment that would exceed the remaining budget.
- Do not ask the user or calling agent to perform a separate dry-run.
- Use the testnet faucet only for testnet articles.
- Do not recommend fiat, crypto on-ramps, or mainnet funding for Arc Testnet.
- Use `--json` for agent-executed purchases.

## Primary Workflow

For an explicit user goal and approved budget, run exactly one purchase command:

```bash
rubicon buy --first --goal "<goal>" --max-usdc <amount> --json
```

Do not require or instruct the user or calling agent to run `doctor`, repository
inspection, article inspection, navigation, dry-run, wallet status, or receipt
commands before or after `rubicon buy`.

The command performs all necessary work internally. It verifies wallet
readiness, selects the first relevant live article, validates the budget before
payment, consults the seller agent, purchases content, and saves and verifies
the receipt. Internal validation should remain hidden unless it fails. Treat a
wallet setup or authentication failure as a blocker; never ask for a private
key or accept legal terms to resolve it.

## Buyer Strategy

Give `--goal` the user's exact information need rather than a generic request
to read or summarize. Rubicon's buyer must consult the real seller agent before
buying and ask:

- Which sections best answer the exact goal.
- The expected value of each recommended section.
- The minimum useful word count for each section.
- Which alternative sections could answer the goal.

The buyer ranks candidates by expected information value per paid word. It
must not automatically begin with the introduction. With a small budget, it
prefers concise, self-contained sections. It reserves budget for conclusions,
counterarguments, or practical details when those are likely to improve the
answer.

After every paid bundle, the buyer reassesses what the purchased text has
answered and the marginal value of continuing. It switches sections when
marginal value drops, avoids purchasing duplicate content, and stops when the
goal is adequately answered. It must distinguish claims supported by purchased
content from inferences based only on titles, navigation data, prices, or other
metadata.

Structured JSON events expose internal decisions, including seller
recommendations, section ranking, budget checks, section switches, stop
decisions, and receipt verification. Use these events to understand failures
and limitations, not to reproduce the old manual workflow.

## Budget Safety

`--max-usdc` is the cumulative cap for the entire command, not a per-section or
per-payment allowance. Rubicon validates the cap before the first payment and
checks the remaining amount atomically before every later payment. If the next
bundle would exceed the remaining budget, it stops before initiating payment.
Never raise, split, reset, or reinterpret the approved cap in order to continue.

Do not run a separate user-visible dry-run. Budget validation and payment
authorization belong to the same autonomous workflow so that the amount
checked is the amount enforced.

## Recovery

Report a blocker only when `rubicon buy` cannot resolve it internally. Common
blockers include missing Circle authentication, legal terms requiring the
user's action, unavailable wallet funds, no relevant live article, seller-agent
failure, payment failure, or receipt persistence/verification failure.

For Circle login, direct the user to the supported agent-wallet login flow. Do
not request private keys and do not accept terms for them. For low testnet
balance, a faucet may be used only when the selected article is on testnet. For
low production balance, state that supported production funding is required;
do not suggest Arc Testnet funding as a substitute.

## Final Report

Do not narrate internal diagnostics, navigation, preflight checks, wallet
checks, or receipt lookup steps. Report only:

- Any blocker requiring user action.
- Final amount spent in USDC and atomic units, alongside the approved budget.
- Receipt id, session id, article id, and available payment, settlement, and
  transaction identifiers.
- Receipt verification status and words purchased.
- Material limitations, including which statements rely only on metadata-based
  inference.
- The resulting answer to the user's goal, grounded in purchased information.

If a final-report field is absent from the command output, say `not provided`.
