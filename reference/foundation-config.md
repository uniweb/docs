# Foundation Configuration

The `main.js` file at the foundation package's source root defines customizable CSS variables and configuration for your foundation. Layout components live in `src/layouts/` and are auto-discovered.

## Overview

Foundations can expose configuration points that sites customize in their `theme.yml`:

```
src/                       # the foundation package
├── main.js                # Name, description, variables, defaultLayout, props
├── sections/              # Section types
├── components/            # Internal components
├── layouts/               # Layout components (auto-discovered)
├── styles.css             # Global styles
├── package.json           # name: "src"
└── vite.config.js
```

---

## Identity

By default, the foundation's `name` and `description` come from `package.json`. You can override them in `main.js` — useful when the npm package name differs from the display name you want in visual editors:

```js
// src/main.js
export default {
  name: 'Marketing Template',
  description: 'A modern marketing site template with hero, features, and pricing sections.',
}
```

If omitted, the values fall back to `package.json`. The `version` always comes from `package.json`.

---

## `package.json` configuration

The `uniweb` block in `package.json` carries platform-specific configuration that doesn't belong in the npm-standard fields. All fields are optional; the platform falls back to sensible defaults when they're omitted.

```json
{
  "name": "src",
  "version": "1.0.0",
  "uniweb": {
    "id": "marketing",
    "runtimePolicy": "auto-minor"
  },
  "dependencies": {
    "@uniweb/core": "0.7.8",
    "@uniweb/runtime": "0.8.9"
  }
}
```

