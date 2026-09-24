# Parametric Pages

One page, many URLs — one per record. Blogs, product catalogs, team directories,
anything where each record needs its own URL. Uniweb calls these **parametric
pages** (other frameworks call them dynamic routes): a page whose URL carries a
parameter, and whose data that parameter narrows to one record.

## Overview

A folder named in brackets — `[slug]` — is a parametric page. It has a URL for each
record of its **route query**: the query its URL names one record of, normally the one
its **parent** page names ([which query the URL names](#which-query-the-url-names)).

```text
pages/
└── articles/
    ├── page.yml              # query: articles
    ├── 1-list.md             # the list, at /articles
    └── [slug]/               # the parametric page → /articles/getting-started, …
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

The parametric page declares no query of its own here. It takes its parent's, and each
URL names one record of it.

---

## Quick Start

### 1. Write the records

Markdown files under `records/`, in the folder the schema names — `records/std/article/`
for the standard `@std/article`. Every file there is a record, and its filename stem
becomes the `slug`. `@std/article` has two sections — `article`, its card, and
`article_body` — so a record is written by section, and its body is
`article_body.content` ([Entity Content](./entity-content.md)):

```markdown
<!-- records/std/article/getting-started.md -->
---
article:
  title: Getting Started with Uniweb
  excerpt: Learn the basics...
  date: 2025-01-15
article_body:
  author: Jane Doe
---

Your article content here...
```

```markdown
<!-- records/std/article/advanced-features.md -->
---
article:
  title: Advanced Features
  excerpt: Deep dive into...
  date: 2025-01-20
article_body:
  author: John Smith
---

Your article content here...
```

### 2. Declare the query

A **query** is the named question the site asks over its records, and a page names it.
Declare it in `queries.yml`, a bare map at the site root (or under `queries:` in
`site.yml`):

```yaml
# queries.yml
articles:
  schema: '@std/article'   # the Model these records are
  sort: date desc
```

> **`schema:` here is the Model** — which type these records are. It is not the
> `content.data` key a component reads them under; that is the key the component
> declares. See [Queries](./queries.md).

### 3. Name the query on the page

```yaml
# pages/articles/page.yml
id: b7788da4          # stable id — lets other pages point at this one
title: Articles
query: articles       # reaches this page's sections and its child pages', [slug]/ included
```

```markdown
<!-- pages/articles/1-list.md -->
---
type: ArticleList
---

# Articles
```

### 4. Add the parametric page

```markdown
<!-- pages/articles/[slug]/1-article.md -->
---
type: Article
---
```

### 5. Write the section types

```js
// src/sections/ArticleList/meta.js
// `data:` declares the content.data.articles key, and its schema — a section
// receives the keys its component declares, and nothing else.
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
          {/* a.$route is the page that shows this record — never rebuild it */}
          <a href={a.$route}>{a.title}</a>
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

  // The same key as the list. On the parametric page it holds exactly one record.
  const article = content.data.articles?.[0]

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h1>Not found</h1>
        <p>This article does not exist.</p>
      </div>
    )
  }

  // The card's fields are at the top of the record; the rest of it is under `article_body`.
  return (
    <article>
      <h1>{article.title}</h1>
      <p>By {article.article_body?.author} on {article.date}</p>
      <p>{article.excerpt}</p>
    </article>
  )
}
```

---

## How It Works

### The parametric page inherits, it does not re-declare

A fetch reaches four levels — section → page → parent page → site, the site's
reaching only a top-level page — and the most specific fills each key first. The
`[slug]` folder sits one level below `articles/`, so the parent's `query: articles`
reaches it by the same walk that serves the list. Nothing is declared twice.

### One key, two lengths

The records arrive under the **same key on both pages**. Only the length differs:

| page | `content.data.articles` |
|---|---|
| `/articles` | `[ {…}, {…}, {…} ]` — every record the query selects |
| `/articles/getting-started` | `[ {…} ]` — the one the URL names |
| a URL that names no record | `[]` |

A section showing the record reads `content.data.articles[0]`; the runtime never
collapses the list to an object, because reshaping is the foundation's job. The key is
the one the component declares: a component declaring `article: '@std/article'`
receives the same list of one under `article`, because the route query fills the first
key of its schema ([Which fetch fills a key](./data-fetching.md#which-fetch-fills-a-key)).

### Which query the URL names

A URL names one record of one query — the page's **route query**. It is chosen at
the page level:

1. the query the parametric page names itself, in its own `page.yml`; otherwise
2. its parent page's; otherwise
3. the site's, in `site.yml` — for a top-level parametric page only
   (`pages/[slug]/`), because the site's fetch reaches no page further down;
4. and if none of those names one, the query the page's own sections all
   name — when they name the same one.

The first query of the chosen level wins: a parent that fetches two things still
has only one the URL can name, and the other keys reach the parametric page
unchanged.

Every section the route query reaches — through the page, the parent, the site, or
its own fetch of that same query — gets the one record. A section that fetches a
**different** query gets that query's records, so a sidebar of upcoming events on a
member's page is not narrowed by the member's handle. A query two or more levels up
reaches none of the page's sections, and is never its route query either — except for
a [page nested inside a parametric page](#pages-inside-a-parametric-page), which shares
the route query of the page that captured its parameter.

### Which URLs exist

**A parametric page has a URL for each record of its route query's set, and no other.**
The query decides which records exist — its `scope`, `where`, `sort` and `limit` — so a
route query for the 100 most recent articles gives those 100 a page each, and an older
article none, whatever a list elsewhere shows. A `where` or `limit` on a list's
`fetch:` changes what that list shows and never which pages exist. See
[Queries → What a query selects](./queries.md#what-a-query-selects-its-set).

### What the URL segment is matched against

The folder's name says what the segment matches:

| folder | URL pattern | matched against |
|---|---|---|
| `[slug]` | `/blog/:slug` | the record's handle, `$name` — its `slug` when it has no `$name` |
| `[...path]` | `/blog/:path*` | the handle, by the last segment ([below](#multi-segment-routes--path)) |
| `[uuid]` | `/items/:uuid` | the record's identity, `$uuid` — a plain `uuid` field when it has none |
| `[id]` | `/products/:id` | the record's own `id` field |
| `[username]` | `/users/:username` | the record's own `username` field |

Records compiled from `records/` carry `$name`, the same value as their `slug`:
the filename, unless frontmatter sets `slug:`. A host that answers queries serves
`$name` too, so a `[slug]` page matches the same way on every site. Values compare
as strings — `/products/42` matches a record whose `id` is the number `42`.

A field that holds **several values** matches **any member**: a record with
`department: ['biology', 'genetics']` is reached at `/depts/biology` *and* at
`/depts/genetics`. The record's own link — its [`$route`](#linking-to-a-record) — uses
its **first** value. This exists for the ordinary case of a field typed as multi-valued that
holds one value; without it, that page renders not-found with nothing to explain it.

**Routing by a field that is not unique picks one record, and which one is not
guaranteed.** If two records both hold `biology`, `/depts/biology` shows one of them — the
build warns when it happens, and a site served by a host may pick the other one. Route by a
field whose value identifies a single record.

The field must exist on every record and identify one. Name a field that is not
there and nothing matches — the page reports not found. When several records
match, the first is used; the build warns when two records of one query share a
slug.

### Static siblings win over the parametric page

Under `/blog`, a hand-authored `/blog/about` beats the `[slug]` page, which
matches only the paths no static page claims. This holds in the browser and in the
static build alike. The one caveat: if a *record's* slug is also `about`, that
record's page will not exist at that URL — the static page has it.

### Pages inside a parametric page

A folder inside a `[name]` folder is a page too, and a parametric one:
`pages/members/[slug]/cv/` is `/members/:slug/cv`. Its `:slug` was captured by the
`[slug]` page, so it is about the same record: its route query is **the `[slug]`
page's**, found by the rule above at that page — however far up it is declared —
and its sections receive that record.

```text
pages/members/
├── page.yml              # query: members — the route query of [slug]/ and of cv/
├── 1-list.md
└── [slug]/
    ├── 1-profile.md      # /members/alice     — content.data.members[0] is Alice
    └── cv/
        ├── page.yml      # query: publications — cv/'s own data, under its own key
        └── 1-cv.md       # /members/alice/cv  — content.data.members[0] is Alice again
