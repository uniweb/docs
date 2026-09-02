# Page Configuration

The `page.yml` file in each page folder defines metadata, layout options, SEO settings, and data sources for that page.

## Quick Start

A minimal page.yml:

```yaml
title: About Us
```

That's all you need. The page renders all `.md` files in the folder as sections.

## Full Reference

```yaml
# Identity
title: About Us
description: Learn about our company
label: About                    # Short nav label (defaults to title)
id: about                       # Stable ID for page: links
slug:                           # Localized URL segments (multilingual sites)
  fr: a-propos
  es: acerca-de

# Ordering
order: 2                        # Sort position in navigation

# Child Pages
pages: [team, history, ...]     # Inclusive order (first is index, ... = rest)
index: team                     # Or just set the index page

# Page Visibility
hidden: true                    # Draft: exclude from the published site (page + its subtree)
hideIn: ['*']                   # Reachable, but hidden from every nav menu
hideIn: [header]                # Hidden from named nav areas only (header, footer, sidebar, …)

# Agent Content
knowledge: true                 # Written for an AI agent, not a visitor: never rendered (page + its subtree)

# Layout
layout: DocsLayout              # Layout name (or use default)
layout:                         # Or expanded form:
  name: DocsLayout
  hide: [right]                 # Hide specific areas
  params:                       # Layout-specific params
    sidebarWidth: wide

# Sections
sections: '*'                   # Auto-discover (default)

# Section Nesting
nest:                           # Declare parent-child relationships
  features: [card-a, card-b]   # features gets card-a and card-b as children

# Data
data: articles                  # Collection reference (recommended; a list declares several)
fetch:                          # Advanced: full fetch config
  url: https://api.example.com/team
  schema: team

# Analytics
trackSections: true             # Override the site's `emit` for this page (true or false)

# SEO
seo:
  noindex: false
  image: /og-about.png            # Open Graph / social-card image
  ogTitle: About Acme             # Social title (defaults to the page title)
  ogDescription: Meet the team
  canonical: https://acme.com/about
  changefreq: monthly
  priority: 0.8
```

---

## Identity

```yaml
title: About Us
description: Learn about our company and team
label: About
id: about-page
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title (browser tab, navigation) |
| `description` | string | Meta description for SEO |
| `label` | string | Short label for navigation (defaults to title) |
| `id` | string | Stable ID for `page:` links (see [Linking](../authoring/linking.md)) |

### Why Use Labels?

When your title is long, provide a shorter label for navigation:

```yaml
title: Getting Started with Uniweb Components
label: Getting Started
```

Navigation shows "Getting Started" while the page title remains descriptive.

### Why Use IDs?

IDs give a page stable identity that survives reorganization:

```yaml
# pages/docs/setup/installation/page.yml
id: installation
title: Installation Guide
```

Now `[Install](page:installation)` works regardless of where the page moves.

IDs can be descriptive (like `installation`) or opaque (like `a7f3e2b1`). When editing with Studio, IDs are auto-assigned to any page that doesn't have one — you don't need to set them manually. Explicit IDs are useful when you want meaningful `page:` link targets.

---

## Ordering

Control where the page appears in navigation.

```yaml
order: 2
```

**Sorting rules:**
1. Pages with explicit `order` are sorted by that number (lower first)
2. Decimals are allowed: `order: 1.5` sorts between 1 and 2
3. Pages without `order` appear after all ordered pages
4. Ties are broken alphabetically by title

**Example:**

```yaml
# pages/about/page.yml
order: 1    # Appears first

# pages/research/page.yml
order: 2    # Appears second

# pages/blog/page.yml
order: 3    # Appears third

