# BudgetStopInstancesAction

## Purpose

An alert tells you that spend crossed a budget threshold, but it does not stop the spend. On a lab account, the EC2 or RDS instances that are running keep running and keep costing money until someone notices. This construct runs a Budget Action on a `CostBudget` that stops the instances you list when the threshold is crossed, so the spend stops without a manual step. It is a cost guardrail, not a full shutdown: it stops only the listed instances, and it acts only after Budgets data arrives, which can be hours late.

## Resources created

| CloudFormation type | Count | Notes |
| --- | --- | --- |
| `AWS::Budgets::BudgetsAction` | 1 | Always created. `ActionType` is `RUN_SSM_DOCUMENTS`, and the SSM subtype is `STOP_EC2_INSTANCES` or `STOP_RDS_INSTANCES` from `target`. The action depends on the wrapped budget. |
| `AWS::IAM::Role` | 1 | Created only when `executionRole` is not passed, as the child `ExecutionRole` of this construct. It is a [BudgetActionExecutionRole](BudgetActionExecutionRole.md). Count is 0 when `executionRole` is passed. |
| `AWS::IAM::Policy` | 1 | Created only when `executionRole` is not passed, as the role's `DefaultPolicy` that holds the stop statements for `target`. When `executionRole` is passed, the stop statements are added to that role's own policy, and this construct creates no policy. |

## Props and defaults

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `budget` | `CostBudget` | none (required) | The budget whose threshold runs the action. The action depends on this budget and uses its name. |
| `target` | `StopInstancesTarget` | none (required) | The instance type that the action stops: `StopInstancesTarget.EC2` or `StopInstancesTarget.RDS`. |
| `instanceIds` | `string[]` | none (required) | The instance IDs to stop. Between 1 and 100 items; each ID must belong to the target type in this account and region. |
| `threshold` | `number` | none (required) | The threshold that runs the action. A percentage from 0.01 to 1000 when `thresholdType` is `PERCENTAGE`; an amount greater than 0 when `thresholdType` is `ABSOLUTE_VALUE`. |
| `thresholdType` | `BudgetActionThresholdType` | `BudgetActionThresholdType.PERCENTAGE` | How `threshold` is measured. |
| `notificationType` | `BudgetNotificationType` | `BudgetNotificationType.ACTUAL` | Whether the threshold is compared against actual or forecasted spend. |
| `approvalModel` | `BudgetActionApprovalModel` | `BudgetActionApprovalModel.AUTOMATIC` | Whether the action runs automatically or waits for approval. The default runs an unattended lab account without a person in the loop. |
| `region` | `string` | the region of the stack that contains this construct (`Stack.of(this).region`) | The region of the instances to stop. The SSM definition needs a literal region, so an unresolved stack region requires this prop. |
| `subscribers` | `BudgetActionSubscriber[]` | none (required) | The recipients of the action notifications. Between 1 and 11 items. Each subscriber sets exactly one of `email` or `topic`. |
| `executionRole` | `BudgetActionExecutionRole` | a new `BudgetActionExecutionRole` created as the child `ExecutionRole` of this construct | The role that AWS Budgets assumes to stop the instances. When it is set, the construct grants it the stop permissions for `target`. |

`BudgetActionThresholdType` has the members `PERCENTAGE` and `ABSOLUTE_VALUE`. `BudgetActionApprovalModel` has the members `AUTOMATIC` and `MANUAL`. `BudgetActionSubscriber` has an optional `email` (an e-mail address) and an optional `topic` (an `sns.ITopic` whose topic policy must allow AWS Budgets to publish).

## Cost impact

**Variable** (assumption to verify). The construct's own resources have no fixed cost: it creates one `AWS::Budgets::BudgetsAction` and, when `executionRole` is not passed, one `AWS::IAM::Role` and its `AWS::IAM::Policy`. The charge comes from AWS Budgets for a budget that carries an action. The price is an assumption from issue #71, not a verified fact: the first two action-enabled budgets per account are free, then 0.10 USD per budget-day. Verify it before you rely on a cost figure. See [`../aws-facts.md`](../aws-facts.md).

