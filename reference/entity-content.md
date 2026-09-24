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

A component reads a record in one shape, whether the site is built to static files
or its records come from a backend:

- the fields of the schema's **brief** — the section marked `brief: true`, else the
  first `single` section — at the top of the record;
- every other section under its own name;
- `$name`, the record's handle ([below](#slugs)).

```js
// records/std/article/hello.md, as a component receives it
{
  $name: 'hello',
  title: 'Hello',                  // the brief, `article`, at the top
  date: '2026-05-01',
  article_body: {                  // another section, under its name
    content: { type: 'doc', … },   // the markdown body
  },
}
```

A flat record arrives as it is written. A list of records may carry only each
record's brief — a query leaves the other sections out of lists unless you say
otherwise ([Queries → `deferred`](./queries.md#deferred--fields-a-list-leaves-out)) — while the
page that shows one record receives it whole.

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
| `ref` | The referenced record's slug |
| A `localized` field of any text kind | `{ <locale>: value }` — e.g. `title: { en: "Hello", fr: "Bonjour" }` |

For a localized field you can write the value as a bare string in your source file
(in the site's source locale); translations live in the `locales/` folder (see
[Internationalization](../development/internationalization.md)).

## Slugs

Every record has a **slug** — a stable, human-readable handle, unique within its
schema. It defaults to the natural slug of the source: the filename without
extension for a YAML/JSON/Markdown file, or the cite key for a BibTeX entry. The
slug is the record's handle (`$name`), which a `[slug]` [parametric page](./dynamic-routes.md) matches, and what a `ref` field points at. Set
it explicitly with a `slug:` field (or frontmatter key) when you don't want the
filename to decide. In a record written by section, write it at the top, beside the
sections — a `slug` inside a section is one of that section's fields (`@std/article`'s
brief has one), not the handle.

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
`article_body` section:

```markdown
---
article:
  title: "Hello, World"
  date: 2026-04-12
---

# Welcome

The body is `article_body.content`.
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
