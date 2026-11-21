# Glossary

Quick reference for Uniweb terminology. Each entry links to the page where the concept is explained in detail.

---

**Application Engine**
Uniweb's backend for web apps: accounts and sign-in, roles and teams, entities with their owners and permissions, a store, an inbox and integrations. A site turns it on as its `backend` service (`backend: true` under `services:`), and on Uniweb hosting each one is a dedicated deployment with its own PostgreSQL database. Components reach it through the SDK. See [The Application Engine](../web-apps/the-application-engine.md).

**Block**
The runtime representation of a section. Wraps parsed content, params, and navigation context. Components receive it as the `block` prop and can access `block.page` and `block.website`. See [Kit Reference](./kit-reference.md).

**Blueprint**
`blueprint.yml`, beside `site.yml`: how a site's Application Engine starts. It says who may sign up, the teams it begins with, who may add entries of each type, what visitors who aren't signed in may read (its public queries), and the integrations it starts with. See [Blueprint](./blueprint.md).

**Brief**
The one section of a Model marked `brief: true`: what identifies an entity at a glance, such as a name, a title or a photo. It is what a reference to the entity shows and what a list of entities carries. See [The Entity Model](../web-apps/the-entity-model.md#the-brief).

**CCA (Component Content Architecture)**
The pattern at the core of Uniweb: content (markdown) and code (React components) are separate artifacts connected by convention. Content authors write markdown, developers build components, and the runtime connects them via frontmatter. See [Component Content Architecture](../architecture/component-content-architecture.md).

**Content shape**
The guaranteed structure that the semantic parser extracts from markdown: `title`, `subtitle`, `paragraphs`, `links`, `images`, `icons`, `items`, `sequence`, etc. Arrays are always arrays, strings are always strings — no null checks needed. See [Content Structure](./content-structure.md).

**Context**
A theming environment applied per-section. The runtime wraps each section in a context class (`context-light`, `context-medium`, `context-dark`) based on the `theme:` frontmatter. Semantic tokens resolve differently in each context. See [Thinking in Contexts](../development/thinking-in-contexts.md).

**Data schema**
The file a Model is written in — the fields a `person` or an `article` has. A component names a schema for each `content.data` key it declares (`data: { team: '@std/person' }`), and a query names the schema whose records it reads. `uniweb validate` checks records against it, a fetch fills a declared key of its type, and the editor builds its form from it. It never changes a record: a field a record lacks reaches the component absent. Refs name a namespace: `@/name` (the foundation's own), `@std/name` (the shared standards), `@org/name` (an organization's). See [Data Schemas](../development/data-schemas.md).

**Docker Developer Edition**
The full Application Engine and PostgreSQL, packaged to run with Docker on your machine. It is free for development and doesn't expire, and the CLI publishes to it as it does to Uniweb. See [Testing a Web App Locally](../web-apps/testing-locally.md#the-docker-developer-edition).

**Entity**
One thing of a Model, as the Application Engine holds it, with its identity, its owner, who it is shared with and its history: one course, one enrollment. In a site's files the word is [record](#record): a file in `records/`. See [The Entity Model](../web-apps/the-entity-model.md).

**Extension**
A secondary foundation loaded at runtime via URL. Contributes section types but doesn't provide layouts or theme variables. Declared in `site.yml` under `extensions:`. See [Extending Your Site](../development/extending-your-site.md).

**Fetch**
A `query:` or `fetch:` declaration on a section, a page or the site. It names a query, may narrow it with its own `where`, `sort` and `limit` — never widening it — and fills a `content.data` key the section's component declares. A page's fetch reaches its own sections and its child pages' sections. See [Data Fetching](./data-fetching.md).

**Foundation**
A Vite library project containing React components — the site's source code. Lives in `src/` (single-foundation case), or `foundations/*/`, `*/src/` for multi-foundation layouts. Builds to `dist/entry.js` + `dist/meta/schema.json`. Provides section types, layouts, and theme variable declarations. See [Building with Uniweb](../development/building-with-uniweb.md).

**Frontmatter**
The YAML block between `---` markers at the top of a markdown file. Contains `type:` (which component renders this section), `theme:`, params, and other configuration. This is the binding mechanism between content and code.

**Host**
Who serves a site, and usually the provider of several of its services. Not a synonym for *provider*: a host serves the site, a provider supplies one service, and a site's form submissions can be provided by a third party its host has never heard of. A narrative term only — the framework never names a host in code, because a component that hardcodes one is welded to a single deployment. See [Site Services](./site-services.md).

**Items**
Repeating content groups within a single markdown file, created by headings after the main body text. Used for feature cards, FAQ entries, team members. Accessed via `content.items`. See [Content Structure](./content-structure.md).

**Layout**
A page-level structure component that arranges areas (header, footer, sidebar, body). Lives in `src/layouts/` in the foundation and `layout/` in the site. The configuration cascade determines which layout each page uses. See [Custom Layouts](../development/custom-layouts.md).

**Library**
A local package several foundations depend on, holding the components, hooks, logic and data types they share. It offers no section type of its own: each foundation keeps its own section types and look, and imports the library's code as from any package. In a folder of the workspace or beside it; `uniweb add library` makes and wires one. See [Libraries](../development/libraries.md).

**Member**
Someone who signs in to a site that has an Application Engine: a learner, a client, an attendee. A member has entries of their own, and sees what the engine lets them see. See [Building a Solution](../web-apps/building-a-solution.md).

**Meta.js**
A file that declares a section type's interface: content expectations, params (with types and defaults), presets, category, background behavior, and the `content.data` keys the section receives (`data:`). Optional — section types work without it, but a section receives only the `content.data` keys its component declares (plus any its foundation declares for every section). See [Component Metadata](./component-metadata.md).

**Model**
A kind of thing an application holds, declared once: a course, a person, an enrollment. It is made of sections, each holding one item or many, and is written in a data schema file. See [The Entity Model](../web-apps/the-entity-model.md).

**Parametric page**
A page whose folder name is in brackets — `[slug]`, `[id]`, `[...path]` — with a URL for each record of its route query: `/blog/:slug` renders the article `/blog/bamboo-season` names. Other frameworks call these dynamic routes. See [Parametric Pages](./dynamic-routes.md).

**Params**
Configurable options for a section type, defined in `meta.js` and set by content authors in frontmatter. Examples: `variant: split`, `columns: 3`. The runtime guarantees defaults — components never need to check for missing params. See [Component Metadata](./component-metadata.md).

**Project**
In co-located layouts, a subdirectory that groups its own foundation and site (e.g., `marketing/src/` + `marketing/site/`). Created with `uniweb add project <name>`. See [Project Structures](../development/project-structures.md).

**Provider**
Who or what supplies a service — often the host, sometimes a third party, sometimes the site itself. `search.provider` is the word scoped to one service, naming which provider answers search: `index` (a downloaded index, queried in the browser), `endpoint` (a server), or a foundation-supplied search transport. Distinct from the *service*, which is the slot it fills. See [Site Services](./site-services.md).

**Public query**
What a site's blueprint opens to visitors who aren't signed in: entries of one type, whole or as their briefs, narrowed with `where`, `sort` and `limit`. A store's prices reach every visitor this way. See [Blueprint](./blueprint.md).

**Query**
A named question over the site's records, declared in `queries.yml` (or under `queries:` in `site.yml`): which records (`schema`, `scope`, `where`), in what order (`sort`), how many (`limit`) — or a public JSON endpoint (`url:`). The records it selects are its set. Pages and sections name queries; they never read a file or a URL. See [Queries](./queries.md).

**Record**
One item of the site's repeating content — a blog post, a team member, a product — written as a file in `records/`, in the folder named for its data schema (`records/std/article/`). Putting a file there is what makes it a record, and records are what a query returns. A component receives records as a list under a `content.data` key, each carrying `$route`, the URL of the page that shows it. See [Records](./content-collections.md).

**Route query**
The query whose records a parametric page's URLs name — the page's own, else its parent page's, else the site's for a top-level page. A parametric page has a URL for each record of its route query's set and no other. See [Parametric Pages](./dynamic-routes.md#which-query-the-url-names).

**SDK**
`@uniweb/api`, the SDK a foundation uses to reach its site's Application Engine: sign-in, entries, sharing, forms, uploads, the store and the inbox, as React hooks. A foundation writes no routes, tokens or fetch code. See [The SDK](../web-apps/the-sdk.md).

**Section type**
A React component in `src/sections/` that content authors can reference by name in frontmatter (`type: Hero`). Files and folders at the root of `src/sections/` are addressable by default. See [Creating Components](../development/creating-components.md).

**Service**
A named slot for an address the site does not hardcode — `search`, `submit`, `tracking`, `assistant`, `backend`, `records`, or any name a foundation invents. Offered by the host or declared in `site.yml`; where the host offers one, its offer wins. Presence is the switch: absent means the site does not have it, and a control for a service the site does not have is not drawn. See [Site Services](./site-services.md).

**Semantic tokens**
CSS variables (`--heading`, `--body`, `--section`, `--primary`, `--border`, etc.) that resolve differently per context. Components use these instead of hardcoded colors so they adapt to any theme automatically. See [Site Theming](./site-theming.md).

**Site**
A Vite app containing markdown content, configuration, and pages. Lives in `site/` (or `sites/*/`, `*/site/`). Has `pages/`, `layout/`, `site.yml`, and `theme.yml`. This is where content authors work. The site's bootstrap is `entry.js` (a 6-line file calling `start()` from `@uniweb/runtime` — never edited by hand). See [Building with Uniweb](../development/building-with-uniweb.md).

**Solution**
A site that is also a web app: public pages for visitors, a members' area, an admin area of its own for the people who run it, and its Application Engine. See [Building a Solution](../web-apps/building-a-solution.md).

**Solution Owner Console**
The generic admin every solution gets with its Application Engine, where its owner sets what every solution has: roles and teams, the Stripe account, coupons, and integrations' addresses and keys. A solution's own admin screens are part of its foundation. See [The Application Engine](../web-apps/the-application-engine.md#going-live).

**Uniweb App**
The browser side of a project, at [uniweb.app](https://uniweb.app): the visual editor and live CMS where authors edit the site, and where a site and its engine are published, managed and paid for. See [Deploying](../development/deploying.md).

**Uniweb hosting**
The managed host `uniweb publish` takes a site live on, also called Uniweb Cloud. It prerenders each page a visit starts on at the edge, with its live data, and provides the services a site asks for. See [Deploying](../development/deploying.md#uniweb-hosting--recommended).

**Workspace**
The top-level directory created by `uniweb create` — a pnpm monorepo containing one or more foundations, sites, and extensions. Has `pnpm-workspace.yaml` and a root `package.json`. See [Project Structures](../development/project-structures.md).
