# Proposal

## Why

Cost traps from the FinOps research cut across every construct: log groups kept forever, abandoned multipart uploads,
noncurrent object versions, and resources with a fixed hourly price (NAT gateway, Elastic IP, load balancers, EKS…).
CDK Aspects apply these rules to a whole app without touching each construct.

## What Changes

- `LogRetentionAspect`: sets retention (3 days by default) on log groups without one; warns when a longer retention is set.
- `S3LifecycleAspect`: adds `AbortIncompleteMultipartUpload` (1 day) and, on versioned buckets, `NoncurrentVersionExpiration` (7 days).
- `FixedCostWarningAspect`: a warning for each resource type with a fixed monthly cost.
- `LabCostAspects.applyTo(scope, options?)`: adds the three as mutating aspects.

## Capabilities

### New Capabilities

- `lab-cost-controls`: app-wide cost controls for low-budget and lab accounts.

### Modified Capabilities

None.

## Impact

New `src/finops/lab-cost-aspects.ts`, tests, docs page.
