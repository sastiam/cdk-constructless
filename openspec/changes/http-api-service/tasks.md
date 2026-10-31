# Tasks

## 1. HttpApiService

- [ ] 1.1 Create `src/http-api/http-api-service.ts` exporting
  `interface HttpApiThrottle { readonly rateLimit?: number /* @default 10 */; readonly burstLimit?: number /* @default 20 */ }`,
  `interface HttpApiServiceProps { readonly apiName?: string; readonly description?: string; readonly throttle?: HttpApiThrottle; readonly cors?: apigwv2.CorsPreflightOptions; readonly logRetentionDays?: logs.RetentionDays /* @default THREE_DAYS */; readonly logRemovalPolicy?: RemovalPolicy /* @default DESTROY */ }`
  and `class HttpApiService extends Construct` with `public readonly api: apigwv2.HttpApi` (id `'Api'`, `createDefaultStage: false`, `corsPreflight: props.cors`),
  `public readonly stage: apigwv2.HttpStage` (id `'DefaultStage'`, `stageName: '$default'`, `autoDeploy: true`, `throttle: { rateLimit, burstLimit }`,
  `accessLogSettings: { destination: new apigwv2.LogGroupLogDestination(this.accessLogs), format: apigw.AccessLogFormat.jsonWithStandardFields() }`),
  `public readonly accessLogs: logs.LogGroup` (id `'AccessLogs'`) and getter `get url(): string` returning `this.stage.url`.
  Validate `assertRange(this, 'throttle.rateLimit', rate, 1, 10000)` and `assertRange(this, 'throttle.burstLimit', burst, 1, 5000)`.
  Export from `src/index.ts`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/http-api/http-api-service.test.ts` covering each scenario in `specs/http-api/spec.md`: stage `StageName: '$default'`, `AutoDeploy: true`,
  `DefaultRouteSettings: { ThrottlingRateLimit: 10, ThrottlingBurstLimit: 20 }`; `rateLimit: 0` throws the exact message; `burstLimit: 6000` throws
  `throttle.burstLimit must be between 1 and 5000, got 6000`; `AccessLogSettings.DestinationArn` is `{ 'Fn::GetAtt': [<log group id>, 'Arn'] }` and
  `JSON.stringify(Format)` contains `$context.requestId`; log group `RetentionInDays: 3`; CORS `AllowOrigins`; exactly one `AWS::ApiGatewayV2::Stage`.
  Snapshot of the default case. Do not call `expectNoNagErrors` here (an API without routes is not a deployable configuration).
  Commit `feat(http-api)`.
  Verify: `bun run test test/http-api/http-api-service.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Add `### HttpApiService` under `## Constructs` in `README.md` (purpose, throttling rationale, props table, example). Add
  "`HttpApiService` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(http-api)`.
  Verify: `bun run lint` `bun run test`
