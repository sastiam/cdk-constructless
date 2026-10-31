## ADDED Requirements

### Requirement: Throttled default stage

The library SHALL create HTTP APIs whose default stage is always throttled.

#### Scenario: Default throttling

- **WHEN** an `HttpApiService` is created without throttle props
- **THEN** one `AWS::ApiGatewayV2::Stage` named `$default` with `AutoDeploy` true has `DefaultRouteSettings` `ThrottlingRateLimit` 10 and `ThrottlingBurstLimit` 20

#### Scenario: Invalid throttle

- **WHEN** `throttle: { rateLimit: 0 }` is given
- **THEN** construction fails with `throttle.rateLimit must be between 1 and 10000, got 0`

### Requirement: Access logs

Each HTTP API stage SHALL write JSON access logs to a dedicated log group with finite retention.

#### Scenario: Default access logs

- **WHEN** an `HttpApiService` is created
- **THEN** the stage `AccessLogSettings.DestinationArn` is the ARN of an `AWS::Logs::LogGroup` with `RetentionInDays` 3, and `Format` is a JSON object that includes `$context.requestId`

### Requirement: CORS

The API SHALL accept an optional CORS preflight configuration.

#### Scenario: CORS configured

- **WHEN** `cors: { allowOrigins: ['https://example.com'] }` is given
- **THEN** the `AWS::ApiGatewayV2::Api` has `CorsConfiguration.AllowOrigins` `['https://example.com']`
