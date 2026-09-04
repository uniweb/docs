# Connecting a Backend

Most Uniweb sites start with records in `entities/` that the build turns into JSON at `public/data/*.json`. That is enough for blogs, docs and marketing sites, and it is what a site published to a Uniweb host reads live without any configuration. Sometimes you have a backend of your own: a JSON API the site should read, an API with its own query language, a service that needs a key.

This guide says which of three shapes you are in, and what each one asks of you. It is about **author-driven fetching** — the content author writes `fetch:` in `page.yml` and the runtime fetches for the component. A component with its own domain knowledge (a search box, a pagination widget) uses standard React `useEffect + fetch`; see [Component Data Patterns](./component-data-patterns.md).

> **Audience:** site developers wiring a backend, or foundation authors deciding whether they need to write a transport.

---

## The three shapes

| your records come from | what you write | who evaluates `where:` / `sort:` / `limit:` |
|---|---|---|
| **the site itself** — `entities/`, compiled to `/data/*.json` | a query and a `fetch:`; nothing else | the framework, in the browser |
| **a Uniweb host** that serves records live | the same query and `fetch:`; the host stamps where its records are | the framework over the host's answer — or the host itself, where it answers queries |
| **a plain JSON endpoint** you control | `fetch: { url: … }` with per-fetch options | the framework, in the browser, over what arrived |
| **a backend with its own base, headers, wire or query language** | a **transport** in the foundation, selected by the site | the transport |

There is no site-level vocabulary that turns the default fetcher into a client for your backend. Earlier releases had one (`fetcher.baseUrl`, `headers`, `envelope`, `supports`, `request.style` / `rename`); it was retired because a third party's conventions belong in code that only the sites using that backend load — a transport — not in the runtime every site loads. A site that still declares those keys gets a warning at build time and they are ignored.

---

## A plain JSON endpoint

If your backend returns JSON at a URL, the default fetcher reads it with no configuration beyond the fetch itself:

```yaml
# pages/articles/page.yml
fetch:
  url: https://api.example.com/articles
  as: articles
  transform: data.items        # unwrap a nested response
  where: { published: true }   # evaluated in the browser over what arrived
  sort: date desc
  limit: 10
```

What the default fetcher supports per fetch:

| option | what it does |
|---|---|
| `url` | any absolute or protocol-relative URL, or a same-origin path |
| `method: POST` + `body` | send a JSON body (a GraphQL query, a `POST /search` filter). `{slug}` in a body string is substituted from the route param on a template page |
| `transform` | a dot-path into the response |
| `detail` | how to fetch one record on a template page — `rest`, `query`, a pattern, or the object form with its own `body` / `envelope`; see [Dynamic Routes → Where the record comes from](../reference/dynamic-routes.md#where-the-record-comes-from) |
| `where`, `sort`, `limit` | the query, evaluated by the framework over the records the endpoint returned |
| `prerender: false` | fetch in the browser rather than at build time (the default for a `url:`) |

The operators run **after** the response, over the whole set the endpoint returned. That is exactly right for an endpoint that returns everything, and wrong for one that pages or filters on its own — `limit: 20` over a paginated endpoint is twenty of *something*. When the backend needs to be asked rather than read, you are in the transport shape.

### GraphQL, in this shape

```yaml
# pages/articles/page.yml
data: articles
fetch:
  url: https://api.example.com/graphql
  method: POST
  body:
    query: |
      query Articles { articles { id slug title excerpt } }
  transform: data.articles

  # the record on /articles/[slug] — the object form of detail: carries its own body
  detail:
    body:
      query: |
        query Article($slug: String!) { article(slug: $slug) { id title body } }
      variables: { slug: "{slug}" }
    envelope: { item: data.article }
```

`{slug}` in `variables.slug` is substituted from the route; GraphQL selection sets like `{ id slug }` are not (the placeholder matcher needs `{name}` with no whitespace).

---

## A backend with its own conventions — write a transport

A transport is a small object with `resolve(request, ctx)` and, optionally, `cacheKey(request)`, exported by the foundation (or by an extension the site loads) under a name. The site selects it per schema; the foundation never silently intercepts a site's requests.

```js
// src/main.js
export default {
  transports: {
    acme: {
      async resolve(request, ctx) {
        const { apiKey } = ctx.website.config?.fetcher?.acme ?? {}
        const res = await fetch(`https://api.acme.test/${request.as}?limit=${request.limit ?? 50}`, {
          headers: { 'X-Api-Key': apiKey },
          signal: ctx.signal,
        })
        if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
        const body = await res.json()
        return { data: body.items }
      },
      cacheKey: (request) => `acme:${request.as}:${request.limit ?? 50}`,
    },
  },
}
```

```yaml
# site.yml
fetcher:
  transports:
    articles: acme      # the acme transport handles `data: articles`
  acme:                 # binding config the transport reads
    apiKey: pk_public_123
```

Inside `resolve`, the request carries the author's whole declaration — `as`, `where`, `sort`, `limit`, `url` if given — and the transport decides what to send and what to evaluate. Return `{ data, error?, meta? }`; a failure is an `error`, never an empty `data`, so the section can tell the two apart (`block.dataError`). The full contract, including `cacheKey` and the `@uniweb/fetchers` middleware you can compose, is in [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports).

Write a transport when:

- the backend has its **own query language** and you want `where:` evaluated at the source;
- it needs **headers, a base URL, or an envelope** of its own;
- it **pages**, and the page has to be asked for rather than read;
- the response needs **reshaping** beyond a dot-path, or several endpoints compose into one record;
- it speaks a **non-JSON wire**.

---

## Secrets

Nothing in `site.yml` is private. The framework either embeds its config into built HTML (static builds) or has it injected into `__DATA__` at serve time — either way, the browser sees it. A site that puts a real API key in `site.yml` is publishing that key, and a transport that reads one from `ctx.website.config.fetcher` is reading a public value.

The pattern is **same-origin proxying**:

- The site fetches `/api/articles` — a URL on its own origin.
- Something between the browser and the upstream backend (an edge worker, a small backend service) attaches the real credential server-side and forwards upstream.
- The site config only ever contains `url: /api/articles`. The secret never leaves the server.

For self-hosted deployments, put whatever you already use (a Cloudflare Worker, a reverse proxy, a small Node service) in front of the site and let the site fetch same-origin.

**Publishable tokens** (Mapbox public, Algolia search-only, Stripe publishable) are a different category: they are designed to be sent from browsers and need no proxy.

---

## See also

- [Data Fetching](../reference/data-fetching.md) — reference for `fetch:` / `data:` and the cascade
- [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports) — writing and registering a transport
- [Dynamic Routes](../reference/dynamic-routes.md) — template pages and where the record comes from
- [Working with Data](./working-with-data.md) — cascading, template pages, detail queries, filter-state patterns
