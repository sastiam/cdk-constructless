# Tasks

## 1. Aspects

- [ ] 1.1 Create `src/finops/lab-cost-aspects.ts` exporting:
  `const FIXED_COST_RESOURCE_TYPES: readonly string[]` = `AWS::EC2::NatGateway`, `AWS::EC2::EIP`, `AWS::ElasticLoadBalancingV2::LoadBalancer`, `AWS::ElasticLoadBalancing::LoadBalancer`, `AWS::EKS::Cluster`,
  `AWS::KMS::Key`, `AWS::SecretsManager::Secret`, `AWS::RDS::DBInstance`, `AWS::RDS::DBCluster`, `AWS::ElastiCache::CacheCluster`, `AWS::ElastiCache::ReplicationGroup`, `AWS::OpenSearchService::Domain`,
  `AWS::MSK::Cluster`, `AWS::Kinesis::Stream`, `AWS::GlobalAccelerator::Accelerator`, `AWS::EC2::TransitGateway`, `AWS::EC2::VPNConnection`, `AWS::NetworkFirewall::Firewall`, `AWS::Redshift::Cluster`;
  `class LogRetentionAspect implements IAspect` (constructor `(retention: logs.RetentionDays = THREE_DAYS)`): on `logs.CfnLogGroup` with undefined `retentionInDays` set it; when resolved and greater, add
  `Annotations.of(node).addWarningV2('cdk-constructless:log-retention', 'Log group keeps logs for <n> days; lab default is <d>')`;
  `class S3LifecycleAspect implements IAspect` (options `{ abortIncompleteUploadDays?: number /* 1 */; noncurrentVersionDays?: number /* 7 */ }`): on `s3.CfnBucket` whose `lifecycleConfiguration` is undefined or a plain object
  (skip `IResolvable` with a warning `cdk-constructless:s3-lifecycle-unresolvable`), append rule `{ id: 'LabAbortIncompleteMultipartUpload', status: 'Enabled', abortIncompleteMultipartUpload: { daysAfterInitiation } }` unless a rule
  with `abortIncompleteMultipartUpload` exists, and when `versioningConfiguration?.status === 'Enabled'` append `{ id: 'LabNoncurrentVersionExpiration', status: 'Enabled', noncurrentVersionExpiration: { noncurrentDays } }` unless present;
  `class FixedCostWarningAspect implements IAspect`: on `CfnResource` whose `cfnResourceType` is in the list add `addWarningV2('cdk-constructless:fixed-cost', '<type> has a fixed hourly or monthly price; remove it from lab stacks when idle')`;
  `class LabCostAspects` with `static applyTo(scope: IConstruct, options?: { logRetention?: logs.RetentionDays; abortIncompleteUploadDays?: number; noncurrentVersionDays?: number; fixedCostWarnings?: boolean /* true */ })`
  adding each aspect with `Aspects.of(scope).add(aspect, { priority: AspectPriority.MUTATING })`. Validate day options with `assertRange(.., 1, 3650)` (use the scope for errors). Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/finops/lab-cost-aspects.test.ts` covering each scenario in `specs/lab-cost-controls/spec.md` (use `synth(..., { nag: false })` because the fixtures deliberately contain a NAT gateway
  and buckets without logs): exact `RetentionInDays`, warning texts via `Annotations.fromStack`, lifecycle rules with `Match.arrayWith`, an existing user rule kept, and a NAT gateway built with
  `new ec2.CfnNatGateway(stack, 'Nat', { subnetId: 'subnet-12345678', connectivityType: 'private' })`. Snapshot.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/lab-cost-aspects.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/LabCostAspects.md` from `docs/constructs/_template.md` (the coverage test only requires pages for exported construct classes; this page documents the aspects anyway),
  filling every mandatory section with the fixed-cost table (type and the price row it links). Append rows to `docs/aws-facts.md` (only add `LabCostAspects` to Used by when the fact exists):
  `| NAT Gateway costs 0.045 USD per hour plus 0.045 USD per GB processed (Ohio example) | https://aws.amazon.com/vpc/pricing/ | 2026-10-30 | LabCostAspects |`;
  `| Public IPv4 addresses cost 0.005 USD per hour, in use or idle | https://aws.amazon.com/vpc/pricing/ | 2026-10-30 | LabCostAspects |`;
  `| Application Load Balancer costs 0.0225 USD per hour plus 0.008 USD per LCU | https://aws.amazon.com/elasticloadbalancing/pricing/ | 2026-10-30 | LabCostAspects |`;
  `| EKS costs 0.10 USD per cluster per hour | https://aws.amazon.com/eks/pricing/ | 2026-10-30 | LabCostAspects |`.
  In `README.md` `## Constructs` add `- [LabCostAspects](docs/constructs/LabCostAspects.md): aspects for log retention, S3 cleanup rules and fixed-cost warnings.`
  Add "`LabCostAspects`, `LogRetentionAspect`, `S3LifecycleAspect`, `FixedCostWarningAspect`." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
