# Dynamic Routes

One page template, many pages — one per record. Blogs, product catalogs, team
directories, anything where each record needs its own URL.

## Overview

A folder named `[param]` is a route template. It expands into one page per record
in the data its **parent** declares.

```text
pages/
└── articles/
    ├── page.yml              # the query is declared here (folder level — no sections)
    ├── index/                # the list page — promoted to /articles
    │   ├── page.yml
    │   └── 1-articles.md
    └── [slug]/               # the template page → /articles/getting-started, …
        ├── 1-article.md
        └── 2-related.md
```

**After the build:**

```text
/articles                     # the list
/articles/getting-started     # one article  (slug: "getting-started")
/articles/advanced-features   # one article  (slug: "advanced-features")
/articles/best-practices      # one article  (slug: "best-practices")
```

The template page declares no query of its own. It inherits the parent's, and the
runtime narrows it to the one record the URL names.

---

## Quick Start

### 1. Write the entities

Markdown files under `entities/{schema}/`. The filename stem becomes the `slug`.

```markdown
<!-- entities/article/getting-started.md -->
---
title: Getting Started with Uniweb
excerpt: Learn the basics...
author: Jane Doe
date: 2025-01-15
---

Your article content here...
```

```markdown
<!-- entities/article/advanced-features.md -->
---
title: Advanced Features
excerpt: Deep dive into...
author: John Smith
date: 2025-01-20
---

Your article content here...
```

### 2. Declare the query

An entity on disk is not yet reachable. A **query** is the named question the site
asks over its records, and a page fetches it by name. Declare it in `site.yml`
(or in `queries.yml`, a bare map at the site root):

```yaml
# site.yml
queries:
  articles:
    schema: '@std/article'   # the Model these entities are
    route: /blog             # base route of the detail pages — see "Linking to a record"
    sort: date desc
```

> **`schema:` here is the Model ref** — which type these records are. It is not the
> `content.data` key; that is `as:` on a *fetch*, further down. One word, two jobs,
> so the two were split — see [Data Fetching](./data-fetching.md).

A query with no `schema:` takes its own name (`articles` → `@/articles`).

Optionally add `records.yml` to control what is published. Listing an entity there
is what makes it a record; omit the file and the whole pool is delivered.

```yaml
# records.yml
- std/article/*.md
```

### 3. Set up the folder-level page.yml

```yaml
# pages/articles/page.yml
id: b7788da4          # stable id — lets other pages point at this one
title: Articles

# The query cascades to every page under this folder, including [slug]/
data: articles
```

`data: articles` is shorthand for `fetch: { query: articles }`.

### 4. Create the list and template folders

```yaml
# pages/articles/index/page.yml
title: Articles
description: Latest articles and tutorials
```

```markdown
<!-- pages/articles/index/1-articles.md -->
---
type: ArticleList
---
```

```markdown
<!-- pages/articles/[slug]/1-article.md -->
---
type: Article
---
```

### 5. Write the section types

```js
// src/sections/ArticleList/meta.js
// `data:` names the schema for the content.data.articles key. Delivery is
// default-on — this is a hint for field defaults and the editor, not a gate.
export default {
  title: 'Article List',
  data: { articles: '@std/article' },
}
```

```jsx
// src/sections/ArticleList/ArticleList.jsx
export default function ArticleList({ content, block }) {
  if (block.dataLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  const articles = content.data.articles || []

  return (
    <ul>
      {articles.map(a => (
        <li key={a.slug}>
          {/* a.route is the record's own link — never rebuild it */}
          <a href={a.route}>{a.title}</a>
        </li>
      ))}
    </ul>
  )
}
```

```js
// src/sections/Article/meta.js
export default {
  title: 'Article',
  data: { articles: '@std/article' },
}
```

```jsx
// src/sections/Article/Article.jsx
export default function Article({ content, block }) {
  if (block.dataLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  // Same key as the list page. On a template page it holds exactly one record.
  const article = content.data.articles?.[0]

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h1>Not found</h1>
        <p>This article does not exist.</p>
      </div>
    )
  }

  return (
    <article>
      <h1>{article.title}</h1>
      <p>By {article.author} on {article.date}</p>
      <p>{article.excerpt}</p>
    </article>
  )
}
```

---

## How It Works

### The template page inherits, it does not re-declare

A fetch declaration cascades down four levels — section → page → parent page →
site — and the most specific declaration wins per key. The `[slug]` folder sits
one level below `articles/`, so the parent's `data: articles` reaches it by the
same walk that serves the list page. Nothing is fetched twice.

### One key, two array lengths

The record arrives under the **same key on both pages**. Only the length differs:

