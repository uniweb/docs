# Queries

A **query** is a named question over the site's records — or over a public JSON endpoint. Pages
and sections never read a file or a URL: they name a query, and the query says what it selects.
The same name reads the file a local build generates while you develop, and a host's live records
once the site is published, with nothing in the page changed.

This page lists everything a query can say. How a page or section uses one is
[Data Fetching](./data-fetching.md); what records are and where they come from is
[Records](./content-collections.md).

---

## Declaring queries

Queries live in `queries.yml`, a bare map at the site root — name → query:

```yaml
# queries.yml
articles:
  schema: '@std/article'
  sort: date desc

team: '@/person'          # shorthand: the string is the schema

events:                    # bare name: the schema is @/events
```

The same map can sit under `queries:` in `site.yml` instead, if you prefer one file. When both
declare a query, `queries.yml` wins, key by key.

| written | means |
|---|---|
| `events:` | a query over `@/events` — the schema takes the query's name |
| `team: '@/person'` | a query over `@/person` |
| a map | a query with the keys below |

A bare name that is not a data schema takes the type your foundation's sections declare for the
data key of the same name. With `data: { team: '@/member' }` in a section's `meta.js` and no `team`
schema, `team:` is a query over `@/member` records: pushed to a backend they are `@/member`
entities, while their files stay in `records/team/`.

A page names a query with `query: articles`, or with `fetch:` when it narrows it — see
[Data Fetching](./data-fetching.md).

---

## What a query selects: its set

A query selects a **set** of records: the records its `schema`, `scope` and `where` match, in its
`sort`, up to its `limit`. Every page and section that names the query takes from that set and
nothing else.

```yaml
# queries.yml
articles:
  schema: '@std/article'
  where: { tags: { in: [field-notes, expedition] } }
  sort: date desc
  limit: 100
```

This query's set is the 100 most recent field notes and expedition reports. Three things follow
from it:

- **A fetch can narrow the set, never widen it.** A section that asks for
  `{ query: articles, limit: 3 }` gets the first three of those 100. Its own `where`, `sort` and
  `limit` apply after the query's — see [Narrowing a query](./data-fetching.md#narrowing-a-query).
- **The set decides which records have pages.** A [parametric page](./dynamic-routes.md) whose
  URL names a record of `articles` has a URL for each of the 100, and no other: a press release, or
  a field note older than the 100 most recent, is not found there.
- **So a condition that decides which pages exist belongs on the query.** A `where` or `limit` on
  a list's fetch only changes what that list shows.

---

## Keys

A query over the site's records:

