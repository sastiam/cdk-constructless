# Proposal

## Why

Every cascade task runs in a fresh agent session that only sees the task text plus root `AGENTS.md`/`CLAUDE.md`.
Construct conventions, the cascade pitfalls and the stacked-PR workflow must live in the repository so that each
session applies them without re-deriving them, and so that human contributors follow the same rules.

## What Changes

- Add `AGENTS.md` (construct design rules, testing rules, cascade task pitfalls) and `CLAUDE.md` as a symlink to it.
- Add `docs/adr/` with ADR 0001 (Bun), 0002 (TypeScript-only, no jsii), 0003 (Floci for local integration tests), 0004 (npm + GitHub Packages publishing).
- Document the stacked pull request workflow in `CONTRIBUTING.md`.

## Capabilities

### New Capabilities

None (documentation only; `skip_specs: true`).

### Modified Capabilities

None.

## Impact

New `AGENTS.md`, `CLAUDE.md`, `docs/adr/*.md`; edits `CONTRIBUTING.md`.