| page | `content.data.articles` |
|---|---|
| list | `[ {…}, {…}, {…} ]` — every record |
| template | `[ {…} ]` — the one the URL names |
| template, no match | `[]` |

There is no singular key and no name transform. A detail section reads
`content.data.articles[0]`; the runtime never collapses the array to an object,
because reshaping is the foundation's job.

### `:param` indexes exactly one query

The param is matched against the **first** query the parent declares. A page that
fetches two things still has only one that `:slug` can index — a route pattern
names one variable, and "which record set does `:slug` index" has no second
answer. The other keys cascade to the template page unchanged.

### The param name is a record field

`[slug]` means two things at once: the URL placeholder (`/articles/:slug`) **and**
the record field the URL segment is matched against.

| folder | param | URL pattern | matched against |
|---|---|---|---|
| `[slug]` | `slug` | `/blog/:slug` | `item.slug` |
| `[id]` | `id` | `/products/:id` | `item.id` |
| `[username]` | `username` | `/users/:username` | `item.username` |

So the field must exist on every record and identify one uniquely. Name a field
that is not there and nothing matches — the page reports not found. A non-unique
field silently resolves to the first match.

### Static siblings win over the template

Under `/blog`, a hand-authored `/blog/about` beats the `[slug]` catch-all, which
matches only the paths no static page claims. This holds in the browser and in the
static build alike. The one caveat: if a *record's* slug is also `about`, that
record's page will not exist at that URL — the static page has it.

---

## Linking to a record

A card needs an href. **Read `item.route` — do not compose it.** Two declarations
produce it, and either is enough:

**`route:` on the query** — the base route of the detail pages. The build stamps
`route: /blog/<slug>` onto every record it compiles.

```yaml
queries:
  articles:
    schema: '@std/article'
    route: /blog          # pairs with pages/blog/[slug]/
```

**`detailPage:` on the fetch** — a `page:<stable_id>` reference to the page that
renders one record. The runtime resolves it to a route template and fills in each
record's param. Use this when a list appears on several pages, or when routes are
localized: it follows the page even if it moves, and it is locale-aware.

```yaml
# pages/home/page.yml — a "latest posts" list on the homepage
fetch:
  query: articles
  limit: 3
  detailPage: page:b7788da4      # the id: in pages/articles/page.yml
```

Rebuilding the link in a component (`` `/articles/${a.slug}` ``) makes a second
producer of a value that already exists — and the two disagree exactly where the
normalization differs, on a field nobody checks until a visitor clicks it.

---

## Where the record comes from

When the visitor clicks through from the list, the records are already cached and
the runtime just picks the match. When they land on the URL directly — a bookmark,
a search result — nothing is cached. Resolution, in order:

1. **Records already cached** → take the match locally. No request.
2. **`detail:` declared** → fetch that one record.
3. **Neither** → fetch the whole set, cache it, take the match.

Step 3 is fine for a site's own compiled data and wasteful against a large or
expensive API. `detail:` is what avoids it:

```yaml
# pages/articles/page.yml
fetch:
  url: https://api.example.com/articles
  as: articles
  detail: rest
```

| `detail:` | URL built | for `slug` = `my-post` |
|---|---|---|
| `rest` | `{url}/{value}` | `https://api.example.com/articles/my-post` |
| `query` | `{url}?{param}={value}` | `https://api.example.com/articles?slug=my-post` |
| a pattern | `{param}` substituted | `https://api.example.com/article/{slug}` → `…/article/my-post` |

`detail:` is injected for you when the query declares `deferred:` fields, or when
the host the site is published to serves records live.

### The list's query string carries over

`rest` and `query` build the detail URL from the list URL, so a query string on the
list survives onto the single-record fetch:

```yaml
fetch:
  url: https://api.example.com/articles?lang=en&api_key=abc
  detail: rest
# detail fetch → https://api.example.com/articles/my-post?lang=en&api_key=abc
```

That is usually what you want: locale, an API key, a tenancy id are all still
needed for one record. Pagination params (`?_limit=12`) come along too — meaningless
for one record, but harmless.

⛔ **The one to check is a param that narrows the response**, such as
`?fields=summary`. Carried onto a detail request it truncates the very record the
detail fetch exists to get in full — and it fails quietly: the request succeeds, the
record arrives, only some fields are missing. It reads as a bug in your component.

A custom pattern is used verbatim, so nothing carries over unless you put it there:

```yaml
fetch:
  url: https://api.example.com/articles?fields=summary   # list: summaries are enough
  detail: https://api.example.com/articles/{slug}        # detail: the whole record
```

Either way the component reads the same thing — `detail:` changes only *how* the
runtime obtained the record, never how you read it.

---

## Related items

