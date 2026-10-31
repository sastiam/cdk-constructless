# Tasks

## 1. FinOpsGuardrail

- [x] 1.1 Create `src/finops/finops-guardrail.ts` exporting `interface FinOpsGuardrailProps { readonly limitUsd: number; readonly emails: string[]; readonly thresholds?: BudgetThreshold[]; readonly budgetName?: string;
  readonly billingAlarmThresholdUsd?: number; readonly stopInstances?: { readonly target: StopInstancesTarget; readonly instanceIds: string[]; readonly threshold: number };
  readonly denyCompute?: { readonly roles?: iam.IRole[]; readonly users?: iam.IUser[]; readonly groups?: iam.IGroup[]; readonly threshold: number; readonly deniedActions?: string[] } }`
  and `class FinOpsGuardrail extends Construct` with `public readonly alerts: AlertsTopic` (id `'Alerts'`, `emails`), `public readonly budget: CostBudget` (id `'Budget'`, `limitUsd`, `thresholds`, `budgetName`, `topic: alerts.topic`, no `emails`),
  `public readonly billingAlarm?: BillingAlarm` (id `'BillingAlarm'`, only when `billingAlarmThresholdUsd` is set, `topic: alerts.topic`),
  `public readonly stopAction?: BudgetStopInstancesAction` (id `'StopInstances'`) and `public readonly denyAction?: BudgetDenyAction` (id `'DenyCompute'`), both with `budget`, their props,
  and `subscribers: emails.map((email) => ({ email }))`. When both actions exist, create one `BudgetActionExecutionRole` (id `'ActionsRole'`) and pass it to both.
  Class TSDoc: the alerts topic is never wired to an action (the "one topic for everything" failure from the FinOps research). Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [x] 1.2 Create `test/finops/finops-guardrail.test.ts` covering each scenario in `specs/finops-guardrail/spec.md` with `resourceCountIs` and exact subscriber checks
  (no `Address` equal to the topic `Ref` inside any `AWS::Budgets::BudgetsAction`), plus: both actions share one `AWS::IAM::Role` trusted by `budgets.amazonaws.com`. Snapshot of the full case and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/finops-guardrail.test.ts` `bun run lint`

## 2. Documentation

- [x] 2.1 Create `docs/constructs/FinOpsGuardrail.md` from `docs/constructs/_template.md`, filling every mandatory section with a full example (5 USD lab: alarm at 4 USD, stop EC2 at 80 percent, deny compute at 100 percent)
  and a Cost impact table linking the existing `docs/aws-facts.md` rows of its parts (add `FinOpsGuardrail` to their Used by cells; add no new rows).
  In `README.md` `## Constructs` add `- [FinOpsGuardrail](docs/constructs/FinOpsGuardrail.md): budget, alerts topic, billing alarm and optional Budget Actions in one construct.`
  Add "`FinOpsGuardrail` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
