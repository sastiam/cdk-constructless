# Tasks

## 1. BudgetScpAction

- [x] 1.1 In `src/finops/budget-action-execution-role.ts` add `allowApplyScpPolicy(): void` (idempotent) adding a statement with actions `organizations:AttachPolicy`, `organizations:DetachPolicy`,
  `organizations:DescribePolicy`, resources `['*']` and acknowledge every new `AwsSolutions-IAM5[...]` finding id for the role policy with `suppressNag` (reason: SCP attach targets are only known at action time).
  Create `src/finops/budget-scp-action.ts` exporting `interface BudgetScpActionProps { readonly budget: CostBudget; readonly targetIds: string[]; readonly threshold?: number /* @default 80 */; readonly thresholdType?: BudgetActionThresholdType;
  readonly notificationType?: BudgetNotificationType; readonly approvalModel?: BudgetActionApprovalModel; readonly deniedActions?: string[] /* @default DEFAULT_DENIED_COMPUTE_ACTIONS */; readonly policyName?: string; readonly subscribers: BudgetActionSubscriber[]; readonly executionRole?: BudgetActionExecutionRole }`
  and `class BudgetScpAction extends Construct` with `public readonly policy: organizations.CfnPolicy` (id `'Policy'`, `type: 'SERVICE_CONTROL_POLICY'`, `name: policyName ?? Names.uniqueResourceName(this, { maxLength: 128 })`,
  `content: { Version: '2012-10-17', Statement: [{ Sid: 'BudgetDenyCompute', Effect: 'Deny', Action: deniedActions, Resource: '*' }] }`, no `targetIds`, `applyRemovalPolicy(RemovalPolicy.RETAIN)`),
  `public readonly action: budgets.CfnBudgetsAction` (id `'Action'`), `public readonly executionRole`.
  Validation: `assertItemCount(this, 'targetIds', targetIds, 1, 100)`; each resolved ID must match `/^(\d{12}|ou-[0-9a-z]{4,32}-[a-z0-9]{8,32}|r-[0-9a-z]{4,32})$/` else throw with message:
  targetIds entries must be account, OU or root IDs, got "<value>"; denied actions validated with the same rule and message as `BudgetDenyAction` (extract `assertIamActions` into `src/core/validation.ts` and use it in both);
  `JSON.stringify(content).length` > 5120 → throw with message: SCP document is <n> characters; the limit is 5120. `validateActionThreshold`, `toActionSubscribers`.
  Action: `actionType 'APPLY_SCP_POLICY'`, `definition { scpActionDefinition { policyId: policy.attrId, targetIds } }`, defaults `PERCENTAGE` 80, `ACTUAL`, `AUTOMATIC`; `executionRole.allowApplyScpPolicy()`; `action.addDependency(budget.budget)`.
  Class TSDoc: management account only; SCPs do not affect the management account or service-linked roles; the policy is retained on stack deletion so an attached SCP is never deleted mid-incident. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run test test/core` `bun run lint`
- [x] 1.2 Create `test/finops/budget-scp-action.test.ts` covering each scenario in this change's `specs/budget-actions/spec.md`: policy `Type`, absent `TargetIds`, `Content.Statement[0]` exact,
  `DeletionPolicy: 'Retain'`; action `ScpActionDefinition` with `PolicyId: { 'Fn::GetAtt': [<policy id>, 'Id'] }`; OU `ou-ab12-cdef3456` and root `r-ab12` accepted; `abc` throws; 400 long
  denied actions (`'ec2:' + 'A'.repeat(20)` indexed) trigger the size error; execution role contains the three organizations actions. Snapshot and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops` `bun run lint`

## 2. Documentation

- [x] 2.1 Create `docs/constructs/BudgetScpAction.md` from `docs/constructs/_template.md`, filling every mandatory section (management account only; reverting and "Reset" behavior; existing resources keep billing;
  SCPs do not affect the management account or service-linked roles). Update `docs/constructs/BudgetActionExecutionRole.md` with the organizations permissions.
  Link the Budget Actions rows in `docs/aws-facts.md` and add `BudgetScpAction` to their Used by cells; append
  `| Only a management account can apply SCPs through Budget Actions | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | BudgetScpAction |` and
  `| Assumption (verify on the Organizations quotas page): the maximum SCP document size is 5,120 characters | https://docs.aws.amazon.com/organizations/latest/userguide/orgs_reference_limits.html | 2026-10-31 | BudgetScpAction |`.
  In `README.md` `## Constructs` add `- [BudgetScpAction](docs/constructs/BudgetScpAction.md): Budget Action that attaches a deny SCP to member accounts from the management account.`
  Add "`BudgetScpAction` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
