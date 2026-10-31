# lab-cost-controls Specification

## Purpose
TBD - created by archiving change lab-cost-aspects. Update Purpose after archive.

## Requirements

### Requirement: Bounded log retention

Log groups without retention SHALL receive a finite retention.

#### Scenario: Missing retention

- **WHEN** `LabCostAspects.applyTo(stack)` runs on a stack with a `logs.LogGroup` created with `retention: RetentionDays.INFINITE`
- **THEN** the `AWS::Logs::LogGroup` has `RetentionInDays` 3

#### Scenario: Longer retention

- **WHEN** a log group has `RetentionInDays` 30
- **THEN** it keeps 30 and a warning `cdk-constructless:log-retention` is emitted

### Requirement: S3 cleanup rules

Buckets SHALL abort incomplete multipart uploads and expire noncurrent versions.

#### Scenario: Plain bucket

- **WHEN** the aspects run on a bucket without lifecycle rules
- **THEN** the bucket has a rule with `AbortIncompleteMultipartUpload.DaysAfterInitiation` 1 and no `NoncurrentVersionExpiration`

#### Scenario: Versioned bucket

- **WHEN** the bucket is versioned
- **THEN** a rule with `NoncurrentVersionExpiration.NoncurrentDays` 7 is also present; existing rules are kept

### Requirement: Fixed-cost warnings

Resources with a fixed hourly or monthly price SHALL produce a warning naming the type.

#### Scenario: NAT gateway

- **WHEN** the stack contains an `AWS::EC2::NatGateway`
- **THEN** a warning `cdk-constructless:fixed-cost` mentioning `AWS::EC2::NatGateway` is attached to it

### Requirement: Destroy-by-default lab stack

A lab stack SHALL tag every resource and make every resource deletable with the stack.

#### Scenario: Tags and removal policy

- **WHEN** a `LabStack` with `project: 'demo'`, `owner: 'alerts@example.com'` contains an `sqs.Queue`
- **THEN** the queue has tags `Project=demo`, `Env=lab`, `Owner=alerts@example.com` and `DeletionPolicy` `Delete`

#### Scenario: Opt out

- **WHEN** `retainedConstructPaths` contains the queue's path
- **THEN** its removal policy is left unchanged

#### Scenario: Bucket without auto delete

- **WHEN** the stack has an `s3.Bucket` without `autoDeleteObjects: true`
- **THEN** synthesis reports the error `cdk-constructless:lab-bucket-auto-delete`

#### Scenario: RDS

- **WHEN** the stack has an `AWS::RDS::DBInstance` with deletion protection
- **THEN** `DeletionProtection` becomes false

#### Scenario: Expiry tag

- **WHEN** `expiresAt: '2026-12-31'` is given
- **THEN** every resource has tag `ExpiresAt=2026-12-31`; a value that is not `YYYY-MM-DD` fails with `expiresAt must be a YYYY-MM-DD date, got "<value>"`
