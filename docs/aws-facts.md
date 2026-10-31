# Verified AWS facts

Every AWS fact that a construct relies on (pricing, quotas, limits and service behavior) is recorded once in this table, with its source and the date the source was last read. Facts are re-verified on each release. The read date is the day the source was last read, not the day the fact was first recorded. Construct pages cite these rows instead of repeating the facts.

| Fact | Source | Read date | Used by |
| --- | --- | --- | --- |
| Budgets data refreshes up to three times a day, 8 to 12 hours apart | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html | 2026-10-30 | CostBudget |
| BudgetData CostFilters supports a LinkedAccount filter | https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-budgets-budget-budgetdata.html | 2026-10-31 | CostBudget |
| Assumption (verify before 1.0): a budget supports at most 5 notifications and 10 e-mail subscribers per notification | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | CostBudget |
