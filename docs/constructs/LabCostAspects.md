# LabCostAspects

## Purpose

Cost traps in a lab account rarely show up in one construct. Log groups keep their logs forever, abandoned multipart uploads and old object versions stay in buckets, and resources with a fixed hourly price (a NAT gateway, a public IPv4 address, a load balancer, an EKS cluster) keep billing while nobody uses them. `LabCostAspects` applies three CDK Aspects to a whole scope, so these rules cover every construct in the app without changing any of them. `LogRetentionAspect` sets a finite log retention, `S3LifecycleAspect` adds cleanup rules to buckets, and `FixedCostWarningAspect` warns about each fixed-cost resource. The aspects only change resources that are missing a setting, and they warn instead of changing a setting the consumer has already chosen.

## Resources created

| CloudFormation type | Count | Notes |
| --- | --- | --- |
| none | 0 | The aspects create no resources. They change existing resources at synthesis: `AWS::Logs::LogGroup` (`RetentionInDays`) and `AWS::S3::Bucket` (`LifecycleConfiguration` rules). |

## Props and defaults

`LabCostAspects.applyTo(scope, options?)` takes the scope whose subtree receives the aspects, and the options below. The options object is optional; the table gives the value used when an option is not set.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `logRetention` | `logs.RetentionDays` | `logs.RetentionDays.THREE_DAYS` | The retention applied to log groups that have none, and the longest retention accepted without a warning. |
| `abortIncompleteUploadDays` | `number` | `1` | The number of days after which an incomplete multipart upload is aborted. Must be between 1 and 3650. |
| `noncurrentVersionDays` | `number` | `7` | The number of days after which a noncurrent object version is expired on versioned buckets. Must be between 1 and 3650. |
| `fixedCostWarnings` | `boolean` | `true` | Whether `FixedCostWarningAspect` adds a warning to each resource type listed in `FIXED_COST_RESOURCE_TYPES`. |

The aspects are also exported on their own: `LogRetentionAspect(retention?)`, `S3LifecycleAspect({ abortIncompleteUploadDays?, noncurrentVersionDays? })` and `FixedCostWarningAspect()`. Each one takes the same defaults as above. `LabCostAspects.applyTo` validates the two day counts with the range check in `src/core/validation.ts`; a value outside 1 to 3650 fails with `abortIncompleteUploadDays must be between 1 and 3650, got <n>` or `noncurrentVersionDays must be between 1 and 3650, got <n>`.

## Cost impact

**None** for the aspects themselves: they create no resources and no charge. The fixed-cost warnings name resources that are charged whether or not they carry traffic. The table lists each type that has a price row in [`../aws-facts.md`](../aws-facts.md). The charge depends on the type, and the table gives the figure from the linked row.

| CloudFormation type | Charge | USD figure | Fact in [`../aws-facts.md`](../aws-facts.md) |
| --- | --- | --- | --- |
| `AWS::EC2::NatGateway` | Per hour, plus per GB processed | 0.045 USD per hour plus 0.045 USD per GB processed (Ohio example) | NAT Gateway costs 0.045 USD per hour plus 0.045 USD per GB processed (Ohio example) |
| `AWS::EC2::EIP` | Per public IPv4 address, in use or idle | 0.005 USD per hour | Public IPv4 addresses cost 0.005 USD per hour, in use or idle |
| `AWS::ElasticLoadBalancingV2::LoadBalancer` (Application Load Balancer) | Per hour, plus per LCU | 0.0225 USD per hour plus 0.008 USD per LCU | Application Load Balancer costs 0.0225 USD per hour plus 0.008 USD per LCU |
| `AWS::EKS::Cluster` | Per cluster per hour | 0.10 USD per hour | EKS costs 0.10 USD per cluster per hour |
| `AWS::KMS::Key` | Per key per month | 1 USD per month | A KMS customer managed key costs 1 USD per month |

The other types in `FIXED_COST_RESOURCE_TYPES` (`AWS::EC2::VPNConnection` and the rest of the list) get the same warning, but no price row is recorded for them yet, so this page gives no USD figure for them. The NAT gateway figure is the Ohio example from the source; NAT gateway prices differ by region.

## Verified AWS facts

- NAT gateways cost 0.045 USD per hour plus 0.045 USD per GB processed (Ohio example). See [`../aws-facts.md`](../aws-facts.md).
- Public IPv4 addresses cost 0.005 USD per hour, in use or idle, so an Elastic IP is charged even when it is not attached. See [`../aws-facts.md`](../aws-facts.md).
- An Application Load Balancer costs 0.0225 USD per hour plus 0.008 USD per LCU. See [`../aws-facts.md`](../aws-facts.md).
- An EKS cluster costs 0.10 USD per cluster per hour. See [`../aws-facts.md`](../aws-facts.md).
- A KMS customer managed key costs 1 USD per month. See [`../aws-facts.md`](../aws-facts.md).

## Limits and risks

- **Warnings only for fixed cost.** `FixedCostWarningAspect` adds the warning `cdk-constructless:fixed-cost` and does not remove or change the resource. Remove the resource from the lab stack yourself when it is idle.
- **Retention is set only when missing.** `LogRetentionAspect` sets `RetentionInDays` only on log groups that have none, which includes log groups created with `logs.RetentionDays.INFINITE`. A log group that already has a retention keeps it. When that retention is longer than `logRetention`, the warning `cdk-constructless:log-retention` is added with the text `Log group keeps logs for <n> days; lab default is <d>`.
- **Unresolved S3 lifecycle.** When a bucket's lifecycle configuration or rules are a token, `S3LifecycleAspect` adds no rule and adds the warning `cdk-constructless:s3-lifecycle-unresolvable`. Add the cleanup rules yourself for that bucket.
- **Existing rules are kept.** A rule is added only when no rule of the same kind (`abortIncompleteMultipartUpload` or `noncurrentVersionExpiration`) exists, so a consumer rule of the same kind is not replaced.
- **Noncurrent versions are deleted permanently.** On a versioned bucket, `LabNoncurrentVersionExpiration` permanently deletes noncurrent object versions older than `noncurrentVersionDays` (7 by default). Do not apply the aspects to a bucket that keeps old versions for recovery, or pass a larger `noncurrentVersionDays`.
- **Applies to existing buckets on the next deploy.** The rules are added to buckets that already exist, so the next deploy changes their lifecycle configuration.
- **Scope.** The aspects visit only the constructs under `scope`. Apply them to the `App` to cover every stack.
- **No cdk-nag suppressions.** The aspects add no `suppressNag` entries. The test fixtures pass `{ nag: false }` to `synth` because they deliberately contain a NAT gateway and buckets without logs.
- **Construct ids.** The rule ids `LabAbortIncompleteMultipartUpload` and `LabNoncurrentVersionExpiration` are fixed. Renaming them in a later release changes the lifecycle configuration of every bucket the aspects touched.

## Example

The example applies the aspects to the whole stack. The log group keeps the default three days of retention, and the versioned bucket gets an abort rule of 1 day and a noncurrent version rule of 7 days.

```typescript
import { App, Stack } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { LabCostAspects } from 'cdk-constructless';

const app = new App();
const stack = new Stack(app, 'Example', {
  env: { account: '123456789012', region: 'eu-west-1' },
});

LabCostAspects.applyTo(stack, {
  logRetention: logs.RetentionDays.THREE_DAYS,
  abortIncompleteUploadDays: 1,
  noncurrentVersionDays: 7,
  fixedCostWarnings: true,
});

new logs.LogGroup(stack, 'AppLogs');
new s3.Bucket(stack, 'Artifacts', { versioned: true });
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md).
