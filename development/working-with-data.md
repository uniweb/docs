# Working with Data

Your components need data — articles, team members, products. In a typical React app you'd write a `useEffect`, manage loading state, handle errors and work out caching yourself. In Uniweb the content says which data a page uses, the component says which data it renders, and the runtime does the fetching, caching and delivery in between. Your component reads `content.data`.

This guide follows one site from its query to its components: a list, a page per record, a "more to read" section beside each record, and a teaser on the home page — four uses of one query. The reference for each piece is linked as it comes up.

> **First, know which pattern you're in.** Uniweb supports two ways a component ends up with data: the content names a query and the runtime fetches it (this guide), or a domain-aware component fetches its own data with standard React. If your component has to know about backend-specific things (query parameters, pagination cursors, filter shapes), you're in the second pattern — see [Component Data Patterns](./component-data-patterns.md) for which is which.

---

## The site

A research station keeps every kind of article side by side — lab news, press releases, field notes, expedition reports — and has a blog for the ones from the field:

```text
site/
├── records/std/article/       # every article, one file each
├── queries.yml
└── pages/
    ├── home/
    │   └── 3-from-the-field.md
    └── blog/
        ├── page.yml
        ├── 1-list.md
        └── [slug]/
            ├── 1-article.md
            └── 2-more.md
```

The articles are **records**: files in `records/` ([Records](../reference/content-collections.md)). Pages never read them directly. They name a query.

---

## One query

```yaml
# queries.yml
articles:
  schema: '@std/article'
  where: { tags: { in: [field-notes, expedition] } }
  sort: date desc
  limit: 100
```

A query selects a **set**: here, the 100 most recent field notes and expedition reports. It is defined once, and every use below takes from it:

| where | what it takes from `articles` |
|---|---|
| `/blog` | all of it |
| `/blog/:slug` | the one article the URL names, whole |
| ↳ its "more to read" section | three others |
| a section of the home page | the first three |

Nothing outside the set can appear in any of them, and a change to the query reaches all four. Everything a query can say is in [Queries](../reference/queries.md).

---

## A page names the query — `/blog`

```yaml
# pages/blog/page.yml
title: Blog
query: articles
```

```markdown
<!-- pages/blog/1-list.md -->
---
type: ArticleList
---

# From the field
```

The page names the query, never a file or a URL. While you develop, the records come from the file a local build generates from the query; once the site is published to a host that serves records live, they come from there. Nothing in the page changes.

A page renders nothing itself — its sections do. A page's query reaches its own sections and the sections of its child pages. The component behind `type: ArticleList` says what it renders:

```js
// src/sections/ArticleList/meta.js
export default {
  title: 'Article List',
  data: { articles: '@std/article' },
}
```

```jsx
// src/sections/ArticleList/index.jsx
import { DataPlaceholder, Link } from '@uniweb/kit'

export default function ArticleList({ content, block }) {
  if (block.dataLoading) return <DataPlaceholder lines={4} />

  const articles = content.data.articles ?? []

  return (
    <ul>
      {articles.map((a) => (
        <li key={a.$name}>
          <Link href={a.$route}>{a.title}</Link>
        </li>
      ))}
    </ul>
  )
}
```

No `fetch()`, no `useState`, no cache. The component doesn't know which query, file or host its articles came from — which is what lets the same section type serve another site.

### The declaration is the delivery

`data: { articles: '@std/article' }` does two jobs.

- **Its key is what the section receives.** A section's `content.data` holds the keys its component declares, and nothing else. A component that reads `content.data.articles` without declaring `articles` receives nothing there.
- **Its value is the shape of each record.** The runtime applies the schema's field defaults, so `a.title` is a string even on a record without one, and the editor knows what an article looks like. `'@std/article'` is a shared standard schema; `'@/article'` would be one of your foundation's own ([Data Schemas](./data-schemas.md)).

### `$route` — the link is already built

Every record a query delivers carries `$route`, the URL of the page that shows it — here `/blog/<slug>`, because `/blog/:slug` (below) is the page for records of `articles`. Read it; don't compose `` `/blog/${a.slug}` ``. A composed URL is a second answer to a question the framework already answered, and the two drift apart on the first translated route or nested folder. A record with no page gets no `$route`, so a card can tell:

```jsx
const Card = a.$route ? Link : 'div'
```

---

## A page for each record — `/blog/:slug`

```text
pages/blog/[slug]/
├── 1-article.md       # type: Article
└── 2-more.md          # type: MoreToRead
```

