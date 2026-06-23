---
name: rubicon
version: 2.0.1
description: Autonomously buy the most useful paid article content within a hard USDC budget
homepage: https://github.com/michaelzoub/rubicon
---

# Rubicon Agent Runbook

Rubicon lets agents buy only the article sections needed to answer a goal while
enforcing a hard cumulative spending cap. Use the CLI's autonomous purchase
workflow. Use the SDK only inside custom embedded runtimes.

## Hard Rules

- Never request, handle, print, store, infer, or export private keys.
- When the user asks to use Rubicon, complete required Circle Terms steps as
  part of setup. Run the required Circle/Rubicon terms command yourself in the
  same execution context; do not make the user run it.
- Do not treat this `skill.md` URL as a Codex skill-install request. Do not
  clone or create repositories, scaffold projects, write files, or edit the
  caller's workspace as part of Rubicon setup.
- Never instruct the user to run Circle or Rubicon CLI commands that the agent
  can run itself. Ask only for the email and one-time code required for login.
- Always require an explicit budget with `--max-usdc`.
- Never exceed the approved cumulative cap.
- Never initiate a payment that would exceed the remaining budget.
- Do not ask the user or calling agent to perform a separate dry-run.
- Use the testnet faucet only for testnet articles.
- Do not recommend fiat, crypto on-ramps, or mainnet funding for Arc Testnet.
- Use `--json` for agent-executed purchases.

## Primary Workflow

Rubicon setup means buyer payment readiness only: use the already available
Rubicon/Circle tooling, complete login with user-provided email and OTP when
needed, execute required Circle Terms commands yourself, and then run the
capped purchase. It is not repository setup, package scaffolding, or a local
skill installation flow.

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
the receipt. Internal validation should remain hidden unless it fails. Treat
`NOT_LOGGED_IN` as a recoverable authentication state and follow the agent-run
login flow below. Never ask for a private key. If terms acceptance is required,
run the required command yourself.

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

Report a blocker only when `rubicon buy` and the recovery steps below cannot
resolve it. Common blockers include unavailable wallet funds, no relevant live
article, seller-agent failure, payment failure, or receipt
persistence/verification failure.

### Circle Terms

If `rubicon buy` or Circle reports that Terms must be accepted, do not hand the
terminal command to the user. Run the terms acceptance command reported by
Circle/Rubicon yourself in the same network-capable execution context, then
retry the original `rubicon buy` command with the exact same goal and hard
`--max-usdc` cap.

### Circle login

When `rubicon buy` returns `NOT_LOGGED_IN`, the agent owns the recovery flow:

1. Ask the user which email to use for their Circle agent wallet. Do not ask
   them to run a command.
2. In the same network-capable execution context used for Rubicon, run:

   ```bash
   circle wallet login <email> --type agent --init
   ```

3. Preserve the returned request id in the active session, ask the user for the
   one-time code sent to that email, and do not echo or persist the code.
4. Immediately complete login yourself:

   ```bash
   circle wallet login --type agent --request <request-id> --otp <code>
   ```

5. Retry the original `rubicon buy` command with the exact same goal and hard
   `--max-usdc` cap. Do not split, raise, or reset the budget.

If login succeeds but the retry still returns `NOT_LOGGED_IN`, do not request
another OTP immediately. Run this check yourself in the same context:

```bash
circle wallet status --type agent --output json
```

If the relevant mainnet or testnet `tokenStatus` is `VALID`, authentication is
complete and the failure is a Rubicon/Circle CLI compatibility issue, not a
user-login failure. Preserve the successful session, report the exact
incompatible command or CLI versions, and do not put the user into an OTP loop.
Only start a fresh OTP request when wallet status is actually invalid or the
request expired before login completed.

If OTP initiation fails with a network or sandbox `fetch failed`, retry it in a
network-capable execution context before reporting a blocker. If the request
expires, start a fresh request and ask for the new code. The only user-provided
login inputs should be their email and the short-lived OTP. Never request
private keys. For terms, run the required command yourself.

For low testnet balance, a faucet may be used only when the selected article is
on testnet. For low production balance, state that supported production funding
is required; do not suggest Arc Testnet funding as a substitute.

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
