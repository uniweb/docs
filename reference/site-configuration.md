# Site Configuration

The `site.yml` file in your site root defines global settings, page ordering, language support, and feature toggles.

## Quick Start

A minimal site.yml:

```yaml
name: My Site
```

That's all you need to get started. Everything else has sensible defaults.

## Full Reference

```yaml
# Identity
name: My Site
description: A brief description for SEO

# Page Ordering
pages: [home, about, ...]            # Inclusive order (first is homepage, ... = rest)
pages: [home, about, docs]           # Strict order (unlisted hidden from nav)
index: home                          # Or just name the homepage

# Languages
defaultLanguage: en
languages: [en, es, fr]              # Or '*' to auto-discover from locales/

# Features
search:
  enabled: true

# Build Options
build:
  prerender: true                    # Generate static HTML

# Data Sources
fetch:
  path: /data/global.json
  schema: siteConfig

# Content Collections
collections:
  articles:
    path: collections/articles
    sort: date desc

# Custom Content Paths (optional, for external content)
paths:
  pages: ../docs/pages             # Default: pages/
  layout: ../docs/layout           # Default: layout/
  collections: ../content          # Default: (site root)
```

---

## Identity

```yaml
name: My Site
description: Build modern websites with components
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Site name (used in `<title>`, metadata) |
| `description` | string | Default meta description |

---

## Page Ordering

Control the order of top-level pages and designate your homepage.

### Inclusive Order (Recommended)

```yaml
pages: [home, about, ...]
```

The `...` wildcard means "all remaining pages here." Pages before `...` appear first in that order; pages after `...` appear last. Everything else fills the middle.

- First item becomes the homepage (route `/`)
- Other items get their folder name as route (`/about`, `/docs`, `/pricing`)
- `...` expands to all pages not explicitly listed, in their natural order

```yaml
# home first, contact last, everything else in between
pages: [home, ..., contact]

# home first, about second, rest after
pages: [home, about, ...]

# rest first, legal last
pages: [..., legal]
```

### Strict Order

```yaml
pages: [home, about, docs]
```

Without `...`, only listed pages appear in navigation. Unlisted pages are still built and accessible by URL, but they're hidden from navigation (`hidden: true`).

Use this when you want precise control over what appears in the nav — for example, a landing page with only a few pages in the header.

### Just Set the Homepage

```yaml
index: home
```

Only specify which page is the homepage. Other pages are auto-discovered and sorted by their `order` property.

### Auto-Discovery (Default)

Omit `pages`, `index`, and `order` to auto-discover all pages. They're sorted by the `order` property in each page's `page.yml`, and the lowest `order` becomes the homepage.

---

## Content Mode

By default, `.md` files in a folder are sections of a single page (**page mode**). By placing a `folder.yml` in a directory, you switch it to **folder mode** — where each `.md` file becomes its own page.

| Config file | Mode | Folder is... | `.md` files are... |
|------------|------|--------------|-------------------|
| `page.yml` | page mode | A page | Sections of that page (default) |
| `folder.yml` | folder mode | A container | Individual child pages |

### Folder Mode

Ideal for documentation sites where each file is a standalone article:

```
pages/docs/
├── folder.yml               # Activates folder mode
├── getting-started.md       # → /docs/getting-started
├── configuration.md         # → /docs/configuration
└── advanced/
    ├── folder.yml
    ├── plugins.md           # → /docs/advanced/plugins
    └── themes.md            # → /docs/advanced/themes
```

Page titles come from the H1 heading in each markdown file. Frontmatter remains section configuration (`type:`, `background:`, etc.).

To activate folder mode for the entire site, place a `folder.yml` in the `pages/` directory itself.

### Mode Cascade

The mode set by `folder.yml` or `page.yml` cascades to descendant folders:

1. `folder.yml` in a directory → folder mode for that folder and all descendants
2. `page.yml` in a directory → page mode for that folder and all descendants
3. Neither → inherit from parent (default: page mode)

A single `folder.yml` at the top of a docs tree applies folder mode to the entire tree. A subfolder can override back to page mode with a `page.yml`.

### folder.yml

The configuration file for container folders in folder mode. Analogous to `page.yml` but signals that `.md` files are pages, not sections:

```yaml
# folder.yml
title: Documentation
description: API reference and guides
pages: [getting-started, configuration, ...]
index: getting-started
label: Docs
layout:
  left: true
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Container title (for navigation, breadcrumbs) |
| `description` | string | Meta description |
| `pages` | array | Child page ordering with `...` wildcard support |
| `index` | string | Which child becomes the index page |
| `label` | string | Short navigation label |
| `hidden` | boolean | Hide from navigation |
| `layout` | object | Layout panel overrides |
| `seo` | object | SEO overrides |
| `id` | string | Stable ID for `page:` links |