A folder named in brackets is a **parametric page**: one page, with a URL for each record. It declares no query of its own — it takes its parent's, `articles`, and each URL names one record of it. `/blog/bamboo-season` names the article whose handle is `bamboo-season`.

**The set decides which URLs exist.** `/blog/:slug` has a page for each of the 100 articles in the set, and no other: a press release, or a field note older than the 100 most recent, is not found there — even though it is a record of the same schema. A condition that should decide which pages exist belongs on the query, never on a list's fetch.

The full rules — which query a URL names, what the segment matches, `[...path]` for nested placements — are in [Parametric Pages](../reference/dynamic-routes.md).

### The article section: the page's record

```markdown
<!-- pages/blog/[slug]/1-article.md -->
---
type: Article
---
```

```js
// src/sections/Article/meta.js
export default {
  title: 'Article',
  data: { article: '@std/article' },
}
```

```jsx
// src/sections/Article/index.jsx
import { DataPlaceholder } from '@uniweb/kit'

export default function Article({ content, block }) {
  if (block.dataLoading) return <DataPlaceholder lines={8} />

  const article = content.data.article?.[0]
  if (!article) return <p>This article does not exist.</p>

  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.excerpt}</p>
    </article>
  )
}
```

The section has no fetch of its own. The page's query reaches it narrowed to the record the URL names, so `content.data.article` holds a list of one — or `[]` when the URL names no record of the set, in which case the page is marked not found and titled "Not found". On a hit, the page takes its title from the record.

