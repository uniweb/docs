# Dynamic Data Fetching

Load external data from local files or remote URLs and make it available to your components. Data can be fetched at build time (for static sites) or runtime (for dynamic content).

## Overview

The `fetch` property lets you load structured data into `content.data`. It works at four levels:

| Level | File | Who sees the data |
|-------|------|-------------------|
| **Site** | `site.yml fetch:` | Every page and section (rarely used) |
| **Folder** | `page.yml` with no sections (only sub-pages) | All pages in the route family (`index/` and `[id]/`) |
| **Page** | `page.yml` with sections on the page | All sections on that page |
| **Block** | `.md` frontmatter | That section only |

**Delivery is default-on.** A block on a page receives the data from all enclosing levels automatically as `content.data.{schema}` — no opt-in required. Components ignore keys they don't care about, the same way they ignore unused frontmatter fields. Components opt out explicitly (rarely) with `data: false` in `meta.js`.

Data cascades down: site → folder → page → block. The block-local level wins when keys collide.

The **folder level** is the canonical pattern for dynamic routes. A `page.yml` that has no `.md` files directly — only `index/` and `[id]/` sub-directories — acts as a pure data-configuration layer for the entire route family. EntityStore walks: block → page → page.parent (folder) → site config.

---

## Basic Usage

### Block-level fetch

The simplest form — load data for a specific section:

```markdown
---
type: TeamGrid
fetch:
  path: /data/team.json
  schema: team
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
data: team
```

All sections on `/about` receive `content.data.team` automatically.

### Folder-level fetch

Load data shared across an entire route family. Use this when `page.yml` has no sections directly — only `index/` and `[id]/` sub-directories:

```yaml
# pages/articles/page.yml
# (no .md sections here — this is a pure data config layer)
data: articles
```

Both `articles/index/` (the listing page) and `articles/[id]/` (the detail page) pick up this fetch automatically. This is the recommended structure for dynamic routes.

---

## Full Configuration

```yaml
fetch:
  path: /data/team.json      # Local file (under public/)
  # OR
  url: https://api.example.com/team  # Remote URL
  # OR
  query: team           # Named query, declared in queries.yml (resolves to /data/team.json)

  as: person                 # Key in content.data — must match the component's `data:` key
  merge: false               # Replace existing data (default: false)
  transform: data.items      # Extract nested path from response
  detail: rest               # Single-entity fetch for dynamic routes (optional)

  # Query operators — describe which records you want, in what order, how many.
  where: { active: true }    # Predicate (where-object); see "Queries" below
  sort: date desc            # Sort by field
  limit: 6                   # Take first N items
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `path` | — | Local file path relative to `public/` |
| `url` | — | Remote URL (mutually exclusive with `path`) |
| `query` | — | Named-query reference (mutually exclusive with `path`/`url`). Declare the query in `queries.yml` |
| `as` | *the query name, or inferred from the source* | Key under `content.data` where the data is delivered. It must **match the key the component declares** in its `meta.js` `data:` block — a component reads `content.data.<key>` by that name, so a mismatch delivers nothing. Set it only to bridge a query whose name differs from the key the component expects. *(Called `schema` before 2026-09-02 — that spelling is still accepted so existing content keeps working, and is never written. The word moved because `schema` also means the MODEL REF on a `queries` declaration.)* |
| `merge` | `false` | Combine with existing data vs replace |
| `transform` | — | Dot-path to extract from response (e.g., `data.items`) |
| `detail` | — | How to fetch a single entity on [dynamic routes](./dynamic-routes.md#detail-queries). Values: `rest`, `query`, or a custom URL pattern. `rest`/`query` build on `url`, so **its query string carries over** — [check yours](./dynamic-routes.md#the-lists-query-string-carries-over) if it narrows the response |
| `where` | — | Predicate that records must match. Where-object format (see [Queries](#queries)) |
| `sort` | — | Sort by field, e.g. `date desc` |
| `limit` | — | Take first N records |

### Schema inference

When `schema` is omitted, it's inferred from the filename:

```yaml
fetch: /data/team-members.json  # → schema: team-members
fetch: /api/events.yaml         # → schema: events
```

---

## Cascade

Data flows from site → folder → page → block. **Every block on a page receives every piece of data declared at any enclosing level**, with block-local data winning when keys collide.

```
Site fetch                      →  available everywhere
Folder fetch (parent page.yml)  →  available to all pages in the route family
Page fetch                      →  available to all sections on that page
Block fetch / tagged blocks     →  block-local, wins on key collision
```

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

### Block-level override: `fetch: { refine: true, ... }`

A block's `.md` frontmatter can borrow the parent's query and customize how the result arrives. `refine: true` tells the runtime "this isn't a new data source — it's a per-instance refinement of the ancestor's query."

```yaml
# pages/articles/[id]/2-related.md
---
type: RelatedArticles
fetch:
  refine: true    # borrow the parent's query (don't define a new URL)
  detail: false   # give me the collection minus the current item
  limit: 3        # slice to 3
