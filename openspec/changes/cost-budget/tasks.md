# Tasks

## 1. CostBudget construct

- [ ] 1.1 Create `src/finops/cost-budget.ts` exporting:
  `enum BudgetNotificationType { ACTUAL = 'ACTUAL', FORECASTED = 'FORECASTED' }`;
  `interface BudgetThreshold { readonly percent: number; readonly type?: BudgetNotificationType /* @default ACTUAL */ }`;
  `interface CostBudgetProps { readonly limitUsd: number; readonly budgetName?: string; readonly thresholds?: BudgetThreshold[]; readonly emails?: string[]; readonly topic?: sns.ITopic; readonly linkedAccountIds?: string[] }`;
  `const DEFAULT_BUDGET_THRESHOLDS: readonly BudgetThreshold[]` = ACTUAL 60, ACTUAL 80, ACTUAL 100, FORECASTED 100;
  `class CostBudget extends Construct` with `public readonly budget: budgets.CfnBudget` (construct id `'Budget'`) and `public readonly budgetName: string`.
  Behaviour: `assertPositive(this, 'limitUsd', limitUsd)`; when `thresholds` is given `assertItemCount(this, 'thresholds', thresholds, 1, 5)` and
  `assertRange(this, 'thresholds[i].percent', percent, 0.01, 1000)` for each; `assertItemCount(this, 'emails', emails, 0, 10)`.
  `budgetName` = `props.budgetName ?? Names.uniqueResourceName(this, { maxLength: 100 })`, passed as `budget.budgetName`.
  `budget`: `budgetType 'COST'`, `timeUnit 'MONTHLY'`, `budgetLimit { amount: limitUsd, unit: 'USD' }`.
  When `linkedAccountIds` is given: `assertItemCount(this, 'linkedAccountIds', ids, 1, 100)`; each resolved ID must match `/^\d{12}$/`, else throw
  `ConstructValidationError` with message: linkedAccountIds must be 12-digit account IDs, got "<id>" (the offending ID in double quotes);
  set `costFilters: { LinkedAccount: ids }` on the budget (CloudFormation BudgetData `CostFilters` documents the `LinkedAccount` filter; `FilterExpression` has no description
  in the reference read on 2026-10-31, so it is not used). TSDoc of `linkedAccountIds`: use it from the management account to budget one member account.
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
  topic → each notification contains `{ SubscriptionType: 'SNS', Address: { Ref: <topic logical id> } }`; custom `budgetName: 'lab'` → `BudgetName: 'lab'`;
  no `CostFilters` by default; `linkedAccountIds: ['123456789012']` → `CostFilters: { LinkedAccount: ['123456789012'] }`; `['12345']` throws
  `linkedAccountIds must be 12-digit account IDs, got "12345"`; an empty array throws `linkedAccountIds must contain between 1 and 100 items, got 0`.
  Add `expect(normalizedTemplate(stack)).toMatchSnapshot()` and `expectNoNagErrors(stack)` for the default case.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/cost-budget.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/CostBudget.md` from `docs/constructs/_template.md`, filling every mandatory section from the TSDoc, the specs of this change and the tests. Purpose states budgets are alerts, not a hard cap. Example: the default 5 USD budget with one e-mail, plus a first-charge alert as a second `CostBudget` with `limitUsd: 0.01` and `thresholds: [{ percent: 100 }]`, plus a member-account budget with `linkedAccountIds`. Limits and risks: 8 to 12 h refresh lag; at most 5 notifications and 10 e-mails (library validation, see the facts table). Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| Budgets data refreshes up to three times a day, 8 to 12 hours apart | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html | 2026-10-30 | CostBudget |`; `| BudgetData CostFilters supports a LinkedAccount filter | https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-budgets-budget-budgetdata.html | 2026-10-31 | CostBudget |`; `| Assumption (verify before 1.0): a budget supports at most 5 notifications and 10 e-mail subscribers per notification | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | CostBudget |`. In `README.md` `## Constructs` add the line `- [CostBudget](docs/constructs/CostBudget.md): monthly USD cost budget with threshold notifications.`
  Add "`CostBudget` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
