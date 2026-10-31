# Proposal

## Why

Consumers want one construct for "a frontend on a domain": bucket, distribution, certificate, DNS and content.
The building blocks exist; this composes them with one props object.

## What Changes

- New `StaticSite` construct composing `StaticSiteBucket`, `StaticSiteDistribution` (with optional domain and SPA mode)
  and an optional `StaticSiteDeployment`; exposes all parts and `url`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-site`: adds the composed site (ADDED requirement).

## Impact

New `src/static-site/static-site.ts`, tests, README section.
