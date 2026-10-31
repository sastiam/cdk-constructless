# 0002. Ship a TypeScript-only library (no jsii)

Date: 2026-10-30

## Status

Accepted

## Context

AWS CDK libraries are often written with jsii, which compiles a TypeScript library into a language-neutral assembly and
generates bindings for Python, Java, C# and Go. Publishing to Construct Hub and to the other language package managers
depends on jsii.

This project is a public, generic library of constructs for cost control and security guardrails. Its first audience
is TypeScript users. The construct APIs are expected to change often while the first releases settle, and the team
wants fast iteration.

jsii restricts the public API to the subset of TypeScript that it can translate into every target language. The
restrictions include no union types, no generic type parameters on public constructs, and a limited set of
structural features. Several of the prop designs this library needs depend on those features.

## Decision

- The library is written in TypeScript only. It does not use jsii, and the public API may use union types and generics.
- The package is published as plain JavaScript with type declarations. Consumers who use TypeScript get the types; the
  package is usable from JavaScript as well.
- Construct Hub listing and bindings for other languages (Python, Java, C#, Go) are deferred to the project roadmap.
  They can be revisited if demand appears, and that work would need its own ADR.

## Consequences

- Public APIs can use union types and generics, which makes some props easier to express and to validate.
- Iteration is faster: there is no jsii compile step and no restriction on the API shape during the early releases.
- Users of Python, Java, C# or Go cannot consume the library directly. They need to wait for the roadmap work or use the
  TypeScript package from a TypeScript project.
- Because jsii is not used, pnpm's advantage for jsii projects does not apply (see [ADR 0001](0001-bun-package-manager.md)).
