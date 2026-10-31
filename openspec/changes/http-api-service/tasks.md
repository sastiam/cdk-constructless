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
  Snapshot of the default case. Use `synth(..., { nag: false })` in this file: an API without routes is not a deployable configuration.
  Commit `feat(http-api)`.
  Verify: `bun run test test/http-api/http-api-service.test.ts` `bun run lint`

## 2. Documentation

- [ ] 2.1 Create `docs/constructs/HttpApiService.md` from `docs/constructs/_template.md`, filling every mandatory section from the TSDoc, the specs of this change and the tests. Purpose explains throttling as protection against abuse-driven spend. Resources: `AWS::ApiGatewayV2::Api`, `AWS::ApiGatewayV2::Stage`, `AWS::Logs::LogGroup`. Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| HTTP APIs cost 1 USD per million requests (REST APIs 3.50 USD) | https://aws.amazon.com/api-gateway/pricing/ | 2026-10-30 | HttpApiService |`. In `README.md` `## Constructs` add the line `- [HttpApiService](docs/constructs/HttpApiService.md): HTTP API (API Gateway v2) with a throttled default stage and access logs.`
  Add "`HttpApiService` construct." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(http-api)`.
  Verify: `bun run test` `bun run lint`
