# Tasks

## 1. Distribution domain

- [ ] 1.1 In `src/static-site/static-site-distribution.ts` export `interface StaticSiteDomain { readonly domainNames: string[]; readonly hostedZone: route53.IHostedZone; readonly certificate?: acm.ICertificate }`,
  add `readonly domain?: StaticSiteDomain` to the props and `public readonly certificate?: acm.ICertificate`. When `domain` is set:
  `assertItemCount(this, 'domain.domainNames', domainNames, 1, 100)`; `assertDomainInZone(this, name, hostedZone.zoneName)` for each name (helper from `src/core/validation.ts`);
  without `certificate` call `assertRegion(this, 'us-east-1', 'A CloudFront certificate created by StaticSiteDistribution')` and create
  `new acm.Certificate(this, 'Certificate', { domainName: domainNames[0], subjectAlternativeNames: domainNames.slice(1), validation: acm.CertificateValidation.fromDns(hostedZone) })`;
  pass `domainNames`, `certificate` and `minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021` to the distribution;
  for each name `i` create `route53.ARecord` id "AliasA${i}" and `route53.AaaaRecord` id "AliasAAAA${i}" with
  `target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution))` and `recordName: name`.
  Apply the `AwsSolutions-CFR4` suppression only when `domain` is not set. `get url()` returns "https://${domainNames[0]}" when a domain is set.
  Verify: `bun run typecheck` `bun run lint`
- [ ] 1.2 Create `test/static-site/static-site-domain.test.ts` with zone `route53.HostedZone.fromHostedZoneAttributes(stack, 'Zone', { hostedZoneId: 'Z0123456789ABCDEFGHIJ', zoneName: 'example.com' })`
  covering each scenario in this change's `specs/static-site/spec.md`: certificate `DomainName`, `SubjectAlternativeNames: ['www.example.com']`, `ValidationMethod: 'DNS'`;
  `Aliases`, `ViewerCertificate.MinimumProtocolVersion: 'TLSv1.2_2021'`; four `AWS::Route53::RecordSet` (A and AAAA per name);
  `synth(..., { region: 'eu-west-1' })` without certificate throws the exact message; with `acm.Certificate.fromCertificateArn(stack, 'Cert', 'arn:aws:acm:us-east-1:123456789012:certificate/abc')`
  zero certificates and `AcmCertificateArn` equal to that ARN; `api.other.org` throws. Snapshot of the us-east-1 case and `expectNoNagErrors(stack)`.
  Commit `feat(static-site)`.
  Verify: `bun run test test/static-site` `bun run lint`

## 2. Documentation

- [ ] 2.1 Update `docs/constructs/StaticSiteDistribution.md`: add the certificate and alias records to Resources created, `StaticSiteDomain` to Props and defaults, a custom-domain example, and to Limits and risks the us-east-1 certificate rule and passing a certificate from another stack with `crossRegionReferences: true`. Append these rows to `docs/aws-facts.md` (when a row with the same fact already exists, only add the construct to its Used by cell) and link them from the page's Verified AWS facts or Cost impact section: `| Route 53 hosted zones cost 0.50 USD per month for the first 25 zones | https://aws.amazon.com/route53/pricing/ | 2026-10-30 | StaticSiteDistribution |`.
  Add "`StaticSiteDistribution` custom domains." to `CHANGELOG.md` `[Unreleased]` → `### Added`.
  Commit `docs(static-site)`.
  Verify: `bun run test` `bun run lint`
