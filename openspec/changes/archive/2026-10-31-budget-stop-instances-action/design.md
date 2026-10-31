# Design

## Context

CloudFormation `AWS::Budgets::BudgetsAction` requires `ActionThreshold`, `ActionType`, `BudgetName`, `Definition`,
`ExecutionRoleArn`, `NotificationType` and `Subscribers`. `SsmActionDefinition` needs `Subtype`, `Region` and
`InstanceIds` (1-100). Subscribers are limited to 11 by the resource schema. Only `PERCENTAGE` and `ABSOLUTE_VALUE` thresholds exist.

## Decisions

- **Budget reference by construct, not by name.** `budget: CostBudget` gives `budgetName` and lets the action call
  `addDependency(budget.budget)`; without the dependency CloudFormation can create the action before the budget exists.
- **Threshold validation.** PERCENTAGE: 0.01-1000. ABSOLUTE_VALUE: greater than 0.
- **Defaults.** `approvalModel AUTOMATIC` (a manual approval would not protect an unattended lab), `notificationType ACTUAL`
  (forecasts can fire early in the month), `region` = stack region.
- **Region must be resolved** when defaulted: an unresolved stack region throws, because the SSM definition needs a literal region.
- **Documented limits** (class TSDoc): instances created later are not covered; no cross-account targets; Budgets data lags 8-12 h;
  a reverted action is not re-evaluated in the same period unless reset manually.

## Risks / Trade-offs

- [Free Plan accounts] → It is unconfirmed whether Budget Actions are available on the Free Plan; README states it.