```

A query the nested page names itself is delivered under its own key and changes
nothing about what `:slug` names — `publications` above is not searched for `alice`.
Its other keys reach it as usual, from one parent up.

### Folder names

A parametric folder is `[...path]`, or a bracket name of letters, digits and `_` —
`[slug]`, `[id]`, `[member_id]`.

The build refuses, and so does `uniweb push`:

- Any other bracketed name — `[my-id]`, or a `[...slug]` or `[...rest]`, which is
  spelled `[...path]`.

- `[dir]` and `[path]` — `:dir` and `:path` are route variables every parametric
  page already has ([below](#multi-segment-routes--path)). `[path]` is usually a
  mistyped `[...path]`.
- Any folder inside a `[...path]` folder — the catch-all takes the rest of the URL,
  so a page below it could never be reached. A folder that holds something other
  than a page is named with a leading `_`, which the build skips.

---

## Linking to a record

A card needs an href. **Read `item.$route` — do not compose it.** Every record a query
delivers into `content.data` carries `$route`, the URL of the page that shows that
record, and there is nothing to declare:

```jsx
{articles.map(a => <a key={a.$name} href={a.$route}>{a.title}</a>)}
```

That page is the parametric page whose [route query](#which-query-the-url-names) is the
record's query — in the Quick Start, `pages/articles/[slug]/` — so an article links to
`/articles/<slug>` wherever a list of articles appears: the list, the homepage, a
sidebar on another article. The URL is filled from the field the page's URL is
[matched against](#what-the-url-segment-is-matched-against) — a `[slug]` page's from
the record's handle, a [`[...path]`](#multi-segment-routes--path) page's from its
placement and handle. On a multilingual site it follows the page's translated route.

A record gets **no `$route`** when its query has no parametric page, or when it lacks
the field the page's URL is built from — never a broken link, so a card can tell:

```jsx
const Card = a.$route ? Link : 'div'
```

**`detailPage:` on the fetch picks another page** — a `page:<stable_id>` reference to
the page that renders one record. Use it when a list should link to a page other than
the query's own, or when two parametric pages share a route query: without it, records
link to the first of them in page order.

```yaml
# pages/home/page.yml — a "featured" list linking to the featured layout
fetch:
  query: articles
  limit: 3
  detailPage: page:c0ffee12      # the id: in pages/featured/[slug]/page.yml
