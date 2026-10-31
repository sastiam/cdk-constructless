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

- [ ] 2.1 Add `### StaticSite` at the top of the static-site constructs in `README.md` with a complete example (domain, SPA, `Source.asset('./dist')`) and a cost table:
  CloudFront free tier (1 TB, 10 M requests per month), Route 53 zone 0.50 USD per month, ACM public certificates free, S3 storage per GB.
  Add "`StaticSite` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(static-site)`.
  Verify: `bun run lint` `bun run test`
