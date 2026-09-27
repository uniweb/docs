# Entity Content Structure

The structure every content record — a blog post, a document, any
content-as-data artifact — follows: how you write one in a file (YAML, JSON,
Markdown frontmatter, BibTeX), and the shape your component receives it in.

A data-schema (see [Data Schemas](../development/data-schemas.md)) is the **typed
skeleton** of this structure: the schema describes what a record of that type looks
like; this page describes how an actual record is written out, and read.

## At a glance

A record is a single object. Its keys come from the **sections** declared in the
record's schema, and each section's value follows the section's *kind*: a `single`
section is an **object**, a `multi` section is an **array** of records.

A schema with one section — the `fields:` form, or `sections:` with a single one —
has a flat record, fields at the top level:

```yaml
title: "Rust 101"
summary: "Learn Rust from scratch"
published: 2026-05-01
```

A schema with more than one section is written **by section**, each section under
its own name:

```yaml
identity:                    # a `single` section → object
  title: "Rust 101"
  published: 2026-05-01

modules:                     # a `multi` section → array (index = order)
  - title: "Getting Started"
    lessons:                 # a nested section → an inline field of child records
      - { title: "Install" }
      - { title: "Hello World" }
  - title: "Going Deeper"
    lessons:
      - { title: "Macros" }
```

Sections become object keys; their kind decides whether the value is an object or
an array; a nested section (a child section declared under a parent) becomes an
**inline field** on the parent's records.

Only a schema with one section is written flat. In any other, every field goes under
the name of its section — a field written at the top of such a record stops the build
and a push, with a message that names the section it belongs in. A section is a
namespace: two sections may declare fields of the same name.

## What a component receives

