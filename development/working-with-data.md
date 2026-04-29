# Working with Data

Your components need data — articles from a CMS, team members from JSON, products from an API. In a typical React app, you'd write a `useEffect`, manage loading states, handle errors, and figure out caching yourself. In Uniweb, you declare what data a page needs, and the runtime handles fetching, caching, and delivery. Your component reads it from `content.data` — no hooks, no loading logic, no cache management.

This guide covers how data flows from a fetch config to your components, how template pages pick up their parent's data automatically, and how detail queries avoid fetching a full collection when you only need one item.

> **First, know which pattern you're in.** Uniweb supports two ways a component ends up with data: the author writes a `fetch:` config and the runtime fetches (this guide), or a domain-aware component fetches its own data with standard React. If your component has to know about backend-specific things (query parameters, pagination cursors, filter shapes), you're in the second pattern — see [Component Data Patterns](./component-data-patterns.md) for which is which and when each applies.

---

## The model in one paragraph

A page either has data or it doesn't. A page with a `fetch:` or `data:` declaration is a **dynamic page** — every section on it receives that data in `content.data.{schema}`. A child page of a dynamic page with a `[param]/` folder name is a **template page** — it fills in from the URL. Both cases work without any component-side opt-in. Components read what they need from `content.data` and ignore the rest.

---

## A page that fetches data

A page declares what data it needs in `page.yml`:

```yaml
# pages/blog/page.yml
title: Blog
data: articles
```

That single line does three things:

1. References the `articles` collection (built from `collections/articles/`).
2. Makes the data available as `content.data.articles` on every section of the page.
3. Caches the result — navigating away and back doesn't re-fetch.

Your component reads it:

```jsx
// src/sections/ArticleList/ArticleList.jsx
export default function ArticleList({ content, block }) {
  if (block.dataLoading) return <DataPlaceholder />

  const articles = content.data.articles || []

  return (
    <ul>
      {articles.map(a => (
        <li key={a.slug}>{a.title}</li>
      ))}
    </ul>
  )
}
```

That's the full wiring. No `fetch()` call, no `useState`, no `useEffect`.

### Optional: declare the expected entity shape

If you want the editor to show schema hints, or want `prepare-props` to guarantee `content.data.articles` is an array, declare the entity type in `meta.js`:

```js
// src/sections/ArticleList/meta.js
export default {
  title: 'Article List',
  data: { entity: 'articles' },
}
```

This is a **declaration**, not a gate. A component without this field still receives `content.data.articles` — it just won't get the shape guarantees.

---

## Template pages: data from the parent

Here's the canonical blog setup:

```text
pages/
└── blog/
    ├── page.yml              # data: articles  ← dynamic page
    ├── list.md               # type: ArticleList
    └── [slug]/
        ├── page.yml          # (nothing about data)
        └── article.md        # type: Article
```

The `[slug]` page declares no data. It doesn't need to. The runtime walks the ancestor levels — block → page → parent page → site — looking for a fetch config. It finds `data: articles` on the parent `/blog` page, fetches it, extracts the item matching the current slug, and delivers both:

```js
content.data.articles  // [...all articles...]
content.data.article   // { slug: 'my-post', title: '...' }
```

The plural key is the full collection. The singular key (`article`, automatically singularized) is the item matching the route parameter.

No component-side opt-in. No `inherit: true`. The template page's Article component reads `content.data.article` directly.

---

## The cache makes navigation cheap

When a user visits `/blog`, the runtime fetches the articles collection and caches it. When they click through to `/blog/my-post`, the runtime finds the same articles query via the ancestor walk, hits the cache, and extracts the matching item. No second fetch. Navigating back to `/blog` — cache hit again.

The cache is keyed by query identity (URL + schema + transform), not by page. Two pages that reference the same query share one cache entry. The cache lives for the SPA session — a full page reload clears it.

---

## Detail queries: fetch one instead of all

The ancestor walk handles the common case well. But there's an edge case: what if the user lands directly on `/blog/my-post`? They bookmarked it or followed a shared link. The cache is empty — nobody visited the list page first.

Without any hint, the runtime fetches the full collection to find one item. For a blog with 20 articles and a local JSON file, that's fine. For an API returning 500 products, it's wasteful.

The `detail` field tells the runtime how to fetch just the one entity:

```yaml
# pages/blog/page.yml
title: Blog
fetch:
  url: https://api.example.com/articles
  schema: articles
  detail: rest
```

Resolution order:

1. **Collection cached?** Extract the item locally. No fetch needed.
2. **`detail` defined?** Build a single-entity URL and fetch just that one.
3. **Neither?** Fetch the full collection, cache it, extract the item.

Step 1 covers normal SPA navigation (user came from the list page). Step 2 covers direct navigation (user landed on the detail page). Step 3 is the fallback.

### URL conventions

The `detail` value tells the runtime how to construct the single-entity URL from the route parameter:

```yaml
# REST: appends the param value to the base URL
# GET /api/articles/my-post
detail: rest

# Query param: adds ?slug=my-post to the base URL
# GET /api/articles?slug=my-post
detail: query

# Custom pattern: replaces {slug} with the param value
# GET /api/article/my-post
detail: https://api.example.com/article/{slug}
```

