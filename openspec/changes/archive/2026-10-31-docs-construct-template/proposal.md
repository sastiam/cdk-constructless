# Proposal

## Why

Agents implementing stacks in downstream repositories (for example the private `aws-foundation`) learn what each
construct provides from its documentation page, not from source (issue #34). If pages only arrive with the docs
site (E6), the 13 constructs of E1-E4 would need their pages written afterwards. Putting the page template, the
AWS facts table and a coverage test in E0 makes every construct change ship its own page.

## What Changes

- `docs/constructs/_template.md` with the mandatory sections: Purpose, Resources created, Props and defaults,
  Cost impact, Verified AWS facts, Limits and risks, Example, Changelog.
- `docs/aws-facts.md`: one table of every AWS fact the constructs rely on (fact, source URL, read date, used by).
- `test/docs-coverage.test.ts`: fails when an exported construct has no `docs/constructs/<Name>.md` or the page misses a mandatory heading.
- README `## Constructs` section that links to the pages.

## Capabilities

### New Capabilities

- `construct-docs`: per-construct documentation pages and the verified AWS facts registry.

### Modified Capabilities

None.

## Impact

New `docs/constructs/_template.md`, `docs/aws-facts.md`, `test/docs-coverage.test.ts`; README edit. The docs site (E6) later renders these files.
