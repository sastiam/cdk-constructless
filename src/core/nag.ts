import { Validations } from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';
import { ConstructValidationError } from './errors';

/**
 * One deliberate cdk-nag finding that a construct acknowledges.
 */
export interface NagSuppression {
  /**
   * The finding id exactly as the validation report prints it.
   *
   * Use the rule id alone for rules that report one finding per resource, for example `AwsSolutions-S1`.
   * Rules that report several findings per resource must use `RuleId[FindingId]`, for example
   * `AwsSolutions-IAM5[Resource::*]`.
   */
  readonly id: string;

  /**
   * Why the finding does not apply. Must be at least 20 characters long.
   */
  readonly reason: string;
}

/**
 * Acknowledges deliberate cdk-nag findings on a construct subtree.
 *
 * cdk-nag 3 runs as a CDK policy-validation plugin, so acknowledgements are recorded with `Validations.of(...).acknowledge`
 * and apply to every resource under `construct`. The library keeps cdk-nag as a dev dependency only; this helper does not import it.
 *
 * Rules that report several findings per resource (for example `AwsSolutions-IAM4` and `AwsSolutions-IAM5`) must be
 * acknowledged per finding id, written `RuleId[FindingId]` exactly as the validation report prints it, for example
 * `AwsSolutions-IAM5[Resource::*]`. A bare rule id does not cover those findings.
 *
 * All suppressions are validated before any is recorded, so an invalid entry leaves the construct unchanged.
 *
 * @param construct the construct whose subtree the findings belong to
 * @param suppressions the findings to acknowledge, each with a reason of at least 20 characters
 * @throws {ConstructValidationError} `cdk-nag suppression ${id} needs a reason of at least 20 characters` when a reason is shorter than 20 characters
 */
export function suppressNag(construct: IConstruct, suppressions: NagSuppression[]): void {
  for (const { id, reason } of suppressions) {
    if (reason.length < 20) {
      throw new ConstructValidationError(
        construct,
        `cdk-nag suppression ${id} needs a reason of at least 20 characters`,
      );
    }
  }
  for (const { id, reason } of suppressions) {
    Validations.of(construct).acknowledge({ id, reason });
  }
}
