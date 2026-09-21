# Data Fetching

Pages and sections get their data by naming a **query**. A query — declared once, in `queries.yml` — selects a set of records; a **fetch** names it on a section, a page or the site, and may narrow it; a section receives the data keys its component declares. The framework decides where the records come from: the file a static build generates from the query, a host's live records once the site is published, or a public API.

This page is the reference for fetches. What a query can say is [Queries](./queries.md); a walk-through of one query used across a site is [Working with Data](../development/working-with-data.md).

## Overview

A research station's blog keeps its field notes in one query:

```yaml
# queries.yml
articles:
  schema: '@std/article'
  where: { tags: { in: [field-notes, expedition] } }
  sort: date desc
  limit: 100
```

The query's **set** is the 100 most recent field notes and expedition reports. Four fetches use it, and three of them narrow it:

| where | its fetch | it receives |
|---|---|---|
| `pages/blog/page.yml` | `query: articles` | the set |
| a section of `pages/blog/[slug]/` | none — the page's record reaches it | the article the URL names |
| another section there | `{ query: articles, current: exclude, limit: 3 }` | three others |
| a section of the home page | `{ query: articles, limit: 3 }` | the first three |

Nothing outside the set can appear in any of them, and a change to the query reaches all four.

---

## Naming a query

On a section, in its frontmatter:

```markdown
---
type: TeamGrid
query: team
---

# Our Team
```

On a page, in its `page.yml` — for every section of the page, and of its child pages:

```yaml
# pages/about/page.yml
title: About Us
query: team
```

The section's component declares the key it reads, and receives the query's records under it — `content.data.team`:

```js
// src/sections/TeamGrid/meta.js
export default {
  data: { team: '@std/person' },
}
```

**Forms.** `query: team`, `fetch: team` and `fetch: { query: team }` are the same declaration. A list names several, each arriving under its own key:

```yaml
query: [team, articles]

fetch:
  - query: team
  - query: articles
    limit: 5
```

`query:` takes query names only; anything more is `fetch:`. A level declares one or the other, never both. `data:`, the shorthand's former name, is refused with a message naming `query:`.

**A fetch names a query — never a file or a URL.** While you develop, a query over the site's records reads the file a local build generates from it, `/data/<query>.json`; once the site is published to a host that serves records live, it reads those records, with nothing in the page changed. The generated file is output: a fetch never names it, and a file you put in `public/data/` yourself is overwritten as soon as a query takes its name. A public API is an [external query](./queries.md#external-queries), declared in `queries.yml` and named the same way.

> **How many requests is that?** Not your concern when authoring. You declare what the page needs; how the data is retrieved is the fetcher's business. A source that can answer several queries in one call does so, and one that cannot is asked in parallel.

---

## Where a fetch reaches

| declared in | reaches |
|---|---|
| a section's frontmatter | that section |
| `page.yml` (or `folder.yml`) | the sections of that page, and of its child pages |
| `site.yml` | the sections of the layout areas (header, footer, …) and of the top-level pages |

For each key a section's component declares, the most specific level fills it first: the section's own fetch, then its page's, then its parent page's, then the site's. A page two or more levels up does not reach.

**The site is the root page.** Its fetch reaches what a page's fetch would if the site were the parent of the pages directly under `pages/`: those pages — the homepage included — and the layout areas, which belong to the site rather than to any one page. A section on `/docs/setup` does not receive it; a section there that needs the data names the query itself.

**A page's query reaches its child pages.** That is how a [parametric page](./dynamic-routes.md) under `pages/blog/` gets the records of the query `pages/blog/page.yml` names, without declaring it again:

```text
pages/blog/
├── page.yml          # query: articles
├── 1-list.md         # type: ArticleList — every article
└── [slug]/
    └── 1-article.md  # type: Article — the article the URL names
```

A page with no sections of its own passes its fetch to its child pages too, but it has nothing to show: visiting it takes a visitor to its first child with content. Put a list's sections in the page that names the query, as above.

---

## Narrowing a query

A fetch that names a query reuses it, and can narrow it for this one use with `where`, `sort` and `limit` — and nothing else:

```yaml
fetch:
  query: articles
  where: { tags: featured }   # only the featured ones
  sort: date desc             # newest first
  limit: 3                    # the first 3
```

**A query selects a set of records, and a fetch takes from that set.** The query's `scope`, `where`, `sort` and `limit` decide which records it selects — its `limit` included. A fetch's narrowing applies after the query, to those records:

