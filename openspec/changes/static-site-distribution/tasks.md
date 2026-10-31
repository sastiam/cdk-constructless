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

- [ ] 2.1 Add `### StaticSiteDistribution` under `## Constructs` in `README.md` (defaults table, SPA mode, the cdk-nag suppressions and why WAF and geo restriction are opt-in,
  Free Plan note: no Lambda@Edge). Add "`StaticSiteDistribution` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(static-site)`.
  Verify: `bun run lint` `bun run test`
