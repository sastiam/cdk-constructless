# Contributing

Thanks for your interest in improving `cdk-constructless`.

## Workflow

1. Open an issue to discuss non-trivial changes before starting.
2. Fork the repository and create a branch from `main` (`feat/<topic>`, `fix/<topic>`, `docs/<topic>`).
3. Make your change with tests.
4. Run `bun run typecheck && bun run test` locally.
5. Open a pull request using the template. Pull requests are squash-merged.

## Stacked pull requests

An epic is split into OpenSpec changes that depend on each other. Each change is shipped as one pull request in a stack:

- One OpenSpec change = one branch = one pull request.
- Branch name: `stack/e<N>/<NN>-<change>`, where `<N>` is the epic number, `<NN>` is the two-digit position of the change
  in the epic and `<change>` is the OpenSpec change name. Example: `stack/e1/02-cost-budget`.
- The first branch of an epic starts from `main`. Each next branch starts from the previous branch in the stack.

### With `gh stack`

If the [`gh stack`](https://github.com/github/gh-stack) extension is enabled, let it manage the stack:

```sh
gh stack init     # create the stacked branches for the epic
gh stack submit   # push the stack and open the pull requests
```

### Without `gh stack`

1. Create each branch from the previous branch, or from `main` for the first branch of the epic.
2. Open the pull request against the previous branch:

   ```sh
   gh pr create --base <previous-branch>
   ```

3. After the base pull request is squash-merged, rebase the next branch onto `main` and retarget its pull request:

   ```sh
   git rebase --onto main <previous-branch> <branch>
   git push --force-with-lease
   gh pr edit <number> --base main
   ```

   The rebase drops the commits of the merged branch, so the pull request shows only its own change. The
   `--force-with-lease` push is needed because the rebase rewrites the branch.

Architecture decisions are recorded in [docs/adr/README.md](docs/adr/README.md). Agent and construct rules are in
[AGENTS.md](AGENTS.md).

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
