# Data Sources

Most Uniweb sites start with records in `entities/`, named by queries in `queries.yml`. That is enough for blogs, docs and marketing sites: a static build turns each query into a file the site reads, and a site published to a host that serves records live reads the same queries from there, without any configuration. Sometimes the data lives elsewhere: a JSON API the site should read, an API with its own query language, a service that needs a key.

> ⛔ **Not what you want if you mean accounts.** This guide is about **content** — records the
> same for every visitor. If you want members who sign in, per-visitor data, or content your
> users create, that is a different mechanism with its own guide:
> [Sites with Accounts](./sites-with-accounts.md).

This guide says which of four shapes you are in, and what each one asks of you. It is about **author-driven fetching** — the content author names a query in `page.yml` and the runtime fetches for the component. A component with its own domain knowledge (a search box, a pagination widget) uses standard React `useEffect + fetch`; see [Component Data Patterns](./component-data-patterns.md).

> **Audience:** site developers connecting an API, or foundation authors deciding whether they need to write a transport.

---

## The four shapes

| your records come from | what you write | who evaluates `where:` / `sort:` / `limit:` |
|---|---|---|
| **the site itself** — `entities/`, compiled to `/data/*.json` | a query, named by a `fetch:` or `query:`; nothing else | the framework, in the browser |
| **a Uniweb host** that serves records live | the same query and the same `fetch:`; the host stamps where its records are | the host, which answers the query |
| **a public JSON endpoint** | an **external query** — a query with `url:` — named the same way | the framework, in the browser, over what arrived |
| **an API with its own base, headers, wire or query language** | a **transport** in the foundation, selected by the site | the transport |

The first two rows are one declaration: name a query, develop against the file a local build generates from it, publish, and the page reads the host's live records with nothing changed.

There is no site-level vocabulary that turns the default fetcher into a client for your API. Earlier releases had one (`fetcher.baseUrl`, `headers`, `envelope`, `supports`, `request.style` / `rename`); it was retired because a third party's conventions belong in code that only the sites using that backend load — a transport — not in the runtime every site loads. A site that still declares those keys gets a warning at build time and they are ignored.

---

## A public JSON endpoint — an external query

If an API returns JSON at a URL, declare it as a query — a query with `url:` is an **external query** — and name it from the page like any other:

```yaml
# queries.yml
articles:
  url: https://api.example.com/articles
  transform: data.items        # the records sit under `data.items`
  where: { published: true }   # evaluated in the browser over what arrived
  sort: date desc
```

```yaml
# pages/articles/page.yml
fetch:
  query: articles
  limit: 10
```

What an external query declares:

