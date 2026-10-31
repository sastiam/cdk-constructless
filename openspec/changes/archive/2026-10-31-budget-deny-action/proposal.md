# Proposal

## Why

Stopping instances only covers resources that already exist. The research's recommended cut-off is a Budget Action that
applies an IAM deny policy at a threshold, so the lab role can no longer create or start compute. `APPLY_IAM_POLICY`
works in any account, unlike SCP actions, which need the management account.

## What Changes

- New `BudgetDenyAction` construct: a customer-managed IAM deny policy (compute creation and start by default) and a
  `CfnBudgetsAction` `APPLY_IAM_POLICY` that attaches it to the given roles, users or groups.
- `BudgetActionExecutionRole.allowApplyIamPolicy(policy)`: attach/detach permissions restricted to that policy ARN.
- Shared action types (subscribers, approval model, threshold type) move to `src/finops/budget-action-common.ts`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `budget-actions`: adds the IAM deny action (ADDED requirements).

## Impact

New `src/finops/budget-deny-action.ts`, `src/finops/budget-action-common.ts`; edits `budget-action-execution-role.ts`, `budget-stop-instances-action.ts` (imports only); tests; docs page.
