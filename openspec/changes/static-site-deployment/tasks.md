# Tasks

## 1. StaticSiteDeployment

- [ ] 1.1 Create `test/fixtures/site/index.html` containing `<!doctype html><title>fixture</title>`.
  Create `src/static-site/static-site-deployment.ts` exporting `interface StaticSiteDeploymentProps { readonly bucket: s3.IBucket; readonly distribution: cloudfront.IDistribution; readonly sources: s3deploy.ISource[]; readonly invalidate?: boolean /* @default true */; readonly prune?: boolean /* @default true */; readonly memoryLimit?: number /* @default 256 */ }`
  and `class StaticSiteDeployment extends Construct` with `public readonly deployment: s3deploy.BucketDeployment` (id `'Deployment'`):
  `destinationBucket: bucket`, `sources`, `prune`, `memoryLimit`, and when `invalidate` `distribution` plus `distributionPaths: ['/*']`.
  Validate `assertItemCount(this, 'sources', sources, 1, 100)` and `assertRange(this, 'memoryLimit', memoryLimit, 128, 10240)`.
  Class TSDoc: `/*` counts as one invalidation path (1,000 free per month); the upstream singleton Lambda produces cdk-nag findings consumers must suppress at stack level.
  Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/static-site/static-site-deployment.test.ts` with `StaticSiteBucket`, `StaticSiteDistribution` and `s3deploy.Source.asset(path.join(__dirname, '../fixtures/site'))`
  covering each scenario in this change's `specs/static-site/spec.md`: `Custom::CDKBucketDeployment` count 1, `Prune: true`, `DistributionPaths: ['/*']`,
  `DistributionId: { Ref: <distribution logical id> }`; `invalidate: false` → both keys absent; empty sources throws; `memoryLimit: 64` throws
  `memoryLimit must be between 128 and 10240, got 64`. Snapshot via `normalizedTemplate`. Do not call `expectNoNagErrors` (upstream singleton Lambda).
  Commit `feat(static-site)`.
  Verify: `bun run test test/static-site/static-site-deployment.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Add `### StaticSiteDeployment` under `## Constructs` in `README.md` (example with `Source.asset('./dist')`, invalidation cost note, cdk-nag note).
  Add "`StaticSiteDeployment` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(static-site)`.
  Verify: `bun run lint` `bun run test`
