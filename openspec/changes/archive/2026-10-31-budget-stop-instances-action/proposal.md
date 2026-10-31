# Proposal

## Why

Alarms and budgets only notify. The research concludes that cutting spend on a lab account needs an action, and
that the native `CfnBudgetsAction` with `RUN_SSM_DOCUMENTS` is the supported way to stop EC2 or RDS instances
when a budget threshold is crossed. Its L1 props are easy to misuse (missing dependency, wrong subtype, unscoped role).

## What Changes

- New `BudgetStopInstancesAction` construct wrapping `CfnBudgetsAction` (`RUN_SSM_DOCUMENTS`, subtype `STOP_EC2_INSTANCES` or `STOP_RDS_INSTANCES`).
- Validates 1-100 instance IDs, threshold range and 1-11 subscribers; depends on the `CostBudget` it targets.
- Creates a `BudgetActionExecutionRole` unless one is passed, and grants it the stop permissions for the target.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `budget-actions`: adds the stop-instances action requirements (ADDED requirements on the capability introduced by `budget-action-execution-role`).

## Impact

New `src/finops/budget-stop-instances-action.ts`, tests, README section. Depends on `cost-budget` and `budget-action-execution-role`.
