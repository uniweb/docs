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
4. **Search**: The query is ranked against the index in the browser, as described below — by the same engine a host that answers search uses, so a site's results come back in the same order wherever it is served

The index is cached in localStorage and revalidated against the server on each load, so a rebuilt site never answers from the copy a visitor cached earlier. When the index is unchanged the check costs a few hundred bytes rather than a re-download.

### How results are ordered

Results are ranked by relevance (BM25F):

- **A word in the title counts for more** than the same word in the body, and a page counts for more than one of its sections.
- **Rare words count for more than common ones.** A word that appears on nearly every page barely affects the order, so there is no stop-word list to maintain, in any language.
- **The query's words together as a phrase** rank a result higher.
- **The last word is completed as you type**: `insta` finds `install` and `installation`.
- **A misspelling is corrected only when nothing matched.** A query with no exact hits falls back to words one edit away — `fomr` finds `form` — so a near-miss never outranks a page that uses the word you typed.
- **Accents and case are ignored** (`café` finds `cafe`), and text in scripts written without spaces between words — Chinese, Japanese, Thai — is indexed in pairs of characters, so a query can find a word inside a sentence.

A word that appears nowhere in the site doesn't sink a query: the other words still rank. Words are matched as written, with no stemming — `running` does not find `ran`.

## Providers

A provider is what actually answers a query.

```yaml
# site.yml
search:
  provider: index        # the default; writing it changes nothing — omit it unless
                         # you are switching AWAY from the local index
```

| Provider | What it does | Trade-off |
|---|---|---|
| `index` (default) | Downloads `search-index.json` and ranks it in the browser | Free and works on **any** host, including a plain static one. Corrects typos. Can only contain what existed at build time. |
| `endpoint` | Queries a server-side search API | Can index content that isn't in your files — records fetched from an API — and can be re-indexed without rebuilding the site. Needs a host that serves one. |
| *any other name* | A search transport supplied by your foundation | Fully open — Typesense, Meilisearch, Pagefind, a vendor API |

### Using a server endpoint

```yaml
search:
  provider: endpoint
  endpoint: _search      # required — there is no default
```

**`endpoint` is required.** A provider with nowhere to send a query has nothing to do, so search behaves like every other service here: you name the target, or the site has no search. (Until 0.16 an omitted `endpoint` fell back to `_search`. It no longer does — a path a host serves is that host's to name, and a framework guess competes with it.)

**It is resolved relative to your site's base path**, which is what makes one spelling work everywhere. On a site at the root `_search` resolves to `/_search`; under `base: /docs/` it becomes `/docs/_search`; on a site served from a subpath it follows that subpath. Give an absolute `https://…` URL to point at a search service on another origin.

A host that serves your site may offer search itself, in which case it supplies the address and you declare nothing.

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
| `type` | `page`, `section`, or `record` |
| `route` | Page route the hit belongs to |
| `href` | Where to navigate — includes the `#anchor` when there is one |
| `title` | The hit's own title |
| `pageTitle` | Title of the containing page |
| `excerpt` | Short plain-text summary |
| `snippetHtml` | Matching text with `<mark>` around the query terms |

**Present when the provider can supply it** — `null` otherwise:

`sectionId`, `anchor`, `description`, `component`, `snippetText`, `matches`, `group`, `item`

Whether one of these arrives is a *deployment* fact, not a content fact — the same site yields `item` (a record's fields; `group` names the query it came from) from a server provider and `null` from the local index, while `matches` goes the other way. Render them defensively:

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

To use search, your foundation needs **a search UI component** that uses the search client from `@uniweb/kit` — nothing to install beyond kit. The engine that ranks the local index is loaded on demand, only when a site actually queries it, so a site using `provider: endpoint` never downloads it.

The academic template includes a search UI ready to use.

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
- **Lazy loading**: the ranking engine is loaded only when a site queries its local index
- **Preloading**: Optional `client.preload()` for instant first search

For large sites (hundreds of pages), consider:
- Excluding verbose components (like full article bodies)
- Using route exclusions for low-value content

## See Also

- [Site Configuration](../reference/site-configuration.md) — Full site.yml reference
- [Content Structure](../reference/content-structure.md) — How content is organized
- [Internationalization](../development/internationalization.md) — Locale-specific search indexes
