# Proposal

## Why

Every consumer project (HTTP APIs, WebSockets, stream processors) needs Lambda functions. The research lists the cost
traps of default Lambda setups: logs kept forever, deprecated `logRetention` custom resources, legacy runtimes,
recursion loops and unbounded concurrency. One function construct with cheap, safe defaults removes them everywhere.

## What Changes

- New `CostAwareFunction` (extends `NodejsFunction`) with defaults: Node.js 24, ARM64, 256 MB, 10 s timeout,
  `recursiveLoop: TERMINATE`, minified bundles with source maps, and an explicit `LogGroup` with 3-day retention.
- `logRetention` (deprecated upstream) is replaced by `logRetentionDays`; the log group removal policy is configurable.

## Capabilities

### New Capabilities

- `lambda-function`: Node.js Lambda functions with cost-aware, secure defaults.

### Modified Capabilities

None.

## Impact

New `src/lambda/cost-aware-function.ts`, `test/lambda/`, `test/fixtures/handler.ts`, README section.
