# Data Fetcher Architecture

How Uniweb's data-fetching layer works end to end — dispatcher, default fetcher, cache keys, placeholder substitution, delivery paths, gotchas. For the "how to use it" view, see [Data Sources](../development/data-sources.md).

> **Audience:** Framework contributors, foundation authors writing custom fetchers, anyone debugging a fetch that didn't fire or cached wrong.

---

## The dispatcher in one diagram

Every data fetch goes through the **FetcherDispatcher** — a small object on `website.fetcher` that decides which fetcher handles a given request. Selection is a name lookup, not a route walk:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Request (from EntityStore or build prerender)                        │
│   { as, path?, url?, transform?, method?, body?, dynamicContext? }    │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Runtime transport override (if set)                                  │
│   Passed via initUniweb({ transport }). Editor preview only;         │
│   handles every Layer-1 request unconditionally.                     │
└──────────────────────────────────────────────────────────────────────┘
                               │ not set
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Site-selected named transport                                        │
│   site.yml fetcher.transports[request.as]                            │
│     → registry = primary foundation.transports ∪ extension transports│
│   (primary wins on collision; bad extensions skipped with warning)   │
└──────────────────────────────────────────────────────────────────────┘
                               │ no match (or site didn't pick)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ site.yml fetcher.transports.default (if set)                         │
│   Same registry lookup for every unclaimed `as`.                     │
└──────────────────────────────────────────────────────────────────────┘
                               │ not set (or name unregistered)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Framework default fetcher (terminal — always present)                │
│   createDefaultFetcher({ basePath })                                 │
└──────────────────────────────────────────────────────────────────────┘
```

The default fetcher is the terminal resolver. It always exists. Sites that declare no `fetcher.transports` (the common case — docs, marketing, starter templates) run every request through this path.

There is **no `match()` predicate, no route-walking, no silent foundation-owned routing**. The site always picks — and the pick is visible in `site.yml`, auditable. Foundations contribute named transports; extensions contribute by name too; the site selects per data key (`as`).

---

## The default fetcher's role

Narrow on purpose. Its job is to cover a site reading its own records and public, keyless JSON endpoints, without the site needing a foundation written for it.

What the default handles, all of it read from the query a fetch names:

- The file the build compiles from a query (`/data/<query>.json`), and a `deferred:` query's per-record files, under the site's base path.
- A host's live records service, when the host offers one — the questions a page asks, in one request.
- An external query's `url`, `method: POST` + `body` (with placeholder substitution from `dynamicContext`), and `transform:` — and on a parametric page, its `record:` request.
- The query's `scope` / `where` / `sort` / `limit`, then the fetch's `narrow` of them, evaluated over what arrived.

It reads no site-level `fetcher:` keys. The `baseUrl` / `headers` / `envelope` / `supports` / `request.*` vocabulary it once read is retired — the build warns and drops it. A backend that needs a base URL, headers or its own wire is a transport.

What the default deliberately does **not** do:

- **Pagination** — too diverse (cursor / offset / page-number). Foundation work; `@uniweb/fetchers` middleware.
- **Retries / timeouts** — middleware territory.
- **Mutations (PUT / PATCH / DELETE)** — optimistic updates, CSRF, action semantics — different feature entirely.
- **Query-language compilation** — the default forwards what the site author wrote; it doesn't translate between query languages.
- **Response normalization** — snake_case → camelCase, date parsing, field renames. Foundation work.
- **Secrets / private credentials.** Any value in `site.yml` or `queries.yml` ends up in the served HTML. The framework doesn't offer a feature that pretends otherwise. See [Secrets posture](#secrets-posture).

The scope test is capability vs. cost. Every line in the default ships in the runtime on every site. A capability that benefits only a subset, or requires conditional logic (route matching, per-endpoint rules), belongs in middleware or a custom fetcher.

---

## Request, context, return

The fetcher contract is one method:

```ts
resolve(request, ctx): Promise<{ data, error?, meta? }>
```

### Request

Normalized from the author's `fetch:` / `query:` config. Carried fields:

| Field | Required | Description |
| --- | --- | --- |
| `as` | yes | Key under `content.data` the result will be stored at. |
| `query` | no | The query the request reads, by name. |
| `path` | either this | A compiled file under the site's base — `/data/<query>.json`, or a per-record file. Resolved from the query; never authored. Mutually exclusive with `url`. |
| `url` | or this | An external query's address, sent as written. Mutually exclusive with `path`. |
| `transform` | no | Dot-path to the records in the response — the query's `transform`, or `record.transform` on a record request. |
| `method` | no | `GET` (default) or `POST`. Unsupported values warn and fall back to GET. |
| `body` | no | Arbitrary object (POST only). Supports `{paramName}` placeholder substitution from `dynamicContext`. |
| `record` | no | An external query's `record:` — `{ url?, method?, body?, transform? }` — which `buildDetailConfig` turns into a parametric page's record request. |
| `detail` | no | Set by resolution, never authored: the query has a per-record source — a `deferred:` query's per-record file pattern, or `true` for an external query's `record:` or a host's records service. |
| `scope` / `where` / `sort` / `limit` | no | The query as saved (folder branch, predicate, order, count) — together they select the query's records, its `limit` included. |
| `narrow` | no | What this fetch takes of the query's records: its own `where`, `sort` and `limit`, applied after the query's — and on a host's record question, `match` for the one record a parametric page names and `cursor` to resume an answer. Absent when the fetch takes all of the query's records. The default fetcher evaluates both levels client-side over what arrived — `scope` over each record's `path` — and each combination is its own cache entry; a host that answers queries evaluates them at the source; a transport decides for itself. |
| `dynamicContext` | no | Present on a parametric page's record fetch: `{ paramName, paramValue }`. |

### Context

Handed to the fetcher directly — no `globalThis` reads needed:

| Field | Description |
| --- | --- |
| `website` | The active Website. |
| `page` | Page scope; `null` for site-level. |
| `block` | Block triggering the request; `null` for page/site-level. |
| `signal` | `AbortSignal`. Aborts on block unmount or route change. Pass to `fetch()`. |

### Return

Always the same shape:

```js
{ data, error?, meta? }
```

- `data` — never undefined. Empty is `[]` or `null`/`{}`.
- `error` — string presence signals failure. May coexist with stale data.
- `meta` — fetcher-specific metadata stored alongside the cache entry.

Throwing works but isn't idiomatic. The runtime catches and surfaces `{ data: [], error: String(err) }`.

---

## Lifecycle of a dispatch

When `website.fetcher.dispatch(request, ctx)` is called:

1. **Select fetcher.** Runtime `transport` override wins if set; otherwise look up `ctx.website.config.fetcher.transports[as]` (the binding key) → `.transports.default` in the named-transport registry; otherwise the framework default fetcher. Record: a specific fetcher instance.
2. **Derive cache key.** Call `fetcher.cacheKey(request)` if defined, else the framework default.
3. **Cache hit?** `dataStore.get(key)` — return cached `{ data, meta }` synchronously-wrapped.
4. **In-flight?** Attach this request's signal to the existing promise's abort set; await the same promise.
5. **Execute.** Call `fetcher.resolve(request, ctx)`. Store the promise in in-flight under `key`.
6. **On success.** Write `{ data, meta }` to the cache, fire listeners (global + keyed), return.
7. **On failure.** Surface `{ data, error }`; do not cache error states.

**Signals and dedup.** When two blocks request the same key concurrently, they share one fetcher call. The in-flight entry carries a Set of signals; the underlying fetch is aborted only when every attached signal has aborted. Cancelling one block doesn't abort the other.

EntityStore calls `website.fetcher.dispatch(request, ctx)` — it never touches DataStore directly. DataStore's surface is `has`, `get`, `set`, `subscribe`, `clear`, plus `inflight` for dedup.

---

## Cache keys

The default derivation lives in `@uniweb/core` as `deriveCacheKey(request)`. Used by the dispatcher (when the selected fetcher doesn't define its own `cacheKey`) and by the build-time preload path.

Fields that contribute:

```js
JSON.stringify({
  path,        // one of path or url — what resource
  url,
  as,          // which content.data key
  transform,   // per-fetch unwrap path
  method,      // only when non-GET; POST shares URLs with GET
  body,        // only on POST; two POSTs to the same URL with different
               // bodies are different queries
  scope,       // the view taken of what came back: evaluated client-side,
  where,       // so two views of one file are two entries — each cut from
  sort,        // one read of the file when they are asked together
  limit,
  narrow,      // the fetch's own where / sort / limit, in one field order
})
```

A request with no address — a question to a host that answers queries — is identified by the
question itself instead: `query`, `schema`, `scope`, `where`, `sort`, `limit`, `narrow` (whose
`match` is the one record a parametric page asks for), `whole`, plus `as`, `transform` and
`locale`.

Fields that do **not** contribute:

- `detail` / `record` — a record request is its own request, with its own URL, path or body, which already splits the key.
- `dynamicContext` — carried on the request for resolution; the cache key's `body` already contains the substituted values.

Custom fetchers with specialized needs (e.g., a request where the response varies by some out-of-band value) can override `cacheKey(request)` on the fetcher object.

---

## Fetch lifecycle vs. state changes

Today's model:

- `BlockRenderer` runs the block's fetch **once** per block lifecycle. The fetch effect is keyed on `[block]` — it fires at mount and re-fires on SPA navigation that changes the block, and nowhere else.
- `page.state` / `website.state` drive React re-renders of subscribing components via kit hooks. They do **not** drive re-dispatches.
- Filter-state patterns (academic-metrics-style) are implemented by fetching a collection once and re-computing client-side from it as state changes.

Interactive re-fetching (search boxes, pagination, drill-downs) is handled by **domain-aware components** — components that know the backend and fetch their own data with standard React (`useEffect + fetch`). The framework doesn't bridge this case because a component that knows what variables to send already has backend domain knowledge, which is definitionally outside the "runtime hands me data" contract. See [Component Data Patterns](../development/component-data-patterns.md).

---

## Placeholder substitution

`@uniweb/core`'s `substitutePlaceholders(value, context, { encode })` handles `{name}` substitution in two places:

- **Record addresses.** An external query's `record: { url: 'https://api.example.com/articles/{slug}' }`, or a `deferred:` query's `/data/articles/{slug}.json` — `buildDetailConfig` fills in the dynamic-route paramValue. Encoding ON.
- **POST body objects.** `body: { variables: { slug: '{slug}' } }` — a `record.body` is filled by `buildDetailConfig`, and the default fetcher fills a request's body from `dynamicContext` before JSON-serializing. Encoding OFF (JSON will serialize).

The names available are the route's own param (`{slug}` for `[slug]`, `{id}` for `[id]`), `{param}` as an alias for it, and `{slug}` as the record's slug when the record is already in hand.

The matcher is strict: `\{([A-Za-z_][A-Za-z0-9_]*)\}`. Whitespace inside the braces disqualifies the match — so GraphQL selection sets like `{ id name }` pass through unchanged when they appear in a body string.

Only keys actually present in the context substitute. Unknown keys pass through as literal `{name}`. Null/undefined values also pass through.

---

## Delivery paths

Uniweb sites reach the browser through two framework-level delivery modes:

- **Baked-in build (`uniweb build`).** Site content is embedded into the built HTML at `__SITE_CONTENT__` (a Vite `define`). `prerender: true` fetch configs are executed by the build pipeline (in Node, using `process.env` for anything that needs it), and their results are pre-populated into `DataStore` on runtime startup.
- **Shell mode (`uniweb build --shell`).** Built HTML contains no site content. Something else (a serve script, an edge worker, any backend) stamps `__DATA__` into the HTML at request time and decides what goes in it. The framework provides the shell; the framework does not provide the stamper.

The dispatcher's behavior is identical across both modes — same routing, same cache, same contract. The only difference is *where fetches that happen at build time run*, which is a concern of the preload path, not the runtime fetcher.

### The build reads an external query as the browser does

When a binding of an external query says `prerender: true`, the build-time fetch path (`build/src/site/data-fetcher.js`) reads it with the runtime default fetcher's vocabulary: `url`, `method: POST` with its `body`, and `transform`, then the query's `where` / `sort` / `limit` and the fetch's `narrow` with the same evaluator. A binding of an external query defaults to `prerender: false`, so it runs in the browser unless the binding says `prerender: true`.

---

## Post-processing

`where:` / `sort:` / `limit:` are evaluated over what the source returned, with the one evaluator in `@uniweb/core` (`evaluateQuery`) — the same code in both places, so the browser orders and filters exactly as the build did. It works in two levels: the query's `scope`, `where`, `sort` and `limit` select its records, and then the fetch's `narrow` — its own `where`, `sort` and `limit` — takes from them, so a fetch never receives a record its query leaves out:

- **Static build:** applied in `build/src/site/data-fetcher.js` before embedding into `__SITE_CONTENT__`.
- **Runtime:** applied by the default fetcher after the response arrives (`runtime/src/default-fetcher.js`). A host that answers queries evaluates them at the source instead, and reports what it served.

---

## Secrets posture

The framework's config is **public to the browser** by construction. In baked-in builds the site config is inlined into HTML via `__SITE_CONTENT__`; in shell mode it's stamped into `__DATA__` at request time. Either way, values in `site.yml` and `queries.yml` — an external query's `url` and `body`, a transport's binding under `fetcher:`, anything — are visible to anyone viewing the page source.

That means `site.yml` is the wrong place for secrets. The framework doesn't pretend otherwise: no `auth:` knob, no env-var resolution into a request, no "private" channel. The honest pattern is **same-origin proxying**:

- The site's external query references a URL on the site's own origin (`url: /api/articles`).
- A layer in front of the site — an edge worker, a backend service, whatever the deployment provides — intercepts matching paths, attaches credentials server-side, forwards to the upstream backend, returns the response.
- The framework sees a plain URL. The secret never leaves the server.

A host may provide that layer; on a self-hosted deployment it is whatever proxy you put in front of the site. Either way the site's configs only ever contain same-origin URLs.

**Publishable tokens** (Mapbox public, Algolia search-only, Stripe publishable, GitHub public-read) are a distinct category — they're designed to be sent from browsers, and rate-limited at the API. Put them directly in an external query's URL or body; no proxy needed. Calling them "secrets" would be a misnomer.

---

## Gotchas

### POST requests miss CDN caches at build time

Edge CDNs cache GET aggressively and treat POST as bypass. `prerender: true` with `method: POST` will run against the origin every build, skipping the CDN. Usually fine — builds are infrequent — but surprises when expecting build speed to benefit from upstream caching. Not a framework bug; HTTP semantics.

### POST body cache-key size

The default `deriveCacheKey` stringifies the body into the cache key. Typical bodies are under a few KB and `Map` handles that easily. A site embedding multi-KB fixtures in `body:` would bloat memory. If it ever shows up, hash the serialized body instead. Defer until observed.

### Body placeholder collision with GraphQL `{ field }` braces

GraphQL selection sets contain `{ id name }`. The placeholder matcher requires no whitespace between the braces (`\{([A-Za-z_][A-Za-z0-9_]*)\}`), so `{ id }` and `{slug}` are distinguishable: the first has whitespace and isn't matched; the second has no whitespace and gets substituted when `slug` is in the dynamic-route context. Tested explicitly.

### A non-2xx response is an error, not data

The default fetcher reports a non-2xx response as `HTTP <status>: <statusText>` and delivers no records; the key stays absent from `content.data` and the message lands on `block.dataError`. A `transform:` never reads an error body.

### Foundation fetchers reading `ctx.website.config.fetcher` see the same block

`site.yml fetcher:` is one block. The dispatcher reads `fetcher.transports`; the default fetcher reads nothing from it; a transport reads its own binding, conventionally under `fetcher.<name>`. Unknown keys are ignored — no framework-level schema validation. Custom fetchers should document the keys they read.

### Filter state doesn't re-fetch

`page.state` changes trigger React re-renders of subscribing components. They do **not** trigger re-dispatches of block fetches. Sites that need re-fetching on user action use domain-aware components with standard React (`useEffect + fetch`) — see [Component Data Patterns](../development/component-data-patterns.md).

---

## When the default is the wrong answer

From the contract's angle:

- The response shape requires a transform that isn't expressible as a dot-path.
- Multiple endpoints compose into one logical fetch.
- Pagination the default doesn't support.
- Response retry / rate-limit policies tied to specific status codes or headers.
- A non-JSON wire protocol.
- Interactive re-fetching on user action. (This is a component-owned concern — domain-aware components fetch their own data with standard React; see [Component Data Patterns](../development/component-data-patterns.md).)

Write a custom transport. Compose `@uniweb/fetchers` middleware around it. See [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports).

---

## See also

- [Data Sources](../development/data-sources.md) — User guide with recipes.
- [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports) — Writing and registering a named transport.
- [Working with Data](../development/working-with-data.md) — Narrative guide: cascading, template pages, whole records, filter-state patterns.
- [Data Fetching](../reference/data-fetching.md) — Author-facing reference for `fetch:` / `query:` config.
- [Extensions Architecture](./extensions-architecture.md) — How extensions contribute named transports.