```

The `$` marks a field the framework fills, as `$name` does — so the link never lands
on a field of your own. A record's own `route` field (a trail's, a bus line's) is left
exactly as it is.

Rebuilding the link in a component (`` `/articles/${a.slug}` ``) makes a second
producer of a value that already exists — and the two disagree exactly where the
normalization differs, on a field nobody checks until a visitor clicks it.

> **Removed:** `route:` on a query, which had the build write a `route` field into
> every record it compiled. The build stops on it and points here; delete it and read
> `$route`.

---

## Where the record comes from

When the visitor clicks through from the list, the query's records are already cached
and the runtime finds the record the URL names among them. When they land on the URL
directly — a bookmark, a search result — the runtime fetches the route query's records
and finds it there. A host that answers queries is asked for the one record directly —
this record, if the query selects it.

Some lists carry less than a whole record, and then the page also asks for the record
on its own, even when it found it in a cached list:

- **a query with `deferred:` fields** leaves those fields out of lists, and the build
  writes one full file per record — the page reads it with no configuration;
- **a host that serves records live** lists briefs and answers the page's record whole,
  with no configuration either;
- **an [external query](./queries.md#external-queries)** whose endpoint lists summaries
  names the request for one full record with `record:`:

```yaml
# queries.yml
articles:
  url: https://api.example.com/articles?fields=summary   # the list: summaries are enough
  record:
    url: https://api.example.com/articles/{slug}         # one article, whole
```

`record.url` and `record.method` default to the query's; `body` and `transform` never
carry over. The name the page's folder uses — `{slug}` for `[slug]`, `{id}` for
`[id]` — is the value from the URL. A `record.url` you write is used as written —
nothing of the list's URL is added to it — so a `?lang=` or a tenancy id the record
request still needs goes in `record.url` too.

Either way the component reads the same thing — the source changes only *how* the
runtime obtained the record, never how you read it.

> **Removed:** `detail:` — `rest`, `query`, a URL pattern and `{ body, envelope }`. An
> external query's `record:` says the same thing, on the query.

---

## Related items

A section on a parametric page can receive the set **minus the current record**. Name
the query and say how the section uses the page's record with `current:`:

```markdown
<!-- pages/articles/[slug]/2-related.md -->
---
type: RelatedArticles
fetch:
  query: articles
  current: exclude   # the query's records without the one this page is about
  limit: 3           # three others
---

# More articles
```

`current: only` is the default — the record, as a list of one — and `current: include`
gives all of them with the record among them, for a previous / next pager. The order
of work is the query's records, then the fetch's `where` and `sort`, then remove the
record, then `limit` — so the others never include a record the query does not select.

`current:` follows the **query** the fetch names, not the key its records land under.
Give the others a key of their own with `as:` — `{ query: articles, as: related,
current: exclude }` — and the section receives the others under `related` beside the
record under `articles`. A fetch of **another** query receives that query's records,
and reads `current:` only when you write one: `{ query: featured, current: exclude }`
is the featured articles without this one.

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
          <li key={a.slug}><a href={a.$route}>{a.title}</a></li>
        ))}
      </ul>
    </section>
  )
}
```

