# Request Styles

When your site talks to a backend, the framework has to decide *how* to shape each request on the wire — which operators become URL parameters, which become a request body, what bracket or prefix notation to use. Different backends expect different shapes. Shopify isn't Strapi isn't GitHub's REST API isn't GraphQL.

The `fetcher.request.style:` key in `site.yml` lets you pick one of a handful of named wire-format conventions the framework ships with. No JavaScript, no foundation-coupling — just a name.

This guide covers the three shipped styles, when each one fits, and how to use `rename:` to tweak operator names when a backend is *almost* one of the standard shapes but calls things by slightly different names.

---

## Picking a style

| Style | When to use |
|---|---|
| `json-body` (default) | You control the backend, or it speaks the framework's own conventions: GET with `?_where=<JSON>&_limit=&_sort=`, POST with operators merged into a JSON body. Also works against the framework's default static-file handling — `public/data/*.json` — without any backend at all. |
| `flat-query` | A public REST API with plain query parameters: `?dept=biology&limit=10&sort=-date`. JSONPlaceholder, many CMS read APIs, blog engines exposing WordPress-style endpoints. |
| `strapi` | Strapi v4's bracket-notation filters: `?filters[dept][$eq]=biology&pagination[limit]=10&sort=date:desc`. Works as-is against any Strapi-hosted CMS. |

If your backend doesn't match any of these, the framework offers a deeper escape valve: a foundation developer can export a **named transport** that implements the backend's conventions in code. That's beyond authoring — see [Connecting a Backend](../development/connecting-a-backend.md) for the full picture.

---

## `json-body` — the ambient default

Nothing to configure. When `request.style:` isn't set, every site uses `json-body`.

```yaml
# site.yml — zero configuration
fetcher:
  baseUrl: https://api.example.com
  supports: [where, limit, sort]
```

- **GET** requests carry operators as `?_where=<JSON-encoded predicate>`, `?_limit=N`, `?_sort=field:dir`. The leading underscore avoids clashing with backend-specific URL params.
- **POST** requests merge operators as top-level JSON keys into the request body alongside any author-supplied fields.
- No response-envelope assumption.

Declaring `request.style: json-body` explicitly is fine if you want the YAML to be self-documenting, but it doesn't change anything.

---

## `flat-query` — simple REST APIs

Plain query parameters, no decoration:

```yaml
# site.yml
fetcher:
  baseUrl: https://jsonplaceholder.typicode.com
  supports: [where, limit, sort]
  request:
    style: flat-query
```

A page-level fetch:

```yaml
# pages/posts/page.yml
data: posts
fetch:
  url: /posts
  where:
    userId: 1
    category: news
  limit: 10
  sort: date desc
```

Hits the wire as:

```
GET https://jsonplaceholder.typicode.com/posts?userId=1&category=news&limit=10&sort=-date
```

### What `flat-query` pushes and what it doesn't

Because plain query parameters can only express a small shape, `flat-query` pushes `where:` **only** when the predicate is a flat AND of equalities on top-level fields:

```yaml
# Pushed to the wire:
where:
  dept: biology
  tenured: true

# Also pushed (explicit eq shorthand):
where:
  dept: { eq: biology }

# NOT pushed — falls back to runtime evaluation after the response arrives:
where:
  age: { gte: 18 }                  # comparison operators
  rank: { in: [full, associate] }   # list operators
  or: [{ a: 1 }, { b: 2 }]          # composition
  tenure.start: { gte: 2015 }       # dotted paths
```

When `flat-query` can't express a predicate, the framework fetches the full collection and filters it in the browser. You'll still get correct data — it just won't be as efficient as a server-side filter.

### Sort

`sort:` expressions map to the `-field` prefix convention:

```yaml
sort: date desc        # → sort=-date
sort: date desc, title # → sort=-date,title
```

---

## `strapi` — Strapi v4 REST

```yaml
# site.yml
fetcher:
  baseUrl: https://cms.example.com/api
  supports: [where, limit, sort]
  request:
    style: strapi
```

A page-level fetch:

```yaml
# pages/members/page.yml
data: members
fetch:
  url: /members
  where:
    dept: biology
    rank: { in: [full, associate] }
    start_year: { gte: 2015 }
  limit: 10
  sort: start_year desc
```

Hits the wire as:

```
GET https://cms.example.com/api/members
  ?filters[dept][$eq]=biology
  &filters[rank][$in][0]=full
  &filters[rank][$in][1]=associate
  &filters[start_year][$gte]=2015
  &pagination[limit]=10
  &sort=start_year:desc
```

### Operator coverage

