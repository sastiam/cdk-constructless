## ADDED Requirements

### Requirement: Monthly cost budget

The library SHALL provide a monthly cost budget in USD whose limit is required and greater than zero.

#### Scenario: Budget with a limit

- **WHEN** a `CostBudget` is created with `limitUsd: 5`
- **THEN** the template contains one `AWS::Budgets::Budget` with `BudgetType` `COST`, `TimeUnit` `MONTHLY` and `BudgetLimit` `{ Amount: 5, Unit: 'USD' }`

#### Scenario: Invalid limit

- **WHEN** `limitUsd` is `0` or negative
- **THEN** construction fails with `limitUsd must be greater than 0`

### Requirement: Threshold notifications

The budget SHALL notify subscribers when thresholds are crossed, with at most 5 notifications and at most 10 e-mail addresses.

#### Scenario: Default thresholds

- **WHEN** `emails: ['alerts@example.com']` is given and no `thresholds`
- **THEN** four notifications exist: ACTUAL 60, ACTUAL 80, ACTUAL 100 and FORECASTED 100, all `PERCENTAGE` with `GREATER_THAN`, each with the e-mail subscriber

#### Scenario: No subscribers

- **WHEN** neither `emails` nor `topic` is given
- **THEN** no notification is created and a warning `cdk-constructless:budget-without-subscribers` is emitted

#### Scenario: Too many thresholds

- **WHEN** six thresholds are given
- **THEN** construction fails with `thresholds must contain between 1 and 5 items, got 6`

#### Scenario: SNS subscriber

- **WHEN** a `topic` is given
- **THEN** each notification has an `SNS` subscriber with the topic ARN

### Requirement: Budget refresh disclaimer

The construct documentation SHALL state that AWS Budgets data refreshes up to three times a day, so a budget is not a hard spending cap.

#### Scenario: TSDoc

- **WHEN** a consumer reads the `CostBudget` TSDoc
- **THEN** it states the 8 to 12 hour refresh delay and that Budget Actions are required to act on spend
