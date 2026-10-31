# Proposal

## Why

CloudWatch alarm actions and Budgets notifications need an SNS topic. The FinOps research shows the "one topic for
everything" failure: a first-cent alert on a topic that also triggers automation stops every instance. Budgets also
needs a documented topic policy, which `SnsAction` does not add. Requirements come from the downstream foundation (issue #27).

## What Changes

- New `AlertsTopic` construct: a notification-only SNS topic with `enforceSSL`, e-mail subscriptions, the documented
  Budgets publish statement (on by default) and an optional Cost Anomaly Detection publish statement.
- Optional `masterKey` grants Budgets (and Cost Anomaly Detection when allowed) the KMS permissions to publish.
- New core helper `assertEmails`.

## Capabilities

### New Capabilities

- `finops-alerts`: notification channels and alarms for cost signals (topics, billing alarm, anomaly alerts).

### Modified Capabilities

None.

## Impact

New `src/finops/alerts-topic.ts`, `src/core/validation.ts` helper, tests, docs page.