### Ordering in Folder Mode

Child pages are ordered by:

1. `pages:` array in `folder.yml` with `...` wildcard support (same semantics as site-level)
2. Numeric file prefix (`1-intro.md` before `2-setup.md`)
3. Alphabetical by filename

```yaml
# folder.yml
title: Documentation
pages: [getting-started, configuration, ...]
```

---

## Languages

Enable multi-language support.

```yaml
defaultLanguage: en
languages: [en, es, fr]
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `defaultLanguage` | string | Primary language (no URL prefix) |
| `languages` | array | Supported languages |

### Language Formats

```yaml
# Just codes (display names from @uniweb/kit)
languages: [en, es, fr]

# With custom labels
languages:
  - code: en
    label: English
  - code: es
    label: Español
  - code: fr
    label: Français

# Auto-discover from locales/ folder
languages: '*'
```

### Translation Workflow

Translations are extracted and managed through a hash-based system:

```bash
uniweb i18n extract    # Extract translatable strings
uniweb i18n sync       # Detect changes
uniweb i18n status     # Check coverage
```

This generates `locales/manifest.json` with all translatable content, and you provide translations in `locales/{locale}.json` keyed by content hash.

### Generated Routes

| Page | Default Locale | Other Locales |
|------|----------------|---------------|
| Home | `/` | `/es/`, `/fr/` |
| About | `/about` | `/es/about`, `/fr/about` |

See [Internationalization](./internationalization.md) for the full guide.

### Advanced i18n Options

Power-user settings remain under the `i18n:` key:

```yaml
i18n:
  routeTranslations: ...
  localesDir: translations         # Default: locales
```

---

## Search

Enable built-in full-text search.

```yaml
search:
  enabled: true
```

### Full Options

```yaml
search:
  enabled: true
  include:
    pages: true
    sections: true
    headings: true
    paragraphs: true
  exclude:
    routes: [/admin, /draft]
    components: [CodeBlock]
```

See [Site Search](./search.md) for details.

---

## Build Options

Configure the production build.

```yaml
build:
  prerender: true
  splitContent: auto
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `prerender` | `true` | Generate static HTML for all pages (SSG) |
| `splitContent` | `auto` | Split page content into separate files for lazy loading |

When `prerender: true`:
- All pages are rendered to HTML at build time
- JavaScript hydrates for interactivity
- Fast initial load, SEO-friendly
- Pages work without JavaScript

When `prerender: false`:
- Single `index.html` with client-side rendering
- Pages render in the browser
- Smaller initial bundle

### Split Content

By default, all page content is embedded in every HTML file. For small sites this is fine — JSON compresses well. For content-heavy sites (large documentation, university websites), the payload grows to several megabytes, duplicated across every prerendered page.

`splitContent` separates page content into individual files (`_pages/*.json`) that are fetched on demand as the user navigates. Only the current page's content is embedded in each HTML file — other pages load lazily.

| Value | Behavior |
|-------|----------|
| `auto` | Split when total content exceeds 100KB (default) |
| `true` | Always split |
| `false` | Never split — all content inline in every HTML file |

With `auto`, a 5-page marketing site stays bundled (fast, no extra requests), while a 50-page docs site splits automatically.

Once a page's content is loaded, it stays cached for the rest of the session — returning to a visited page is instant with no additional fetch.

