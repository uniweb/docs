# Site Publishing Architecture

How sites are published from the editor to the Cloudflare edge and served to visitors.

## Overview

```
Editor (browser)                  PHP                      Worker (Cloudflare)
   │                               │                          │
   ├─ "Publish" click              │                          │
   ├─ POST website.php ──────────► │                          │
   │   action=authorizePublish     ├─ validate permission     │
   │                               ├─ resolve UUID + handle   │
   │                               ├─ sign JWT (5 min)        │
   │  ◄─── { publishToken,       ─┤                          │
   │         siteId, handle }      │                          │
   │                               │                          │
   ├─ Build payload (content,     │                          │
   │   theme, locales)             │                          │
   ├─ POST /api/publish/process ───┼────────────────────────► │
   │   Authorization: Bearer JWT   │                          ├─ verify JWT
   │   Body: { foundation, theme,  │                          ├─ generate theme CSS
   │           locales, ... }      │                          ├─ assemble HTML shell
   │                               │                          ├─ decompose content
   │                               │                          ├─ write to R2 sites/{uuid}/
   │                               │                          ├─ register KV mappings
   │  ◄────────────────────────────┼─── { url, siteId } ──────┤
   │                               │                          │
   └─ Show published URL           │                          │
```

## Key Concepts

### Site Identity

- **UUID** — permanent, never changes. Used as the R2 key prefix (`sites/{uuid}/`). Comes from the website profile in the database.
- **Handle** — user-facing slug, can be changed. Used as the subdomain (`{handle}.uniweb.website`). Sanitized to be subdomain-safe (lowercase, hyphens only).
- **Custom domain** — optional. User connects their own domain (e.g., `mysite.com`).

### Domain Resolution

When a visitor requests a page, the Worker resolves the hostname to a UUID:

```
mysite.com              → KV lookup → UUID → sites/{uuid}/
my-handle.uniweb.website → KV lookup → UUID → sites/{uuid}/
```

Both map to the same R2 data. The KV `SITE_MAP` is the source of truth for hostname → UUID mapping.

### Pool Domains

Sites without custom domains get a subdomain on a pool domain. Currently `uniweb.website` is the only pool. Future pools (e.g., `uniweb.io`, `uniweb.edu`) can be added via:

1. DNS: add wildcard `*.{pool}` CNAME to Cloudflare
2. Worker route: add `*.{pool}/*` in `wrangler.toml`
3. Config: add to `SITE_DOMAINS` env var (comma-separated)

The Worker checks all pool domains when resolving subdomains.

## Publish Flow — Step by Step

### 1. PHP `authorizePublish`

**File:** `php/bundles/profiles/src/WebsiteController.php`

The editor calls `website.php?action=authorizePublish&contentId={id}`. PHP:

1. Validates EDIT permission (via ROUTES)
2. Gets the website profile UUID (`getProfileUUID`)
3. Gets the handle, sanitizes for subdomain use (lowercase, no dots)
4. Resolves custom domains from website info
5. Reads foundation reference from the docufolio template (`custom_styler` field)
6. Signs a short-lived JWT (5 minutes):

```json
{
  "sub": "42",
  "siteId": "FJLAQMTqTYN6Pg4kGCSc1f",
  "handle": "my-site",
  "domains": ["mysite.com"],
  "action": "publish",
  "exp": 1774462287
}
```

Returns: `{ publishToken, siteId, handle, domains, foundation, runtimeVersion, publishUrl }`

### 2. Frontend builds payload

**File:** `uniweb-js/src/pages/WebsiteContentEditor/components/Header/SiteMenu.jsx`

The editor builds the publish payload using existing `buildEnginePreviewPayload()` logic:

```json
{
  "foundation": "@uniweb/foundation@0.1.22",
  "runtimeVersion": "0.6.15",
  "theme": { "colors": {...}, "fonts": {...} },
  "defaultLanguage": "en",
  "languages": ["en", "fr"],
  "locales": {
    "en": { "pages": [...], "config": {...}, "layouts": {...} },
    "fr": { "pages": [...], "config": {...} }
  }
}
```

Note: `siteId` is NOT in the payload — it comes from the JWT.

### 3. Worker processes payload

**File:** `uniweb-edge/src/publish.js`

1. **Verify JWT** — extract `siteId` (UUID), `handle`, `domains` from claims
2. **Resolve foundation URLs** — parse `@namespace/name@version` → R2 paths
3. **Read foundation schema** from R2 (for theme foundation vars)
4. **Read runtime template** from R2 (`runtime/{version}/index.html`)
5. **Generate theme CSS** — `buildTheme()` from `@uniweb/theming` (already bundled)
6. **Assemble HTML shell** — inject `__DATA__`, theme CSS, font links, foundation preload
7. **Decompose content** — split pages into per-route JSON chunks
8. **Build meta.json** — dynamic routes, language config, route translations
9. **Write to R2** — all artifacts under `sites/{uuid}/`
10. **Clear caches** — delete cached SSR HTML, invalidate KV meta cache, clear in-memory SSR cache
11. **Update KV** — register `{handle}.{pool} → UUID` and `{custom-domain} → UUID`

### 4. Serving

The Worker serves the published site via the three-tier rendering strategy:

- **Tier 1**: Cached HTML from R2 (fastest, ~5ms)
- **Tier 2**: On-demand SSR via Dynamic Workers (~50-200ms first hit, cached to R2)
- **Tier 3**: Shell-mode fallback with `__DATA__` injection (if SSR fails)

