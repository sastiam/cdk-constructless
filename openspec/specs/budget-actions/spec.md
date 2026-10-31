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
