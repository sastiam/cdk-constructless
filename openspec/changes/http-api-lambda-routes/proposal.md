# Proposal

## Why

Wiring a Lambda route needs an integration, a permission scoped to the route and an optional authorizer. A single
method keeps that consistent and makes authorization an explicit choice for each route.

## What Changes

- `HttpApiService.addLambdaRoute({ method, path, handler, authorizer? })` returning the created routes.
- Path validation; a warning when a route has no authorizer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `http-api`: adds Lambda routes (ADDED requirement).

## Impact

Edits `src/http-api/http-api-service.ts`; new tests; README update.
