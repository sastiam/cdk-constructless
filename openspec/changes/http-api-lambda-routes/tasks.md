# Tasks

## 1. Lambda routes

- [ ] 1.1 In `src/http-api/http-api-service.ts` export `interface LambdaRouteOptions { readonly method: apigwv2.HttpMethod; readonly path: string; readonly handler: lambda.IFunction; readonly authorizer?: apigwv2.IHttpRouteAuthorizer }`
  and add `addLambdaRoute(options: LambdaRouteOptions): apigwv2.HttpRoute[]`: validate `path` with `/^\/\S*$/` (throw `ConstructValidationError`
  "path must start with / and contain no whitespace, got ${path}"), then `this.api.addRoutes({ path, methods: [method], integration: new HttpLambdaIntegration(`${method}${path}Integration`.replace(/[^A-Za-z0-9]/g, ''), handler), authorizer })`.
  Without `authorizer` add `Annotations.of(this).addWarningV2('cdk-constructless:public-route', `Route ${method} ${path} has no authorizer and is public`)`.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/http-api/http-api-lambda-routes.test.ts` with a `CostAwareFunction` (entry `test/fixtures/handler.ts`) covering each scenario in this change's
  `specs/http-api/spec.md`: exact `RouteKey`, integration `IntegrationType: 'AWS_PROXY'`, `PayloadFormatVersion: '2.0'`, permission `Principal: 'apigateway.amazonaws.com'`
  and `SourceArn` (use `Match.objectLike` on the `Fn::Join` and assert the last literal segment ends with `/*/*/items/{id}`); paths `items` and `/a b` throw;
  public route warning present (that test uses `synth(..., { nag: false })` because `AwsSolutions-APIG4` flags the unauthorized route on purpose); with `new HttpIamAuthorizer()` (from `aws-cdk-lib/aws-apigatewayv2-authorizers`) `AuthorizationType: 'AWS_IAM'`, no warning,
  snapshot, and `expectNoNagErrors(stack)`.
  Commit `feat(http-api)`.
  Verify: `bun run test test/http-api` `bun run lint`

## 2. Documentation

- [ ] 2.1 Update `docs/constructs/HttpApiService.md`: add routes (route, integration, permission) to Resources created, `LambdaRouteOptions` to Props and defaults, a routes example with `CostAwareFunction` and `HttpIamAuthorizer`, and the public-route warning to Limits and risks. Link the existing `docs/aws-facts.md` rows this construct relies on, and add none.
  Add "`HttpApiService.addLambdaRoute()`." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(http-api)`.
  Verify: `bun run test` `bun run lint`