This is the shape of a typical parametric page: one section rendering the whole
record, another showing a few of its siblings.

```text
pages/articles/[slug]/
├── 1-article.md      # type: Article           → content.data.articles[0]
├── 2-author.md       # type: AuthorBio         → content.data.articles[0]
└── 3-related.md      # type: RelatedArticles   → fetch: { query: articles, current: exclude, limit: 3 }
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
keyed the way `content.data` is, or `null`. A failed key is `null` in `content.data`;
it is never delivered as `[]`, because `[]` is an answer ("no records") and a failure
is not one:

```jsx
if (block.dataError?.articles) {
  return <p>Could not load articles.</p>
}
```

When the URL names no record, the key is delivered as `[]`, so
`content.data.articles?.[0]` is `undefined`. Handle it — and note the page title is
set to `"Not found"` and `page.notFound` to `true` for you, just as the title is set
from the record on a hit. No `useEffect`, no `document.title`.

| record field | page property |
|---|---|
| `title`, else `name`, else the record's handle | page title (browser tab) |
| `description` / `excerpt` | meta description |

The title rule is the same everywhere a record is named — the page in the browser, the
prerendered page, and the record's entry in the search index — so a record with no
`title` field, such as a person with a `name`, still titles its own page. Only text
counts: a field holding an object is skipped for the next one.

---

## Static generation

Parametric pages are fully static-generatable. At build time each one expands
into one concrete page per record of its route query, each rendered to HTML —
every record the query selects, and no other. A query's own `limit` counts: a query
for the 100 most recent articles makes 100 pages. A `limit` on a list's `fetch:`
does not — a list showing three still leaves every one of the 100 its page:

```text
dist/
└── articles/
    ├── index.html                  # /articles
    ├── getting-started/index.html
    ├── advanced-features/index.html
    └── best-practices/index.html
```

No server needed. If the route query is `prerender: false`, or it is an external
query the build does not fetch, the parametric page is kept as a pattern and
matched in the browser instead — and so is a route with more than one parameter
(`/orgs/:org/members/:slug`), which one query's records cannot fill.

---

## Multi-segment routes — `[...path]`

A folder named exactly `[...path]` captures **the rest of the URL**, however many
segments, where `[slug]` captures one. It is one fixed spelling: `[...slug]`,
`[...rest]` and `[...]` are not the marker, because authors do not name how the URL
is parsed.

```text
pages/blog/
├── page.yml          # query: posts
├── 1-posts.md
└── [...path]/        # → /blog/my-post, /blog/rust/my-post, /blog/rust/2025/my-post
    └── 1-post.md
```

The capture is split into three standard variables a query can reference — the
same three every parametric page has:

```text
/blog/rust/2025/my-post   →   :path = rust/2025/my-post   the whole capture
                              :dir  = rust/2025           everything before the last segment
                              :slug = my-post             the last segment — the record's handle
```

`:slug` means the same thing under both route kinds — under `[slug]` (or any
`[name]`) it is the whole segment, `:path` equals it and `:dir` is empty — so a
query written for one behaves the same under the other. **The record is delivered
by its handle**, exactly as under `[slug]`: a page under `[...path]` still reads
`content.data.posts[0]`.

**Where a record's URL comes from.** Its **placement** is the directory: the folder
`records/folder.yml` put it in (`- folder: rust/2025` → `path: rust/2025` on the record), or
the top of the folder for a record no folder names.
A record's `$route` and the static build's pages both compose `<placement>/<slug>`, so
a record at the folder root is `/blog/my-post` and one placed under `rust/2025` is
`/blog/rust/2025/my-post`.

**Binding the parts is opt-in.** A URL segment has no meaning until a query gives it
one; write a variable where it should mean something:

```yaml
# queries.yml — one saved query serves /blog and the parametric page under it
posts:
  schema: '@std/article'
  scope: :dir              # the URL's directory is the folder branch — deliberately exposing it
  # or:
  # where: { tag: :dir }   # a content field — the folder stays private
