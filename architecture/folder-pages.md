# Folder Pages and Redirects Architecture

Folder pages are content-less structural containers in the page hierarchy, and any page can be configured with an explicit redirect. There are three scenarios.

## Scenario 1: Dynamic folder (with index child)

**Structure**: `/Articles` (empty folder) + `/Articles/index` (listing page) + `/Articles/:id` (detail template)

**Behavior**: Visiting `/Articles` renders the index child's content. The URL stays clean (no `/index` suffix). The folder appears in navigation; the index and template children are hidden from nav.

**How it works**:

1. **`@uniweb/core` — `getPage()`**: When a folder has an `isIndex` child, `getPage('/Articles')` returns the index child directly. Unconditional (not gated on `hasContent()`).
2. **`@uniweb/core` — `getPageHierarchy()`**: The `isIndex` child is filtered from nav by the `isIndex && route.endsWith('/index')` rule. The folder stays visible via the `hasNavigableIndex` check.
3. **`@uniweb/core` — `getNavigableRoute()`**: Returns the folder's own route when an index child exists, preventing auto-redirect in PageRenderer.
4. **`@uniweb/core` — `getLocaleUrl()`**: Uses `getNavRoute()` (not `page.route`) so language switcher generates `/Articles` instead of `/Articles/index`.

## Scenario 2: Static folder (no index child)

**Structure**: `/Docs` (empty folder) + `/Docs/Getting-Started` + `/Docs/API`

**Behavior**: Visiting `/Docs` redirects to the first child page with content (`/Docs/Getting-Started`). The URL changes.

This is an **auto-redirect** computed from the page hierarchy. No manual configuration required.

## Scenario 3: Explicit per-page redirect

**Structure**: Any page (e.g., `/About`) with a redirect target set via the editor's "Redirect to…" context-menu item.

**Behavior**: Visiting `/About` redirects to the chosen target (e.g., `/Team`). Works on any page, including content-less folders (where it overrides the auto-redirect).

**How it's stored**: The legacy top-level `route` field on the docufolio page item is repurposed as the redirect marker, with value `"page:<targetId>"`. Stored as a `localstr` (the same marker value is written to every locale entry) so the existing schema/persistence layer works without changes.

**How it's resolved**:

1. **Editor**: `PageRedirectModal` opens a `SelectBox` of valid target pages (computed via `sortFlatSections` + same filters as `EditorCanvas` `linkOptions`). Picks write `page:<id>` to the source page's `route` field via `engine.changePageRedirect()` → `adapter.updatePageRedirect()` → PHP `updateTopicRoute`.
2. **Publish-time resolution**: In `buildEnginePreviewPayload`, the `page:<id>` marker is converted to `pageResult.redirect = <targetRoute>`. If the target is an index page (route ends in `/index`), the suffix is stripped so the redirect lands on the clean folder URL.
3. **Worker priority** (in `computeRedirects`): explicit redirects (Pass 1) win over folder auto-redirects (Pass 2). A third pass flattens chains (`A → B → C` becomes `A → C`) with a 10-hop cap and direct-cycle guard.

### Why repurpose the legacy `route` field?

The PHP docufolio schema already had a top-level `Route` field (`Custom URL path`) that was previously used to override the URL slug. That feature has been removed — routes are now always computed from `label`/`title`. The field schema, backend persistence, and edit modal all work as-is, so reusing it as the redirect marker requires zero schema changes and the existing edit modal continues to work.

### `route` field is no longer a URL path

Multiple places in the editor previously fell back to `page.route` as a URL path. They have all been changed to compute the URL from `label`/`title` via `computeEngineRoutes`:

