# Verified AWS facts

Every AWS fact that a construct relies on (pricing, quotas, limits and service behavior) is recorded once in this table, with its source and the date the source was last read. Facts are re-verified on each release. The read date is the day the source was last read, not the day the fact was first recorded. Construct pages cite these rows instead of repeating the facts.

| Fact | Source | Read date | Used by |
| --- | --- | --- | --- |
| Budgets data refreshes up to three times a day, 8 to 12 hours apart | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html | 2026-10-30 | CostBudget |
| BudgetData CostFilters supports a LinkedAccount filter | https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-budgets-budget-budgetdata.html | 2026-10-31 | CostBudget |
| Assumption (verify before 1.0): a budget supports at most 5 notifications and 10 e-mail subscribers per notification | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | CostBudget |
| Budget Actions execution role trust policy: budgets.amazonaws.com with aws:SourceAccount and aws:SourceArn arn:aws:budgets::<account>:budget/* | https://docs.aws.amazon.com/cost-management/latest/userguide/billing-example-policies.html | 2026-10-30 | BudgetActionExecutionRole |
| AWSBudgetsActions_RolePolicyForResourceAdministrationWithSSM grants EC2/RDS stop via ssm.amazonaws.com and ssm:StartAutomationExecution on AWS-Stop* documents (updated 2026-04-07) | https://docs.aws.amazon.com/cost-management/latest/userguide/billing-permissions-ref.html | 2026-10-30 | BudgetActionExecutionRole |
| BudgetsAction requires ActionThreshold, ActionType, BudgetName, Definition, ExecutionRoleArn, NotificationType and Subscribers; SSM definitions take 1 to 100 instance IDs | https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-budgets-budgetsaction.html | 2026-10-30 | BudgetStopInstancesAction |
| A reverted Budget Action is not evaluated again in the same period unless it is reset | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | BudgetStopInstancesAction |
| Assumption (from issue #71, verify): the first two action-enabled budgets per account are free, then 0.10 USD per budget-day | https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html | 2026-10-30 | BudgetStopInstancesAction |
| Unconfirmed: whether Budget Actions are available on the AWS Free Plan | https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html | 2026-10-30 | BudgetStopInstancesAction |
