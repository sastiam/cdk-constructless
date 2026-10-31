# Tasks

## 1. LabStack

- [x] 1.1 Create `src/finops/lab-stack.ts` exporting `interface LabStackProps extends StackProps { readonly project: string; readonly owner: string; readonly expiresAt?: string; readonly retainedConstructPaths?: string[];
  readonly costAspects?: Parameters<typeof LabCostAspects.applyTo>[1] }` and `class LabStack extends Stack`. Constructor: validate `expiresAt` with `/^\d{4}-\d{2}-\d{2}$/`
  (message: expiresAt must be a YYYY-MM-DD date, got "<value>"); `Tags.of(this).add('Project', project)`, `('Env', 'lab')`, `('Owner', owner)`, and `('ExpiresAt', expiresAt)` when set;
  `LabCostAspects.applyTo(this, costAspects)`; add with `AspectPriority.MUTATING` a `LabRemovalAspect` (exported) that, for every `CfnResource` whose `node.path` does not start with any retained path,
  calls `applyRemovalPolicy(RemovalPolicy.DESTROY)`, and for `rds.CfnDBInstance`/`rds.CfnDBCluster` sets `deletionProtection = false`; and a `LabBucketAspect` (exported) that, for every `s3.Bucket`
  with no child construct whose id is `AutoDeleteObjectsCustomResource`, adds `Annotations.of(bucket).addError('cdk-constructless:lab-bucket-auto-delete: set autoDeleteObjects: true on lab buckets; an aspect cannot add it after construction')`.
  Class TSDoc: the janitor can read `ExpiresAt`; `removalPolicy` SNAPSHOT on RDS leaves a billable snapshot, which DESTROY avoids. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [x] 1.2 Create `test/finops/lab-stack.test.ts` (build stacks directly with `new LabStack(new App(), 'Lab', { env: { account: '123456789012', region: 'us-east-1' }, project: 'demo', owner: 'alerts@example.com' })`, no nag plugin)
  covering each scenario in this change's `specs/lab-cost-controls/spec.md`: tags with `Match.arrayWith`, `DeletionPolicy: 'Delete'`, opt-out, the bucket error via `Annotations.fromStack(stack).hasError`,
  a bucket with `autoDeleteObjects: true` and `removalPolicy: DESTROY` producing no error, `DeletionProtection: false` on an `rds.CfnDBInstance`, the expiry tag and its error. Snapshot of a stack with one queue.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/lab-stack.test.ts` `bun run lint`

## 2. Documentation

- [x] 2.1 Create `docs/constructs/LabStack.md` from `docs/constructs/_template.md`, filling every mandatory section (what destroy removes and what still bills: snapshots taken outside the stack,
  CloudWatch logs created by services outside the stack). Link the existing `docs/aws-facts.md` rows it relies on and add `LabStack` to their Used by cells.
  In `README.md` `## Constructs` add `- [LabStack](docs/constructs/LabStack.md): destroy-by-default stack with mandatory tags and lab cost aspects.`
  Add "`LabStack` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