- `computeEngineRoutes()` no longer reads `_attributes_.route` as a custom slug.
- `buildEnginePreviewPayload()` no longer falls back to `p.route` when computing `idToRoute`.
- `pagesPreview()` and `sectionsPreview()` (in `action-executors.js`) compute routes via `computeEngineRoutes()` instead of reading `p.route`.
- `useEditorEngine.syncPreviewFull()` recomputes the preview's `pageRoute` from the route map.
- `PageFlowHub.getPageRoute()` derives from the page label only.

The raw `page.route` value is now passed through `buildEngineContent()` only so the redirect resolver can read it later — no other consumer treats it as a URL.

## Redirect mechanisms across deployment targets

| Target | Mechanism | Where |
|--------|-----------|-------|
| **Client SPA** | `useEffect` + `navigate()` in PageRenderer | `runtime/src/components/PageRenderer.jsx` |
| **Cloudflare Worker** | HTTP 302, computed at publish time | `uniweb-edge/src/publish.js` → `meta.json` redirects map, served by `index.js` |
| **Static export** (GitHub Pages) | `<meta http-equiv="refresh">` HTML file | `build/src/prerender.js` |

### Why three different redirect mechanisms?

Each deployment target has different constraints:

- **Client SPA**: JS-based redirect via React Router. Works after hydration. Universal fallback.
- **Cloudflare Worker**: HTTP 302 redirect at the edge. No flash, works without JS, cached at the edge for ~1 year. Computed at publish time from `meta.json` to avoid SSR overhead. Handles locale translation (`buildLocalePath`) and per-domain locale sites (overrides `defaultLanguage` with `domainLocale`).
- **Static export**: `<meta http-equiv="refresh">` baked into HTML files on disk. No server needed; works on any static host (GitHub Pages, Netlify, S3).

## Page hierarchy inference

`@uniweb/core`'s `buildPageHierarchy()` links parent-child relationships in two ways:

1. **Explicit `parentRoute`**: Set by the editor via `buildEnginePreviewPayload()` (converts `page.parent` ID to route string).
2. **Route-based inference** (fallback): For pages without explicit `parentRoute`, infers parent from route structure (e.g., `/Articles/index` → parent `/Articles`). Only applies to nested routes (2+ segments). Top-level pages are never inferred as children of the homepage.

This ensures `page.children` is populated regardless of whether the payload includes parent info.

## Key file map

| Concern | File | Function |
|---|---|---|
| Folder→index resolution | `core/src/website.js` | `getPage()`, `getPageHierarchy()` |
| Navigable route logic | `core/src/page.js` | `getNavigableRoute()`, `getNavRoute()` |
| Locale URL generation | `core/src/website.js` | `getLocaleUrl()` |
| Route computation (editor) | `uniweb-js/src/engine/content-helpers.js` | `computeEngineRoutes()` |
| Redirect marker → `pageResult.redirect` | `uniweb-js/src/engine/content-helpers.js` | `buildEnginePreviewPayload()` |
| Redirect marker → preview action | `uniweb-js/src/engine/action-executors.js` | `pagesPreview()`, `changePageRedirect` executor |
| Persist redirect to PHP | `uniweb-js/src/adapters/editor.js` | `updatePageRedirect()` |
| PHP `route` field write | `php/bundles/profiles/src/DocufolioController.php` | `updateTopicRoute()` |
| Editor UI — context menu | `uniweb-js/src/pages/.../PageBar/PageContextMenu.jsx`, `PageItemAction.jsx` | "Redirect to…" item |
| Editor UI — picker modal | `uniweb-js/src/pages/.../PageBar/PageRedirectModal.jsx` | `SelectBox` of valid targets |
| Worker compute redirects | `uniweb-edge/src/publish.js` | `computeRedirects()` (3 passes) |
| Worker serve 302 | `uniweb-edge/src/index.js` | `handleServe()` ~line 380 |
| Client SPA redirect | `runtime/src/components/PageRenderer.jsx` | `redirectTarget` / `autoRedirectRoute` effects |
| Static export redirect | `build/src/prerender.js` | `<meta http-equiv="refresh">` HTML |
