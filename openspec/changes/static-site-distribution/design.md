# Design

## Decisions

- **OAC via `S3BucketOrigin.withOriginAccessControl`**: OAI is legacy; CDK adds the bucket policy statement for the distribution.
- **`PriceClass_100`** (North America and Europe) is the cheapest; consumers can override.
- **SPA mode** maps 403 and 404 to `/index.html` with status 200 and TTL 0, because a private OAC origin returns 403 for missing keys.
- **cdk-nag.** `AwsSolutions-CFR3` (access logging) is suppressed: standard logs need a log bucket and cost money; the TSDoc points to `enableLogging`.
  `AwsSolutions-CFR4` (TLS policy) is suppressed only when no custom domain is configured, because the default `*.cloudfront.net` certificate cannot set a minimum TLS version.
  `AwsSolutions-CFR1`/`CFR2` (geo restriction, WAF) are warnings, not errors, and WAF costs at least 5 USD per month; they are not suppressed.
