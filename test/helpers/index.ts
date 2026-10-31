import { App, Stack, Validations } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import { expect } from 'vitest';

/**
 * Builds a test stack and returns it.
 *
 * Unless `options.nag` is `false`, the `AwsSolutionsChecks` plugin is registered on the app before `build` runs.
 * Aspects added after synthesis never run, so the plugin must be registered first.
 *
 * @param build adds the resources under test to the stack
 * @param options the stack configuration
 * @param options.region the stack region, `us-east-1` when absent
 * @param options.envAgnostic when `true`, the stack has no `env` and its region is an unresolved token
 * @param options.nag when `false`, cdk-nag is not registered; use it only for configurations that knowingly keep nag findings
 * @returns the stack that `build` populated
 */
export function synth(
  build: (stack: Stack) => void,
  options?: { region?: string; envAgnostic?: boolean; nag?: boolean },
): Stack {
  const app = new App();
  const env = options?.envAgnostic ? undefined : { account: '123456789012', region: options?.region ?? 'us-east-1' };
  const stack = new Stack(app, 'TestStack', { env });
  if (options?.nag !== false) {
    Validations.of(app).addPlugins(new AwsSolutionsChecks(app));
  }
  build(stack);
  return stack;
}

/**
 * Returns the synthesized CloudFormation template of a stack as plain JSON.
 *
 * 64-character lowercase hex asset hashes are replaced with `ASSET_HASH`, so bundling changes do not churn snapshots.
 *
 * @param stack the stack to synthesize
 * @returns the template with asset hashes normalized
 */
export function normalizedTemplate(stack: Stack): unknown {
  return JSON.parse(JSON.stringify(Template.fromStack(stack).toJSON()).replace(/[a-f0-9]{64}/g, 'ASSET_HASH'));
}

/**
 * Asserts that synthesizing the app of a stack reports no cdk-nag errors.
 *
 * Synthesis is forced so that the policy validation plugins run again, and a validation failure throws.
 *
 * @param stack the stack whose app is synthesized
 */
export function expectNoNagErrors(stack: Stack): void {
  expect(() => (stack.node.root as App).synth({ force: true })).not.toThrow();
}
