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

  schema: person             # Key in content.data (default: inferred from filename)
  merge: false               # Replace existing data (default: false)
  transform: data.items      # Extract nested path from response
  detail: rest               # Single-entity fetch for dynamic routes (optional)
  limit: 6                   # Post-processing: take first N items
  sort: date desc            # Post-processing: sort by field
  filter: tags contains featured  # Post-processing: filter items
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `path` | — | Local file path relative to `public/` |
| `url` | — | Remote URL (mutually exclusive with `path`) |
| `schema` | *filename* | Key under `content.data` where data is stored |
| `merge` | `false` | Combine with existing data vs replace |
| `transform` | — | Dot-path to extract from response (e.g., `data.items`) |
| `detail` | — | How to fetch a single entity on [dynamic routes](./dynamic-routes.md#detail-queries). Values: `rest`, `query`, or a custom URL pattern |
| `limit` | — | Take first N items after filtering and sorting |
| `sort` | — | Sort by field, e.g. `date desc` |
| `filter` | — | Filter expression, e.g. `tags contains featured` |

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

No component-side opt-in is required. A component at `/blog/[slug]` automatically sees `content.data.articles` (from the folder-level fetch) and `content.data.article` (the matched item on the template page).

### Declaring what your component works with (optional)

Components can declare their expected entity shape in `meta.js`. This is a **hint**, not a delivery gate — it drives the visual editor, `schema.json`, and shape guarantees from `prepare-props`:

```js
// foundation/src/sections/ArticleList/meta.js
export default {
  title: 'Article List',
  data: {
    entity: 'articles',        // "designed for articles-shaped data"
    schemas: {                  // optional: field-level defaults and validation
      articles: {
        slug: { type: 'string', default: '' },
        title: { type: 'string', default: '' },
        excerpt: { type: 'string', default: '' },
      },
    },
  },
}
```

When `entity` is declared and the cascade delivered a match, `prepare-props` guarantees shape:

- `content.data.articles` is coerced to an array (single item wraps to `[item]`).
- On template pages, `content.data.article` exists as either the matched item or `null`.

When no cascade match exists, keys stay absent — `content.data.articles === undefined` distinguishes "no source" from `[]` (empty source).

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

> **Deprecated:** `inherit: true` is accepted as an alias for one release with a dev-mode warning, then removed. Rename to `refine: true`.

### Precedence

When a block tagged block (`yaml:pricing`) produces the same key as a cascaded fetch (`data: pricing`), the block's tagged block wins. Same for explicit block-level `fetch:` configs:

```
Block tagged blocks / block fetch  →  highest priority
Page fetch                          →  medium priority
Folder fetch                        →  lower priority
Site fetch                          →  lowest priority
```

---

## Block-Level Refine Fetch

A block's `.md` frontmatter can use `fetch: { refine: true, ... }` to **borrow the parent's fetch config** instead of introducing a new source. This lets you override specific fields per-instance:

```yaml
# pages/articles/[id]/2-related.md
---
type: RelatedArticles
fetch:
  refine: true    # borrow the parent's query — don't treat this as a new URL
  detail: false   # override: give me the collection minus the current item
  limit: 3        # override: slice to 3 items
---

# More articles
```

This is per-instance control over how the result arrives. It's a block-frontmatter override — the component side has no gate.

> **Deprecated:** `inherit: true` still works as an alias for one release with a dev-mode warning; rename to `refine: true`.

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
  data: { entity: 'articles' },
  // detail: false and limit are set per-instance in the .md frontmatter
}
```

The component receives the related items directly in `content.data.articles` — filtered and sliced, ready to render.

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

### Manual JSON files (power users)

For configuration data, companion schemas, or integration with external tools that generate JSON, you can place files directly in `public/data/`. Most users should use `library/` collections instead.

```yaml
# Reference a manual JSON file
fetch: /data/config.json
```

Both JSON and YAML are supported.

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

### The `fetch:` syntax (advanced)

For more control, use the full fetch syntax with post-processing options:

```yaml
# pages/home/teaser.md
---
type: ArticleTeaser
fetch:
  collection: articles   # Fetches from /data/articles.json
  limit: 3               # Show only 3 items
  sort: date desc        # Most recent first
---

# Latest Articles
```

### When to use which

| Syntax | Use case |
|--------|----------|
| `data: articles` | Collection reference — the recommended default |
| `fetch: { collection: articles, ... }` | Collection with limit, sort, filter, or other options |
| `fetch: { url: https://... }` | Remote data sources |
| `fetch: { path: /data/file.json }` | Manual JSON files (power-user pattern) |

The `data:` shorthand is equivalent to `fetch: { collection: name }` but more compact.

### Post-processing Options

Collection references support filtering, sorting, and limiting:

```yaml
fetch:
  collection: articles
  filter: tags contains featured   # Only featured articles
  sort: date desc                  # Newest first
  limit: 3                         # Take first 3
```

These options also work with regular `path` or `url` fetches:

```yaml
fetch:
  path: /data/articles.json
  limit: 5
  sort: date desc
```

### Post-processing Order

1. **Filter** is applied first (reduces the dataset)
2. **Sort** is applied second (orders the filtered data)
3. **Limit** is applied last (takes first N items)

### Filter Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `==` | `category == news` | Equal |
| `!=` | `draft != true` | Not equal |
| `>` | `date > 2025-01-01` | Greater than |
| `<` | `price < 100` | Less than |
| `>=` | `rating >= 4` | Greater than or equal |
| `<=` | `order <= 10` | Less than or equal |
| `contains` | `tags contains featured` | Array includes value |

---

## Using Standard Schemas

For validated, structured data, use `@uniweb/schemas`:

```bash
pnpm add @uniweb/schemas
```

```js
// foundation/src/sections/TeamGrid/meta.js
import { person } from '@uniweb/schemas'

export default {
  title: 'Team Grid',
  data: {
    entity: 'team',
    schemas: {
      team: person,  // Validate fetched data against person schema
    },
  },
}
```

The runtime applies defaults from the schema and ensures data structure.

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
  data: { entity: 'team' },
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
    collection: data.items
    item: data.article
    error: errors.0.message

  # Named-transport selection — foundation-contributed transports, picked per schema.
  transports:
    articles: uniweb          # foundation's 'uniweb' transport handles `data: articles`
    events: default           # reserved — explicitly routes back to the default fetcher
  uniweb:                       # binding config the 'uniweb' transport reads
    siteFolder: abc-123-def
```

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
- [Content Structure](./content-structure.md) — How content is parsed and structured
- [Component Metadata](./component-metadata.md) — Full meta.js schema reference
