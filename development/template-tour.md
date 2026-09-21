# Template Tour

The official templates aren't just starter projects — they're worked examples of CCA conventions, each adopting a different mix. This guide maps what's where so you can find the pattern you need.

If you haven't read [Foundation Categories](./foundation-categories.md), start there. It explains the bundled-to-portable spectrum; this guide shows where each template's content and data come from, and what to read in it.

---

## The Matrix

A dash means the template doesn't use that convention — not that it can't.

|                                 | docs              | academic        | marketing       | international     | dynamic             |
| ------------------------------- | ----------------- | --------------- | --------------- | ----------------- | ------------------- |
| **Params / presets**            | yes               | yes (extensive) | yes             | yes               | yes                 |
| **content.items**               | yes               | yes (extensive) | yes             | yes               | yes                 |
| **Tagged data blocks**          | yes (`yaml:api`)  | —               | —               | —                 | yes (`yaml:nav`)    |
| **Queries and records**         | —                 | —               | —               | yes               | yes (live APIs too) |
| **Parametric pages**            | —                 | —               | —               | yes               | yes                 |
| **Semantic CSS tokens**         | yes               | yes             | yes             | yes               | yes                 |
| **theme.yml**                   | yes               | —               | yes             | yes               | yes                 |
| **Per-section `theme:` / `background:`** | —        | yes             | yes             | yes               | yes                 |
| **i18n**                        | —                 | —               | —               | yes (3 languages) | —                   |
| **Loading states**              | —                 | —               | —               | —                 | yes                 |

Every template styles its section types with kit's semantic tokens (`@uniweb/kit/theme-tokens.css`). Where they differ is where content comes from: `docs`, `academic` and `marketing` render what authors write in markdown; `international` and `dynamic` add records and queries, and `dynamic` reads live APIs. The rest of this guide walks through each one.

---

## docs — Documentation Site

A documentation site with versioned content (`pages/docs/v1/`, `pages/docs/v2/`), API reference pages, search, and syntax highlighting.

### What to study here

**Params for layout control.** `DocSection/meta.js` exposes `show_navigation` (previous/next links) and `max_width` (`prose`, `lg`, `xl`, `full`). The content author controls both per page, and the component maps `params.max_width` to a class. Params doing real work without any theming machinery.

**Navigation integration.** `LeftPanel` builds the sidebar from the site's page hierarchy — `website.getBranchHierarchy()` for the current branch, `getPageHierarchy()` otherwise. The clearest example of a section type that consumes the site's routing data rather than markdown content.

**API reference with a data schema.** `ApiReference/meta.js` uses its `data:` field to declare the schema of an API definition (method, path, parameters, request body, response). Content authors write API specs in tagged YAML blocks (`yaml:api`) and the component renders interactive documentation. This shows how a `meta.js` `data:` entry can structure complex domain-specific content without any query.

**Context overrides in `theme.yml`.** The site's `theme.yml` maps semantic tokens to specific values per context (light and dark), the way a documentation site wants its sections to read — see its comments.

### What it keeps bundled

The section types are a documentation shell — navigation panels, doc sections, code blocks, a search modal — built for one kind of site. Nothing about them is specific to one deployment, but they are not meant to render a marketing page.

---

## academic — Domain-Specialized

An academic research portfolio with publication lists, team grids, timelines, and LaTeX math rendering.

### What to study here

**content.items for structured repeating content.** `PublicationList` is the best example in any template of turning `content.items` into domain-specific structures: its `parsePublication` function reads each item's title, its paragraphs as authors, venue, year and DOI, its pretitle as the publication type, and its links. See `PublicationList/index.jsx`.

**Domain-specific variant params.** `ProfileHero/meta.js` declares a `variant` param with `researcher`, `lab`, and `department` options. Each variant adjusts the layout and fields displayed. The content author picks the profile type from a dropdown; the component renders accordingly.

**Extensive param-driven customization.** `PublicationList/meta.js` has params for citation style (`detailed`, `apa`, `mla`, `chicago`, `ieee`), grouping (`none`, `year`), publication types, cite buttons, search visibility, and a display limit, and presets that combine them into named configurations (`full`, `recent`, `apa`, `mla`, `ieee`). The deepest example of how params and presets create a content-author interface for a complex component.

### What it keeps bundled

Its data. Publications, team members and research areas are written in markdown and parsed from `content.items` — there are no records or queries. That suits a portfolio whose owner writes their own publications; a site that manages hundreds of references would keep them as records instead (see [Working with Data](./working-with-data.md)). It has no `theme.yml` of its own, so it renders with the default theme.

---

## marketing — Content-Driven Marketing Site

A marketing site with hero sections, feature grids, pricing tables, testimonials, and an inset diagram.

### What to study here

**Frontmatter-driven theming.** Content authors control section appearance through frontmatter rather than component params: the home page's hero and call to action use `theme: dark` with a `background:` gradient, and the testimonials use `theme: medium`. Components render with semantic tokens, and the runtime applies each section's context.