## Verified AWS facts

- `AWS::Budgets::BudgetsAction` requires `ActionThreshold`, `ActionType`, `BudgetName`, `Definition`, `ExecutionRoleArn`, `NotificationType` and `Subscribers`, and an SSM definition takes 1 to 100 instance IDs. The construct sets all of them and checks the 1 to 100 range. See [`../aws-facts.md`](../aws-facts.md).
- A reverted Budget Action is not evaluated again in the same period unless it is reset. See [`../aws-facts.md`](../aws-facts.md).
- Assumption, to verify: the first two action-enabled budgets per account are free, then 0.10 USD per budget-day. See [`../aws-facts.md`](../aws-facts.md).
- Unconfirmed: whether Budget Actions are available on the AWS Free Plan. See [`../aws-facts.md`](../aws-facts.md).
- Budgets data refreshes up to three times a day, 8 to 12 hours apart, so the action can run long after the spend occurred. See [`../aws-facts.md`](../aws-facts.md).

## Limits and risks

- **Later instances are not covered.** Only the IDs in `instanceIds` are stopped. Instances created after the action is deployed are not covered until you add their IDs and deploy again.
- **No cross-account targets.** The instances must be in the account and region of this stack.
- **Budgets data lag.** Budgets data lags 8 to 12 hours, so the action can run long after the spend occurred. See [`../aws-facts.md`](../aws-facts.md).
- **A reverted action is not re-evaluated.** A reverted Budget Action is not evaluated again in the same budget period unless it is reset manually. See [`../aws-facts.md`](../aws-facts.md).
- **Free Plan availability is unconfirmed.** Check whether Budget Actions are available on the AWS Free Plan before you rely on this construct there. See [`../aws-facts.md`](../aws-facts.md).
- **Automatic approval by default.** `approvalModel` defaults to `AUTOMATIC`, so the action stops the listed instances without a person approving it. Set `MANUAL` to wait for an approval first.
- **Instance count limits.** `instanceIds` must contain between 1 and 100 items, otherwise construction fails with `instanceIds must contain between 1 and 100 items, got <n>`.
- **Subscriber limits.** `subscribers` must contain between 1 and 11 items, otherwise construction fails with `subscribers must contain between 1 and 11 items, got <n>`.
- **Subscriber shape.** Each subscriber must set exactly one of `email` or `topic`, otherwise construction fails with `each subscriber needs exactly one of email or topic`. The SNS topic's policy must allow AWS Budgets to publish; this construct does not change it.
- **Threshold range.** A `PERCENTAGE` threshold must be between 0.01 and 1000, otherwise construction fails with `threshold must be between 0.01 and 1000, got <value>`. An `ABSOLUTE_VALUE` threshold must be greater than 0, otherwise construction fails with `threshold must be greater than 0, got <value>`.
- **Unresolved region.** When the stack region is unresolved and `region` is not set, construction fails with `region must be set when the stack region is unresolved`.
- **cdk-nag.** This construct adds no `suppressNag` entries of its own. When it creates the execution role, the role's `AwsSolutions-IAM5` findings are acknowledged as listed in [BudgetActionExecutionRole](BudgetActionExecutionRole.md).

## Example

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { BudgetStopInstancesAction, CostBudget, StopInstancesTarget } from 'cdk-constructless';

const app = new App();
const stack = new Stack(app, 'Example', {
  env: { account: '123456789012', region: 'eu-west-1' },
});

const budget = new CostBudget(stack, 'MonthlyBudget', {
  limitUsd: 5,
  emails: ['alerts@example.com'],
});

// Stop one EC2 instance when actual spend reaches 80 percent of the budget.
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
