# Tasks

## 1. AlertsTopic

- [ ] 1.1 Add to `src/core/validation.ts` `assertEmails(scope, name: string, emails: readonly string[])`: for each value that is not an unresolved token and does not match
  `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, throw `ConstructValidationError` with message: <name> contains an invalid email "<value>" (value in double quotes).
  Add a passing and a failing case to `test/core/validation.test.ts`.
  Create `src/finops/alerts-topic.ts` exporting `interface AlertsTopicProps { readonly topicName?: string; readonly emails?: string[]; readonly allowBudgets?: boolean /* @default true */; readonly allowCostAnomalyDetection?: boolean /* @default false */; readonly masterKey?: kms.IKey }`
  and `class AlertsTopic extends Construct` with `public readonly topic: sns.Topic` (id `'Topic'`, `enforceSSL: true`, `masterKey`, `topicName`).
  Validation: `assertItemCount(this, 'emails', emails, 0, 10)` then `assertEmails(this, 'emails', emails)`. Each e-mail: `topic.addSubscription(new subs.EmailSubscription(email))`.
  When `allowBudgets`: `topic.addToResourcePolicy(new iam.PolicyStatement({ sid: 'AWSBudgetsSNSPublishingPermissions', principals: [new iam.ServicePrincipal('budgets.amazonaws.com')], actions: ['SNS:Publish'], resources: [topic.topicArn],
  conditions: { StringEquals: { 'aws:SourceAccount': stack.account }, ArnLike: { 'aws:SourceArn': 'arn:' + stack.partition + ':budgets::' + stack.account + ':*' } } }))`.
  When `allowCostAnomalyDetection`: same with sid `'AWSAnomalyDetectionSNSPublishingPermissions'`, principal `costalerts.amazonaws.com`, no conditions.
  When `masterKey`: `masterKey.grant(new iam.ServicePrincipal('budgets.amazonaws.com'), 'kms:GenerateDataKey*', 'kms:Decrypt')` when `allowBudgets`, and the same for `costalerts.amazonaws.com` when `allowCostAnomalyDetection`.
  Without `masterKey`: `suppressNag(this.topic, [{ id: 'AwsSolutions-SNS2', reason: 'A KMS key costs 1 USD per month; this topic carries no sensitive data; pass masterKey to encrypt' }])`.
  Class TSDoc: notification-only; never subscribe automation (Lambda, SSM) to it; Budgets topics must be in the same account. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run test test/core` `bun run lint`
- [ ] 1.2 Create `test/finops/alerts-topic.test.ts` covering each scenario in `specs/finops-alerts/spec.md` with exact `AWS::SNS::TopicPolicy` statements
  (match the Budgets statement's `Principal`, `Action`, `Condition.StringEquals['aws:SourceAccount']` and the `Fn::Join` of the `aws:SourceArn` with `Match.anyValue()` only for the partition token),
  the TLS deny statement (`Condition: { Bool: { 'aws:SecureTransport': 'false' } }`), subscription `Protocol: 'email'`, both error messages, and with a `new kms.Key(stack, 'Key')`
  a key policy statement allowing `kms:GenerateDataKey*` and `kms:Decrypt` to `budgets.amazonaws.com` and `KmsMasterKeyId` set on the topic. Snapshot of the default case and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/alerts-topic.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/AlertsTopic.md` from `docs/constructs/_template.md`, filling every mandatory section. Limits and risks: notification-only rule, same-account requirement,
  the `AwsSolutions-SNS2` suppression and reason, the 10 e-mail cap is a library choice (not an AWS limit), each e-mail must confirm its subscription.
  Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell):
  `| Budgets SNS topic policy: budgets.amazonaws.com SNS:Publish with aws:SourceAccount and aws:SourceArn arn:aws:budgets::<account>:*; topics must be in the same account | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-sns-policy.html | 2026-10-31 | AlertsTopic |`;
  `| Cost Anomaly Detection publishes to SNS as costalerts.amazonaws.com | https://docs.aws.amazon.com/cost-management/latest/userguide/ad-SNS.html | 2026-10-31 | AlertsTopic |`;
  `| A KMS customer managed key costs 1 USD per month | https://aws.amazon.com/kms/pricing/ | 2026-10-30 | AlertsTopic |`.
  In `README.md` `## Constructs` add `- [AlertsTopic](docs/constructs/AlertsTopic.md): notification-only SNS topic for Budgets, CloudWatch and Cost Anomaly Detection alerts.`
  Add "`AlertsTopic` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
