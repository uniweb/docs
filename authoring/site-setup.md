# Setting Up Your Site

This guide walks you through configuring your Uniweb site — naming it, organizing pages, adding languages, enabling search, and deploying to different environments. Everything happens in one file: `site.yml`.

No coding required. You edit a configuration file, and the site handles everything else.

---

## Where Configuration Lives

Your site folder has a `site.yml` file at the root:

```
site/
├── pages/
├── locales/           ← translation files (if multilingual)
├── site.yml           ← your site configuration
└── theme.yml          ← visual identity (colors, fonts)
```

This file controls *what* your site is — its name, its pages, its languages, its features. For *how it looks*, see the [Theming guide](./theming.md).

---

## Naming Your Site

Start with the basics:

```yaml
name: My Company
description: We build things that matter
```

The name appears in the browser tab, search results, and anywhere your template shows the site name (like the header or footer). The description is used for SEO — search engines show it below your page title in results.

That's a complete `site.yml`. Everything else has sensible defaults.

---

## Organizing Your Pages

Your pages come from folders inside `pages/`. By default, the site discovers all of them automatically and uses their folder names as routes:

```
pages/
├── home/          → /
├── about/         → /about
├── services/      → /services
└── contact/       → /contact
```

### Setting the Homepage

Tell the site which folder should be the homepage:

```yaml
index: home
```

The `home` folder becomes `/` (the root URL). Everything else keeps its folder name as the route.

Without `index:`, the site picks the page with the lowest `order` value in its `page.yml`, or the first folder alphabetically.

### Controlling Page Order

To control navigation order, list pages with the `...` wildcard in `site.yml`:

```yaml
pages: [home, services, about, ..., contact]
```

This puts `home` first (making it the homepage), then `services`, then `about`, then any other pages, then `contact` last. The `...` means "everything else goes here."

```yaml
# home first, rest after in natural order
pages: [home, ...]

# home first, about second, rest after
pages: [home, about, ...]
```

You can also control individual page position with `order:` in each page's `page.yml`:

```yaml
# pages/about/page.yml
title: About Us
order: 2
```

Lower numbers come first. Pages without an `order` appear after ordered pages.

### Hiding Pages from Navigation

To show only specific pages in navigation (while keeping others accessible by URL):

```yaml
pages: [home, services, about, contact]
```

Without `...`, only the listed pages appear in navigation. Unlisted pages like `legal` are still built and accessible by URL but won't show in the nav.

**When to use each approach:**

| Approach | Best for |
|----------|----------|
| `index: home` | Most sites — auto-discovers pages, you just pick the homepage |
| `pages: [home, about, ...]` | When you want a specific order but still auto-discover everything |
| `pages: [home, about]` | When you want precise control over what appears in navigation |
| `order:` in page.yml | When each page controls its own position |

**Tip:** Use `pages:` with `...` when you want ordering. Use `pages:` without `...` when you want to hide pages from the nav.

### Documentation-Style Pages

By default, each page folder can contain multiple `.md` files — they become sections of that page (**page mode**). This works well for marketing pages with distinct sections (hero, features, pricing).

But for documentation or article-based sites, you typically want each `.md` file to be its own page. Instead of creating a folder for every single page, place a `folder.yml` in the directory to switch to **folder mode**:

```
pages/docs/
├── folder.yml               ← switches to folder mode
├── getting-started.md       → /docs/getting-started
├── configuration.md         → /docs/configuration
└── api-reference.md         → /docs/api-reference
```

Each `.md` file becomes a separate page. The page title comes from the `# Heading` in the file. The `folder.yml` can set a title for the section and control ordering:

```yaml
# folder.yml
title: Documentation
pages: [getting-started, configuration, ...]
```

Pages listed before `...` appear first, in that order. The rest appear after in their natural order. Without `...`, only listed pages appear in navigation.

This works at any level — put `folder.yml` in a subfolder to create nested documentation. A subfolder with `page.yml` instead switches back to page mode (multiple sections per page).

