# Proposal

## Why

Shipping a build folder to the bucket and invalidating the CDN is the last step of every frontend deploy. Invalidating
`/*` counts as one path, so it stays within the 1,000 free invalidation paths per month.

## What Changes

- New `StaticSiteDeployment` construct wrapping `BucketDeployment`: uploads sources, prunes old files, invalidates `/*` by default.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-site`: adds content deployment (ADDED requirement).

## Impact

New `src/static-site/static-site-deployment.ts`, tests, README section. `BucketDeployment` adds a singleton Lambda (upstream) whose cdk-nag findings the library cannot suppress.
