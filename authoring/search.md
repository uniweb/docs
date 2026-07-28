# Site Search

Uniweb sites have built-in full-text search. By default it runs entirely in the browser against an index generated at build time — no server, no service, no crawler.

Which *provider* serves results is a site setting, not something the foundation decides. A search UI written against the framework works unchanged whether results come from a downloaded index or from a server. That is the same arrangement [data fetching](../reference/data-fetching.md) uses: the site declares the source, components read the results.

## Quick Start

Search works out of the box. If your foundation includes a search UI component (like the academic template's `SearchModal`), users can search your site immediately.

To explicitly enable and configure search, add to `site.yml`:

```yaml
search:
  enabled: true
```

## How It Works

1. **Build time**: Content is extracted from all pages and sections
2. **Index generation**: A `search-index.json` file is created in your build output
3. **Runtime**: The search client loads the index on first use and caches it
4. **Search**: [Fuse.js](https://fusejs.io/) performs fuzzy matching against the index, and results are ordered as described below

The index is cached in localStorage and revalidated against the server on each load, so a rebuilt site never answers from the copy a visitor cached earlier. When the index is unchanged the check costs a few hundred bytes rather than a re-download.

### How results are ordered

Fuzzy matching is what lets a misspelled query still find the right page, but on its own it will rank a near-miss above an exact hit — on page-sized text, "inset" matches "insert" and "instead" about as well as it matches "inset". Left alone, a page that genuinely covers the subject can fall below ten pages that never mention it.

So results are ordered in three tiers, with the fuzzy match kept as the fallback it should be:

1. Every word of the query appears in the **title**
2. Every word appears in the **body**
3. Everything else — the fuzzy tail

Fuse's own relevance ordering decides within each tier. Multi-word queries require *all* words, so "Inset Components" is not satisfied by a page that only says "components". Nothing is discarded: a query that matches nothing literally still returns fuzzy hits, which is what answers a typo.

## Providers

A provider is what actually answers a query.

```yaml
# site.yml
search:
  provider: index        # default — download an index, match in the browser
```

| Provider | What it does | Trade-off |
|---|---|---|
| `index` (default) | Downloads `search-index.json` and matches locally with Fuse.js | Free and works on **any** host, including a plain static one. Fuzzy — tolerates typos. Can only contain what existed at build time. |
| `endpoint` | Queries a server-side search API | Can index content that isn't in your files — records fetched from an API — and can be re-indexed without rebuilding the site. Needs a host that serves one. |
| *any other name* | A search transport supplied by your foundation | Fully open — Typesense, Meilisearch, Pagefind, a vendor API |

### Using a server endpoint

```yaml
search:
  provider: endpoint
  endpoint: _search      # optional; this is the default
```

**`endpoint` is resolved relative to your site's base path**, which is what makes one spelling work everywhere. On a site at the root it resolves to `/_search`; under `base: /docs/` it becomes `/docs/_search`; on a site served from a subpath it follows that subpath. Give an absolute `https://…` URL to point at a search service on another origin.

The response envelope is read leniently — `{ results: [...] }`, `{ hits: [...] }`, `{ items: [...] }`, or a bare array all work — so a self-hosted search backend usually needs no adapter.

### Graceful degradation

If a declared provider fails — the endpoint is unreachable, or the site moved to a host that doesn't serve one — the client falls back to the local index when one exists, and otherwise returns no results with a console warning. A search box never throws at a visitor.

This means moving a site between hosts is safe: search quietly returns to the built-in index.

## Search results

Every provider returns the same result shape, so a search UI is written once.

**Always present** — safe to render without checking:

| Field | Meaning |
|---|---|
| `id` | Stable identifier for the hit |
| `type` | `page`, `section`, or `collection` |
| `route` | Page route the hit belongs to |
| `href` | Where to navigate — includes the `#anchor` when there is one |
| `title` | The hit's own title |
| `pageTitle` | Title of the containing page |
| `excerpt` | Short plain-text summary |
| `snippetHtml` | Matching text with `<mark>` around the query terms |

**Present when the provider can supply it** — `null` otherwise:

`sectionId`, `anchor`, `description`, `component`, `snippetText`, `matches`, `collection`, `item`

Whether one of these arrives is a *deployment* fact, not a content fact — the same site yields `item` (a collection record's fields) from a server provider and `null` from the local index, while `matches` goes the other way. Render them defensively:

```jsx
{result.item?.image && <img src={result.item.image} alt="" />}
```

`snippetHtml` is HTML. Render it through kit's `SafeHtml`, never as plain text.

## Configuration

### Basic Configuration

```yaml
# site.yml
search:
  enabled: true
```

### Full Configuration

```yaml
search:
  enabled: true

  # What to include in the index
  include:
    pages: true        # Page titles and descriptions
    sections: true     # Section content
    headings: true     # Heading text
    paragraphs: true   # Paragraph text
    links: true        # Link labels
    lists: true        # List item text

  # What to exclude
  exclude:
    routes:            # Routes to skip (prefix match)
      - /admin
      - /draft
    components:        # Component types to skip
      - CodeBlock
      - RawHtml
```

All `include` options default to `true`. Exclusions default to empty arrays.

### Disabling Search

```yaml
search:
  enabled: false
```

Or simply omit the `search` configuration—search is enabled by default.

## Foundation Requirements

To use search, your foundation needs:

1. **Fuse.js dependency** in the foundation's `package.json` (i.e. `src/package.json` for the default layout) — required by the `index` provider:
   ```json
   {
     "dependencies": {
       "fuse.js": "^7.0.0"
     }
   }
   ```

   Providers are loaded on demand, so a site using `provider: endpoint` never loads Fuse.js at runtime. Keep the dependency declared anyway unless you are certain no site using your foundation will fall back to the local index.

2. **A search UI component** that uses the search client from `@uniweb/kit`

The academic template includes both of these ready to use.

Nothing in a search UI needs to know which provider is active. If you want to show it — a "live results" badge, say — the client exposes `getProviderName()`, which reports the *active* provider (so it reads `index` after a fallback, not what was declared).

## What Gets Indexed

### Pages

- Title (from `page.yml`)
- Description
- Keywords (from SEO config)

Pages are weighted higher in search results than sections.

### Sections

- Headings (first H1 becomes the section title)
- Paragraphs
- Link labels
- List items

### Excluded Content

The following are automatically excluded:

- Layout panels (header, footer, sidebars)
- Pages marked with `seo.noindex: true`
- Routes and components in `search.exclude`

## Keyboard Shortcuts

The academic template's `SearchModal` includes keyboard support:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search |
| `↑` / `↓` | Navigate results |
| `Enter` | Go to selected result |
| `Escape` | Close search |

## Multi-Locale Support

For sites with multiple locales, separate search indexes are generated:

```
dist/
├── search-index.json      # Default locale
├── es/
│   └── search-index.json  # Spanish
└── fr/
    └── search-index.json  # French
```

The search client automatically uses the correct index based on the active locale.

## Performance

- **Index size**: Typically 20-50KB for small/medium sites
- **Caching**: Index is cached in memory and localStorage
- **Lazy loading**: Fuse.js is dynamically imported only when needed
- **Preloading**: Optional `client.preload()` for instant first search

For large sites (hundreds of pages), consider:
- Excluding verbose components (like full article bodies)
- Using route exclusions for low-value content

## See Also

- [Site Configuration](../reference/site-configuration.md) — Full site.yml reference
- [Content Structure](../reference/content-structure.md) — How content is organized
- [Internationalization](../development/internationalization.md) — Locale-specific search indexes
