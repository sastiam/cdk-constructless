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
