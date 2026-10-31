# budget-actions Specification

## Purpose
TBD - created by archiving change budget-action-execution-role. Update Purpose after archive.

## Requirements

### Requirement: Execution role trust

The library SHALL provide an execution role for Budget Actions that only AWS Budgets of the same account can assume.

#### Scenario: Trust policy conditions

- **WHEN** a `BudgetActionExecutionRole` is created in account 123456789012
- **THEN** the role trust policy allows `sts:AssumeRole` to `budgets.amazonaws.com` with `aws:SourceAccount` `123456789012` and `aws:SourceArn` like `arn:aws:budgets::123456789012:budget/*`

### Requirement: Least-privilege stop permissions

The role SHALL only receive the permissions needed to stop the instance type it targets, through SSM automation.

#### Scenario: EC2 stop permissions

- **WHEN** `allowStopInstances(StopInstancesTarget.EC2)` is called
- **THEN** the role policy allows `ec2:DescribeInstanceStatus` and `ec2:StopInstances` only when called via `ssm.amazonaws.com`, and `ssm:StartAutomationExecution` only on the `AWS-StopEC2Instance` document, its automation definition and automation executions

#### Scenario: No start permissions

- **WHEN** any stop permission is granted
- **THEN** no `ec2:StartInstances` or `rds:StartDBInstance` action appears in the role policy

#### Scenario: RDS stop permissions

- **WHEN** `allowStopInstances(StopInstancesTarget.RDS)` is called
- **THEN** the role policy allows `rds:DescribeDBInstances` and `rds:StopDBInstance` via SSM and `ssm:StartAutomationExecution` on `AWS-StopRdsInstance`

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
