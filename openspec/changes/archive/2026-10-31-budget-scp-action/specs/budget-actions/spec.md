## ADDED Requirements

### Requirement: Deny SCP on budget threshold

The library SHALL provide a Budget Action that attaches a deny service control policy to target accounts or OUs when a budget threshold is crossed.

#### Scenario: Default SCP action

- **WHEN** a `BudgetScpAction` targets account `123456789012` on a `CostBudget` with threshold 80
- **THEN** an `AWS::Organizations::Policy` with `Type` `SERVICE_CONTROL_POLICY` and no `TargetIds` denies the default compute actions, and an `AWS::Budgets::BudgetsAction` with `ActionType` `APPLY_SCP_POLICY` has `Definition.ScpActionDefinition` `{ PolicyId: <policy id>, TargetIds: ['123456789012'] }` and `DependsOn` the budget

#### Scenario: Invalid target

- **WHEN** a target is neither a 12-digit account ID nor an OU ID (`ou-` prefix) nor a root ID (`r-` prefix)
- **THEN** construction fails with `targetIds entries must be account, OU or root IDs, got "<value>"`

#### Scenario: Policy too large

- **WHEN** the SCP document exceeds 5120 characters
- **THEN** construction fails with `SCP document is <n> characters; the limit is 5120`
