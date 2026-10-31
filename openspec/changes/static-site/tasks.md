# Tasks

## 1. StaticSite

- [ ] 1.1 Create `src/static-site/static-site.ts` exporting `interface StaticSiteProps { readonly bucketName?: string; readonly removalPolicy?: RemovalPolicy; readonly autoDeleteObjects?: boolean; readonly spa?: boolean; readonly priceClass?: cloudfront.PriceClass; readonly domain?: StaticSiteDomain; readonly sources?: s3deploy.ISource[] }`
  (TSDoc `@default` values copied from the underlying constructs) and `class StaticSite extends Construct` with
  `public readonly bucket: StaticSiteBucket` (id `'Bucket'`), `public readonly distribution: StaticSiteDistribution` (id `'Distribution'`),
  `public readonly deployment?: StaticSiteDeployment` (id `'Deployment'`, created only when `sources` is given and non-empty) and `get url(): string` delegating to the distribution.
  Pass props through unchanged. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/static-site/static-site.test.ts` covering each scenario in this change's `specs/static-site/spec.md` (resource counts with `resourceCountIs`,
  `url` resolved with `stack.resolve(site.url)`, `DeletionPolicy: 'Delete'` and `Custom::S3AutoDeleteObjects` for the lab case), reusing
  `test/fixtures/site` and the hosted zone attributes from `test/static-site/static-site-domain.test.ts`. Snapshot of the full case; `expectNoNagErrors(stack)` for the minimal case.
  Commit `feat(static-site)`.
  Verify: `bun run test test/static-site` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/StaticSite.md` from `docs/constructs/_template.md`, filling every mandatory section from the TSDoc, the specs of this change and the tests. Cost impact: a table with CloudFront free tier, Route 53 zone, ACM public certificates (free) and S3 storage, linking to the existing aws-facts rows. Example: domain, SPA mode and `Source.asset('./dist')`. Link the existing `docs/aws-facts.md` rows this construct relies on, and add none. In `README.md` `## Constructs` add the line `- [StaticSite](docs/constructs/StaticSite.md): frontend on S3 + CloudFront with optional domain and content deployment.`
  Add "`StaticSite` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(static-site)`.
  Verify: `bun run test` `bun run lint`
