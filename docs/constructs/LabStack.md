# LabStack

## Purpose

A throwaway lab should leave nothing billing after `cdk destroy`. The usual leftovers are S3 buckets that refuse to delete while they hold objects, RDS snapshots that a `SNAPSHOT` removal policy leaves behind, and resources with no tags, so nobody can tell whose they are or when they can go. `LabStack` is a `Stack` subclass that makes every resource in the stack deletable with the stack: it takes the required `project` and `owner` props and writes them as tags, writes an optional `ExpiresAt` tag for a janitor to read, sets `RemovalPolicy.DESTROY` and turns off RDS deletion protection, rejects buckets that cannot be emptied on delete, and applies `LabCostAspects` to the whole stack. It only changes resources in its own stack. Snapshots taken outside the stack and CloudWatch log groups created by services outside the stack survive `cdk destroy`; see Cost impact.

## Resources created

| CloudFormation type | Count | Notes |
| --- | --- | --- |
| none | 0 | The stack creates no resource of its own. At synthesis it changes the resources you add: every `CfnResource` gets `DeletionPolicy: Delete` unless `retainedConstructPaths` matches its path, every `AWS::RDS::DBInstance` and `AWS::RDS::DBCluster` gets `DeletionProtection: false`, every taggable resource gets the `Project`, `Env` and `Owner` tags (and `ExpiresAt` when `expiresAt` is set), and `LabCostAspects` changes `AWS::Logs::LogGroup` and `AWS::S3::Bucket` as its page describes. |

## Props and defaults

`LabStackProps` extends `StackProps`. The `env` and the other `StackProps` members are passed to `Stack` unchanged. The table gives the members that `LabStack` adds.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `project` | `string` | none (required) | The project name, written to the `Project` tag of every taggable resource. |
| `owner` | `string` | none (required) | The owner of the lab, written to the `Owner` tag of every taggable resource. Use an e-mail address or a team name. |
| `expiresAt` | `string` | none (no `ExpiresAt` tag is written) | The date after which the lab may be destroyed, written to the `ExpiresAt` tag of every taggable resource. Must match `YYYY-MM-DD`; any other value fails with `expiresAt must be a YYYY-MM-DD date, got "<value>"`. |
| `retainedConstructPaths` | `string[]` | `[]` (every resource is destroyed with the stack) | The construct paths whose resources keep their removal policy. A resource is retained when its construct path starts with one of these paths. |
| `costAspects` | options of `LabCostAspects.applyTo` (the second argument) | `{}` (the defaults of `LabCostAspects.applyTo`) | The lab cost controls applied to the whole stack. See [LabCostAspects](LabCostAspects.md). |

## Cost impact

**None** from the construct's own resources: it creates no resource and no fixed-cost resource. Fixed-cost resources that you add to the stack are only warned about, by `LabCostAspects`. The USD figures for those resources are in the rows linked below.

What `cdk destroy` removes, for every resource of the stack that is not in `retainedConstructPaths`:

- **Bucket objects.** A bucket with `autoDeleteObjects: true` is emptied before it is deleted.
- **Log groups created by the stack**, with their events.
- **RDS instances and clusters.** `DeletionPolicy: Delete` removes them without a final snapshot, because deletion protection is off.
- **Compute, networking and every other resource in the stack**, including fixed-cost resources such as a NAT gateway, an Elastic IP or a load balancer, so their hourly charges stop when the stack is deleted.

What still bills after `cdk destroy`:

- **RDS snapshots taken outside the stack**, such as manual snapshots or copies. `LabStack` never creates a snapshot and `DeletionPolicy: Delete` does not remove snapshots that already exist. Delete them by hand after destroy. No USD figure for snapshot storage is recorded in [`../aws-facts.md`](../aws-facts.md), so this page gives none.
- **CloudWatch log groups created by services outside the stack.** For example, Lambda creates `/aws/lambda/<function-name>` on first invocation when no log group is defined in the stack. That group is not in the stack, so `cdk destroy` leaves it, and it keeps its logs unless a retention is set on it. `LogRetentionAspect` only reaches `AWS::Logs::LogGroup` resources in the stack, so it does not change these groups. No USD figure for log storage is recorded in [`../aws-facts.md`](../aws-facts.md), so this page gives none.
- **Retained resources.** Anything matched by `retainedConstructPaths` keeps its removal policy and stays in the account.

