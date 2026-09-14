# Glossary

Quick reference for Uniweb terminology. Each entry links to the page where the concept is explained in detail.

---

**Block**
The runtime representation of a section. Wraps parsed content, params, and navigation context. Components receive it as the `block` prop and can access `block.page` and `block.website`. See [Kit Reference](./kit-reference).

**CCA (Component Content Architecture)**
The pattern at the core of Uniweb: content (markdown) and code (React components) are separate artifacts connected by convention. Content authors write markdown, developers build components, and the runtime connects them via frontmatter. See [Component Content Architecture](../architecture/component-content-architecture).

**Content shape**
The guaranteed structure that the semantic parser extracts from markdown: `title`, `subtitle`, `paragraphs`, `links`, `images`, `icons`, `items`, `sequence`, etc. Arrays are always arrays, strings are always strings — no null checks needed. See [Content Structure](./content-structure).

**Context**
A theming environment applied per-section. The runtime wraps each section in a context class (`context-light`, `context-medium`, `context-dark`) based on the `theme:` frontmatter. Semantic tokens resolve differently in each context. See [Thinking in Contexts](../development/thinking-in-contexts).

**Data schema**
The shape of a content type — the fields a `person` or an `article` has. A component names a schema for each `content.data` key it declares (`data: { team: '@std/person' }`), and a query names the schema whose records it reads. The runtime applies its field defaults, `uniweb validate` checks records against it, and the editor builds its form from it. Refs name a namespace: `@/name` (the foundation's own), `@std/name` (the shared standards), `@org/name` (an organization's). See [Data Schemas](../development/data-schemas).

**Entity**
One stored thing — an article, a person, a product — written as a file in `entities/`, in the folder named for its data schema (`entities/std/article/`). An entity `records.yml` publishes is a record. See [Records](./content-collections).

**Extension**
A secondary foundation loaded at runtime via URL. Contributes section types but doesn't provide layouts or theme variables. Declared in `site.yml` under `extensions:`. See [Extending Your Site](../development/extending-your-site).

**Fetch**
A `query:` or `fetch:` declaration on a section, a page or the site. It names a query, may narrow it with its own `where`, `sort` and `limit` — never widening it — and fills a `content.data` key the section's component declares. A page's fetch reaches its own sections and its child pages' sections. See [Data Fetching](./data-fetching).

**Foundation**
A Vite library project containing React components — the site's source code. Lives in `src/` (single-foundation case), or `foundations/*/`, `*/src/` for multi-foundation layouts. Builds to `dist/entry.js` + `dist/meta/schema.json`. Provides section types, layouts, and theme variable declarations. See [Building with Uniweb](../development/building-with-uniweb).

**Frontmatter**
The YAML block between `---` markers at the top of a markdown file. Contains `type:` (which component renders this section), `theme:`, params, and other configuration. This is the binding mechanism between content and code.

**Host**
Who serves a site, and usually the provider of several of its services. Not a synonym for *provider*: a host serves the site, a provider supplies one service, and a site's form submissions can be provided by a third party its host has never heard of. A narrative term only — the framework never names a host in code, because a component that hardcodes one is welded to a single deployment. See [Site Services](./site-services).

**Items**
Repeating content groups within a single markdown file, created by headings after the main body text. Used for feature cards, FAQ entries, team members. Accessed via `content.items`. See [Content Structure](./content-structure).

**Layout**
A page-level structure component that arranges areas (header, footer, sidebar, body). Lives in `src/layouts/` in the foundation and `layout/` in the site. The configuration cascade determines which layout each page uses. See [Custom Layouts](../development/custom-layouts).

**Meta.js**
A file that declares a section type's interface: content expectations, params (with types and defaults), presets, category, background behavior, and the `content.data` keys the section receives (`data:`). Optional — section types work without it, but a section receives only the `content.data` keys its component declares (plus any its foundation declares for every section). See [Component Metadata](./component-metadata).

**Parametric page**
A page whose folder name is in brackets — `[slug]`, `[id]`, `[...path]` — with a URL for each record of its route query: `/blog/:slug` renders the article `/blog/bamboo-season` names. Other frameworks call these dynamic routes. See [Parametric Pages](./dynamic-routes).

**Params**
Configurable options for a section type, defined in `meta.js` and set by content authors in frontmatter. Examples: `variant: split`, `columns: 3`. The runtime guarantees defaults — components never need to check for missing params. See [Component Metadata](./component-metadata).

**Project**
In co-located layouts, a subdirectory that groups its own foundation and site (e.g., `marketing/src/` + `marketing/site/`). Created with `uniweb add project <name>`. See [Project Structures](../development/project-structures).

**Provider**
Who or what supplies a service — often the host, sometimes a third party, sometimes the site itself. `search.provider` is the word scoped to one service, naming which provider answers search: `index` (a downloaded index, queried in the browser), `endpoint` (a server), or a foundation-supplied search transport. Distinct from the *service*, which is the slot it fills. See [Site Services](./site-services).

**Query**
A named question over the site's records, declared in `queries.yml` (or under `queries:` in `site.yml`): which records (`schema`, `scope`, `where`), in what order (`sort`), how many (`limit`) — or a public JSON endpoint (`url:`). The records it selects are its set. Pages and sections name queries; they never read a file or a URL. See [Queries](./queries).

**Record**
An entity the site publishes — listed in `records.yml` — and what a query returns: a blog post, a team member, a product. A component receives records as a list under a `content.data` key, each carrying `$route`, the URL of the page that shows it. See [Records](./content-collections).

**Route query**
The query whose records a parametric page's URLs name — the page's own, else its parent page's, else the site's for a top-level page. A parametric page has a URL for each record of its route query's set and no other. See [Parametric Pages](./dynamic-routes#which-query-the-url-names).

**Section type**
A React component in `src/sections/` that content authors can reference by name in frontmatter (`type: Hero`). Files and folders at the root of `src/sections/` are addressable by default. See [Creating Components](../development/creating-components).

**Service**
A named slot for an address the site does not hardcode — `search`, `submit`, `tracking`, `assistant`, `api`, `records`, or any name a foundation invents. Offered by the host or declared in `site.yml`; where the host offers one, its offer wins. Presence is the switch: absent means the site does not have it, and a control for a service the site does not have is not drawn. See [Site Services](./site-services).

**Semantic tokens**
CSS variables (`--heading`, `--body`, `--section`, `--primary`, `--border`, etc.) that resolve differently per context. Components use these instead of hardcoded colors so they adapt to any theme automatically. See [Site Theming](./site-theming).

**Site**
A Vite app containing markdown content, configuration, and pages. Lives in `site/` (or `sites/*/`, `*/site/`). Has `pages/`, `layout/`, `site.yml`, and `theme.yml`. This is where content authors work. The site's bootstrap is `entry.js` (a 6-line file calling `start()` from `@uniweb/runtime` — never edited by hand). See [Building with Uniweb](../development/building-with-uniweb).

**Workspace**
The top-level directory created by `uniweb create` — a pnpm monorepo containing one or more foundations, sites, and extensions. Has `pnpm-workspace.yaml` and a root `package.json`. See [Project Structures](../development/project-structures).
