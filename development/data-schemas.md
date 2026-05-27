# Data Schemas

A data schema is the shape of a content type — what fields a `person` has, what a `product` looks like. You write it once, and it does three jobs at the same time: `uniweb validate` **checks** your data before it ships, the runtime **delivers** each record to your components with field defaults applied, and the editor renders a **form** authors fill in. Define the shape once instead of re-describing it in a validator, a fetch handler, and a form.

This guide is about the schema *definition* — authoring one, sharing it across projects, and registering it as a reusable content type. For how data is fetched and delivered to components at runtime, see [Working with Data](./working-with-data.md).

---

## What you get

| What you write | What you get |
|---|---|
| The shape, once, in a schema file | `validate` on your data, runtime defaults, and a form in the editor — all from one definition |
| A reference by name (`@/product`) | The binding is a name, not a path — move or rename the implementation freely |
| Shared schemas in one place (`@org/schemas`) | Fix `person` once; every foundation that references it picks up the change |

---

## Authoring a schema

A schema is a file in your foundation's `foundation/schemas/` folder. The simplest form is a flat list of fields:

```yaml
# foundation/schemas/product.yml
name: product
description: A product offered by the client.
fields:
  name:        { type: string, required: true }
  tagline:     { type: string }
  price:       { type: number }
  image:       { type: image }
  description: { type: markdown }
  url:         { type: url }
  featured:    { type: boolean }
```

The types are plain and content-oriented — `string`, `text`, `markdown`, `number`, `boolean`, `date`, `datetime`, `image`, `url`, `email`, plus structural `object`, `array`, and `ref` (a reference to another schema). You write the word that fits the content; the framework folds the friendly names to canonical kinds (`markdown` is rich text, `image` is a file, `number` is a decimal).

A section type binds the schema by naming it in `meta.js`:

```js
// foundation/sections/Products/meta.js
export default {
  title: 'Products',
  data: { products: '@/product' },   // content.data.products, shaped by @/product
}
```