## Verified AWS facts

- A NAT gateway costs 0.045 USD per hour plus 0.045 USD per GB processed (Ohio example). The aspects warn about it; `cdk destroy` removes it with the stack. See [`../aws-facts.md`](../aws-facts.md).
- A public IPv4 address costs 0.005 USD per hour, in use or idle, so an Elastic IP is charged even when it is not attached. See [`../aws-facts.md`](../aws-facts.md).
- An Application Load Balancer costs 0.0225 USD per hour plus 0.008 USD per LCU. See [`../aws-facts.md`](../aws-facts.md).
- An EKS cluster costs 0.10 USD per cluster per hour. See [`../aws-facts.md`](../aws-facts.md).
- A KMS customer managed key costs 1 USD per month. See [`../aws-facts.md`](../aws-facts.md).

## Limits and risks

- **Data is deleted with the stack.** Bucket objects, log events and database contents of every resource that is not retained are deleted, and RDS instances are deleted without a final snapshot. Use `LabStack` only for labs whose data can go. Keep anything you need in a stack without `LabStack`, or list its path in `retainedConstructPaths`.
- **Removal policy is overwritten.** `LabRemovalAspect` sets `DESTROY` on every resource that is not retained, including one you set to `SNAPSHOT` or `RETAIN`.
- **Retained paths match by prefix.** A path also retains longer paths that start with it, so `Lab/Db` also retains `Lab/Db2/...`.
- **Deletion protection is turned off even for retained databases.** `LabRemovalAspect` sets `DeletionProtection: false` on every `AWS::RDS::DBInstance` and `AWS::RDS::DBCluster`, including those in `retainedConstructPaths`. Only the removal policy is left unchanged for a retained path.
- **Retained resources keep billing.** A retained resource stays in the account after `cdk destroy` and keeps its charges until you delete it by hand.
- **Buckets must be emptiable.** Synthesis fails with `cdk-constructless:lab-bucket-auto-delete` for each `s3.Bucket` without an `AutoDeleteObjectsCustomResource` child, including buckets created inside other constructs. The check relies on that CDK child id. Set `autoDeleteObjects: true` and `removalPolicy: RemovalPolicy.DESTROY` in the bucket props. The aspect cannot add `autoDeleteObjects` after construction, and CDK rejects `autoDeleteObjects` without `DESTROY` when the bucket is constructed.
- **Expiry is a tag only.** `ExpiresAt` destroys nothing. A janitor must read the tag and run `cdk destroy`. The check only validates the `YYYY-MM-DD` shape, so `2026-13-45` is accepted.
- **Leftovers outside the stack.** `cdk destroy` does not remove snapshots or log groups created outside the stack (see Cost impact). Check the account after destroy.
- **Fixed-cost warnings remove nothing.** The fixed-cost warnings from `LabCostAspects` only name the resource; see [LabCostAspects](LabCostAspects.md).
- **Scope.** The construct changes only the resources of its own stack. Each stack in an app that must be destroyed by default needs its own `LabStack`.
- **cdk-nag.** This construct adds no `suppressNag` entries and has no deliberate findings. Findings reported for resources you add are left to you.

## Example

```typescript
import { App, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { LabStack } from 'cdk-constructless';

const app = new App();
const stack = new LabStack(app, 'Lab', {
  env: { account: '123456789012', region: 'eu-west-1' },
  project: 'demo',
  owner: 'alerts@example.com',
  expiresAt: '2026-12-31',
});

// Synthesis fails for a bucket without autoDeleteObjects, so set it in the bucket props.
new s3.Bucket(stack, 'Scratch', {
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md).
