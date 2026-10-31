# Tasks

## 1. Agent directives

- [x] 1.1 Create `AGENTS.md` with these sections and rules (bullets, verbatim intent):
  "Construct design": props are `export interface <Name>Props` with only `readonly` members and TSDoc including `@default`;
  validate props in the constructor only when `!Token.isUnresolved(value)` using helpers from `src/core/validation.ts`;
  warnings use `Annotations.of(this).addWarningV2('<lib>:<rule>', message)`; never read `process.env` or call `fromLookup` inside a construct;
  account and region come from `Stack.of(this)`; never hard-code physical names, accept an optional `<x>Name` prop;
  expose wrapped resources as `public readonly`; never rename a construct id once released (it replaces resources);
  `removalPolicy` is a prop where the resource is stateful; no fixed-cost resource by default (NAT gateway, Elastic IP,
  load balancer, KMS customer key, Secrets Manager secret, Lambda@Edge); log groups default to 3 days retention.
  "Testing": every construct has `test/<domain>/<file>.test.ts` using `synth`, `normalizedTemplate` and `expectNoNagErrors`
  from `test/helpers`, fine-grained `Template` assertions with exact values, one `toMatchSnapshot()` and one test per validation error.
  "cdk-nag": suppressions only through `suppressNag` from `src/core/nag.ts`, each with a reason of at least 20 characters, listed in the construct TSDoc.
  "Task pitfalls (openspec-cascade)": only bun-run commands are executed; never write the compiler command (use `bun run typecheck`);
  never use the Bun built-in test runner; copy the forbidden phrases verbatim from the `rules.tasks` list in `openspec/config.yaml`
  into this section (do not retype them from memory); the words lint and build in a task add the lint and build scripts to its checks.
  "Placeholders": account `123456789012`, e-mail `alerts@example.com`, domain `example.com`.
  Then create `CLAUDE.md` as a symlink to `AGENTS.md` (`ln -s AGENTS.md CLAUDE.md`).
  Commit `docs(agents)`.
  Verify: `bun run lint`

## 2. Architecture decision records

- [ ] 2.1 Create `docs/adr/README.md` (index table: number, title, status) and four ADRs in Michael Nygard format
  (Title, Status: Accepted, Context, Decision, Consequences), dated 2026-10-30:
  `0001-bun-package-manager.md` (Bun because openspec-cascade executes only bun commands; vitest on Node for tests; pnpm rejected because jsii is out of scope),
  `0002-typescript-only.md` (no jsii: allows union types and generics, faster iteration; Construct Hub and multi-language packages deferred to the roadmap),
  `0003-floci-local-integration.md` (Floci MIT emulator on port 4566 instead of LocalStack, which requires an auth token since March 2026; unsupported CloudFormation types are stubbed, so integration tests must assert through service APIs),
  `0004-publishing.md` (`@sastiam/cdk-constructless` on npmjs.com via trusted publishing with provenance, mirrored to GitHub Packages, and the `npm pack` tarball attached to every GitHub Release with a build attestation so consumers can pin an exact version without a token; until the first release, consumers install from `github:sastiam/cdk-constructless`; release-please drives SemVer from Conventional Commits).
  Verify: `bun run lint`
- [ ] 2.2 Add a "Stacked pull requests" section to `CONTRIBUTING.md`: one OpenSpec change = one branch = one PR; branch name `stack/e<N>/<NN>-<change>`;
  the first branch of an epic starts from `main`, each next branch starts from the previous one; with `gh stack` (github/gh-stack) enabled use
  `gh stack init` and `gh stack submit`; otherwise create each PR with `gh pr create --base <previous-branch>` and, after the base PR is squash-merged,
  run `git rebase --onto main <previous-branch> <branch>` then `gh pr edit <number> --base main`. Link `docs/adr/README.md` and `AGENTS.md`.
  Commit `docs`.
  Verify: `bun run lint`