The placeholder name (`{slug}`) comes from the dynamic route folder name (`[slug]`). If your folder is `[id]`, the placeholder is `{id}`.

### What the component sees

When data comes from a detail query, the component receives only the singular key:

```js
content.data.article   // { slug: 'my-post', title: '...' }
content.data.articles  // undefined — no collection was fetched
```

When data comes from a cached collection (the normal case), both are available:

```js
content.data.article   // { slug: 'my-post', title: '...' }
content.data.articles  // [...all items...]
```

Components that check `if (!article) return ...` work in both cases.

If you need the collection for a "related articles" section and it's not there (detail-query path), that section renders its empty state — which is the right behavior, since the user didn't come from the list.

### When to use it

`detail` is an optimization, not a requirement. It matters when:

- Your collection endpoint is expensive (slow API, large payload).
- Users frequently land directly on detail pages (shared links, search engines).
- The API supports single-entity fetches (most REST APIs do).

For local JSON files built from markdown collections, the full file is small and already on the same server. `detail` adds complexity without meaningful benefit in that case.

---

## The fetch config

Here's the full set of options available on a fetch config:

```yaml
fetch:
  path: /data/articles.json              # Local file (under public/)
  url: https://api.example.com/articles  # Remote URL (mutually exclusive with path)
  schema: articles                       # Key in content.data
  detail: rest                           # Single-entity optimization (rest | query | pattern)
  prerender: true                        # Build-time fetch (true) vs runtime-only (false)
  transform: data.items                  # Extract nested path from response
  limit: 6                               # Post-processing: take first N items
  sort: date desc                        # Post-processing: sort by field
  filter: tags contains featured         # Post-processing: filter items
```

Shorthands for common cases:

```yaml
# Collection reference — fetches /data/articles.json, schema inferred
data: articles

# Local file path — schema inferred from filename
fetch: /data/team.json

# Collection with post-processing
fetch:
  collection: articles
  limit: 3
  sort: date desc
```

---

## Per-instance overrides: block-level `fetch: { inherit: true, ... }`

Sometimes a specific block on a template page needs the data shaped differently — "give me the collection, not the matched item" (for a related-items panel), or "give me a slice." A block's `.md` frontmatter can borrow the parent's query with modifications:

```yaml
# pages/articles/[id]/2-related.md
---
type: RelatedArticles
fetch:
  inherit: true   # borrow the parent's query
  detail: false   # collection, minus the current item
  limit: 3        # slice to 3
---

# More articles
```

This is per-instance. No new URL — the runtime merges these overrides into the parent's fetch config.

---

## Putting it together: a product catalog

Here's a complete example — a product catalog backed by an external API.

**Site structure:**

```text
pages/
└── products/
    ├── page.yml
    ├── grid.md               # type: ProductGrid
    └── [id]/
        ├── page.yml
        └── product.md        # type: ProductPage
```

**Parent page config:**

```yaml
# pages/products/page.yml
title: Products
fetch:
  url: https://api.example.com/products
  schema: products
  detail: rest
  transform: data.items
```

**Component metadata:**

```js
// src/sections/ProductGrid/meta.js
export default {
  title: 'Product Grid',
  data: { entity: 'products' },
}
```

```js
// src/sections/ProductPage/meta.js
export default {
  title: 'Product Page',
  data: { entity: 'products' },
}
```

**What happens at runtime:**

| Scenario | What the runtime does |
|----------|----------------------|
| User visits `/products` | Fetches full collection from API. Caches it. ProductGrid reads `content.data.products`. |
| User clicks a product | Navigates to `/products/42`. Cache hit — extracts item. ProductPage reads `content.data.product` and `content.data.products`. |
| User lands directly on `/products/42` | Cache empty. `detail: rest` → fetches `GET /api/products/42`. ProductPage reads `content.data.product` only. |
| User then visits `/products` | Fetches full collection. ProductGrid reads `content.data.products`. |

Both components declare `data: { entity: 'products' }` as a hint — the runtime delivers the right shape for each context automatically.

---

## Opting out (rare)

A component that should never receive cascaded data — a pure layout primitive, a debug component — declares `data: false`:

```js
export default {
  data: false,
}
```

It then receives `content.data = {}` regardless of what the page declared. This is uncommon; most components just read what they want from `content.data` and ignore the rest.

---

## Custom fetchers: when the foundation owns transport

Everything above works with the framework's built-in URL fetcher — the site says `fetch: /data/articles.json` or `fetch: { url: 'https://...' }`, the runtime does a plain GET, JSON-parses the response, and hands the result to your component.

That's one point on a spectrum. The spectrum exists because foundations can sit in very different relationships to the data they render:

| Position | The foundation knows | The site declares | Typical fit |
| --- | --- | --- | --- |
| 1 — No transport | Nothing about data | URLs the default fetcher handles, or static collections | Demos, docs templates, file-backed sites |
| 2 — Transport only | Auth, base URL, envelope shape. Forwards `where:` verbatim | Whatever the backend understands | Real-world foundations that target a specific backend |
| 3 — Transport + query compiler | Parses a query language and compiles it for the backend | That language | A foundation translating between a site's DSL and a backend's native query format |
| 4 — Bundled data | Exactly what to ask and render | Minimal | Site-specific foundation; may just call `fetch()` in components |

