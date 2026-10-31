## ADDED Requirements

### Requirement: Cost anomaly alerts

The library SHALL create a cost anomaly monitor and subscription that alert on anomalies whose total absolute impact reaches a USD threshold.

#### Scenario: Services monitor with e-mail

- **WHEN** a `CostAnomalyGuard` is created with `emails: ['alerts@example.com']`
- **THEN** an `AWS::CE::AnomalyMonitor` with `MonitorType` `DIMENSIONAL` and `MonitorDimension` `SERVICE` exists, and an `AWS::CE::AnomalySubscription` with `Frequency` `DAILY`, one `EMAIL` subscriber, no `Threshold`, and `ThresholdExpression` equal to `{"Dimensions":{"Key":"ANOMALY_TOTAL_IMPACT_ABSOLUTE","MatchOptions":["GREATER_THAN_OR_EQUAL"],"Values":["1"]}}`

#### Scenario: Linked accounts monitor

- **WHEN** `monitor: { kind: 'linkedAccounts', accountIds: ['123456789012'] }` is given
- **THEN** the monitor has `MonitorType` `CUSTOM`, no `MonitorDimension`, and `MonitorSpecification` `{"Dimensions":{"Key":"LINKED_ACCOUNT","Values":["123456789012"]}}`; more than 10 IDs fail with `monitor.accountIds must contain between 1 and 10 items, got <n>`

#### Scenario: Existing monitor

- **WHEN** `monitor: { kind: 'existing', monitorArn }` is given
- **THEN** no `AWS::CE::AnomalyMonitor` is created and the subscription's `MonitorArnList` is `[monitorArn]`

#### Scenario: SNS topic

- **WHEN** a `topic` is given
- **THEN** `Frequency` is `IMMEDIATE` with one `SNS` subscriber; giving both `emails` and `topic`, or neither, fails with `provide emails or a topic, not both`

#### Scenario: Invalid frequency or threshold

- **WHEN** `frequency: IMMEDIATE` is given with e-mails, or `thresholdUsd` is 0
- **THEN** construction fails with `email subscribers require DAILY or WEEKLY frequency` or `thresholdUsd must be greater than 0, got 0`
