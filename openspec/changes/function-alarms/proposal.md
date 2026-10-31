# Proposal

## Why

Functions fail or throttle silently unless someone wires alarms. A one-call way to add standard alarms, optionally
routed to an SNS topic, makes failures visible without extra cost by default (the first 10 CloudWatch alarms are free).

## What Changes

- `CostAwareFunction.addDefaultAlarms(options?)` creates an Errors alarm and a Throttles alarm, with an SNS action when a topic is given.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lambda-function`: adds default alarms (ADDED requirement).

## Impact

Edits `src/lambda/cost-aware-function.ts`; new tests; README update.
