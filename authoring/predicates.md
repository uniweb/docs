# Predicates and Saved Views

When you want to show only *some* of a query's records — only featured articles, only members from one department, only events after a date — you write a **predicate** in the `where:` field of a fetch declaration. Predicates are structured YAML objects: no special grammar to learn beyond the field-name → value pattern you already use in frontmatter.

This guide covers the predicate format, the patterns for reusing predicates as saved views, and how foundations build filter UIs that compose predicates from reader interactions.

---

## The simplest predicate

A predicate is a YAML object whose top-level keys are field names. Bare values are matched as equality. Multiple keys are combined with implicit AND:

```yaml
# pages/blog/page.yml
data: articles
fetch:
  query: articles
  where:
    published: true
    category: news
```

This delivers articles where `published == true` AND `category == 'news'`.

The same predicate works on any fetch declaration — block frontmatter, page-level, folder-level, site-level. It also works against any source: the site's own compiled records, a local JSON file, a remote URL.

---

## Operators for non-equality

When you need more than equality, the value becomes a small object naming the operator:

```yaml
where:
  rank: { in: [associate, full] }       # value is in the list
  start_year: { gte: 2010 }             # ≥ comparison
  status: { nin: [draft, archived] }    # value is NOT in the list
  email: { exists: true }               # field is present
```

Operators come in three tiers. The first is what nearly every predicate needs and what
every source — the built records, a backend that answers queries — evaluates identically.
Reach for the others knowingly.

**The spine.** Equality, comparison, membership, presence:

| Operator | Meaning | Example |
|---|---|---|
| `eq` | Equal (also implicit when the value is bare) | `{ status: { eq: 'active' } }` |
| `ne` | Not equal | `{ draft: { ne: true } }` |
| `gt`, `gte` | Greater than / greater than or equal | `{ year: { gte: 2020 } }` |
| `lt`, `lte` | Less than / less than or equal | `{ price: { lt: 100 } }` |
| `in` | Value is in the listed array | `{ tag: { in: [news, events] } }` |
| `nin` | Value is *not* in the listed array | `{ status: { nin: [draft, archived] } }` |
| `exists` | Field is truthy (boolean toggle) | `{ author: { exists: true } }` |

A bare value against a field that holds a list matches when the list *contains* it —
`{ tags: featured }` selects a record whose `tags` are `[featured, sale]`.

**Composition** — `and`, `or`, `not` — is covered below. `or` earns its place across
*different* fields (*featured or pinned*); alternatives on one field are an `in` list.

**Use knowingly.** These work on a site's own compiled records and are not something to
build a site's core queries on:

