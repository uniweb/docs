# Component Content Architecture

Uniweb is built on a pattern called the **Component Content Architecture** (CCA). This page explains the idea — what it is, why it works, and how its principles show up across the framework.

The developer guides and reference docs cover the *how*. This page covers the *why*.

---

## The Core Idea

A website is two things: **content** (what appears) and **components** (how it looks). CCA separates them completely — into different files, different packages, maintained by different people. A thin runtime connects them at build time and in the browser.

Content authors write markdown. Developers build React components. The author names a component in frontmatter (`type: Hero`), and the runtime delivers parsed content to that component as props. Neither side touches the other's files. Neither side can break the other's work.

This separation isn't new — CMSs have done content/template separation for decades. What's different is that CCA makes the boundary a *design-time interface*, not a runtime afterthought. The boundary shapes how components are built, how content is structured, and how the framework itself evolves.

---

## Principles

### The foundation provides options, the site configures

This is the central organizing principle. A **foundation** (React project) provides section types, layouts, and theme variables. A **site** (content project) selects from those options — which section type renders each block of content, which layout structures each page, which theme values produce the visual identity.

The foundation doesn't know which site it serves. The site doesn't know how the foundation is built. The interface between them is a declared set of options (section types, layouts, params, theme variables) and a declared set of choices (frontmatter, page.yml, theme.yml).

This principle appears at every level:

| Foundation provides | Site configures |
|---|---|
| Section types (`Hero`, `Features`, `DocPage`) | Which type renders each section (`type: Hero`) |
| Layout components (`DocsLayout`, `MarketingLayout`) | Which layout structures each page (`layout: marketing`) |
| Theme variables with defaults (`--header-height: 4rem`) | Actual values for this site (`header-height: 5rem`) |
| Params with constraints (`variant: homepage, minimal, split`) | Which variant this section uses (`variant: split`) |
| Content interface expectations (title, subtitle, items) | Actual content (markdown headings, paragraphs, links) |

The same foundation can serve a corporate site, a documentation site, and a personal blog — each with different content, different layouts, different colors, using the same components.

### Components render based on content, not context

A section type receives content and params. It doesn't know which page it's on, which route matched, or which layout contains it. It renders what it's given.

```jsx
// The component doesn't check the URL or the layout
function Hero({ content, params }) {
  const { title, subtitle, links } = content
  return (
    <div className={params.variant === 'split' ? 'grid grid-cols-2' : 'text-center'}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}
```

This is the same principle that makes React components testable — a pure function of props is predictable, composable, and works in any context. CCA extends this to the content layer: a Hero doesn't check `useLocation()` to decide how to render. It checks `params.variant`, which the content author set in frontmatter.

When a component needs to vary by context (marketing hero vs. docs hero), the variation is expressed as different content or different params — not as route detection. The content author writes `variant: split` or uses a different section type entirely. The component doesn't branch on where it is.

This principle has a practical consequence: components work identically in the browser, in prerendered static HTML, and in visual editors. There's no `window` to check, no router to query, no environment to detect.

### Configuration cascades down

Settings flow through a hierarchy: page → folder → site → foundation. Each level inherits from the one above and can override specific values.

```
page.yml  >  folder.yml  >  site.yml  >  foundation defaults
```

A layout name set in `folder.yml` applies to all pages in that folder. A page can override it. A site-wide default in `site.yml` applies to all pages that don't have a more specific setting. The foundation declares the ultimate fallback.

This cascade is the same pattern as CSS specificity, applied to configuration. It means:

- **Bulk assignment is natural.** Set `layout: marketing` in a folder.yml and all marketing pages inherit it.
- **Exceptions are local.** One page in the folder can override with `layout: special`.
- **No central routing table.** Configuration lives where the content lives, not in a separate mapping file.

### Addressable by name

Content authors reference things by name. `type: Hero` in frontmatter. `layout: marketing` in page.yml. `theme: dark` on a section. These names are the interface between the content world and the component world.

Names are discovered from the file system — a `Hero/` folder in `src/sections/` becomes the section type "Hero." A `MarketingLayout/` folder in `src/layouts/` becomes the layout "MarketingLayout." No registration step, no config file mapping names to imports. The build scans directories and generates the wiring.

This convention-over-configuration approach means the file system is the source of truth for what a foundation offers. Looking at `src/sections/` tells you every section type available. Looking at `src/layouts/` tells you every layout available. No indirection.

### Metadata declares the interface

Section types and layouts can declare their interface through `meta.js` — what content they expect, what params they accept, what their defaults are:

```js
// src/sections/Hero/meta.js
export default {
  params: {
    variant: {
      type: 'select',
      options: ['homepage', 'minimal', 'split'],
      default: 'homepage',
    },
  },
  content: {
    title: 'Main heading',
    subtitle: 'Supporting text',
    links: 'Call-to-action buttons',
  },
}
```

This metadata serves multiple consumers:

