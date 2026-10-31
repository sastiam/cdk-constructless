# Tasks

## 1. Default alarms

- [ ] 1.1 In `src/lambda/cost-aware-function.ts` export `interface DefaultAlarmsOptions { readonly topic?: sns.ITopic; readonly errorsThreshold?: number /* @default 1 */; readonly throttlesThreshold?: number /* @default 1 */ }`
  and `interface DefaultAlarms { readonly errors: cloudwatch.Alarm; readonly throttles: cloudwatch.Alarm }`; add method
  `addDefaultAlarms(options: DefaultAlarmsOptions = {}): DefaultAlarms` creating `new cloudwatch.Alarm(this, 'ErrorsAlarm', ...)` from
  `this.metricErrors({ period: Duration.minutes(5), statistic: 'Sum' })` and `'ThrottlesAlarm'` from `this.metricThrottles(...)` with
  `evaluationPeriods: 1`, `comparisonOperator: GREATER_THAN_OR_EQUAL_TO_THRESHOLD`, `treatMissingData: NOT_BREACHING`, thresholds from options
  (`assertPositive` each). With `topic`, `alarm.addAlarmAction(new cw_actions.SnsAction(topic))` on both. A second call throws
  `ConstructValidationError` `addDefaultAlarms can only be called once` (detect with `this.node.tryFindChild('ErrorsAlarm')`). Export the interfaces from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/lambda/function-alarms.test.ts` covering each scenario in this change's `specs/lambda-function/spec.md` with exact
  `MetricName`, `Namespace`, `Statistic`, `Period`, `EvaluationPeriods`, `Threshold`, `ComparisonOperator`, `TreatMissingData` and
  `Dimensions: [{ Name: 'FunctionName', Value: { Ref: <function logical id> } }]`; `AlarmActions` absent without topic and `[{ Ref: <topic logical id> }]` with topic;
  second call throws; `errorsThreshold: 0` throws `errorsThreshold must be greater than 0, got 0`. `expectNoNagErrors(stack)`.
  Commit `feat(lambda)`.
  Verify: `bun run test test/lambda` `bun run lint`

## 2. Documentation

- [ ] 2.1 Update `docs/constructs/CostAwareFunction.md`: add the two alarms to Resources created, the `DefaultAlarmsOptions` table to Props and defaults, and an alarms example. Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| Assumption (verify on the pricing page): the CloudWatch free tier includes 10 standard alarms per month | https://aws.amazon.com/cloudwatch/pricing/ | 2026-10-30 | CostAwareFunction |`.
  Add "`CostAwareFunction.addDefaultAlarms()`." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(lambda)`.
  Verify: `bun run test` `bun run lint`
