# Proposal

## Why

A Budget Action runs with an IAM role that AWS Budgets assumes. The research found that hand-written roles
miss the confused-deputy conditions and over-grant. A dedicated role construct gives least privilege per action type.

## What Changes

- New `BudgetActionExecutionRole` construct: role trusted by `budgets.amazonaws.com` with `aws:SourceAccount` and `aws:SourceArn` conditions.
- `allowStopInstances(target)` grants exactly what AWS's managed policy `AWSBudgetsActions_RolePolicyForResourceAdministrationWithSSM`
  grants for the stop side (EC2 or RDS), restricted to calls made via SSM.

## Capabilities

### New Capabilities

- `budget-actions`: AWS Budgets actions that act on resources when a budget threshold is crossed, and their execution roles.

### Modified Capabilities

None.

## Impact

New `src/finops/budget-action-execution-role.ts`, tests, README section.
