# Site Search

Uniweb includes built-in full-text search powered by [Fuse.js](https://fusejs.io/). Search indexes are generated at build time and loaded on-demand for instant client-side search.

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
4. **Search**: Fuse.js performs fuzzy matching against the index

The index is typically small (tens of KB) and cached in localStorage, so subsequent searches are instant.

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

1. **Fuse.js dependency** in the foundation's `package.json` (i.e. `src/package.json` for the default layout):
   ```json
   {
     "dependencies": {
       "fuse.js": "^7.0.0"
     }
   }
   ```

2. **A search UI component** that uses the search client from `@uniweb/kit`

The academic template includes both of these ready to use.

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
