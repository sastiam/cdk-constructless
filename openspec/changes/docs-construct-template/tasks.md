# Tasks

## 1. Templates

- [ ] 1.1 Create `docs/constructs/_template.md` with a title line `# <ConstructName>` and exactly these `##` headings in this order, each followed by an
  HTML comment explaining what to write: `## Purpose` (one paragraph: the problem it solves), `## Resources created` (table: CloudFormation type, count, notes),
  `## Props and defaults` (table: prop, type, default, description; copy from TSDoc), `## Cost impact` (fixed / variable / none, with USD numbers and links to rows in aws-facts),
  `## Verified AWS facts` (bullets linking to rows of `docs/aws-facts.md`), `## Limits and risks` (bullets, including cdk-nag suppressions and their reasons),
  `## Example` (one TypeScript block using placeholders `123456789012`, `alerts@example.com`, `example.com`), `## Changelog` (link to `../../CHANGELOG.md`).
  Create `docs/aws-facts.md` with an intro paragraph (facts are re-verified on each release; the read date is when the source was last read) and the table header
  `| Fact | Source | Read date | Used by |`. Create `docs/constructs/README.md` listing the template and explaining that each exported construct needs `<ClassName>.md`.
  Commit `docs(constructs)`.
  Verify: `bun run lint`

## 2. Coverage test

- [ ] 2.1 Create `test/docs-coverage.test.ts`: import `* as lib from '../src'` and `Construct` from `constructs`; collect export names whose value is a function with
  `value.prototype instanceof Construct`; for each, assert `fs.existsSync(path.join(__dirname, '../docs/constructs', name + '.md'))` with message `missing docs/constructs/<name>.md`
  and that the file contains each of the 8 headings from `_template.md` (message `docs/constructs/<name>.md is missing "<heading>"`). Export the heading list as
  `MANDATORY_HEADINGS` from `test/helpers/docs.ts` and import it. Add a test that `docs/aws-facts.md` rows (lines starting with `|` after the header separator) each have 4 cells,
  an `https://` source and a `YYYY-MM-DD` read date. Add a `## Constructs` section to `README.md` that says each construct is documented in `docs/constructs/` and lists none yet.
  Commit `test(docs)`.
  Verify: `bun run test test/docs-coverage.test.ts` `bun run lint`