A record reaches a component in one of two shapes — the same on a static site and on
one whose records come from a backend. The component's section type says which it
expects, per `content.data` key, in its `meta.js`
([Component Metadata → Briefs or whole records](./component-metadata.md#briefs-or-whole-records)):

- **A brief**, the default — `data: { articles: '@std/article' }`: the fields of the
  schema's **brief** — the section marked `brief: true`, else the first `single`
  section — at the top of the record. The brief section is not named.
- **The record whole** — `data: { articles: '@std/article/*' }`: the record as it is
  stored, each section under its own name, the brief's included.

Both carry `$name`, the record's name ([below](#names)), and a reference as the
record it points at, reduced to its brief: `{ entity, brief }`, `entity` being that
record's id where it has one.

```js
// records/std/article/hello.md as a brief — '@std/article'
{ $name: 'hello', title: 'Hello', date: '2026-05-01' }

// the same record whole — '@std/article/*'
{
  $name: 'hello',
  brief: { title: 'Hello', date: '2026-05-01' },   // the card, under its section's name
  body: { content: { type: 'doc', … } },           // the markdown body
}
```

Neither shape mixes the two: a brief holds one section's fields, a whole record holds
sections. That is what lets a brief field share its name with a section — `details`
the field, `details.pages` the section.

A schema of one section — the `fields:` form — has a brief that is the whole record:
its fields at the top as a brief, and under `brief` whole, so a component reading
such records has no need of `/*`. A schema with no brief (only `multi` sections) is
answered whole, even as a brief.

**What each key gets.** A list carries briefs, or each record whole for a key declared
`/*`. A [parametric page](./dynamic-routes.md) receives its record as its component
declares: the brief its query's list holds, or the record whole from its own source.
A key declared `/*` whose source cannot answer one record whole is `null`. Records of
an [external query](./queries.md#external-queries) have no schema, and so no brief:
they arrive as their source answers them.

## Sections and nesting

A schema's sections form a tree. Each section's kind determines its shape in a record:

| Kind | Shape in the record | Example |
|---|---|---|
| `single` | **object** | `identity: { title: "…" }` |
| `multi` | **array** of records; index = order | `modules: [ { … }, … ]` |
| `binder` | **object** whose keys are its child sections (organizational; no fields of its own) | `contributions: { publications: [ … ] }` |

**A nested section is an inline field.** When a section declares child sections,
each child appears as an inline field on the parent's record(s), keyed by the child
section's name — so a single parent declaring a multi child looks like
`parent: { childMulti: [ …records… ], …other parent fields… }`. Cross-section
parent/child relationships are **pure structure** — no back-references, no path
bookkeeping. The data tree mirrors the schema tree.

## Field values

Field values are the data you actually write. They follow the schema's field types
(see [Data Schemas](../development/data-schemas.md) for the full type catalogue) —
no wrappers, no encoding:

| Field type | Value shape |
|---|---|
| `string`, `text`, `int`, `decimal`, `bool` | The raw value |
| `text` with `format: markdown` / `html` | The raw source string (a rich-content body) |
| `date`, `datetime` | ISO-8601 string (e.g. `2026-05-01`, `2026-05-01T12:00:00Z`) |
| `file` | A path or URL to the file |
| `array` (of scalars) | The native array (`[a, b, c]`) |
| `ref` | The name of the record it points at ([Names](#names)); a list of names for a `many` reference |
| A `localized` field of any text kind | `{ <locale>: value }` — e.g. `title: { en: "Hello", fr: "Bonjour" }` |

For a localized field you can write the value as a bare string in your source file
(in the site's source locale); translations live in the `locales/` folder (see
[Internationalization](../development/internationalization.md)).

## Names

Every record has a **name**, unique within its schema, which a component reads as
`$name`: the file's name without its extension — or, for a BibTeX entry, its cite key.
It is what a `[slug]` [parametric page](./dynamic-routes.md) matches, and what a `ref`
field points at. A file holds one record, and nothing inside it renames the record: a
`slug:` key at its top, or a list of records, stops the build — to rename a record,
rename its file. The record a component receives carries its name as `$name` only; a
`slug` inside a section is one of that section's fields, the author's data like any
other.

## Per-format authoring

The same structure, four authoring formats.

### YAML

```yaml
# records/product/widget-x.yml    → slug "widget-x"
title: "Widget X"
price: 9.99
published: 2026-04-12
```

### JSON

```json
{
  "title": "Widget X",
  "price": 9.99,
  "published": "2026-04-12"
}
```

### Markdown (frontmatter + body)

```markdown
---
title: "Hello, World"
published: 2026-04-12
---

# Welcome

The body becomes the value of the schema's content field.
```

The frontmatter is the record's data, written flat or by section like any other
record; the body is the value of the schema's **content field** — a `markdown` field,
which holds the markdown source, or a `richtext` one, which holds it as a rich
document — in whichever section declares it. `@std/article` declares `content` in its
`body` section:

```markdown
---
brief:
  title: "Hello, World"
  date: 2026-04-12
---

# Welcome

The body is `body.content`.
```

### BibTeX

The entry's **cite key** is its slug:

```bibtex
@article{smith2026,
  title  = {On Rust traits},
  author = {Smith, A.},
  year   = {2026},
}
```

## Relationship to data-schemas

A data-schema and a record of that type share their **shape**. The schema is the
*typed skeleton*; the record fills it in with values. Reading a schema, you can
predict what a record looks like; reading a record, you can read the schema's tree
out of it. When you change a schema, records evolve along the same tree — that's the
value of the mirroring.

```yaml
# schema — foundation/schemas/course.yml
name: course
sections:
  identity:
    kind: single
    brief: true
    fields:
      title: { type: string }
  modules:
    kind: multi
    fields:
      title: { type: string }
    sections:
      lessons:
        kind: multi
        fields:
          title: { type: string }
```

```yaml
# a record of that schema
identity: { title: "Rust 101" }
modules:
  - title: "Getting Started"
    lessons:
      - { title: "Install" }
```

## Restrictions

- **Within a section**, no field key may equal one of the section's child-section
  names — a name refers to either a field or a child section, never both.
- A slug is **unique within its schema**.
