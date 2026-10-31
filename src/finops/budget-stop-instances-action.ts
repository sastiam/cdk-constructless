import { Stack, Token } from 'aws-cdk-lib';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import { Construct } from 'constructs';
import { ConstructValidationError } from '../core/errors';
import { assertItemCount } from '../core/validation';
import {
  BudgetActionApprovalModel,
  type BudgetActionSubscriber,
  BudgetActionThresholdType,
  toActionSubscribers,
  validateActionThreshold,
} from './budget-action-common';
import { BudgetActionExecutionRole, StopInstancesTarget } from './budget-action-execution-role';
import { BudgetNotificationType, type CostBudget } from './cost-budget';

/**
 * Properties of the `BudgetStopInstancesAction` construct.
 */
export interface BudgetStopInstancesActionProps {
  /**
   * The budget whose threshold runs the action. The action depends on this budget and uses its name.
   *
   * @default none (required)
   */
  readonly budget: CostBudget;

  /**
   * The instance type that the action stops: `StopInstancesTarget.EC2` or `StopInstancesTarget.RDS`.
   *
   * @default none (required)
   */
  readonly target: StopInstancesTarget;

  /**
   * The instance IDs to stop. Between 1 and 100 items; each ID must belong to the target type in this account and region.
   *
   * @default none (required)
   */
  readonly instanceIds: string[];

  /**
   * The threshold that runs the action. A percentage from 0.01 to 1000 when `thresholdType` is `PERCENTAGE`;
   * an amount greater than 0 when `thresholdType` is `ABSOLUTE_VALUE`.
   *
   * @default none (required)
   */
  readonly threshold: number;

  /**
   * How `threshold` is measured.
   *
   * @default BudgetActionThresholdType.PERCENTAGE
   */
  readonly thresholdType?: BudgetActionThresholdType;

  /**
   * Whether the threshold is compared against actual or forecasted spend.
   *
   * @default BudgetNotificationType.ACTUAL
   */
  readonly notificationType?: BudgetNotificationType;

  /**
   * Whether the action runs automatically or waits for approval. The default runs an unattended lab account without a person in the loop.
   *
   * @default BudgetActionApprovalModel.AUTOMATIC
   */
  readonly approvalModel?: BudgetActionApprovalModel;

  /**
   * The region of the instances to stop. The SSM definition needs a literal region, so an unresolved stack region requires this prop.
   *
   * @default the region of the stack that contains this construct (`Stack.of(this).region`)
   */
  readonly region?: string;

  /**
   * The recipients of the action notifications. Between 1 and 11 items.
   *
   * @default none (required)
   */
  readonly subscribers: BudgetActionSubscriber[];

  /**
   * The role that AWS Budgets assumes to stop the instances. When it is set, the construct grants it the stop permissions for `target`.
   *
   * @default a new BudgetActionExecutionRole created as the child `ExecutionRole` of this construct
   */
  readonly executionRole?: BudgetActionExecutionRole;
}

const SSM_SUBTYPE: Record<StopInstancesTarget, string> = {
  [StopInstancesTarget.EC2]: 'STOP_EC2_INSTANCES',
  [StopInstancesTarget.RDS]: 'STOP_RDS_INSTANCES',
};

/**
 * A Budget Action that stops the listed EC2 or RDS instances through an SSM automation document when a `CostBudget` threshold is crossed.
 *
 * The construct wraps `AWS::Budgets::BudgetsAction` with `ActionType` `RUN_SSM_DOCUMENTS` and subtype `STOP_EC2_INSTANCES` or
 * `STOP_RDS_INSTANCES`. The action depends on the budget, so CloudFormation creates the budget first. The execution role is either
 * `executionRole` or a new `BudgetActionExecutionRole`, and it is granted the stop permissions for `target`.
 *
 * Limits (the action does not cover these cases):
 * - Instances created after the action is deployed are not covered; only the IDs in `instanceIds` are stopped.
 * - Cross-account targets are not supported; the instances must be in the account and region of this stack.
 * - Budgets data lags 8 to 12 hours, so the action can run long after the spend occurred.
 * - A reverted action is not re-evaluated in the same budget period unless it is reset manually.
 * - Availability of Budget Actions on the AWS Free Plan is unconfirmed; check it before you rely on this construct there.
 *
 * Suppressions: the execution role acknowledges its own `AwsSolutions-IAM5` wildcard findings (see `BudgetActionExecutionRole`).
 * This construct adds no suppressions of its own.
 *
 * @throws {ConstructValidationError} when `instanceIds` does not contain 1 to 100 items, when `subscribers` does not contain 1 to 11 items,
 * when a subscriber does not set exactly one of `email` and `topic`, when a PERCENTAGE `threshold` is outside 0.01 to 1000,
 * when an ABSOLUTE_VALUE `threshold` is not greater than 0, or when `region` is not set and the stack region is unresolved
 */
export class BudgetStopInstancesAction extends Construct {
  /**
   * The wrapped `AWS::Budgets::BudgetsAction` resource.
   */
  public readonly action: budgets.CfnBudgetsAction;

  /**
   * The role that AWS Budgets assumes, either `BudgetStopInstancesActionProps.executionRole` or the created `ExecutionRole`.
   */
  public readonly executionRole: BudgetActionExecutionRole;

  /**
   * @param scope the parent construct
   * @param id the construct id
   * @param props the action properties
   */
  constructor(scope: Construct, id: string, props: BudgetStopInstancesActionProps) {
    super(scope, id);

    const { budget, target, instanceIds, threshold, subscribers } = props;
    const thresholdType = props.thresholdType ?? BudgetActionThresholdType.PERCENTAGE;
    const notificationType = props.notificationType ?? BudgetNotificationType.ACTUAL;
    const approvalModel = props.approvalModel ?? BudgetActionApprovalModel.AUTOMATIC;

    assertItemCount(this, 'instanceIds', instanceIds, 1, 100);
    const subscriberProperties = toActionSubscribers(this, subscribers);
    validateActionThreshold(this, threshold, thresholdType);

    const region = props.region ?? Stack.of(this).region;
    if (Token.isUnresolved(region)) {
      throw new ConstructValidationError(this, 'region must be set when the stack region is unresolved');
    }

    this.executionRole = props.executionRole ?? new BudgetActionExecutionRole(this, 'ExecutionRole');
    this.executionRole.allowStopInstances(target);

    this.action = new budgets.CfnBudgetsAction(this, 'Action', {
      budgetName: budget.budgetName,
      actionType: 'RUN_SSM_DOCUMENTS',
      actionThreshold: { type: thresholdType, value: threshold },
      definition: {
        ssmActionDefinition: {
          subtype: SSM_SUBTYPE[target],
          region,
          instanceIds,
        },
      },
      executionRoleArn: this.executionRole.role.roleArn,
      notificationType,
      approvalModel,
      subscribers: subscriberProperties,
    });
    this.action.addDependency(budget.budget);
  }
}
