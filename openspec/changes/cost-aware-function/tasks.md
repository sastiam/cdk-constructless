# Tasks

## 1. CostAwareFunction

- [ ] 1.1 Create `test/fixtures/handler.ts` exporting `export const handler = async () => ({ statusCode: 200, body: 'ok' });`.
  Create `src/lambda/cost-aware-function.ts` exporting
  `interface CostAwareFunctionProps extends Omit<NodejsFunctionProps, 'logRetention' | 'logGroup'> { readonly logRetentionDays?: logs.RetentionDays /* @default THREE_DAYS */; readonly logRemovalPolicy?: RemovalPolicy /* @default DESTROY */ }`
  and `class CostAwareFunction extends NodejsFunction` with `public readonly logGroup: logs.LogGroup`.
  Because nothing can run on `this` before `super`, a `private static createLogGroup(scope, id, props): logs.LogGroup` creates
  `new logs.LogGroup(scope, `${id}LogGroup`, { retention: props.logRetentionDays ?? THREE_DAYS, removalPolicy: props.logRemovalPolicy ?? DESTROY })`;
  the constructor calls `super(scope, id, { ...defaults, ...props, logGroup })` with that log group and then assigns `this.logGroup`. Defaults (applied only when the prop is `undefined`):
  `runtime: lambda.Runtime.NODEJS_24_X`, `architecture: lambda.Architecture.ARM_64`, `memorySize: 256`, `timeout: Duration.seconds(10)`,
  `recursiveLoop: lambda.RecursiveLoop.TERMINATE`, `bundling: { minify: true, sourceMap: true, ...props.bundling }`.
  After `super`, if `this.role` exists call `suppressNag(this.role, [{ id: 'AwsSolutions-IAM4', reason: 'AWSLambdaBasicExecutionRole only allows writing CloudWatch Logs for this function' }])`.
  TSDoc on the class lists every default and mentions overriding `architecture` for native x86 modules. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/lambda/cost-aware-function.test.ts` with `entry: path.join(__dirname, '../fixtures/handler.ts')`, one test per scenario in
  `specs/lambda-function/spec.md`: exact `Runtime`, `Architectures`, `MemorySize`, `Timeout`, `RecursiveLoop`; overrides; one `AWS::Logs::LogGroup`
  with `RetentionInDays: 3` and resource-level `DeletionPolicy: 'Delete'`; `LoggingConfig: { LogGroup: { Ref: <log group logical id> } }`;
  `template.resourceCountIs('Custom::LogRetention', 0)`; custom retention 7 days and `DeletionPolicy: 'Retain'`.
  Snapshot via `normalizedTemplate` and `expectNoNagErrors(stack)` for the default case.
  Commit `feat(lambda)`.
  Verify: `bun run test test/lambda/cost-aware-function.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Add `### CostAwareFunction` under `## Constructs` in `README.md`: defaults table (prop, default, why), example, the cdk-nag suppression and reason.
  Add "`CostAwareFunction` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(lambda)`.
  Verify: `bun run lint` `bun run test`
