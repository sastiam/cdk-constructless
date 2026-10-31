# Tasks

## 1. Stop-instances action

- [x] 1.1 Create `src/finops/budget-stop-instances-action.ts` exporting:
  `enum BudgetActionThresholdType { PERCENTAGE = 'PERCENTAGE', ABSOLUTE_VALUE = 'ABSOLUTE_VALUE' }`;
  `enum BudgetActionApprovalModel { AUTOMATIC = 'AUTOMATIC', MANUAL = 'MANUAL' }`;
  `interface BudgetActionSubscriber { readonly email?: string; readonly topic?: sns.ITopic }` (exactly one must be set, else throw `each subscriber needs exactly one of email or topic`);
  `interface BudgetStopInstancesActionProps { readonly budget: CostBudget; readonly target: StopInstancesTarget; readonly instanceIds: string[];
  readonly threshold: number; readonly thresholdType?: BudgetActionThresholdType /* @default PERCENTAGE */; readonly notificationType?: BudgetNotificationType /* @default ACTUAL */;
  readonly approvalModel?: BudgetActionApprovalModel /* @default AUTOMATIC */; readonly region?: string /* @default stack region */;
  readonly subscribers: BudgetActionSubscriber[]; readonly executionRole?: BudgetActionExecutionRole }`;
  `class BudgetStopInstancesAction extends Construct` with `public readonly action: budgets.CfnBudgetsAction` (id `'Action'`) and `public readonly executionRole: BudgetActionExecutionRole` (id `'ExecutionRole'` when created).
  Validation order: `assertItemCount(this, 'instanceIds', instanceIds, 1, 100)`; `assertItemCount(this, 'subscribers', subscribers, 1, 11)`;
  threshold PERCENTAGE → `assertRange(this, 'threshold', threshold, 0.01, 1000)`, ABSOLUTE_VALUE → `assertPositive(this, 'threshold', threshold)`;
  region = `props.region ?? Stack.of(this).region`, if `Token.isUnresolved(region)` throw `ConstructValidationError` `region must be set when the stack region is unresolved`.
  Call `executionRole.allowStopInstances(target)`. Map target EC2 → subtype `STOP_EC2_INSTANCES`, RDS → `STOP_RDS_INSTANCES`.
  CfnBudgetsAction: `budgetName: budget.budgetName`, `actionType 'RUN_SSM_DOCUMENTS'`, `actionThreshold { type, value: threshold }`,
  `definition { ssmActionDefinition { subtype, region, instanceIds } }`, `executionRoleArn: executionRole.role.roleArn`, `notificationType`, `approvalModel`,
  `subscribers` mapped to `{ type: 'EMAIL', address: email }` or `{ type: 'SNS', address: topic.topicArn }`. Then `this.action.addDependency(budget.budget)`.
  Class TSDoc lists the limits from `design.md` (later instances not covered, no cross-account, 8-12 h lag, reverted action not re-evaluated, Free Plan availability unconfirmed).
  Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [x] 1.2 Create `test/finops/budget-stop-instances-action.test.ts` with one test per scenario in `specs/budget-actions/spec.md` of this change, using
  `new CostBudget(stack, 'Budget', { limitUsd: 5, emails: ['alerts@example.com'] })` and subscriber `{ email: 'alerts@example.com' }`:
  exact `AWS::Budgets::BudgetsAction` properties; `DependsOn` contains the budget logical id; default role ARN is `{ 'Fn::GetAtt': [<role logical id>, 'Arn'] }`;
  0 and 101 instance IDs throw the exact messages; 0 and 12 subscribers throw; a subscriber with both email and topic throws;
  ABSOLUTE_VALUE threshold 0 throws `threshold must be greater than 0, got 0`; RDS target produces `STOP_RDS_INSTANCES`;
  an `envAgnostic` stack without `region` throws; with `region: 'eu-west-1'` on that stack it synthesizes with `Region: 'eu-west-1'`;
  a passed `executionRole` is used and no second `AWS::IAM::Role` is created. Snapshot of the EC2 default case and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/budget-stop-instances-action.test.ts` `bun run lint`

## 2. Documentation

- [x] 2.1 Create `docs/constructs/BudgetStopInstancesAction.md` from `docs/constructs/_template.md`, filling every mandatory section from the TSDoc, the specs of this change and the tests. Resources: `AWS::Budgets::BudgetsAction` plus the execution role when not passed. Limits and risks: copy the limits from the class TSDoc (instances created later are not covered, no cross-account targets, 8 to 12 h lag, a reverted action is not re-evaluated in the same period unless reset). Cost impact: mark the action-enabled budget price as an assumption to verify. Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| BudgetsAction requires ActionThreshold, ActionType, BudgetName, Definition, ExecutionRoleArn, NotificationType and Subscribers; SSM definitions take 1 to 100 instance IDs | https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-budgets-budgetsaction.html | 2026-10-30 | BudgetStopInstancesAction |`; `| A reverted Budget Action is not evaluated again in the same period unless it is reset | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | BudgetStopInstancesAction |`; `| Assumption (from issue #71, verify): the first two action-enabled budgets per account are free, then 0.10 USD per budget-day | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | BudgetStopInstancesAction |`; `| Unconfirmed: whether Budget Actions are available on the AWS Free Plan | https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html | 2026-10-30 | BudgetStopInstancesAction |`. In `README.md` `## Constructs` add the line `- [BudgetStopInstancesAction](docs/constructs/BudgetStopInstancesAction.md): Budget Action that stops listed EC2 or RDS instances through SSM.`
  Add "`BudgetStopInstancesAction` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