| key | what it does |
|---|---|
| `url` | any absolute or protocol-relative URL, or a same-origin path. Its presence is what makes the query external |
| `method: POST` + `body` | send a JSON body (a GraphQL query, a `POST /search` filter) |
| `transform` | a dot-path to the records in the response; it runs before `where`, `sort` and `limit` |
| `where`, `sort`, `limit` | the query, evaluated by the framework over the records the endpoint returned — they select its records. A page's `fetch:` then takes from those records, as from any query's |
| `record` | the request for one record in full on a parametric page — `url`, `method`, `body`, `transform`; see [Parametric Pages → Where the record comes from](../reference/dynamic-routes.md#where-the-record-comes-from) |

A fetch of an external query runs in the browser; `prerender: true` on the fetch has the build call it instead. It is never sent to a host's records service, and the build compiles no file for it. Beside `url:`, the keys that describe the site's own records — `schema`, `scope`, `deferred`, `excerpt` — stop the build.

The operators run **after** the response, over the whole set the endpoint returned. That is exactly right for an endpoint that returns everything, and wrong for one that pages or filters on its own — `limit: 20` over a paginated endpoint is twenty of *something*. When the API needs to be asked rather than read, you are in the transport shape.

### GraphQL, in this shape

```yaml
# queries.yml
articles:
  url: https://api.example.com/graphql
  method: POST
  body:
    query: |
      query Articles { articles { id slug title excerpt } }
  transform: data.articles

  # the record on /articles/[slug] — url and method are the query's; body and transform are its own
  record:
    body:
      query: |
        query Article($slug: String!) { article(slug: $slug) { id title body } }
      variables: { slug: "{slug}" }
    transform: data.article
```

`{slug}` in `variables.slug` is substituted from the route; GraphQL selection sets like `{ id slug }` are not (the placeholder matcher needs `{name}` with no whitespace).

> **Removed:** `fetch: { url: … }` with per-fetch `transform:`, `method:` and `body:`, and `detail:` in every form — the source is a named query now, so every external source a site reads is listed in one file.

---

## An API with its own conventions — write a transport

A transport is a small object with `resolve(request, ctx)` and, optionally, `cacheKey(request)`, exported by the foundation (or by an extension the site loads) under a name. The site selects it per data key (a fetch's `as`); the foundation never silently intercepts a site's requests.

```js
// src/main.js
export default {
  transports: {
    acme: {
      async resolve(request, ctx) {
        const { apiKey } = ctx.website.config?.fetcher?.acme ?? {}
        // The query's records: as many as the query selects.
        const res = await fetch(`https://api.acme.test/${request.as}?limit=${request.limit ?? 50}`, {
          headers: { 'X-Api-Key': apiKey },
          signal: ctx.signal,
        })
        if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
        const { items } = await res.json()
        // What this fetch takes of them. This API can neither filter nor re-sort, so the
        // transport takes a count and says so for anything else — a wrong list is worse
        // than an error.
        const { limit, ...other } = request.narrow ?? {}
        if (Object.keys(other).length > 0) return { data: [], error: 'acme: a fetch can only take a count' }
        return { data: limit ? items.slice(0, limit) : items }
      },
      cacheKey: (request) => `acme:${request.as}:${request.limit ?? 50}:${request.narrow?.limit ?? ''}`,
    },
  },
}
```

```yaml
# site.yml
fetcher:
  transports:
    articles: acme      # the acme transport handles `query: articles`
  acme:                 # binding config the transport reads
    apiKey: pk_public_123
```

Inside `resolve`, the request carries the resolved declaration in two levels, and the transport decides what to send and what to evaluate:

- **the query as saved** — `query`, `as`, `scope`, `where`, `sort`, `limit`, and an external query's `url`, `method`, `body` and `transform`. These select the query's records, its `limit` included;
- **`narrow`** — what this fetch takes of those records: its own `where`, `sort` and `limit`. Absent when the fetch takes all of them. Apply it after the query, so a fetch never gets a record the query leaves out. Return `{ data, error?, meta? }`; a failure is an `error`, never an empty `data`, so the section can tell the two apart (`block.dataError`). The full contract, including `cacheKey` and the `@uniweb/fetchers` middleware you can compose, is in [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports).

Write a transport when:

- the API has its **own query language** and you want `where:` evaluated at the source;
- it needs a **key, headers, or a base URL** of its own;
- it **pages**, and the page has to be asked for rather than read;
- the response needs **reshaping** beyond a dot-path, or several endpoints compose into one record;
- it speaks a **non-JSON wire**.

---

## Secrets

Nothing in `site.yml` is private. The framework either embeds its config into built HTML (static builds) or has it injected into `__DATA__` at serve time — either way, the browser sees it. A site that puts a real API key in `site.yml` is publishing that key, and a transport that reads one from `ctx.website.config.fetcher` is reading a public value.

The pattern is **same-origin proxying**:

- The site fetches `/api/articles` — a URL on its own origin.
- Something between the browser and the upstream API (an edge worker, a small server) attaches the real credential server-side and forwards upstream.
- The site's external query only ever contains `url: /api/articles`. The secret never leaves the server.

For self-hosted deployments, put whatever you already use (a Cloudflare Worker, a reverse proxy, a small Node service) in front of the site and let the site fetch same-origin.

**Publishable tokens** (Mapbox public, Algolia search-only, Stripe publishable) are a different category: they are designed to be sent from browsers and need no proxy.

---

## See also

- [Queries](../reference/queries.md) — everything a query can say, external queries included
- [Data Fetching](../reference/data-fetching.md) — `fetch:` / `query:`, narrowing, and what a section receives
- [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports) — writing and registering a transport
- [Parametric Pages](../reference/dynamic-routes.md) — one page per record, and where the record comes from
- [Working with Data](./working-with-data.md) — one query, many uses: what each section receives, parametric pages, whole records