Your component then reads `content.data.products` — an array of products, each with the schema's defaults already applied, so there's nothing to null-check. The binding is a declaration, not a gate: a component without it still receives the data, just without the defaults. (Full binding reference — inline field maps and the editor "rich form" — is in [Component Metadata → Data](../reference/component-metadata.md#data).)

For content with more structure than a flat record — say a profile with a bio plus a list of publications — a schema declares named `sections:` instead of `fields:`. Each section is one record (`single`) or a repeating list (`multi`):

```yaml
# foundation/schemas/person.yml
name: person
sections:
  identity:
    kind: single
    brief: true                      # the section shown when this entity is referenced
    fields:
      name: { type: string, required: true }
      role: { type: string }
  publications:
    kind: multi                      # a repeating list of records
    fields:
      title: { type: string }
      year:  { type: number }
```

The flat `fields:` form is the common case; reach for `sections:` only when a single record genuinely can't express the content.

---

## Three namespaces

A schema reference is a name in one of three namespaces. The prefix says where the definition lives, and who owns it:

| Ref | Means | Lives in |
|---|---|---|
| `@/product` | **Your own** — a schema this foundation defines | `foundation/schemas/product.{yml,js,json}` |
| `@std/person` | A **shared standard** — common types anyone can use | the `@uniweb/schemas` package |
| `@acme/product` | **An org's** shared schema | that org's `@acme/schemas` package |

`@/` is the *self* namespace — "this foundation's own." Because you never write your own org name in your source, `@/`-refs stay portable: the same foundation can be published under any scope. The standards (`@std/person`, `@std/event`, `@std/article`, `@std/project`, …) cover the shapes most sites need — reach for one before inventing your own, the same way you'd pull a well-known type off the shelf rather than redefining it.

Add `@uniweb/schemas` as a dependency when you reference any `@std/<name>`. Full reference, including how `@org/<name>` resolves: [Component Metadata → Data](../reference/component-metadata.md#data).

---

## Sharing schemas across projects

Build more than one foundation — a few brands, a client's product line — and they want the same shapes: a `person`, a `project`, a `product`. Define each once and reference it everywhere. The two mechanisms (an `@org/schemas` package, or a routed directory via `schemas.config.js`) are covered in [Working with Data → Sharing schemas](./working-with-data.md#sharing-schemas-across-foundations).

The package form is worth a second look here, because it's also what you register (next section). An `@org/schemas` package is an ordinary workspace package whose job is to hold schemas:

```text
acme-schemas/                 # the @acme/schemas package
├── package.json              # { "name": "@acme/schemas" }
└── schemas/
    ├── product.yml
    └── review.yml
```

Any foundation that lists `@acme/schemas` as a dependency can bind `@acme/product`. One definition, every foundation in the org — and `uniweb validate` checks each foundation's data against the same source of truth. This is exactly how the standards work: `@std/*` is the centrally-maintained `@uniweb/schemas` package.

---

## Registering schemas

Everything above works offline, against local files — authoring, validating, and rendering with file-based collections need no account and no network. **Registering** is the step that turns a schema into a *reusable content type* in the Uniweb registry: authors can then create and manage entities of that type (in the editor, through the form your schema describes), and any foundation can reference it by name.

Registering is a platform command, so authenticate first:

```bash
uniweb login
```

### A foundation and the schemas it defines

`uniweb register` from a foundation submits the foundation together with the data schemas it owns:

```bash
cd foundation
uniweb register --scope @acme
```

It submits **only the schemas you own** — the `@/`-refs, resolved into your scope (`@/product` → `@acme/product`). Schemas you merely *reference* from another scope are **named, not re-submitted**: a foundation that renders `@std/person` and `@std/event` ships neither definition — it names them, and they resolve to the live standards already in the registry.

That split matters in practice. You don't re-upload the standards every publish (wasteful), and you don't need membership in the `@std` org to reference its schemas — registration authorizes against the artifacts you *publish* (`@acme/*` and the foundation), not against what they reference. The `@/` prefix is the signal for "mine, publish it"; every concrete scope (`@std/x`, another org's `@org/x`) is a reference by name.

### A schema repo on its own

You don't need a foundation to register schemas. Point `uniweb register` at a schemas-only package — the `@org/schemas` repo you maintain — and it registers the schemas directly, no foundation involved:

```bash
cd acme-schemas        # the @acme/schemas package
uniweb register --scope @acme
```

`register` detects a schemas-only package (one named `@org/schemas`, or any bare `schemas/*.yml` folder) and submits just its data schemas. This is exactly how the standards under `@std` are published — now under your own org. So the `@acme/schemas` package earns its keep twice: every foundation references `@acme/product` and resolves it **locally** during development, and `uniweb register` publishes those same definitions so they exist as managed types. Define once, develop offline, register to publish.

A few practical notes:

- Set `"uniweb": { "scope": "@acme" }` in the package's `package.json` and you can drop `--scope` on every run.
- You register under a scope you belong to — membership over the declared scope is what authorizes the publish. (That's why you can register `@acme` but not `@std`.)
- Re-registering is safe: an unchanged schema is a no-op (no new version), and a changed one publishes a new version. Re-running `register` on a repo you haven't edited costs nothing.

---

## See Also

- [Working with Data](./working-with-data.md) — How data is fetched, cached, and delivered to components at runtime; the `@org/schemas` package and routed-directory sharing mechanisms; `uniweb validate`.
- [Component Metadata → Data](../reference/component-metadata.md#data) — The `data:` field reference: named refs, inline field maps, and the editor rich-form.
- [Data Schemas as Contracts](../architecture/data-schemas-as-contracts.md) — Why one schema serves validation, editor UI, and delivery — and how the registry makes content types shareable.
- [Publishing and Working with Clients](./publishing-and-clients.md) — Publishing a foundation as a catalog product, and the invite / handoff client workflows.
- [CLI Commands](../reference/cli-commands.md) — Full command reference.
