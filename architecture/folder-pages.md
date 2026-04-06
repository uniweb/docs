# Folder Pages Architecture

Folder pages are content-less structural containers in the page hierarchy. They appear in navigation but delegate their content to child pages. There are two distinct scenarios:

## Scenario 1: Dynamic folder (with index child)

**Structure**: `/Articles` (empty folder) + `/Articles/index` (listing page) + `/Articles/:id` (detail template)

**Behavior**: Visiting `/Articles` renders the index child's content. The URL stays clean (no `/index` suffix). The folder appears in navigation; the index and template children are hidden from nav.

**How it works**:

1. **`@uniweb/core` — `getPage()`**: When a folder has an `isIndex` child, `getPage('/Articles')` returns the index child directly. This is unconditional (not gated on `hasContent()`).

2. **`@uniweb/core` — `getPageHierarchy()`**: The `isIndex` child is filtered from nav by the `isIndex && route.endsWith('/index')` rule. The folder stays visible via the `hasNavigableIndex` check.

3. **`@uniweb/core` — `getNavigableRoute()`**: Returns the folder's own route when an index child exists, preventing auto-redirect in PageRenderer.

4. **`@uniweb/core` — `getLocaleUrl()`**: Uses `getNavRoute()` (not `page.route`) so language switcher generates `/Articles` instead of `/Articles/index`.

5. **SSR**: Both unicloud and uniweb-edge resolve folder pages to their index child for rendering via `resolvePageForRender()` in `@uniweb/runtime/ssr`.

## Scenario 2: Static folder (no index child)

**Structure**: `/Docs` (empty folder) + `/Docs/Getting-Started` + `/Docs/API`

**Behavior**: Visiting `/Docs` redirects to the first child page with content (`/Docs/Getting-Started`). The URL changes.

**How it works across deployment targets**:

| Target | Mechanism | Where |
|--------|-----------|-------|
| **Client SPA** | `useEffect` + `navigate()` in PageRenderer | `runtime/src/components/PageRenderer.jsx` |
| **Cloudflare Worker** | HTTP 302, computed at publish time | `uniweb-edge/src/publish.js` → `meta.json` redirects map, served by `index.js` |
| **Static export** (GitHub Pages) | `<meta http-equiv="refresh">` HTML file | `build/src/prerender.js` |

### Why three different redirect mechanisms?

Each deployment target has different constraints:

- **Client SPA**: JS-based redirect via React Router. Works after hydration. This is the universal fallback that works in all environments.

- **Cloudflare Worker**: HTTP 302 redirect at the edge. No flash, works without JS, cached at CDN. Computed at publish time from `meta.json` to avoid SSR overhead. Handles locale translation and per-domain locale sites.

- **Static export**: `<meta http-equiv="refresh">` baked into an HTML file on disk. No server needed. Slightly slower than HTTP 302 (browser parses HTML first) but works on any static host (GitHub Pages, Netlify, S3).

## Page hierarchy inference

`@uniweb/core`'s `buildPageHierarchy()` links parent-child relationships in two ways:

1. **Explicit `parentRoute`**: Set by the editor via `buildEnginePreviewPayload()` (converts `page.parent` ID to route string).

2. **Route-based inference** (fallback): For pages without explicit `parentRoute`, infers parent from route structure (e.g., `/Articles/index` → parent `/Articles`). Only applies to nested routes (2+ segments). Top-level pages are never inferred as children of the homepage.

This ensures `page.children` is populated regardless of whether the payload includes parent info (editor preview has it, some publish flows may not).

## Shared utilities

| Utility | Package | Used by |
|---------|---------|---------|
| `resolvePageForRender(page)` | `@uniweb/runtime/ssr` | unicloud prerenderer |
| `getNavigableRoute()` | `@uniweb/core` (Page) | build prerenderer, PageRenderer |
| `hasContent()` | `@uniweb/core` (Page) | All packages |
| `getNavRoute()` | `@uniweb/core` (Page) | Navigation, locale URLs |
| `computeRedirects()` | `uniweb-edge/src/publish.js` | Worker only (HTTP 302) |

**Note**: `uniweb-edge/src/ssr.js` has an inline copy of `resolvePageForRender` logic because its SSR runs inside a Dynamic Worker isolate that can only import from `foundation.ssr.js`. The comment in the code references the shared utility.