| where-object | Strapi wire |
|---|---|
| `{ field: 'value' }` | `filters[field][$eq]=value` |
| `{ field: { eq: 'value' } }` | `filters[field][$eq]=value` |
| `{ field: { ne: … } }` | `filters[field][$ne]=…` |
| `{ field: { gt, gte, lt, lte } }` | `filters[field][$gt/$gte/$lt/$lte]=…` |
| `{ field: { in: [...] } }` | `filters[field][$in][0]=…&filters[field][$in][1]=…` |
| `{ field: { nin: [...] } }` | `filters[field][$notIn][0]=…` |
| `{ field: { like: '…' } }` | **Not pushed.** `like` is an anchored glob (`*` and `?` wildcards); Strapi's `$containsi` is an unanchored substring test with no wildcards. The two disagree in both directions, so a predicate containing `like` is evaluated at runtime as a whole |
| `{ field: { exists: true } }` | `filters[field][$notNull]=true` |
| `{ field: { exists: false } }` | `filters[field][$null]=true` |
| `{ and: [...] }` | `filters[$and][0]…&filters[$and][1]…` |
| `{ or: [...] }` | `filters[$or][0]…&filters[$or][1]…` |
| `{ not: {...} }` | `filters[$not]…` |

Dotted field paths compose into nested bracket segments:

```yaml
where:
  tenure.start: { gte: 2015 }
# → filters[tenure][start][$gte]=2015
```

Operators the `strapi` style doesn't map (custom operator names, etc.) trigger whole-predicate fallback: the collection is fetched unfiltered and narrowed in the browser.

### Default response envelope

Strapi wraps every response in `{ data, meta }`. The `strapi` style declares this automatically — you don't need to set `envelope:` for the wrapper. If your Strapi instance uses a custom envelope (e.g. a proxy that nests the response further), override at the site or per-fetch level:

```yaml
# site.yml — style default is `{ data }`; here we override.
fetcher:
  request: { style: strapi }
  envelope:
    query: data.records
    item: data.record
```

### Sort

Single-key sort uses the bare form; multi-key uses Strapi's indexed-array syntax:

```yaml
sort: date desc        # → sort=date:desc
sort: date desc, title # → sort[0]=date:desc&sort[1]=title:asc
```

---

## `rename:` — tweak operator names

When a backend is nearly one of the shipped styles but calls a standard operator by a different name, the `rename:` key remaps operator **wire names** without changing the style:

```yaml
fetcher:
  baseUrl: https://api.example.com
  supports: [limit, sort]
  request:
    style: flat-query
    rename:
      limit: pageSize         # the backend uses `pageSize=` instead of `limit=`
      sort: orderBy           # ...and `orderBy=` instead of `sort=`
```

Wire:

```
GET https://api.example.com/items?pageSize=10&orderBy=-date
```

### What `rename:` can do

- Replace the wire name of a pushed operator: `limit → pageSize`, `sort → orderBy`, `where → filter`.
- Applies to whichever channel the style uses — URL parameter name on GET, body key on POST.

### What `rename:` can't do

- Change the **shape** of the wire format. `rename:` can't turn `flat-query` into `strapi` — it can't add bracket notation, can't compose AND/OR, can't restructure nesting. For that, pick a different style.
- Rename **field names** inside a predicate. `rename: { department: dept }` is not valid; if your backend calls a field `dept` but you want to write `department` in the site YAML, write `dept` directly in the YAML. Field names belong to the predicate author, not the transport config.

If the framework's dev mode is on, `rename:` entries targeting operators the style doesn't push get a one-time warning so you notice dead config.

---

## When none of the styles fit

Real backends outside these three shapes — Algolia, Typesense, Elasticsearch, GitHub's REST quirks, GraphQL-with-custom-extensions — need a **foundation-level named transport**. That's a few lines of JavaScript that a foundation developer writes once for the backend and exports from `main.js`:

```js
// src/main.js
export default {
  transports: {
    myBackend: { resolve: async (request, ctx) => { /* ... */ } },
  },
}
```

Sites then opt in by name in `site.yml fetcher.transports:`. The author experience is identical: you still write `data:`, `fetch:`, `where:`, `limit:`, `sort:` in YAML — the transport handles the wire shape.

See [Foundation Configuration → Data Transports](../reference/foundation-config.md#data-transports) for the full picture.

---

## See Also

- [Connecting a Backend](../development/connecting-a-backend.md) — Site-level `fetcher:` vocabulary (baseUrl, headers, envelope, supports) and recipes.
- [Predicates and Saved Views](./predicates.md) — The where-object format that predicate operators use.
- [Working with Collections](./collections.md) — How `data:` declarations cascade through the site.
