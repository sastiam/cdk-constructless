# Design

## Context

See proposal.md. cascade (`openspec-cascade/cascade.ts`, `verifyCommands`) runs only backticked `bun`/`bunx`
commands, rewrites `bunx tsc --noEmit` to Nuxt paths, and defaults to `bun test` when a Verify names no command.

## Goals / Non-Goals

**Goals:** every check is reachable as `bun run <script>`; tests keep running on Node (the runtime CDK consumers use).

**Non-Goals:** publishing setup (E8), docs site (E6), integration tests (E7).

## Decisions

- **Bun over pnpm**: cascade compatibility, text lockfile, Dependabot support. pnpm only wins for jsii/projen, which are out of scope.
- **vitest stays** (invoked through `bun run test`): its bin runs on Node, matching consumers; Bun's own runner is not used.
- **Biome over ESLint+Prettier**: one dev dependency, one config, fast; adequate for a TS-only library.
- **Type check script is `tsc --noEmit -p tsconfig.json`** behind `bun run typecheck`, so task text never contains the raw compiler command.
- **tsconfig split**: `tsconfig.json` type-checks `src` and `test`; `tsconfig.build.json` emits `lib` from `src` only.

- **`prepare` stays and calls the compiler directly, not Bun**: npm runs `prepare` when a consumer installs from a git URL, so it must work on machines without Bun.
- **TypeScript 7** (native compiler, merged by Dependabot #3) type-checks `aws-cdk-lib` 2.275 without changes; verified locally on 2026-10-31.

## Risks / Trade-offs

- [Dependabot `bun` ecosystem gaps] → keep the weekly schedule; renovate is a later option.
- [Contributors without Bun] → README documents installing Bun; `npm` still works for consumers since the published package is plain JS.
