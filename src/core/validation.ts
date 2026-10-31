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

const IAM_ACTION_PATTERN = /^[a-z0-9-]+:[A-Za-z0-9*]+$/;

/**
 * Asserts that every entry of an IAM action list looks like `service:Action`, for example `ec2:RunInstances`.
 *
 * Each entry is checked separately. An entry that is an unresolved token is skipped, because its value is only known at deploy time.
 *
 * @param scope the construct that owns the prop
 * @param name the prop name used in the error message
 * @param actions the IAM actions to check
 * @throws {ConstructValidationError} `${name} entries must look like service:Action, got "${value}"` for the first entry that does not match `/^[a-z0-9-]+:[A-Za-z0-9*]+$/`
 */
export function assertIamActions(scope: IConstruct, name: string, actions: readonly string[]): void {
  for (const action of actions) {
    if (Token.isUnresolved(action)) {
      continue;
    }
    if (!IAM_ACTION_PATTERN.test(action)) {
      throw new ConstructValidationError(scope, `${name} entries must look like service:Action, got "${action}"`);
    }
  }
}

// Domain labels exclude '.', so each character has exactly one way to match (linear time, no ReDoS).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const EMAIL_MAX_LENGTH = 254;

/**
 * Asserts that every entry of an e-mail list is a syntactically valid e-mail address.
 *
 * Each entry is checked separately. An entry that is an unresolved token is skipped, because its value is only known at deploy time.
 *
 * @param scope the construct that owns the prop
 * @param name the prop name used in the error message
 * @param emails the e-mail addresses to check
 * @throws {ConstructValidationError} `${name} contains an invalid email "${value}"` for the first entry longer than 254 characters
 * or that does not match `/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/`
 */
export function assertEmails(scope: IConstruct, name: string, emails: readonly string[]): void {
  for (const email of emails) {
    if (Token.isUnresolved(email)) {
      continue;
    }
    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      throw new ConstructValidationError(scope, `${name} contains an invalid email "${email}"`);
    }
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