| on the fetch | what it does to the query's records |
|---|---|
| `where` | keeps the ones that also match |
| `sort` | puts them in another order — without it, the query's order holds |
| `limit` | takes the first N of them — never more than the query selects |

`where` narrows first, then `sort` orders what is left, then `limit` cuts it. With the `articles` query above, the home page's `fetch: { query: articles, where: { tags: featured }, limit: 3 }` shows the three newest featured articles **among those 100** — never an older one, even when fewer than three of the 100 are featured. The answer is the same whether the framework evaluates the query over the generated file or a host that answers queries does. The `where` language, and how `sort` orders, are in [Queries](./queries.md#where--which-records-match).

**A query decides which records have pages; a fetch never does.** Under a [parametric page](./dynamic-routes.md), each record of the query's set gets its page and no other record does. A list's `limit: 3` still leaves every one of the 100 its page. A condition or count that should decide which pages exist belongs on the query.

**`scope:` is not a narrowing.** Which branch of the folder a query reads decides what the query is, so it belongs on the query; the build stops on a `fetch:` that carries a `scope:`. To read another branch, declare another query.

**Two fetches under one key at one level** — `fetch: [{ query: articles }, { query: posts, as: articles }]` — should not exist. The first is used, and the build warns.

---

## Configuration

```yaml
fetch:
  query: articles             # Required: a query declared in queries.yml
  as: posts                   # The key it fills — defaults to the query name

  where: { featured: true }   # Narrowing: only the query's records that also match
  sort: date desc             # Narrowing: another order
  limit: 6                    # Narrowing: the first 6 — never more than the query selects

  current: exclude            # On a section of a parametric page — see below
  detailPage: page:b7788da4   # Link records to this page instead of their query's own
  prerender: false            # Leave this fetch to the browser
```

