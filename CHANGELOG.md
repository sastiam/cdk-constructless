# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Initial repository scaffolding.
- `CostBudget` construct.
- `BudgetActionExecutionRole` construct.
- `BudgetStopInstancesAction` construct.
- `AlertsTopic` construct.
- `BillingAlarm` construct.
- `BudgetDenyAction` construct.
- `FinOpsGuardrail` construct.
- `LabCostAspects`, `LogRetentionAspect`, `S3LifecycleAspect`, `FixedCostWarningAspect`.
- `CostAnomalyGuard` construct.

### Changed

- Switched to Bun; Node.js >= 22 required.
