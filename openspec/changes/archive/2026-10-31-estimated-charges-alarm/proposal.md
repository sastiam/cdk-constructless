# Proposal

## Why

The `AWS/Billing` `EstimatedCharges` alarm is a backup to Budgets: it reacts to current charges, but it only exists in
`us-east-1` and is easy to create in the wrong region, where it never fires. Requirements from issue #28.

## What Changes

- New `BillingAlarm` construct: `EstimatedCharges` (Currency USD, Maximum, 6 hours, 1 period, `GreaterThanThreshold`, missing data not breaching) with an SNS action.
- Refuses to synthesize outside `us-east-1`; warns when the region is unresolved.
- Optional `linkedAccountId` dimension.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `finops-alerts`: adds the billing alarm (ADDED requirement).

## Impact

New `src/finops/billing-alarm.ts`, tests, docs page. Requires billing alerts enabled in the account (human issue).
