## ADDED Requirements

### Requirement: Stop instances on budget threshold

The library SHALL provide a Budget Action that stops listed EC2 or RDS instances through SSM when a budget threshold is crossed.

#### Scenario: EC2 stop action

- **WHEN** a `BudgetStopInstancesAction` targets EC2 instance `i-0123456789abcdef0` on a `CostBudget` with threshold 80 percent
- **THEN** the template contains one `AWS::Budgets::BudgetsAction` with `ActionType` `RUN_SSM_DOCUMENTS`, `Definition.SsmActionDefinition` `{ Subtype: 'STOP_EC2_INSTANCES', Region: 'us-east-1', InstanceIds: ['i-0123456789abcdef0'] }`, `ActionThreshold` `{ Type: 'PERCENTAGE', Value: 80 }`, `ApprovalModel` `AUTOMATIC` and `NotificationType` `ACTUAL`

#### Scenario: Action depends on the budget

- **WHEN** the action is synthesized
- **THEN** the action resource `DependsOn` the budget resource and its `BudgetName` equals the budget's name

#### Scenario: Execution role created by default

- **WHEN** no `executionRole` is passed
- **THEN** a role trusted by `budgets.amazonaws.com` is created with the stop permissions for the target, and its ARN is the action's `ExecutionRoleArn`

#### Scenario: Instance count limits

- **WHEN** zero or more than 100 instance IDs are given
- **THEN** construction fails with `instanceIds must contain between 1 and 100 items, got <n>`

#### Scenario: Subscriber limits

- **WHEN** zero or more than 11 subscribers are given
- **THEN** construction fails with `subscribers must contain between 1 and 11 items, got <n>`

#### Scenario: Unresolved region

- **WHEN** the stack is environment-agnostic and no `region` is given
- **THEN** construction fails with `region must be set when the stack region is unresolved`