When [view transitions](../development/view-transitions.md#interaction-with-split-content) are active, the content fetch is hidden behind the transition animation — the user never sees a loading state.

---

## Global Data Fetching

Load data available to all pages.

```yaml
fetch:
  path: /data/site-config.json
  schema: config
```

Components with `inheritData: ['config']` in their meta.js receive this data.

### Options

| Option | Description |
|--------|-------------|
| `path` | Local file in `public/` |
| `url` | Remote URL |
| `schema` | Key in `content.data` |
| `prerender` | Build-time vs runtime fetch |

See [Data Fetching](./data-fetching.md) for the full reference.

---

## Content Collections

Define collections of markdown content that generate JSON data files.

```yaml
collections:
  articles:
    path: collections/articles
    sort: date desc
    filter: published != false

  team:
    path: collections/team
    sort: order asc
```

### Collection Options

| Option | Description |
|--------|-------------|
| `path` | Folder containing markdown files |
| `sort` | Sort expression (`field asc/desc`) |
| `filter` | Filter expression |
| `limit` | Maximum items |
| `excerpt.maxLength` | Auto-excerpt character limit |
| `excerpt.field` | Frontmatter field for excerpt |

Collections generate JSON files in `public/data/`. Use `data: collection-name` in pages to fetch them.

See [Content Collections](./content-collections.md) for details.

---

## Custom Content Paths

By default, site content is read from standard directories relative to the site root: `pages/`, `layout/`, and `collections/`. You can override these locations using the `paths:` group in `site.yml`:

```yaml
paths:
  pages: ../shared-content/pages
  layout: ../shared-content/layout
  collections: ../shared-content/collections
```

Paths are resolved relative to the site root. Absolute paths are also supported.

### Per-Subfolder Mounting

You can mount individual page subfolders from external locations. This is useful when some pages live in a different repository (e.g., a docs submodule) while the rest are local:

```yaml
paths:
  pages/docs: ../../../docs
```

This makes the external `docs/` directory appear as the `docs` subfolder under `pages/`. The site's own `pages/` directory provides the rest of the pages. Multiple subfolder mounts are supported:

```yaml
paths:
  pages/docs: ../../../docs
  pages/blog: ../../../blog-content
```

### Use Cases

- **Separate content repo** — Content in a git submodule, maintained by a different team
- **Shared content** — Multiple sites reading from the same pages or collections
- **Existing docs** — Point `pages` at an existing folder of markdown files
- **Mixed sources** — Some pages local, others from external repos via per-subfolder mounting

When `paths.collections` is set, per-collection `path` values in `collections:` are resolved relative to it instead of the site root.

**Note:** Changing these paths during dev mode requires restarting the dev server — file watchers are configured at startup.

---

## Custom Head Injection

Place a `head.html` file in your site root to inject HTML into `<head>` on every page. The file contents are inserted verbatim — no processing, no YAML wrapping.

```
site/
├── site.yml
├── theme.yml
├── head.html      ← optional, injected into <head>
├── pages/
└── layout/
```

**Common uses:** analytics (Google Analytics, Plausible), tag managers, error monitoring (Sentry), cookie consent scripts, custom meta tags, font preconnects.

### Example: Google Analytics

```html
<!-- site/head.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your Measurement ID from Google Analytics.

### How it works

- The build reads `head.html` and injects it before all other head content (theme CSS, SEO tags, site data).
- In dev mode, changes to `head.html` trigger a page reload automatically.
- In production, the content is baked into every pre-rendered HTML file.
- If the file doesn't exist, nothing is injected — there's no error.

**Note:** For Google Fonts, you don't need to add preconnect links manually. When your `theme.yml` includes font imports, the build injects `<link rel="preconnect">` tags automatically. See [Site Theming → Typography](./site-theming.md#typography).

---

## Complete Example

```yaml
# site.yml

# Identity
name: Acme Corp
description: Building the future of widgets

# Structure
pages: [home, products, about, ..., contact]

# Languages
defaultLanguage: en
languages:
  - code: en
    label: English
  - code: es
    label: Español

# Features
search:
  enabled: true

# Build
build:
  prerender: true

# Global data
fetch:
  path: /data/site-config.json
  schema: config

# Collections
collections:
  articles:
    path: collections/articles
    sort: date desc

  products:
    path: collections/products
    sort: name asc
```

---

## See Also

- [Page Configuration](./page-configuration.md) — page.yml reference
- [Content Collections](./content-collections.md) — Markdown-based data
- [Data Fetching](./data-fetching.md) — Loading external data
- [Site Search](./search.md) — Full-text search setup
- [Internationalization](./internationalization.md) — Multi-language support
