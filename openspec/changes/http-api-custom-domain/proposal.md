# Proposal

## Why

Production APIs are served on a custom domain, which takes a regional ACM certificate, an API Gateway domain name,
an API mapping and Route 53 alias records. Leaving the default `execute-api` endpoint enabled lets callers bypass
the domain.

## What Changes

- `HttpApiServiceProps.customDomain?: { domainName, hostedZone, certificate? }`.
- Creates a DNS-validated regional certificate when none is given, a `DomainName`, an `ApiMapping` to `$default`, and A/AAAA alias records.
- Disables the default `execute-api` endpoint when a custom domain is set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `http-api`: adds custom domains (ADDED requirement).

## Impact

Edits `src/http-api/http-api-service.ts`; new tests; README update. Route 53 hosted zone costs 0.50 USD per month (consumer-owned).