```

**Unbound means the clause drops.** On `/blog` there is no `:dir`, so a
`scope: :dir` or a `where: { tag: :dir }` simply vanishes and the whole set is
delivered; on `/blog/rust/my-post` it binds to `rust`. An **empty** variable drops
its clause too: on `/blog/my-post` there is no directory, and `scope: :dir` reads the
whole folder. That is what lets one query serve both pages. Only `:path`, `:dir` and
`:slug` are variables — anything else, a misspelling included, is an ordinary value
that matches only a record holding it literally. A variable fills a value, never a
key, an operator or `schema:`.

This works the same on a static site and on a host that answers queries: the build
compiles the query's file without the clauses the route binds, and each page
applies them for its own URL.

**Without `scope: :dir`, the directory is decoration.** `/blog/anything/my-post`
finds `my-post` wherever it is placed, and when two folders each hold a `my-post`,
the first one is used. Bind `:dir` to `scope` when the branch should decide which.

---

## Examples

```text
# Blog
pages/blog/
├── page.yml          # query: articles
├── 1-list.md         # type: ArticleList → /blog
└── [slug]/
    ├── 1-article.md  # type: Article     → /blog/<slug>
    └── 2-related.md  # type: RelatedArticles, fetch: { query: articles, current: exclude, limit: 3 }

# Team directory
pages/team/
├── page.yml          # query: team
├── 1-overview.md     # type: TeamGrid
└── [username]/
    └── 1-profile.md  # type: PersonProfile

# A member's page, and a page under it about the same member
pages/members/
├── page.yml          # query: members
├── 1-list.md
└── [slug]/
    ├── 1-profile.md  # /members/<slug>
    └── cv/
        └── 1-cv.md   # /members/<slug>/cv
```

---

## Troubleshooting

**Nothing arrives in `content.data`.**
Check that the component declares the key it reads, in its `meta.js` `data:` — a
section receives only the keys its component declares. Then check what fills it: a
fetch whose `as:` is the key (the query's name by default), or a fetch of a query
whose schema is the key's. `schema:` on a fetch was the old spelling of `as:` and is
no longer read (the build warns). `uniweb validate` reports a section on a page that
fetches data none of which fills its keys.

**The query delivers nothing at all.**
A query must be declared in `queries.yml` or `site.yml::queries`. Records in
`records/` are not reachable until a query names their Model.

**`/articles` shows an article instead of the list.**
The list's sections are in a subfolder. `pages/articles/index/` is the page
`/articles/index`, not `/articles`: only the site root promotes a page to its parent's
route. `/articles`, having no sections of its own, takes the visitor to its first child
with content. Put the list's sections in `pages/articles/` itself, beside `page.yml`.

**Records missing from the output.**
Every record needs the field the folder names. `[slug]` and `[...path]` need a
handle — `$name`, or `slug` — on each record; records without it get no page, and
the build says how many — *"3 of 5 records have no "slug""* — once per page. A record
outside the route query's set — excluded by its `where`, or past its `limit` — has no
page either.

**Every record shows on a parametric page.**
The page has no route query: neither it, its parent nor — on a top-level page — the
site names a query, and its sections name different ones. Name the query in the parent's
`page.yml` (`query: articles`), or give all the sections the same one.

**A section rendered nothing and the console is clean.**
Read `block.dataError` before reading `content.data`: a fetch that failed leaves
its key `null` and puts the message there. It is never delivered as `[]`, which
means "no records" and is an answer. And check the component declares the key: a
section receives only the keys its `meta.js` `data:` names.

**The section shows "not found".**
The URL segment matched no record of the route query's set. Usually the right signal —
show a proper not-found state. If it is wrong, check which query is the page's route
query (its own, its parent's, or the site's), that the record is in that query's set,
and that the field the folder names exists on every record. Remember the record is at
`content.data.articles[0]`, not under a singular key.

**A card's link is wrong or doubled (`/blog//my-post`).**
Something is rebuilding the href. Read `item.$route`.

**A card has no link — `item.$route` is undefined.**
The record's query has no parametric page: no `[slug]` page names it as its route
query. Check which query that page's URL names, or point the fetch at a page with
`detailPage:`. A record missing the field the URL is built from — its handle, for a
`[slug]` page — gets no link either.

---

## See Also

- [Queries](./queries.md) — what a query selects: `schema`, `scope`, `where`, `sort`, `limit`, external queries
- [Data Fetching](./data-fetching.md) — naming a query, narrowing it, what a section receives, `current:`
- [Working with Data](../development/working-with-data.md) — one query across a site: a list, a parametric page, a "more to read" section
- [Working with Records](../authoring/collections.md) — records and queries, for authors
- [Component Metadata](./component-metadata.md) — the `meta.js` reference
