# Entity Content Structure

The structure every content record — a collection item, a document, any
content-as-data artifact — follows. It is **one shape across authoring and
render**: what you write in a file (YAML, JSON, Markdown frontmatter, BibTeX) is
the shape your component receives at render time.

A data-schema (see [Data Schemas](../development/data-schemas.md)) is the **typed
skeleton** of this structure: the schema describes what a record of that type looks
like; this page describes how an actual record is written out.

## At a glance

A record is a single object. Its keys come from the **sections** declared in the
record's schema, and each section's value follows the section's *kind*: a `single`
section is an **object**, a `multi` section is an **array** of records.

A simple, single-section schema produces a flat record — fields at the top level:

```yaml
title: "Rust 101"
summary: "Learn Rust from scratch"
published: 2026-05-01
```

A multi-section schema makes each section a key:

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
collection. It defaults to the natural slug of the source: the filename without
extension for a YAML/JSON/Markdown file, or the cite key for a BibTeX entry. The
slug is what a dynamic `[slug]` route matches and what a `ref` field points at. Set
it explicitly with a `slug:` field (or frontmatter key) when you don't want the
filename to decide.

## Per-format authoring

The same structure, four authoring formats.

### YAML

```yaml
# collections/products/widget-x.yml   → slug "widget-x"
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

The body becomes the value of the schema's content field (typically a `text` field
with `format: markdown`).
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
- A slug is **unique within its collection**.