# pages/legal/page.yml
# No order - appears after ordered pages, sorted by title
```

This also affects index page selection: when no explicit `index` is set, the page with the lowest `order` becomes the index for that level.

---

## Child Page Ordering

When a page has child pages (subfolders), control their order.

### Inclusive Order (Recommended)

```yaml
# pages/docs/page.yml
pages: [getting-started, guides, ...]
```

The `...` wildcard means "all remaining pages here." Listed pages are pinned in position; everything else fills the gap.

- First item becomes the index (route `/docs` shows `getting-started`)
- Others get routes like `/docs/guides`, `/docs/api-reference`
- All unlisted pages still appear in navigation

```yaml
# getting-started first, api-reference last, rest in middle
pages: [getting-started, ..., api-reference]
```

### Strict Order

```yaml
pages: [getting-started, guides, api-reference]
```

Without `...`, only listed pages appear in navigation. Unlisted pages are still built and accessible by URL, but hidden from navigation.

### Just Set the Index

```yaml
index: getting-started
```

Designate which child page is the index. Others are auto-discovered.

### Auto-Discovery (Default)

Omit `pages` and `index` to auto-discover children. They're sorted by their `order` property, and the lowest becomes the index.

---

## Page Visibility

A page has two independent visibility controls. Keep them distinct:

- **`hidden`** — *reachability*. `hidden: true` keeps a page out of the **published site
  entirely** — it isn't built, routed, or reachable. Use it for drafts / work in progress.
  It cascades: hiding a folder hides its whole subtree. The page still renders in
  `uniweb dev` so you can preview it while you work.
- **`hideIn`** — *nav placement*. The page stays routed and reachable; you only control
  which navigation menus list it.

```yaml
hidden: true          # Draft — excluded from the published site (and its subtree)
hideIn: ['*']         # Reachable by URL, but shown in no nav menu
hideIn: [header]      # Hidden from specific named nav areas (a list of area names)
```

`hideIn` lists the nav areas to suppress the page from — `header`, `footer`, or any
area a foundation's layout declares (e.g. `sidebar`). The `'*'` wildcard means every area.

| Option | Header Nav | Footer Nav | Reachable by URL |
|--------|------------|------------|------------------|
| (default) | ✓ | ✓ | ✓ |
| `hideIn: [header]` | ✗ | ✓ | ✓ |
| `hideIn: [footer]` | ✓ | ✗ | ✓ |
| `hideIn: ['*']` | ✗ | ✗ | ✓ |
| `hidden: true` | ✗ | ✗ | ✗ (not published) |

Use cases:
- **Draft / in-progress pages**: `hidden: true` (invisible on the live site; previewable in dev)
- **Landing / thank-you pages** (reached only via a direct link): `hideIn: ['*']`
- **Legal pages**: `hideIn: [header]` (show only in footer)
- **Header-only pages**: `hideIn: [footer]` (show only in header)

> The older `hideInHeader: true` / `hideInFooter: true` booleans still work as shorthand
> for `hideIn: [header]` / `hideIn: [footer]`.

---

## Agent Content (`knowledge`)

A **knowledge page** is content you write for an AI agent rather than for a visitor —
reference material, background, house style, answers to questions people actually ask.
It is **never rendered**: no route, no HTML, nothing a browser can navigate to.

> ⚠️ **It is not published to anyone — it powers a service the site offers.**
>
> What your site publishes, it publishes on equal terms: an AI visiting the site sees
> exactly what a person sees. `llms.txt` and the per-page `.md` files are a convenience
> for that reader, not a privileged tier; no visitor, human or machine, gets more than
> another.
>
> A knowledge page is different **in kind, not in audience**. It is never a page anyone
> reads — it is source material for an assistant the site offers *to its visitors*, who
> ask a question and receive an answer while the material behind it stays unpublished.
> That is why it is excluded from `llms.txt`, the `.md` projections and the search index:
> not because some readers are trusted less, but because a knowledge page was never a page.
>
> If you want content readable by any AI that visits, write an ordinary page — it is
> already published to them, on the same terms as to everyone else.

> ### ⛔ `knowledge:` is not a security control — do not put secrets there
>
> "Not published" is about **who the prose is written for**, not about confidentiality.
> The assistant's whole job is to answer visitors using this material, and it can quote
> it back to whoever asks. A visitor who prompts the assistant can therefore surface
> what a knowledge page says — **by design, not by leak**.
>
> So the test for what belongs here is *"is this written for the assistant to reason
> with?"* — explanations, background, house style, the answers to questions people
> actually ask. Not *"do I want to keep this from people?"* Anything that genuinely must
> not reach a visitor does not belong in your site's content at all.

```yaml
# pages/kb/page.yml   (or folder.yml — both carry it)
title: Product Knowledge
knowledge: true
```

**It cascades to the whole subtree, by route prefix.** One marker on a parent covers every
page beneath it, and the children need no marker of their own. Prefix matching is by
segment, so `/kb` claims `/kb/pricing` and does **not** claim `/kbase`.

```
pages/
├── about/        # rendered normally
└── kb/           # knowledge: true
    ├── page.yml
    ├── pricing/  # inherits — no marker needed
    └── faq/      # inherits