(`uniweb.id` is the foundation's registered name, separate from the workspace package name.)

### Supported fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `id` | string | (the bare segment of `package.json::name`, or an explicit `uniweb.id`) | The foundation's id on the registry — the bare name segment in `@org/<id>`. Decoupled from `package.json::name` (which is a workspace concern); renaming `uniweb.id` only affects the registry identity, not the workspace. |
| `namespace` | string | (none — see scope resolution below) | Legacy explicit org-namespace override. Equivalent to writing `"name": "@<namespace>/<base>"`. Rarely needed; modern foundations set a scoped name (`@org/x`) directly. |
| `runtimePolicy` | `"exact"` \| `"auto-patch"` \| `"auto-minor"` | `"auto-minor"` | Controls how sites using this foundation receive runtime updates. See [`uniweb register`](./cli-commands.md#foundation-runtime-policy) for full semantics. |

### Identity (scope + id) resolution

A registered foundation has two identity pieces — a **scope** (where it's stored) and an **id** (what it's called). They live in different places and resolve independently. Full details and examples in [`uniweb register` → Identity](./cli-commands.md#identity-scope--id). The summary:

**Scope** priority: `--scope @org` → scoped `package.json::name` (`@org/x`) → `package.json::uniweb.scope`. Cataloging requires an org scope; a bare or unscoped name isn't cataloged. When you publish a site whose local foundation changed, `uniweb publish` releases it to the catalog under your `@org` automatically — so set a scope before publishing too.

**ID**: the bare (sigil-stripped) segment of `package.json::name` (or an explicit `uniweb.id`).

To rename the foundation's workspace package and update its dependent sites, run `uniweb rename foundation <old> <new>`. The workspace name and the registered id (`uniweb.id`) are independent.

The reason `uniweb.id` exists alongside `package.json::name` is isolation. `package.json::name` is a workspace concern (pnpm linking, `file:` deps, `site.yml::foundation`). Renaming it cascades through several files. `uniweb.id` is register-only — changing it affects only the registry identity. It lets you keep the scaffold default `"name": "src"` for the workspace while giving the foundation a distinct registered id — the org scope still comes from a scoped name or `uniweb.namespace`.

### Why a separate `uniweb` block

These fields are platform configuration, not standard npm metadata. Keeping them under `uniweb` (as opposed to spreading them across the top-level package.json or various dotfiles) gives a single, discoverable home and avoids polluting the npm-tooling-recognized surface. Future platform features that need static configuration will land here too — additions will be documented in this section.

### Where does the pinned runtime version come from?

You may notice your foundation's `dist/runtime-pin.json` reports a runtime version (e.g. `0.8.9`) without your `package.json` declaring `@uniweb/runtime` anywhere. This is intentional.

`@uniweb/runtime` is pulled in **transitively** through `@uniweb/build` (which every foundation has as a devDependency). The runtime version baked into your foundation's pin is whichever version your `@uniweb/build` version pulled in at install time:

```
your foundation
  └─ devDependencies: "@uniweb/build": "0.12.0"
       └─ pulls in @uniweb/runtime  (whatever version that build version locks)
            → resolved at install time → version goes into dist/runtime-pin.json
```

The foundation build looks for `@uniweb/runtime` in two places:

1. **Transitive resolution from `@uniweb/build`'s location** — the common case. This is what every foundation hits unless it explicitly opts in to (2).
2. **Direct dependency in your foundation's own `node_modules`** — opt-in escape hatch.

#### Practical implications

- **You don't need to add `@uniweb/runtime` to your foundation's dependencies.** This is by design — runtime is the host environment, not a foundation import.
- **To bump the runtime version your foundation pins, bump your `@uniweb/build` dep.** When `@uniweb/build@0.13.0` ships pulling in a newer runtime, updating your devDependency is how you adopt it.
- **You can override by adding `@uniweb/runtime` directly to your foundation's `dependencies`** — but this is rarely needed and creates a source of confusion (now there are two places that know about the runtime version). Don't do this unless you have a specific reason.
- **Whatever runtime version is pinned, your foundation's `runtimePolicy` controls how sites of this foundation can move forward beyond it.** Pinning `0.8.9` with `auto-minor` lets sites pick up `0.9.0` or higher (within the same major); pinning `0.8.9` with `exact` locks them at `0.8.9` until you rebuild your foundation.

### Build outputs

`uniweb build` (or `vite build`) writes your foundation's `dist/`:

| Path | What it is |
|---|---|
| `dist/entry.js` | The foundation module the browser loads (code-split — kit's optional features like syntax highlighting and search lazy-load as separate chunks). |
| `dist/entry-ssr.js` | A **single-file server-render build** of the same foundation, for hosts that render your foundation on the server (SSR). Same components as `entry.js` in one module, with React, the runtime, and the browser-only lazy libraries left external — so it stays foundation-sized and those libraries (which only run in the browser) are never pulled in. Emitted automatically; you don't reference it directly. |
| `dist/assets/style.css` | The foundation's compiled stylesheet (carries your theme-var defaults). |
| `dist/meta/schema.json` | The compiled component + theme schema (params, defaults, layouts) the runtime reads. |
| `dist/runtime-pin.json` | The `@uniweb/runtime` version this build resolved (see above). |

You normally don't touch these — the CLI's deploy/export flow ships the right ones for the target.

---

## CSS Variables (vars)

Most customization is handled by component params. Both section components and layout components declare their own params in `meta.js` — layouts are full components with params, not just structural wrappers. A header height, for example, is typically a layout param, not a foundation var.

Foundation-level CSS variables are for values that must stay consistent **across** multiple components — shared radii, spacing scales, or a **typeface** the site retunes (beyond the three roles the theming system already provides as `body`/`heading`/`code`; see [Font family vars](#font-family-vars)). Don't reach for foundation vars when a component or layout param would do.

### Defining Variables

```js
// src/main.js

/**
 * CSS custom properties that sites can override in theme.yml
 */
export const vars = {
  'radius': {
    default: '0.5rem',
    description: 'Default border radius for cards and buttons',
  },
  'radius-lg': {
    default: '1rem',
    description: 'Large border radius for panels and modals',
  },
  'section-padding-y': {
    default: 'clamp(4rem, 6vw, 7rem)',
    description: 'Vertical padding for sections (fluid)',
  },
  'shadow': {
    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    description: 'Default shadow for cards and elevated elements',
  },
}
```

### Variable Schema

Each variable is an object with:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `default` | string | Yes | Default CSS value |
| `description` | string | No | What the variable controls |
| `label` | string | No | Display name in editor (falls back to humanized var name) |
| `type` | string | No | `'select'`, `'color'`, or default text input |
| `options` | array | When `type: 'select'` | Dropdown options |
| `group` | string | No | Visual grouping in editor (e.g. `'Layout'`, `'Visual'`) |
| `globalOnly` | boolean | No | If true, hidden from section-level panel |

When `label` is omitted, the editor generates one from the var name: `radius-lg` → "Radius Lg".

#### Type mapping

| Var type | Editor control | Context-aware? |
| -------- | -------------- | -------------- |
| (default) | Text input with default as placeholder | No |
| `select` | Dropdown with options | No |
| `color` | Color picker | Yes — stored per light/dark context |

Color-type vars are stored separately from non-color vars. The processor routes them to `colorVars` (per-context) rather than `foundationVars` (flat). This means color vars can have different values for light and dark schemes.

> **Foundation vars vs component vars:** Foundation vars are global — they emit on `:root` and apply site-wide. Component vars (declared in `meta.js`) are scoped to `#section-{id}`. See [Component Metadata](./component-metadata.md#vars) for component-level vars.

### Font family vars

The theming system provides three **font roles** — `body`, `heading`, `code` — that the framework paints onto elements (`body`, `h1–h3`, `code/pre/kbd/samp`) and the site sets in `theme.yml`. A foundation can go further: declare a **font var** to **add** a role (an editorial serif, a display face) or **redefine** a built-in one. A `font-*`-named var is recognized as a typeface automatically — no `type` needed; a bare-named one takes `type: 'font'`. Either way the family loads and the schema tags it as a font:

```js
// src/main.js
export const vars = {
  // `font-*` name → recognized as a font automatically (no `type` needed)
  'font-serif': {
    default: 'ui-serif, Georgia, serif',
    description: 'Editorial serif for pull-quotes and taglines',
    applyTo: ['blockquote', '.tagline'],   // framework paints it here, like a built-in role
  },
}
```

- **`applyTo: [selectors]`** — the framework emits the `font-family` rule for you, exactly like a built-in role. Omit it and the component wires the typeface itself (a Tailwind `font-*` utility, or `var(--font-…)`).
- **Naming & inferred type** — `serif` and `font-serif` are the same role (both emit `--font-serif`); the `font-serif` spelling is what Tailwind's `font-serif` utility reads **and** infers `type: 'font'` for you. So a `font-*` name needs no `type`; a bare name (`serif`, `display`) takes an explicit `type: 'font'`. A custom name with no built-in utility is referenced with `var(--font-display)`. (CSS longhands like `font-weight` are never inferred as typefaces.)
- **Redefining a built-in role** — declare `heading` / `body` / `code` as a `type: 'font'` var with your own `applyTo` to retarget it (e.g. include `<h4>` in the heading font). The site still owns the family.

The site sets any role — built-in or foundation-added — by name in `theme.yml` under `fonts:` (or `vars:`), and loads the file with `fonts.import` / `fonts.faces`. Defaults should be OS stacks (`ui-serif, Georgia, serif`) so the foundation renders natively before a site opts into brand faces. See [Site Theming → Fonts beyond the three roles](./site-theming.md#fonts-beyond-the-three-roles) for the site side.

### Registering Defaults in `styles.css`

The `main.js` declaration is metadata — descriptions, types, and editor UI hints that end up in `schema.json`. To ensure the default values are present in the foundation's actual CSS output, register them in `styles.css` via `@theme inline`:

```css
/* src/styles.css */
@theme inline {
  --radius: 0.5rem;
  --radius-lg: 1rem;
  --section-padding-y: clamp(4rem, 6vw, 7rem);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

This is best practice for two reasons:

1. **Guarantees defaults are available.** The `@theme inline` block compiles into the foundation's CSS (`dist/assets/style.css`, shipped alongside `entry.js`). The defaults are present regardless of whether the site's `theme.yml` sets them — important for runtime-loaded foundations where the site build doesn't have access to `schema.json`.

2. **Enables Tailwind shorthand.** With registration, you can use `py-(--section-padding-y)` instead of `py-[var(--section-padding-y)]`.

When a site overrides a variable in `theme.yml`, the site's theme CSS takes priority over the foundation defaults.

### Using Variables in Components

Components reference foundation vars via CSS or Tailwind:

```jsx
function Card({ children }) {
  return (
    <div className="rounded-(--radius) shadow-(--shadow) p-6">
      {children}
    </div>
  )
}
```

Or in CSS:

```css
section {
  padding: var(--section-padding-y) 0;
}
```

The same vars apply consistently across all components that use them. Changing `radius` in `theme.yml` updates every card, button, and panel at once.

### Site Overrides

Sites override variables in `theme.yml`:

```yaml
# site/theme.yml
vars:
  radius: 0.75rem
  radius-lg: 1.25rem
  section-padding-y: clamp(3rem, 5vw, 5rem)   # tighter spacing
```

The build generates theme CSS with the site's values. These override the foundation defaults (from `@theme inline` in `styles.css`) because the site's theme CSS loads with higher priority:

```css
/* Site theme CSS — overrides foundation @theme inline defaults */
:root {
  --radius: 0.75rem;
  --radius-lg: 1.25rem;
  --section-padding-y: clamp(3rem, 5vw, 5rem);
}
/* --shadow keeps its foundation default since the site didn't override it */
```

---

## Default Section Type

When a content section doesn't specify a `type:` in its frontmatter, the runtime needs to know which section type to use. By default it looks for a component called `Section`, but you can change this with `defaultSection`:

```js
// src/main.js
export default {
  defaultSection: 'FeatureGrid',
}
```

This is useful when your foundation has a general-purpose component that should handle untyped content. If not set, the fallback is `'Section'`.

---

## Custom Layout

Foundations can provide custom Layout components that control page structure. Layouts live in `src/layouts/` and are auto-discovered.

### Default Behavior

Without a custom Layout, the runtime uses a simple wrapper:

```jsx
// Default layout
function Layout({ body }) {
  return <>{body}</>
}
```

### Creating a Layout

Place layout components in `src/layouts/`:

```
src/layouts/
├── DocsLayout/
│   ├── index.jsx
│   └── meta.js        # Optional: declares areas, params
└── MarketingLayout.jsx # Bare file works too
```

Set the default in `main.js`:

```js
// src/main.js
export default {
  defaultLayout: 'DocsLayout',
}
```

```jsx
// src/layouts/DocsLayout/index.jsx
export default function DocsLayout({ header, footer, left, right, body }) {
  return (
    <div className="min-h-screen flex flex-col">
      {header && <header>{header}</header>}

      <div className="flex-1 flex">
        {left && (
          <aside className="w-64 border-r">
            {left}
          </aside>
        )}

        <main className="flex-1">
          {body}
        </main>

        {right && (
          <aside className="w-64 border-l">
            {right}
          </aside>
        )}
      </div>

      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

### Layout Props

| Prop | Type | Description |
|------|------|-------------|
| `header` | ReactNode | Rendered header area (or null) |
| `footer` | ReactNode | Rendered footer area (or null) |
| `left` | ReactNode | Rendered left area (or null) |
| `right` | ReactNode | Rendered right area (or null) |
| `body` | ReactNode | Page content sections |
| `params` | object | Layout parameters (merged with meta.js defaults) |
| `page` | Page | Current page instance |
| `website` | Website | Website instance |

Area names aren't fixed — foundations can declare any areas in `meta.js`. The props above are the conventional names. See [Custom Layouts](../development/custom-layouts.md#general-named-areas) for details.

### Layout meta.js

Layouts can optionally declare which areas they use and what parameters they accept:

```js
// src/layouts/DocsLayout/meta.js
export default {
  title: 'Documentation',
  description: 'Three-column layout with sidebar navigation',
  areas: ['header', 'footer', 'left', 'right'],
  params: {
    sidebarWidth: {
      type: 'select',
      options: ['narrow', 'wide'],
      default: 'narrow',
    },
  },
}
```

### Per-Page Layout Selection

Pages select a layout and configure it in `page.yml`:

```yaml
layout: MarketingLayout

# Or with options:
layout:
  name: MarketingLayout
  hide: [left, right]
  params:
    sidebarWidth: wide
```

The `hide` array suppresses specific areas on that page. Hidden areas are passed as null to the Layout component — check props directly:

```jsx
export default function DocsLayout({ header, footer, left, right, body }) {
  return (
    <div className="min-h-screen flex flex-col">
      {header && <header>{header}</header>}

      <div className="flex-1 flex">
        {left && <aside className="w-64">{left}</aside>}
        <main className="flex-1">{body}</main>
        {right && <aside className="w-64">{right}</aside>}
      </div>

      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

---

## Document Outputs

Foundations that compile their content into documents (PDF, DOCX, EPUB, Typst source bundles, HTML for Paged.js, etc.) declare the formats they support under `outputs:`. This is what powers in-page Download buttons and headless tools like `unipress` — both call `compileDocument(website, { format, foundation })` from `@uniweb/press`, which reads the map and does the rest.

```js
// src/main.js
import { buildTypstOptions, buildEpubOptions } from './compile-options.js'

export default {
  defaultLayout: 'BookLayout',
  outputs: {
    typst: {
      extension: 'zip',
      getOptions: buildTypstOptions,
    },
    pdf: {
      extension: 'pdf',
      via: 'typst',                      // routes through the typst adapter
      getOptions: buildTypstOptions,
    },
    epub: {
      extension: 'epub',
      getOptions: buildEpubOptions,
    },
  },
}
```

### Per-output fields

| Field | Type | Required | Description |
|---|---|---|---|
| `getOptions` | `(website, hostOptions) → { adapterOptions }` (can be async) | No | Foundation-specific assembly: meta from `website.config`, typst preamble, stylesheets, cover image bytes, etc. The returned `adapterOptions` go to the Press format adapter. `hostOptions` are the rest-args the host passes to `compileDocument` — use them to branch on caller intent (e.g., `mode: 'server'` vs `mode: 'sources'` for typst). Omit when the default Press adapter output suits the format unchanged. |
| `via` | string | No | Press format to compile through. Defaults to the output key itself. Use when the user-facing name differs from the Press adapter — `pdf` aliased to `typst`, for instance, so a headless host can fetch the typst source bundle and finish compile with its own typst binary. |
| `extension` | string | No | Default file extension the host uses when deriving an output filename. Convention only — the host can override. |

### How the shape fits the compile flow

```
  compileDocument(website, { format: 'pdf', foundation, mode: 'sources' })
    │
    ├─ reads    foundation.outputs.pdf
    │             via: 'typst'         → Press uses the typst adapter
    │             getOptions(website, { format: 'pdf', mode: 'sources' })
    │
    ├─ calls    getOptions(...)
    │             → { adapterOptions: { mode, meta, preamble, template, assets } }
    │
    ├─ gathers  website.pages.flatMap(p => p.bodyBlocks)
    │
    └─ dispatches  compileSubtree(<ChildBlocks blocks={...}/>, 'typst', { adapterOptions })
                   → Blob (a typst source-bundle zip; the host binary turns it into a PDF)
```

### Relationship to other foundation callables

`outputs.*.getOptions` is a per-document callable, invoked once per compile. It is not the same as:

- `handlers.{data, content, props}` — per-block callables in the **content pipeline**, invoked on every block's prepare-props pass. See [Content Handlers](../development/content-handlers.md).
- `transports[name].resolve` — per-request callables in the **data pipeline**, invoked on every fetch. See [Data Transports](#data-transports).

Each subsystem owns its lifecycle moment; `outputs` owns end-of-pipeline document compile.

---

## Data Transports

A foundation can export one or more **named transports** — reusable fetchers that a site can opt into by name. The site keeps authority: `site.yml` picks which transport handles which schema. A foundation never silently intercepts a site's data request.

When a site declares no transport for a schema, the framework's default fetcher handles it (plain GET + JSON parse + optional `transform:`, plus the site-level `baseUrl` / `headers` / `envelope` vocabulary — see [Connecting a Backend](../development/connecting-a-backend.md)). Most foundations need no transports at all.

Declared on the default export of `main.js` alongside identity, theme, and layout fields:

```js
// src/main.js
export default {
  defaultLayout: 'MarketingLayout',

  transports: {
    uniweb: {
      resolve: async (request, ctx) => {
        const siteFolder = ctx.website.config?.fetcher?.uniweb?.siteFolder
        const res = await fetch(`https://uniweb.app/sites/${siteFolder}/${request.schema}`, {
          signal: ctx.signal,
        })
        if (!res.ok) return { data: [], error: `HTTP ${res.status}` }
        return { data: await res.json() }
      },
      cacheKey: (request) => `uniweb:${request.schema}`,
    },
  },
}
```

The site then opts in:

```yaml
# site.yml
fetcher:
  transports:
    articles: uniweb     # schema → transport name
    events: default      # reserved name — framework default fetcher
  uniweb:                 # transport-specific binding config
    siteFolder: abc-123-def
```

### How the site selects

Selection is a name lookup, nothing more:

1. If `fetcher.transports[request.schema]` is set, use that named transport from the primary foundation (or any extension that registers a transport by that name).
2. Otherwise, if `fetcher.transports.default` is set, use that for every schema.
3. Otherwise, the framework default fetcher handles the request.

There is no `match()` predicate, no route-walking, no fallback chain. The site always makes the selection, visible in `site.yml`, auditable.

### The transport contract

A transport is any object with a `resolve` method (and optionally `cacheKey`):

```js
{
  async resolve(request, ctx) {
    // ...
    return { data, error?, meta? }
  },
  cacheKey?: (request) => string,  // optional; see Per-transport knobs below
}
```

**Request** — the normalized fetch config, with an extra `dynamicContext` on template-page item requests:

| Field | Type | Description |
| --- | --- | --- |
| `schema` | string | Required. The key under `content.data` the result will be stored at. |
| `path` | string | Local path (under `public/`). Mutually exclusive with `url`. |
| `url` | string | Remote URL. Mutually exclusive with `path`. |
| `transform` | string | Dot-path into the response (e.g. `data.items`). |
| `detail` | string | `'rest'` / `'query'` / custom pattern for template-page item fetches. |
| `where` | object | Author-provided predicate (where-object). |
| `sort` / `limit` | any | Order and cap hints the author set. |
| `dynamicContext` | object | Present for template-page item fetches: `{ paramName, paramValue, schema }`. |

**Context** — the framework singletons, handed to the fetcher directly (no `globalThis` reads needed):

| Field | Description |
| --- | --- |
| `website` | The active Website. Read per-site transport config via `ctx.website.config.fetcher`. |
| `page` | The Page scope of the request. `null` for site-level fetches. |
| `block` | The Block triggering the request. `null` for page- and site-level fetches. |
| `signal` | `AbortSignal`. Aborts on block unmount or route change. Pass to `fetch()`. |

**Return** — always the same shape:

```js
{
  data,           // the fetched data. Never undefined — empty is [] or null/{}.
  error?: string, // presence signals failure; may coexist with stale data
  meta?: object,  // fetcher-specific metadata; stored alongside the cache entry
}
```

Throwing is tolerated but not idiomatic — the runtime catches and surfaces `{ data: [], error: String(err) }`. Prefer returning an explicit `error` field.

### Per-transport knobs

Optional fields on a transport object that the dispatcher recognizes:

| Field | Default | Description |
| --- | --- | --- |
| `cacheKey(request)` | `{schema, path, url, transform, method?, body?}` stringified | Override when the transport derives response content from fields the default key doesn't cover, or when two requests should intentionally share a key. |
| `prerenderable` | `true` | Set `false` to opt out of build-time (`uniweb build`) execution. The config is skipped at build and fetched at runtime in the browser. Use for transports that need browser-only APIs. |

### Binding config

Under the `fetcher:` block in `site.yml`, a foundation's transport can read its own named sub-block. By convention, use a key matching the transport name:

```yaml
# site.yml
fetcher:
  transports:
    articles: uniweb
  uniweb:                      # binding for the 'uniweb' transport
    siteFolder: abc-123-def
    sources: { blog: 'posts' }
```

The transport reads its config via `ctx.website.config.fetcher.{transportName}`. The framework does no validation — document the keys your transport reads in the foundation's README.

Values under `fetcher:` are **client-visible** — they ride into the site's HTML or `__DATA__`. The framework does not offer a secret configuration channel. For private credentials, the pattern is same-origin proxying (the site fetches `/api/…`, a deployment-layer proxy attaches the secret server-side). See the [Secrets section of the backend guide](../development/connecting-a-backend.md#secrets).

### Per-site default-fetcher vocabulary

Even without a named transport, sites can tune the framework's default fetcher via `site.yml`:

```yaml
fetcher:
  baseUrl: https://api.example.com       # recognized by the default fetcher
  headers:                                # recognized by the default fetcher
    X-Tenant: acme
  envelope:                               # recognized by the default fetcher
    collection: data.items
```

This works because the framework default fetcher reads from `website.config.fetcher` (same block, root keys). Named transports and the default-fetcher vocabulary coexist under one `fetcher:` block.

### Composing middleware

`@uniweb/fetchers` ships small middleware primitives that wrap a transport with cross-cutting behavior. The package is middleware-only — for a complete transport, write your own `resolve()` against `fetch()` and compose middleware around it:

```js
import { withAuth } from '@uniweb/fetchers'

const authed = withAuth(myTransport, () => someTokenProvider())
```

### Extensions contributing transports

An extension's `main.js` can export `transports: { … }` too. The dispatcher merges extension transports into a single registry, keyed by name. On a name collision with the primary foundation, the **primary wins** with a dev-mode warning. A malformed or throwing extension transport is logged and skipped — it never blocks the rest of the registry (parallels the `Promise.allSettled` pattern used to load extensions).

This lets a stats-widget extension package its own transport, and sites opt into it by name in `site.yml`:

```yaml
# site.yml
fetcher:
  transports:
    stats: extension-stats        # extension-contributed transport name
```

### When to skip the transports declaration

Most foundations don't need one. Omit `transports:` when:

- The site serves JSON from `public/data/` (the default fetcher works).
- The site hits a remote API that the default fetcher's `baseUrl` / `headers` / `envelope` / `method: POST` vocabulary can express — see [Connecting a Backend](../development/connecting-a-backend.md).
- Each component calls `fetch()` directly inside `useEffect` (bundled-style foundations).
- A third-party SDK manages transport inside the component.

See [Data Fetching](./data-fetching.md) for the author surface (`fetch:` / `data:` cascade) and [Connecting a Backend](../development/connecting-a-backend.md) for the recipes that don't need a custom transport.

---

## Common Variable Patterns

### Spacing System

```js
export const vars = {
  'spacing-xs': { default: '0.25rem', description: 'Extra small spacing' },
  'spacing-sm': { default: '0.5rem', description: 'Small spacing' },
  'spacing-md': { default: '1rem', description: 'Medium spacing' },
  'spacing-lg': { default: '2rem', description: 'Large spacing' },
  'spacing-xl': { default: '4rem', description: 'Extra large spacing' },
}
```

### Visual Style

```js
export const vars = {
  'border-radius-sm': { default: '0.25rem', description: 'Small radius' },
  'border-radius': { default: '0.5rem', description: 'Default radius' },
  'border-radius-lg': { default: '1rem', description: 'Large radius' },
  'shadow-sm': { default: '0 1px 2px rgba(0,0,0,0.05)', description: 'Small shadow' },
  'shadow': { default: '0 4px 6px rgba(0,0,0,0.1)', description: 'Default shadow' },
}
```

### Animation

```js
export const vars = {
  'transition-fast': { default: '150ms', description: 'Fast transitions' },
  'transition-normal': { default: '300ms', description: 'Normal transitions' },
  'transition-slow': { default: '500ms', description: 'Slow transitions' },
}
```

---

## Complete Example

```js
// src/main.js

/**
 * Cross-cutting design tokens that sites can override in theme.yml.
 * Values that belong to a specific component (header height, sidebar width)
 * should be params in that component's meta.js instead.
 */
export const vars = {
  // Spacing
  'section-padding-y': {
    default: 'clamp(4rem, 6vw, 7rem)',
    description: 'Vertical padding for sections (fluid)',
  },
  'container-padding-x': {
    default: '1.5rem',
    description: 'Horizontal padding for containers',
  },

  // Visual
  'radius': {
    default: '0.5rem',
    description: 'Default border radius for cards and buttons',
  },
  'radius-lg': {
    default: '1rem',
    description: 'Large border radius for panels and modals',
  },
  'shadow': {
    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    description: 'Default shadow for elevated elements',
  },
}

export default {
  defaultLayout: 'docs',
}
```

Layout dimensions like header height and sidebar width are layout params, not foundation vars — the layout component owns them:

```js
// src/layouts/docs/meta.js
export default {
  params: {
    headerHeight: { type: 'text', default: '4rem' },
    sidebarWidth: { type: 'text', default: '16rem' },
    maxContentWidth: { type: 'text', default: '80rem' },
  },
}
```

```jsx
// src/layouts/docs/index.jsx
export default function DocsLayout({ header, footer, left, right, body, params }) {
  // No need for fallback values — meta.js defaults are merged into params
  // before the layout component receives them.
  const { headerHeight, sidebarWidth, maxContentWidth } = params

  return (
    <div className="min-h-screen flex flex-col bg-section">
      {header && (
        <div className="sticky top-0 z-50" style={{ height: headerHeight }}>
          {header}
        </div>
      )}

      <div className="flex-1 flex mx-auto w-full" style={{ maxWidth: maxContentWidth }}>
        {left && (
          <aside className="shrink-0 border-r hidden lg:block" style={{ width: sidebarWidth }}>
            <div className="sticky overflow-y-auto" style={{ top: headerHeight, maxHeight: `calc(100vh - ${headerHeight})` }}>
              {left}
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {body}
        </main>

        {right && (
          <aside className="shrink-0 border-l hidden xl:block" style={{ width: sidebarWidth }}>
            <div className="sticky overflow-y-auto" style={{ top: headerHeight, maxHeight: `calc(100vh - ${headerHeight})` }}>
              {right}
            </div>
          </aside>
        )}
      </div>

      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

---

## Runtime Access

Access foundation variables from components:

```jsx
import { useThemeData } from '@uniweb/kit'

function Component() {
  const theme = useThemeData()

  // Get a foundation variable value
  const radius = theme?.getFoundationVar('radius')

  return <div style={{ borderRadius: radius }}>...</div>
}
```

---

## Best Practices

1. **Use semantic names**: `radius` not `r1` or `size-8`

2. **Only use vars for cross-cutting values**: A header height belongs to the layout component as a param. A border radius used by cards, buttons, and modals belongs as a foundation var. The test: would changing this value need to affect multiple unrelated components simultaneously?

3. **Provide good defaults**: Defaults should work out of the box

4. **Document with descriptions**: The `description` field helps site authors in the visual editor

5. **Register in `styles.css`**: Declare vars in both `main.js` (metadata) and `styles.css` via `@theme inline` (actual CSS)

6. **Consider dark mode**: Vars referencing colors should use theme tokens

7. **Test overrides**: Verify vars work when sites customize them in `theme.yml`

---

## Icon Libraries

Foundations can include icon libraries to enable named icon syntax in content. This allows content authors to use icons without managing SVG files.

### Why Include an Icon Library?

Without an icon library, content authors must:
- Provide SVG files for every icon
- Reference icons by file path: `![check](/icons/check.svg){role=icon}`

With an icon library installed, authors can write:
- `![check](lucide:check)` — Named icon from library
- `![arrow](lucide:arrow-right){size=20 color=blue}` — With size and color

### Installing an Icon Library

**1. Add the package:**

```bash
cd foundation
pnpm add lucide-react
```

**2. Create an icon wrapper component:**

```jsx
// src/components/Icon/index.jsx
import * as LucideIcons from 'lucide-react'

export function Icon({ name, library, size = 24, color, className }) {
  // For lucide library
  if (library === 'lucide' && name) {
    // Convert kebab-case to PascalCase: "arrow-right" → "ArrowRight"
    const pascalName = name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')

    const LucideIcon = LucideIcons[pascalName]
    if (LucideIcon) {
      return <LucideIcon size={size} color={color} className={className} />
    }
  }

  // Fallback: render nothing or a placeholder
  return null
}
```

**3. Use in your render component:**

The `@uniweb/kit` Render component handles named icons automatically when your foundation provides an Icon component. If you're using a custom renderer, check for the `library` and `name` attributes:

```jsx
// In your custom renderer
if (node.attrs?.role === 'icon' && node.attrs?.library) {
  const { library, name, size, color } = node.attrs
  return <Icon library={library} name={name} size={size} color={color} />
}
```

### Supported Libraries

The content parser recognizes these icon library prefixes:

| Prefix | Package | Install Command |
|--------|---------|-----------------|
| `lucide:` | lucide-react | `pnpm add lucide-react` |
| `heroicons:` | @heroicons/react | `pnpm add @heroicons/react` |
| `phosphor:` | @phosphor-icons/react | `pnpm add @phosphor-icons/react` |
| `tabler:` | @tabler/icons-react | `pnpm add @tabler/icons-react` |
| `feather:` | react-feather | `pnpm add react-feather` |

### Example: Multi-Library Support

```jsx
// src/components/Icon/index.jsx
import * as LucideIcons from 'lucide-react'
import * as HeroIcons from '@heroicons/react/24/outline'

function toPascalCase(str) {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function Icon({ name, library, size = 24, color, className }) {
  if (!name) return null

  const pascalName = toPascalCase(name)

  // Lucide icons
  if (library === 'lucide') {
    const IconComponent = LucideIcons[pascalName]
    if (IconComponent) {
      return <IconComponent size={size} color={color} className={className} />
    }
  }

  // Heroicons
  if (library === 'heroicons') {
    const IconComponent = HeroIcons[`${pascalName}Icon`]
    if (IconComponent) {
      return <IconComponent width={size} height={size} color={color} className={className} />
    }
  }

  console.warn(`[Icon] Unknown icon: ${library}:${name}`)
  return null
}
```

### Bundle Size Considerations

Icon libraries can be large. Consider these strategies:

**1. Tree-shaking (recommended):**

Most bundlers (Vite, webpack) tree-shake unused icons automatically when you import from the main package.

**2. Individual imports:**

Some libraries support individual imports for smaller bundles:

```jsx
import { Check, ArrowRight, Heart } from 'lucide-react'

const iconMap = { check: Check, 'arrow-right': ArrowRight, heart: Heart }

export function Icon({ name, size, color }) {
  const IconComponent = iconMap[name]
  return IconComponent ? <IconComponent size={size} color={color} /> : null
}
```

This limits which icons are available but produces smaller bundles.

**3. URL-based fallback:**

If named icons aren't found, fall back to URL-based icons:

```jsx
export function Icon({ name, library, url, size = 24, color }) {
  // Try named icon first
  if (library && name) {
    const IconComponent = resolveNamedIcon(library, name)
    if (IconComponent) {
      return <IconComponent size={size} color={color} />
    }
  }

  // Fall back to URL-based icon
  if (url) {
    return <img src={url} width={size} height={size} alt="" />
  }

  return null
}
```

### Content Author Usage

Once your foundation includes an icon library, content authors can use named icons:

```markdown
<!-- In section content -->
![](lucide:check) Feature included
![](lucide:x) Feature not included

<!-- With attributes -->
![success](lucide:check-circle){size=32 color=green}

<!-- In a button -->
[Get Started](lucide:arrow-right) [Get Started](/signup){icon=arrow-right}
```

---

## See Also

- [Site Theming](./site-theming.md) — Site-level theme customization
- [Layout Areas](./layout-areas.md) — Header, footer, and sidebar areas
- [Component Metadata](./component-metadata.md) — Component meta.js schema
- [Kit Reference](./kit-reference.md) — Accessing theme data in components
