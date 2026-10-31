# Design

## Decisions

- **Inheritance over composition.** Extending `NodejsFunction` keeps the result an `IFunction` usable anywhere
  (integrations, grants, event sources) and exposes every upstream prop; defaults apply only when the prop is `undefined`.
- **Explicit runtime `NODEJS_24_X`** instead of `NODEJS_LATEST`: `LATEST` changes with the CDK version and causes
  unplanned function updates on dependency bumps; consumers can still override.
- **Explicit `LogGroup`** (`/aws/lambda/<function>` is not forced; CDK names it) passed via `logGroup`, because the
  `logRetention` prop creates a custom-resource Lambda and is deprecated. `logRetention` and `logGroup` are omitted from the props type.
- **ARM64** is about 20 % cheaper per GB-second than x86_64 with the same free tier.
- **cdk-nag**: `AwsSolutions-IAM4` (AWSLambdaBasicExecutionRole managed policy) is suppressed on the service role with a reason; it only grants writing to CloudWatch Logs.

## Risks / Trade-offs

- [Native modules compiled for x86] → consumers override `architecture`; TSDoc says so.
