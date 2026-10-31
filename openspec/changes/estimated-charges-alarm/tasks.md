# Tasks

## 1. BillingAlarm

- [ ] 1.1 Create `src/finops/billing-alarm.ts` exporting `interface BillingAlarmProps { readonly thresholdUsd: number; readonly topic: sns.ITopic; readonly alarmName?: string; readonly linkedAccountId?: string }`
  and `class BillingAlarm extends Construct` with `public readonly alarm: cloudwatch.Alarm` (id `'Alarm'`).
  Order: `assertRegion(this, 'us-east-1', 'BillingAlarm')`; `assertPositive(this, 'thresholdUsd', thresholdUsd)`; when `linkedAccountId` is resolved and does not match `/^\d{12}$/` throw
  `ConstructValidationError` with message: linkedAccountId must be a 12-digit account ID, got "<id>".
  Metric: `new cloudwatch.Metric({ namespace: 'AWS/Billing', metricName: 'EstimatedCharges', dimensionsMap: { Currency: 'USD', ...(linkedAccountId ? { LinkedAccount: linkedAccountId } : {}) }, statistic: 'Maximum', period: Duration.hours(6) })`.
  Alarm: `threshold: thresholdUsd`, `evaluationPeriods: 1`, `comparisonOperator: GREATER_THAN_THRESHOLD`, `treatMissingData: NOT_BREACHING`, `alarmName`, then `alarm.addAlarmAction(new cw_actions.SnsAction(topic))`.
  TSDoc: billing alerts must be enabled first in Billing preferences and cannot be disabled; data takes about 15 minutes to appear; USD only; `LinkedAccount` exists only when the payer publishes per-account metrics
  (check with `aws cloudwatch list-metrics --namespace AWS/Billing --region us-east-1`). Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/finops/billing-alarm.test.ts` covering each scenario in this change's `specs/finops-alerts/spec.md` with the exact alarm properties, using an `AlertsTopic` for the topic;
  `synth(..., { region: 'eu-west-1' })` throws the exact message; `envAgnostic` emits the warning; `thresholdUsd: 0` throws `thresholdUsd must be greater than 0, got 0`; linked account dimension and the invalid-ID message.
  Snapshot and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/billing-alarm.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/BillingAlarm.md` from `docs/constructs/_template.md`, filling every mandatory section (prerequisite: enable billing alerts; us-east-1 only; backup to Budgets, not a replacement).
  Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell):
  `| Billing metric data is stored in us-east-1, represents worldwide charges, is USD only; recommended statistic Maximum with a 6-hour period | https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html | 2026-10-31 | BillingAlarm |`;
  `| CloudWatch free tier includes 10 standard-resolution alarm metrics per month | https://aws.amazon.com/cloudwatch/pricing/ | 2026-10-31 | BillingAlarm |`.
  In `README.md` `## Constructs` add `- [BillingAlarm](docs/constructs/BillingAlarm.md): EstimatedCharges alarm in us-east-1 that notifies an SNS topic.`
  Add "`BillingAlarm` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
