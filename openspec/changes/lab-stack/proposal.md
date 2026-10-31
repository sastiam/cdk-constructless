# Proposal

## Why

Throwaway labs must leave nothing billing after `cdk destroy`: retained buckets, RDS snapshots and untagged resources
are the usual leftovers. Requirements from issue #73; builds on `lab-cost-aspects`.

## What Changes

- New `LabStack` (a `Stack` subclass): required `project` and `owner`; tags `Project`, `Env=lab`, `Owner` and optional `ExpiresAt`;
  `RemovalPolicy.DESTROY` on every resource unless opted out; synth error for buckets without `autoDeleteObjects`;
  RDS deletion protection off; applies `LabCostAspects`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lab-cost-controls`: adds the lab stack (ADDED requirements).

## Impact

New `src/finops/lab-stack.ts`, tests, docs page.
