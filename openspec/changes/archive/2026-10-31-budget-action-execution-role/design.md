# Design

## Context

Source: AWS Cost Management user guide, "Example policies" and the managed policy
`AWSBudgetsActions_RolePolicyForResourceAdministrationWithSSM` (updated 2026-04-07 to require automation-execution and document permissions).

## Decisions

- **Trust policy** (verbatim from AWS example): principal `budgets.amazonaws.com`, `StringEquals aws:SourceAccount = <account>`,
  `ArnLike aws:SourceArn = arn:<partition>:budgets::<account>:budget/*`.
- **Stop-only permissions.** The managed policy also grants Start*; this library only stops, so Start* is omitted.
  - EC2: `ec2:DescribeInstanceStatus`, `ec2:StopInstances` on `*` with `ForAnyValue:StringEquals aws:CalledVia = ssm.amazonaws.com`;
    `ssm:StartAutomationExecution` on `document/AWS-StopEC2Instance`, `automation-execution/*`, `automation-definition/AWS-StopEC2Instance:*`.
  - RDS: same with `rds:DescribeDBInstances`, `rds:StopDBInstance` and `AWS-StopRdsInstance`.
- **Inline policy over managed policy.** It avoids granting Start* and keeps cdk-nag `AwsSolutions-IAM4` quiet;
  the remaining `AwsSolutions-IAM5` wildcard finding is suppressed with a reason (EC2/RDS stop actions cannot be scoped to instance ARNs through SSM automation without per-instance policies).
- `allowStopInstances` is idempotent per target (calling twice adds statements once).

## Risks / Trade-offs

- [AWS changes the required SSM permissions again] → the design cites the managed policy; a future change can switch to the managed policy if drift appears.
