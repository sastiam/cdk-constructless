# Proposal

## Why

Consumers want one construct for the research's recommended setup: a budget with alerts on a notification-only topic,
a billing alarm as backup, and optional automatic cut-offs that never share the alerts topic.

## What Changes

- New `FinOpsGuardrail` (L3) composing `AlertsTopic`, `CostBudget`, optional `BillingAlarm`, optional `BudgetStopInstancesAction`
  and optional `BudgetDenyAction`. Budget notifications and the alarm use the alerts topic; actions notify their own e-mail subscribers.

## Capabilities

### New Capabilities

- `finops-guardrail`: one-call cost guardrail for an account.

### Modified Capabilities

None.

## Impact

New `src/finops/finops-guardrail.ts`, tests, docs page.
