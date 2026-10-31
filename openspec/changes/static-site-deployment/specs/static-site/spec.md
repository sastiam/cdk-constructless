## ADDED Requirements

### Requirement: Content deployment with invalidation

The library SHALL upload site content to the bucket and invalidate the distribution cache.

#### Scenario: Default deployment

- **WHEN** a `StaticSiteDeployment` is created with one source, a bucket and a distribution
- **THEN** one `Custom::CDKBucketDeployment` exists with `Prune` true, `DistributionPaths` `['/*']` and the distribution id

#### Scenario: No invalidation

- **WHEN** `invalidate: false` is given
- **THEN** the custom resource has no `DistributionId` and no `DistributionPaths`

#### Scenario: No sources

- **WHEN** `sources` is empty
- **THEN** construction fails with `sources must contain between 1 and 100 items, got 0`