Positions 1 and 2 are the common ones. A portable foundation that needs auth, a custom base URL, or a specific response envelope writes a fetcher — declared on `main.js` — and keeps the author-visible surface unchanged.

**The author-visible surface does not change.** Pages still write `data:` / `fetch:` in `page.yml`, components still read `content.data.{schema}`. A site can't tell whether its data came from the default URL fetcher, a foundation-supplied REST fetcher, or a platform-specific backend.

### Declaring a transport

Full reference — object shape, cache-key knobs, extension merging — lives in [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports). The minimum:

```js
// src/main.js
const myTransport = {
  async resolve(request, ctx) {
    const base = ctx.website.config?.fetcher?.myFoundation?.baseUrl
    const res = await fetch(`${base}/${request.schema}`, { signal: ctx.signal })
    if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
    return { data: await res.json() }
  },
}

export default {
  defaultLayout: 'MarketingLayout',
  transports: { myFoundation: myTransport },
}
```

The site opts in per schema:

```yaml
# site.yml
fetcher:
  transports:
    members: myFoundation        # schema → transport name
    events: default              # reserved — framework default fetcher
  myFoundation:                   # binding the transport reads
    baseUrl: https://api.example.com
```

A foundation with multiple backends exports multiple named transports (`{ members: …, catalog: …, analytics: … }`); the site picks per schema. No `match()` predicates — selection is a name lookup the site controls.

### Middleware: `@uniweb/fetchers`

Most foundations that own transport end up writing the same cross-cutting code — injecting auth headers, retrying on 401, unwrapping envelopes, adding a timeout. The `@uniweb/fetchers` package ships these as middleware primitives (`withAuth` today; more as real foundations need them). It's middleware-only — wrap your own `resolve()` to compose behavior:

```js
import { withAuth } from '@uniweb/fetchers'

const authed = withAuth(myFetcher, () => website.config?.fetcher?.apiKey)
```

### Filter state and re-rendering (not re-fetching)

Foundations often need UI state that lives outside React — a filter selector, a date range, a toggle — so it survives SPA navigation and can be read by sibling components. Uniweb provides `page.state` (scoped to the current page) and `website.state` (site-wide), with `usePageState` / `useWebsiteState` as kit bridges.

```jsx
import { usePageState } from '@uniweb/kit'

function QuerySelector() {
  const [slug, setSlug] = usePageState('selectedQuery', 'all-members')
  return (
    <select value={slug} onChange={(e) => setSlug(e.target.value)}>
      {/* ... */}
    </select>
  )
}
```

When the user picks a new filter, `page.state.set()` fires → subscribing React components re-render → they recompute from the data that's already in `content.data`. Typical pattern: the page fetches a collection once at load time, a kit-side hook or utility (e.g. `@uniweb/query`'s `resolveQuery`) narrows it in memory, and the filtered view appears.

**Changing `page.state` does not re-run the fetch.** `BlockRenderer` runs the fetch once per block lifecycle. If a component genuinely needs new data on user action — a search box, pagination, a drill-down selector — it's a **domain-aware component** that owns its own fetches using standard React (`useEffect + fetch`). See [Component Data Patterns](./component-data-patterns.md) for the two-role framing.

### When to skip a custom fetcher

- The site serves JSON from `public/data/` — the default path handles it.
- The foundation is bundled with its site and components call `fetch()` directly inside `useEffect`.
- A third-party SDK (e.g. a CMS client) handles transport entirely inside components.

The fetcher contract is worth the ceremony when your foundation targets a real backend, needs auth or a non-trivial response envelope, and is meant to serve more than one site.

---

## See also

- [Dynamic Routes](../reference/dynamic-routes.md) — Folder naming, route expansion, singularization rules.
- [Data Fetching](../reference/data-fetching.md) — Full fetch config reference, post-processing options, collection references.
- [Content Collections](../reference/content-collections.md) — Building collections from markdown.
- [Component Metadata](../reference/component-metadata.md) — The `data` field in meta.js.
- [Component Data Patterns](./component-data-patterns.md) — The two fetch roles (author-driven vs component-driven) and when to use which. Read this first if you're unsure your component should even be using `fetch:` declarations.
- [Foundation Configuration → Data Fetcher](../reference/foundation-config.md#data-fetcher) — Full `fetcher:` declaration reference (routes, fallback, `cacheKey`, `prerenderable`).
- [Kit Reference → `usePageState` / `useWebsiteState`](../reference/kit-reference.md#usepagestate--usewebsitestate) — Bridge hooks for observable state.
- [Connecting a Backend](./connecting-a-backend.md) — Recipes for the default fetcher's site-level `fetcher:` config (base URL, envelope, GraphQL / POST bodies).
- [Data Fetcher Architecture](../architecture/data-fetcher-architecture.md) — Dispatcher internals, cache keys, delivery paths, gotchas.
