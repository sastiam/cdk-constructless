# <ConstructName>

<!-- Use the exported class name as the title, for example `BudgetGuard`. The file is saved as `<ConstructName>.md` in this folder. -->

## Purpose

<!-- One paragraph: the problem this construct solves for the consumer. Describe the problem, not the implementation. -->

## Resources created

<!-- One row per CloudFormation resource type the construct creates by default. Columns: CloudFormation type, count, notes.
Put resources that are created only when a prop asks for them in the notes column, with the prop name. -->

| CloudFormation type | Count | Notes |
| --- | --- | --- |

## Props and defaults

<!-- One row per member of the `<ConstructName>Props` interface. Copy the type, the `@default` value and the description from the TSDoc.
Columns: prop, type, default, description. -->

| Prop | Type | Default | Description |
| --- | --- | --- | --- |

## Cost impact

<!-- Write one of: fixed, variable or none. Give the USD figures and link each figure to its row in ../aws-facts.md.
Fixed means a monthly charge that does not depend on usage. Variable means a charge per request, per GB or per unit of usage. -->

## Verified AWS facts

<!-- One bullet per AWS fact this page relies on. Each bullet links to its row in ../aws-facts.md. -->

## Limits and risks

<!-- Bullets. List each service limit, each operational risk, and each cdk-nag suppression with its exact finding id and its reason (at least 20 characters). -->

## Example

<!-- One TypeScript block. Use only the placeholders 123456789012 (account), alerts@example.com (e-mail) and example.com (domain). -->

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { ConstructName } from 'cdk-constructless';

const app = new App();
const stack = new Stack(app, 'Example', {
  env: { account: '123456789012', region: 'eu-west-1' },
});

new ConstructName(stack, 'ConstructName', {
  // Replace with real prop names from the table above, for example:
  contactEmail: 'alerts@example.com',
  domain: 'example.com',
});
```

## Changelog

<!-- Link to the root changelog. Do not copy entries here. -->

See [CHANGELOG.md](../../CHANGELOG.md).
