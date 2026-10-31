# Proposal

## Why

CloudFront in front of a private bucket is the cheapest way to serve a frontend (1 TB and 10 M requests per month
free). Doing it right requires Origin Access Control, security headers, SPA fallbacks and a sensible price class.

## What Changes

- New `StaticSiteDistribution` construct: CloudFront distribution with an OAC S3 origin, HTTPS redirect, managed
  caching-optimized policy, `SECURITY_HEADERS` response policy, `index.html` root, `PriceClass_100`, HTTP/2 and HTTP/3,
  and optional SPA error routing. No Lambda@Edge (unsupported on the AWS Free Plan).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-site`: adds the CloudFront distribution (ADDED requirements).

## Impact

New `src/static-site/static-site-distribution.ts`, tests, README section.
