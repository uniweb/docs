# Entity Content Structure

The structure every entity — collection record, document, or any
content-as-data artifact — follows.

It is **one structure across the whole stack**: it's what you write in an authored
file (YAML, JSON, Markdown frontmatter, BibTeX), it's the shape of records the
framework hands a component at render time, and it's the wire shape exchanged with
the Uniweb backend. The data-schemas that declare your Models (see
[`data-fetching.md`](data-fetching.md) and the schema's `sections`/`fields` keys)
are the **typed skeleton** of this structure: a schema describes what an entity of
that Model looks like; this doc describes how an actual entity is written out.

## At a glance

An entity is a single object with two kinds of keys:

- **System keys** — sigil-prefixed with `$` (e.g. `$uuid`, `$model`, `$id`). These
  carry identity, type, and other framework-managed metadata.
- **Section keys** — one per **section** declared in the entity's Model. Their
  values follow the section's *kind*: a `single` section is an **object**, a
  `multi` section is an **array** of records, a `binder` section is an object
  whose keys are its child sections.

```yaml
$uuid: "0192-course-aaaa"     # the materialized identity (added on first sync)
$id: rust-101                 # the producer-local handle (always present)
$model: "@acme/course"        # the Model this is an entity of (by name)

identity:                     # a `single` section → object (the brief)
  title: "Rust 101"
  published: 2026-05-01

modules:                      # a `multi` section → array (index = order)
  - $uuid: "0192-mod-1"
    $id: getting-started
    title: "Getting Started"
    lessons:                  # a subsection → an inline field of child records
      - { $uuid: "0192-les-1", $id: install, title: "Install" }
      - { $uuid: "0192-les-2", $id: hello,   title: "Hello World" }
  - $uuid: "0192-mod-2"
    $id: going-deeper
    title: "Going Deeper"
    lessons:
      - { $uuid: "0192-les-3", $id: macros, title: "Macros" }
```

That single example shows nearly everything. Sections become object keys; their
kind decides whether the value is an object or an array; a subsection (a child
section declared in the schema under a parent section) becomes an **inline
field** on the parent's records.

## The `$` system keys

| Key | Level | Meaning |
|---|---|---|
| `$uuid` | entity + record | The stable backend identity. Added on first sync (see *Identity* below); absent until then. |
| `$id` | entity + record | The producer-local handle. Always present; defaults to the natural slug (filename, frontmatter slug, BibTeX cite key). Survives renames; survives `$uuid` loss. |
| `$model` | entity only | The Model name (`@scope/name`). System types may carry a uuid instead. |
| `$owner` | entity only | The owner-Account claim, a uuid. Omitted when null. The backend honors or overrides per its identity-binding rules; producers usually omit it and let the backend bind. |
| `$unit` | entity only | The owning Unit claim, a uuid. Omitted when null. Same binding rules as `$owner`. |
| `$parent` | record only | A self-nesting parent reference (a same-section sibling's `$uuid`). Used only inside `self_nesting` `multi` sections. |
| `$meta` | entity + record | Free-form per-entity / per-record metadata. Omitted when empty. |

`item_date` is *not* a `$` key — it's derived by the backend from the schema's
`date_field`. There is no `$date`.

**System-key protection.** All system keys begin with `$`. Conversely, **field
keys and section names may not start with `$`**. This makes system keys
visually distinct and prevents collisions with author content.

## Sections, in detail

A Model's `sections:` is a tree. Each section has one of four **kinds** that
determines its shape in an entity:

| Kind | Shape in the entity | Example value |
|---|---|---|
| `single` | **object** | `identity: { title: "…" }` |
| `multi` | **array** of records; index = order | `modules: [ { …record… }, … ]` |
| `binder` | **object** whose keys are its child sections (organizational; no fields of its own) | `contributions: { publications: [ … ] }` |
| `multi` with `self_nesting: true` | **array** of records; hierarchy is expressed by `$parent` references between siblings (see below) | `outline: [ {…}, { $parent: "…", …}, … ]` |

**A subsection is an inline field.** When a section declares child sections, each
child appears as an **inline field** on the parent's record(s), keyed by the
child section's name. So a single-parent declaring a multi-child looks like
`parent: { childMulti: [ …records… ], …other parent fields… }`.

This means cross-section parent/child relationships are **pure structure** — no
back-references, no path bookkeeping. The data tree mirrors the schema tree.

**Self-nesting** (a `multi` section whose items form a tree *among themselves*)
is the one case where structure can't carry the relationship — siblings share a
section. They use `$parent` to point at another sibling's `$uuid`:

```yaml
outline:
  - { $uuid: "h1",  $id: ch1,   heading: "Chapter 1" }
  - { $uuid: "h1a", $id: ch1-1, $parent: "h1", heading: "1.1" }
  - { $uuid: "h1b", $id: ch1-2, $parent: "h1", heading: "1.2" }
```

Self-nesting only ever applies to a single section with itself. Different
sections never need `$parent` — the inline-field structure handles cross-section
nesting.

**Field-vs-child-section name rule.** Within a section, a field key may **not**
equal one of that section's child-section names. A name in that section
always refers to *either* a field *or* a child section, never both — the
ambiguity is rejected at schema time.

## Field values

Field values are the data your authors actually write. They follow the data-schema
field types (see [`data-fetching.md`](data-fetching.md) for the full type
catalogue). No wrappers, no encoding overhead:

| Schema type | Value shape |
|---|---|
| `string`, `text`, `richtext`, `int`, `decimal`, `bool` | The raw value |
| `date`, `datetime` | ISO-8601 string (e.g. `2026-05-01`, `2026-05-01T12:00:00Z`) |
| `entity_ref` | Either a bare uuid string, or `{ model, entity }` for cross-Model references |
| `item_ref` | The chosen option's identifier (matches the `options:` source) |
| `file` | A reference to a file blob (carried out of band) |
| `array` (of scalars) | The native array (`[a, b, c]`) |
| A `localized` field of any text kind | `{ <locale>: value }` — e.g. `title: { en: "Hello", fr: "Bonjour" }` |

For a localized field, you can write the value as a bare string in your authored
file; the framework wraps it under your `source_locale` when it submits.

## Identity — `$id` and `$uuid`

Every entity (and every record inside a `multi` section) has **two handles**, both
stable, neither transient. They serve different purposes and they coexist:

- **`$id`** — the **producer-local handle**. Always present. Defaults to the
  natural slug of the source: the filename without extension for a YAML/JSON/MD
  file, the cite key for a BibTeX entry, or an explicit `$id:` set by the author.
  An `$id` is unique within a collection. It survives renames of the surrounding
  file, and it survives loss of `$uuid` (see below).
- **`$uuid`** — the **materialized backend identity**. Absent in a newly-authored
  record. The system mints it on first sync and writes it back into the file. From
  then on, the file carries both `$id` and `$uuid`.

**The lifecycle:**

1. Author writes a new record. The file carries an `$id` (explicit or inferred); no
   `$uuid`.
2. First sync. The framework submits the record by `$id`. The backend mints a
   `$uuid` for it, stores the `(collection, $id) → $uuid` mapping, and returns the
   `$uuid` in the response.
3. The framework writes the `$uuid` back into the file, at the same level as the
   `$id`. The author commits both.
4. Subsequent syncs use `$uuid` for resolution (replace in place); `$id` rides
   along as a human-readable handle.

**Why both?** `$uuid` is what the backend matches on for in-place updates — fast,
unambiguous, rename-safe. `$id` is the safety net: if a file loses its `$uuid`
(regenerated, never committed, etc.) the framework re-submits by `$id`, the
backend resolves it from the `(collection, $id)` mapping, and you get the same
entity — no duplicate. The two together make the round-trip robust without
forcing the author to manage uuids.

**Two stale-pair rules.** If you ever ship a record where `$uuid` and `$id`
disagree with the backend's recorded pairing — for example, by hand-editing
either — the backend warns at sync time. Fix one of them and re-sync.

## Per-format conventions

The same structure, four authoring formats. In every format, `$id` is the in-file
anchor and `$uuid` is added in-place by the framework on first sync.

### YAML

```yaml
$id: widget-x                    # explicit; or inferred from the filename
title: "Widget X"
price: 9.99
published: 2026-04-12
```

After first sync, the framework prepends `$uuid:` to the same record.

### JSON

```json
{
  "$id": "widget-x",
  "title": "Widget X",
  "price": 9.99,
  "published": "2026-04-12"
}
```

### Markdown (frontmatter + body)

```markdown
---
$id: hello-world
title: "Hello, World"
published: 2026-04-12
---

# Welcome

The body is the value of the schema's body field (typically `richtext`).
```

### BibTeX

The entry's **cite key** is its `$id`. After first sync, the framework adds a
`$uuid` field inline within the entry:

```bibtex
@article{smith2026,
  $uuid  = {0192-7f3c-bbbb-cccc},
  title  = {On Rust traits},
  author = {Smith, A.},
  year   = {2026},
}
```

Authors can keep editing the cite key in their reference manager and re-export
freely; the `$id` (the cite key itself) is the stable anchor across re-imports,
and the backend resolves it back to the same `$uuid`.

## Relationship to data-schemas

A data-schema (a `@uniweb/data-schema` declaration) and an entity of that Model
share their **shape**. The schema is the *typed skeleton*; the entity fills it in
with values. Reading a schema, you can predict what an entity of that Model looks
like; reading an entity, you can read the schema's tree out of it.

```yaml
# data-schema
name: "@acme/course"
brief: identity
sections:
  - { name: identity,  kind: single, fields: [ { key: title, type: string } ] }
  - name: modules
    kind: multi
    fields: [ { key: title, type: string } ]
    sections:
      - name: lessons
        kind: multi
        fields: [ { key: title, type: string } ]
```

→ an entity:

```yaml
$uuid: "0192-aaaa"
$model: "@acme/course"
identity: { title: "Rust 101" }
modules:
  - { $uuid: "0192-mod-1", title: "Getting Started",
      lessons: [ { $uuid: "0192-les-1", title: "Install" } ] }
```

When you change a schema, the entities of that Model evolve along the same
tree — that's the value of the mirroring.

## Restrictions, recapped

- All system keys begin with `$`; **no field key or section name may start with
  `$`**.
- **Within a section**, no field key may equal one of the section's child-section
  names.
- A `$id` is **unique within its collection** (or, for a top-level entity, within
  its (acting-unit, collection) scope). Duplicates are rejected at sync.
- `$parent` only makes sense inside a `self_nesting: true` `multi` section, and
  points at another item's `$uuid` in the same section.

## Where this came from

This structure was designed as the unifying shape across authoring, render, and
sync, replacing earlier flat-item wire representations. It pairs naturally with
data-schemas, supports nesting without back-references, and gives content authors
files that are self-documenting and rename-safe.

For the wire-level details (how this travels in a `.uwx` package, how
`$id`/`$uuid` are resolved during sync, how Models are referenced by name), see
the framework's developer docs.