| key | says |
|---|---|
| `schema` | which records — the data schema whose records the query reads. Defaults to `@/<query name>` ([below](#schema--which-records)) |
| `scope` | a branch of the site's folder: records placed in it and below ([below](#scope--a-branch-of-the-folder)) |
| `where` | a condition the records must meet ([below](#where--which-records-match)) |
| `sort` | the order, by one field ([below](#sort--in-what-order)) |
| `limit` | how many: the first N in `sort`. `0` or absent means all of them |
| `excerpt` | how a markdown record's `excerpt` is derived ([below](#excerpt--a-records-summary)) |
| `queryable` | the fields a foundation may offer as filters ([below](#queryable--fields-a-foundation-can-filter-on)) |

A query over a public JSON endpoint — an [external query](#external-queries):

| key | says |
|---|---|
| `url` | the address. Its presence is what makes the query external |
| `method`, `body` | `POST` with a JSON body, for an endpoint that takes its question in the body. `GET` is the default |
| `transform` | a dot-path to the records in the response |
| `where`, `sort`, `limit` | the query's own set, evaluated over the records `transform` picked |
| `record` | the request for one whole record, for a parametric page |
| `queryable` | as on any query |

The build stops on a query that mixes the two: `schema`, `scope` and `excerpt` describe
the site's records and are refused beside `url:`, and `method`, `body`, `transform` and `record` are
refused without it.

---

## `schema` — which records

`schema:` names the data schema whose records the query reads. The records of a schema are the
files in `records/` under the folder the schema names:

| `schema` | its records sit in | the schema comes from |
|---|---|---|
| `@/article` | `records/article/` | the foundation's own `schemas/article` |
| `@std/person` | `records/std/person/` | the shared standard schemas, `@uniweb/schemas` |
| `@acme/project` | `records/acme/project/` | the `@acme` organization's schemas |

Leave `schema:` out when the query's name is the schema's: `events:` reads `@/events`. Any number of
queries can read one schema — that is how one set of records is shown two ways.

`schema:` here is the **Model** the records are. It is not the key a component reads them under:
that is the key the component declares in its `meta.js` `data:`, filled by a fetch whose `as`
defaults to the query name ([What a section receives](./data-fetching.md#what-a-section-receives)).

---

## `scope` — a branch of the folder

`records/folder.yml` can place records in folders ([Records → Folders](./content-collections.md#folders)).
`scope:` reads one branch:

```yaml
spring:
  schema: '@/post'
  scope: '2024'        # records in 2024 and 2024/spring — never 2024b
```

A scope holds the named folder and everything below it, at segment boundaries. A record does not
carry its folder, so a `where` cannot name one: `path` in a `where` is a field of the record's own,
like any other name. What a record's entry in `folder.yml` says about it, a query reads like any
field — `where: { $tags: featured }`, `sort: $label` ([Records → Folders](./content-collections.md#folders)).

On a parametric page, `scope: :dir` reads the branch the URL names — see
[route variables](#route-variables).

`scope` belongs to the query. Which branch a query reads decides what the query is, so a `fetch:`
that names the query cannot carry one; to read another branch, declare another query.

---

## `where` — which records match

`where:` is a **where-object**: top-level keys are field names, joined with AND; a bare value
matches by equality, and an operator is a nested object.

```yaml
where:
  department: biology                   # equality
  start_year: { gte: 2010 }             # comparison
  rank: { in: [associate, full] }       # one of a list
  title: { starts_with: 'origin' }      # text, case-insensitive
  or:
    - { tenured: true }
    - { years_in_role: { gte: 10 } }
  not:
    status: emeritus
```

| operator | holds when the field |
|---|---|
| `eq` | equals the value (also a bare value) |
| `ne` | does not equal it |
| `gt`, `gte`, `lt`, `lte` | compares greater / greater or equal / less / less or equal |
| `in` | equals one of the listed values |
| `not_in` | equals none of them |
| `exists` | `true`: has a value — not missing, `null`, empty text or an empty list (`0` and `false` are values). `false`: has none |
| `contains` | on a text, holds the value as a piece of it; on a list, holds an item equal to it |
| `starts_with`, `ends_with` | is a text starting / ending with the value |

| composition | holds when |
|---|---|
| `and: [ … ]` | every condition holds (the top level already is an AND) |
| `or: [ … ]` | at least one holds |
| `not: { … }` | the condition does not hold |

- **Text operators** take plain text, no wildcards, and ignore case.
- **Values keep their type:** `'3'` does not equal `3`.
- **A list field** meets a condition when any member does: `tags: featured` holds for
  `[featured, sale]`; `tags: { ne: featured }` holds when no member is `featured`.
- **A missing field** meets `ne`, `not_in` and `exists: false`, and nothing else.
- **A dotted key** descends into nested values: `tenure.start: { gte: 2015 }`. A step that reaches a
  list descends into each item, so `education.degree: PhD` holds when any entry has that degree.
- **A condition outside the language** — an unknown operator, an empty `and:` or `or:`, a text
  operator with empty text — stops the build. `like` and `nin` are retired: write `starts_with`,
  `ends_with` or `contains`, and `not_in`.

The same language is evaluated wherever the records come from: by the framework over a generated
file or an endpoint's response, and by a host that answers queries at the source. A
[foundation transport](./foundation-config.md#data-transports) decides for itself. Worked examples
and saved views: [Predicates](../authoring/predicates.md).

---

## `sort` — in what order

```yaml
sort: date desc        # `date`, `date asc` or `date desc`
```

`sort:` names one field. A list of fields (`order asc, title asc`) stops the build rather than being
partly honoured.

- **Text sorts in the page's language.** `Álvarez` comes before `Zamora` on a Spanish page, and
  `apple` before `Banana`. Numbers inside text are not read as numbers: `item 10` sorts before
  `item 2`.
- **A record with no value sorts last**, in either direction — a missing field, `null`, empty text,
  or a list.
- **Records that compare equal keep their order.**
- **A field holding different kinds** sorts booleans first, then numbers, then texts.
- **A dotted key** (`tenure.start`) sorts by a nested value; a path that meets a list gives no value.

---

## `limit` — how many

`limit: N` keeps the first N records in `sort`. It is part of the set: a query with `limit: 100`
has 100 records everywhere it is used — in every list that names it, and in the pages a parametric
page has. `limit: 0`, or no `limit`, keeps every record. A `limit` is a whole number: the build
stops on `limit: "5"` or `limit: -1` rather than reading either as no limit.

---

## Route variables

On a [parametric page](./dynamic-routes.md), a query can use the parts of the page's URL:

| variable | is | on `/blog/rust/2025/my-post` under `[...path]` |
|---|---|---|
| `:path` | the whole captured path | `rust/2025/my-post` |
| `:dir` | everything before the last segment | `rust/2025` |
| `:slug` | the last segment | `my-post` |

Under a one-segment folder (`[slug]`, `[id]`), `:slug` and `:path` are that segment and `:dir` is
empty. A variable is a **value** — anywhere inside `where`, or the whole of `scope` — never a key or
an operator:

```yaml
posts:
  schema: '@std/article'
  scope: :dir              # the URL's directory is the folder branch
```

**A variable with no value drops its clause.** On a page with no URL parameter, and on a URL with
no directory, `scope: :dir` reads the whole folder — so one query serves a query page and its
parametric page alike. Only `:path`, `:dir` and `:slug` are variables. See
[Parametric Pages → Multi-segment routes](./dynamic-routes.md#multi-segment-routes--path).

---

## `excerpt` — a record's summary

A markdown record gets an `excerpt` field. The query says how it is derived:

```yaml
articles:
  schema: '@/article'
  excerpt:
    maxLength: 200         # characters; default 160
    field: description     # use this frontmatter field when the record has it
```

The first of these that exists, cut to `maxLength`: the record's own `excerpt:`, the field `field`
names, then the body's plain text, cut at a word boundary with `...`.

---

## What a list carries

A list carries each record's **brief** ([Entity Content → What a component receives](./entity-content.md#what-a-component-receives)),
so a field a list should leave out belongs in a section of its own, outside the brief —
`@std/article`'s body is `body`, and no list carries it, on any site. A section that shows one record
in full declares whole records (`{ schema: '@std/article', whole: true }`, [Component Metadata → Briefs or whole records](./component-metadata.md#briefs-or-whole-records));
anywhere else, a component fetches one with [`useWholeRecord`](./kit-reference.md#usewholerecord).

> **Removed:** `deferred:` — the fields a static site's lists left out. A schema's brief decides
> what a list holds, on every site, and the build stops on the key.

---

## `queryable` — fields a foundation can filter on

A site that lets readers filter a list — a department dropdown, a date-range slider — declares
which fields can be filtered, with their type and type-specific details:

```yaml
members:
  schema: '@/member'
  queryable:
    department:
      type: enum
      label: Department
      options: [biology, physics, chemistry, geology]
    tenured:
      type: boolean
      label: Tenured
    start_year:
      type: range
      label: Start year
      min: 1800
      max: 2025
```

| type | details | typically rendered as |
|---|---|---|
| `enum` | `options: [...]` | a dropdown, radio buttons or a checkbox list |
| `boolean` | — | a toggle |
| `range` | `min`, `max`, optional `step` | a slider or a number range |
| `text` | optional `placeholder` | a text input |

A foundation reads the declaration with [`useQueryable`](./kit-reference.md#usequeryable) and renders
its own controls; the framework passes the declaration through as written and ships no filter UI.
See [Predicates → Queryable surfaces](../authoring/predicates.md#queryable-surfaces-filter-uis-from-a-foundation).

---

## External queries

A query with `url:` reads a public JSON endpoint instead of the site's records:

```yaml
# queries.yml
team:
  url: https://api.example.com/team
  transform: data.members    # the records sit under data.members
  sort: name
```

A page names it like any other query. Its records are fetched from the address by the visitor's
browser — or by the build, when a fetch says `prerender: true` — and never through a host's records
service; the build generates no file for it. A fetch narrows it like any query, over the records the
endpoint returned, and its records carry [`$route`](./dynamic-routes.md#linking-to-a-record) like
any others.

### `transform`

Many endpoints wrap their records:

```json
{ "status": "ok", "data": { "members": [ … ] } }
```

`transform: data.members` picks the list. It is a dot-path, not a function, and it runs before
`where`, `sort` and `limit`, which work only on a list.

### `method` and `body`

An endpoint that takes its question in the body — GraphQL, a search API — is read with `POST`:

```yaml
articles:
  url: https://api.example.com/graphql
  method: POST
  body:
    query: "{ articles { id slug title excerpt } }"
  transform: data.articles
```

### Which field the URL names: `:slug`

A `[slug]` [parametric page](./dynamic-routes.md) names a record by its `$name` — the name it has as
an entry in its folder. An external API's records are entries in no folder, so they have none: the
query binds the URL's last segment to one of their fields in its own `where`, and the page matches
that field:

```yaml
articles:
  url: https://api.example.com/articles
  where: { slug: :slug }        # the URL's last segment is each article's `slug`
  record:
    url: https://api.example.com/articles/{slug}
```

On the query's own page no URL binds `:slug`, so the clause drops and every record is listed; on the
parametric page it selects the one the URL names. The query's records link to their page by the same
field (`$route`), and a static build expands a page for each value. Only a clause whose whole value is
`:slug`, at the top of the `where`, names the field. A page routed as `[id]` needs no binding: it
matches a record's `id` field by name.

### One record: `record`

On a [parametric page](./dynamic-routes.md) the record the URL names is found in the query's list.
When the list carries less than a record — an endpoint that lists summaries — `record:` names the
request for one whole record. An external query's records have no schema, and so no brief: the page
asks `record:` whatever its component declares.

```yaml
posts:
  url: https://jsonplaceholder.typicode.com/posts?_limit=12
  record:
    url: https://jsonplaceholder.typicode.com/posts/{id}   # {id} — the page's [id] segment
```

`record.url` and `record.method` default to the query's. `body` and `transform` never carry over — a
record response is rarely wrapped the way the list is — so a wrapped record says
`record.transform`. In `record.url` and `record.body`, the name the page's folder uses — `{id}` for
`[id]`, `{slug}` for `[slug]` — is the value from the URL, and `{param}` is the same value under any
folder name. The query's own `url` and `body` are sent as written:

```yaml
articles:
  url: https://api.example.com/graphql
  method: POST
  body:
    query: "{ articles { id slug title excerpt } }"
  transform: data.articles
  where: { slug: :slug }    # a [slug] page matches each article's `slug`
  record:
    body:
      query: "query Article($slug: String!) { article(slug: $slug) { id title body } }"
      variables: { slug: "{slug}" }
    transform: data.article
```

A `{name}` with spaces inside the braces is not a placeholder, so a GraphQL selection set such as
`{ id title }` passes through unchanged.

### What an external query is for

Every value in an external query reaches the browser, so it is for **public, keyless** endpoints.
An API that needs a key or headers of its own, pages its results, or needs reshaping beyond a
dot-path is a foundation transport — see [Data Sources](../development/data-sources.md).

---

## Removed

| removed | write instead |
|---|---|
| `route:` on a query | nothing — every record carries [`$route`](./dynamic-routes.md#linking-to-a-record) |
| `detailUrl:`, `detail:` | `record: { url: … }` on an external query |
| `where: { path: { under: … } }` | `scope:` |
| `like`, `nin` | `starts_with`, `ends_with`, `contains`; `not_in` |
| a sort by several fields | one field |

The build stops on each, with a message naming the replacement.

---

## See Also

- [Data Fetching](./data-fetching.md) — naming a query from a page or section, narrowing it, and what a section receives
- [Parametric Pages](./dynamic-routes.md) — one page per record of a query
- [Records](./content-collections.md) — `records/`, its `folder.yml`, and what a compiled record holds
- [Predicates](../authoring/predicates.md) — the `where` language by example, and saved views
- [Data Sources](../development/data-sources.md) — external queries, a host's live records, and foundation transports
