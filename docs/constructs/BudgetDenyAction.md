# BudgetDenyAction

## Purpose

A budget alert tells you that spend crossed a threshold, but it does not stop new compute from being created. A lab account that has crossed its budget keeps creating EC2 instances, Lambda functions, ECS services and RDS databases until someone notices. This construct runs a Budget Action on a `CostBudget` that attaches an IAM deny policy to the roles, users or groups you name when the threshold is crossed. Those principals can no longer create or start the denied compute actions. The deny policy does not stop resources that already run, so pair this construct with [BudgetStopInstancesAction](BudgetStopInstancesAction.md) to stop existing instances.

## Resources created

| CloudFormation type | Count | Notes |
| --- | --- | --- |
| `AWS::IAM::ManagedPolicy` | 1 | Always created as `DenyPolicy`. It has one `Deny` statement over the `deniedActions` list on `*`. The policy is attached only by the Budget Action. |
| `AWS::Budgets::BudgetsAction` | 1 | Always created as `Action`. `ActionType` is `APPLY_IAM_POLICY`. The action depends on the wrapped budget. |
| `AWS::IAM::Role` | 1 | Created only when `executionRole` is not passed, as the child `ExecutionRole`. It is a [BudgetActionExecutionRole](BudgetActionExecutionRole.md). Count is 0 when `executionRole` is passed. |
| `AWS::IAM::Policy` | 1 | Created only when `executionRole` is not passed, as the role's `DefaultPolicy` that holds the attach and detach statement for the deny policy. When `executionRole` is passed, the statement is added to that role's own policy, and this construct creates no policy. |

## Props and defaults

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `budget` | `CostBudget` | none (required) | The budget whose threshold runs the action. The action depends on this budget. |
| `threshold` | `number` | none (required) | The threshold that runs the action. A percentage from 0.01 to 1000 when `thresholdType` is `PERCENTAGE`; an amount greater than 0 when `thresholdType` is `ABSOLUTE_VALUE`. |
| `thresholdType` | `BudgetActionThresholdType` | `BudgetActionThresholdType.PERCENTAGE` | How `threshold` is measured. |
| `notificationType` | `BudgetNotificationType` | `BudgetNotificationType.ACTUAL` | Whether the threshold is compared against actual or forecasted spend. |
| `approvalModel` | `BudgetActionApprovalModel` | `BudgetActionApprovalModel.AUTOMATIC` | Whether the action runs automatically or waits for approval. The default runs an unattended lab account without a person in the loop. |
| `roles` | `iam.IRole[]` | `[]` (no roles) | The roles that the deny policy is attached to. Any number of items; at least one role, user or group is required. |
| `users` | `iam.IUser[]` | `[]` (no users) | The users that the deny policy is attached to. At least one role, user or group is required. |
| `groups` | `iam.IGroup[]` | `[]` (no groups) | The groups that the deny policy is attached to. At least one role, user or group is required. |
| `deniedActions` | `string[]` | `DEFAULT_DENIED_COMPUTE_ACTIONS` (`ec2:RunInstances`, `ec2:StartInstances`, `lambda:CreateFunction`, `ecs:CreateService`, `ecs:RunTask`, `rds:CreateDBInstance`, `rds:StartDBInstance`) | The IAM actions that the deny policy denies on all resources. Each entry must look like `service:Action`, for example `sagemaker:CreateEndpoint`. The list replaces the defaults, so include the defaults you still need. |
| `subscribers` | `BudgetActionSubscriber[]` | none (required) | The recipients of the action notifications. Between 1 and 11 items. |
| `executionRole` | `BudgetActionExecutionRole` | a new `BudgetActionExecutionRole` created as the child `ExecutionRole` of this construct | The role that AWS Budgets assumes to attach the deny policy. When it is set, the construct grants it the attach and detach permissions for the deny policy. |

`DEFAULT_DENIED_COMPUTE_ACTIONS` is exported as a constant. The shared types `BudgetActionThresholdType`, `BudgetActionApprovalModel` and `BudgetActionSubscriber` are the same ones that `BudgetStopInstancesAction` uses. `BudgetActionSubscriber` sets exactly one of `email` or `topic`.

## Cost impact

**Variable.** The construct's own resources have no fixed cost: it creates one customer-managed IAM policy and one Budget Action, and when `executionRole` is not passed, one IAM role and its policy. The charge comes from AWS Budgets for an action-enabled budget. The first two action-enabled budgets per account are free each month; each additional one costs 0.10 USD per day. See [`../aws-facts.md`](../aws-facts.md).

## Verified AWS facts

