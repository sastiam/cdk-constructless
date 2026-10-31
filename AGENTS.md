# Agent directives

These rules apply to every agent session and to human contributors. `CLAUDE.md` is a symlink to this file,
so every tool reads the same rules. When a task conflicts with these rules, stop and ask instead of working around them.

## Construct design

- Props are declared as `export interface <Name>Props`. Every member is `readonly`. Every member has TSDoc that includes `@default`.
- Validate props in the constructor only when `!Token.isUnresolved(value)`. Use the helpers from `src/core/validation.ts`.
- Warnings use `Annotations.of(this).addWarningV2('<lib>:<rule>', message)`, for example `cdk-constructless:unresolved-region`.
- Never read `process.env` or call `fromLookup` inside a construct. Pass the value in as a prop.
- Account and region come from `Stack.of(this)`: `Stack.of(this).account` and `Stack.of(this).region`.
- Never hard-code physical names. Accept an optional `<x>Name` prop (for example `bucketName?: string`) and let CDK generate the name when it is absent.
- Expose wrapped resources as `public readonly` properties.
- Never rename a construct id once it has been released. A changed id replaces the resources.
- `removalPolicy` is a prop only where the resource is stateful.
- No fixed-cost resource by default. Create these only when a prop asks for them: NAT gateway, Elastic IP, load balancer,
  KMS customer key, Secrets Manager secret, Lambda@Edge.
- Log groups default to 3 days of retention (`RetentionDays.THREE_DAYS`) unless a prop overrides it.

## Testing

- Every construct has a test file at `test/<domain>/<file>.test.ts`.
- Build the stack with `synth`, and use `normalizedTemplate` and `expectNoNagErrors`. Import all three from `test/helpers`.
- Use fine-grained `Template` assertions with exact values.
- Each construct test file has one `toMatchSnapshot()`.
- Each validation error has its own test.

## cdk-nag

- cdk-nag 3 runs as a CDK policy-validation plugin; acknowledge deliberate findings only through `suppressNag` (reason of at least 20 characters, listed in the construct TSDoc), using the exact finding ids from the validation report (IAM4/IAM5 are per finding, `RuleId[FindingId]`); tests whose stacks keep findings left to the consumer pass `{ nag: false }` to `synth` with a comment.

## Task pitfalls (openspec-cascade)

- Only `bun run` commands are executed as checks. Write every Verify command that way.
- Never write the compiler command. Use `bun run typecheck` for type checks.
- Never use the Bun built-in test runner. Tests run with `bun run test <path>`.
- The words lint and build in a task add the `lint` and `build` scripts to its checks.
- Copy these rules verbatim from the `rules.tasks` list in `openspec/config.yaml`. Do not retype them from memory:

- Every task MUST end with "Verify:" followed by one or more backticked commands that start with `bun run` or `bun install`.
- Never write the phrases "full verification", "E2E", "git push" or "open the PR" anywhere in a task, never write the word "both" before the compiler name, and never put the compiler in a Verify command; use `bun run typecheck` for type checks.
- Never rely on `bun test`; tests run with `bun run test <path>`.
- The last task of every "##" section names its Conventional Commit type, e.g. Commit `feat(finops)`.
- Each task names the exact files, exported symbols, prop names, default values and error messages; nothing is left for the implementer to decide.
- Tests for a construct live in test/<domain>/<file>.test.ts and use the helpers in test/helpers.

## Placeholders

Use these values in code, tests and docs. Never write a real account ID, e-mail address or domain.

- Account: `123456789012`
- E-mail: `alerts@example.com`
- Domain: `example.com`
