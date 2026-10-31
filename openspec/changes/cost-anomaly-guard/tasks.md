# Tasks

## 1. CostAnomalyGuard

- [x] 1.1 Create `src/finops/cost-anomaly-guard.ts` exporting `enum AnomalyFrequency { DAILY = 'DAILY', WEEKLY = 'WEEKLY', IMMEDIATE = 'IMMEDIATE' }`,
  `type AnomalyMonitorSource = { readonly kind: 'services' } | { readonly kind: 'linkedAccounts'; readonly accountIds: string[] } | { readonly kind: 'existing'; readonly monitorArn: string }`,
  `interface CostAnomalyGuardProps { readonly monitor?: AnomalyMonitorSource /* @default { kind: 'services' } */; readonly monitorName?: string; readonly subscriptionName?: string; readonly emails?: string[]; readonly topic?: sns.ITopic;
  readonly frequency?: AnomalyFrequency /* @default DAILY for e-mail, IMMEDIATE for a topic */; readonly thresholdUsd?: number /* @default 1 */ }`
  and `class CostAnomalyGuard extends Construct` with `public readonly monitorArn: string`, `public readonly monitor?: ce.CfnAnomalyMonitor` (id `'Monitor'`) and `public readonly subscription: ce.CfnAnomalySubscription` (id `'Subscription'`).
  Validation (messages exact): exactly one of non-empty `emails` or `topic`, else throw `provide emails or a topic, not both`; `assertItemCount(this, 'emails', emails, 1, 10)` and `assertEmails(this, 'emails', emails)`;
  e-mails with `IMMEDIATE` → `email subscribers require DAILY or WEEKLY frequency`; topic with a frequency other than `IMMEDIATE` → `SNS subscribers require IMMEDIATE frequency`;
  `assertPositive(this, 'thresholdUsd', thresholdUsd)`; linkedAccounts → `assertItemCount(this, 'monitor.accountIds', ids, 1, 10)` and each resolved ID matches `/^\d{12}$/`, else message: monitor.accountIds must be 12-digit account IDs, got "<id>".
  Monitor: services → `monitorType 'DIMENSIONAL'`, `monitorDimension 'SERVICE'`; linkedAccounts → `monitorType 'CUSTOM'`, `monitorSpecification: JSON.stringify({ Dimensions: { Key: 'LINKED_ACCOUNT', Values: ids } })`;
  names default to `Names.uniqueResourceName(this, { maxLength: 100 })`. Subscription: `monitorArnList: [monitorArn]`, `frequency`, `subscribers` (`{ type: 'EMAIL', address }` or `{ type: 'SNS', address: topic.topicArn }`),
  `thresholdExpression: JSON.stringify({ Dimensions: { Key: 'ANOMALY_TOTAL_IMPACT_ABSOLUTE', MatchOptions: ['GREATER_THAN_OR_EQUAL'], Values: [String(thresholdUsd)] } })`, never `threshold`.
  TSDoc: the SNS topic must allow `costalerts.amazonaws.com` (use `AlertsTopic` with `allowCostAnomalyDetection: true`); AWS may already have created a services monitor, reuse it with `kind: 'existing'`. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [x] 1.2 Create `test/finops/cost-anomaly-guard.test.ts` covering each scenario in this change's `specs/finops-alerts/spec.md` with exact property values (compare `ThresholdExpression` and `MonitorSpecification` with `JSON.parse`),
  the existing-monitor case using `'arn:aws:ce::123456789012:anomalymonitor/abc'`, the topic case using `new AlertsTopic(stack, 'Alerts', { allowCostAnomalyDetection: true }).topic`, and every validation message. Snapshot of the default case and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/cost-anomaly-guard.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/CostAnomalyGuard.md` from `docs/constructs/_template.md`, filling every mandatory section. Cost impact: the pages read state no price; record it as unverified.
  Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell):
  `| Anomaly subscriptions notify by e-mail for DAILY and WEEKLY and by SNS for IMMEDIATE; Threshold is deprecated in favour of ThresholdExpression and both cannot be set | https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ce-anomalysubscription.html | 2026-10-31 | CostAnomalyGuard |`;
  `| Up to 10 e-mail recipients or 1 SNS topic per anomaly subscription; up to 10 values (linked accounts or tags) per customer managed monitor | https://docs.aws.amazon.com/cost-management/latest/userguide/management-limits.html | 2026-10-31 | CostAnomalyGuard |`;
  `| Unverified: the product and FAQ pages state no price for Cost Anomaly Detection beyond the default configuration having no cost | https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/faqs/ | 2026-10-31 | CostAnomalyGuard |`.
  In `README.md` `## Constructs` add `- [CostAnomalyGuard](docs/constructs/CostAnomalyGuard.md): Cost Anomaly Detection monitor and subscription with a USD impact threshold.`
  Add "`CostAnomalyGuard` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