For the full reference, see [Content Mode](../reference/site-configuration.md#content-mode).

---

## Adding Languages

If your site needs multiple languages, tell it which ones you support:

```yaml
defaultLanguage: en
languages: [en, es, fr]
```

The `defaultLanguage` is whatever language your content is written in. It gets no URL prefix — visitors see `/about`. Other languages get a prefix — `/es/about`, `/fr/about`.

### Adding Display Names

By default, the site uses built-in labels for common languages. To customize what appears in a language switcher:

```yaml
defaultLanguage: en
languages:
  - code: en
    label: English
  - code: es
    label: Español
  - code: fr
    label: Français
```

### Auto-Discovering Languages

If you'd rather let the site detect languages from your translation files:

```yaml
defaultLanguage: en
languages: '*'
```

The site looks at your `locales/` folder and adds every language it finds a translation file for.

### Translated URLs

By default, URLs keep the same path across languages — `/about` becomes `/es/about`. If you want URLs to be translated too (e.g., `/es/acerca-de`), add route translations:

```yaml
defaultLanguage: en
languages: [en, es]
i18n:
  routeTranslations:
    es:
      /about: /acerca-de
      /services: /servicios
      /contact: /contacto
```

The site handles the mapping — navigation links, language switcher, and internal links all use the correct translated URL automatically.

For the full translation workflow (extracting strings, providing translations, checking coverage), see the [Translation guide](./translating.md).

---

## Enabling Search

Built-in full-text search is available with one line:

```yaml
search:
  enabled: true
```

The site generates a search index at build time and your template's search component handles the rest. Visitors can search by title, headings, paragraphs, and link text.

### Excluding Pages from Search

If some pages shouldn't appear in search results:

```yaml
search:
  enabled: true
  exclude:
    routes: [/admin, /drafts]
```

For more search options, see the [Search guide](./search.md).

---

## Records and Queries

Records let you create structured data from markdown files — like blog posts, team members, or product listings. Instead of writing JSON, you write markdown files in a folder, and a named *query* says how components reach them:

```yaml
queries:
  articles:
    schema: '@/article'
    sort: date desc

  team:
    schema: '@/person'
    sort: order asc
```

Each markdown file in `entities/article/` becomes an item the `articles` query returns, sorted by date. Pages can then display this data using their template's components.

For the full guide, see [Working with Records](./collections.md). For technical details, see [Content Records](../reference/content-collections.md).

---

## Deploying to a Subdirectory

Most sites deploy to the root of a domain — `https://example.com/`. But sometimes you need to deploy under a subdirectory, like `https://example.com/docs/` or `https://username.github.io/my-project/`.

Set the base path in `site.yml`:

```yaml
base: /docs/
```

This tells the site to prefix all URLs with `/docs/`. Navigation, links, assets, and the language switcher all work correctly under the subdirectory.

**When you need this:**
- GitHub Pages project sites (not `username.github.io`, but `username.github.io/repo-name/`)
- Sites hosted under a path on a shared domain
- Demos or previews at paths like `/demos/my-site/`

**When you don't need this:** If your site is at the root of a domain (including custom domains on GitHub Pages, Vercel, Netlify, etc.), you don't need `base:` at all.

---

## Global Data

If your site needs data available on every page — like a shared collection or configuration from an API:

```yaml
data: config
```

If you have a `entities/config/` collection, this makes it available to all pages. Components that expect `config` data will receive it automatically.

You can also fetch from a remote URL:

```yaml
fetch:
  url: https://api.example.com/config
  as: config
```

For details, see [Data Fetching](../reference/data-fetching.md).

---

## Build Options

Control how your site is built for production:

```yaml
build:
  prerender: true
```

**Pre-rendering** (the default) generates an HTML file for each page at build time. This means:
- Pages load fast — the content is already in the HTML
- Search engines can read your content
- Pages work even without JavaScript

If you set `prerender: false`, the site generates a single HTML file and renders everything in the browser with JavaScript. This is useful for fully dynamic sites but is slower for visitors and less SEO-friendly.

Most sites should leave pre-rendering on.

---

## Putting It All Together

Here's a complete `site.yml` for a company website with multiple languages and a blog:

```yaml
# Identity
name: Acme Corp
description: Building the future of widgets

# Pages
index: home

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

# Blog content
queries:
  articles:
    schema: '@/article'
    sort: date desc
```

And here's a minimal one for a simple single-language site:

```yaml
name: My Portfolio
index: home
```

You only need to include what you're using. Start simple and add settings as you need them.

---

## Tips

### Start with the minimum

A `site.yml` with just `name:` works. Add configuration as your site grows. You don't need to decide on languages, search, or records up front.

### Use `pages:` with `...` for ordering

`pages: [home, about, ...]` gives you control over order while still auto-discovering new pages. Without `...`, you'd have to manually update the list every time you add a page. For simple sites, `index: home` is enough.

### Test your base path locally

If you're deploying to a subdirectory, test it before deploying:

```bash
pnpm build
npx serve dist
```

Visit `http://localhost:3000/your-base-path/` to verify everything works.

### One language at a time

If adding translations, get one additional language working before adding more. The workflow is the same for each language — once you've done it once, the rest is repetition.

---

## Quick Reference

| Setting | What it does | Example |
|---------|-------------|---------|
| `name` | Site name for titles and metadata | `name: My Site` |
| `description` | SEO description | `description: A great site` |
| `index` | Which folder is the homepage | `index: home` |
| `pages` | Page order with `...` wildcard (or strict without it) | `pages: [home, about, ...]` |
| `base` | Base path for subdirectory deployment | `base: /docs/` |
| `defaultLanguage` | Primary language (no URL prefix) | `defaultLanguage: en` |
| `languages` | Supported languages | `languages: [en, es, fr]` |
| `search.enabled` | Turn on full-text search | `enabled: true` |
| `build.prerender` | Generate static HTML (default: true) | `prerender: true` |
| `queries` | Named queries over your records (or use `queries.yml`) | See [Content Records](../reference/content-collections.md) |
| `fetch` | Global data source | See [Data Fetching](../reference/data-fetching.md) |

---

## What's Next?

- **[Writing Content](./writing-content.md)** — How to write sections in markdown
- **[Theming](./theming.md)** — Customize colors, fonts, and dark mode
- **[Translating Your Site](./translating.md)** — Full translation workflow
- **[Records](./collections.md)** — Blog posts, team members, products, and other repeating content
- **[Recipes](./recipes.md)** — Copy-paste solutions for common patterns
- **[Deployment](../reference/deployment.md)** — Deploy to Vercel, Netlify, GitHub Pages, and more