```

A section `type:` in a knowledge page's frontmatter never selects a component, because
nothing renders these pages. Write plain markdown.

### What reaches an agent depends on your host

`knowledge:` describes your *intent*; whether anything can act on it is a property of where
the site is deployed.

| Deployment | What happens |
|---|---|
| `uniweb deploy` — a backend-hosted site | The content travels with the site, so an assistant running over it can grep and read the knowledge material alongside the public content when answering a visitor. |
| `uniweb export`, `uniweb deploy --host <adapter>` — a static host | **The build drops these pages and tells you.** Files are served as files; there is no assistant here, so nothing would read them — and publishing them would turn prose written for a machine reader into pages for the only readers this host has. |

The static-host build prints the routes it dropped:

```
[site-content] Dropped 2 knowledge page(s) from this build: /kb, /kb/pricing
```

That warning is the expected outcome, not an error — it means the flag was honoured. If you
want that content readable by an agent, deploy to a host that provides an endpoint for it.

### Knowledge pages stay out of the public artifacts

The artifacts **your build emits** to describe the public site never name a knowledge page:
`llms.txt`, the per-page `.md` projections, and the search index. Those describe pages a
visitor can reach, and a knowledge page is not one.

> **Scoped deliberately.** This is a statement about what `uniweb build` produces. A host may
> derive these artifacts itself from the content you deploy, rather than serving the copies
> your build made — in which case its rules apply, not these. If that matters to you, ask your
> host how it treats `knowledge:`.

Two exclusions **outrank** `knowledge:`, so a contradiction resolves toward less exposure:

- `agents.exclude` in `site.yml` — the one setting that means "keep agents out"
- an `_`-prefixed route segment — a draft is a draft

### `knowledge` vs `hidden` vs `hideIn`

Three ways a page is "not for a visitor", and they are not interchangeable:

| | Built? | Reachable by URL? | In nav? | Intended reader |
|---|---|---|---|---|
| `knowledge: true` | never rendered | ✗ | ✗ | an AI agent |
| `hidden: true` | ✗ (not published) | ✗ | ✗ | nobody yet — it's a draft |
| `hideIn: ['*']` | ✓ | ✓ | ✗ | a visitor you send the link to |

### A site that is nothing but knowledge

A site is a set of routes. It does not have to have HTML pages at all — and marking the
root `knowledge: true` gives you a site that renders nothing and exists to *be* an agent:
a `/_agent/chat` URL that a web app, a mobile app, or another backend sends requests to.

```
site/pages/
├── page.yml          # knowledge: true — cascades to everything below
├── house-style.md
├── pricing.md
└── support.md
```

The cascade does the rest. On that shape:

| | |
|---|---|
| agent corpus | every page, with its full text |
| `llms.txt` | the site name, and no page list |
| search index | 0 entries |
| per-page `.md` | none emitted |
| HTML routes | none |

**Nothing leaks by construction rather than by configuration** — there is no public surface
for it to leak onto. You are not switching things off one at a time and hoping you got them
all; the site simply has no public half.

> ⛔ **This shape needs a host that actually runs an agent — and deploying successfully is
> not the same as having one.**
>
> On a **static host** every page is dropped, because nothing there can read them, and you
> get an empty SPA shell. The build still reports success: `Collected 0 pages`, zero
> pre-rendered. Zero pages is not an error, so nothing will stop you.
>
> On a **backend-hosted deployment**, whether an agent endpoint exists is the host's
> decision, per site — some deployments do not offer the service at all. Nothing in your
> build can tell you; `resolveService(website, 'assistant')` returns a `url` only where the
> host declared one, and on a knowledge-only site there is no component around to ask.
> **Confirm with your host that the agent is enabled for that site before building an
> integration against it.**

---

## Section Analytics (`trackSections`)

Report which sections of this page visitors actually reach:

```yaml
trackSections: true
```

A `section_view` is sent the first time each section is at least half visible —
once per section per page view, with no duration attached. Read as counts across
a page (*seen by 80% / 40% / 15%*), it tells you where people stopped.

**This is an override, not a switch.** Say nothing and the site's
[`emit`](site-configuration.md#choosing-what-is-sent-emit) decides — which by
default includes `section_view`. Set it explicitly to disagree with the site on
this one page:

```yaml
trackSections: false    # exempt a page whose sections are noisy or uninteresting
```

**Why this one event has a per-page control and the others don't.** A page view
is one event whatever the page; an outbound click is bounded by what a visitor
does. A section view is **one event per section**, so a long page costs twenty
times what a short one does. The control sits where the cost actually varies —
which is why a site with five landing pages and four hundred documentation pages
can instrument the five and leave the rest alone.

It does nothing unless the site declares a [`tracking:`](site-configuration.md#tracking)
destination. With none — the default — nothing is collected and nothing is sent.


## Localized URLs

On a multilingual site, give a page a localized URL segment per language with `slug:`:

```yaml
# pages/About-Us/page.yml
slug:
  fr: a-propos      # /About-Us (en) → /a-propos (fr)
  es: acerca-de     # → /acerca-de (es)
