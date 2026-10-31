# cdk-constructless

[![CI](https://github.com/sastiam/cdk-constructless/actions/workflows/ci.yml/badge.svg)](https://github.com/sastiam/cdk-constructless/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Reusable [AWS CDK](https://docs.aws.amazon.com/cdk/) constructs for cost control and security guardrails on low-budget AWS accounts.

> **Status:** early development. The API is not stable until `1.0.0`.

## Principles

- **Generic and public.** This library contains no account IDs, e-mail addresses or organization-specific values. Anything specific to an account is passed in by the consumer.
- **Secure and cheap by default.** Constructs avoid resources with a fixed monthly cost unless explicitly requested.
- **Tested.** Every construct ships with template assertions (`aws-cdk-lib/assertions`).

## Requirements

- Node.js >= 22
- Bun >= 1.4 (development only)
- `aws-cdk-lib` ^2.275.0 and `constructs` ^10 (peer dependencies)

## Installation

The package is not published to npm yet. Install it from GitHub:

```bash
npm install github:sastiam/cdk-constructless
```

## Constructs

Each construct is documented in [`docs/constructs/`](docs/constructs/), with one page per construct named after its class. No constructs are released yet.

- [CostBudget](docs/constructs/CostBudget.md): monthly USD cost budget with threshold notifications.
- [BudgetActionExecutionRole](docs/constructs/BudgetActionExecutionRole.md): IAM role AWS Budgets assumes to run Budget Actions.
- [BudgetStopInstancesAction](docs/constructs/BudgetStopInstancesAction.md): Budget Action that stops listed EC2 or RDS instances through SSM.
- [BudgetDenyAction](docs/constructs/BudgetDenyAction.md): Budget Action that attaches an IAM deny-compute policy at a threshold.
- [AlertsTopic](docs/constructs/AlertsTopic.md): notification-only SNS topic for Budgets, CloudWatch and Cost Anomaly Detection alerts.
- [BillingAlarm](docs/constructs/BillingAlarm.md): EstimatedCharges alarm in us-east-1 that notifies an SNS topic.

## Development

```bash
bun install
bun run typecheck
bun run test
bun run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and commit conventions.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