The record arrives as a list, not an object, so the key means the same thing on every page. And it arrives under `article`, not `articles`: a fetch fills the key named after its query when the component declares that key, and otherwise fills the component's first key of the query's schema. `Article` declares one `@std/article` key, so the record lands there. A component declaring `articles` would receive it under `articles` — the rule is in [Which fetch fills a key](../reference/data-fetching.md#which-fetch-fills-a-key).

### "More to read": the rest of the set

```markdown
<!-- pages/blog/[slug]/2-more.md -->
---
type: MoreToRead
fetch:
  query: articles
  current: exclude
  limit: 3
---

# More from the field
```

```js
// src/sections/MoreToRead/meta.js
export default {
  title: 'More to Read',
  data: { related: '@std/article' },
}
```

This section names the same query and **narrows** it: `current: exclude` takes out the article the page is about, and `limit: 3` keeps three of the rest. The component receives them under `related`, its one key of that schema, and links each with `$route` exactly as the list does.

`current:` says how a section on a parametric page uses the page's record:

| `current:` | the section receives |
|---|---|
| `only` | the record, as a list of one — the default for the page's own query, which is what the article section got |
| `exclude` | the set without it — "more to read", "related" |
| `include` | all of it, the record among them — a previous / next pager |

---

## Another page takes a few — the home page

```markdown
<!-- pages/home/3-from-the-field.md -->
---
type: ArticleList
fetch:
  query: articles
  limit: 3
---

# From the field
```

The home page is not about articles; one of its sections shows three. It reuses `ArticleList` and names the same query, narrowed to three — and each card links to `/blog/<slug>`, because that is the page for records of `articles`, wherever the list appears.

A fetch narrows its query with `where`, `sort` and `limit`, applied after the query's own, and never widens it. `{ query: articles, where: { featured: true }, limit: 3 }` shows the three newest featured articles **among the 100** — never an older one and never a press release, even when fewer than three of the 100 are featured. That is why one well-chosen query serves the whole site: pages don't declare queries of their own to show less. See [Narrowing a query](../reference/data-fetching.md#narrowing-a-query).

---

## Where the records come from

The four uses are four questions about one set:

| the section | asks for |
|---|---|
| `/blog`'s list | the set |
| `/blog/bamboo-season`'s article | the set, narrowed to `bamboo-season`, whole |
| its "more to read" | the set without `bamboo-season`, three of it |
| the home page's section | the set, three of it |

Who answers depends on where the site runs, never on what the page says:

- **A static site.** The build compiles the query into a file, and the framework evaluates the set and each narrowing over it — at build time for the pages it prerenders, in the browser for anything fetched later. The build also generates one page per record of the set: 100 article pages here.
- **A host that answers queries.** Each question goes to the host, which evaluates the set and the narrowing at the source, so the home page's section receives three articles, not a hundred. A page's questions travel together.
- **An external API.** The same site works over a public JSON endpoint: declare `articles` with `url:` instead of `schema:` ([below](#the-same-site-over-a-public-api)).

In the browser, answers are cached by the question itself: a question already answered, or already on its way, is not asked again, so moving from `/blog` to an article and back asks only what hasn't been asked.

---

## Loading, failure and not found

What a declared key holds tells a component where it stands:

| `content.data.<key>` | means |
|---|---|
| a list | the records — `[]` means the question had no answers |
| `null`, with `block.dataLoading` | its fetch has not answered yet |
| `null`, with `block.dataError[key]` | its fetch failed; the message is there |
| `null` | nothing on this page fills the key |

```jsx
if (block.dataLoading) return <DataPlaceholder />
if (block.dataError?.related) return null
const related = content.data.related ?? []
if (related.length === 0) return null
```

A failure is never delivered as `[]`, because `[]` is an answer. On a parametric page whose URL names no record, the key is `[]`, `page.notFound` is `true` and the page's title is "Not found" — no `useEffect`, no `document.title`.

---

## When a list carries less than a record

A list of a hundred articles doesn't need a hundred bodies. When the list carries less than the page shows, the parametric page gets the whole record anyway:

- **A query with `deferred:` fields** — or one whose schema marks a brief section — leaves those fields out of lists. The record's page receives it whole, with nothing to configure ([Queries → `deferred`](../reference/queries.md#deferred--fields-a-list-leaves-out)).
- **A host that serves records live** answers lists with each record's brief, and a record's page asks for the record whole.
- **An external query** whose endpoint lists summaries names the request for one whole record with `record:` ([Queries → `record`](../reference/queries.md#one-record-record)).

Anywhere else — a hover card, a modal — a component fetches the whole record on demand with [`useWholeRecord`](../reference/kit-reference.md#usewholerecord), which returns the record it was given when the query has nothing separate to fetch.

---

## The same site over a public API

Nothing above depends on where the articles live. Point the query at a public JSON endpoint and every page and component stays as it is:

```yaml
# queries.yml
articles:
  url: https://api.example.com/articles
  transform: data.items                          # the records sit under data.items
  where: { tags: { in: [field-notes, expedition] } }
  sort: date desc
  limit: 100
  record:
    url: https://api.example.com/articles/{slug} # one whole article, for /blog/:slug
```

The framework fetches the endpoint in the visitor's browser and evaluates the query and each narrowing over what arrived. An API that needs a key, headers of its own, or paging is a foundation transport — see [Data Sources](./data-sources.md).

---

## Checking your data

The `data:` schema is a contract — it says what shape `content.data.<key>` will have. `uniweb validate` checks your file-based data against that contract, so a misspelled field or a value outside an enum surfaces while you're working, not as a blank slot on a live page.

```bash
uniweb validate            # warn about any record that doesn't match its schema
uniweb validate            # fails (exit 1) on a violation — wire this into CI
```

It reports the exact chain — route, section, data key, file, item, field — so you fix the record directly:

```
✗ /data/projects.json · schema @acme/project
    used by /work › Projects › data.projects
    • item "cinder" › name: missing required field 'name'
    • item "cinder" › status: 42 is not one of ["active", "archived"]
```

It also reports a section whose page fetches data none of which fills the keys its component declares. This is deliberately a gate you run, not part of every build: the runtime stays tolerant — it applies defaults and ignores the rest — so a data mistake degrades gracefully in production instead of breaking the build. Full reference: [CLI Commands → uniweb validate](../reference/cli-commands.md#uniweb-validate).

---

## See also

- [Queries](../reference/queries.md) — everything a query can say: `schema`, `scope`, `where`, `sort`, `limit`, `deferred`, external queries
- [Data Fetching](../reference/data-fetching.md) — `query:` and `fetch:`, narrowing, what a section receives, `current:`
- [Parametric Pages](../reference/dynamic-routes.md) — one page per record: which query a URL names, what it matches, `$route`
- [Records](../reference/content-collections.md) — `records/`, its `folder.yml`, and what a compiled record holds
- [Component Metadata → Data](../reference/component-metadata.md#data) — the `data:` declaration and its three value forms
- [Data Sources](./data-sources.md) — public APIs, a host's live records, foundation transports, and secrets
- [Component Data Patterns](./component-data-patterns.md) — when a component should fetch its own data instead
- [Data Fetcher Architecture](../architecture/data-fetcher-architecture.md) — dispatcher internals, cache keys, delivery modes
