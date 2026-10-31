# Tasks

## 1. Core helpers

- [x] 1.1 Create `src/core/errors.ts` exporting `class ConstructValidationError extends Error` with constructor
  `(scope: IConstruct, message: string)`, `name = 'ConstructValidationError'` and message "[${scope.node.path}] ${message}".
  Create `src/core/validation.ts` exporting:
  `assertPositive(scope, name: string, value: number)` → throws "${name} must be greater than 0, got ${value}";
  `assertRange(scope, name, value: number, min: number, max: number)` → throws "${name} must be between ${min} and ${max}, got ${value}";
  `assertItemCount(scope, name, items: readonly unknown[], min: number, max: number)` → throws "${name} must contain between ${min} and ${max} items, got ${items.length}";
  `assertRegion(scope, expected: string, reason: string)` → reads `Stack.of(scope).region`; if `Token.isUnresolved(region)` adds
  `Annotations.of(scope).addWarningV2('cdk-constructless:unresolved-region', `Region is unresolved; ${reason} requires ${expected}`)`,
  else if `region !== expected` throws "${reason} requires region ${expected}, got ${region}".
  All number assertions return without checking when `Token.isUnresolved(value)`. All throw `ConstructValidationError`.
  Create `src/core/nag.ts` exporting `interface NagSuppression { readonly id: string; readonly reason: string }` and
  `suppressNag(construct: IConstruct, suppressions: NagSuppression[])`, which calls `Validations.of(construct).acknowledge({ id, reason })` (from `aws-cdk-lib`) for each entry
  (cdk-nag 3 uses CDK policy validation; acknowledgements cover the construct subtree, and the library keeps cdk-nag a dev dependency only);
  throw `ConstructValidationError` with message: cdk-nag suppression <id> needs a reason of at least 20 characters, when `reason.length < 20`.
  Rules that report several findings per resource (for example `AwsSolutions-IAM4` and `AwsSolutions-IAM5`) must be acknowledged per finding id, written `RuleId[FindingId]`
  exactly as the validation report prints it (for example `AwsSolutions-IAM5[Resource::*]`); document this in the TSDoc of `suppressNag`. Create `src/core/index.ts` re-exporting the three files.
  Replace `src/index.ts` with `export { ConstructValidationError } from './core/errors';`.
  Verify: `bun run typecheck` `bun run lint`
- [x] 1.2 Create `test/helpers/index.ts` exporting:
  `synth(build: (stack: Stack) => void, options?: { region?: string; envAgnostic?: boolean; nag?: boolean }): Stack` — new `App`, `Stack(app, 'TestStack', { env })`
  with env `{ account: '123456789012', region: options?.region ?? 'us-east-1' }` unless `envAgnostic`; unless `options?.nag === false` call
  `Validations.of(app).addPlugins(new AwsSolutionsChecks(app))` before `build(stack)`; returns the stack. With the plugin, any cdk-nag error makes the first synthesis
  (including `Template.fromStack`) throw `Validation failed`, so tests of configurations that knowingly keep nag errors pass `{ nag: false }`;
  `normalizedTemplate(stack: Stack): unknown` — `JSON.parse(JSON.stringify(Template.fromStack(stack).toJSON()).replace(/[a-f0-9]{64}/g, 'ASSET_HASH'))`;
  `expectNoNagErrors(stack: Stack): void` — `expect(() => (stack.node.root as App).synth({ force: true })).not.toThrow()`.
  Commit `feat(core)`.
  Verify: `bun run typecheck`

## 2. Core tests

- [x] 2.1 Create `test/core/validation.test.ts`: one test per helper for the passing case and the exact thrown message
  (match with `toThrow(<exact message>)` including the `[TestStack/Probe]` path prefix, using a `new Construct(stack, 'Probe')` scope);
  a test that `assertPositive` with `Token.asNumber({ Ref: 'P' })` does not throw; a test that `assertRegion` on an `envAgnostic` stack
  produces exactly one warning containing `cdk-constructless:unresolved-region`; a test that `assertRegion(scope, 'us-east-1', 'X')`
  in `eu-west-1` throws `X requires region us-east-1, got eu-west-1`.
  Create `test/core/nag.test.ts`: in a `synth` stack, an `s3.Bucket` with `enforceSSL: true` and no server access logs makes `Template.fromStack(stack)` throw `Validation failed`;
  after `suppressNag(bucket, [{ id: 'AwsSolutions-S1', reason: 'Access logs are disabled in this test on purpose' }])` `expectNoNagErrors(stack)` passes and
  `bucket.node.metadata` contains an entry of type `Validations.ACKNOWLEDGED_RULES_METADATA_KEY`; a reason shorter than 20 characters throws.
  In `AGENTS.md` replace the cdk-nag bullet with: cdk-nag 3 runs as a CDK policy-validation plugin; acknowledge deliberate findings only through `suppressNag`
  (reason of at least 20 characters, listed in the construct TSDoc), using the exact finding ids from the validation report (IAM4/IAM5 are per finding, `RuleId[FindingId]`);
  tests whose stacks keep findings left to the consumer pass `{ nag: false }` to `synth` with a comment.
  Delete `test/index.test.ts` and add `test/index.test.ts` asserting `ConstructValidationError` is exported from `../src`.
  Commit `test(core)`.
  Verify: `bun run test test/core` `bun run test test/index.test.ts` `bun run lint`