---
```

See [Related Items](#related-items-pattern) for the common use.

> **Removed:** `inherit: true`, the earlier spelling of `refine: true`, is no longer accepted — the build stops with an error naming the current spelling. Rename it.

### Precedence

When a block tagged block (`yaml:pricing`) produces the same key as a cascaded fetch (`data: pricing`), the block's tagged block wins. Same for explicit block-level `fetch:` configs:

```
Block tagged blocks / block fetch  →  highest priority
Page fetch                          →  medium priority
Folder fetch                        →  lower priority
Site fetch                          →  lowest priority
```

---

## Related Items Pattern

A section on a dynamic page can receive the full collection **minus the current item** using `detail: false`. Combined with `limit`, this is the "related items" pattern:

```yaml
# pages/articles/[id]/2-related.md
---
type: RelatedArticles
fetch:
  refine: true
  detail: false
  limit: 3
---

# More articles
```

```js
// RelatedArticles/meta.js
export default {
  data: { articles: '@/article' },
  // refine: true, detail: false, and limit are set per-instance in the .md frontmatter
}
```

The component receives the related items directly in `content.data.articles` — filtered and sliced, ready to render. Because `detail: false` asks for the collection (not the focused record), the component gets the related-articles array, not a single-element one.

---

## Build-time vs Runtime

When data is fetched depends on the deployment mode of the site, not on a per-fetch flag:

- **Bundled-site builds** (`uniweb build`) emit per-page HTML; local paths (`path:`) are read at build time and embedded in the HTML payload, while remote URLs (`url:`) are fetched in the browser at runtime.
- **Shell-mode sites** ship a single HTML shell that's prerendered just-in-time by a Cloudflare worker per request; the same `fetch:` declarations are evaluated at request time.

You don't pick when fetching happens — the deployment mode does. Authoring `fetch: { path: ... }` and `fetch: { url: ... }` is the same in either mode; the framework picks the appropriate execution time.

---

## Merge vs Replace

### Replace (default)

```yaml
fetch:
  path: /data/team.json
  merge: false  # default
```

Fetched data completely replaces any existing data under that schema key.

### Merge

```yaml
fetch:
  path: /data/more-team.json
  schema: team
  merge: true
```

- **Arrays**: Concatenated (`[...existing, ...fetched]`)
- **Objects**: Shallow merged (`{ ...existing, ...fetched }`)

Useful for combining data from multiple sources.

---

## Local Files

**Prefer collections over manual JSON files.** Collections provide:
- Markdown, YAML, and JSON authoring
- Automatic i18n support
- Better content management

See [Content Collections](./content-collections.md) for the recommended approach.

### `public/data/` is generated — don't write to it

`public/data/` is where the build writes compiled collections. It is output, not a
place to author. Files you put there are overwritten without warning the moment a
collection takes the same name, and they get none of what a collection provides —
no i18n extraction, no schema validation, no per-record files, no editor support.

Data that comes out of another tool goes in a collection too: a `.json` or `.yml`
file holding a top-level array becomes one record per entry, so exporting into
`entities/<schema>/` works the same as authoring there by hand.

---

## Remote URLs

Fetch from any URL:

```yaml
fetch:
  url: https://jsonplaceholder.typicode.com/users
  schema: team
  transform: data.members
