import { Annotations, Stack, Token } from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';
import { ConstructValidationError } from './errors';

/**
 * Asserts that a numeric prop is greater than 0.
 *
 * The check is skipped when `value` is an unresolved token, because the value is only known at deploy time.
 *
 * @param scope the construct that owns the prop
 * @param name the prop name used in the error message
 * @param value the numeric value to check
 * @throws {ConstructValidationError} `${name} must be greater than 0, got ${value}` when `value` is not greater than 0
 */
export function assertPositive(scope: IConstruct, name: string, value: number): void {
  if (Token.isUnresolved(value)) {
    return;
  }
  if (!(value > 0)) {
    throw new ConstructValidationError(scope, `${name} must be greater than 0, got ${value}`);
  }
}

/**
 * Asserts that a numeric prop lies between `min` and `max`, both inclusive.
 *
 * The check is skipped when `value` is an unresolved token, because the value is only known at deploy time.
 *
 * @param scope the construct that owns the prop
 * @param name the prop name used in the error message
 * @param value the numeric value to check
 * @param min the smallest accepted value, inclusive
 * @param max the largest accepted value, inclusive
 * @throws {ConstructValidationError} `${name} must be between ${min} and ${max}, got ${value}` when `value` is outside the range
 */
export function assertRange(scope: IConstruct, name: string, value: number, min: number, max: number): void {
  if (Token.isUnresolved(value)) {
    return;
  }
  if (!(value >= min && value <= max)) {
    throw new ConstructValidationError(scope, `${name} must be between ${min} and ${max}, got ${value}`);
  }
}

/**
 * Asserts that an array prop contains between `min` and `max` items, both inclusive.
 *
 * @param scope the construct that owns the prop
 * @param name the prop name used in the error message
 * @param items the array to count
 * @param min the smallest accepted item count, inclusive
 * @param max the largest accepted item count, inclusive
 * @throws {ConstructValidationError} `${name} must contain between ${min} and ${max} items, got ${items.length}` when the count is outside the range
 */
export function assertItemCount(
  scope: IConstruct,
  name: string,
  items: readonly unknown[],
  min: number,
  max: number,
): void {
  if (items.length < min || items.length > max) {
    throw new ConstructValidationError(
      scope,
      `${name} must contain between ${min} and ${max} items, got ${items.length}`,
    );
  }
}

/**
 * Asserts that the stack containing `scope` is deployed in the region a feature requires.
 *
 * When the stack region is an unresolved token (for example an environment-agnostic stack), the check cannot run.
 * In that case a warning with id `cdk-constructless:unresolved-region` is added instead of an error.
 *
 * @param scope the construct that needs the region
 * @param expected the region the feature requires, for example `us-east-1`
 * @param reason the feature name used in the message, for example `CloudFront certificate`
 * @throws {ConstructValidationError} `${reason} requires region ${expected}, got ${region}` when the stack region is resolved and differs from `expected`
 */
export function assertRegion(scope: IConstruct, expected: string, reason: string): void {
  const region = Stack.of(scope).region;
  if (Token.isUnresolved(region)) {
    Annotations.of(scope).addWarningV2(
      'cdk-constructless:unresolved-region',
      `Region is unresolved; ${reason} requires ${expected}`,
    );
    return;
  }
  if (region !== expected) {
    throw new ConstructValidationError(scope, `${reason} requires region ${expected}, got ${region}`);
  }
}
