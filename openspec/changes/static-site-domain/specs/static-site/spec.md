## ADDED Requirements

### Requirement: Custom domain for the distribution

A static site distribution SHALL be served on custom domain names with a us-east-1 certificate and Route 53 alias records.

#### Scenario: Generated certificate in us-east-1

- **WHEN** the stack is in `us-east-1` and `domain: { domainNames: ['example.com', 'www.example.com'], hostedZone }` is given
- **THEN** one `AWS::CertificateManager::Certificate` for `example.com` with subject alternative name `www.example.com` and DNS validation exists, the distribution `Aliases` are both names with `MinimumProtocolVersion` `TLSv1.2_2021`, and an `A` and an `AAAA` alias record exist for each name

#### Scenario: Other region without certificate

- **WHEN** the stack is in `eu-west-1` and no `certificate` is given
- **THEN** construction fails with `A CloudFront certificate created by StaticSiteDistribution requires region us-east-1, got eu-west-1`

#### Scenario: Other region with certificate

- **WHEN** the stack is in `eu-west-1` and a `certificate` is given
- **THEN** no certificate is created and the distribution uses the given certificate ARN

#### Scenario: Name outside the zone

- **WHEN** a domain name is not in the hosted zone
- **THEN** construction fails with `domainName <name> is not in hosted zone <zone>`
