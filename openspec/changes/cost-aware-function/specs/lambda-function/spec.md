## ADDED Requirements

### Requirement: Cost-aware defaults

The library SHALL provide a Node.js function whose defaults minimize cost and risk, each overridable.

#### Scenario: Defaults

- **WHEN** a `CostAwareFunction` is created with only `entry`
- **THEN** the `AWS::Lambda::Function` has `Runtime` `nodejs24.x`, `Architectures` `['arm64']`, `MemorySize` 256, `Timeout` 10 and `RecursiveLoop` `Terminate`

#### Scenario: Override

- **WHEN** `memorySize: 512` and `architecture: Architecture.X86_64` are given
- **THEN** the function uses 512 MB and `x86_64`

### Requirement: Bounded log retention

Function logs SHALL go to a dedicated log group with finite retention, without the deprecated log-retention custom resource.

#### Scenario: Default log group

- **WHEN** a function is created with defaults
- **THEN** one `AWS::Logs::LogGroup` with `RetentionInDays` 3 and `DeletionPolicy` `Delete` exists, the function's `LoggingConfig.LogGroup` references it, and no `Custom::LogRetention` resource exists

#### Scenario: Custom retention

- **WHEN** `logRetentionDays: RetentionDays.ONE_WEEK` and `logRemovalPolicy: RemovalPolicy.RETAIN` are given
- **THEN** the log group has `RetentionInDays` 7 and `DeletionPolicy` `Retain`
