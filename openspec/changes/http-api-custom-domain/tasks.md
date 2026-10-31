# Tasks

## 1. Custom domain

- [ ] 1.1 In `src/http-api/http-api-service.ts` export `interface HttpApiCustomDomain { readonly domainName: string; readonly hostedZone: route53.IHostedZone; readonly certificate?: acm.ICertificate }`,
  add `readonly customDomain?: HttpApiCustomDomain` to `HttpApiServiceProps`, and public readonly optional members `domainName?: apigwv2.DomainName` and `certificate?: acm.ICertificate`.
  Add to `src/core/validation.ts` `assertDomainInZone(scope, domainName: string, zoneName: string)`: when neither value is an unresolved token and not
  (`domainName === zoneName` or `domainName.endsWith('.' + zoneName)`) throw "domainName ${domainName} is not in hosted zone ${zoneName}",
  with a passing and a failing case added to `test/core/validation.test.ts`.
  When `customDomain` is set: call `assertDomainInZone(this, domainName, hostedZone.zoneName)`; pass `disableExecuteApiEndpoint: true` to the `HttpApi`;
  certificate = `props.certificate ?? new acm.Certificate(this, 'Certificate', { domainName, validation: acm.CertificateValidation.fromDns(hostedZone) })`;
  `new apigwv2.DomainName(this, 'DomainName', { domainName, certificate })`; `new apigwv2.ApiMapping(this, 'ApiMapping', { api: this.api, domainName: this.domainName, stage: this.stage })`;
  `new route53.ARecord(this, 'AliasA', { zone, recordName: domainName, target: route53.RecordTarget.fromAlias(new targets.ApiGatewayv2DomainProperties(dn.regionalDomainName, dn.regionalHostedZoneId)) })`
  and the same with `route53.AaaaRecord` id `'AliasAAAA'`. `get url()` returns "https://${domainName}/" when a custom domain is set.
  Verify: `bun run typecheck` `bun run test test/core` `bun run lint`
- [ ] 1.2 Create `test/http-api/http-api-custom-domain.test.ts` using `route53.HostedZone.fromHostedZoneAttributes(stack, 'Zone', { hostedZoneId: 'Z0123456789ABCDEFGHIJ', zoneName: 'example.com' })`,
  covering each scenario in this change's `specs/http-api/spec.md` with exact `DomainName`, `ValidationMethod: 'DNS'`, `HostedZoneId` in `DomainValidationOptions`,
  `ApiMapping` `Stage` referencing the `$default` stage, `AWS::Route53::RecordSet` count 2 with `Type` `A` and `AAAA`, `DisableExecuteApiEndpoint: true`;
  `acm.Certificate.fromCertificateArn(stack, 'Cert', 'arn:aws:acm:us-east-1:123456789012:certificate/abc')` → zero certificates and that ARN on the domain;
  `api.other.org` throws; `url` equals `https://api.example.com/`. Snapshot of the generated-certificate case.
  Commit `feat(http-api)`.
  Verify: `bun run test test/http-api` `bun run lint`

## 2. Documentation

- [ ] 2.1 Update `docs/constructs/HttpApiService.md`: add certificate, domain name, API mapping and records to Resources created, `HttpApiCustomDomain` to Props and defaults, a custom-domain example, and to Limits and risks that the default `execute-api` endpoint is disabled. Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| Route 53 hosted zones cost 0.50 USD per month for the first 25 zones | https://aws.amazon.com/route53/pricing/ | 2026-10-30 | HttpApiService |`.
  Add "`HttpApiService` custom domains." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(http-api)`.
  Verify: `bun run test` `bun run lint`
