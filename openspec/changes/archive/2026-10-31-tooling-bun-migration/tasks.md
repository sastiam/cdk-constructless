# Tasks

## 1. Bun toolchain

- [x] 1.1 In `package.json`: set `"packageManager": "bun@1.4.4"`, `"engines": { "node": ">=22" }`; replace `scripts` with exactly:
  `"build": "tsc -p tsconfig.build.json"`, `"typecheck": "tsc --noEmit -p tsconfig.json"`, `"lint": "biome check ."`,
  `"format": "biome check --write ."`, `"test": "vitest run"`, `"test:integ": "echo 'integration tests arrive in E7' && exit 0"`,
  `"prepare": "tsc -p tsconfig.build.json"` (keeps `github:` installs working: consumers such as aws-foundation install from git and need `lib/` built without Bun).
  devDependencies: add `@biomejs/biome` `^2.6.4`, `esbuild` `^0.28.2`, `cdk-nag` `^3.0.2`; keep the versions already on `main` for
  `typescript` (`~7.0.2`), `vitest` (`^5.0.5`), `@types/node`, `aws-cdk-lib` (`2.275.0`) and `constructs` (`10.8.1`).
  First create `tsconfig.build.json` that extends `./tsconfig.json` with `"compilerOptions": { "rootDir": "src", "outDir": "lib", "noEmit": false }` and `"include": ["src"]`,
  and change `tsconfig.json`: remove `rootDir`, add `"noEmit": true` and `"types": ["node"]`, set `"include": ["src", "test"]`
  (both must exist before installing, because `bun install` runs the `prepare` script, which compiles with `tsconfig.build.json`).
  Then delete `package-lock.json` and run `bun install` to create `bun.lock`.
  Verify: `bun install --frozen-lockfile` `bun run typecheck` `bun run build`
- [x] 1.2 Create `biome.json` with `"$schema": "https://biomejs.dev/schemas/2.6.4/schema.json"`, `files.includes` `["src/**", "test/**", "*.json"]`,
  formatter `indentStyle: "space"`, `indentWidth: 2`, `lineWidth: 120`, javascript formatter `quoteStyle: "single"`, linter `recommended: true`.
  Run `bun run format` once so existing files comply.
  Commit `build(deps)`.
  Verify: `bun run lint` `bun run test`

## 2. CI and docs

- [x] 2.1 Rewrite `.github/workflows/ci.yml` job `test`: matrix `node-version: [22, 24]`; steps `actions/checkout@v7`,
  `actions/setup-node@v7` (node-version from matrix, no cache), `oven-sh/setup-bun@v2` with `bun-version-file: package.json`,
  then `bun install --frozen-lockfile`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.
  In `.github/dependabot.yml` change `package-ecosystem: npm` to `package-ecosystem: bun`.
  Verify: `bun run lint`
- [x] 2.2 Replace every `npm ci`, `npm run typecheck`, `npm test` and `npm run build` in `README.md`, `CONTRIBUTING.md` and
  `.github/PULL_REQUEST_TEMPLATE.md` with `bun install`, `bun run typecheck`, `bun run test`, `bun run build`; README
  "Requirements" lists Node.js >= 22 and Bun >= 1.4. Add under `[Unreleased]` in `CHANGELOG.md`: "### Changed - Switched to Bun; Node.js >= 22 required."
  Commit `ci`.
  Verify: `bun run lint` `bun run test`
