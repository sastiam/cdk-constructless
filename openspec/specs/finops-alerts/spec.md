# finops-alerts Specification

## Purpose
TBD - created by archiving change budget-alerts-topic. Update Purpose after archive.

## Requirements

### Requirement: Notification-only alerts topic

The library SHALL provide an SNS topic for human cost notifications that AWS Budgets can publish to, and that exposes no way to attach automation through its props.

#### Scenario: Budgets publish statement

- **WHEN** an `AlertsTopic` is created in account 123456789012
- **THEN** its topic policy allows `SNS:Publish` to `budgets.amazonaws.com` on the topic with `StringEquals aws:SourceAccount 123456789012` and `ArnLike aws:SourceArn arn:aws:budgets::123456789012:*`, and denies non-TLS access

#### Scenario: Budgets disabled

- **WHEN** `allowBudgets: false` is given
- **THEN** no statement for `budgets.amazonaws.com` exists

#### Scenario: Cost Anomaly Detection

- **WHEN** `allowCostAnomalyDetection: true` is given
- **THEN** the topic policy allows `SNS:Publish` to `costalerts.amazonaws.com` on the topic

#### Scenario: E-mail subscriptions

- **WHEN** `emails: ['alerts@example.com']` is given
- **THEN** one `AWS::SNS::Subscription` with protocol `email` and that endpoint exists

#### Scenario: Invalid e-mail

- **WHEN** an e-mail without `@` is given
- **THEN** construction fails with `emails contains an invalid email "<value>"`

#### Scenario: Too many e-mails

- **WHEN** 11 e-mails are given
- **THEN** construction fails with `emails must contain between 0 and 10 items, got 11`

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
