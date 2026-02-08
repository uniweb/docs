# Glossary

Quick reference for Uniweb terminology. Each entry links to the page where the concept is explained in detail.

---

**Block**
The runtime representation of a section. Wraps parsed content, params, and navigation context. Components receive it as the `block` prop and can access `block.page` and `block.website`. See [Kit Reference](./kit-reference).

**CCA (Component Content Architecture)**
The pattern at the core of Uniweb: content (markdown) and code (React components) are separate artifacts connected by convention. Content authors write markdown, developers build components, and the runtime connects them via frontmatter. See [Component Content Architecture](../architecture/component-content-architecture).

**Collection**
A set of markdown, YAML, or JSON files in `library/` that compile into structured data. Used for blogs, team members, products — any growing catalog of items. See [Collections](../authoring/collections).

**Content shape**
The guaranteed structure that the semantic parser extracts from markdown: `title`, `subtitle`, `paragraphs`, `links`, `imgs`, `icons`, `items`, `sequence`, etc. Arrays are always arrays, strings are always strings — no null checks needed. See [Content Structure](./content-structure).

**Context**
A theming environment applied per-section. The runtime wraps each section in a context class (`context-light`, `context-medium`, `context-dark`) based on the `theme:` frontmatter. Semantic tokens resolve differently in each context. See [Thinking in Contexts](../development/thinking-in-contexts).

**Extension**
A secondary foundation loaded at runtime via URL. Contributes section types but doesn't provide layouts or theme variables. Declared in `site.yml` under `extensions:`. See [Extending Your Site](../development/extending-your-site).

**Foundation**
A Vite library project containing React components. Lives in `foundation/` (or `foundations/*/`, `*/foundation/`). Builds to `foundation.js` + `schema.json`. Provides section types, layouts, and theme variable declarations. See [Building with Uniweb](../development/building-with-uniweb).

**Frontmatter**
The YAML block between `---` markers at the top of a markdown file. Contains `type:` (which component renders this section), `theme:`, params, and other configuration. This is the binding mechanism between content and code.

**Items**
Repeating content groups within a single markdown file, created by headings after the main body text. Used for feature cards, FAQ entries, team members. Accessed via `content.items`. See [Content Structure](./content-structure).

**Layout**
A page-level structure component that arranges areas (header, footer, sidebar, body). Lives in `src/layouts/` in the foundation and `layout/` in the site. The configuration cascade determines which layout each page uses. See [Custom Layouts](../development/custom-layouts).

**Meta.js**
A file that declares a section type's interface: content expectations, params (with types and defaults), presets, category, and background behavior. Optional — section types work without it, but metadata enables richer tooling. See [Component Metadata](./component-metadata).

**Params**
Configurable options for a section type, defined in `meta.js` and set by content authors in frontmatter. Examples: `variant: split`, `columns: 3`. The runtime guarantees defaults — components never need to check for missing params. See [Component Metadata](./component-metadata).

**Project**
In co-located layouts, a subdirectory that groups its own foundation and site (e.g., `marketing/foundation/` + `marketing/site/`). Created with `uniweb add --project`. See [Project Structures](../development/project-structures).

**Section type**
A React component in `src/sections/` that content authors can reference by name in frontmatter (`type: Hero`). Files and folders at the root of `src/sections/` are addressable by default. See [Creating Components](../development/creating-components).

**Semantic tokens**
CSS variables (`--heading`, `--body`, `--section`, `--primary`, `--border`, etc.) that resolve differently per context. Components use these instead of hardcoded colors so they adapt to any theme automatically. See [Site Theming](./site-theming).

**Site**
A Vite app containing markdown content, configuration, and pages. Lives in `site/` (or `sites/*/`, `*/site/`). Has `pages/`, `layout/`, `site.yml`, and `theme.yml`. This is where content authors work. See [Building with Uniweb](../development/building-with-uniweb).

**Workspace**
The top-level directory created by `uniweb create` — a pnpm monorepo containing one or more foundations, sites, and extensions. Has `pnpm-workspace.yaml` and a root `package.json`. See [Project Structures](../development/project-structures).