| Option | Default | Description |
|--------|---------|-------------|
| `query` | — | **Required.** The query to fetch, declared in `queries.yml` or under `queries:` in `site.yml`. A string where a fetch is expected is a query name: `fetch: team` is `fetch: { query: team }` |
| `as` | *the query name* | The key this fetch fills. A component that declares this key receives the records under it; one that declares its keys under other names receives them under the first still-empty key of the query's schema ([Which fetch fills a key](#which-fetch-fills-a-key)). Set it to pick the key when two keys, or two fetches, share a schema |
| `where` | — | Keeps the query's records that also match — see [Narrowing a query](#narrowing-a-query) |
| `sort` | — | Puts the query's records in another order, e.g. `date desc`. Without it they keep the query's order |
| `limit` | — | Takes the first N of the query's records — never more than the query selects |
| `current` | `only` | On a section of a parametric page: `only`, `exclude` or `include` — see [below](#on-a-parametric-page-current) |
| `detailPage` | *the query's page* | A `page:<stable_id>` reference to the page that renders one record. Every record carries `$route`, the URL of the page that shows it — by default the parametric page whose route query is the record's query; this picks another. See [Parametric Pages → Linking to a record](./dynamic-routes.md#linking-to-a-record) |
| `prerender` | `true` — `false` for an external query | `false` leaves the fetch to the browser; `true` has the build fetch an external query and embed the result |

### What a fetch cannot say

A fetch names a query, and the query says where its records come from. The build stops on a fetch that tries to say it itself, and names the fix:

| written on a fetch | write instead |
|---|---|
| a path — `fetch: /data/team.json`, or `path:` | name a query over the site's records: `fetch: team` |
| `url:`, `method:`, `body:`, `transform:` | an [external query](./queries.md#external-queries) that declares them, named here |
| `scope:` | the query's `scope:` |
| `detail:` | `current:` on a section of a parametric page, or `record:` on an external query |
| `refine:`, `inherit:` | `current: exclude` |
| `merge:` | nothing — a fetch fills the key it names, and a tagged data block under a key the component declares fills it first |
| `current:` in `page.yml`, `folder.yml` or `site.yml` | `current:` on a section's own fetch |

`schema:` on a fetch — the former spelling of `as:` — is not read: the build warns, and the fetch fills the key named after its query.

---

## What a section receives

A section's `content.data` holds **every key its component declares, and nothing else** — the keys in its `meta.js` `data:`, and the keys its foundation declares in `main.js` `data:`. A component with no `data:`, or `data: false`, receives none of its own.

```js
// src/sections/ArticleList/meta.js
export default {
  title: 'Article List',
  // 'articles' is the content.data key; '@std/article' is the schema of each record.
  data: { articles: '@std/article' },
}
```

Each entry's value is a named schema ref, an inline field map, an inline rich-form — or `{}` for a key whose records have no schema, such as an external API's. A schema supplies field defaults the runtime applies to each record, drives the visual editor, and goes into the foundation's published metadata. See [Component Metadata → Data](./component-metadata.md#data).

| `content.data.<key>` | means |
|---|---|
| a list | the records of the fetch that fills the key — `[]` is an answer with none |
| any other value | a tagged data block in the section (```` ```yaml:<key> ````), or an editor form |
| `null`, with `block.dataLoading` | its fetch has not answered yet |
| `null`, with `block.dataError[key]` | its fetch failed |
| `null` | nothing fills it |

A query's records always arrive as a **list** — every record the fetch takes, a list of one on a [parametric page](./dynamic-routes.md), `[]` when nothing matches — and each record carries `$route`, the URL of the page that shows it.

A tagged data block under a key the component does not declare is left out of `content.data` — the browser console says so while you develop — and stays in `content.sequence`, where a component that renders the sequence finds it.

> **Changed:** delivery used to be default-on — every key the levels above a section fetched reached its component, and `data:` was only a hint for defaults and the editor. A component now declares each key it reads.

### Which fetch fills a key

A tagged data block in the section fills its key first. Then the fetches that reach the section are taken one level at a time, most specific first — the section's own, its page's, its parent page's, the site's. Within a level:

1. **a fetch fills its own key** — its `as`, which is its query's name — when the component declares that key;
2. **the fetches whose keys the component does not declare fill its still-empty keys of their query's schema**, in order: the first such fetch, in the order they are written, fills the first such key, in the order `data:` lists them, and the next fetch the next key.

A key filled at one level is not refilled by a less specific one, and a fetch that fills none of a section's keys is not requested for it. So a component can name its key for what it shows:

```js
// src/sections/RelatedArticles/meta.js
export default {
  data: { related: '@std/article' },
}
```

```markdown
<!-- pages/blog/[slug]/2-related.md — `articles` is a query over @std/article -->
---
type: RelatedArticles
fetch:
  query: articles
  current: exclude
  limit: 3
---
```

The section receives three other articles under `related`. Where two keys, or two fetches, share a schema and the order pairs them the wrong way, `as:` on the section's own fetch names the key it fills. On a page's fetch, `as:` picks the key for every section of the page.

A schema ref written `@/<name>` means "this project's own `<name>`", so it matches a query's schema of the same name in any scope: a foundation's `@/member` is the same schema as a site's `@/member` — or `@acme/member`, as a host qualifies it. `@std/person` and `@acme/person` are different schemas.

### Keys every section receives — `main.js` `data:`

A foundation whose [content handlers](../development/content-handlers.md) read data declares those keys in `main.js`, in the same form as `meta.js`. Every section receives them, whether or not its component declares them — a handler runs for every section:

```js
// src/main.js
export default {
  handlers: createLoomHandlers({ vars: (data) => data?.profile?.[0] }),
  data: { profile: {} },
}
```

---

## On a parametric page: `current:`

On a [parametric page](./dynamic-routes.md) — `pages/blog/[slug]/` — every section the page's query reaches receives the one record the URL names, as a list of one. A section that wants something else fetches a query and says how it uses the page's record with `current:`:

| `current:` | the section receives |
|---|---|
| `only` | the record, as a list of one — the default for a fetch of the page's query |
| `exclude` | the query's records without it — "related", "more articles" |
| `include` | all of them, the record among them — for a previous / next pager |

```markdown
<!-- pages/blog/[slug]/2-related.md -->
---
type: RelatedArticles
fetch:
  query: articles
  current: exclude
  where: { featured: true }   # narrows, as on any fetch
  sort: date desc
  limit: 3                    # counts the others
---

# More articles
```

The order of work is the query's records, then the fetch's `where` and `sort`, then removing the page's record, then `limit` — so `limit: 3` is three *other* articles, and never one the query does not select.

**`current:` follows the query the fetch names, not the key it lands under.** A fetch of the page's own query — the one its URL names a record of — gets the record unless its `current:` says otherwise, whatever its `as`, so `{ query: articles, as: related, current: exclude }` delivers the others under `related`. A fetch of **another** query gets that query's records, and reads `current:` only when you write it: `exclude` takes the page's record out of them, and `only` keeps just that record when the query holds it. The page's record is found in either by the URL's parameter, the way the page finds it.

`current:` belongs on a section's `fetch:`. The build stops on a `current:` in `page.yml`, `folder.yml` or `site.yml`, and warns about one that nothing reads — on a page that is not parametric, or on one whose URL names no query.

> **Removed:** `refine: true` and `detail: false` — write `current: exclude`. `inherit:`, their earlier spelling, is refused the same way.

---

## When fetching happens

The same declaration works however the site is served; what changes is who runs it:

- **A static build** (`uniweb build`) prerenders each page with its data: a query over the site's own records is read at build time and embedded in the page. A fetch of an [external query](./queries.md#external-queries) is left to the browser unless it says `prerender: true`.
- **A host that renders pages on request** runs the page's fetches when a visitor arrives.
- **In the browser**, anything not embedded is fetched when its section renders. Answers are cached by the question, so a question already answered — or already on its way — is not asked again during the visit.

`prerender: false` on a fetch leaves it to the browser even on a static build.

---

## Loading and errors

A component renders immediately; a declared key is `null` until its fetch answers.

```jsx
export default function TeamGrid({ content, block }) {
  if (block.dataLoading) {
    return <div className="animate-pulse">Loading...</div>
  }
  if (block.dataError?.team) {
    return <p>Could not load the team.</p>
  }

  const team = content.data.team ?? []

  return (
    <div className="grid grid-cols-3 gap-8">
      {team.map((member) => (
        <div key={member.$name ?? member.name}>
          <img src={member.avatar} alt={member.name} />
          <h3>{member.name}</h3>
          <p>{member.role}</p>
        </div>
      ))}
    </div>
  )
}
```

If a fetch fails:

- The key it fills is `null` in `content.data` — never `[]`, which means "no records" — and the message is on `block.dataError[key]`
- A warning is logged during the build
- The page still renders

---

## Examples

### A team page

```yaml
# queries.yml
team:
  schema: '@std/person'
  sort: order asc
```

```yaml
# pages/team/page.yml
title: Our Team
query: team
```

```markdown
<!-- pages/team/1-grid.md -->
---
type: TeamGrid
---

# Meet the Team
```

```js
// src/sections/TeamGrid/meta.js — `data:` names what the section receives
export default {
  title: 'Team Grid',
  data: { team: '@std/person' },
}
```

### A blog over a public API

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

### Site-wide data

```yaml
# site.yml
name: My Site
query: config             # a query declared in queries.yml
```

```jsx
// A layout area's section, or a section on a top-level page — the site's fetch reaches both.
// Its meta.js declares `data: { config: {} }`.
export default function Footer({ content }) {
  const config = content.data.config?.[0] ?? {}
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

With no transport selected, the framework's default fetcher handles the request: the file a static build generates from a query, a host's live records, an external query's `url:` (GET, or `POST` with its `body:`) unwrapped by its `transform:`, its `record:` request for one record, and every `where:` / `sort:` / `limit:` evaluated over what arrived. A site published to a host that serves records live needs nothing more — the host stamps where its records are.

There is **no site-level vocabulary to point that fetcher at a backend of your own.** `baseUrl`, `headers`, `envelope`, `supports` and `request.*` were retired: a backend with its own base, headers, wire or query language is a **transport**, written once in the foundation (or an extension) and selected here. See [Data Sources](../development/data-sources.md) for when an external query is enough and when a transport is the answer, and [Foundation Configuration → Data Transports](./foundation-config.md#data-transports) for writing one.

### How selection works

For each request:

1. If `fetcher.transports[request.as]` is set, the dispatcher looks that name up in the registry of transports the foundation and its extensions registered. A match handles the request.
2. Otherwise, if `fetcher.transports.default` is set, that name handles every unclaimed key.
3. Otherwise, the framework default fetcher handles it.

Selection uses the fetch's own `as` — the query name unless the fetch says otherwise — not the key a component receives the records under. No route-walking, no `match()` predicates, no silent foundation-owned routing — the site picks.

### Secrets

Secrets do not belong in `site.yml` — values here are public to the browser. Sites that need private credentials use a same-origin proxy at the deployment layer; the site then fetches `/api/…` and the proxy attaches the credential server-side. See [Secrets](../development/data-sources.md#secrets).

---

## See Also

- [Queries](./queries.md) — everything a query can say: `schema`, `scope`, `where`, `sort`, `limit`, `deferred`, `queryable`, external queries
- [Parametric Pages](./dynamic-routes.md) — one page per record of a query
- [Working with Data](../development/working-with-data.md) — one query used across a site, section by section
- [Records](./content-collections.md) — `records/`, its `folder.yml`, and what a compiled record holds
- [Component Metadata](./component-metadata.md) — the `meta.js` reference, `data:` included
- [Data Sources](../development/data-sources.md) — an external query, a host's records, a transport, secrets
