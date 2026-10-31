# Proposal

## Why

Fixed thresholds miss unusual spend patterns, for example a service that suddenly costs ten times more while the total
stays under budget. Cost Anomaly Detection catches them; it is configured with `AWS::CE::AnomalyMonitor` and
`AWS::CE::AnomalySubscription`, whose frequency and subscriber rules are easy to mix up. Requirements from issue #65.

## What Changes

- New `CostAnomalyGuard` construct: creates a services monitor, a linked-accounts custom monitor, or reuses an existing monitor,
  and subscribes up to 10 e-mails (DAILY or WEEKLY) or one SNS topic (IMMEDIATE) with an absolute USD impact threshold via `ThresholdExpression`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `finops-alerts`: adds anomaly alerts (ADDED requirement).

## Impact

New `src/finops/cost-anomaly-guard.ts`, tests, docs page. The SNS option needs an `AlertsTopic` with `allowCostAnomalyDetection: true`.