- **The runtime** uses defaults to guarantee that `params.variant` always has a value — components never need null checks.
- **Visual editors** read the metadata to build editing interfaces — dropdowns for select params, text fields for content.
- **The build** generates `schema.json` from all metadata, making the foundation's capabilities machine-readable.
- **Documentation tools** can auto-generate component catalogs from the metadata.

The metadata is optional. A section type without `meta.js` works — it gets an implicit empty interface. But as a foundation matures, metadata refines the contract between content and code.

### The site controls the theme, not the foundation

The foundation declares theme variables with defaults. The site sets actual values. Components use CSS variables that resolve differently depending on context.

```yaml
# theme.yml (site)
colors:
  primary: '#2563eb'
vars:
  header-height: 5rem
```

```jsx
// Component (foundation) — uses tokens, doesn't set colors
<header style={{ height: 'var(--header-height)' }}>
  <h1 style={{ color: 'var(--heading)' }}>{title}</h1>
</header>
```

The same foundation renders in corporate blue for one site and forest green for another. The components don't change — the tokens resolve to different values.

This inversion of control (site controls appearance, foundation controls structure) is what makes foundations portable. A foundation that hardcodes `bg-blue-600` works for one site. A foundation that uses `var(--bg)` works for any site that provides a theme.

---

## How the Pieces Compose

CCA's units compose at multiple levels:

**Sections compose into pages.** Each markdown file in a page folder is a section. The page is the composition — a Hero followed by Features followed by a CTA. The content author controls the composition by adding, removing, and reordering files.

**Layout areas compose into page structure.** A layout defines slots — header, body, footer, sidebar, or any named area the foundation needs. The site provides content for each slot. The layout component arranges them.

**Pages compose into sites.** The folder structure defines routes. `folder.yml` and `page.yml` configure navigation order, layout selection, and data sources. The site is the composition of pages, and its structure is visible in the file system.

**Foundations compose with extensions.** A primary foundation provides layout and theming. Extensions contribute additional section types. Content authors use section types from any source — they don't need to know which foundation provides them.

At every level, the pattern is the same: **options provided, choices configured, runtime connects them.**

---

## The Boundary

The boundary between content and code is CCA's defining feature. It's worth being explicit about what lives on each side:

| Content side (site) | Code side (foundation) |
|---|---|
| What the heading says | How the heading renders |
| Which section type to use | What the section type looks like |
| Which layout to use | How the layout arranges areas |
| Theme values (colors, spacing) | Theme variables (tokens, contexts) |
| Navigation links | Navigation component |
| Data source configuration | Data fetching and display |
| Which params to set | What params mean visually |

The boundary isn't rigid — it's a design choice. A "bundled" foundation might hardcode colors and data sources, moving those decisions to the code side. A "portable" foundation pushes them to the content side. Both work. The architecture supports a spectrum, and each project finds its own position based on how many people need to change the site without touching code.

What matters is that the boundary exists and is explicit. When content and code tangle — strings in JSX, layout decisions in components, route detection in headers — every change requires a developer, every deploy requires a build, and every "quick update" becomes a pull request.

---

## CCA Is a Choice, Not an Imposition

Nothing in the framework forces you to adopt CCA patterns. A foundation with a single `App` section type — one JSX file containing the entire page, content hardcoded, no meta.js, no theming — is a valid Uniweb project. It's a classic React site that happens to use Uniweb for routing and static generation. Not very CCA, but fully supported.

From there, CCA can be adopted gradually:

1. **Decompose.** Split the monolith into named section types. Content is still in JSX, but sections are independent and reusable.
2. **Separate content.** Move strings from JSX to markdown. Components read `content.title` instead of hardcoded text. Content authors can now edit without touching code.
3. **Separate theme.** Replace hardcoded Tailwind classes with semantic tokens. The site controls colors via `theme.yml`. The same foundation works for any brand.

Each step is independently useful. A foundation can be at step 2 for its Hero and step 0 for its Footer — on the same page, in the same build. The architecture doesn't enforce a level; it enables a spectrum.

This also means CCA subsumes the classic React SPA. When every convention is stripped away — no meta.js, no content separation, no semantic theming, no layout system — what's left is a Vite + React project with file-based routing. CCA is what you get when you add structure to that baseline, one convention at a time.

See [Converting Existing Designs](../development/converting-existing) for the practical migration path from a monolithic React page to a fully portable CCA foundation.

---

## Where to Go from Here

This page describes the architecture. The rest of the documentation shows how to use it:

- **[What is Uniweb](../getting-started/what-is-uniweb)** — The practical introduction: what a project looks like, what each audience does
- **[Building with Uniweb](../development/building-with-uniweb)** — The developer view: how foundations and sites connect
- **[Thinking in Contexts](../development/thinking-in-contexts)** — Deep dive into semantic theming and why components don't make color decisions
- **[Foundation Categories](../development/foundation-categories)** — The bundled-to-portable spectrum and when each approach makes sense
- **[Custom Layouts](../development/custom-layouts)** — How layout components work and when to build one
