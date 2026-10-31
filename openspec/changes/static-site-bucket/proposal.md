# Proposal

## Why

Every frontend needs a private origin bucket served only through CloudFront. Public website buckets, missing TLS
enforcement and abandoned multipart uploads are common mistakes, and the last one costs money without anyone noticing.

## What Changes

- New `StaticSiteBucket` construct: private bucket (block all public access, TLS enforced, S3-managed encryption,
  bucket-owner-enforced ownership), lifecycle rule aborting incomplete multipart uploads after 1 day, configurable removal policy.

## Capabilities

### New Capabilities

- `static-site`: hosting static frontends with S3, CloudFront, ACM and Route 53.

### Modified Capabilities

None.

## Impact

New `src/static-site/static-site-bucket.ts`, tests, README section.
