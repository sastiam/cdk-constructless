# Tasks

## 1. CostBudget construct

- [ ] 1.1 Create `src/finops/cost-budget.ts` exporting:
  `enum BudgetNotificationType { ACTUAL = 'ACTUAL', FORECASTED = 'FORECASTED' }`;
  `interface BudgetThreshold { readonly percent: number; readonly type?: BudgetNotificationType /* @default ACTUAL */ }`;
  `interface CostBudgetProps { readonly limitUsd: number; readonly budgetName?: string; readonly thresholds?: BudgetThreshold[]; readonly emails?: string[]; readonly topic?: sns.ITopic }`;
  `const DEFAULT_BUDGET_THRESHOLDS: readonly BudgetThreshold[]` = ACTUAL 60, ACTUAL 80, ACTUAL 100, FORECASTED 100;
  `class CostBudget extends Construct` with `public readonly budget: budgets.CfnBudget` (construct id `'Budget'`) and `public readonly budgetName: string`.
  Behaviour: `assertPositive(this, 'limitUsd', limitUsd)`; when `thresholds` is given `assertItemCount(this, 'thresholds', thresholds, 1, 5)` and
  `assertRange(this, 'thresholds[i].percent', percent, 0.01, 1000)` for each; `assertItemCount(this, 'emails', emails, 0, 10)`.
  `budgetName` = `props.budgetName ?? Names.uniqueResourceName(this, { maxLength: 100 })`, passed as `budget.budgetName`.
  `budget`: `budgetType 'COST'`, `timeUnit 'MONTHLY'`, `budgetLimit { amount: limitUsd, unit: 'USD' }`.
  Subscribers per notification: each e-mail as `{ subscriptionType: 'EMAIL', address }` then the topic as `{ subscriptionType: 'SNS', address: topic.topicArn }`.
  If there are no subscribers: no `notificationsWithSubscribers` and
  `Annotations.of(this).addWarningV2('cdk-constructless:budget-without-subscribers', 'CostBudget has no emails or topic; no notification will be sent')`.
  Otherwise one entry per threshold with `comparisonOperator 'GREATER_THAN'`, `thresholdType 'PERCENTAGE'`, `threshold percent`, `notificationType`.
  Class TSDoc: Budgets refreshes up to three times a day (8 to 12 h apart), so this is not a hard cap; use Budget Actions to act on spend.
  Export everything from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/finops/cost-budget.test.ts` covering every scenario in `specs/cost-budget/spec.md` with exact values:
  limit 5 → one `AWS::Budgets::Budget` with `BudgetType`, `TimeUnit`, `BudgetLimit` as specified; limit 0 → `toThrow('limitUsd must be greater than 0, got 0')`;
  defaults with one e-mail → `NotificationsWithSubscribers` has 4 entries matching ACTUAL 60/80/100 and FORECASTED 100;
  no subscribers → no `NotificationsWithSubscribers` key and one warning containing `budget-without-subscribers`;
  6 thresholds → `toThrow('thresholds must contain between 1 and 5 items, got 6')`; 11 e-mails → `toThrow('emails must contain between 0 and 10 items, got 11')`;
  topic → each notification contains `{ SubscriptionType: 'SNS', Address: { Ref: <topic logical id> } }`; custom `budgetName: 'lab'` → `BudgetName: 'lab'`.
  Add `expect(normalizedTemplate(stack)).toMatchSnapshot()` and `expectNoNagErrors(stack)` for the default case.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/cost-budget.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Add a `## Constructs` section to `README.md` (if missing) with a `### CostBudget` subsection: one-paragraph purpose, the refresh-delay warning,
  a TypeScript example `new CostBudget(this, 'Budget', { limitUsd: 5, emails: ['alerts@example.com'] })`, and a props table (name, type, default, description).
  Add under `[Unreleased]` → `### Added` in `CHANGELOG.md`: "`CostBudget` construct."
  Commit `docs(finops)`.
  Verify: `bun run lint` `bun run test`
