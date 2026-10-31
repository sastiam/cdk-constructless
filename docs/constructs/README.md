# Construct pages

Each construct has one page in this folder. The page documents the purpose, the resources created, the props and their defaults, the cost impact, the verified AWS facts, the limits and risks, an example and the changelog.

- [`_template.md`](_template.md): the template for a new page. Copy it, then replace the title and every comment with real content.

Each exported construct needs a page named `<ClassName>.md`, for example `BudgetGuard.md` for the exported class `BudgetGuard`. The page must keep all eight mandatory headings from the template, in the same order.

AWS facts used by the pages are recorded once in [`../aws-facts.md`](../aws-facts.md).