- `AWS::Budgets::BudgetsAction` requires `ActionThreshold`, `ActionType`, `BudgetName`, `Definition`, `ExecutionRoleArn`, `NotificationType` and `Subscribers`. The construct sets all of them. See [`../aws-facts.md`](../aws-facts.md).
- The first two action-enabled budgets per account are free each month; each additional one costs 0.10 USD per day. See [`../aws-facts.md`](../aws-facts.md).
- A reverted Budget Action is not evaluated again in the same period unless it is reset. See [`../aws-facts.md`](../aws-facts.md).
- Budgets data refreshes up to three times a day, 8 to 12 hours apart, so the action can run long after the spend occurred. See [`../aws-facts.md`](../aws-facts.md).
- Unconfirmed: whether Budget Actions are available on the AWS Free Plan. See [`../aws-facts.md`](../aws-facts.md).
- The execution role's trust policy uses `budgets.amazonaws.com` with `aws:SourceAccount` and `aws:SourceArn`. See [BudgetActionExecutionRole](BudgetActionExecutionRole.md) and [`../aws-facts.md`](../aws-facts.md).

## Limits and risks

- **Applied at the threshold, removed only by reverting the action.** The deny policy is attached when the threshold is crossed. It is removed only by reverting the Budget Action. This construct has no other way to lift it.
- **Existing resources keep billing.** The deny policy blocks only creating and starting the denied actions. Running EC2 instances, RDS databases, Lambda functions, and ECS services and tasks keep running and keep billing. Pair this construct with [BudgetStopInstancesAction](BudgetStopInstancesAction.md) to stop the instances you list.
- **Only the listed principals are denied.** Principals that are not in `roles`, `users` or `groups` keep their permissions.
- **Only the listed actions are denied.** The default list covers the compute actions named above. Other compute actions, for example `sagemaker:CreateEndpoint`, are denied only when you add them to `deniedActions`. The list replaces the defaults, so a custom list must include each default you still need.
- **Budgets data lag.** Budgets data lags 8 to 12 hours, so the action can run long after the spend occurred. See [`../aws-facts.md`](../aws-facts.md).
- **A reverted action is not re-evaluated.** A reverted Budget Action is not evaluated again in the same budget period unless it is reset manually. See [`../aws-facts.md`](../aws-facts.md).
- **Automatic approval by default.** `approvalModel` defaults to `AUTOMATIC`, so the deny policy is attached without a person approving it. Set `MANUAL` to wait for an approval first.
- **Target count.** Construction fails with `BudgetDenyAction needs at least one role, user or group` when `roles`, `users` and `groups` are all empty.
- **Denied action shape.** Construction fails with `deniedActions entries must look like service:Action, got "<value>"` for the first entry that does not match `/^[a-z0-9-]+:[A-Za-z0-9*]+$/`.
- **Threshold range.** A `PERCENTAGE` threshold must be between 0.01 and 1000, otherwise construction fails with `threshold must be between 0.01 and 1000, got <value>`. An `ABSOLUTE_VALUE` threshold must be greater than 0, otherwise construction fails with `threshold must be greater than 0, got <value>`.
- **Subscriber limits.** `subscribers` must contain between 1 and 11 items, otherwise construction fails with `subscribers must contain between 1 and 11 items, got <count>`. Each subscriber must set exactly one of `email` or `topic`, otherwise construction fails with `each subscriber needs exactly one of email or topic`.
- **cdk-nag.** The construct records no cdk-nag suppression of its own: the deny policy has no finding in the validation report. The execution role's attach statement is acknowledged as listed in [BudgetActionExecutionRole](BudgetActionExecutionRole.md).

## Example

```typescript
import { App, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BudgetDenyAction, BudgetStopInstancesAction, CostBudget, StopInstancesTarget } from 'cdk-constructless';

const app = new App();
const stack = new Stack(app, 'Example', {
  env: { account: '123456789012', region: 'eu-west-1' },
});

const budget = new CostBudget(stack, 'MonthlyBudget', {
  limitUsd: 5,
  emails: ['alerts@example.com'],
});

// Deny compute creation and start for the lab role when actual spend reaches 80 percent of the budget.
const labRole = iam.Role.fromRoleName(stack, 'LabRole', 'LabRole');
new BudgetDenyAction(stack, 'DenyCompute', {
  budget,
  threshold: 80,
  roles: [labRole],
  subscribers: [{ email: 'alerts@example.com' }],
});

// Stop the listed instance at the same threshold. The deny policy does not stop instances that already run.
new BudgetStopInstancesAction(stack, 'StopInstances', {
  budget,
  target: StopInstancesTarget.EC2,
  instanceIds: ['i-0123456789abcdef0'],
  threshold: 80,
  subscribers: [{ email: 'alerts@example.com' }],
});
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md).
