# Tasks

## 1. Core helpers

- [ ] 1.1 Create `src/core/errors.ts` exporting `class ConstructValidationError extends Error` with constructor
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
  `suppressNag(construct: IConstruct, suppressions: NagSuppression[])`: resolve the target as `construct` if it is a `CfnResource`,
  else `construct.node.defaultChild` (throw `ConstructValidationError` `'suppressNag target has no CfnResource'` if neither);
  throw "cdk-nag suppression ${id} needs a reason of at least 20 characters" when `reason.length < 20`; merge into existing
  `cdk_nag.rules_to_suppress` metadata via `getMetadata`/`addMetadata`. Create `src/core/index.ts` re-exporting the three files.
  Replace `src/index.ts` with `export { ConstructValidationError } from './core/errors';`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/helpers/index.ts` exporting:
  `synth(build: (stack: Stack) => void, options?: { region?: string; envAgnostic?: boolean }): Stack` — new `App`, `Stack(app, 'TestStack', { env })`
  with env `{ account: '123456789012', region: options?.region ?? 'us-east-1' }` unless `envAgnostic`, adds
  `Aspects.of(app).add(new AwsSolutionsChecks())` before calling `build(stack)`, returns the stack;
  `normalizedTemplate(stack: Stack): unknown` — `JSON.parse(JSON.stringify(Template.fromStack(stack).toJSON()).replace(/[a-f0-9]{64}/g, 'ASSET_HASH'))`;
  `expectNoNagErrors(stack: Stack): void` — `expect(Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'))).toEqual([])`.
  Commit `feat(core)`.
  Verify: `bun run typecheck`

## 2. Core tests

- [ ] 2.1 Create `test/core/validation.test.ts`: one test per helper for the passing case and the exact thrown message
  (match with `toThrow(<exact message>)` including the `[TestStack/Probe]` path prefix, using a `new Construct(stack, 'Probe')` scope);
  a test that `assertPositive` with `Token.asNumber({ Ref: 'P' })` does not throw; a test that `assertRegion` on an `envAgnostic` stack
  produces exactly one warning containing `cdk-constructless:unresolved-region`; a test that `assertRegion(scope, 'us-east-1', 'X')`
  in `eu-west-1` throws `X requires region us-east-1, got eu-west-1`.
  Create `test/core/nag.test.ts`: an `s3.Bucket` without server access logs yields an `AwsSolutions-S1` error; after
  `suppressNag(bucket, [{ id: 'AwsSolutions-S1', reason: 'Access logs are disabled in this test on purpose' }])` that error is gone
  and the bucket's metadata contains `rules_to_suppress`; a reason shorter than 20 characters throws.
  Delete `test/index.test.ts` and add `test/index.test.ts` asserting `ConstructValidationError` is exported from `../src`.
  Commit `test(core)`.
  Verify: `bun run test test/core` `bun run test test/index.test.ts` `bun run lint`