```

The folder name stays the page's stable, canonical route — used in the default language and for internal `page:` links — and each entry sets the URL segment for that locale. Only list the non-default languages; the default language always uses the folder name.

- Each value is a **single path segment** (no slashes or spaces).
- **Nesting composes automatically:** if a parent folder is localized (`/blog` → `/blogue`), its children follow (`/blog/my-post` → `/blogue/my-post`) without repeating the parent. Give a child its own `slug:` only to localize its own segment too.
- Localized URLs flow through navigation, the language switcher, and the sitemap (`hreflang`).

This controls only the **URL**. Translating page *content* (titles, text) is separate — see [Internationalization](../development/internationalization.md).

---

## Layout Options

Control which layout is used and which areas appear on this page.

### Selecting a Layout

```yaml
layout: MarketingLayout
```

If the foundation provides multiple layouts, set which one to use. Pages without an explicit `layout:` use the foundation's `defaultLayout`.

### Hiding Areas

```yaml
layout:
  hide: [left, right]
```

The `hide` array suppresses specific areas on this page. Hidden areas are passed as null to the Layout component.

### Layout Parameters

```yaml
layout:
  name: DocsLayout
  params:
    sidebarWidth: wide
```

Set values for parameters declared in the layout's `meta.js`. Defaults from meta.js apply when not overridden.

### Use Cases

**Full-screen landing page:**
```yaml
title: Welcome
layout:
  hide: [header, footer]
```

**Documentation without sidebars:**
```yaml
title: Quick Reference
layout:
  hide: [left, right]
```

**Different layout for landing pages:**
```yaml
title: Product
layout: MarketingLayout
```

---

## Section Ordering

Control which sections appear and in what order.

### Auto-Discovery (Default)

```yaml
sections: '*'
```

Discovers all `.md` files in the folder, sorted by numeric prefix:

```
pages/home/
├── 1-hero.md         # First
├── 2-features.md     # Second
├── 2.5-testimonials.md  # Between 2 and 3
└── 3-cta.md          # Third
```

### Inclusive Order

```yaml
sections:
  - hero
  - ...
  - cta
```

Pin `hero` first and `cta` last. Everything else appears in between, in their natural (numeric prefix) order. Reference sections by stable name (without numeric prefix and extension) — `hero` finds both `hero.md` and `1-hero.md`.

```yaml
# hero first, rest after
sections: [hero, ...]

# rest first, cta last
sections: [..., cta]
```

### Strict Order

```yaml
sections:
  - hero
  - features
  - testimonials
  - cta
```

Without `...`, only listed sections are included. Reference by stable name (prefix-independent).

### Section Nesting (`nest:`)

Use the `@` prefix on filenames and `nest:` in page.yml to create parent-child section relationships:

```
pages/home/
├── page.yml
├── 1-hero.md
├── 2-features.md       # Parent section
├── 3-pricing.md
├── @logocloud.md       # Child of features (@ = not top-level)
└── @stats.md           # Child of features
```

```yaml
# page.yml
nest:
  features: [logocloud, stats]
```

Child files use the `@` prefix to signal they're not top-level. The `nest:` property declares which parent owns them. This works with all section modes (auto-discovery, inclusive, strict).

**Inline nesting in `sections:`** also works for declaring children directly:

```yaml
sections:
  - hero
  - features:          # Parent section
      - logocloud      # Resolves to @logocloud.md
      - stats          # Resolves to @stats.md
  - ...
  - pricing
