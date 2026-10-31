# Proposal

## Why

HTTP APIs (API Gateway v2) are the cheapest managed API front door (1 USD per million requests). Left at defaults,
they have no throttling, so abuse turns into spend, and they have no access logs. The research recommends a rate
limiter on every API.

## What Changes

- New `HttpApiService` construct: `HttpApi` with an explicit `$default` stage, mandatory throttling (rate 10, burst 20 by default),
  JSON access logs to a 3-day log group, and optional CORS.

## Capabilities

### New Capabilities

- `http-api`: HTTP APIs (API Gateway v2) with throttling, access logs, routes and custom domains.

### Modified Capabilities

None.

## Impact

New `src/http-api/http-api-service.ts`, tests, README section.
