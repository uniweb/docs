# Dynamic Data Fetching

Deliver a site's records — and data from public APIs — to your components. A page names a **query**, and the framework decides where its records come from: the file a static build generates from it, a host's live records once the site is published, or an external API. Data can be fetched at build time (for static sites) or at runtime (for live content).

## Overview

The `fetch` property lets you load structured data into `content.data`. It works at four levels:

| Level | File | Who sees the data |
|-------|------|-------------------|
| **Site** | `site.yml fetch:` | Layout areas (header, footer, …) and the sections of top-level pages |
| **Folder** | `page.yml` with no sections (only sub-pages) | All pages in the route family (`index/` and `[id]/`) |
| **Page** | `page.yml` with sections on the page | All sections on that page |
| **Block** | `.md` frontmatter | That section only |

**A fetch names a query.** Queries are declared once — in `queries.yml`, or under `queries:` in `site.yml` — and a `fetch:` or its shorthand `query:` names one: `query: team`, `fetch: team` and `fetch: { query: team }` are the same declaration. Name the query and a page reads the file a local build generates from it while you develop, then the host's live records once the site is published, with nothing changed. `/data/<query>.json` is that generated file; it is never written in a `fetch:`.

**Delivery is default-on.** A block on a page receives the data from every level that reaches it automatically as `content.data.<as>` — the key the fetch's `as` names, which defaults to the query name — no opt-in required. Components ignore keys they don't care about, the same way they ignore unused frontmatter fields. Components opt out explicitly (rarely) with `data: false` in `meta.js`.

Data cascades down: site → folder → page → block. The block-local level wins when keys collide.

