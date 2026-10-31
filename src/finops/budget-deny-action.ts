import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ConstructValidationError } from '../core/errors';
import { assertIamActions } from '../core/validation';
import {
  BudgetActionApprovalModel,
  type BudgetActionSubscriber,
  BudgetActionThresholdType,
  toActionSubscribers,
  validateActionThreshold,
} from './budget-action-common';
import { BudgetActionExecutionRole } from './budget-action-execution-role';
import { BudgetNotificationType, type CostBudget } from './cost-budget';

/**
 * The compute actions that the deny policy blocks by default: creating or starting EC2 instances, Lambda functions, ECS services and
 * tasks, and RDS instances.
 */
export const DEFAULT_DENIED_COMPUTE_ACTIONS: readonly string[] = [
  'ec2:RunInstances',
  'ec2:StartInstances',
  'lambda:CreateFunction',
  'ecs:CreateService',
  'ecs:RunTask',
  'rds:CreateDBInstance',
  'rds:StartDBInstance',
];

/**
 * Properties of the `BudgetDenyAction` construct.
 */
export interface BudgetDenyActionProps {
  /**
   * The budget whose threshold runs the action. The action depends on this budget.
   *
   * @default none (required)
   */
  readonly budget: CostBudget;

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
   * The roles that the deny policy is attached to. Between 0 and any number of items; at least one role, user or group is required.
   *
   * @default [] (no roles)
   */
  readonly roles?: iam.IRole[];

  /**
   * The users that the deny policy is attached to. At least one role, user or group is required.
   *
   * @default [] (no users)
   */
  readonly users?: iam.IUser[];

  /**
   * The groups that the deny policy is attached to. At least one role, user or group is required.
   *
   * @default [] (no groups)
   */
  readonly groups?: iam.IGroup[];

  /**
   * The IAM actions that the deny policy denies on all resources. Each entry must look like `service:Action`, for example
   * `sagemaker:CreateEndpoint`. The list replaces the defaults, so include the defaults you still need.
   *
   * @default DEFAULT_DENIED_COMPUTE_ACTIONS (ec2:RunInstances, ec2:StartInstances, lambda:CreateFunction, ecs:CreateService,
   * ecs:RunTask, rds:CreateDBInstance, rds:StartDBInstance)
   */
  readonly deniedActions?: string[];

  /**
   * The recipients of the action notifications. Between 1 and 11 items.
   *
   * @default none (required)
   */
  readonly subscribers: BudgetActionSubscriber[];

  /**
   * The role that AWS Budgets assumes to attach the deny policy. When it is set, the construct grants it the attach and detach permissions
   * for the deny policy.
   *
   * @default a new BudgetActionExecutionRole created as the child `ExecutionRole` of this construct
   */
  readonly executionRole?: BudgetActionExecutionRole;
}

/**
 * A Budget Action that attaches a customer-managed IAM deny policy to the given roles, users or groups when a `CostBudget` threshold is crossed.
 *
 * The construct wraps `AWS::IAM::ManagedPolicy` (`denyPolicy`, one Deny statement over `deniedActions` on `*`) and
 * `AWS::Budgets::BudgetsAction` with `ActionType` `APPLY_IAM_POLICY` (`action`). The action depends on the budget, so CloudFormation
 * creates the budget first. The execution role is either `executionRole` or a new `BudgetActionExecutionRole`, and it may attach and
 * detach `denyPolicy` only (`iam:PolicyARN` condition).
 *
 * The deny policy is applied at the threshold and removed only by reverting the action. It does not stop resources that already run,
 * so pair it with `BudgetStopInstancesAction` to stop existing instances. APPLY_IAM_POLICY works in any account, unlike SCP actions,
 * which need the management account.
 *
 * Limits (the action does not cover these cases):
 * - Principals that are not in `roles`, `users` or `groups` keep their permissions.
 * - Budgets data lags 8 to 12 hours, so the action can run long after the spend occurred.
 * - A reverted action is not re-evaluated in the same budget period unless it is reset manually.
 *
 * Suppressions: the deny policy's `Deny` statement uses the wildcard resource `*`. Deny statements only remove permissions, so cdk-nag
 * `AwsSolutions-IAM5` findings on the policy are acknowledged with the reason "Deny statements on all resources only remove permissions;
 * no access is granted". The execution role acknowledges its own findings (see `BudgetActionExecutionRole`).
 *
 * @throws {ConstructValidationError} `BudgetDenyAction needs at least one role, user or group` when `roles`, `users` and `groups` are all empty,
 * `deniedActions entries must look like service:Action, got "<value>"` for the first denied action that does not match `/^[a-z0-9-]+:[A-Za-z0-9*]+$/`,
 * and the errors of `validateActionThreshold` and `toActionSubscribers` for an invalid `threshold` or `subscribers`
 */
export class BudgetDenyAction extends Construct {
  /**
   * The wrapped `AWS::IAM::ManagedPolicy` that denies the actions. It is attached only through the Budget Action.
   */
  public readonly denyPolicy: iam.ManagedPolicy;

  /**
   * The wrapped `AWS::Budgets::BudgetsAction` resource.
   */
  public readonly action: budgets.CfnBudgetsAction;

  /**
   * The role that AWS Budgets assumes to attach the deny policy, either `BudgetDenyActionProps.executionRole` or the created `ExecutionRole`.
   */
  public readonly executionRole: BudgetActionExecutionRole;

  /**
   * @param scope the parent construct
   * @param id the construct id
   * @param props the action properties
   */
  constructor(scope: Construct, id: string, props: BudgetDenyActionProps) {
    super(scope, id);

    const { budget, threshold, subscribers } = props;
    const thresholdType = props.thresholdType ?? BudgetActionThresholdType.PERCENTAGE;
    const notificationType = props.notificationType ?? BudgetNotificationType.ACTUAL;
    const approvalModel = props.approvalModel ?? BudgetActionApprovalModel.AUTOMATIC;
    const roles = props.roles ?? [];
    const users = props.users ?? [];
    const groups = props.groups ?? [];
    const deniedActions = props.deniedActions ?? [...DEFAULT_DENIED_COMPUTE_ACTIONS];

    if (roles.length + users.length + groups.length === 0) {
      throw new ConstructValidationError(this, 'BudgetDenyAction needs at least one role, user or group');
    }
    assertIamActions(this, 'deniedActions', deniedActions);
    validateActionThreshold(this, threshold, thresholdType);
    const subscriberProperties = toActionSubscribers(this, subscribers);

    this.denyPolicy = new iam.ManagedPolicy(this, 'DenyPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: deniedActions,
          resources: ['*'],
        }),
      ],
    });

    this.executionRole = props.executionRole ?? new BudgetActionExecutionRole(this, 'ExecutionRole');
    this.executionRole.allowApplyIamPolicy(this.denyPolicy);

    this.action = new budgets.CfnBudgetsAction(this, 'Action', {
      budgetName: budget.budgetName,
      actionType: 'APPLY_IAM_POLICY',
      actionThreshold: { type: thresholdType, value: threshold },
      definition: {
        iamActionDefinition: {
          policyArn: this.denyPolicy.managedPolicyArn,
          ...(roles.length > 0 ? { roles: roles.map((role) => role.roleName) } : {}),
          ...(users.length > 0 ? { users: users.map((user) => user.userName) } : {}),
          ...(groups.length > 0 ? { groups: groups.map((group) => group.groupName) } : {}),
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