```

### Transform

Many APIs wrap data in a response envelope:

```json
{
  "status": "ok",
  "data": {
    "members": [...]
  }
}
```

Use `transform` to extract the relevant part:

```yaml
fetch:
  url: https://api.example.com/team
  transform: data.members  # Gets just the array
```

---

## Collection References

If you're using [Content Collections](./content-collections.md), there are two ways to reference collection data.

### The `data:` shorthand (recommended)

The simplest way to use collection data:

```yaml
# pages/home/teaser.md
---
type: ArticleTeaser
data: articles
---

# Latest Articles
```

This fetches from `/data/articles.json` and makes it available as `content.data.articles`. Clean and readable.

### Declaring more than one

A list declares several — each is fetched and each arrives under its own key:

```yaml
# pages/home/page.yml
title: Home
data: [team, articles]
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
  query: articles   # Fetches from /data/articles.json
  limit: 3               # Show only 3 items
  sort: date desc        # Most recent first
---

# Latest Articles
```

### When to use which

| Syntax | Use case |
|--------|----------|
| `data: articles` | Collection reference — the recommended default |
| `fetch: { query: articles, ... }` | Collection with limit, sort, filter, or other options |
| `fetch: { url: https://... }` | Remote data sources |

The `data:` shorthand is equivalent to `fetch: { query: name }` but more compact.

### Query operators on collection references

`where:`, `sort:`, and `limit:` work on collection refs the same way they work on any other fetch:

```yaml
fetch:
  query: articles
  where: { tags: featured }   # Only featured articles
  sort: date desc             # Newest first
  limit: 3                    # Take first 3
```

These options also work with `path:` and `url:` fetches:

```yaml
fetch:
  path: /data/articles.json
  sort: date desc
  limit: 5
```

See the [Queries](#queries) section below for the full where-object format and how `where:` interacts with the source's capabilities.

---

## Queries

`where:`, `sort:`, and `limit:` on a fetch declaration form a **query**: a complete description of which records you want, in what order, how many. They're not "post-processing" — they're part of the request. Whether the source evaluates them at the backend or the framework applies them as a fallback after the response arrives is a transport detail (see [Per-site transport config](#per-site-transport-config) → `supports:`).

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

  # Pattern match
  title: { like: 'Origin*' }

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
| `in` | Value is in the listed array |
| `nin` | Value is not in the listed array |
| `like` | Glob match (`*` any run, `?` one char) |
| `exists` | Field is present (truthy bool) |
| `under` | Path containment at segment boundaries — `{ path: { under: '2024' } }` matches `2024` and `2024/spring`, not `2024b` |

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
sort: date desc                # one field
sort: order asc, title asc     # multiple fields, comma-separated
limit: 10
```

These run at the source when the fetcher's `supports:` lists them; otherwise the framework applies them in JS after the response.

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

- **`/data/articles.json`** (the cascade payload that `data: articles` delivers) ships every article *without* the `body` field. List pages stay lean.
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

### Remote sources: `detailUrl:`

The above describes file-based records — the build emits per-record files at `/data/<name>/<slug>.json` for every one (markdown, YAML, or JSON) and the framework finds them automatically. For a **remote** source (a query declaring `url:`, with no per-record files on disk), the author names the per-record endpoint pattern with `detailUrl:`:

```yaml
# site.yml
queries:
  articles:
    url: /api/articles                 # collection source (remote)
    deferred: [body]
    detailUrl: /api/articles/{slug}    # how to fetch one full record
```

The `{slug}` placeholder substitutes from the dynamic-route param (entity-store auto-detail) or from `record.slug` (`useEntityDetail` hook). File-based collections leave `detailUrl:` null and use the per-record file default.

**Convention:** per-record sources are keyed by `item.slug`. The auto-detail flow on dynamic-route pages assumes the route param is `[slug]/`. Routes using other param names need an explicit author-written `detail:` value.

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
data: team
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

### Blog with remote API

```yaml
# pages/blog/page.yml
title: Blog
fetch:
  url: https://api.myblog.com/posts
  schema: posts
  transform: data.articles
```

### Site-wide config

```yaml
# site.yml
name: My Site
fetch:
  path: /data/site-config.json
  schema: config
```

```jsx
// Any component on any page — site-level fetches are delivered everywhere.
export default function Footer({ content }) {
  const config = content.data.config || {}
  return <footer>{config.copyright}</footer>
}
```

---

## Per-site transport config

Sites declare a `fetcher:` block in `site.yml`. It does two things: tune the framework default fetcher (`baseUrl` / `headers` / `envelope`) and opt into foundation-provided **named transports** per schema.

```yaml
# site.yml
fetcher:
  # Default-fetcher vocabulary — applies when no named transport handles the schema.
  baseUrl: https://api.example.com
  headers:
    X-Tenant: acme
    Accept: application/json
  envelope:
    query: data.items
    item: data.article
    error: errors.0.message

  # Capability declaration — which query operators the source evaluates natively.
  # Operators in this list are shipped to the source; operators not in it are
  # applied as a runtime fallback after the response. Default: empty.
  supports: [where, limit, sort]

  # Named-transport selection — foundation-contributed transports, picked per schema.
  transports:
    articles: uniweb          # foundation's 'uniweb' transport handles `data: articles`
    events: default           # reserved — explicitly routes back to the default fetcher
  uniweb:                       # binding config the 'uniweb' transport reads
    siteFolder: abc-123-def
```

### `supports:` — the capability declaration

The default fetcher reads `supports:` to decide whether to push down query operators or apply them locally:

- **`supports: []`** (default) — the source is treated as static (file or unaware backend). The fetcher fetches the whole collection; the framework applies `where:`, `sort:`, `limit:` in JS after the response. Two pages with different `where:` clauses share one cache entry — same fetch, different post-fetch evaluation.
- **`supports: [where]`** — the source accepts predicates. The where-object ships in the request (`?_where=<JSON>` for GET; merged into the body for POST). The cache splits per predicate.
- **`supports: [where, limit, sort]`** — full pushdown. The source returns the final result; the framework ships through.

Pushdown only applies to remote `url:` requests. Local `path:` reads are static files; operators always evaluate as a runtime fallback.

The wire format the default fetcher uses is documented in [Connecting a Backend → `supports:`](../development/connecting-a-backend.md#supports). Backends written against these conventions work with no client-side glue. Backends with a different convention need a [custom transport](./foundation-config.md#data-transports).

### How selection works

For each request:

1. If `fetcher.transports[request.schema]` is set, the dispatcher looks that name up in the registry of transports the foundation and its extensions registered. A match handles the request.
2. Otherwise, if `fetcher.transports.default` is set, that name handles every unclaimed schema.
3. Otherwise, the framework default fetcher handles it — applying `baseUrl` / `headers` / `envelope` from the same block and per-fetch `method: POST` / `body`.

No route-walking, no `match()` predicates, no silent foundation-owned routing — the site picks.

See [Connecting a Backend](../development/connecting-a-backend.md) for recipes that stay on the default fetcher (relative URLs, static headers, response envelopes, `POST /search`, GraphQL) and [Foundation Configuration → Data Transports](./foundation-config.md#data-transports) for writing and registering a custom transport.

### Secrets

Secrets do not belong in `site.yml` — values here are public to the browser. Sites that need private credentials use a same-origin proxy at the deployment layer; the site then just fetches `/api/…` and the proxy attaches the credential server-side. See [Secrets](../development/connecting-a-backend.md#secrets).

> **Planned:** a `${secrets.NAME}` interpolation syntax (resolved at request time by the deployment proxy) is under design. Not available today — same-origin proxying remains the pattern.

---

## Error Handling

If a fetch fails:
- An empty array `[]` is used as fallback
- A warning is logged during build
- The page still renders (graceful degradation)

Components should always handle the case where data might be empty.

---

## See Also

- [Dynamic Routes](./dynamic-routes.md) — Generate multiple pages from data (blogs, catalogs, etc.)
- [Content Collections](./content-collections.md) — Markdown-based data collections
- [Predicates](../authoring/predicates.md) — Author guide to where-objects and saved views
- [Connecting a Backend](../development/connecting-a-backend.md) — `supports:`, transports, dev backend, secrets
- [Content Structure](./content-structure.md) — How content is parsed and structured
- [Component Metadata](./component-metadata.md) — Full meta.js schema reference
