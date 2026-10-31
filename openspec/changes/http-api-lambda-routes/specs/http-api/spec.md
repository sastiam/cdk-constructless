## ADDED Requirements

### Requirement: Lambda routes

An HTTP API SHALL route a method and path to a Lambda function with a Lambda proxy integration (payload v2) and a route-scoped invoke permission.

#### Scenario: GET route

- **WHEN** `addLambdaRoute({ method: HttpMethod.GET, path: '/items/{id}', handler })` is called
- **THEN** an `AWS::ApiGatewayV2::Route` with `RouteKey` `GET /items/{id}` targets an `AWS_PROXY` integration with `PayloadFormatVersion` `2.0`, and an `AWS::Lambda::Permission` allows `apigateway.amazonaws.com` with a `SourceArn` ending in `/*/*/items/{id}`

#### Scenario: Invalid path

- **WHEN** the path does not start with `/` or contains whitespace
- **THEN** construction fails with `path must start with / and contain no whitespace, got <path>`

#### Scenario: Public route warning

- **WHEN** no `authorizer` is given
- **THEN** a warning `cdk-constructless:public-route` naming the route key is emitted

#### Scenario: Authorized route

- **WHEN** an `HttpIamAuthorizer` is given
- **THEN** the route has `AuthorizationType` `AWS_IAM` and no `public-route` warning is emitted
