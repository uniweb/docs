# Redirects and Subsites

Not every route in a site serves content. Some routes redirect to another page — a parent category that sends you to its first child, or a legacy URL that points to a new location. Other routes are served by entirely separate sites — a docs portal with its own foundation, deployed independently but appearing as part of the main domain.

Uniweb handles both cases through page-level declarations that are visible in the file structure, self-documenting, and actionable by deploy scripts.

---

## Redirects

A redirect sends the browser to a different URL. Use it when a page has no content of its own — it exists as a route but immediately navigates somewhere else.

### When to use redirects

- **Parent pages that redirect to their first child.** A `/solutions` page that exists only to organize `/solutions/academic`, `/solutions/institutional`, and `/solutions/governance` in navigation. The parent has no content — visiting it should take you to the first child.
- **Moved pages.** A page that used to live at `/features` now lives at `/product/features`. The old URL should redirect to the new one.
- **Vanity URLs.** A short URL like `/start` that redirects to `/docs/getting-started`.

### How to declare a redirect

Add `redirect:` to the page's `page.yml`:

```yaml
# pages/solutions/page.yml
title: Solutions
redirect: academic
pages: [academic, institutional, governance]
```

The redirect target can be:

| Format | Example | Resolves to |
|--------|---------|-------------|
| Relative path | `redirect: academic` | `/solutions/academic` |
| Absolute path | `redirect: /product/features` | `/product/features` |
| External URL | `redirect: https://docs.example.com` | External navigation |

No `.md` files are needed in the page directory — the redirect replaces content entirely. The page still appears in navigation (controlled by `pages:`, `hidden:`, etc.) but clicking it navigates to the target.

### How redirects work

Redirects operate at three levels for maximum compatibility:

1. **SPA navigation.** When the user navigates within the app (clicking a link), the runtime detects the redirect and calls `navigate()` with `replace: true`. The URL changes instantly — no page load, no flash.

2. **Static HTML.** The build generates a minimal HTML file at the redirect route with `<meta http-equiv="refresh">`. If someone lands on the URL directly (bookmark, external link, search engine), the browser redirects immediately. Works on any static host.

3. **Server-side redirect.** The build generates a `_redirects` file in the output directory with proper HTTP 302 entries. Cloudflare Pages and Netlify process this file natively — the redirect happens at the server level, faster than HTML and better for SEO.

```
# Generated _redirects
/solutions /solutions/academic 302
/features /product/features 302
```

### Redirect vs index

Uniweb also has `index:` in page.yml, which serves a different purpose:

| | `index: academic` | `redirect: academic` |
|---|---|---|
| URL in browser | `/solutions` | `/solutions/academic` |
| Content source | Academic page content served at parent route | Academic page keeps its own route |
| Child route | `/solutions/academic` doesn't exist (absorbed) | `/solutions/academic` is the canonical URL |

Use `index:` when the child IS the parent page (its content belongs at the parent URL). Use `redirect:` when the child should keep its own URL and the parent just points to it.

---

## Subsites (Rewrites)

A rewrite transparently serves content from a different origin without changing the URL. Use it when a route is handled by a separately-built site — its own foundation, its own content, its own deployment — but appears as part of the main domain.

### When to use subsites

- **University sites.** The main site is at `university.edu`, the documentation portal is a separate Uniweb project at `university.edu/docs`, and the research hub is at `university.edu/research`. Each has its own design system (foundation) and is maintained by a different team.
- **Product + docs.** The marketing site and the documentation site share a domain but have different visual identities and deploy independently.
- **Gradual migration.** Part of a domain is served by a legacy system while new sections are built with Uniweb.

### How to declare a subsite

Create a page directory at the mount point with `rewrite:` in its `page.yml`:

```yaml
# pages/docs/page.yml
title: Documentation
rewrite: https://docs.university.edu
```

This tells Uniweb:
- The `/docs` route (and everything under it) is served by `docs.university.edu`
- Don't collect content or generate HTML for this route
- Add a rewrite entry to the generated `_redirects` file for the hosting platform

The page directory needs no `.md` files — only the `page.yml` with the rewrite declaration.

### Configuring the subsite

The subsite is an independent Uniweb project (or any web application). For a Uniweb subsite, configure it to serve at the path prefix using `base:` in its `site.yml`:

```yaml
# docs project's site.yml
name: Documentation
base: /docs/
```

The `base:` setting flows through the entire build:
- Vite prepends it to all asset URLs
- React Router uses it as the basename (all links resolve correctly)
- The runtime's `website.basePath` provides it to components

### How the pieces connect

The full setup for a university site with subsites:

