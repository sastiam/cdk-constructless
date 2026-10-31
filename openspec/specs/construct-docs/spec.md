# construct-docs Specification

## Purpose
TBD - created by archiving change docs-construct-template. Update Purpose after archive.

## Requirements

### Requirement: Page per exported construct

Every construct class exported from the package entry point SHALL have a documentation page at `docs/constructs/<ClassName>.md` containing all mandatory sections.

#### Scenario: Missing page

- **WHEN** a construct class is exported from `src/index.ts` and `docs/constructs/<ClassName>.md` does not exist
- **THEN** the test suite fails naming the missing file

#### Scenario: Missing section

- **WHEN** a page lacks any of the headings `## Purpose`, `## Resources created`, `## Props and defaults`, `## Cost impact`, `## Verified AWS facts`, `## Limits and risks`, `## Example`, `## Changelog`
- **THEN** the test suite fails naming the page and the missing heading

#### Scenario: Non-construct exports

- **WHEN** the entry point exports enums, interfaces, helpers or error classes
- **THEN** no page is required for them

### Requirement: Verified AWS facts registry

Every AWS fact a construct relies on (pricing, quotas, limits, service behavior) SHALL be recorded once in `docs/aws-facts.md` with its source URL and read date, and cited from the construct page.

#### Scenario: Fact row format

- **WHEN** a construct page cites a fact
- **THEN** `docs/aws-facts.md` has a row with the fact, an `https://` source URL, a read date in `YYYY-MM-DD` format and the construct name in "Used by"
