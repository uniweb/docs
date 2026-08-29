# Dynamic Routes

Generate multiple pages from a single template using data. Perfect for blogs, product catalogs, team directories, and any content where each item needs its own page.

## Overview

Dynamic routes use a special `[param]` folder naming convention. At build time, the folder expands into multiple pages — one for each item in the parent's data.

```text
pages/
└── articles/
    ├── page.yml              # Fetch defined here (folder level — no sections)
    ├── index/                # Listing page — auto-promoted to /articles
    │   ├── page.yml
    │   └── 1-articles.md
    └── [id]/                 # Dynamic route → expands to /articles/post-1, etc.
        ├── 1-article.md
        └── 2-related.md
```

**Result after build:**

```text
/articles                     # Listing of all articles
/articles/getting-started     # Individual article (id: "getting-started")
/articles/advanced-features   # Individual article (id: "advanced-features")
/articles/best-practices      # Individual article (id: "best-practices")
```

---

## Quick Start

### 1. Create a collection

Create markdown files in `entities/article/`:

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

The filename becomes the `id` (e.g., `getting-started`).

### 2. Set up the folder-level page.yml

```yaml
# pages/articles/page.yml
# No sections directly here — this is a pure data config layer
data: articles
```

This references the `articles` collection. The build generates JSON automatically from your markdown files. Both `articles/index/` and `articles/[id]/` inherit this fetch config.

