import type { IConstruct } from 'constructs';

/**
 * Error thrown when a construct receives an invalid prop or is deployed in an unsupported configuration.
 *
 * The message is prefixed with the construct path, for example `[MyStack/Budget] amount must be greater than 0, got -1`,
 * so consumers can `instanceof` the class and still see which construct failed.
 */
export class ConstructValidationError extends Error {
  /**
   * The error name, always `ConstructValidationError`.
   */
  readonly name = 'ConstructValidationError';

  /**
   * @param scope the construct whose prop or configuration failed validation
   * @param message the description of the failure, without the construct path prefix
   */
  constructor(scope: IConstruct, message: string) {
    super(`[${scope.node.path}] ${message}`);
  }
}
