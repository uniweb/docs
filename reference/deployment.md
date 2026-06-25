# Deployment Reference

Per-host recipes for deploying Uniweb sites — Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront, and self-hosted servers.

> **For the conceptual model** — path 1 (you manage the content) vs path 2 (foundation as a product), free CI vs Uniweb hosting, the two-artifact framing — see **[Deploying](../development/deploying.md)**. This page is the per-host deep-dive.

## Build for Production

```bash
pnpm build      # equivalent to `uniweb build` from the site directory
```

With pre-rendering enabled (recommended), this produces a directory-per-route layout:

```
site/dist/
├── index.html              # home page
├── 404.html                # generated automatically
├── about/
│   └── index.html          # /about
├── docs/
│   ├── index.html          # /docs (the docs landing)
│   └── getting-started/
│       └── index.html      # /docs/getting-started
├── fr/                     # non-default locales nest under their code
│   ├── index.html
│   └── about/
│       └── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
├── data/                   # compiled collection JSONs
└── search-index.json
```

The `dist/` folder is a complete static site ready to deploy. The directory-per-route pattern matters for hosts that don't auto-resolve directory indexes — see [AWS S3 + CloudFront](#aws-s3--cloudfront) below.

---

## Pre-rendering (SSG)

For static HTML at build time, enable pre-rendering in `site.yml`:

```yaml
build:
  prerender: true
```

**Benefits:**
- Fast initial page loads
- SEO-friendly (content in HTML)
- Works without JavaScript
- Cacheable at CDN edge

**Without pre-rendering:**
- Single `index.html` with client-side rendering
- JavaScript loads and renders content
- Smaller initial bundle

Most sites should enable pre-rendering.

---

## Deploy commands

