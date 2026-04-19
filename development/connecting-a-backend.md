# Connecting a Backend

Most Uniweb sites start with data in `public/data/*.json` — collections of markdown that the build turns into static JSON. That's great for blogs, docs, and marketing sites. Sometimes you need more: a base URL that varies by deploy target, a response envelope to unwrap, or a backend that takes queries in a POST body (GraphQL, `POST /search`).

You don't always need a custom foundation for this. The framework's **default fetcher** understands a small vocabulary in `site.yml fetcher:` and a couple of per-fetch extensions that cover most straightforward backends with zero code.

This guide walks through what's supported, with recipes. For the internals (dispatcher, cache keys, delivery paths) see [Data Fetcher Architecture](../architecture/data-fetcher-architecture.md).

> **Audience:** site developers wiring a real backend, or foundation authors deciding whether they need to write a custom fetcher.

> **This guide is about Role 1 — author-driven fetching.** The content author writes `fetch:` in `page.yml` and the runtime fetches for the component. If your component has its own domain knowledge (a search box, a pagination widget, a drill-down selector), it's a Role 2 component and should use standard React `useEffect + fetch` — see [Component Data Patterns](./component-data-patterns.md) for which pattern applies when.

---

## The default fetcher, today

Without any configuration, the default fetcher runs every request the dispatcher hands it. It:

- `GET`s any URL — local path under `public/`, or remote.
- Parses the JSON response.
- Applies the per-fetch `transform:` dot-path to unwrap nested data.
- Caches by query identity so SPA navigation doesn't re-fetch.

Every capability this guide describes is optional. Empty config → today's behavior, unchanged.

---

## The default fetcher vocabulary

