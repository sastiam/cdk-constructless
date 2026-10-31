# Proposal

## Why

In an AWS Organization, the strongest automatic cut-off is a Budget Action that attaches a deny SCP to member
accounts from the management account. Requirements from issue #71: reuse the existing execution role, create the SCP
unattached, and let the action attach it.

## What Changes

- New `BudgetScpAction` construct: an `AWS::Organizations::Policy` of type `SERVICE_CONTROL_POLICY` (deny compute by default, not attached)
  and a `CfnBudgetsAction` `APPLY_SCP_POLICY` targeting account or OU IDs.
- `BudgetActionExecutionRole.allowApplyScpPolicy()`: `organizations:AttachPolicy`/`DetachPolicy`/`DescribePolicy`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `budget-actions`: adds the SCP action (ADDED requirements).

## Impact

New `src/finops/budget-scp-action.ts`; edits `budget-action-execution-role.ts`; tests; docs page. Only deployable in the management account.
