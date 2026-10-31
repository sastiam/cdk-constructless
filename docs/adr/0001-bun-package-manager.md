# 0001. Use Bun as package manager and script runner

Date: 2026-10-30

## Status

Accepted

## Context

The repository is developed through OpenSpec changes that are executed by the `openspec-cascade` harness. Each task in
a change ends with a `Verify:` line, and the harness runs only the backticked commands that start with `bun`. Commands
such as `npm run` or `pnpm run` are not executed as checks, so a project that used another package manager would
have verification steps the harness cannot run.

The library itself is an AWS CDK v2 construct library. Its consumers run it on Node.js, and its tests use vitest, whose
binary runs on Node. Bun is used only to install dependencies and to run the project scripts; it is not the runtime
that consumers or the test suite depend on.

pnpm was considered as the alternative. It is the usual choice for projects that use jsii, because jsii's tooling
works best with it. jsii is out of scope for this project (see [ADR 0002](0002-typescript-only.md)), so that advantage
does not apply.

## Decision

- Bun is the package manager and script runner. `packageManager` in `package.json` pins the Bun version, and the
  lockfile is the text lockfile that Bun writes.
- Every project script is run as `bun run <script>`. Verify commands in OpenSpec tasks use this form only.
- Tests run through `bun run test`, which invokes vitest on Node. The Bun built-in test runner (`bun test`) is not used.
- pnpm is rejected because it has no advantage here without jsii.

## Consequences

- The `openspec-cascade` harness can execute every check, because each check is a `bun run` command.
- Contributors need Bun installed. The README documents this.
- The `prepare` script calls the TypeScript compiler directly rather than through Bun. npm runs `prepare` when a
  consumer installs the package from a Git URL, and that installation may happen on a machine without Bun.
- Dependabot's `bun` ecosystem has fewer features than its npm ecosystem. The weekly schedule is kept, and a different
  update tool can be considered later.
- Test behaviour matches what consumers run, because vitest executes on Node.
