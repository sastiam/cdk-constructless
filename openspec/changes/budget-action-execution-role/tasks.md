# Tasks

## 1. Execution role

- [ ] 1.1 Create `src/finops/budget-action-execution-role.ts` exporting `enum StopInstancesTarget { EC2 = 'EC2', RDS = 'RDS' }`,
  `interface BudgetActionExecutionRoleProps { readonly roleName?: string }` and `class BudgetActionExecutionRole extends Construct`
  with `public readonly role: iam.Role` (construct id `'Role'`) and method `allowStopInstances(target: StopInstancesTarget): void`.
  Trust: `new iam.ServicePrincipal('budgets.amazonaws.com').withConditions({ StringEquals: { 'aws:SourceAccount': stack.account },
  ArnLike: { 'aws:SourceArn': `arn:${stack.partition}:budgets::${stack.account}:budget/*` } })`.
  `allowStopInstances` adds (once per target, tracked in a private `Set`) to `this.role` via `addToPolicy`:
  statement A actions EC2 `['ec2:DescribeInstanceStatus', 'ec2:StopInstances']` / RDS `['rds:DescribeDBInstances', 'rds:StopDBInstance']`,
  resources `['*']`, conditions `{ 'ForAnyValue:StringEquals': { 'aws:CalledVia': ['ssm.amazonaws.com'] } }`;
  statement B action `ssm:StartAutomationExecution` on `arn:${partition}:ssm:*:*:document/<DOC>`,
  `arn:${partition}:ssm:*:*:automation-execution/*`, `arn:${partition}:ssm:*:*:automation-definition/<DOC>:*`,
  with `<DOC>` = `AWS-StopEC2Instance` for EC2 and `AWS-StopRdsInstance` for RDS.
  After the first call, `suppressNag(this.role.node.findChild('DefaultPolicy'), [{ id: 'AwsSolutions-IAM5', reason: 'Budget Actions stop instances through SSM automation documents; AWS documents these wildcard resources' }])`
  (`suppressNag` resolves the policy's `defaultChild`). Document the suppression in the class TSDoc. Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/finops/budget-action-execution-role.test.ts` covering every scenario in `specs/budget-actions/spec.md`:
  assert `AssumeRolePolicyDocument` equals the exact trust statement (account `123456789012`, partition `aws` via `{ Ref: 'AWS::Partition' }`
  matched with `Match.anyValue()` only for the partition token); EC2 call → policy has the two exact statements; RDS call → RDS statements;
  calling `allowStopInstances(EC2)` twice yields one EC2 statement pair; `JSON.stringify(template)` contains neither `ec2:StartInstances` nor `rds:StartDBInstance`.
  Add a snapshot of the EC2+RDS case and `expectNoNagErrors(stack)`.
  Commit `feat(finops)`.
  Verify: `bun run test test/finops/budget-action-execution-role.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Add `### BudgetActionExecutionRole` under `## Constructs` in `README.md`: purpose, trust conditions, the permissions table per target,
  the cdk-nag suppression and its reason, and an example. Add "`BudgetActionExecutionRole` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run lint` `bun run test`
