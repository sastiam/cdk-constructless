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

- [ ] 2.1 Create `docs/constructs/BudgetActionExecutionRole.md` from `docs/constructs/_template.md`, filling every mandatory section from the TSDoc, the specs of this change and the tests. Resources: one `AWS::IAM::Role` and one `AWS::IAM::Policy`. Props and defaults: include a table of permissions per `StopInstancesTarget`. Limits and risks: the `AwsSolutions-IAM5` suppression and its reason; Start* actions are deliberately not granted; future SCP permissions (#71) extend this role. Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| Budget Actions execution role trust policy: budgets.amazonaws.com with aws:SourceAccount and aws:SourceArn arn:aws:budgets::<account>:budget/* | https://docs.aws.amazon.com/cost-management/latest/userguide/billing-example-policies.html | 2026-10-30 | BudgetActionExecutionRole |`; `| AWSBudgetsActions_RolePolicyForResourceAdministrationWithSSM grants EC2/RDS stop via ssm.amazonaws.com and ssm:StartAutomationExecution on AWS-Stop* documents (updated 2026-04-07) | https://docs.aws.amazon.com/cost-management/latest/userguide/billing-permissions-ref.html | 2026-10-30 | BudgetActionExecutionRole |`. In `README.md` `## Constructs` add the line `- [BudgetActionExecutionRole](docs/constructs/BudgetActionExecutionRole.md): IAM role AWS Budgets assumes to run Budget Actions.`
  Add "`BudgetActionExecutionRole` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(finops)`.
  Verify: `bun run test` `bun run lint`
