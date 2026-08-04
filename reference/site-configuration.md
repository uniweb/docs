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
keywords: [components, react, cms]   # Default meta keywords (pages can override)
seo:                                 # Site-level social card + SEO defaults
  image: /og-default.png             # Default Open Graph / social-sharing image
  ogTitle: My Site

# Page Ordering
pages: [home, about, ...]            # Inclusive order (first is homepage, ... = rest)
pages: [home, about, docs]           # Strict order (unlisted hidden from nav)
index: home                          # Or just name the homepage

# Languages
defaultLanguage: en
languages: [en, es, fr]              # Or '*' to auto-discover from locales/

# Code — the foundation, its extensions, and the runtime
foundation: '@acme/marketing@1.2.3'  # Or a workspace package name, or a full URL
extensions:                          # Secondary foundations (optional)
  - '@acme/effects@0.3.1'
runtime: 0.9.6                       # Pin the runtime version (optional)

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

## Code: Foundation, Extensions, Runtime

A site is content; the code that renders it comes from three declarations. All three
take the same kinds of value, because **an extension is a foundation** and the runtime
is versioned like one.

```yaml
foundation: '@acme/marketing@1.2.3'   # the primary — required
extensions:                            # secondary foundations — optional
  - '@acme/effects@0.3.1'
runtime: 0.9.6                         # optional; the host chooses when omitted
```

### `foundation`

The component system your pages are composed from. Four accepted shapes:

| Shape | Example | Meaning |
|---|---|---|
| workspace package name | `src` | a foundation in this repo (follow the `file:` dep to its folder) |
| versioned catalog ref | `@acme/marketing@1.2.3` | published; loaded by the host |
| full URL | `https://cdn.example.com/entry.js` | loaded from that URL |
| object form | `{ url: 'https://…' }` | same, with an explicit CSS URL if needed |

A **versionless** `@org/name` is an error rather than a shorthand — the build asks for
a version. Foundations are never npm packages; don't `npm install` one.

### `extensions`

Secondary foundations that contribute additional section types. Each entry accepts the
**same shapes** as `foundation:`, and the primary wins on a name collision.

```yaml
extensions:
  - '@acme/effects@0.3.1'              # catalog ref  — recommended
  - effects                            # a workspace package name (local development)
  - https://cdn.example.com/e/entry.js # an absolute URL
```

> **A site-relative URL (`/effects/entry.js`) only works where the site serves its own
> files** — `uniweb export` and `uniweb deploy --host=<adapter>`. A site published to
> Uniweb hosting ships no JS, so nothing serves that path; `uniweb publish` rejects it
> and points you at the catalog-ref form. Register the extension
> (`uniweb register` in its directory) and reference it like any other foundation.

When you reference a **workspace-local** extension, `uniweb publish` brings it along the
same way it does the primary: it releases the extension if its code changed or isn't
registered yet, and pins the released `@scope/name@version` on the published site.

### `runtime`

The `@uniweb/runtime` version the site is served with. Optional — omit it and the host
picks. Pin it to hold a site on a known version:

```yaml
runtime: 0.9.6
```

`uniweb publish` validates a pin against the versions the backend reports installed and
fails with the list if it can't be satisfied, rather than publishing a site that can't
render. This field applies to Uniweb hosting; `export` and `deploy --host` bake the
runtime at build time instead.

---

## SEO & Social Sharing

Site-level metadata for the homepage's social card and search — and the defaults every page inherits. These mirror the page-level `seo:` / `keywords:` in [page.yml](./page-configuration.md#seo-configuration), hoisted to the site root.

```yaml
keywords: [components, react, cms]   # Default keywords (pages can override)
seo:
  image: /og-default.png             # Default Open Graph / social-card image
  ogTitle: Acme — Build with Components
  ogDescription: The component content platform.
  noindex: false                     # Set true to keep the whole site out of search
```

