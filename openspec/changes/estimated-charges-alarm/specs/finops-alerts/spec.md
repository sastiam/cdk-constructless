## ADDED Requirements

### Requirement: Billing alarm on estimated charges

The library SHALL provide a CloudWatch alarm on estimated charges that notifies an SNS topic and only synthesizes in us-east-1.

#### Scenario: Defaults

- **WHEN** a `BillingAlarm` is created in `us-east-1` with `thresholdUsd: 5` and a topic
- **THEN** one `AWS::CloudWatch::Alarm` has `Namespace` `AWS/Billing`, `MetricName` `EstimatedCharges`, `Dimensions` `[{ Name: 'Currency', Value: 'USD' }]`, `Statistic` `Maximum`, `Period` 21600, `EvaluationPeriods` 1, `Threshold` 5, `ComparisonOperator` `GreaterThanThreshold`, `TreatMissingData` `notBreaching` and `AlarmActions` with the topic ARN

#### Scenario: Wrong region

- **WHEN** the stack region is `eu-west-1`
- **THEN** construction fails with `BillingAlarm requires region us-east-1, got eu-west-1`

#### Scenario: Unresolved region

- **WHEN** the stack is environment-agnostic
- **THEN** the alarm is created and a warning `cdk-constructless:unresolved-region` is emitted

#### Scenario: Linked account

- **WHEN** `linkedAccountId: '123456789012'` is given
- **THEN** the dimensions also contain `{ Name: 'LinkedAccount', Value: '123456789012' }`; an ID that is not 12 digits fails with `linkedAccountId must be a 12-digit account ID, got "<id>"`
