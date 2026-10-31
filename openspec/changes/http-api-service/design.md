# Design

## Decisions

- **Own `$default` stage** (`createDefaultStage: false` + `HttpStage` with `stageName: '$default'`, `autoDeploy: true`):
  the default stage created by `HttpApi` does not accept throttle or access-log settings.
- **Throttling is always on.** `throttle.rateLimit` default 10 rps and `burstLimit` 20 fit a lab; both validated 1-10000.
- **Access logs** use `LogGroupLogDestination` with `AccessLogFormat.jsonWithStandardFields()`. HTTP APIs do not need the account-level CloudWatch role that REST APIs need.
- **No route authorization decided here.** Authorization belongs to routes (`http-api-lambda-routes`); cdk-nag `AwsSolutions-APIG4` is not suppressed by the library.
