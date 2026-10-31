# Architecture decision records

This directory holds the architecture decision records (ADRs) for `cdk-constructless`. Each ADR records one decision,
the context in which it was made, and its consequences. ADRs use the format described by Michael Nygard
(Title, Status, Context, Decision, Consequences).

Status values: `Proposed`, `Accepted`, `Deprecated`, `Superseded by NNNN`. An accepted ADR is not edited to change its
decision; a new ADR supersedes it instead.

## Index

| Number | Title | Status |
| --- | --- | --- |
| [0001](0001-bun-package-manager.md) | Use Bun as package manager and script runner | Accepted |
| [0002](0002-typescript-only.md) | Ship a TypeScript-only library (no jsii) | Accepted |
| [0003](0003-floci-local-integration.md) | Use Floci for local integration tests | Accepted |
| [0004](0004-publishing.md) | Publish to npmjs.com and GitHub Packages with provenance | Accepted |

Contributors add a new ADR by copying the next free number, for example `0005-short-title.md`, and adding a row to
this table.
