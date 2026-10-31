# 0003. Use Floci for local integration tests

Date: 2026-10-30

## Status

Accepted

## Context

Integration tests need an AWS API emulator, so that the constructs can be deployed and checked without a real AWS
account. LocalStack was the usual choice. Since March 2026 LocalStack requires an auth token, so a contributor or a CI
job cannot run it without an account and a secret.

Floci is an emulator released under the MIT licence. It runs without an auth token and listens on port 4566, the same
port LocalStack uses, so the endpoint configuration stays familiar.

Floci does not implement every CloudFormation resource type. When a template contains an unsupported type, Floci
accepts the resource and stubs it: the stack reports success, but the resource is not created in the emulator. A test
that only checks that a deployment succeeded can therefore pass while the resource is missing.

## Decision

- Local integration tests run against Floci, an MIT-licensed AWS emulator on port 4566. No auth token is required.
- Integration tests assert through the service APIs (for example, the S3, Lambda, or Budgets APIs) to confirm that a
  resource exists and has the expected configuration. They do not rely only on the CloudFormation stack status.
- Unit tests do not use Floci. They synthesise templates and assert on them with `Template`, as described in
  `AGENTS.md`.

## Consequences

- Contributors and CI can run integration tests without an account or a secret.
- Assertions made through service APIs catch the stubbed resources that a stack-status check would miss.
- Each new integration test needs an API call that proves the resource behaviour, which takes more effort to write than
  a stack-status check.
- Some AWS behaviour is not emulated faithfully. Results from Floci do not prove that the same deployment works in AWS,
  so the project's release checks must not depend on Floci alone.
- If Floci stops being maintained, or a required service is missing, this decision is revisited in a new ADR.
