# Tasks

## 1. StaticSiteBucket

- [ ] 1.1 Create `src/static-site/static-site-bucket.ts` exporting `interface StaticSiteBucketProps { readonly bucketName?: string; readonly removalPolicy?: RemovalPolicy /* @default RETAIN */; readonly autoDeleteObjects?: boolean /* @default false */ }`
  and `class StaticSiteBucket extends Construct` with `public readonly bucket: s3.Bucket` (id `'Bucket'`): `blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL`,
  `encryption: s3.BucketEncryption.S3_MANAGED`, `enforceSSL: true`, `objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED`, `versioned: false`,
  `lifecycleRules: [{ id: 'AbortIncompleteMultipartUploads', abortIncompleteMultipartUploadAfter: Duration.days(1) }]`, `removalPolicy`, `autoDeleteObjects`.
  If `autoDeleteObjects` and `removalPolicy !== RemovalPolicy.DESTROY` throw `ConstructValidationError` `autoDeleteObjects requires removalPolicy DESTROY`.
  `suppressNag(this.bucket, [{ id: 'AwsSolutions-S1', reason: 'Server access logs cost extra; CloudFront is the only reader of this private origin bucket' }])`; document it in the TSDoc.
  Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/static-site/static-site-bucket.test.ts` covering each scenario in `specs/static-site/spec.md` with exact `PublicAccessBlockConfiguration`
  (four `true` flags), `BucketEncryption` `SSEAlgorithm: 'AES256'`, `OwnershipControls.Rules[0].ObjectOwnership: 'BucketOwnerEnforced'`, absent `WebsiteConfiguration`,
  bucket policy statement with `Effect: 'Deny'` and `Condition: { Bool: { 'aws:SecureTransport': 'false' } }`, lifecycle `AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 }`,
  `DeletionPolicy` values, `Custom::S3AutoDeleteObjects` count, and the thrown message. Snapshot of the default case and `expectNoNagErrors(stack)`.
  Commit `feat(static-site)`.
  Verify: `bun run test test/static-site/static-site-bucket.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Add `### StaticSiteBucket` under `## Constructs` in `README.md` (purpose, defaults, cdk-nag suppression, lab example with `DESTROY` + `autoDeleteObjects`).
  Add "`StaticSiteBucket` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(static-site)`.
  Verify: `bun run lint` `bun run test`
