## ADDED Requirements

### Requirement: Deny compute on budget threshold

The library SHALL provide a Budget Action that attaches an IAM deny policy to given principals when a budget threshold is crossed.

#### Scenario: Default deny action

- **WHEN** a `BudgetDenyAction` targets role `LabRole` on a `CostBudget` with threshold 80
- **THEN** an `AWS::IAM::ManagedPolicy` denies `ec2:RunInstances`, `ec2:StartInstances`, `lambda:CreateFunction`, `ecs:CreateService`, `ecs:RunTask`, `rds:CreateDBInstance` and `rds:StartDBInstance` on `*`, and an `AWS::Budgets::BudgetsAction` with `ActionType` `APPLY_IAM_POLICY` has `Definition.IamActionDefinition` with that policy ARN and `Roles` `['LabRole']`, `ApprovalModel` `AUTOMATIC`, `NotificationType` `ACTUAL` and `DependsOn` the budget

#### Scenario: Execution role scoped to the policy

- **WHEN** the action is synthesized
- **THEN** the execution role may call `iam:AttachRolePolicy`, `iam:DetachRolePolicy`, `iam:AttachUserPolicy`, `iam:DetachUserPolicy`, `iam:AttachGroupPolicy` and `iam:DetachGroupPolicy` only with condition `ArnEquals iam:PolicyARN` equal to the deny policy ARN

#### Scenario: No targets

- **WHEN** no roles, users or groups are given
- **THEN** construction fails with `BudgetDenyAction needs at least one role, user or group`

#### Scenario: Extra denied actions

- **WHEN** `deniedActions: ['sagemaker:CreateEndpoint']` is given
- **THEN** the policy denies exactly that list; an entry that is not `service:Action` fails with `deniedActions entries must look like service:Action, got "<value>"`
