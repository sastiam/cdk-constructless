# Tasks

## 1. StaticSiteDistribution

- [ ] 1.1 Create `src/static-site/static-site-distribution.ts` exporting `interface StaticSiteDistributionProps { readonly bucket: s3.IBucket; readonly spa?: boolean /* @default false */; readonly priceClass?: cloudfront.PriceClass /* @default PRICE_CLASS_100 */; readonly comment?: string; readonly enableLogging?: boolean /* @default false */ }`
  and `class StaticSiteDistribution extends Construct` with `public readonly distribution: cloudfront.Distribution` (id `'Distribution'`):
  `defaultBehavior: { origin: origins.S3BucketOrigin.withOriginAccessControl(bucket), viewerProtocolPolicy: REDIRECT_TO_HTTPS, cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS, compress: true }`,
  `defaultRootObject: 'index.html'`, `priceClass`, `httpVersion: cloudfront.HttpVersion.HTTP2_AND_3`, `enableLogging`, and when `spa`
  `errorResponses: [403, 404].map((httpStatus) => ({ httpStatus, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.seconds(0) }))`.
  Getter `get url(): string` → "https://${this.distribution.distributionDomainName}".
  Suppressions via `suppressNag(this.distribution, ...)`: `AwsSolutions-CFR3` reason 'Standard logs need a log bucket and cost extra; set enableLogging to turn them on' (only when `!enableLogging`),
  and `AwsSolutions-CFR4` reason 'The default cloudfront.net certificate cannot enforce a minimum TLS version' (always in this change; the domain change makes it conditional).
  Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/static-site/static-site-distribution.test.ts` with a `StaticSiteBucket` covering each scenario in this change's `specs/static-site/spec.md`:
  exact `DefaultRootObject`, `PriceClass`, `HttpVersion`, `ViewerProtocolPolicy`, `CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6'`,
  `ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03'`, one `AWS::CloudFront::OriginAccessControl` with `OriginAccessControlOriginType: 's3'`,
  no `LambdaFunctionAssociations`; bucket policy statement with `Principal: { Service: 'cloudfront.amazonaws.com' }`, `Action: 's3:GetObject'` and
  `Condition.StringEquals['AWS:SourceArn']`; SPA `CustomErrorResponses` (two entries, exact values); none without `spa`. Snapshot and `expectNoNagErrors(stack)`.
  Commit `feat(static-site)`.
  Verify: `bun run test test/static-site/static-site-distribution.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/StaticSiteDistribution.md` from `docs/constructs/_template.md`, filling every mandatory section from the TSDoc, the specs of this change and the tests. Limits and risks: the `AwsSolutions-CFR3` and `AwsSolutions-CFR4` suppressions and reasons; WAF and geo restriction are opt-in (WAF costs at least 5 USD per month); no Lambda@Edge. Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| CloudFront Always Free: 1 TB data transfer and 10 M requests per month | https://aws.amazon.com/cloudfront/pricing/ | 2026-10-30 | StaticSiteDistribution |`; `| Lambda@Edge is not supported on the AWS Free Plan | https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html | 2026-10-30 | StaticSiteDistribution |`. In `README.md` `## Constructs` add the line `- [StaticSiteDistribution](docs/constructs/StaticSiteDistribution.md): CloudFront distribution with Origin Access Control in front of a private bucket.`
  Add "`StaticSiteDistribution` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(static-site)`.
  Verify: `bun run test` `bun run lint`
