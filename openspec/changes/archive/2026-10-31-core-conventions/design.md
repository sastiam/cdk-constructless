# Design

## Decisions

- **Own error class.** `aws-cdk-lib`'s `ValidationError` is `@internal`, so the library defines
  `ConstructValidationError extends Error` with message format `[<node.path>] <message>`. Consumers can `instanceof` it.
- **Token awareness.** Every assertion is a no-op when the value is an unresolved token (`Token.isUnresolved`),
  because values from parameters or imports are only known at deploy time.
- **cdk-nag without dependency.** cdk-nag reads `Metadata.cdk_nag.rules_to_suppress` on CloudFormation resources.
  Writing that metadata directly keeps cdk-nag a dev dependency while still silencing deliberate findings for consumers who run it.
- **Nag in every test stack.** `synth()` adds `AwsSolutionsChecks` before the first synthesis, because aspects added after
  synthesis never run; `expectNoNagErrors` only reads annotations.
- **Snapshot stability.** `normalizedTemplate` replaces 64-hex asset hashes with `ASSET_HASH`, so bundling changes do not churn snapshots.

## Risks / Trade-offs

- [cdk-nag metadata format changes] → covered by `test/core/nag.test.ts`, which runs the real `AwsSolutionsChecks`.