The **folder level** is the canonical pattern for dynamic routes. A `page.yml` that has no `.md` files directly — only `index/` and `[id]/` sub-directories — acts as a pure data-configuration layer for the entire route family. The runtime walks: block → page → parent page (folder) → site — the site for a top-level page or a layout area only (see [Cascade](#cascade)).

---

## Basic Usage

### Block-level fetch

The simplest form — a query's records for one section:

```markdown
---
type: TeamGrid
query: team
---

# Our Team

Meet the people behind the project.
```

The component receives the data in `content.data.team`.

### Page-level fetch

Load data once, share with all sections on a page. Use this when the page has `.md` section files directly inside it:

```yaml
# pages/about/page.yml
title: About Us
query: team
```

All sections on `/about` receive `content.data.team` automatically.

### Folder-level fetch

Load data shared across an entire route family. Use this when `page.yml` has no sections directly — only `index/` and `[id]/` sub-directories:

```yaml
# pages/articles/page.yml
# (no .md sections here — this is a pure data config layer)
query: articles
```

Both `articles/index/` (the listing page) and `articles/[id]/` (the detail page) pick up this fetch automatically. This is the recommended structure for dynamic routes.

---

## Full Configuration

```yaml
fetch:
  query: team                # Required: a query declared in queries.yml

  as: person                 # Key in content.data — must match the component's `data:` key

  # What this use takes of the query's records — see "Adapting a query" below.
  where: { active: true }    # Only the query's records that also match
  sort: date desc            # Put them in another order
  limit: 6                   # The first 6 of them — never more than the query selects

  current: exclude           # On a section of a parametric page — see below
  detailPage: page:b7788da4  # The page that renders one record — each record gets its `route`
  prerender: false           # Leave this fetch to the browser (see "Build-time vs Runtime")
  merge: false               # Build-time only: replace (default) or combine with the section's own data
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `query` | — | **Required.** The query to fetch, declared in `queries.yml` or under `queries:` in `site.yml`. A string where a fetch is expected is a query name: `fetch: team` is `fetch: { query: team }` |
| `as` | *the query name* | Key under `content.data` where the data is delivered. It must **match the key the component declares** in its `meta.js` `data:` block — a component reads `content.data.<key>` by that name, so a mismatch delivers nothing. Set it only to bridge a query whose name differs from the key the component expects. *(Called `schema` before 2026-09-02. ⛔ **That spelling is NOT read — the alias was removed on 2026-09-03.** A fetch authored as `schema: posts` binds to nothing and delivers no data, silently; re-author it as `as:`. The word moved because `schema` also means the MODEL REF on a `queries` declaration, and one name for both is what let a binding key silently break detail resolution.)* |
| `where` | — | Predicate the query's records must also match. Where-object format (see [Queries](#queries)). It [takes from the query's records](#adapting-a-query-where-sort-limit), never adds to them |
| `sort` | — | Put the query's records in another order, e.g. `date desc`. Without it they keep the query's order |
| `limit` | — | Take the first N of the query's records — never more than the query selects |
| `current` | `only` | On a section of a parametric page: `only`, `exclude` or `include` — see [below](#a-section-on-a-parametric-page-current) |
| `detailPage` | — | A `page:<stable_id>` reference to the page that renders one record; each record gets its `route` — see [Dynamic Routes → Linking to a record](./dynamic-routes.md#linking-to-a-record) |
| `prerender` | `true` — `false` for an [external query](#external-queries) | `false` leaves the fetch to the browser; `true` has the build fetch an external query and embed the result |
| `merge` | `false` | **Build-time only.** How a *section's* own fetch lands in its data when the build (or the dev server) executes it — see [Merge vs Replace](#merge-vs-replace). It never ships in a site's payload and no runtime reads it |

### What a fetch cannot say

A fetch names a query, and the query says where its records come from. The build stops on a fetch that tries to say it itself, and names the fix:

| written on a fetch | write instead |
|---|---|
| a path — `fetch: /data/team.json`, or `path:` | name a query over the site's records: `fetch: team` |
| `url:`, `method:`, `body:`, `transform:` | an [external query](#external-queries) that declares them, named here |
| `detail:` | `current:` on a section of a parametric page, or `record:` on an external query |
| `scope:` | the query's `scope:` |

---

## Cascade

Data flows from site → folder → page → block. **Every block on a page receives every piece of data declared at the levels that reach it**, with block-local data winning when keys collide.

```
Site fetch                      →  layout areas, and the sections of top-level pages
Folder fetch (parent page.yml)  →  available to all pages in the route family
Page fetch                      →  available to all sections on that page
Block fetch / tagged blocks     →  block-local, wins on key collision
```

**The site is the root page.** Its fetch reaches what a page's fetch would if the site were the parent of the pages directly under `pages/`: those pages — the homepage included — and the layout areas (header, footer, sidebars), which belong to the site rather than to any one page. A page further down, such as `/docs/setup`, does not receive it; a section there that needs the data names the query itself. On a top-level parametric page — `pages/[slug]/` — the site's query can be the one the URL names; see [Dynamic Routes → Which query the URL names](./dynamic-routes.md#which-query-the-url-names).

No component-side opt-in is required. A component at `/blog/[slug]` automatically sees `content.data.articles` — the full collection on the list page, and a single-element array (the matched item) on the template page.

### Declaring what your component works with (optional)

Components declare the **schema** for each `content.data` key in `meta.js` via the `data:` field. This is a **hint**, not a delivery gate — it drives the visual editor, the foundation's published metadata, and the field defaults the runtime applies to each item. Each entry's value is a named ref, an inline field map, or an inline rich-form:

```js
// src/sections/ArticleList/meta.js
export default {
  title: 'Article List',
  // 'articles' is the content.data key; '@/article' is this foundation's schema.
  data: { articles: '@/article' },
}
```

The schema supplies field defaults that the runtime applies across every item in the array. When no cascade source exists, the key stays absent — `content.data.articles === undefined` distinguishes "no source" from `[]` (empty source).

Collections are always delivered as **arrays**: the full collection on a list page, a single-element array on a `[slug]` detail page, `[]` when nothing matches. See [Dynamic Routes](./dynamic-routes.md) for the detail-page flow.

### Opting out (rare)

A component that genuinely cannot tolerate ambient data declares `data: false`:

```js
export default {
  data: false,
}
```

It then receives `content.data = {}` regardless of what the cascade produced. Used for pure layout primitives or debug components — almost never in practice.

### A section on a parametric page: `current:`

On a [parametric page](./dynamic-routes.md) — `pages/articles/[slug]/` — every section receives the one record the URL names, as a list of one. A section that wants something else names the query and says how it uses the page's record with `current:`:

| `current:` | the section receives |
|---|---|
| `only` | the record, as a list of one — the default, what every section gets without saying |
| `exclude` | the query's records without it — "related", "more articles" |
| `include` | all of them, the record among them — for a previous / next pager |

```yaml
# pages/articles/[slug]/2-related.md
---
type: RelatedArticles
fetch:
  query: articles
  current: exclude
  limit: 3        # counts the others
---
```

`current:` belongs on a section's `fetch:`, under the key the page's URL narrows. The build stops on a `current:` in `page.yml`, `folder.yml` or `site.yml`, and warns about one that nothing reads — on another key, or on a page that is not parametric. See [Related Items](#related-items-pattern) for the common use.

> **Removed:** `refine: true` and `detail: false` — write `current: exclude`. `inherit: true`, their earlier spelling, is refused the same way. The build stops with a message naming `current:`.

### Precedence

When a block tagged block (`yaml:pricing`) produces the same key as a cascaded fetch (`query: pricing`), the block's tagged block wins. Same for explicit block-level `fetch:` configs:

```
Block tagged blocks / block fetch  →  highest priority
Page fetch                          →  medium priority
Folder fetch                        →  lower priority
Site fetch                          →  lowest priority
```

---

## Related Items Pattern

A section on a parametric page can receive the query's records **without the one the page is about** using `current: exclude`. Combined with `limit`, this is the "related items" pattern:

```yaml
# pages/articles/[slug]/2-related.md
---
type: RelatedArticles
fetch:
  query: articles
  current: exclude
  where: { featured: true }   # narrows, as on any fetch
  sort: date desc
  limit: 3
---

# More articles
```

```js
// RelatedArticles/meta.js
export default {
  data: { articles: '@/article' },
  // `current:`, `where`, `sort` and `limit` are set per section in the .md frontmatter
}
```

The component receives the related items directly in `content.data.articles`, ready to render. The order of work is the query's records, then the fetch's `where` and `sort`, then remove the page's record, then `limit` — so `limit: 3` is three *other* articles, and never one the query does not select.

---

## Build-time vs Runtime

When data is fetched depends on the deployment mode of the site, not on a per-fetch flag:

- **Bundled-site builds** (`uniweb build`) emit per-page HTML; a query over the site's own records is read at build time and embedded in the HTML payload, while an [external query](#external-queries) is fetched in the browser at runtime.
- **Shell-mode sites** ship a single HTML shell that the host fills for each request; the same `fetch:` declarations are evaluated at request time.

You don't pick when fetching happens — the deployment mode does, and the same declaration works in either. The one per-fetch override is `prerender:` on a bundled build: `prerender: false` leaves a fetch to the browser, and `prerender: true` has the build call an external query.

---

## Merge vs Replace

`merge` is a **build-time option on a section's own fetch**. When `uniweb build` (or the
dev server) executes a section-level fetch, it decides whether the result replaces or
combines with data the section already holds. It is consumed there and then: the built
payload never carries it, and the runtime does not read it — a page-level or
site-level `merge` has no effect.

### Replace (default)

```yaml
fetch:
  query: team
  merge: false  # default
```

Fetched data completely replaces any existing data under that schema key.

### Merge

```yaml
fetch:
  query: team
  merge: true
```

- **Arrays**: Concatenated (`[...existing, ...fetched]`)
- **Objects**: Shallow merged (`{ ...existing, ...fetched }`)

Useful for combining fetched records with data the section declares itself, in a tagged data
block under the same key. It does not combine two fetches: of two `fetch:` entries under one key,
the first is used.

---

## Records from files

**A site's records live in `entities/`, and a query names them.** Markdown, YAML and JSON
files there are records; `queries.yml` says which of them a query returns, and a page names the
query. That gives you:
- Markdown, YAML, and JSON authoring
- Automatic i18n support
- Schema validation and editor support

See [Content Collections](./content-collections.md) for the recommended approach.

### `public/data/` is generated — don't write to it

`public/data/` is where the build writes what each query compiles to. It is output, not a
place to author, and a fetch never names a file there. Files you put there are overwritten
without warning the moment a query takes the same name, and they get none of what a record
provides — no i18n extraction, no schema validation, no per-record files, no editor support.

Data that comes out of another tool goes in `entities/` too: a `.json` or `.yml` file holding a
top-level array becomes one record per entry, so exporting into `entities/<schema>/` works the
same as authoring there by hand.

---

## External queries

A **query with `url:`** is an external query: its records come from a public JSON endpoint rather
than from the site's own records. Declare it once, beside the site's other queries, and name it
from any page:

```yaml
# queries.yml
team:
  url: https://jsonplaceholder.typicode.com/users
```

```yaml
# pages/team/page.yml
query: team
```

An external query is fetched from its own address — by the visitor's browser, unless a fetch says
`prerender: true` — and never through a host's records service; the build compiles no file for
it. A fetch adapts it like any query: its `where`, `sort` and `limit` are evaluated over the records
the endpoint returned.

| key | says |
|---|---|
| `url` | the address. Its presence is what makes the query external |
| `method`, `body` | `POST` with a JSON body, for an endpoint that takes the question in its body (GraphQL, a search endpoint). `GET` is the default |
| `transform` | a dot-path to the records in the response. It runs before `where`, `sort` and `limit` |
| `where`, `sort`, `limit` | the query's own narrowing, evaluated over the records `transform` picked |
| `record` | the request for one record in full, on a parametric page — `url`, `method`, `body`, `transform` ([below](#one-record-record)) |
| `queryable` | as on any query |

What describes the site's own records — `schema`, `scope`, `deferred`, `excerpt`, `route` — has
no meaning beside `url:`, and the build stops on it.

An external query is for **public, keyless** endpoints: every value in it reaches the browser. An
API that needs a key, headers of its own, paging, or reshaping beyond a dot-path is a foundation
transport — see [Data Sources](../development/data-sources.md).

### Transform

Many APIs wrap their records in a larger response:

```json
{
  "status": "ok",
  "data": {
    "members": [...]
  }
}
```

Use `transform` on the query to pick out the records:

```yaml
# queries.yml
team:
  url: https://api.example.com/team
  transform: data.members  # Gets just the array
```

### One record: `record:`

On a parametric page — `pages/blog/[id]/` — the record the URL names is found in the query's list.
When the list carries less than a record (an endpoint that lists summaries), `record:` names the
request for one record in full:

```yaml
# queries.yml
posts:
  url: https://jsonplaceholder.typicode.com/posts?_limit=12
  record:
    url: https://jsonplaceholder.typicode.com/posts/{id}   # `{id}` — the page's [id] segment
```

`record.url` and `record.method` default to the query's. `body` and `transform` never carry over —
a record response is rarely wrapped the way the list is — so a wrapped record says
`record.transform`. In a `url` or a `body`, the name the page's folder uses (`{id}` for `[id]`,
`{slug}` for `[slug]`) is the value from the URL. See [Dynamic Routes → Where the record comes
from](./dynamic-routes.md#where-the-record-comes-from).

> **Removed:** `fetch: { url: … }` and `fetch: { path: … }` on a page or section, and a path
> string — declare an external query, or a query over `entities/`, and name it. `transform:`,
> `method:` and `body:` moved to the query, and `detail:` (`rest`, `query`, a URL pattern,
> `{ body, envelope }`) is `record:`.

---

## Collection References

If you're using [Content Collections](./content-collections.md), there are two ways to reference collection data.

### The `query:` shorthand (recommended)

The simplest way to use collection data:

```yaml
# pages/home/teaser.md
---
type: ArticleTeaser
query: articles
---

# Latest Articles
```

This delivers the `articles` query as `content.data.articles`. On a static site it reads the file the build generates from the query; on a site a host serves, the host's live records. The declaration is the same.

### Declaring more than one

A list declares several — each is fetched and each arrives under its own key:

```yaml
# pages/home/page.yml
title: Home
query: [team, articles]
```

Sections on that page read `content.data.team` and `content.data.articles`
independently. Because [delivery is default-on](#cascade), every section on the
page receives both and ignores the keys it does not use — so one declaration at
the page level serves a page whose sections need different data.

The same works with the full syntax, where each entry takes its own options:

```yaml
fetch:
  - query: team
    sort: name
  - query: articles
    limit: 5
```

A list is available anywhere a single declaration is: `site.yml`, `folder.yml`,
`page.yml`, and section frontmatter.

> **How many requests is that?** Not your concern when authoring, and
> deliberately so. You are declaring what the page *needs*; how the data is
> retrieved is the fetcher's business. A source that can answer several queries
> in one call is free to do so, and one that cannot will fetch them in parallel.

### The `fetch:` syntax (advanced)

For more control, use the full fetch syntax with post-processing options:

```yaml
# pages/home/teaser.md
---
type: ArticleTeaser
fetch:
  query: articles        # A query declared in queries.yml
  limit: 3               # Show only 3 items
  sort: date desc        # Most recent first
---

# Latest Articles
```

### When to use which

| Syntax | Use case |
|--------|----------|
| `query: articles` | A query by name — the recommended default |
| `fetch: { query: articles, ... }` | A query adapted for this use — `limit`, `sort`, `where`, `as`, … |

A public API is a query too — an [external query](#external-queries) — named the same way.

The `query:` shorthand is equivalent to `fetch: { query: name }` but more compact. It takes a query name or a list of names — anything more is `fetch:` — and it cannot sit beside a `fetch:` at the same level. `data:`, its former spelling, is refused with a message naming `query:`.

### Adapting a query: `where:`, `sort:`, `limit:`

A fetch that names a query reuses it, and can adapt it for this one use with `where:`,
`sort:` and `limit:` — and nothing else:

```yaml
fetch:
  query: articles
  where: { tags: featured }   # Only featured articles
  sort: date desc             # Newest first
  limit: 3                    # Take first 3
```

**A query selects a set of records, and a fetch takes from that set.** The query's `scope`,
`where`, `sort` and `limit` decide which records it selects — its `limit` included: a query for
the 100 most recent articles selects those 100. A fetch's adaptations apply after the query, to
those records, so a fetch can take fewer of them and put them in another order, but it can never
add a record the query leaves out:

| On the fetch | What it does to the query's records |
|---|---|
| `where` | keeps the ones that also match |
| `sort` | puts them in another order — without it, the query's order holds |
| `limit` | takes the first N of them — never more than the query selects |

So one saved query serves many pages. With this query:

```yaml
# queries.yml
articles:
  schema: '@std/article'
  where: { published: true }
  sort: date desc
  limit: 100
```

the blog page shows all of it with `query: articles`, and the home page's
`fetch: { query: articles, where: { tags: featured }, limit: 3 }` shows the three newest
articles tagged `featured` **among those 100** — never an older one, even when fewer than
three of the 100 are featured. The same holds whether the framework evaluates the query over
the compiled file or a host that answers queries does.

**A query decides which records have pages; a fetch never does.** Under a
[dynamic route](./dynamic-routes.md), each record the query selects gets its page and no other
record does — an article older than the 100 most recent has none. A list's `limit: 3` still
leaves every one of the 100 its page. So a condition or a count that should decide which pages
exist belongs on the query.

⛔ **`scope:` is not one of them.** Which branch of the folder a query reads decides what the query
is, so it belongs on the query in `queries.yml`; the build stops on a `fetch:` that names a query
and carries a `scope:`. To read another branch, declare another query.

Within one level, two entries under one `content.data` key should not exist — `fetch: [{ query:
articles }, { query: posts, as: articles }]`. The first is used and the rest are ignored, and the
build warns.

See the [Queries](#queries) section below for the full where-object format and how `where:` interacts with the source's capabilities.

---

## Queries

`where:`, `sort:`, and `limit:` — on a query, and on a fetch that takes from one — describe **which records you want, in what order, how many**. They're not "post-processing" — they're part of the request. Who evaluates them depends on where the records come from: the framework evaluates them itself over a compiled file or an external query's response; a host that answers queries evaluates the same language at the source; a foundation transport decides for itself. The declaration is identical in every case.

### The where-object

`where:` accepts a structured JSON predicate — a "where-object". Top-level keys are field names (implicit AND across them); operators are nested objects:

```yaml
where:
  # Equality (implicit AND across keys)
  department: biology
  tenured: true

  # Comparisons (operator-object form)
  start_year: { gte: 2010 }

  # Set membership
  rank: { in: [associate, full] }

  # Text (plain, case-insensitive)
  title: { starts_with: 'origin' }

  # Boolean composition
  and:
    - { tenured: true }
    - or:
        - { rank: full }
        - { years_in_role: { gte: 10 } }
  not:
    department: emeritus
```

Operators (nested object form):

| Operator | Meaning |
|---|---|
| `eq` | Equal (also implicit when the value is bare) |
| `ne` | Not equal |
| `gt`, `gte`, `lt`, `lte` | Comparisons |
| `in` | Equal to one of the listed values |
| `not_in` | Equal to none of the listed values |
| `exists` | `true`: the field has a value — not missing, empty text or an empty list. `false`: it has none |
| `contains` | On a text, holds the value as a piece of it; on a list, holds an item equal to it |
| `starts_with`, `ends_with` | A text that starts / ends with the value |

Text operators take plain text (no wildcards) and compare regardless of case. A condition on a
list field holds when any member satisfies it. A where-object outside this language — an unknown
operator, an empty `and:` / `or:`, a text operator with empty text — stops the build; `like` and
`nin` are retired. See [Predicates](../authoring/predicates.md) for the full rules.

A branch of the site's folder is not an operator: it is the query's `scope:` — `scope: '2024'`
holds records placed in `2024` and `2024/spring`, not `2024b` — declared on the named query.
A `fetch:` that names the query cannot change it. (`where: { path: { under: … } }` is retired;
the build refuses it and names `scope:`.)

Composition keys (work at any nesting level):

| Key | Meaning |
|---|---|
| `and` | All sub-predicates match (default at the top level) |
| `or` | At least one sub-predicate matches |
| `not` | The sub-predicate does not match |

Dotted field names descend into nested objects: `tenure.start: { gte: 2015 }`.

The where-object is YAML-native (no string parsing), JSON-native for backend transport, and JS-native for the runtime fallback evaluator. Same shape, three execution sites — see [Predicates](../authoring/predicates.md) for worked examples and the saved-views pattern.

### `sort:` and `limit:`

```yaml
sort: date desc                # one field: `date`, `date asc` or `date desc`
limit: 10
```

**`sort:` names one key.** A comma-separated list (`order asc, title asc`) is refused — at
build time for compiled records, and as an error in dev for a fetched array — rather than
partly honoured. The same single key is evaluated the same way whether the framework sorts
the records itself or a provider that answers queries does:

- **Text sorts in the page's language.** `Álvarez` comes before `Zamora` on a Spanish page, and
  `apple` before `Banana` — capitals and accents only break ties between the same letters. Numbers
  inside text are not read as numbers: `item 10` sorts before `item 2`.
- **A record with no value for the key sorts last**, whichever the direction — a missing field,
  `null`, an empty text, or a list (nothing says which of its items orders the record).
- **Records that compare equal keep their order.**
- **A field holding values of different kinds** sorts booleans first, then numbers, then texts.
- **A dotted key** (`tenure.start`) sorts by a nested value; a path that meets a list gives no value.

The framework applies them in JS over the records it fetched, unless the records come from a host that answers queries — then the host applies them. Either way the same declaration, and the same single key.

---

## Deferred fields

Some collections have heavy fields — article bodies, full nested arrays, large markdown — that don't belong in every list payload. Declaring `deferred:` on a collection in `site.yml` strips those fields from the cascade JSON and emits per-record full files for on-demand fetching:

```yaml
# site.yml
queries:
  articles:
    schema: '@/article'
    deferred: [body]           # heavy fields; not shipped in the cascade
```

What this does:

- **`/data/articles.json`** (the cascade payload that `query: articles` delivers) ships every article *without* the `body` field. List pages stay lean.
- **`/data/articles/{slug}.json`** is emitted per record — the full record including the deferred fields.

How components consume the full record:

- **On dynamic-route pages** (`[slug]/`), the focused entity's full record is delivered as a **single-element array** under the collection key — `content.data.articles[0]`. The framework routes the detail fetch to the per-record file. No author config needed — the existing dynamic-route flow handles it.
- **Anywhere else**, components use the `useEntityDetail` kit hook to fetch the full record on demand. If the query has no separate detail source — nothing was stripped from it — the hook returns the record you passed in, so a component can call it unconditionally without checking first:

  ```jsx
  import { useEntityDetail } from '@uniweb/kit'

  function ArticleCard({ article }) {
    const [open, setOpen] = useState(false)
    const { data: full, loading } = useEntityDetail(open ? article : null, {
      query: 'articles',
    })
    return (
      <>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <button onClick={() => setOpen(true)}>Read more</button>
        {open && (loading ? <Spinner /> : <ArticleBody html={full.body} />)}
      </>
    )
  }
  ```

A query without `deferred:` behaves exactly as before — every field ships in the cascade payload.

### External queries: `record:`

`deferred:` is for the site's own records — the build writes the per-record files at `/data/<name>/<slug>.json` for every one (markdown, YAML, or JSON) and the framework finds them automatically. An [external query](#external-queries) cannot declare it: its list is whatever the endpoint returns. When that list carries summaries, the query names the request for one full record with [`record:`](#one-record-record), and both a parametric page and `useEntityDetail` ask it.

**Convention:** per-record files are named by the record's `slug`. On a parametric page the matched record's own slug fills `{slug}`, whatever the route's param is called, so an `[id]` page reads the same file a `[slug]` page does.

---

## Queryable surface

For sites that build filter UIs (a population dropdown, a faceted search, a date-range picker), the collection can declare its **queryable surface** — the fields a foundation can offer for filtering, with their type and type-specific metadata:

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

Foundations read this metadata via the `useQueryable` kit hook to render filter controls and compose where-objects from user interactions. The framework doesn't ship UI components — different foundations have different vocabularies; the kit exposes the metadata, foundations build the controls. See [Predicates → Saved views and queryable surfaces](../authoring/predicates.md) for the full pattern.

Field types in the starter set: `enum` (with `options:`), `boolean`, `range` (with `min`/`max`), `text`. Foundations may extend; the framework passes the metadata through as-is.

---

## Using Standard Schemas

For a shared, versioned shape, reference a standard schema from `@uniweb/schemas` by its namespace:

```bash
pnpm add @uniweb/schemas
```

```js
// src/sections/TeamGrid/meta.js
export default {
  title: 'Team Grid',
  // 'team' is the content.data key; '@std/person' is the shared standard schema.
  data: { team: '@std/person' },
}
```

The build resolves the ref and the runtime applies the schema's field defaults across each item. A ref uses Uniweb namespacing — `@std/<name>` for a shared standard (shipped in `@uniweb/schemas`), `@org/<name>` for an org's own `@org/schemas` package, `@/<name>` for one of this foundation's own `foundation/schemas/` files. See [Component Metadata → Data](./component-metadata.md#data) for all three value forms (named ref, inline field map, inline rich-form).

---

## Component Usage

```jsx
export default function TeamGrid({ content, block }) {
  // Show skeleton while data is loading
  if (block.dataLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  // Data from fetch, tagged blocks, or cascaded from page/folder
  const team = content.data.team || []

  return (
    <div className="grid grid-cols-3 gap-8">
      {team.map(member => (
        <div key={member.name}>
          <img src={member.avatar} alt={member.name} />
          <h3>{member.name}</h3>
          <p>{member.role}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Examples

### Team page with collection data

```yaml
# pages/team/page.yml
title: Our Team
query: team
```

```markdown
---
type: TeamGrid
---

# Meet the Team
```

```js
// meta.js — `data:` is optional; delivery is default-on
export default {
  title: 'Team Grid',
  data: { team: '@std/person' },
}
```

### Blog with an external API

```yaml
# queries.yml
posts:
  url: https://api.myblog.com/posts
  transform: data.articles
```

```yaml
# pages/blog/page.yml
title: Blog
query: posts
```

### Site-wide config

```yaml
# site.yml
name: My Site
query: config             # a query declared in queries.yml
```

```jsx
// A layout area's section, or a section on a top-level page — the site's fetch reaches both.
export default function Footer({ content }) {
  const config = content.data.config || {}
  return <footer>{config.copyright}</footer>
}
```

---

## Per-site transport config

`fetcher:` in `site.yml` does one thing: it opts a data key (a fetch's `as`) into a foundation-provided **named transport**, and carries the binding config that transport reads.

```yaml
# site.yml
fetcher:
  transports:
    articles: acme            # foundation's 'acme' transport handles `query: articles`
    events: default           # reserved — explicitly routes back to the default fetcher
  acme:                         # binding config the 'acme' transport reads
    baseUrl: https://api.example.com
```

### What the default fetcher does — and does not — take

With no transport selected, the framework's default fetcher handles the request: the file a static build compiles from a query, an external query's `url:` (GET, or `POST` with its `body:`) unwrapped by its `transform:`, its `record:` request for one record, and every `where:` / `sort:` / `limit:` evaluated in the browser over what arrived. A site published to a host that serves records live needs nothing more — the host stamps where its records are.

There is **no site-level vocabulary to point that fetcher at a backend of your own.** `baseUrl`, `headers`, `envelope`, `supports` and `request.*` were retired: a backend with its own base, headers, wire or query language is a **transport**, written once in the foundation (or an extension) and selected here. See [Data Sources](../development/data-sources.md) for when an external query is enough and when a transport is the answer, and [Foundation Configuration → Data Transports](./foundation-config.md#data-transports) for writing one.

### How selection works

For each request:

1. If `fetcher.transports[request.as]` is set, the dispatcher looks that name up in the registry of transports the foundation and its extensions registered. A match handles the request.
2. Otherwise, if `fetcher.transports.default` is set, that name handles every unclaimed key.
3. Otherwise, the framework default fetcher handles it.

No route-walking, no `match()` predicates, no silent foundation-owned routing — the site picks.

### Secrets

Secrets do not belong in `site.yml` — values here are public to the browser. Sites that need private credentials use a same-origin proxy at the deployment layer; the site then just fetches `/api/…` and the proxy attaches the credential server-side. See [Secrets](../development/data-sources.md#secrets).

> **Planned:** a `${secrets.NAME}` interpolation syntax (resolved at request time by the deployment proxy) is under design. Not available today — same-origin proxying remains the pattern.

---

## Error Handling

If a fetch fails:
- Its key is left **absent** from `content.data` — never `[]`, which means "no records" — and the message is on `block.dataError[key]`
- A warning is logged during build
- The page still renders (graceful degradation)

Components should handle both: `block.dataError` for a failure, and an empty list for a query that matched nothing.

---

## See Also

- [Dynamic Routes](./dynamic-routes.md) — Generate multiple pages from data (blogs, catalogs, etc.)
- [Content Collections](./content-collections.md) — Markdown-based data collections
- [Predicates](../authoring/predicates.md) — Author guide to where-objects and saved views
- [Data Sources](../development/data-sources.md) — an external query, a host's records, a transport, secrets
- [Content Structure](./content-structure.md) — How content is parsed and structured
- [Component Metadata](./component-metadata.md) — Full meta.js schema reference
