## ADDED Requirements

### Requirement: Composed static site

The library SHALL provide one construct that creates the bucket, the distribution, an optional domain and optional content deployment.

#### Scenario: Minimal site

- **WHEN** a `StaticSite` is created with no props
- **THEN** exactly one `AWS::S3::Bucket` and one `AWS::CloudFront::Distribution` exist, no `Custom::CDKBucketDeployment` exists, and `url` is the distribution's `https://` domain

#### Scenario: Full site

- **WHEN** `domain`, `spa: true` and `sources` are given in `us-east-1`
- **THEN** the template contains the certificate, alias records, SPA error responses and one `Custom::CDKBucketDeployment`, and `url` is `https://<first domain name>`

#### Scenario: Lab removal

- **WHEN** `removalPolicy: RemovalPolicy.DESTROY` and `autoDeleteObjects: true` are given
- **THEN** they are applied to the bucket
