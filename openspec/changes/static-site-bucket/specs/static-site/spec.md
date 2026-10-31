## ADDED Requirements

### Requirement: Private origin bucket

The library SHALL provide a private S3 bucket suitable as a CloudFront origin.

#### Scenario: Secure defaults

- **WHEN** a `StaticSiteBucket` is created
- **THEN** the `AWS::S3::Bucket` blocks all public access, uses `AES256` encryption, has `OwnershipControls` `BucketOwnerEnforced`, no `WebsiteConfiguration`, and its bucket policy denies requests where `aws:SecureTransport` is false

#### Scenario: Multipart cleanup

- **WHEN** a `StaticSiteBucket` is created
- **THEN** a lifecycle rule aborts incomplete multipart uploads after 1 day

### Requirement: Removal policy

The bucket SHALL be retained by default and deletable with its objects when requested.

#### Scenario: Default retain

- **WHEN** no removal props are given
- **THEN** the bucket has `DeletionPolicy` `Retain` and no auto-delete custom resource

#### Scenario: Destroy with objects

- **WHEN** `removalPolicy: RemovalPolicy.DESTROY` and `autoDeleteObjects: true` are given
- **THEN** the bucket has `DeletionPolicy` `Delete` and a `Custom::S3AutoDeleteObjects` resource exists

#### Scenario: Auto-delete without destroy

- **WHEN** `autoDeleteObjects: true` is given without `RemovalPolicy.DESTROY`
- **THEN** construction fails with `autoDeleteObjects requires removalPolicy DESTROY`