```

When both `sections:` inline nesting and `nest:` declare children for the same parent, `nest:` wins.

### No Sections

```yaml
sections: []
```

Pure route page with no content sections (useful for pages that only have child pages).

---

## Data Fetching

Load external data for components on this page.

### Simple Collection Reference

```yaml
data: articles
```

Fetches from `/data/articles.json` (generated from a collection). All sections on the page receive it in `content.data.articles` automatically.

A list declares several, each under its own key:

```yaml
data: [team, articles]
```

Every section on the page receives both — as `content.data.team` and
`content.data.articles` — and ignores the keys it does not use. That is how one
page-level declaration serves sections that need different data.

### Full Fetch Configuration

```yaml
fetch:
  path: /data/team.json
  schema: team
  prerender: true
```

### Remote Data

```yaml
fetch:
  url: https://api.example.com/data
  schema: apiData
  transform: data.items
```

See [Data Fetching](./data-fetching.md) for all options.

---

## SEO Configuration

Fine-tune search engine optimization.

```yaml
seo:
  noindex: false           # Allow indexing (default)
  image: /og-about.png     # Open Graph / social-card image
  ogTitle: About Acme      # Social title (defaults to the page title)
  ogDescription: Meet the team behind Acme
  canonical: https://acme.com/about
  changefreq: monthly      # Sitemap change frequency
  priority: 0.8            # Sitemap priority (0.0-1.0)
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `noindex` | boolean | Prevent search engine indexing |
| `image` | string | Open Graph / social sharing image |
| `ogTitle` | string | Social-card title (defaults to the page title) |
| `ogDescription` | string | Social-card description (defaults to the page description) |
| `canonical` | string | Canonical URL for this page |
| `changefreq` | string | Sitemap hint: `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never` |
| `priority` | number | Sitemap priority (0.0 to 1.0, default 0.5) |

Set site-wide defaults for `image`, `ogTitle`, `ogDescription`, `keywords`, and `noindex` in [site.yml](./site-configuration.md#seo--social-sharing) — a page overrides any field it sets.

### Noindex Pages

```yaml
# pages/admin/page.yml
title: Admin Dashboard
seo:
  noindex: true
```

This page won't appear in search results or the search index.

---

## Dynamic Routes

For pages generated from data, use `[param]` folder naming:

```
pages/blog/
├── page.yml              # data: articles
└── [slug]/               # Dynamic route
    ├── page.yml
    └── article.md
```

The child `page.yml` is minimal:

```yaml
title: Article
```

Page metadata (title, description) comes from the data item at runtime.

See [Dynamic Routes](./dynamic-routes.md) for the full guide.

---

## Versioned Documentation

For versioned docs, folder structure triggers version detection:

```
pages/docs/
├── page.yml              # Optional version metadata
├── v1/
│   └── intro/
└── v2/
    └── intro/
```

Configure version labels in the parent:

```yaml
# pages/docs/page.yml
title: Documentation
versions:
  v2:
    label: "2.0 (Current)"
    latest: true
  v1:
    label: "1.0 (Legacy)"
    deprecated: true
```

See [Versioning](./versioning.md) for details.

---

## Complete Examples

### Marketing Page

```yaml
title: About Us
description: Learn about our mission and team
order: 2

seo:
  image: /og-about.png
  priority: 0.8
```

### Documentation Section

```yaml
title: Documentation
label: Docs
order: 3

pages: [getting-started, guides, ..., api]

layout:
  hide: [right]
```

### Blog Listing

```yaml
title: Blog
description: Latest articles and tutorials

data: articles

seo:
  changefreq: weekly
```

### Admin Page (reachable, not in any menu)

```yaml
title: Admin Dashboard
hideIn: ['*']         # reachable by URL, but shown in no nav menu

layout:
  header: false

seo:
  noindex: true
```

> Use `hideIn: ['*']` (not `hidden: true`) when the page must stay reachable by direct
> URL. `hidden: true` would exclude it from the published site entirely.

---

## See Also

- [Site Configuration](./site-configuration.md) — site.yml reference
- [Internationalization](../development/internationalization.md) — Multilingual content and localized URLs
- [Content Structure](./content-structure.md) — Section content format
- [Linking](../authoring/linking.md) — Stable page references with IDs
- [Dynamic Routes](./dynamic-routes.md) — Data-driven pages
- [Versioning](./versioning.md) — Multi-version documentation
