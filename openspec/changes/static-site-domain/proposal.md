# Proposal

## Why

A frontend on a custom domain needs an ACM certificate in `us-east-1` (a CloudFront requirement), the domain names
on the distribution, and Route 53 alias records. A certificate created in the wrong region fails only at deploy time.

## What Changes

- `StaticSiteDistributionProps.domain?: { domainNames, hostedZone, certificate? }`.
- Creates a DNS-validated certificate when the stack is in `us-east-1`; otherwise a `certificate` must be passed.
- A and AAAA alias records per domain name; minimum TLS `TLSv1.2_2021`; the `AwsSolutions-CFR4` suppression is dropped when a domain is set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-site`: adds custom domains (ADDED requirement).

## Impact

Edits `src/static-site/static-site-distribution.ts`; new tests; README update.