**content.items, simply.** `Features.jsx` renders each item of its markdown as a feature card — the simplest version of the pattern `academic`'s `PublicationList` takes much further.

**Params where layout varies.** `SplitContent` takes a `variant` param, and `Grid` and `Testimonials` a `columns` param (`Testimonials` with presets). The rest of the section types need none: what varies is content, not layout.

**Insets.** `sections/insets/Diagram` is an inset — a component authors place inside another section's content with `@Diagram`.

### What it keeps bundled

Its data — every section renders markdown content, with no queries. A marketing site whose case studies or team grow over time would move them to records.

---

## international — Multilingual Site

A multilingual site (English, Spanish, French) with a blog and team pages.

### What to study here

**Translations.** The `site/locales/` directory holds `manifest.json` and one file per language (`es.json`, `fr.json`) for string translations, and `freeform/` for sections translated as whole bodies rather than string by string. If you need to build a multilingual site, this is the reference — see [Internationalization](./internationalization.md).

**Declared data.** The blog's `page.yml` names `query: articles`. `ArticleList` declares `data: { articles: '@std/article' }` in its `meta.js`, and that declaration is what the section receives: the articles, under `articles`, with the field defaults of the shared `@std/article` schema. The about page's `Team` section names `query: team` in its own frontmatter and declares `data: { team: '@/member' }`, a schema of the foundation's own. This is the CCA data layer pattern: the content names the query, the component declares what it renders.

**Parametric pages with i18n.** The `site/pages/blog/[slug]/` folder is a parametric page — one page per article — and translations apply to the records it renders. This shows how CCA's routing and i18n systems compose.

**Semantic theming.** Components use semantic classes (`text-heading`, `bg-primary`), and the site's `theme.yml` sets the actual colors and fonts — swap the palette and every component adapts.

### What it keeps bundled

Very little. A different site could use this foundation with different content, languages and colors. The main bundled aspect is the component set (hero, features, team, article list), which reflects a marketing-style site.

---

## dynamic — Data-Driven Site

A data-driven site for a wildlife conservation organization, featuring live API data, weather, publication databases, species sightings, field notes and a logbook.

### What to study here

**Live API data with loading states.** Most of its section types read `content.data` and show a loading state while `block.dataLoading` is true. The pattern is consistent:

```js
// Publications/Publications.jsx
const papers = content.data?.papers || []
const loading = block.dataLoading
```

The component doesn't fetch data, manage cache, or handle errors — the runtime does all of that. See `Publications/Publications.jsx`, `Hero/Hero.jsx` and `Sightings/Sightings.jsx`.

**External queries, named per section.** Every live API the site reads is a named query in `site/site.yml` — `weather`, `sightings`, `papers` and the rest — with its `url:` and, where the records sit inside the response, a `transform:` that points at them. Each section's frontmatter names the query it shows: the home page's hero names `weather`, its sightings section names `sightings` (iNaturalist), and the research page's publications name `papers` (Crossref). The runtime resolves each independently.

**Parametric pages over an external query.** The `blog/[id]` folder is a parametric page for individual field notes. The parent `blog/page.yml` names the `posts` query, which lists posts from JSONPlaceholder and declares `record: { url: https://jsonplaceholder.typicode.com/posts/{id} }` — the request for one whole post, `{id}` being the page's URL segment. The home page's notes section names the same query, narrowed: `fetch: { query: posts, limit: 3 }`. And `logbook/[...path]` is a parametric page over the site's own records, placed in folders by `records/folder.yml`, so each entry's URL is its folder plus its slug.

### Why it's the data reference

Its section types know how to render data, not where it comes from. Swap the queries in `site.yml` and every component reads new APIs; swap the `theme.yml` and every component rebrands. That's what portable means in practice.

---

## Choosing What to Study

Start from what you're trying to learn:

- **"How do params and presets work?"** — academic `PublicationList/meta.js` (many params, named presets), or docs `DocSection/meta.js` (two params doing real work)
- **"How does semantic theming work?"** — any template's `styles.css` and components; docs `theme.yml` for per-context overrides
- **"How do I use the CCA data layer?"** — dynamic (any data section, `Publications` is the clearest) or international (`ArticleList` and `Team`, declaring the keys they render)
- **"How does i18n work?"** — international (the only template with translations)
- **"How do I use content.items for repeating content?"** — academic `PublicationList` (complex parsing) or marketing `Features` (simpler pattern)
- **"How do parametric pages work?"** — international `blog/[slug]` (or the `blog` template); dynamic `blog/[id]` adds an external query's `record:` for fetching one whole record, and `logbook/[...path]` routes records by their folder
- **"How do loading states work?"** — dynamic
- **"How do section backgrounds work?"** — marketing (gradients via frontmatter `background:`) or international

---

## See Also

- [Foundation Categories](./foundation-categories.md) — The portability spectrum these templates demonstrate
- [Thinking in Contexts](./thinking-in-contexts.md) — Semantic theming in depth
- [Working with Data](./working-with-data.md) — The CCA data layer: one query, and what each section receives
- [CCA Component Patterns](./component-patterns.md) — Params, presets, content.items patterns