| Field | Type | Description |
|-------|------|-------------|
| `keywords` | string[] | Default meta keywords; a page's own `keywords` override |
| `seo.image` | string | Default Open Graph / social-sharing image (the site's social card) |
| `seo.ogTitle` | string | Default social title; a page's own title or `seo.ogTitle` wins |
| `seo.ogDescription` | string | Default social description; a page's description or `seo.ogDescription` wins |
| `seo.noindex` | boolean | Keep the entire site out of search engines (cascades to every page) |

**Cascade:** site-level `seo` and `keywords` are *defaults*. Each page overrides any field it sets — the page wins, the site fills the gaps. The social image is the field most worth setting once at the site level.

These render into the static HTML `<head>` (Open Graph, Twitter Card, canonical, robots) for the homepage and every page, so crawlers and social unfurlers see them without running JavaScript. For arbitrary tags beyond these, use [Custom Head Injection](#custom-head-injection).

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

Without `...`, only listed pages appear in navigation. Unlisted pages are still built and reachable by URL, but suppressed from every nav menu (equivalent to `hideIn: ['*']` — a nav-only exclusion, not `hidden`, which would drop them from the published site).

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
| `defaultLanguage` | string | Primary language (no URL prefix). Defaults to the first entry in `languages`, or `en` |
| `languages` | array | Supported languages — the working set you author in |
| `publishLanguages` | array | Which declared languages ship in a published build. Absent = all of them |

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

Plain string codes are the canonical form; the object form is legacy and only
affects switcher labels (`@uniweb/kit` provides display names for plain codes).

### Draft Languages (`publishLanguages`)

`languages` is your working set; `publishLanguages` declares which of them a
published build actually ships. A declared language you're still translating
stays fully previewable in `uniweb dev` but is excluded from production
output until you add it to the list:

```yaml
languages: [en, fr, de]        # working on all three
publishLanguages: [en, fr]     # de is still a draft — dev-only
```

Rules:

- **Absent field** — every declared language is published (the default, and
  the behavior of all existing sites).
- **Published builds** exclude unlisted languages everywhere a visitor could
  see them: no `dist/{locale}/` output, no locale-switcher entry, no sitemap
  or `hreflang` references. To visitors, a draft language is indistinguishable
  from an undeclared one.
- **`uniweb dev` ignores the list** — drafts render normally so you can work
  on them, the same way `hidden` pages stay previewable in dev.
- **The default language must be published.** A `publishLanguages` that
  excludes the effective default (or an empty list) fails the build with a
  clear error.
- **Codes not in `languages` are kept but inert.** If you remove a language
  from `languages` while it's listed in `publishLanguages`, the entry stays
  (with a build warning) — re-declaring the language later restores it as
  published without touching the list again.
- `uniweb i18n` commands keep operating on the full declared set — drafts are
  exactly what you're translating.

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

See [Internationalization](../development/internationalization.md) for the full guide.

### Advanced i18n Options

Less common settings remain under the `i18n:` key:

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

See [Site Search](../authoring/search.md) for details.

---

## Form Submissions

Declare where this site's forms send their submissions.

```yaml
submit: /forms
```

**Optional, and often unnecessary.** A form's destination comes from the first
of these that applies:

1. `submit:` here, if you set it.
2. One the host supplies — a site published to Uniweb Cloud gets submission
   handling from the platform and normally needs no `submit:`.
3. Neither, in which case forms render disabled rather than posting a visitor's
   answers to an endpoint that may not exist.

So set this when *you* are providing the endpoint — `uniweb export`, or a
`deploy --host` target with its own form handling. Setting it on Uniweb Cloud
overrides what the platform would have supplied.

### Full Options

```yaml
submit: /forms                              # shorthand

submit:
  endpoint: /forms                          # object form

submit: https://forms.example.com/intake    # another origin
```

A relative endpoint resolves against the site's `base:`, so one spelling works
whether the site is served from the root or from a subdirectory. An absolute
URL is used as written.

See [Receiving Form Submissions](../development/receiving-form-submissions.md)
for the component side.

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

Every section on every page receives this data automatically in `content.data.config`.

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
    where:
      published: { ne: false }

  team:
    path: collections/team
    sort: order asc
```

### Collection Options

| Option | Description |
|--------|-------------|
| `path` | Folder containing markdown files |
| `sort` | Sort expression (`field asc/desc`) |
| `where` | Filter predicate (where-object) |
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

#### Giving a mounted route a layout or a title

Add a local folder for the route holding a `folder.yml` — `folder.yml` rather than `page.yml`, because what is mounted is a folder of pages, and that filename is also what tells the build how to read the mounted tree:

```
site/
├── site.yml              # paths: { pages/docs: ../../../docs }
└── pages/
    └── docs/
        └── folder.yml    # layout, title, SEO for the branch
```

```yaml
# pages/docs/folder.yml
title: Documentation
layout: DocsLayout        # cascades to every page under /docs
```

**The two configs layer.** The mounted directory's own `folder.yml` supplies what your stub leaves out — its ordering, its title — and anything the stub declares wins. So a docs repository that orders its own sections keeps that order, and your site only states what it wants to differ.

If the mounted directory is empty — an unfetched git submodule, most often — the build says so rather than quietly producing a route with no pages under it. In a production build it fails outright.

### Use Cases

- **Separate content repo** — Content in a git submodule, maintained by a different team
- **Shared content** — Multiple sites reading from the same pages or collections
- **Existing docs** — Point `pages` at an existing folder of markdown files
- **Mixed sources** — Some pages local, others from external repos via per-subfolder mounting

When `paths.collections` is set, per-collection `path` values in `collections:` are resolved relative to it instead of the site root.

### Editing external content in dev

Every directory reached through `paths:` is watched, mounts included — editing a file in a mounted docs repository rebuilds and reloads exactly as editing a local page does. Nothing to configure. Files that arrive in bulk count too, so fetching a git submodule while the server is running brings its pages in without a restart.

**Changing the paths themselves still needs a restart.** Watchers are set up once, from the `paths:` in effect at startup, so pointing a mount somewhere new — or adding one — takes hold on the next `uniweb dev`.

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

> For social/SEO meta (Open Graph image, title, description, canonical, robots), use the structured [`seo:` block](#seo--social-sharing) instead — the runtime renders those into every page's `<head>`. Reserve `head.html` for everything else.

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
- [Site Search](../authoring/search.md) — Full-text search setup
- [Internationalization](../development/internationalization.md) — Multi-language support