### 3. Create the index and dynamic route folders

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
<!-- pages/articles/[id]/1-article.md -->
---
type: Article
---
```

### 4. Create your components

```js
// src/sections/ArticleList/meta.js
// `data:` declares the schema for content.data.articles. Delivery is
// default-on; the schema supplies the field defaults and editor hints.
export default {
  title: 'Article List',
  data: { articles: '@/article' },
}
```

```jsx
// src/sections/ArticleList/index.jsx
export default function ArticleList({ content, block }) {
  if (block.dataLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  const articles = content.data.articles || []

  return (
    <ul>
      {articles.map(a => (
        <li key={a.id}>
          <a href={`/articles/${a.id}`}>{a.title}</a>
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
  data: { articles: '@/article' },
}
```

```jsx
// src/sections/Article/index.jsx
export default function Article({ content, block }) {
  if (block.dataLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  // On a detail page, the focused record is the first (and only) element
  // of the collection array.
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

### 1. Folder-level page.yml declares the fetch

The `articles/page.yml` has no `.md` section files — it acts as a container that owns the data config for the whole route family:

```yaml
# pages/articles/page.yml
data: articles
```

### 2. `index/` is auto-promoted to the parent route

The `index/` sub-directory is automatically promoted to the parent route (`/articles`). It inherits the fetch from `articles/page.yml` without needing to redeclare it.

### 3. Dynamic folder detected

The `[id]` folder name tells the build system this is a dynamic route. The param name (`id`) determines which field to use for URLs.

### 4. Routes expanded at build time

During prerender, the dynamic route expands:

| Template Route  | Concrete Routes                  |
|-----------------|----------------------------------|
| `/articles/:id` | `/articles/getting-started`      |
|                 | `/articles/advanced-features`    |
|                 | `/articles/best-practices`       |

### 5. Data delivered to each page

Each generated detail page receives the focused record under the **collection key**, as a single-element array:

| Key                       | Value                  | Description                                  |
|---------------------------|------------------------|----------------------------------------------|
| `content.data.articles`   | `[{ id, title, ... }]` | A one-element array — the route-matched item |

The collection key is the same on the list page and the detail page — only the array length differs (the full collection on the list page, one element on the detail page). The detail section reads the focused record with `content.data.articles[0]`. There is no separate singular key.

---

## Folder-Level Fetch

The folder level is the recommended pattern for dynamic routes. A `page.yml` with no sections directly inside it — only `index/` and `[id]/` sub-directories — acts as a pure data configuration layer.

```text
pages/articles/
├── page.yml          # fetch defined here (folder level)
├── index/            # listing — auto-promoted to /articles
│   ├── page.yml
│   └── 1-articles.md
└── [id]/             # detail — inherits fetch from articles/page.yml
    ├── 1-article.md
    └── 2-related.md
```

Both sub-pages inherit from `articles/page.yml` without needing their own `data:` or `fetch:` declarations. This cleanly separates data configuration from page layout.

---

## Folder Naming

The param name comes from the folder name:

| Folder       | Param      | URL Pattern         | Uses Field        |
|--------------|------------|---------------------|-------------------|
| `[slug]`     | `slug`     | `/blog/:slug`       | `item.slug`       |
| `[id]`       | `id`       | `/products/:id`     | `item.id`         |
| `[username]` | `username` | `/users/:username`  | `item.username`   |

**Important:** Each item in your data array must have a field matching the param name.

---

## Data Structure

### Parent's fetch returns an array

```json
[
  { "id": "post-1", "title": "First Post" },
  { "id": "post-2", "title": "Second Post" }
]
```

### Each item needs the param field

If your folder is `[id]`, every item must have an `id` field:

```json
{ "id": "my-post", "title": "My Post" }
```

Missing the param field (e.g., only having `slug` when the folder is `[id]`) causes the item to be skipped.

### Collections stay arrays

The collection is always delivered as an **array** under its own key — there is no singular key and no name transformation. On a detail page, the route-matched record is the single element of that array:

| Page           | `content.data.articles`           |
|----------------|-----------------------------------|
| List page      | `[ {...}, {...}, {...} ]` (all)   |
| Detail page    | `[ {...} ]` (the matched item)    |
| Detail, no match | `[]`                            |

A detail section reads `content.data.articles[0]`. The runtime never coerces the array to a single object — reshaping to a single record is the foundation's job.

---

## Component Setup

### Receiving the data

Data delivery is **default-on** on template pages — the collection arrives in `content.data` without any component-side opt-in. A minimal component has no `data:` field in its `meta.js`:

```js
// meta.js — no data declaration needed
export default {
  title: 'Article',
}
```

Optionally declare the schema for the key. This drives the editor and supplies the field defaults the runtime applies to each item:

```js
export default {
  title: 'Article',
  data: { articles: '@/article' },
}
```

### Accessing the data

On a detail page, the focused record is the single element of the collection array:

```jsx
export default function Article({ content, block }) {
  // Show skeleton while loading
  if (block.dataLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  // Focused record for this page — first element of the collection array
  const article = content.data.articles?.[0]

  // Always handle not found
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
      {/* ... */}
    </article>
  )
}
```

---

## Loading States

Use `block.dataLoading` to show skeleton UI while data is being fetched:

```jsx
export default function ArticleList({ content, block }) {
  if (block.dataLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded" />
        ))}
      </div>
    )
  }

  const articles = content.data.articles || []
  // ...
}
```

---

## Not Found Handling

The runtime validates the requested ID against the collection. If the ID is not found, the collection key is delivered as an empty array, so `content.data.articles[0]` is `undefined`. Your component should handle this gracefully:

```jsx
const article = content.data.articles?.[0]

if (!article) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>Not found</h1>
      <p>This article does not exist.</p>
    </div>
  )
}
```

The page title is automatically set to `"Not found"` when the ID is invalid — no `useEffect` or `document.title` manipulation needed. For valid IDs, the title is automatically set from `item.title`.

---

## Related Items Pattern

A section on a dynamic page can receive the full collection **minus the current item** using `detail: false` in the block's frontmatter fetch. This is the related items pattern:

```markdown
<!-- pages/articles/[id]/2-related.md -->
---
type: RelatedArticles
fetch:
  refine: true    # borrow the parent's query, not a new data source
  detail: false   # give me the collection minus the current item
  limit: 3        # slice to 3 items
---

# More articles
```

```js
// RelatedArticles/meta.js
export default {
  title: 'Related Articles',
  data: { articles: '@/article' },
  // refine: true, detail: false, and limit are set per-instance in the .md frontmatter
}
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
          <li key={a.id}>
            <a href={`/articles/${a.id}`}>{a.title}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

---

## Page Metadata

Dynamic pages automatically set metadata from the current item:

| Item Field              | Page Property                                                                 |
|-------------------------|-------------------------------------------------------------------------------|
| `title`                 | Page title (shown in browser tab) — set automatically, no `useEffect` needed |
| `description`/`excerpt` | Meta description                                                              |

For invalid IDs, the page title is automatically set to `"Not found"`.

```json
{
  "id": "getting-started",
  "title": "Getting Started",
  "description": "Learn the basics..."
}
```

---

## Examples

### Articles (modern folder structure — recommended)

```text
pages/articles/
├── page.yml          # data: articles (folder level)
├── index/            # listing — auto-promoted to /articles
│   ├── page.yml
│   └── 1-articles.md
└── [id]/
    ├── 1-article.md
    └── 2-related.md  # fetch: { refine: true, detail: false, limit: 3 }
```

### Blog (flat structure — alternative)

```text
pages/blog/
├── page.yml          # data: articles (page level, sections here)
├── 1-list.md         # type: BlogList
└── [slug]/
    ├── page.yml
    └── 1-article.md  # type: Article
```

In the flat structure the fetch is at page level alongside the listing section. Both structures work; the folder structure gives cleaner separation.

### Product catalog

```text
pages/products/
├── page.yml          # data: products
├── index/
│   └── 1-grid.md     # type: ProductGrid
└── [id]/
    └── 1-detail.md   # type: ProductDetail
```

### Team directory

```text
pages/team/
├── page.yml          # data: team
├── index/
│   └── 1-overview.md # type: TeamGrid
└── [username]/
    └── 1-profile.md  # type: PersonProfile
```

---

## Multiple Sections on Dynamic Pages

Dynamic pages can have multiple sections, each receiving the cascaded data:

```text
pages/articles/[id]/
├── 1-article.md      # type: Article       — reads content.data.articles[0] (focused record)
├── 2-author.md       # type: AuthorBio     — reads content.data.articles[0] (focused record)
└── 3-related.md      # type: RelatedArticles — fetch: { refine: true, detail: false, limit: 3 }
```

Each component reads only the data it cares about from `content.data`. The detail sections read the focused record as `content.data.articles[0]`. The `3-related.md` block uses the block-level refine fetch (`detail: false`) to get the collection minus the current item — an array it maps over.

---

## Combining with Other Features

### With tagged data blocks

Local data takes precedence over cascaded data. A tagged YAML block in the `.md` file overrides the cascaded value for that schema key:

```markdown
---
type: Article
---

# Custom Override
```

The component receives both `content.data.articles` (cascaded — `[0]` is the focused record) and any tagged blocks that override their own keys.

### With additional fetches

Sections can have their own fetches that merge with cascaded data:

```markdown
---
type: Article
data: comments
---
```

The component receives both `content.data.articles` (cascaded — focused record at `[0]`) and `content.data.comments` (fetched).

---

## Static Generation (SSG)

Dynamic routes are fully compatible with static site generation:

1. **Build time**: All routes are expanded and rendered to HTML
2. **Output**: Each route becomes a static `.html` file
3. **No server needed**: Host anywhere (Netlify, Vercel, GitHub Pages, etc.)

```text
dist/
├── articles/
│   ├── index.html              # /articles (listing)
│   ├── getting-started/
│   │   └── index.html          # /articles/getting-started
│   ├── advanced-features/
│   │   └── index.html          # /articles/advanced-features
│   └── best-practices/
│       └── index.html          # /articles/best-practices
```

---

## Detail Queries

When a user navigates from a list page to a detail page (e.g., `/articles` → `/articles/my-post`), the collection data is already cached from the list page. The runtime extracts the matching item — no extra fetch needed.

But when a user **lands directly** on a detail page (e.g., bookmarked `/articles/my-post`), the collection isn't cached. By default, the runtime fetches the full collection just to extract one item. For large collections or expensive API calls, this is wasteful.

The `detail` field on a fetch config tells the runtime how to fetch just the single entity:

```yaml
# pages/articles/page.yml
fetch:
  url: https://api.example.com/articles
  schema: articles
  detail: rest
```

### URL Conventions

| Value          | URL derived              | Example for id=`my-post`                                         |
|----------------|--------------------------|------------------------------------------------------------------|
| `rest`         | `{url}/{value}`          | `https://api.example.com/articles/my-post`                       |
| `query`        | `{url}?{param}={value}`  | `https://api.example.com/articles?id=my-post`                    |
| Custom pattern | Replace `{param}` in URL | `https://api.example.com/article/{id}` → `.../article/my-post`   |

### The list's query string carries over

`rest` and `query` build the detail URL from the list URL, so a query string on the list survives
onto the single-entity fetch:

```yaml
fetch:
  url: https://api.example.com/articles?lang=en&api_key=abc
  detail: rest
# detail fetch → https://api.example.com/articles/my-post?lang=en&api_key=abc
```

This is usually what you want, because the params a list carries are typically the ones a
single-record read still needs — locale, an API key, a tenancy id. Dropping them would return the
wrong language, or nothing at all.

Pagination params (`?_limit=12`, `?page=2`) come along too. They are meaningless for a single
record, but harmless.

⛔ **The one to check is a param that narrows the response**, such as `?fields=summary` or
`?select=title`. Carried onto a detail request, it truncates the very record the detail fetch exists
to get in full — and it fails quietly: the request succeeds, the record arrives, and only some
fields are missing, so it reads as a bug in your component rather than in the URL.

To send a different URL, write a custom pattern. It is used verbatim, so nothing carries over unless
you put it there:

```yaml
fetch:
  url: https://api.example.com/articles?fields=summary   # list: summaries are enough
  detail: https://api.example.com/articles/{id}          # detail: the whole record
```

### Resolution order

1. Collection already cached? → extract item locally. No fetch needed.
2. `detail` defined? → fetch just the one entity.
3. No `detail`? → fetch the full collection, cache it, extract the item.

### What the component receives

Either way, the focused record arrives under the **collection key** as a single-element array. A detail section reads `content.data.articles[0]`:

```js
// From a detail query (direct landing) or a cached collection (SPA navigation),
// the detail page delivers the focused record as a one-element array:
content.data.articles      // [{ id: 'my-post', title: '...' }]
content.data.articles[0]   // { id: 'my-post', title: '...' }
```

The access pattern is identical in both cases — `detail` only changes *how* the runtime obtains that one record (a single-entity fetch vs. extracting from the cached collection), not how the component reads it. Components that handle `const article = content.data.articles?.[0]; if (!article) return ...` work in both cases.

### Detail query examples

```yaml
# REST convention — GET /api/articles/{id}
fetch:
  url: https://api.example.com/articles
  schema: articles
  detail: rest

# Query param — GET /api/articles?id={id}
fetch:
  url: https://api.example.com/articles
  schema: articles
  detail: query

# Custom URL pattern
fetch:
  url: https://api.example.com/articles
  schema: articles
  detail: https://api.example.com/article/{id}
```

---

## Troubleshooting

### "No data found for dynamic page"

**Cause:** Parent `page.yml` doesn't have a `fetch` config or the fetch returned empty data.

**Fix:** Ensure the folder-level or parent `page.yml` references the collection data:

```yaml
data: articles
```

### Items missing from output

**Cause:** Items don't have the required param field.

**Fix:** Ensure every item has the field matching your folder name:

```json
{ "id": "my-post", "title": "..." }
```

### Component shows "not found" message

**Cause:** The ID was not found in the collection (EntityStore validates every ID against the collection before resolving).

**Fix:** This is usually the right signal — show a proper not-found UI. Verify the folder-level `page.yml` declares the right collection, and that every item in the collection has the param field (e.g., `slug` for `[slug]/`). Remember the focused record is at `content.data.articles[0]`, not a separate singular key.

Delivery itself is automatic; no `meta.js` opt-in is required.

### Wrong data in component

**Cause:** The component reads a different key than the fetch delivers.

**Fix:** Ensure the key matches the collection name. The same key carries the array on both list and detail pages:

```yaml
# page.yml
fetch:
  schema: articles
```

```js
// meta.js — declaration is optional; it sets the schema for the 'articles' key
data: { articles: '@/article' }
```

```jsx
// component — same key on list and detail pages
const articles = content.data.articles || []   // list page
const article = content.data.articles?.[0]      // detail page
```

---

## See Also

- [Data Fetching](./data-fetching.md) — Load external data from files or APIs
- [Content Structure](./content-structure.md) — How content is parsed and structured
- [Component Metadata](./component-metadata.md) — Full meta.js schema reference
