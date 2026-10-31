## ADDED Requirements

### Requirement: Default function alarms

A function SHALL be able to add standard Errors and Throttles alarms in one call, optionally notifying an SNS topic.

#### Scenario: Alarms without topic

- **WHEN** `addDefaultAlarms()` is called
- **THEN** two `AWS::CloudWatch::Alarm` resources exist on `AWS/Lambda` metrics `Errors` and `Throttles` for the function, `Statistic` `Sum`, `Period` 300, `EvaluationPeriods` 1, `Threshold` 1, `ComparisonOperator` `GreaterThanOrEqualToThreshold`, `TreatMissingData` `notBreaching`, and no `AlarmActions`

#### Scenario: Alarms with topic

- **WHEN** `addDefaultAlarms({ topic })` is called
- **THEN** both alarms have `AlarmActions` containing the topic ARN

#### Scenario: Called twice

- **WHEN** `addDefaultAlarms()` is called a second time
- **THEN** construction fails with `addDefaultAlarms can only be called once`