| Operator | Meaning | Example | Why it is here |
|---|---|---|---|
| `under` | Path containment, at segment boundaries | `{ path: { under: 'guides' } }` | selects a folder branch of the records. A backend that answers queries takes the branch as the query's *scope* instead |
| `like` | Glob match (`*` any run, `?` one char) | `{ name: { like: 'Dr. *' } }` | text matching a reader types belongs in **search**, not in a predicate; see [Why not `like`](#why-not-like-with-a-wildcard) |

Dotted field names (`tenure.start`) descend into a nested record and are evaluated on the
compiled records; whether a backend can evaluate one depends on that backend.

### `under` — selecting a branch of a path

Some fields hold a slash-separated location: where a record sits inside the
site's folder, a category path, a docs section. `under` matches that value **and
everything below it**, and it respects segment boundaries — so a sibling that
merely starts with the same letters is not swept in:

```yaml
where:
  path: { under: '2024' }     # matches '2024' and '2024/spring'
                              # does NOT match '2024b'
```

Plain equality selects a single level, and `under` selects that level plus its
descendants — so the pair covers both the "just here" and "everything below"
cases with no extra setting:

```yaml
where: { path: '2024' }            # only records directly at 2024
where: { path: { under: '2024' } } # 2024 and everything nested inside it
where: { path: '' }                # only records at the top level
```

An empty value is the root and contains everything, so `{ under: '' }` matches
every record — occasionally useful when the value comes from a variable.

#### Why not `like` with a wildcard?

`like` is a general string glob, not a path matcher — its `*` matches any run of
characters, **including slashes**. That makes wildcard patterns misleading on a
path field. Against records at `''`, `2024`, `2024/spring`, `2024/spring/may`,
`2024b` and `2023`:

| pattern | what it actually selects |
| --- | --- |
| `{ like: '2024/*' }` | `2024/spring`, `2024/spring/may` — misses `2024` itself |
| `{ like: '2024*' }` | those two, `2024` — **and `2024b`**, a different branch |
| `{ like: '2024/**/*' }` | **only** `2024/spring/may` — two levels or deeper |
| `{ under: '2024' }` | `2024`, `2024/spring`, `2024/spring/may` |

The one an author usually wants — a branch *and* everything inside it — is not a
single glob at all. With `like` alone you would write:

```yaml
where:
  or:
    - path: '2024'
    - path: { like: '2024/*' }
```

`under` says the same thing in one clause, and it stops at segment boundaries so
a neighbour like `2024b` never sneaks in. **Use `like` for text — names, titles,
codes. Use `under` for paths.**

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

If you find yourself writing the same predicate in multiple places, save it. A saved view is just a regular set of records, where each record holds a `where:` predicate alongside human-readable metadata:

```
site/
└── entities/
    └── views/
        ├── tenured-biology.yml
        ├── recent-hires.yml
        └── professors-only.yml
```

Each file is a record:

```yaml
# entities/view/tenured-biology.yml
name: Tenured Biology
description: Tenured members of the Department of Biology.
where:
  department: biology
  tenured: true
```

Declare the query in `site.yml` like any other:

```yaml
# site.yml
queries:
  members:
    schema: '@/member'
  views:
    schema: '@/view'
```

Foundations read the views query (e.g., on a `Cover` section) to populate a dropdown. When the reader picks a view, the foundation passes that record's `where:` value to its data-fetching code. The framework treats it identically to an inline `where:` — same evaluation semantics, same backend wire format if the backend supports predicate pushdown.

There's no special framework feature for saved views. They're just records, and `where:` is just a field on each record. Authors who want curated named populations write them; foundations decide how to surface them.

---

## Queryable surfaces (filter UIs from a foundation)

For sites where readers compose their own predicates by interacting with controls — a department dropdown, a tenure toggle, a year-range slider — the **query** declares its **queryable surface**: which fields are filterable, what type each is, and any type-specific metadata (enum options, range bounds):

```yaml
# site.yml
queries:
  members:
    schema: '@/member'
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

You don't pick. The same `where: { department: biology, tenured: true }` is evaluated wherever the records come from:

- **The site's own compiled records** (`/data/<name>.json`), a plain JSON `url:`, or a host's records address — the framework fetches the set and applies the predicate in the browser. Two pages with different predicates share one fetch.
- **A host that answers queries** — the predicate travels with the query and the host returns only the matching records. Nothing changes in what you write.
- **A backend reached through a foundation transport** — the transport decides. Write only what the spine table above covers if you want the same answer everywhere.

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
  query: articles
  where: { tags: featured }
  sort: date desc
  limit: 3
```

### Active products under $100

```yaml
fetch:
  query: products
  where:
    active: true
    price: { lt: 100 }
  sort: price asc
```

### Recently joined biology faculty

```yaml
fetch:
  query: members
  where:
    department: biology
    start_year: { gte: 2020 }
```

### Anything but drafts

```yaml
fetch:
  query: articles
  where:
    not:
      status: draft
```

### Members hired in two specific departments

```yaml
fetch:
  query: members
  where:
    department: { in: [biology, geology] }
```

### Members who completed a doctorate

```yaml
fetch:
  query: members
  where:
    'education.doctorate.year': { exists: true }
```

---

## What's next

- **[Data Fetching](../reference/data-fetching.md)** — full reference for the `fetch:` declaration, including `deferred:` (lean records).
- **[Working with Collections](./collections.md)** — records and queries in depth.
- **[Connecting a Backend](../development/connecting-a-backend.md)** — when your where-objects ship over the wire instead of running locally.
