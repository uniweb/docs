# Predicates and Saved Views

When you want to show only *some* records from a collection — only featured articles, only members from one department, only events after a date — you write a **predicate** in the `where:` field of a fetch declaration. Predicates are structured YAML objects: no special grammar to learn beyond the field-name → value pattern you already use in frontmatter.

This guide covers the predicate format, the patterns for reusing predicates as saved views, and how foundations build filter UIs that compose predicates from reader interactions.

---

## The simplest predicate

A predicate is a YAML object whose top-level keys are field names. Bare values are matched as equality. Multiple keys are combined with implicit AND:

```yaml
# pages/blog/page.yml
data: articles
fetch:
  collection: articles
  where:
    published: true
    category: news
```

This delivers articles where `published == true` AND `category == 'news'`.

The same predicate works on any fetch declaration — block frontmatter, page-level, folder-level, site-level. It also works against any source: a built collection, a local JSON file, a remote URL.

---

## Operators for non-equality

When you need more than equality, the value becomes a small object naming the operator:

```yaml
where:
  rank: { in: [associate, full] }       # value is in the list
  start_year: { gte: 2010 }             # ≥ comparison
  title: { like: 'Origin*' }            # glob pattern (* wildcard)
  email: { exists: true }               # field is present
```

Available operators:

| Operator | Meaning | Example |
|---|---|---|
| `eq` | Equal (also implicit when the value is bare) | `{ status: { eq: 'active' } }` |
| `ne` | Not equal | `{ draft: { ne: true } }` |
| `gt`, `gte` | Greater than / greater than or equal | `{ year: { gte: 2020 } }` |
| `lt`, `lte` | Less than / less than or equal | `{ price: { lt: 100 } }` |
| `in` | Value is in the listed array | `{ tag: { in: [news, events] } }` |
| `nin` | Value is *not* in the listed array | `{ status: { nin: [draft, archived] } }` |
| `like` | Glob match (`*` any run, `?` one char) | `{ name: { like: 'Dr. *' } }` |
| `exists` | Field is truthy (boolean toggle) | `{ author: { exists: true } }` |

Strings use single or double quotes; numbers and booleans are bare. `null` matches missing or null fields.

---

## AND, OR, NOT

Top-level keys are combined with implicit AND. For OR or NOT, use explicit composition keys at any nesting level:

```yaml
where:
  # Implicit AND across these keys.
  published: true
  department: biology

  # Explicit OR for this one.
  or:
    - { rank: full }
    - { tenured: true }

  # Negation.
  not:
    department: emeritus
```

`and:` is also available explicitly when you need it (rare, since the top level is already AND).

Composition keys can nest:

```yaml
where:
  and:
    - { tenured: true }
    - or:
        - { rank: full }
        - { years_in_role: { gte: 10 } }
```

Means: tenured AND (rank is full OR has been in role for 10+ years).

---

## Dotted field names

For nested objects, use dotted paths:

```yaml
where:
  tenure.start: { gte: 2015 }
  address.city: Oxford
```

Each dot descends one level. Missing intermediate objects don't error — they just don't match.

---

## Saved views

If you find yourself writing the same predicate in multiple places, save it. A saved view is just a regular collection of records, where each record holds a `where:` predicate alongside human-readable metadata:

```
site/
└── collections/
    └── views/
        ├── tenured-biology.yml
        ├── recent-hires.yml
        └── professors-only.yml
```

Each file is a record:

```yaml
# collections/views/tenured-biology.yml
name: Tenured Biology
description: Tenured members of the Department of Biology.
where:
  department: biology
  tenured: true
```

Declare the collection in `site.yml` like any other:

```yaml
# site.yml
collections:
  members:
    path: collections/members
  views:
    path: collections/views
```

Foundations read the views collection (e.g., on a `Cover` section) to populate a dropdown. When the reader picks a view, the foundation passes that record's `where:` value to its data-fetching code. The framework treats it identically to an inline `where:` — same evaluation semantics, same backend wire format if the backend supports predicate pushdown.

There's no special framework feature for saved views. They're just records, and `where:` is just a field on each record. Authors who want curated named populations write them; foundations decide how to surface them.

