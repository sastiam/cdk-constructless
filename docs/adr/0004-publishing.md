# 0004. Publish to npmjs.com and GitHub Packages with provenance

Date: 2026-10-30

## Status

Accepted

## Context

Consumers install the library with npm, and they need a published version they can pin exactly. The package name is
`@sastiam/cdk-constructless`. Publishing without a long-lived token is preferred, so the release workflow uses OIDC
trusted publishing. Installing from npmjs.com needs no token. GitHub Packages requires an authentication token even for
public packages, so the GitHub Release tarball is provided as a second, token-free way to pin a version.

Before the first release there is no package on npmjs.com. Consumers in that period can install the library directly
from the Git repository with `github:sastiam/cdk-constructless`.

Versions must follow SemVer, and the changelog and version bumps should come from the commit history rather than by
hand. The project uses Conventional Commits, so release-please can derive the next version from them.

## Decision

- The package `@sastiam/cdk-constructless` is published to npmjs.com using trusted publishing (OIDC) with provenance
  enabled. No long-lived npm token is stored in the repository.
- Each release is also mirrored to GitHub Packages.
- The `npm pack` tarball is attached to every GitHub Release, together with a build attestation. A consumer can
  download the tarball and pin an exact version without a registry token.
- Until the first release, consumers install the library with `github:sastiam/cdk-constructless`.
- release-please drives SemVer and the changelog from Conventional Commits. Commit types determine the version bump.

## Consequences

- Releases carry provenance, so consumers can check where and how a package was built.
- No npm token needs to be rotated or stored as a secret for npmjs.com publishing.
- Consumers can pin an exact version from the GitHub Release tarball without authenticating to any registry.
- Two registries must be kept in step. The GitHub Packages copy is a mirror of the npmjs.com release and is produced
  by the same workflow run.
- Commit messages matter for versioning. A commit that does not follow Conventional Commits can lead to a wrong version
  bump, so the contributor guide must describe the commit format.
- Until the first release, the `github:` install path has no registry version. Its installs track the default branch
  unless a consumer pins a commit SHA.
