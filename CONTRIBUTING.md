# Contributing

Thanks for your interest in improving `cdk-constructless`.

## Workflow

1. Open an issue to discuss non-trivial changes before starting.
2. Fork the repository and create a branch from `main` (`feat/<topic>`, `fix/<topic>`, `docs/<topic>`).
3. Make your change with tests.
4. Run `npm run typecheck && npm test` locally.
5. Open a pull request using the template. Pull requests are squash-merged.

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`. Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.

## Construct guidelines

- No account IDs, e-mail addresses, ARNs or other environment-specific values in code, tests or docs. Use placeholders such as `123456789012` and `alerts@example.com`.
- Every construct needs template assertion tests.
- Validate props at construction time and throw a clear error on invalid input.
- Document every public prop with TSDoc.
- Do not create fixed-cost resources by default.

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
