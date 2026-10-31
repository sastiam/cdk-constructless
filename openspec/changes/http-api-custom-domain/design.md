# Design

## Decisions

- **`hostedZone: route53.IHostedZone` is required** and passed by the consumer; the construct never calls `fromLookup` (no environment lookups in library code).
- **Regional certificate in the stack region.** API Gateway regional endpoints need the certificate in the API's region (unlike CloudFront).
- **`ApiMapping` instead of `defaultDomainMapping`**: the latter only works with the API-created default stage, which this construct does not use.
- **`disableExecuteApiEndpoint: true`** whenever `customDomain` is set, so traffic cannot bypass the domain.
