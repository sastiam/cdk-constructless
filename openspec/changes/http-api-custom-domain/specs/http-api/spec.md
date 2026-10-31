## ADDED Requirements

### Requirement: Custom domain

An HTTP API SHALL be reachable on a custom domain with DNS records and a certificate, and only through that domain.

#### Scenario: Domain with generated certificate

- **WHEN** `customDomain: { domainName: 'api.example.com', hostedZone }` is given
- **THEN** the template contains an `AWS::CertificateManager::Certificate` for `api.example.com` validated by DNS in that zone, an `AWS::ApiGatewayV2::DomainName` using it, an `AWS::ApiGatewayV2::ApiMapping` to the `$default` stage, Route 53 `A` and `AAAA` alias records for `api.example.com`, and the API has `DisableExecuteApiEndpoint` true

#### Scenario: Domain with existing certificate

- **WHEN** a `certificate` is given
- **THEN** no `AWS::CertificateManager::Certificate` is created and the domain uses the given certificate ARN

#### Scenario: Domain outside the zone

- **WHEN** `domainName` is `api.other.org` and the zone is `example.com`
- **THEN** construction fails with `domainName api.other.org is not in hosted zone example.com`
