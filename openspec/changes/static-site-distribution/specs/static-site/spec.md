## ADDED Requirements

### Requirement: CloudFront distribution with private origin

The library SHALL serve a private bucket through a CloudFront distribution using Origin Access Control.

#### Scenario: Defaults

- **WHEN** a `StaticSiteDistribution` is created for a `StaticSiteBucket`
- **THEN** the distribution has `DefaultRootObject` `index.html`, `PriceClass` `PriceClass_100`, `HttpVersion` `http2and3`, `ViewerProtocolPolicy` `redirect-to-https`, the managed `CachingOptimized` cache policy, the managed `SecurityHeadersPolicy` response headers policy, an `AWS::CloudFront::OriginAccessControl` for S3, and no Lambda@Edge associations

#### Scenario: Bucket policy

- **WHEN** the distribution is synthesized
- **THEN** the bucket policy allows `s3:GetObject` to `cloudfront.amazonaws.com` with `AWS:SourceArn` equal to the distribution ARN

#### Scenario: SPA routing

- **WHEN** `spa: true` is given
- **THEN** `CustomErrorResponses` map 403 and 404 to `/index.html` with response code 200 and `ErrorCachingMinTTL` 0

#### Scenario: Not SPA

- **WHEN** `spa` is not given
- **THEN** no `CustomErrorResponses` exist