| Setting | Where | What it does |
| --- | --- | --- |
| `baseUrl` | `site.yml fetcher:` | Prepended to relative `url:` values |
| `headers` | `site.yml fetcher:` | Static headers merged into every remote request |
| `envelope` | `site.yml fetcher:` | Response-unwrap dot-paths: collection / item / error |
| `supports` | `site.yml fetcher:` | Query operators the source evaluates natively. See [`supports:`](#supports) |
| `method: POST` | per-fetch (`page.yml` / block frontmatter) | Send request as POST |
| `body` | per-fetch | Arbitrary object serialized as JSON; supports `{slug}` substitution in strings |

General-purpose HTTP fetching for public backends and local files. Secrets are handled at the deployment layer (see [Secrets](#secrets)), not via the framework's config.

---

## Recipes

### Relative URLs with a site base

Your backend lives at one origin; author relative URLs per-fetch:

```yaml
# site.yml
foundation: '@starter/docs'

fetcher:
  baseUrl: https://api.example.com
```

```yaml
# pages/articles/page.yml
data: articles

fetch:
  url: /articles           # resolves to https://api.example.com/articles
  schema: articles
```

Absolute URLs (`https://…`) and protocol-relative URLs (`//cdn/…`) pass through unchanged, so one fetch config can mix backend calls and CDN reads freely.

### Static headers (tenant routing, accept types)

Some backends route by header or need specific content negotiation:

```yaml
# site.yml
fetcher:
  baseUrl: https://api.example.com
  headers:
    X-Tenant: acme
    Accept: application/vnd.example+json
```

Every remote request from this site includes these headers. Local `public/data/*.json` requests aren't decorated — they're just file reads.

Headers set here are visible to browsers (they ride on every outgoing request). Use them for non-secret values: tenant identifiers, API versioning, content negotiation. For anything that has to stay private, see [Secrets](#secrets).

### Response envelopes: `{ data: { items: [...] } }`

Many APIs wrap collections. A per-fetch `transform:` handles one case; a site-level `envelope:` handles every case:

```yaml
# site.yml
fetcher:
  baseUrl: https://api.example.com
  envelope:
    collection: data.items
    item: data.article
    error: errors.0.message
```

- `envelope.collection` — applied to collection responses. A per-fetch `transform:` still wins when both are set.
- `envelope.item` — applied to detail responses (single-entity fetches via `detail:`).
- `envelope.error` — on non-2xx, extract a human error from the response body. Falls back to `HTTP <status>: <statusText>` if the path isn't in the body.

### `POST /search` with a filter body

Some REST APIs take complex queries in a POST body:

```yaml
# pages/products/page.yml
fetch:
  url: /search/products
  method: POST
  body:
    filter:
      status: published
      tags: featured
    sort: { created: desc }
    limit: 10
  envelope: { collection: data.results }
```

The framework JSON-serializes `body:` and sets `Content-Type: application/json`. Your component reads `content.data.products` — no component-side change from the GET case.

### GraphQL — collection and detail queries

GraphQL always uses POST with a query body. Point `baseUrl` at the endpoint and write queries per-fetch:

```yaml
# site.yml
fetcher:
  baseUrl: https://api.example.com/graphql
```

```yaml
# pages/articles/page.yml
data: articles

fetch:
  url: ""                  # empty — the baseUrl IS the endpoint
  method: POST
  body:
    query: |
      query Articles {
        articles { id slug title excerpt }
      }
  envelope: { collection: data.articles }

  # Detail fetch for /articles/[slug] — object form of detail: carries its
  # own body with {slug} substitution from the route param.
  detail:
    body:
      query: |
        query Article($slug: String!) {
          article(slug: $slug) { id title body }
        }
      variables: { slug: "{slug}" }
    envelope: { item: data.article }
```

The `{slug}` in `variables.slug` is substituted from the dynamic-route context. GraphQL selection sets like `{ id slug title }` are *not* substituted — the placeholder matcher is strict about `{name}` with no whitespace, so `{ id }` stays literal.

### Hybrid: local collections + one remote API

A site can mix static JSON and a remote backend freely:

```yaml
# site.yml
fetcher:
  baseUrl: https://api.example.com

collections:
  articles:
    path: collections/articles   # markdown → public/data/articles.json
```

```yaml
# pages/blog/page.yml        → reads the local markdown collection
data: articles

# pages/live-stats/page.yml  → hits the remote API
fetch:
  url: /stats/live             # resolves via baseUrl
  schema: stats
```

No special flag. `path:` (local) and `url:` (remote) are already mutually exclusive per fetch, and the default fetcher handles both.

---

## `supports:`

When your backend can evaluate query operators (`where:`, `limit:`, `sort:`) at the source, declare what it supports. The framework will ship those operators in the request instead of fetching everything and filtering in the browser:

```yaml
# site.yml
fetcher:
  baseUrl: https://api.example.com
  supports: [where, limit, sort]
```

What changes per operator-set:

- **`supports: []`** (default) — every operator is applied as a runtime fallback in JS. The framework fetches the whole collection; predicates and sorts run client-side. Two pages with different `where:` clauses share one cached fetch.
- **`supports: [where]`** — only `where:` is shipped to the source. `limit:` and `sort:` continue to run client-side.
- **`supports: [where, limit, sort]`** — full pushdown. The source returns the final result; the framework caches it and ships through.

Pushdown only applies to remote `url:` requests. Local `path:` reads are static files; operators always evaluate as a runtime fallback.

### Wire-format conventions (default fetcher)

Backends written against these conventions work with no client-side glue. The defaults:

**GET pushdown** — appended as URL query parameters with an underscore prefix to avoid collision with any backend-specific params already in `url:`:

| Operator | Wire format |
|---|---|
| `where` | `?_where=<URL-encoded JSON of the where-object>` |
| `limit` | `?_limit=N` |
| `sort` | `?_sort=field:dir` (matches the author-facing `date desc` form, comma-separated for multi-key) |

Example: `GET /api/articles?_where=%7B%22tags%22%3A%22featured%22%7D&_limit=3&_sort=date%3Adesc`

**POST pushdown** — operators are merged into the request body alongside any author-supplied body fields:

```http
POST /api/articles
Content-Type: application/json

{
  "where": { "tags": "featured" },
  "limit": 3,
  "sort": "date:desc"
}
```

When the author already supplied a body (e.g., a GraphQL request), the operators are merged in as top-level keys (`where`, `limit`, `sort`). String bodies pass through unchanged — operators are dropped and a deprecation note in the source recommends using object bodies for pushdown.

### Backend doesn't match these conventions?

Two options:

- **Adapt at the proxy** — your same-origin proxy translates the framework's `?_where=…&_sort=…` shape into your backend's native query language. Often a few lines of code.
- **Write a custom transport** — a foundation-level transport with its own `resolve()` and (optionally) its own `cacheKey()`. Most foundations don't need this; reach for it when the wire format gap is wider than a proxy can bridge. See [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports).

---

## Local dev backend

For testing `supports:` end-to-end without standing up a real backend, the framework ships a tiny Node script that boots an HTTP server reading YAML/JSON collections from disk. It implements the default fetcher's wire-format conventions, so you can develop a site against a "real" backend running on `localhost`:

```bash
node scripts/framework/dev-backend.js \
  --collections path/to/site/collections \
  --port 8080
```

Point the site at it:

```yaml
# site.yml
fetcher:
  baseUrl: http://localhost:8080
  supports: [where, limit, sort]
```

And rewrite your collection refs to URLs:

```yaml
# pages/articles/page.yml
fetch:
  url: /api/articles
  schema: articles
```

The dev backend exposes `GET /api/<collection>`, `GET /api/<collection>/<slug>`, and `POST /api/<collection>` — same surface a real backend would expose against the framework's conventions. Predicates evaluate via the same `matchWhere` evaluator the runtime uses as a fallback. Switch back to the static-file mode by setting `supports: []` and removing the `--port` server; nothing else in your site changes.

---

## Filter state without re-fetching

A common pattern: the site fetches a collection once, then the reader picks a filter. The filtered view updates without a new network request. This is **entirely client-side** when `supports:` doesn't include `where` — the fetch runs once, the foundation reads `page.state` for the active filter and narrows the already-loaded data using `matchWhere` from `@uniweb/core`:

```jsx
import { matchWhere } from '@uniweb/core'
import { usePageState } from '@uniweb/kit'

function FilteredList({ content }) {
  const [filter] = usePageState('activeFilter', null)
  const all = content.data.articles || []
  const visible = filter ? matchWhere(filter, all) : all
  return <ArticleGrid items={visible} />
}
```

When `supports: [where]` is on, the same pattern applies — the foundation passes the predicate to `useFetched` instead, and the framework re-fetches the matching subset on each change. Author-side declarations don't change; only the foundation's component code differs.

Components that genuinely need to compose dynamic predicates from rich UI (search boxes, faceted navigation) use the kit's `useFetched` hook with a request spec that includes the live predicate — the cache key includes the predicate, so the framework re-fetches automatically. See [Component Data Patterns](./component-data-patterns.md).

---

## Secrets

Nothing in `site.yml` is private. The framework either embeds its config into built HTML (static builds) or has it injected into `__DATA__` at serve time (dynamic) — either way, the browser sees it. A site that puts a real API key in `site.yml fetcher.headers:` is publishing that key.

So the default fetcher doesn't have a secrets channel. Instead, the pattern is **same-origin proxying**:

- The site fetches `/api/articles` — a URL on its own origin.
- Something between the browser and the upstream backend (an edge worker, a backend service, the Uniweb platform's own proxy) intercepts that request, attaches the real credential server-side, and forwards it upstream.
- The site config only ever contains `url: /api/articles`. The secret never leaves the server.

On the Uniweb platform, this is how private-backend sites work. The platform's deployment pipeline stores credentials keyed to the site (e.g. in a platform-level `secrets.yml` that the edge worker reads); the edge worker proxies matching paths through with credentials attached. The framework is uninvolved — it just sees a plain URL.

For self-hosted deployments, the same pattern applies: put whatever you already use (a Cloudflare Worker, a reverse proxy, a small Node backend) in front of the site, and let the site fetch same-origin.

**Publishable tokens** (Mapbox public, Algolia search-only, Stripe publishable) are a different category entirely. They're designed to be sent from browsers; no need for a proxy. Put them in `headers:` or directly in URLs. They're only called "tokens" — for architectural purposes they're public data.

> **Planned:** a `${secrets.NAME}` interpolation syntax — where `site.yml` references a secret by name and the deployment proxy substitutes the real value at request time — is under design. The goal is to keep the simple posture (browser never sees secrets) while letting `site.yml` express which secret each request needs. Not available today; same-origin proxying remains the pattern.

---

## When a custom fetcher pays off

Write a foundation-level custom fetcher when:

- **Response shape isn't a dot-path transform.** Merging two fields, computing derived values, normalizing snake_case → camelCase.
- **Multi-endpoint composition.** Fetch an article, then fetch its author from a different endpoint and merge.
- **Non-standard response handling.** Retry logic tied to specific statuses, rate-limit handling, idempotency keys.
- **Complex pagination.** Cursor or offset conventions beyond what the default understands.
- **A non-JSON wire protocol.** Protobuf, MessagePack, or anything not in the `fetch() + JSON.parse` flow.

Most sites don't hit any of these. For those that do, [Foundation Configuration → Data Fetcher](../reference/foundation-config.md#data-fetcher) walks through writing the custom fetcher and composing `@uniweb/fetchers` middleware around it.

---

## See also

- [Data Fetching](../reference/data-fetching.md) — Reference for `fetch:` / `data:` config and the cascade.
- [Foundation Configuration → Data Fetcher](../reference/foundation-config.md#data-fetcher) — Writing a custom fetcher.
- [Working with Data](./working-with-data.md) — Narrative guide: cascading, template pages, detail queries, filter-state patterns.
- [Data Fetcher Architecture](../architecture/data-fetcher-architecture.md) — Dispatcher internals, cache keys, placeholder substitution, delivery paths.