```
university.edu/          ← Main site
university.edu/docs/     ← Docs subsite (separate build)
university.edu/research/ ← Research subsite (separate build)
```

**Main site structure:**

```
main-site/
├── site.yml
├── pages/
│   ├── home/
│   ├── about/
│   ├── docs/
│   │   └── page.yml        # rewrite: https://docs.university.edu
│   └── research/
│       └── page.yml        # rewrite: https://research.university.edu
└── src/                    # Foundation package
```

**Docs subsite (separate project):**

```
docs-site/
├── site.yml                 # base: /docs/
├── pages/
│   ├── getting-started/
│   ├── guides/
│   └── reference/
└── src/                     # Different design system
```

**What the main site build produces:**

```
dist/
├── index.html               # Main site
├── about/index.html         # Main site
└── _redirects               # Redirects + rewrite proxy rules
```

The `_redirects` file contains both redirects (302) and rewrite proxy rules (200):

```
# Auto-generated from page.yml redirect: and rewrite: declarations
/docs/* https://docs.university.edu/:splat 200
/research/* https://research.university.edu/:splat 200
```

The `200` status code tells the host to proxy the request transparently (the browser URL stays the same). This format is natively supported by Cloudflare Pages and Netlify.

### Deploying subsites

Each site is built and deployed independently. The hosting layer stitches them together:

**Cloudflare Pages / Netlify:** The generated `_redirects` file includes rewrite rules (status 200) that these platforms process natively. No additional configuration needed — deploy the main site's `dist/` and the host proxies subsite paths automatically.

**Vercel:** Translate the rewrite entries to `vercel.json` format:

```json
{
  "rewrites": [
    { "source": "/docs/:path*", "destination": "https://docs.university.edu/:path*" }
  ]
}
```

**Custom hosting:** Configure your reverse proxy (Nginx, Caddy, etc.) to route path prefixes to the subsite origins:

```nginx
location /docs/ {
    proxy_pass https://docs.university.edu/;
}
```

**Same-origin deployment:** If all sites are deployed to the same static host (e.g., different directories on one Cloudflare Pages project), no proxy is needed — the host serves files directly from each site's `dist/` at the appropriate path prefix.

### Development workflow

During local development (`pnpm dev`), the host-level proxy isn't available. Each subsite runs its own dev server on a different port. You work on one site at a time:

```bash
# Main site
cd main-site && pnpm dev          # http://localhost:5173

# Docs subsite (separate terminal)
cd docs-site && pnpm dev          # http://localhost:5174
```

Cross-site navigation during dev requires opening the other site's dev server URL directly. The stitching only works in production (or with a local reverse proxy like Caddy or nginx).

### Navigation between sites

When a user clicks a link from the main site to `/docs/getting-started`, the hosting layer serves the docs site. This is a full page navigation — the main site's SPA router is not involved. The docs site loads with its own foundation, its own runtime, and takes over from there.

Links within the docs site (`/docs/guides` → `/docs/reference`) are SPA navigations handled by the docs site's router.

Links from the docs site back to the main site (`/docs/...` → `/about`) are full page navigations — the browser loads the main site.

This is the expected behavior for subsites with different foundations. Each site is a self-contained SPA within its path prefix.

### Subsites vs content mounting

Uniweb also supports [custom content paths](../reference/site-configuration.md) — mounting external directories into a single site's page tree:

```yaml
# site.yml
paths:
  pages/docs: ../../../docs-content
```

These are different concepts:

| | Content mounting (`paths:`) | Subsite (`rewrite:`) |
|---|---|---|
| **Foundation** | Shared — one design system | Independent — each site has its own |
| **Build** | One build output | Separate builds |
| **Navigation** | SPA (instant transitions) | Full page load between sites |
| **Theming** | Shared theme, shared tokens | Each site has its own theme |
| **Use case** | Different content sources, same design | Different teams, different designs |

Use content mounting when the external content should look and feel like part of the same site. Use subsites when the sections need their own identity.

---

## Summary

| Declaration | Browser URL changes? | Generated files | Use case |
|-------------|---------------------|-----------------|----------|
| `redirect:` | Yes | Redirect HTML + `_redirects` | Parent → child, moved pages, vanity URLs |
| `rewrite:` | No | `_rewrites` | Subsites with independent builds |
| `index:` | No | Regular page HTML | Child content served at parent route |
| `paths:` | N/A (build-time) | N/A | External content in the same build |

All four are visible in the file structure — either in `page.yml`, `site.yml`, or as directory layout. No hidden configuration files, no separate deployment manifests. The site's structure documents how its routes work.