| Command | What it does |
|---|---|
| `uniweb publish` | Publishes to Uniweb hosting — brings the foundation along, syncs content, goes live (edge SSR, locale-aware routing, foundation propagation). Requires `uniweb login`. See [Publishing to Uniweb hosting](#publishing-to-uniweb-hosting). |
| `uniweb deploy --host=<adapter>` | Builds and uploads to a third-party static host via a built-in adapter. Adapters: `cloudflare-pages`, `github-pages`, `s3-cloudfront`, `vercel`, `netlify`, `generic-static`. The adapter handles host-specific quirks (URI rewrites, redirect helpers, cache headers, invalidation). |
| `uniweb deploy --target=<name>` | Picks a target by name from `deploy.yml` (a sibling of `site.yml`). |
| `uniweb export` | Builds `dist/` for a static host but doesn't upload. Use with hosts that aren't covered by a built-in adapter, or when you let the host (Vercel, Cloudflare Pages, Netlify, etc.) run the build itself via Git integration. |
| `pnpm build` | Equivalent to `uniweb build` from the site directory. Produces `dist/` only — no upload, no host-specific helpers. Useful for inspecting build output during development. |

Configure the destination in `deploy.yml` (a sibling of `site.yml`):

```yaml
# site/deploy.yml — safe to commit
default: production

targets:
  production:
    host: cloudflare-pages         # a third-party adapter (s3-cloudfront, github-pages,
                                   # vercel, netlify, generic-static), or 'uniweb' to
                                   # delegate to `uniweb publish` (Uniweb hosting).
    # adapter-specific fields below — see the per-host sections.
    # For host: uniweb, an optional `backend:` pins which Uniweb backend this
    # site publishes to (default: https://uniweb.app). `uniweb publish` records
    # it here on first publish; it overrides the logged-in backend for this site.

autoSave: lastDeploy               # off | lastDeploy | full

# Auto-managed by uniweb deploy on success — do not edit by hand.
lastDeploy:
  production:
    at: 2026-05-05T18:22:11Z
    url: https://example.com
    foundation: { shape: linked, ref: '@uniweb/marketing@0.4.2' }
    runtime: 0.8.9
```

The `--host=<adapter>` CLI flag overrides the resolved target's host for one-off deploys (no save). `--target=<name>` selects a target other than `default:`. `uniweb deploy` always targets a third-party host — `--host=<adapter>` or a `deploy.yml` target is required; to go live on Uniweb hosting, use `uniweb publish`.

### Two deploy lifecycles

Static hosts come in two flavors. Both are first-class:

- **CLI-push.** You run `uniweb deploy` locally; the CLI builds, uploads, and invalidates. State of record: `deploy.yml`'s `lastDeploy` block. Auth: your machine. The adapter with this lifecycle today: `s3-cloudfront`.
- **Git-driven.** You wire up your host's GitHub integration (Vercel, Cloudflare Pages, Netlify, GitHub Pages via Actions). The host runs `npx uniweb build` in CI on each push and serves the resulting `dist/`. State of record: the host's dashboard. Auth: the host's GitHub integration. The CLI's `deploy` step never runs.

For Git-driven hosts, `deploy.yml` is still useful — it declares which adapter the build uses, so the right `_redirects` / `.nojekyll` / etc. land in `dist/`. The build also auto-detects the CI host (`VERCEL=1`, `CF_PAGES=1`, `NETLIFY=true`) and picks the matching adapter without needing `--host`. The `lastDeploy:` block stays empty for Git-driven targets — the host's dashboard is the truth.

---

## Vercel

Lifecycle: **Git-driven**. You connect your repo to Vercel; Vercel runs `npx uniweb build` in CI on each push and serves `dist/`. The CLI's `deploy` step never runs (the `vercel` adapter is intentionally postBuild-only).

### Recommended setup

```yaml
# site/deploy.yml
default: production
targets:
  production:
    host: vercel
```

Vercel handles directory-index resolution, asset caching, and SPA fallback natively — the framework has nothing to drop into `dist/`. The adapter exists so the artifact and the deploy manifest record what the user picked, and so the build's CI-context detection picks `vercel` automatically when `VERCEL=1`.

### Via Git Integration

1. Push your repo to GitHub/GitLab/Bitbucket
2. Import in [vercel.com/new](https://vercel.com/new)
3. Set root directory to `site`
4. Deploy

**Build settings (auto-detected):**
- Build Command: `pnpm build`  *or*  `npx uniweb build`
- Output Directory: `dist`
- Install Command: `pnpm install`

### Via Vercel CLI

```bash
cd site
npx vercel
```

Follow the prompts. Vercel auto-detects the Vite configuration.

### vercel.json (optional)

Most Vercel projects don't need one. Add it only when you need custom rewrites or headers:

```json
{
  "buildCommand": "cd .. && pnpm build",
  "outputDirectory": "dist"
}
```

The `vercel` adapter does **not** emit a `vercel.json` automatically. Hand-authored `vercel.json` files are left alone.

---

## Netlify

Lifecycle: **Git-driven**. Same shape as Vercel — Netlify connects to your repo, runs `npx uniweb build` on each push, serves `dist/`.

```yaml
# site/deploy.yml
default: production
targets:
  production:
    host: netlify
```

`netlify` is registered as an alias of `cloudflare-pages` because both consume the same `_redirects` format — one tested code path, two discoverable names. The deploy manifest still records `host: netlify` (what you picked), not the canonical implementation behind it. The build auto-detects `NETLIFY=true` and picks this adapter without needing `--host` in CI.

### Via Netlify CLI (one-off uploads)

```bash
cd site
npx netlify deploy --prod --dir=dist
```

### Via Git Integration

1. Push your repo to GitHub/GitLab/Bitbucket
2. Import in [app.netlify.com](https://app.netlify.com)
3. Configure:
   - Base directory: `site`
   - Build command: `pnpm build`
   - Publish directory: `site/dist`

### netlify.toml

```toml
[build]
  base = "site"
  command = "pnpm build"
  publish = "dist"
```

**With pre-rendering enabled (the default), no SPA-fallback redirect is needed.** Each route has a real HTML file at `<route>/index.html`, and `404.html` handles unknown paths. Adding `[[redirects]] from = "/*" to = "/index.html" status = 200` would convert legitimate 404s into false 200s pointing at the home page — don't do this.

For the rare case of a non-prerendered site (single `index.html`, client-side routing), add the SPA-fallback redirect:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

If the site declares `redirect:` or `rewrite:` directives in `page.yml`, the build emits a `_redirects` file that Netlify and Cloudflare Pages both consume — the same format works for either host.

---

## Cloudflare Pages

Lifecycle: **Git-driven** (typical) or one-off Wrangler uploads. CF Pages auto-resolves directory indexes, so no URI-rewrite worker is needed. The adapter's job is to emit `_redirects` from any `redirect:` / `rewrite:` directives in `page.yml`.

```yaml
# site/deploy.yml
default: production
targets:
  production:
    host: cloudflare-pages
```

The build auto-detects `CF_PAGES=1` and picks this adapter without needing `--host` in CI.

### Via Dashboard

1. Connect your repository
2. Configure:
   - Build command: `cd site && pnpm build`
   - Build output directory: `site/dist`

### Via Wrangler

```bash
cd site
npx wrangler pages deploy dist
```

---

## GitHub Pages

Lifecycle: **Git-driven** via GitHub Actions.

```yaml
# site/deploy.yml
default: github-pages
targets:
  github-pages:
    host: github-pages
    domain: mysite.com    # optional; omit for project-pages URL
```

The adapter emits `.nojekyll` at the dist root. **This is critical:** without it, GitHub Pages's Jekyll processing silently strips paths whose components start with `_` — including the `_pages/` per-route content shards and any other underscore-prefixed directory the build produces. The site appears to deploy successfully but with parts missing.

> **Step-by-step recipe:** [Deploying to GitHub Pages](../development/deploy-github-pages.md). The CLI scaffolds the workflow, the CNAME (when you pass `--domain`), and the `deploy.yml` entry above with one command:
>
> ```bash
> uniweb add ci                          # project pages: <user>.github.io/<repo>/
> uniweb add ci --domain mysite.com      # custom domain at root
> ```
>
> The generated workflow uses GitHub's official `actions/deploy-pages` flow (Settings → Pages → Source: GitHub Actions) and sets `UNIWEB_BASE` at build time so `site.yml` stays clean.

### Manual deploy (without the workflow)

If you'd rather not use a CI workflow, build locally and push to a branch yourself:

```bash
cd site
UNIWEB_BASE=/<repo>/ uniweb build --host=github-pages   # or UNIWEB_BASE=/ for a custom domain
npx gh-pages -d dist --dotfiles                          # --dotfiles preserves .nojekyll
```

The `--dotfiles` flag is required so `gh-pages` doesn't drop the `.nojekyll` file the adapter wrote. With Settings → Pages → Source set to "Deploy from a branch" → `gh-pages`, GitHub will serve the result. The CI flow is recommended over this for ongoing deploys, but manual is fine for one-off experiments.

---

## AWS S3 + CloudFront

Lifecycle: **CLI-push.** This is the only built-in adapter today that runs the upload step itself — `uniweb deploy` builds, syncs to S3, and invalidates CloudFront in one command.

> **First-time setup** (S3 bucket, CloudFront distribution, OAC, IAM user, directory-index Function, custom error responses) is documented in [AWS S3 + CloudFront — one-time setup](aws-s3-cloudfront-setup.md). Do that walkthrough once per site, then come back here for the per-deploy reference.

```yaml
# site/deploy.yml
default: production
targets:
  production:
    host: s3-cloudfront
    bucket: your-bucket-name
    distributionId: E1ABC...
    region: us-east-1
    profile: your-aws-profile         # optional — overrides default AWS credential chain
```

```bash
cd site && uniweb deploy
```

The adapter:

- Emits `dist/cloudfront-function.js` — the directory-index resolution rule (`/about` → `/about/index.html`), expressed in JS because that's how CloudFront accepts static routing config of this kind. **You attach it once** to your distribution's default cache behavior (viewer-request); subsequent deploys need nothing further. Without it, S3 REST endpoints return 404 for directory paths — the function isn't application logic or a redirect, just the static rule the host requires to resolve clean URLs to stored files.
- Emits `dist/.uniweb-deploy-manifest.json` — describes cache rules, invalidation patterns, and the foundation packaging shape (standalone or linked).
- Runs `aws s3 sync` for `dist/assets/` (immutable long cache) and `dist/` (short cache, with `--delete`).
- Runs `aws cloudfront create-invalidation` for HTML paths and the locale/page shards.

Requires the `aws` CLI on PATH and standard AWS credentials. Provisioning the bucket, the distribution, the ACM cert, and uploading the CloudFront Function are one-time steps you do yourself (or via your IaC of choice).

### Manual upload (without the adapter)

```bash
cd site
uniweb export
aws s3 sync dist/assets/ s3://your-bucket-name/assets/ \
  --cache-control "public, max-age=31536000, immutable" --delete
aws s3 sync dist/ s3://your-bucket-name/ \
  --exclude "assets/*" \
  --cache-control "public, max-age=60, must-revalidate" --delete
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/" "/*.html" "/*/index.html" "/sitemap.xml" "/robots.txt"
```

### CloudFront error responses

Configure CloudFront's custom error responses to map 404 → `/404.html` (status 404). The build always emits a `404.html` — generated automatically with a designed 404 page if you have `pages/404.md`, or a generic fallback if not.

Do **not** map 404 → `/index.html` with status 200. Pre-rendered Uniweb sites have real files at every known route; legitimate 404s should return a real 404, not silently render the home page.

---

## Docker / Self-Hosted

### Nginx

```dockerfile
FROM nginx:alpine
COPY site/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:

```bash
docker build -t my-site .
docker run -p 8080:80 my-site
```

### Node.js (Express)

```js
import express from 'express'
import { resolve } from 'path'

const app = express()
const dist = resolve('site/dist')

app.use(express.static(dist))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(resolve(dist, 'index.html'))
})

app.listen(3000)
```

---

## Environment Variables

For build-time configuration, use Vite's env variables:

```bash
# .env.production
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=UA-XXXXX
```

Access in code:

```js
const apiUrl = import.meta.env.VITE_API_URL
```

**Note:** Only variables prefixed with `VITE_` are exposed to the client.

---

## Build Optimization

### Analyze Bundle

```bash
cd site
pnpm build -- --analyze
```

### Compression

Most platforms handle compression automatically. For self-hosted:

```bash
# Pre-compress assets
gzip -k dist/assets/*.js
brotli dist/assets/*.js
```

Configure your server to serve `.gz` or `.br` files when available.

---

## Troubleshooting

### 404 on Page Refresh

**Problem:** Direct URL access returns 404 even though the site works after navigating from the home page.

**With pre-rendering enabled** (the recommended default), every known route has a real file at `<route>/index.html`. If a known route returns 404, the host probably isn't auto-resolving directory indexes. On hosts that don't (S3 REST + CloudFront with OAC, plain object stores), use `uniweb deploy --host=s3-cloudfront` so the adapter ships a viewer-request URI rewrite, or configure the equivalent rewrite manually.

**Without pre-rendering** (single `index.html`, client-side routing), configure SPA fallback — the host serves `index.html` for unknown routes. This is the only case where SPA fallback is correct; **don't** enable it on a pre-rendered site or legitimate 404s become false 200s.

### Missing Assets

**Problem:** JS/CSS files not loading.

**Solution:** Check the `base` path in `vite.config.js` matches your deployment path.

### Slow Initial Load

**Problem:** Large JavaScript bundle.

**Solution:**
1. Enable pre-rendering for static HTML
2. Check bundle size with `--analyze`
3. Lazy-load heavy components

---

## Publishing to Uniweb hosting

Go live on Uniweb hosting with a single command:

```bash
uniweb login         # first time only
uniweb publish       # brings the foundation along, syncs content, goes live
```

`uniweb publish` resolves which site, brings its foundation along (releasing the site's local foundation to the catalog under your `@org` when its code changed), syncs the content, and makes the site live. When going live needs payment (a first go-live, or a change that adds a paid feature), it opens a browser to settle it; an already-paid site just goes live.

Uniweb hosting serves the foundation as a separate file the runtime loads at startup, with version propagation moving updates forward on already-published sites without republishing. Foundations on Uniweb hosting are always **cataloged** (`@org/name@version`) — served from the catalog's CDN, licensed to the sites that use them. Whether you let `uniweb publish` release the foundation for you (single-site) or registered it deliberately with `uniweb register` (a multi-site product), it gets the same edge serving: JIT prerender, locale routing, Tier 0–3 caching, version propagation.

See [Deploying → How a foundation reaches the catalog](../development/deploying.md#how-a-foundation-reaches-the-catalog) for the full picture.

Uniweb hosting requires authentication — run `uniweb login` first.

For the full developer-to-client workflow (registering foundations, creating invites, handing off sites), see [Publishing and Clients](../development/publishing-and-clients.md).

---

## Registering a foundation to the registry

Foundations are runtime federated modules — **not npm packages.** They're not libraries for developers to import; they're vocabularies of section types that content authors compose sites from. The framework has no `npm publish` path for foundations and the catalog is not on npm.

The Uniweb catalog is a private, access-segregated inventory of commercial foundation products. You see only the foundations you own or are a registered editor of; clients see only the foundations licensed to their sites. Foundations are typically built by developers and agencies for paying clients; clients receive a license to use the foundation on a specific site, and that license rides with site ownership when sites are transferred.

To register a foundation as a catalog product (so it can be licensed across multiple sites, and propagation can move sites forward without redeploying):

```bash
cd foundation         # the foundation's directory
uniweb login          # first time only
uniweb register --scope @your-org
```

Catalog registrations require an `@org` scope. A foundation that exists for one specific site doesn't need a deliberate `uniweb register` step — `uniweb publish` brings it along, releasing it to the catalog under your `@org` automatically when its code changed. Reach for `uniweb register` directly when the foundation is a product meant for multiple sites, or when you want to register it on its own schedule independent of any one site's go-live.

Sites control their foundation update policy in `site.yml`:

```yaml
foundation:
  ref: '@your-org/foundation-name@1.4.7'
  policy: auto-minor    # exact | auto-patch | auto-minor
```

See [CLI Commands](./cli-commands.md) and [Deploying](../development/deploying.md) for the full register + propagation surface.

---

## See Also

- [CLI Commands](./cli-commands.md) — Build and deploy command options
- [Site Configuration](./site-configuration.md) — Pre-render settings
- [Templates](./templates.md) — Project templates
- [Publishing and Clients](../development/publishing-and-clients.md) — Full developer-to-client workflow
