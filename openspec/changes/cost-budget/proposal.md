# Proposal

## Why

Budget Actions (E1) need a budget to attach to, and the FinOps research shows hand-written `CfnBudget` code
easily gets thresholds and subscribers wrong. A typed `CostBudget` construct is the base for every budget feature.

## What Changes

- New `CostBudget` construct (monthly `COST` budget in USD) with validated limit, thresholds and subscribers.
- Default thresholds: 60/80/100 % actual and 100 % forecasted, created only when subscribers are given.
- Exposes `budgetName` and the underlying `CfnBudget` for Budget Actions.

## Capabilities

### New Capabilities

- `cost-budget`: monthly cost budgets with threshold notifications to e-mail and SNS subscribers.

### Modified Capabilities

None.

## Impact

New `src/finops/cost-budget.ts`, `test/finops/cost-budget.test.ts`, README section, export from `src/index.ts`.