A section on a template page can receive the set **minus the current record**.
Refine the inherited query rather than declaring a new source:

```markdown
<!-- pages/articles/[slug]/2-related.md -->
---
type: RelatedArticles
fetch:
  refine: true    # borrow the ancestor's query, don't introduce a source
  detail: false   # the set minus the record this page is about
  limit: 3
---

# More articles
```

```jsx
export default function RelatedArticles({ content, block }) {
  if (block.dataLoading) return <div className="animate-pulse">Loading...</div>

  const related = content.data.articles || []
  if (related.length === 0) return null

  return (
    <section>
      <h2>More Articles</h2>
      <ul>
        {related.map(a => (
          <li key={a.slug}><a href={a.route}>{a.title}</a></li>
        ))}
      </ul>
    </section>
  )
}
```

This is the shape of a typical template page: one section rendering the whole
record, another showing a few of its siblings.

```text
pages/articles/[slug]/
├── 1-article.md      # type: Article           → content.data.articles[0]
├── 2-author.md       # type: AuthorBio         → content.data.articles[0]
└── 3-related.md      # type: RelatedArticles   → refine: true, detail: false, limit: 3
```

Each section reads what it cares about. The page offers the data; what to render
with it is the section type's decision.

---

## Loading, failed and not-found states

`block.dataLoading` is true while a fetch is outstanding:

```jsx
if (block.dataLoading) {
  return <div className="animate-pulse">Loading...</div>
}
```

`block.dataError` is set when a fetch **failed** — `{ articles: 'HTTP 502: Bad Gateway' }`,
keyed the way `content.data` is, or `null`. A failed key is left **absent** from
`content.data`; it is never delivered as `[]`, because `[]` is an answer ("no records")
and a failure is not one:

```jsx
if (block.dataError?.articles) {
  return <p>Could not load articles.</p>
}
```

When the URL names no record, the key is delivered as `[]`, so
`content.data.articles?.[0]` is `undefined`. Handle it — and note the page title is
set to `"Not found"` and `page.notFound` to `true` for you, just as the title is set
from `item.title` on a hit. No `useEffect`, no `document.title`.

| record field | page property |
|---|---|
| `title` | page title (browser tab) |
| `description` / `excerpt` | meta description |

---

## Static generation

Dynamic routes are fully static-generatable. At build time each template expands
into one concrete page per record, each rendered to HTML:

```text
dist/
└── articles/
    ├── index.html                  # /articles
    ├── getting-started/index.html
    ├── advanced-features/index.html
    └── best-practices/index.html
```

No server needed. If the parent's fetch is `prerender: false`, or its source is a
remote URL not read at build time, the template is kept as a template and matched
in the browser instead.

---

## Examples

```text
# Blog — folder-level query (recommended)
pages/articles/
├── page.yml          # data: articles
├── index/            # → /articles
│   └── 1-articles.md
└── [slug]/
    ├── 1-article.md
    └── 2-related.md

# Flat — the query sits alongside the list section
pages/blog/
├── page.yml          # data: articles
├── 1-list.md         # type: BlogList
└── [slug]/
    └── 1-article.md  # type: Article

# Team directory
pages/team/
├── page.yml          # data: team
├── index/
│   └── 1-overview.md # type: TeamGrid
└── [username]/
    └── 1-profile.md  # type: PersonProfile
```

---

## Troubleshooting

**Nothing arrives in `content.data`.**
Check the binding key. It is `as:` on a fetch — `schema:` was the old spelling and
is no longer read. When absent it is inferred from the query name, or from the last
segment of the path or URL, so a stale `schema:` does not error: the data lands
under a *different* key and your component reads `undefined`. The build warns and
names the key it actually bound to.

**The query delivers nothing at all.**
A query must be declared in `site.yml::queries` or `queries.yml`. Entities on disk
are not reachable until a query names their Model.

**Records missing from the output.**
Every record needs the field the folder names. `[slug]` requires `slug` on each
record; records without it are skipped.

**The section shows "not found".**
The URL segment matched no record's param field. Usually the right signal — show a
proper not-found state. If it is wrong, check that the folder-level query is the one
you meant and that the field exists on every record. Remember the record is at
`content.data.articles[0]`, not under a singular key.

**A card's link is wrong or doubled (`/blog//my-post`).**
Something is rebuilding the href. Read `item.route`.

---

## See Also

- [Data Fetching](./data-fetching.md) — the full fetch reference: `as:`, `where:`, `deferred:`, transports
- [Collections](../authoring/collections.md) — declaring queries and records
- [Content Structure](./content-structure.md) — how content is parsed
- [Component Metadata](./component-metadata.md) — the `meta.js` reference
