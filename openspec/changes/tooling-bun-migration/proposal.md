# Proposal

## Why

openspec-cascade only executes verification commands that start with `bun`, so the repository must expose
every check (`build`, `typecheck`, `lint`, `test`) as a `bun run` script before any construct work can be
verified. Node.js 20 reached end of life in April 2026, and the repository has no linter.

## What Changes

- Replace npm with Bun as package manager: `bun.lock` replaces `package-lock.json`; add `packageManager`.
- Scripts: `build`, `typecheck`, `lint`, `format`, `test`, `test:integ` (placeholder). Remove `prepare`, add `prepublishOnly`.
- **BREAKING**: `engines.node` becomes `>=22`.
- Add Biome for lint/format; add `esbuild` and `cdk-nag` as dev dependencies; upgrade vitest to ^5 and `@types/node` to ^24.
- CI uses `oven-sh/setup-bun` with a Node 22/24 matrix; Dependabot uses the `bun` ecosystem.
- README, CONTRIBUTING and PR template use `bun` commands.

## Capabilities

### New Capabilities

None (tooling only; `skip_specs: true`).

### Modified Capabilities

None.

## Impact

`package.json`, `bun.lock`, `biome.json`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `README.md`,
`CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`. Open Dependabot PRs #1-#3 become obsolete.
