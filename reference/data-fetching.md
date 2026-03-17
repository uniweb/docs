# Dynamic Data Fetching

Load external data from local files or remote URLs and make it available to your components. Data can be fetched at build time (for static sites) or runtime (for dynamic content).

## Overview

The `fetch` property lets you load structured data into `content.data`. It works at three levels:

| Level | File | Scope |
|-------|------|-------|
| **Block** | `.md` frontmatter | Available to that section's component only |
| **Page** | `page.yml` with sections on the page | Shared across all sections on that page |
| **Folder** | `page.yml` with no sections (only sub-pages) | Shared across a whole route family (`index/` and `[id]/`) |

Data cascades down: folder → page → block. Components opt into receiving cascaded data via `data.inherit` in their `meta.js`.

The **folder level** is the key pattern for dynamic routes. A `page.yml` that has no `.md` files directly — only `index/` and `[id]/` sub-directories — acts as a pure data configuration layer for the entire route family. EntityStore walks: block → page → page.parent (folder) → site config.

Site-level fetch (`site.yml fetch:`) is also supported but is rarely needed in practice — it makes data available globally to every page and section.

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

All sections on `/about` can access `content.data.team` if they opt in via `data: { inherit: true }` in their `meta.js`.

### Folder-level fetch

Load data shared across an entire route family. Use this when `page.yml` has no sections directly — only `index/` and `[id]/` sub-directories:

```yaml
# pages/articles/page.yml
# (no .md sections here — this is a pure data config layer)
data: articles
```

Both `articles/index/` (the listing page) and `articles/[id]/` (the detail page) inherit this fetch config. This is the recommended structure for dynamic routes.

---

## Full Configuration

```yaml
fetch:
  path: /data/team.json      # Local file (under public/)
  # OR
  url: https://api.example.com/team  # Remote URL

  schema: person             # Key in content.data (default: inferred from filename)
  prerender: true            # Default: true for path, false for url
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
| `prerender` | `true` for `path`, `false` for `url` | Fetch at build time (SSG) vs runtime |
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

## Data Cascading

Data flows from folder → page → block. Components must opt in to receive cascaded data.

### Component opt-in (`meta.js` — consumption declaration)

The `data:` field in `meta.js` is a **consumption declaration**, not a fetch config. It tells the runtime which cascaded data this component wants to receive. It does not define where data comes from — that's the job of the `fetch:` config in `page.yml` or the block's `.md` frontmatter.

```js
// foundation/src/sections/ArticleList/meta.js
export default {
  title: 'Article List',

  data: {
    // Walk the hierarchy to find a fetch config — accept everything found
    inherit: true,
  },
}
```

You can be selective about which schemas to accept:

```js
data: {
  inherit: ['articles', 'config'],  // Only accept these schemas
}
```

On a dynamic `[id]/` page, you can also control whether you receive the single matched item (`detail: true`, the default) or the full collection minus the current item:

```js
data: {
  inherit: true,
  detail: false,   // Give me the collection minus the current item
  limit: 3,        // Slice to 3 items
}
```

This `detail: false` + `limit` combination is the **related items pattern** — see [Related Items](#related-items-pattern) below.

> **Deprecated:** `inheritData: ['article', 'articles']` and `data: { entity: 'articles' }` are the old syntax. Use `data: { inherit: true }` instead.

### Precedence

Block data (from the `.md` frontmatter fetch or tagged blocks) takes precedence over cascaded data:

```
Block fetch / tagged blocks  →  highest priority
Page fetch                   →  medium priority
Folder fetch                 →  lower priority
Site fetch                   →  lowest priority
```

---

## Block-Level Inherit-Merge Fetch

A block's `.md` frontmatter can use `fetch: { inherit: true, ... }` to **merge** with the parent fetch config instead of replacing it. This lets you override specific fields per-instance without pointing to a new data source:

```yaml
# pages/articles/[id]/2-related.md
---
type: RelatedArticles
fetch:
  inherit: true   # don't treat this as a new URL source — merge with parent fetch
  detail: false   # override: give me collection minus current item
  limit: 3        # override: slice to 3 items
---

# More articles
```

This is per-instance control. The component's `meta.js data:` sets defaults; the `.md` `fetch:` overrides for specific instances. Block-level inherit-merge takes priority over `meta.js data:` declarations.

---

## Related Items Pattern

A section on a dynamic page can receive the full collection **minus the current item** using `detail: false`. Combined with `limit`, this is the "related items" pattern:

```yaml
# pages/articles/[id]/2-related.md
---
type: RelatedArticles
fetch:
  inherit: true
  detail: false
  limit: 3
---

# More articles
```

```js
// RelatedArticles/meta.js
export default {
  data: { inherit: true },
  // detail: false and limit are set per-instance in the .md, not here
}
```

The component receives the related items directly in `content.data.articles` — filtered and sliced, ready to render.

---

## Build-time vs Runtime

The `prerender` option controls when data is fetched. The default depends on the fetch type:

- **Local paths** (`path:`) default to `prerender: true` — the file is always available at build time
- **Remote URLs** (`url:`) default to `prerender: false` — remote fetches that fail at build time break the build; runtime fetches degrade gracefully

### Build-time

```yaml
fetch:
  path: /data/team.json
  # prerender: true (default for local paths)
```

- Data fetched during `uniweb build`
- Embedded in static HTML
- Fast page loads, SEO-friendly
- Data is snapshot at build time

### Runtime

```yaml
fetch:
  url: https://jsonplaceholder.typicode.com/posts?_limit=5
  schema: posts
  # prerender: false (default for remote URLs)
```

- Data fetched when page loads in browser
- Always fresh
- Requires JavaScript
- Good for frequently changing data

To force a remote URL to be fetched at build time, set `prerender: true` explicitly.

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
    schemas: {
      team: person,  // Validate fetched data against person schema
    },
    inherit: ['team'],
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
// meta.js
export default {
  title: 'Team Grid',
  data: {
    inherit: true,
  },
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
  # prerender: false (default for remote URLs)
```

### Site-wide config

```yaml
# site.yml
name: My Site
fetch:
  path: /data/site-config.json
  schema: config
```

```js
// Any component with data: { inherit: ['config'] }
export default function Footer({ content }) {
  const config = content.data.config || {}
  return <footer>{config.copyright}</footer>
}
```

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
