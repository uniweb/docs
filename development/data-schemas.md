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

The types are plain and content-oriented — `string`, `text`, `markdown`, `html`, `number`, `boolean`, `date`, `datetime`, `image`, `url`, `email`, `richtext`, plus structural `object` (also spelled `group`), `array`, and `ref` (a reference to another schema). You write the word that fits the content; the framework folds the friendly names to canonical kinds (`markdown` and `html` are a `text` field carrying that rich-content `format`, `richtext` is a ProseMirror `json` document, `image` is a file, `number` is a decimal).

A section type binds the schema by naming it in `meta.js`:

```js
// foundation/sections/Products/meta.js
export default {
  title: 'Products',
  data: { products: '@/product' },   // content.data.products, shaped by @/product
}
```

Your component then reads `content.data.products` — an array of products, each with the schema's defaults already applied, so there's nothing to null-check. The binding is a declaration, not a gate: a component without it still receives the data, just without the defaults. (Full binding reference — inline field maps and the editor "rich form" — is in [Component Metadata → Data](../reference/component-metadata.md#data).)

For content with more structure than a flat record — say a profile with a bio plus a list of publications — a schema declares named `sections:` instead of `fields:`. Each section is one record by default, or a repeating list (`many: true`):

```yaml
# foundation/schemas/person.yml
name: person
sections:
  identity:
    brief: true                      # single is the default; the card shown when referenced
    fields:
      name: { type: string, required: true }
      role: { type: string }
  publications:
    many: true                       # a repeating list of records
    fields:
      title: { type: string }
      year:  { type: number }
```

The flat `fields:` form is the common case; reach for `sections:` only when a single record genuinely can't express the content.

### Append-only sections

A `multi` section can be marked **insert-only** with `append_only: true` — records may be added, but never edited or deleted:

```yaml
# foundation/schemas/membership.yml
name: membership
sections:
  identity:
    brief: true
    fields:
      name: { type: string, required: true }
  activity:
    many: true
    append_only: true              # records accumulate; existing ones are immutable
    fields:
      at:    { type: datetime }
      event: { type: string }
```

Once you [register](#registering-schemas) the schema, this rule is enforced wherever entities of the type are written — appends are accepted, but changing or removing an existing record is refused. There's no "replace the whole section" shortcut either: re-submitting records adds new ones rather than overwriting what's already there. Because the rule lives in the content type rather than in a form, it holds for every writer, not just the editor UI. That makes an append-only section **tamper-evident**: the accumulated history stands on its own. Reach for it for activity logs, submissions, audit trails — anything meant to accumulate and never be rewritten.

`append_only` is only valid where there are many records to append to — a `many: true` section, or a list of records authored as a field (`activity: { type: object, many: true, append_only: true }`). On a single record it's rejected rather than ignored. For file-based collections there's no write step, so it has no effect until the type is registered.

### When the content *is* a list

Some content isn't a record with parts — it *is* a list. A navigation menu is a list of items; a form is a list of controls. Declare that as **one `many: true` section and nothing else**, and the content is a bare list with no wrapping key:

```yaml
# foundation/schemas/menu.yml
name: menu
sections:
  items:
    many: true
    fields:
      label: { type: string, required: true }
      href:  { type: string, translatable: false }
```

````markdown
```yaml:menu
- label: Home
  href: /
- label: Docs
  href: /docs
```
````

**No `brief:` here, and that's right** — there's no single record to be the card, so the type just isn't referenceable from another schema. `uniweb validate` checks each record and names its index (`[1].label`), and defaults are applied per entry. This is how `@std/nav` is built.

One limit: it must be *exactly one* section. Two `many` sections with no single one leaves "which one is the value?" unanswerable, so nothing is checked.

**A list-shaped block carries no title of its own, and that's deliberate.** A heading and an intro are *content* — the author writes them as markdown in the section, and your component reads them from `content.title` and `content.paragraphs` exactly as it would for any other section. The block carries only the structured part.

It's worth stating because the alternative is tempting and wrong: putting a `title:` inside the block gives the section two titles, one editable as ordinary content and one buried in a data block, with nothing to say which wins. Keep the prose in the prose.

### Tree sections

A `many: true` section can be marked `tree: true`, letting its records nest **under each other** — a chapter tree, a category hierarchy, a threaded discussion:

```yaml
# foundation/schemas/handbook.yml
name: handbook
sections:
  identity:
    brief: true
    fields:
      title: { type: string, required: true }
  chapters:
    many: true
    tree: true                     # a chapter can sit under another chapter
    fields:
      title: { type: string }
      body:  richtext
```

Authors nest records under a reserved **`children:`** key — you declare one record's fields, and `children` holds more of the same:

```yaml
- title: Getting started
  children:
    - title: Installing
    - title: Your first page
```

The parent/child link is managed for you — there's **no field to declare** for it and no ID to wire up. `uniweb validate` descends into `children` to any depth and names the full path (`[1].children[0].title`), so a bad entry deep in a tree is findable.

This is what separates `tree:` from a [subsection](./designing-data-schemas.md#subsections-model-hierarchy). A subsection nests one *named* section inside another — a course has modules, a module has lessons, a fixed shape you spell out in the schema. `tree:` instead lets records of a **single** section nest under one another, so the shape is decided by the author as they write, not by you as you model.

`tree: true` is only valid where there are many records to nest — a `many: true` section, **nested sections included**, or a list of records authored as a field (`chapters: { type: object, many: true, tree: true }`). On a single record, or on a list of plain values, it's rejected rather than ignored. `nestable: true` is accepted as a lower-level spelling of the same flag.

### The sort axis: `sort_date`

A schema can name **which date field its records sort by** — the axis a feed, an archive, or a "latest first" listing orders on:

```yaml
# foundation/schemas/post.yml
name: post
sort_date: published_on          # names a date field below
fields:
  title:        { type: string, required: true }
  published_on: { type: date }
  body:         richtext
```

`sort_date` is a **schema-level** key, and its value is the **name of a date field** — not `true`/`false`, and not something you put on the field itself. With the flat `fields:` form the whole field set is the record's card, so any date field there can be the axis. With the `sections:` form, name a field in the **brief** section; a schema with no brief has no sort axis. It takes effect once the schema is [registered](#registering-schemas). (`sortDate` is accepted as an alias.)

---

## Field types and formats

The friendly type you write folds to a small set of **canonical kinds** the framework stores and ships. Write the word that fits the content — the framework normalizes it:

| You write | Canonical kind | Holds |
|---|---|---|
| `string` | `string` | A short, single-line value |
| `text` | `text` | Long-form text (see `format` below) |
| `number` | `decimal` | A number |
| `integer` | `int` | A whole number |
| `boolean` | `bool` | `true` / `false` |
| `date`, `datetime` | `date`, `datetime` | An ISO-8601 date / timestamp |
| `image` | `file` | A path or URL to a file |
| `url`, `email` | `string` (+ `format`) | A validated string |
| `markdown`, `html` | `text` (+ `format`) | A rich-content body (a source string) |
| `richtext` | `json` (+ `format: prosemirror`) | A rich document edited in the visual app |
| `json` | `json` | An opaque structured value (see `format`) |
| `object`, `group` | `object` | A nested record — declare its `fields:`. `group` is the friendlier spelling |
| `ref` | `ref` | A reference to another schema — write `{ ref: '@/person' }` |

You can always write the canonical kind directly; the friendly names just save you the folding.

**Lists use `many: true`.** Any field or section becomes a list by adding `many: true` — `{ type: string, many: true }` (a list of strings), `{ ref: '@/course', many: true }` (a list of references), or a `many: true` section (a repeating list of records). Collection-level flags like `required` ride on the list; the type describes each item.

Every list has an element type: `many: true` takes it from the field itself, and the lower-level `array` + `items:` states it explicitly. Writing `type: array` with no `items:` leaves it genuinely unknown, and a registered schema records the elements as opaque rather than guessing at them.

`required` holds on a list of values (`{ type: string, many: true, required: true }`) and on a list of references. It does **not** hold on a list of *records* or on a nested `object` — both become sections once the schema is [registered](#registering-schemas), and `required` binds the record that is *written*; it cannot force a record to *exist*. Put the flag on a field inside the record, and see [Constraints](#constraints) for "don't let this become empty".

### Constraints

A nested record and a list of records become **sections** when a schema is registered, and a section can carry rules a single field can't express. Declare them with `constraints:` — on the section in the `sections:` form, or on the field itself:

```yaml
fields:
  authors:
    type: object
    many: true
    constraints:
      - { kind: min_items, value: 1 }
    fields:
      name: { type: string, required: true }
```

`min_items` is the common one, and its scope is narrower than the name suggests:

- **A delete floor, not a fill requirement.** It refuses a delete that would take the section below N. Nothing forces an author to populate it in the first place. On a single-record section, read it as *"undeletable once created"*.
- **A write guarantee, never a render guarantee.** Your component still handles an empty list — the same schema can be rendered by a foundation that never saw the constraint, so content and code stay independent axes.

Constraints on a plain leaf field are ignored; a leaf narrows with `enum` and `format` instead. They take effect once the schema is [registered](#registering-schemas) — file-based collections have no write step.

### Rich content: `format`

A `format` marks a field as carrying rich content. It is **type-bound** — the framework rejects a mismatch at build time:

| `format` | Valid on | Use it for |
|---|---|---|
| `markdown` | `text` | A markdown body that round-trips as plain source |
| `html` | `text` | An HTML body |
| `prosemirror` | `json` | A rich document edited through a structured editor |
| `scene` | `json` | A visual scene composition (rendered by `@uniweb/scene`) |

```yaml
fields:
  summary: { type: markdown }  # a source body (round-trips as markdown text)
  body:    richtext            # a rich document, edited in the visual app (json + prosemirror)
```

The friendly aliases set these for you — `type: markdown` is exactly `type: text, format: markdown`, and **`type: richtext`** is exactly `type: json, format: prosemirror`. **Use `richtext` for a rich body edited in the visual app** — the common case; it's the editor's native, lossless document. Use `markdown` / `html` for a **source body** authored as text (file-based projects, or content you want to keep readable as raw source). Don't reach for `markdown` just because it's the familiar word — if it'll be edited visually, you want `richtext`.

### Translatable fields: `translatable`

Text and rich-content fields are **translatable by default** — the framework keeps one value per locale. Set `translatable: false` to opt a field out (an ID, a slug, a machine code that's the same in every language):

```yaml
fields:
  title: { type: string }                        # translatable by default
  body:  { type: text, format: markdown }        # translatable by default
  sku:   { type: string, translatable: false }   # one value across all locales
```

You author a translatable field as a plain value in your source locale; translations live in the `locales/` folder. See [Internationalization](./internationalization.md).

### Picklists: `enum` and `options`

Two ways to constrain a field to a set of choices:

```yaml
fields:
  status:  { type: string, enum: [draft, published, archived] }  # inline list
  country: { type: string, options: '@/countries' }              # curated, shared
```

- **`enum:`** — an **inline** list of allowed values. Best for a short, fixed set.
- **`options:`** — a **`@/<name>` ref** to a curated options schema. Best when the choices are a managed list reused across fields or foundations.

An inline array always belongs on `enum:`; `options:` always takes a ref.

---

## What `uniweb validate` checks

A schema only earns its keep where something runs it, so it's worth knowing exactly where that happens. `uniweb validate` walks your site and checks every data input it can pair with a schema:

| Where the data lives | Checked against |
|---|---|
| A **file-based collection** (`data: articles`) | The schema the section's `meta.js` binds to that key — each record |
| A **tagged data block** (```` ```yaml:form ````) | The schema bound to that *tag*, whether the value is a record or a list |
| A **concept block** (```` ```md:faq ````) | `@std/faq`, if such a standard exists — resolved by name, never by a registry |

Findings are **warnings by default**; `uniweb validate --strict` exits non-zero for CI.

Two things are reported as **deferred** rather than checked, and both for the same honest reason — the data isn't there to look at:

- a **remote `url:` source**, which isn't fetched at build time;
- a **`sections:`-form schema describing a multi-section entity**, which no single flat file reproduces. (A `sections:` schema whose root is *a list* — see [When the content is a list](#when-the-content-is-a-list) — is checked normally, records and all.)

An inline schema on a binding is reported too, rather than guessed at.

**What is never checked, by design:** a visitor's answers to a form, an API response shape, or anything else that only exists at runtime. `validate` is a pre-ship gate over content you can see, not a runtime guard — the runtime stays tolerant, applying defaults and ignoring the rest.

---

## Three namespaces

A schema reference is a name in one of three namespaces. The prefix says where the definition lives, and who owns it:

| Ref | Means | Lives in |
|---|---|---|
| `@/product` | **Your own** — a schema this foundation defines | `foundation/schemas/product.{yml,yaml,js,json}` |
| `@std/person` | A **shared standard** — common types anyone can use | the `@uniweb/schemas` package |
| `@acme/product` | **An org's** shared schema | that org's `@acme/schemas` package |

`@/` is the *self* namespace — "this foundation's own." Because you never write your own org name in your source, `@/`-refs stay portable: the same foundation can be registered under any scope. The standards (`@std/person`, `@std/event`, `@std/article`, `@std/project`, …) cover the shapes most sites need — reach for one before inventing your own, the same way you'd pull a well-known type off the shelf rather than redefining it.

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

`register` detects a schemas-only package (one named `@org/schemas`, or any bare `schemas/*.yml` folder) and submits just its data schemas. This is exactly how the standards under `@std` are registered — now under your own org. So the `@acme/schemas` package earns its keep twice: every foundation references `@acme/product` and resolves it **locally** during development, and `uniweb register` registers those same definitions so they exist as managed types. Define once, develop offline, register.

A few practical notes:

- Set `"uniweb": { "scope": "@acme" }` in the package's `package.json` and you can drop `--scope` on every run.
- You register under a scope you belong to — membership over the declared scope is what authorizes the registration. (That's why you can register `@acme` but not `@std`.)
- Re-registering is safe: an unchanged schema is a no-op (no new version), and a changed one registers a new version. Re-running `register` on a repo you haven't edited costs nothing.

---

## See Also

- [Schemas in Practice](./schemas-in-practice.md) — where a schema file lives, how a second project consumes it, and when registering is actually required. Read this if `@acme/person` won't resolve.
- [Designing Data Schemas](./designing-data-schemas.md) — the modeling decisions behind a set of related types: sections, subsections, embed vs reference, and relationship (edge) attributes, with a worked LMS example.
- [Working with Data](./working-with-data.md) — How data is fetched, cached, and delivered to components at runtime; the `@org/schemas` package and routed-directory sharing mechanisms; `uniweb validate`.
- [Component Metadata → Data](../reference/component-metadata.md#data) — The `data:` field reference: named refs, inline field maps, and the editor rich-form.
- [Data Schemas as Contracts](../architecture/data-schemas-as-contracts.md) — Why one schema serves validation, editor UI, and delivery — and how the registry makes content types shareable.
- [Publishing and Working with Clients](./publishing-and-clients.md) — Publishing a foundation as a catalog product, and the invite / handoff client workflows.
- [CLI Commands](../reference/cli-commands.md) — Full command reference.