**Important**: Cloudflare's CDN does NOT cache Worker-generated responses automatically. Every request invokes the Worker. The `s-maxage` headers are for browser/downstream proxy caching only. Our R2-based cache (Tier 1) is the only server-side cache layer.

## R2 Storage Layout

```
R2 bucket: uniweb

sites/{uuid}/
├── _render/
│   ├── content.json         # Full content (all locales, all pages)
│   ├── base.html            # Assembled HTML shell
│   ├── meta.json            # Dynamic routes, language config
│   ├── config.json          # Site config + foundation URLs + i18n
│   └── pages/               # Per-page content chunks
│       ├── index.json
│       ├── Features.json
│       └── Articles/:id.json
├── pages/                   # Cached SSR output (Tier 1)
├── _dynamic/                # Cached dynamic page renders
├── index.html               # Fallback (copy of base.html)
└── 404.html                 # Error fallback

foundations/{namespace}/{name}/{version}/
├── foundation.js            # ESM (browser)
├── foundation.ssr.js        # Self-contained SSR bundle (Dynamic Workers)
├── meta/schema.json
└── assets/foundation.css

runtime/{version}/
├── index.html               # HTML template
├── assets/                  # JS bundles
├── _importmap/              # Module re-exports
└── manifest.json
```

## KV Namespace: SITE_MAP

Maps hostnames to site UUIDs.

| Key | Value | Source |
|-----|-------|--------|
| `my-site.uniweb.website` | `UUID` | Subdomain (plain string) |
| `mysite.com` | `UUID` or `{"siteId":"UUID","locale":"fr"}` | Custom domain (plain or JSON with locale) |
| `_domains:UUID` | `{"subdomain":"my-site.uniweb.website","custom":{"mysite.com":"en","monsite.fr":"fr"}}` | Reverse mapping for SEO tags |

**KV value formats**:
- Plain string `UUID` — most sites, no locale override
- JSON `{"siteId":"UUID","locale":"fr"}` — per-domain locale (advanced)
- Worker detects format by checking if value starts with `{`

**On handle change + republish**: Worker cleans old subdomain entries, creates new one. Custom domain entries are managed by PHP (not touched during publish).

R2 data is untouched — UUID never changes.

## KV Namespace: SITE_META

Short-lived cache (60s TTL) for `meta.json`. Avoids R2 reads on every request. Auto-populated on first request, invalidated on republish and domain changes.

## Custom Domains

Sites can have custom domains via **Cloudflare for SaaS**:

1. User adds domain in website settings UI
2. PHP creates a Cloudflare custom hostname via API
3. User adds CNAME: `mysite.com → proxy.uniweb.website`
4. Cloudflare validates ownership and provisions SSL
5. PHP registers domain in KV SITE_MAP
6. Traffic to `mysite.com` → Worker → same site from R2

Custom domains are managed by PHP (`connectDomain`, `disconnectDomain`, `updateDomainLocale`). Both subdomain and custom domains coexist — a site is always accessible at `{handle}.{pool}` AND at any connected custom domains.

### Per-Domain Locale

Custom domains can be assigned a language. When set, visitors to that domain see content in that language by default:

- `mysite.com` → English (locale: "en")
- `monsite.fr` → French (locale: "fr")

The Worker reads the locale from the KV JSON value and overrides `parseLocale`'s default language.

## SEO Tags (Canonical + Hreflang)

The Worker generates and bakes SEO tags into cached HTML at Tier 2 SSR time:

- `<link rel="canonical">` — points to the primary domain (first custom domain, or subdomain)
- `<link rel="alternate" hreflang="xx">` — one per language (path-based or per-domain)
- `<link rel="alternate" hreflang="x-default">` — points to primary language version

Tags are baked into cached HTML — zero runtime overhead on Tier 1 cache hits. The `_domains:UUID` KV entry provides the domain-locale mapping.

## Security

- JWT is scoped: `{ siteId, handle, domains, action: "publish", exp: 5min }`
- Worker reads `siteId` from JWT only — ignores request body
- Worker validates `action === "publish"` — CLI tokens can't publish sites
- PHP validates EDIT permission before issuing the token

## Handle Sanitization

Handles are sanitized for subdomain compatibility:
- Lowercase
- Dots → hyphens
- Only `a-z`, `0-9`, `-` allowed
- Multiple hyphens collapsed
- Leading/trailing hyphens trimmed
- Reserved names blocked: `proxy`, `www`, `api`, `mail`, `admin`, `cdn`, `connect`, etc.

New handles are created clean via `normalizeProfileHandle()`. Old handles are sanitized at publish time in `authorizePublish`.

## Files Reference

| File | Description |
|------|-------------|
| `uniweb-edge/src/publish.js` | Worker publish handler — process payload, write to R2, update KV |
| `uniweb-edge/src/index.js` | Site resolution, SEO tag injection, cache purge endpoint |
| `uniweb-edge/src/ssr.js` | SSR via Dynamic Workers, cache invalidation |
| `uniweb-edge/src/locale.js` | Locale parsing, route translation, `buildSeoTags()` |
| `uniweb-edge/src/router.js` | `resolveSiteId()` — parses plain and JSON KV values |
| `uniweb-edge/wrangler.toml` | `SITE_DOMAINS`, Worker routes, KV bindings |
| `php/.../WebsiteController.php` | `authorizePublish`, domain management, KV sync |
| `php/.../CloudflareClient.php` | Cloudflare API — custom hostnames, KV CRUD, CDN purge |
| `uniweb-js/.../DomainPanel.jsx` | Unified domain settings UI |
| `uniweb-js/.../SiteMenu.jsx` | Editor publish flow |
| `uniweb-js/.../editor.js` | `authorizePublish` adapter method |
