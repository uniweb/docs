# Data Schemas as Contracts

Component Content Architecture separates content from components (see [Component Content Architecture](./component-content-architecture.md)). For *structured* content — a roster of people, a catalog of products, a list of events — a **data schema** is the contract across that boundary. It says what a `person` is, independently of any component that renders one or any file that stores one.

The [Data Schemas guide](../development/data-schemas.md) covers the *how* — authoring, sharing, registering. This page covers the *why*: why the schema is a single declaration, why it's addressed by name, and why that shape is what makes content types reusable.

---

## One definition, three jobs

A schema earns its keep because it is consumed three different ways — and in CCA they all read the *same* declaration:

| The schema declares | Consumer | What it does with it |
|---|---|---|
| Field names, types, requiredness, allowed values | `uniweb validate` | Flags data that doesn't fit *before it ships* — a misspelled field, a value outside an enum |
| Field defaults and the delivery shape | The runtime | Hands each record to components as `content.data.<key>`, defaults applied, no null-checks needed |
| The same fields, as editable inputs | The editor | Renders the form a content author or client fills in — the schema *is* the spec for the editing UI |

In a conventional stack these are three artifacts maintained separately: a validation schema, a form configuration, and a fetch-and-serialize layer. They drift — a field added to the form but not the validator, a default that lives in the API but not the UI. CCA collapses them into one declaration, so drift isn't something you manage; it's something that can't happen. Add a field once and `validate` starts checking it, the runtime starts delivering it, and the form gains an input.

This is the same bargain CCA makes everywhere: a constraint (one declaration, not three) that turns out to be less work *and* a tighter design.

---

## Identity is the name

A schema is addressed by an **org-scoped name** — `@std/person`, `@acme/product` — not by a file path, a database id, or an import. The name is the whole contract. The definition behind it resolves locally during development (from a package or a folder on disk) and from the Uniweb registry once published, but the *reference* never changes.

That indirection is what makes the schema shareable rather than copied:

- A foundation writes `@/product` in its source and never hard-codes its own org. The same foundation can be published under any scope — the name resolves relative to where it's published.
- A reference to `@std/person`, or to a schema another organization published, is a name the registry resolves. The foundation declares *what shape it renders*, not *where the definition lives*.

Because identity is the name, you publish a schema by declaring it under a scope you own — not by minting an id or managing a version yourself. Re-declaring an unchanged schema is a no-op; a changed one becomes a new version. The producer never tracks versions; the name stays stable while the definition behind it evolves.

---

## Content types are shared, not owned

A foundation **renders** content types; it doesn't **own** them. The same `@std/person` is rendered by a marketing foundation's team grid, an academic foundation's faculty directory, and a conference foundation's speaker list. Define `person` once; every foundation that needs people references it.

This is why the standards exist. `@std/*` is a small set of common shapes — `person`, `event`, `article`, `project`, `publication`, `opportunity` — maintained centrally so that the most frequent content types are defined well, once. An organization maintains its own shared types the same way: an `@org/schemas` repository is the single source of truth for a team's shapes, referenced by every foundation they build and registered so those shapes exist as managed content types.

The payoff compounds across a portfolio. Fix `person` in one place and every foundation that renders people inherits the fix. A client whose content is shaped by `@acme/product` can move between foundations — a different layout, a different visual identity — without re-entering or reshaping their content, because the content type is independent of the thing rendering it.

---

## Where this sits on the portability spectrum

Foundations range from **bundled** (coupled to one site, fetching their own data, hardcoding their own shapes) to **portable** (the site supplies data, theme, and configuration). Naming content types by schema is the portable end of the data axis: a portable foundation declares the *shapes* it renders (`@std/person`, `@/product`) but not where the data comes from. The site — or the registry, for managed content — supplies the records; the runtime delivers them under the schema's key.

That separation is what lets one foundation serve many sites with different content and different data sources, and what lets a content author's structured data outlive any single foundation that renders it. The schema is the stable contract in the middle; everything on either side of it can change.

---

## See Also

- [Data Schemas](../development/data-schemas.md) — Authoring a schema, the three namespaces, sharing across projects, and registering.
- [Component Content Architecture](./component-content-architecture.md) — The content/component separation this contract sits across.
- [Data Fetcher Architecture](./data-fetcher-architecture.md) — How the runtime resolves, caches, and delivers the records a schema describes.
- [Foundation Categories](../development/foundation-categories.md) — The bundled-to-portable spectrum in full.
