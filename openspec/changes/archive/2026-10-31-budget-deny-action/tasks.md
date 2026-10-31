# Tasks

## 1. Shared action types

- [x] 1.1 Create `src/finops/budget-action-common.ts` and move into it, unchanged, from `src/finops/budget-stop-instances-action.ts`: `BudgetActionThresholdType`, `BudgetActionApprovalModel`,
  `BudgetActionSubscriber`, plus two new exported functions extracted from that file's constructor: `validateActionThreshold(scope, threshold: number, type: BudgetActionThresholdType)` and
  `toActionSubscribers(scope, subscribers: BudgetActionSubscriber[]): budgets.CfnBudgetsAction.SubscriberProperty[]` (includes the 1-11 count check and the exactly-one-of check with the same messages).
  Make `budget-stop-instances-action.ts` import them; keep every export in `src/index.ts` so the public API does not change.
  Commit `refactor(finops)`.
  Verify: `bun run typecheck` `bun run test test/finops` `bun run lint`

## 2. BudgetDenyAction

- [x] 2.1 In `src/finops/budget-action-execution-role.ts` add `allowApplyIamPolicy(policy: iam.IManagedPolicy): void` (once per policy ARN, tracked in a `Set`) adding a statement with actions
  `iam:AttachRolePolicy`, `iam:DetachRolePolicy`, `iam:AttachUserPolicy`, `iam:DetachUserPolicy`, `iam:AttachGroupPolicy`, `iam:DetachGroupPolicy`, resources `['*']`,
  conditions `{ ArnEquals: { 'iam:PolicyARN': policy.managedPolicyArn } }`, and acknowledge every new `AwsSolutions-IAM5[...]` finding id the validation report prints for the role policy with `suppressNag` (reason: IAM attach actions are scoped by iam:PolicyARN).
  Create `src/finops/budget-deny-action.ts` exporting `const DEFAULT_DENIED_COMPUTE_ACTIONS: readonly string[]` = `ec2:RunInstances`, `ec2:StartInstances`, `lambda:CreateFunction`, `ecs:CreateService`, `ecs:RunTask`,
  `rds:CreateDBInstance`, `rds:StartDBInstance`; `interface BudgetDenyActionProps { readonly budget: CostBudget; readonly threshold: number; readonly thresholdType?: BudgetActionThresholdType; readonly notificationType?: BudgetNotificationType;
  readonly approvalModel?: BudgetActionApprovalModel; readonly roles?: iam.IRole[]; readonly users?: iam.IUser[]; readonly groups?: iam.IGroup[]; readonly deniedActions?: string[]; readonly subscribers: BudgetActionSubscriber[]; readonly executionRole?: BudgetActionExecutionRole }`
  and `class BudgetDenyAction extends Construct` with `public readonly denyPolicy: iam.ManagedPolicy` (id `'DenyPolicy'`, one Deny statement, resources `*`), `public readonly action: budgets.CfnBudgetsAction` (id `'Action'`),
  `public readonly executionRole: BudgetActionExecutionRole` (id `'ExecutionRole'` when created).
  Validation: no roles/users/groups → throw `BudgetDenyAction needs at least one role, user or group`; each denied action must match `/^[a-z0-9-]+:[A-Za-z0-9*]+$/` else throw with message:
  deniedActions entries must look like service:Action, got "<value>"; `validateActionThreshold`; `toActionSubscribers`.
  Action: `actionType 'APPLY_IAM_POLICY'`, `definition { iamActionDefinition { policyArn: denyPolicy.managedPolicyArn, roles: roles.map(r => r.roleName), users: users.map(u => u.userName), groups: groups.map(g => g.groupName) } }`
  (omit empty lists), defaults `PERCENTAGE`, `ACTUAL`, `AUTOMATIC`; call `executionRole.allowApplyIamPolicy(denyPolicy)`; `action.addDependency(budget.budget)`.
  If the validation report flags `AwsSolutions-IAM5[...]` findings on the deny policy, acknowledge each finding id with `suppressNag` and reason 'Deny statements on all resources only remove permissions; no access is granted'. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [x] 2.2 Create `test/finops/budget-deny-action.test.ts` covering each scenario in this change's `specs/budget-actions/spec.md` with exact properties, using `iam.Role.fromRoleName(stack, 'Lab', 'LabRole')`
  and a `CostBudget`; plus users and groups mapped to names; both error messages. Snapshot and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops` `bun run lint`

## 3. Documentation

- [x] 3.1 Create `docs/constructs/BudgetDenyAction.md` from `docs/constructs/_template.md`, filling every mandatory section (deny is applied at the threshold and removed only by reverting the action;
  existing resources keep billing; pair with `BudgetStopInstancesAction`). Update `docs/constructs/BudgetActionExecutionRole.md` with the IAM attach permissions.
  Link the existing Budget Actions rows in `docs/aws-facts.md` and add `BudgetDenyAction` to their Used by cells; append
  `| The first two action-enabled budgets per account are free each month; each additional one costs 0.10 USD per day | https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/ | 2026-10-31 | BudgetDenyAction, BudgetStopInstancesAction |`
  and replace the earlier "Assumption (from issue #71, verify)" row about that price with it.
  In `README.md` `## Constructs` add `- [BudgetDenyAction](docs/constructs/BudgetDenyAction.md): Budget Action that attaches an IAM deny-compute policy at a threshold.`
  Add "`BudgetDenyAction` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