---

## Queryable surfaces (filter UIs from a foundation)

For sites where readers compose their own predicates by interacting with controls — a department dropdown, a tenure toggle, a year-range slider — the collection declares its **queryable surface**: which fields are filterable, what type each is, and any type-specific metadata (enum options, range bounds):

```yaml
# site.yml
collections:
  members:
    path: collections/members
    queryable:
      department:
        type: enum
        label: Department
        options: [biology, physics, chemistry, geology]
      rank:
        type: enum
        label: Rank
        options: [assistant, associate, full, professor]
      tenured:
        type: boolean
        label: Tenured
      start_year:
        type: range
        label: Start year
        min: 1800
        max: 2025
```

You declare what's filterable; the foundation reads the metadata and renders the controls. When the reader picks values, the foundation composes a where-object — exactly the same shape you'd write by hand — and passes it to the framework's fetcher. The data updates without any author-side wiring.

Field types in the starter set:

| Type | Metadata | Foundation typically renders |
|---|---|---|
| `enum` | `options: [...]` | Dropdown / radio / checkbox-list |
| `boolean` | (none) | Toggle / checkbox |
| `range` | `min`, `max`, optional `step` | Slider / number-range input |
| `text` | optional `placeholder` | Text input |

Foundations may add richer types as they need them. The framework passes the metadata through unchanged — your `queryable:` declaration is the contract.

---

## Where evaluation happens

The same `where:` predicate runs in different places depending on the source's capabilities, declared by the site in `site.yml`:

```yaml
fetcher:
  baseUrl: https://api.example.com
  supports: [where, limit, sort]
```

- **`supports: [where, ...]`** — the predicate ships to the source as JSON. The backend evaluates it server-side and returns only the matching records.
- **`supports: []`** (the default) — the source is treated as static. The framework fetches the whole collection and applies the predicate in the browser.

You don't pick which path runs. The same `where: { department: biology, tenured: true }` works against a static JSON file (full collection downloaded, filtered locally) or a real backend (predicate sent in the request, only matching records returned). When you swap the deployment from "demo with static files" to "production with a backend", only the `fetcher:` block changes.

---

## What predicates can't do

The where-object format is deliberately small. It's a way to **select records**, not a general query language.

These are intentionally out of scope:

- **Aggregation.** `COUNT`, `SUM`, `AVG`, `GROUP BY`. Compute these in your component code (or in the backend) over the records the predicate returned.
- **Projection.** "Give me only the title and excerpt fields." Records always come back whole. If you want lean records on list pages, declare [deferred fields](../reference/data-fetching.md#deferred-fields) on the collection.
- **Joins.** Cross-collection references. The author embeds the relationship in the data (id references, embedded arrays).
- **Subqueries.** Predicates can compose with `and`/`or`/`not` but can't reference other queries.

If you find yourself reaching for these, the answer is usually: precompute it during the build, or compute it in your component. The predicate's job is to narrow which records arrive — that's it.

---

## Examples

### Featured articles, newest first, top three

```yaml
fetch:
  collection: articles
  where: { tags: featured }
  sort: date desc
  limit: 3
```

### Active products under $100

```yaml
fetch:
  collection: products
  where:
    active: true
    price: { lt: 100 }
  sort: price asc
```

### Recently joined biology faculty

```yaml
fetch:
  collection: members
  where:
    department: biology
    start_year: { gte: 2020 }
```

### Anything but drafts

```yaml
fetch:
  collection: articles
  where:
    not:
      status: draft
```

### Members hired in two specific departments

```yaml
fetch:
  collection: members
  where:
    department: { in: [biology, geology] }
```

### Members who completed a doctorate

```yaml
fetch:
  collection: members
  where:
    'education.doctorate.year': { exists: true }
```

---

## What's next

- **[Data Fetching](../reference/data-fetching.md)** — full reference for the `fetch:` declaration, including `supports:` (capability declaration) and `deferred:` (lean records).
- **[Working with Collections](./collections.md)** — collections in depth.
- **[Connecting a Backend](../development/connecting-a-backend.md)** — when your where-objects ship over the wire instead of running locally.
