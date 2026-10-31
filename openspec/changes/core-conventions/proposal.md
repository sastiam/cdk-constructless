# Proposal

## Why

Every construct in E1-E4 validates props, suppresses deliberate cdk-nag findings and tests the same way. Building
these helpers once keeps error messages consistent and lets each construct task reference exact helper names.

## What Changes

- `src/core/errors.ts`: `ConstructValidationError` (public, exported) carrying the construct path.
- `src/core/validation.ts`: token-aware assertion helpers (internal).
- `src/core/nag.ts`: `suppressNag` writing cdk-nag metadata without a runtime dependency on cdk-nag (internal).
- `test/helpers/index.ts`: `synth`, `normalizedTemplate`, `expectNoNagErrors`.
- Source layout `src/<domain>/<construct>.ts`, re-exported from `src/index.ts`.

## Capabilities

### New Capabilities

None (internal conventions; `skip_specs: true`).

### Modified Capabilities

None.

## Impact

New files under `src/core/` and `test/helpers/`; `src/index.ts` exports `ConstructValidationError`.
