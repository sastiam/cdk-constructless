## ADDED Requirements

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
