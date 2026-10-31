import type * as budgets from 'aws-cdk-lib/aws-budgets';
import type * as sns from 'aws-cdk-lib/aws-sns';
import type { Construct } from 'constructs';
import { ConstructValidationError } from '../core/errors';
import { assertItemCount, assertPositive, assertRange } from '../core/validation';

/**
 * How the action threshold is measured against the budget limit.
 */
export enum BudgetActionThresholdType {
  /** The threshold is a percentage of the budget limit, from 0.01 to 1000. */
  PERCENTAGE = 'PERCENTAGE',
  /** The threshold is an absolute amount in USD. Must be greater than 0. */
  ABSOLUTE_VALUE = 'ABSOLUTE_VALUE',
}

/**
 * Whether AWS Budgets runs the action on its own or waits for a person to approve it.
 */
export enum BudgetActionApprovalModel {
  /** AWS Budgets runs the action as soon as the threshold is crossed. */
  AUTOMATIC = 'AUTOMATIC',
  /** AWS Budgets waits for an approval before it runs the action. */
  MANUAL = 'MANUAL',
}

/**
 * A recipient of the Budget Action notifications.
 *
 * Exactly one of `email` or `topic` must be set.
 */
export interface BudgetActionSubscriber {
  /**
   * The e-mail address that receives the notifications. Set this or `topic`, not both.
   *
   * @default none (exactly one of email or topic is required)
   */
  readonly email?: string;

  /**
   * The SNS topic that receives the notifications. The topic policy must allow AWS Budgets to publish.
   * Set this or `email`, not both.
   *
   * @default none (exactly one of email or topic is required)
   */
  readonly topic?: sns.ITopic;
}

/**
 * Checks an action threshold against its threshold type.
 *
 * A PERCENTAGE threshold must be between 0.01 and 1000. An ABSOLUTE_VALUE threshold must be greater than 0.
 * Unresolved tokens are not checked.
 *
 * @param scope the construct that owns the threshold
 * @param threshold the threshold value to check
 * @param type how `threshold` is measured
 * @throws {ConstructValidationError} `threshold must be between 0.01 and 1000, got <value>` for a PERCENTAGE threshold outside that range,
 * or `threshold must be greater than 0, got <value>` for an ABSOLUTE_VALUE threshold that is not greater than 0
 */
export function validateActionThreshold(scope: Construct, threshold: number, type: BudgetActionThresholdType): void {
  if (type === BudgetActionThresholdType.PERCENTAGE) {
    assertRange(scope, 'threshold', threshold, 0.01, 1000);
  } else {
    assertPositive(scope, 'threshold', threshold);
  }
}

/**
 * Converts a subscriber to its `AWS::Budgets::BudgetsAction` form, or throws when the subscriber does not set exactly one of `email` and `topic`.
 *
 * @param scope the construct that owns the subscriber
 * @param subscriber the subscriber to convert
 * @returns an `EMAIL` subscriber for `email`, or an `SNS` subscriber for `topic`
 * @throws {ConstructValidationError} `each subscriber needs exactly one of email or topic` when both or neither is set
 */
function toSubscriberProperty(
  scope: Construct,
  subscriber: BudgetActionSubscriber,
): budgets.CfnBudgetsAction.SubscriberProperty {
  const { email, topic } = subscriber;
  if (email !== undefined && topic === undefined) {
    return { type: 'EMAIL', address: email };
  }
  if (topic !== undefined && email === undefined) {
    return { type: 'SNS', address: topic.topicArn };
  }
  throw new ConstructValidationError(scope, 'each subscriber needs exactly one of email or topic');
}

/**
 * Converts the subscribers of a Budget Action to their `AWS::Budgets::BudgetsAction` form.
 *
 * @param scope the construct that owns the subscribers
 * @param subscribers the subscribers to convert; must contain 1 to 11 items
 * @returns one `SubscriberProperty` per subscriber, in the same order
 * @throws {ConstructValidationError} `subscribers must contain between 1 and 11 items, got <count>` (from `assertItemCount`) when the list
 * is empty or longer than 11, or `each subscriber needs exactly one of email or topic` when a subscriber does not set exactly one of `email` and `topic`
 */
export function toActionSubscribers(
  scope: Construct,
  subscribers: BudgetActionSubscriber[],
): budgets.CfnBudgetsAction.SubscriberProperty[] {
  assertItemCount(scope, 'subscribers', subscribers, 1, 11);
  return subscribers.map((subscriber) => toSubscriberProperty(scope, subscriber));
}
