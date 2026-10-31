# finops-guardrail Specification

## Purpose
TBD - created by archiving change finops-guardrail. Update Purpose after archive.

## Requirements

### Requirement: Composed cost guardrail

The library SHALL create, from one props object, an alerts topic, a monthly cost budget notifying that topic, and optionally a billing alarm, a stop-instances action and a deny-compute action.

#### Scenario: Minimal guardrail

- **WHEN** a `FinOpsGuardrail` is created with `limitUsd: 5` and `emails: ['alerts@example.com']`
- **THEN** exactly one `AWS::SNS::Topic`, one `AWS::Budgets::Budget` whose notifications use the topic as `SNS` subscriber, no `AWS::CloudWatch::Alarm` and no `AWS::Budgets::BudgetsAction` exist

#### Scenario: Billing alarm

- **WHEN** `billingAlarmThresholdUsd: 4` is given in us-east-1
- **THEN** a `BillingAlarm` with threshold 4 notifies the same alerts topic

#### Scenario: Actions never use the alerts topic

- **WHEN** `stopInstances` and `denyCompute` are given
- **THEN** both `AWS::Budgets::BudgetsAction` resources have only `EMAIL` subscribers from `emails`, never the alerts topic ARN
