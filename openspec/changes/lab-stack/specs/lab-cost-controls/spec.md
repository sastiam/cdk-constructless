## ADDED Requirements

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
