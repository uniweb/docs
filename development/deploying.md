# Deploying

A Uniweb project produces two artifacts, not one. Understanding why is the shortcut to understanding every deployment option Uniweb supports — including the ones other frameworks don't.

> **In a hurry?** Free static hosts (Vercel, Netlify, Cloudflare Pages, GitHub Pages) work great for "I have a site, I want to publish it." See [Picking a deploy path](#picking-a-deploy-path) below to decide.

---

## Two artifacts

A Uniweb project is a workspace with two kinds of packages:

- **A site** — pure content. From the author's point of view, it's markdown pages, theme settings, locales, and configuration. The site folder also contains a small bootstrap file (`site/entry.js`) that the CLI scaffolds once and the author never edits — its only job is to hand content to the runtime so `pnpm dev` can render the site for visual testing.
- **A foundation** — pure code. React components, layouts, theme variable declarations, content handlers, styles. This is a developer's product: a vocabulary of section types that content authors compose sites from.

Two artifacts, two verbs:

- **`uniweb publish`** sends a foundation to a registry.
- **`uniweb deploy`** sends a site to a host.

These are independent operations. They can run on different schedules, by different people, against different destinations. The CLI can blend them when convenient (`uniweb deploy` will auto-publish a workspace foundation that hasn't been published yet), but the framework treats them as distinct concepts and so should you when reasoning about a deployment.

---

## Don't pattern-match on Next.js

Most JavaScript frameworks (Next.js, Remix, Astro, Gatsby, SvelteKit) couple a site and its code into a single deployable unit. You build the app; the build emits HTML and JavaScript; the bundle *is* the site. There is no separate "library of components" that other sites can reuse without forking the repo.

Uniweb supports that mode — we call it **standalone mode**, and it's a perfectly good choice for a single site with a single team. But Uniweb also supports a second mode, **linked mode**, in which the foundation lives at one URL and any number of sites load it from there at runtime. The site bundle is small (just the runtime, content, and theme); the foundation arrives separately on first page load.

The reason this exists:

- **One foundation, many sites.** A marketing foundation built once, used by `acme.com`, `acme.fr`, and `acme.de`, each with its own content team, its own theme overrides, and its own deploy cadence.
- **Content authors and component developers don't share a release cycle.** Authors push content changes without touching code. Developers push foundation changes without coordinating with every site that uses them.
- **Foundations as products.** A design studio publishes a portable foundation; clients adopt it. The foundation is the product; the clients' sites are the deliverables.

Once you stop assuming the site and its code have to ship together, deployment options open up that the standalone model can't express.

---

## Standalone vs linked

A site picks its mode in `site.yml`. The framework auto-detects from the shape of the `foundation:` field — there is no `mode:` switch.

### Standalone mode

The foundation source is bundled into the site at build time, the way any Vite app bundles its imports. One artifact, one deploy.

```
site/dist/
├── index.html
├── assets/
│   ├── index-[hash].js     ← site + foundation, together
│   └── index-[hash].css
└── ...
```

You get standalone mode when the `foundation:` declaration resolves to a workspace-local source. Two equally valid patterns:

```yaml
# site/site.yml — bare workspace name
foundation: src
```

```yaml
# site/site.yml — canonical scoped name
foundation: '@your-org/marketing'
```

The second form is the natural pattern when the foundation has a stable identity it would carry into the catalog if/when published. Pair it with a `file:` dep in the site's `package.json` so the framework knows where to find the local source:

```json
{
  "dependencies": {
    "@your-org/marketing": "file:../foundations/marketing"
  }
}
```

The site references the foundation by its canonical name; the package.json maps that name to the on-disk location. When you later publish the foundation to the catalog as `@your-org/marketing@0.1.2`, only the package.json (or the `site.yml` line — adding a version pin) needs to change. The canonical name in `site.yml` stays put.

**When to use standalone.** A single site, a single foundation, a single team. You want a self-contained static bundle you can hand to any host. You don't need a visual editor for content authors ([Uniweb App](https://uniweb.app)).

### Linked mode

The foundation is a separate file the site loads at runtime. The site bundle carries content, theme, and the runtime JS; the foundation arrives as its own ES module, dynamically linked into the runtime on first page load.

```
                   ┌─────────────────────────────────────┐
                   │  foundation                          │
                   │  ─────────                           │
                   │  https://<host>/                     │
                   │    .../<name>/<version>/             │
                   │      entry.js                        │
                   └─────────────────────────────────────┘
                              ▲             ▲
                              │             │
                  ┌───────────┘             └───────────┐
                  │                                      │
       ┌──────────────────┐                  ┌──────────────────┐
       │  acme.com (site) │                  │  acme.fr (site)  │
       │  content + theme │                  │  content + theme │
       └──────────────────┘                  └──────────────────┘
```

The browser fetches `entry.js` once and caches it. React, the JSX runtime, and `@uniweb/core` are resolved through a `<script type="importmap">` the site emits, so the foundation borrows the site's copy of those instead of shipping its own — no duplicate React, single component identity.

**A foundation is not a library.** It has no programmatic API for other developers to consume. It is not published to public code registries. Its audience is licensed content authors, who compose sites by writing `type: Hero` in markdown frontmatter — not developers calling `import { Hero }`. What linked mode delivers is a *dynamically linked module*: an ES module addressed by URL and dynamically linked to a runtime. That is a deployment shape, not a developer-facing API.

**When to use it.** More than one site might share the foundation, or foundation and sites have different release cadences, or you want to offer a visual editor to content authors via the [Uniweb App](https://uniweb.app). Even a single-site project benefits from linked mode when you want foundation/runtime updates to reach the live site without redeploying — that's how Uniweb hosting works for every site, regardless of how many sites use the foundation.

#### Two flavours of linked: site-bound vs cataloged

Within linked mode, there are two flavours, distinguished by *who owns the foundation* and *where the file is served from*:

**Site-bound.** The foundation belongs to one specific site. The developer authors it as a sibling of the site in the same workspace, and `uniweb deploy` builds and uploads everything together — site assets and the foundation, in one step. The foundation file is served from the site's own origin, alongside its other assets:

```yaml
# site.yml
foundation: ~self/io@0.1.2
```

The `~self/<name>@<version>` shape signals "this site brings its own foundation" — the platform stores it with the site's other published assets and serves it at, for example:

```
https://www.uniweb.io/_module/io/0.1.2/entry.js
```

[uniweb.io](https://www.uniweb.io/) ships exactly this way. One repo, one workflow: `uniweb deploy` from the site's directory and the foundation rides along. No `uniweb publish` step, no separate identity in the catalog.

**Cataloged.** The foundation is a deliberate product, published once and licensed to one or more sites. The developer publishes it via `uniweb publish @org/name@ver`; consuming sites pin it by name and version:

```yaml
# site.yml
foundation: '@uniweb/proximify@0.1.6'
```

The browser fetches the foundation from the registry's CDN. [proximify.com](https://www.proximify.com/) ships this way — its foundation is a catalog product that the site's owner is licensed to use.

The catalog is **not a public package registry.** It's a private, access-segregated inventory of commercial foundation products. You only see the foundations you own or are a registered editor of. Foundations are usually built by developers and agencies for paying clients; clients get a license to use a foundation on a site. Site ownership can be transferred (developer creates the site for a client, hands it off); the license rides with the site. That model is what the catalog is built for.

**Same runtime treatment, either flavour.** On Uniweb hosting, both flavours get the same edge serving: JIT prerender, locale-aware routing, Tier 0–3 caching with TTLs for dynamic pages, and version propagation — both runtime and foundation versions can move forward on a deployed site without republishing, gated by the site's update policy. The flavour you pick is a workflow + ownership decision, not a runtime tier.

| | Site-bound | Cataloged |
|---|---|---|
| `site.yml` | `foundation: ~self/<name>@<version>` | `foundation: '@<org>/<name>@<version>'` |
| Where the foundation is served from | The site's own origin (`mysite.com/_module/<name>/<version>/entry.js`) | The catalog's CDN |
| Workflow | `uniweb deploy` builds and uploads everything together | `uniweb publish` (separate, deliberate) → consuming sites pin and deploy |
| Multi-site shareable | No — this foundation is bound to this site | Yes — license-gated, across whichever sites the foundation owner grants access |
| Discoverable | n/a — it's not a separate object | Yes, to users with access (via licensing or editor grant) |
| Propagation | Yes — version updates flow without site republishing | Yes — across every licensed site whose policy permits the version jump |
| Live example | [uniweb.io](https://www.uniweb.io/) | [proximify.com](https://www.proximify.com/) |

You don't have to commit upfront. A foundation that started as site-bound can later become cataloged when a second site wants to use it; the move is a deliberate `uniweb publish` and a one-line edit in each consuming site's `site.yml`.

#### Linked from a third-party host

You can also use linked mode against a foundation URL of your own. Any host that serves files over HTTPS can serve a foundation: GitHub Pages, S3+CloudFront, Cloudflare R2, your own CDN. The site's `foundation:` field accepts any URL:

```yaml
foundation: 'https://cdn.example.com/foundation/1.4.7/entry.js'
```

Object form with policy metadata also works:

```yaml
foundation:
  ref: '@acme/marketing@1.4.7'
  policy: auto-minor
```

You give up the platform's propagation and licensing machinery; you keep linked mode's runtime properties (no duplicate React, foundation cached separately from site, no rebuild when the foundation changes if the URL is stable across a content-only update).

> **Standalone vs linked is about deployment, not foundation design.** A separate axis — whether a foundation hardcodes its data and theme or parameterizes them — is covered in [Foundation Categories](./foundation-categories.md). A foundation can be portable (parameterized) and standalone, or domain-specific and linked. The two choices compose independently.

---

## One foundation, many sites — even in the same workspace

You don't need linked mode to reuse a foundation across sites. The simplest case is a workspace where one foundation in `src/` already serves the default `site/`, and you add a second site as a sibling that shares the same `src/`:

```
my-project/
├── src/                   ← one foundation
├── site/                  ← original site
├── marketing/             ← second site, same foundation, different content + theme
├── pnpm-workspace.yaml
└── package.json
```

```bash
uniweb add site marketing --foundation src
```

The new site is just another sibling at the workspace root — no extra nesting. Both sites import from `src` via a `file:` dependency. They have different `pages/`, different `theme.yml`, and different `params:` in their frontmatter — so the same `Hero` component renders one way for the marketing site and another way for the docs site without any code duplication. Compose the same foundation differently in each site by:

- **Different content** — each site has its own markdown.
- **Different theme** — each `theme.yml` sets its own colors, type scale, spacing tokens.
- **Different params** — frontmatter chooses layouts, variants, and component options per page.
- **Different sections wired in** — each site picks which section types it uses; nothing forces both sites to use every component the foundation exports.

When you're ready to scale further — multiple foundations, segregated layouts, co-located projects (each with its own foundation+site pair), extensions that add specialized section types — the same workspace primitives compose. See [Project Structures](./project-structures.md) for the full menu of layouts, including when to use each.

The deployment story doesn't change between layouts. Each site in the workspace deploys independently with `uniweb deploy`. For workspace-local foundations, `uniweb deploy` auto-publishes the foundation **site-bound** — uploaded with the site's other published assets, never to the catalog. You don't run `uniweb publish` separately unless the foundation is a deliberate catalog product (a foundation you want to share across sites or expose in the Uniweb App's catalog).

---

## Three verbs, three intents

Each command does one thing. Pick by what you're trying to ship:

| | What it sends | Where it goes |
|---|---|---|
| `uniweb deploy` | Built site + (if local) site-bound foundation | Uniweb hosting (default), or any static host via `--host=<adapter>` |
| `uniweb export` | Self-contained `dist/` for any static host | Your filesystem; you upload manually |
| `uniweb publish` | Built foundation as a catalog product | Uniweb registry, named, versioned, discoverable |

The common case is just `uniweb deploy`:

```bash
cd site && uniweb deploy        # site + workspace-local foundation, all-in-one
```

For a third-party static host, `uniweb deploy --host=<adapter>` builds and uploads in one step. Built-in adapters: `cloudflare-pages`, `github-pages`, `s3-cloudfront`, `generic-static`. Or use `uniweb export` to produce `dist/` for manual upload to any host:

```bash
cd site && uniweb deploy --host=cloudflare-pages   # build + upload
cd site && uniweb export                            # build only; you upload
```

For cataloging a foundation as a product (other sites can pin to its versions):

```bash
cd src && uniweb publish @your-org/foundation-name
```

`uniweb publish` requires a deliberate `@org/name` namespace. Site-bound foundations don't use this command — they're auto-published by `uniweb deploy` and stored alongside the site's own assets, never reaching the catalog. No naming ceremony, no catalog visibility, no cross-site exposure. If a foundation only powers one site, that's the right model; reach for `uniweb publish` only when you mean to ship the foundation as a product across multiple sites.

---

## Picking a deploy path

The framework has no preferred host. The right choice depends on what you're trying to ship.

| | Uniweb hosting | Free static hosts (Vercel, CF Pages, Netlify, GH Pages) | AWS S3 + CloudFront |
|---|---|---|---|
| **Cost** | Paid — starts at $14/month per site | Free for typical sites; paid tiers for high traffic | Pay-as-you-go AWS |
| **Best for** | Foundation developers and agencies whose clients are non-technical content authors | Developers shipping their own site to a known audience | Teams already on AWS, custom origin requirements |
| **Lifecycle** | `uniweb deploy` (CLI-push) | Push to GitHub, host runs the build (Git-driven) | `uniweb deploy --host=s3-cloudfront` (CLI-push) |
| **Foundation mode** | **Linked** (site-bound or cataloged — see below) | **Standalone** is the natural choice; **linked** also works against any URL | Same as free static hosts |
| **Foundation/runtime updates without site rebuild** | Yes — propagation gated by site update policy | Site rebuild on each foundation change (no propagation) | Same as free static hosts |
| **Visual editor for content authors** | Yes — [Uniweb App](https://uniweb.app) (web + desktop) | No | No |
| **Multi-site CMS** | Yes — content authors manage sites independently of the developer | No — each site is a static deploy | No |
| **JIT prerender + edge SSR** | Yes | No (host runs the build, then serves files) | No |

> **Uniweb hosting serves linked sites today**, both site-bound and cataloged flavours. Standalone-mode hosting on the Uniweb edge isn't built — for a fully self-contained bundle with no runtime dependency on a foundation URL, use a free static host.

### Why uniweb hosting starts at a price

Uniweb hosting is not a cheaper Vercel — it's a different product. It exists to support a specific shape of team:

- **A developer or agency builds a foundation** (one or several, for different clients).
- **Clients (non-technical authors) compose their sites** through the Uniweb App's visual editor, web or desktop.
- **The web app is also a CMS** that holds live content with a life independent of any one site — content can be reshaped, re-themed, and re-published without touching the foundation.
- **Site licensing and ownership transfer.** A developer creates a site, assigns it a foundation, and hands the site over to a client. The client gets a CMS for their content but doesn't see the developer's other foundations or other clients' sites — the catalog is access-segregated. The site carries the license to use the foundation; transferring site ownership transfers the right to use whichever foundation the site is configured with.
- **Foundation updates propagate** through the registry to licensed sites whose update policy permits the version jump — bug fixes and new section types reach every client without anyone redeploying.

That ecosystem is what costs money to operate (edge SSR, JIT prerender, multi-tenant CMS, propagation gates, the licensed catalog). It's also what most "static hosting" doesn't offer at any price.

If you don't need that — if you're building one site for one team and you'll deploy it yourself — a free static host is the right call. The framework was designed so neither choice is a trap. The same code base runs on both. Move from one to the other by changing one line in `deploy.yml`.

### Why free static hosts work well

Free static hosts (Vercel, Cloudflare Pages, Netlify, GitHub Pages) are excellent at "I have a site, I want to publish it." They:

- Connect to GitHub and auto-deploy on each push (Git-driven).
- Serve files from a global CDN with sensible defaults (directory-index resolution, asset caching, SPA fallback).
- Charge nothing for typical site traffic.
- Offer their own preview-deploy, custom-domain, and analytics features.

They don't try to be a CMS. They don't have a visual editor for content authors. They don't propagate foundation updates across sites. They serve files — and that's exactly what most one-team-one-site projects need.

In Uniweb terms, free static hosts pair naturally with **standalone mode**: the foundation is bundled into the site's `dist/` and the host serves the result. **Linked mode** also works against any HTTPS URL the host can reach — your own CDN, GitHub Pages, or even the Uniweb catalog if you have a license to a cataloged foundation. You give up the platform's propagation and CMS features; you keep linked mode's runtime properties.

---

## Practical: deploying with the Uniweb platform

The shortest path. Uniweb provides:

- A **catalog** for foundation products — private, access-segregated, organized under organization namespaces (`@org/name`) you own or belong to. The catalog is for foundations you intend to license across multiple sites; it's not a public package registry.
- A **hosting platform** that serves linked sites with edge JIT prerender, locale-aware routing, and version propagation that moves foundation and runtime versions forward on already-deployed sites without redeploying.

The two flavours of linked mode (site-bound and cataloged) follow different commands:

**Site-bound foundation — single site, one deploy:**

```bash
# In the workspace root
uniweb login                # one-time

# In the site's directory
cd sites/uniweb-io
uniweb deploy               # builds and uploads site + foundation together
```

The site's `site.yml` declares `foundation: ~self/<name>@<version>`; the foundation source lives next to the site in the workspace; `uniweb deploy` builds it and uploads alongside the site's assets. The browser fetches the foundation from the site's own origin (`mysite.com/_module/<name>/<version>/entry.js`).

**Cataloged foundation — separate publish, then license-by-site:**

```bash
# In the workspace root
uniweb login

# In the foundation's directory
cd foundations/proximify
uniweb publish              # publishes @uniweb/proximify@0.1.6 to the catalog

# In the site's directory (now or later, possibly by a different person)
cd ../../sites/proximify-com
uniweb deploy               # site references the published foundation by name
```

The site's `site.yml` declares `foundation: '@<org>/<name>@<version>'`. Sites licensed to use the foundation pin the version in their `site.yml`; the platform serves the foundation from the catalog's CDN.

`uniweb deploy` opens a browser on the very first deploy of a new site to confirm the site name, plan, and (if the site uses paid features such as a custom domain) payment. Subsequent deploys are silent.

The end-to-end first run looks like this:

```bash
uniweb create acme-com
cd acme-com
pnpm install            # one-time dependency install
uniweb deploy
```

The CLI handles login (prompting if needed), foundation publishing, site creation, and deployment in a single flow. Site hosting on a custom domain isn't free, so the first deploy that activates billing opens a browser to set up payment.

### Foundation propagation

When you publish a new foundation version, sites that already use it don't move automatically by default. The default classification is *silent*: the version is stored, sites that pin it exactly can resolve to it, but earlier-version sites don't move. To opt a release into propagation:

```bash
uniweb publish --propagate
```

Sites that aren't pinned and whose foundation update policy permits the version jump pick up the new version through a gated rollout — canary first, then a small percentage, then the full population, with health gates between waves. The site's foundation version moves forward on the platform without redeploying the site.

A site can declare its update policy in `site.yml`:

```yaml
# site/site.yml — string form (default policy)
foundation: '@acme/marketing@1.4.7'

# site/site.yml — object form with explicit policy
foundation:
  ref: '@acme/marketing@1.4.7'
  policy: auto-minor   # exact | auto-patch | auto-minor
  pinned: false
```

A foundation can also declare its own policy intent in `package.json::uniweb.runtimePolicy`, which controls how the runtime version moves forward independently of the foundation version. See [CLI Commands → uniweb publish](../reference/cli-commands.md#uniweb-publish) for the full propagation surface.

This is one of the things you give up when you don't deploy to the Uniweb platform: propagation is a property of the registry+hosting combination, not of the framework. On a generic static host, sites move forward only when you redeploy them.

---

## Practical: deploying somewhere else

The Uniweb registry and hosting are conveniences, not requirements. The framework doesn't lock you to either. You can:

- Publish a foundation to any HTTPS URL, and consume it from any site.
- Deploy a site to any static host (standalone or linked).
- Mix providers — host the foundation in one place, the site in another.

### Site to a static host with a built-in adapter

The framework ships adapters that know each host's quirks (directory-index resolution, redirect helpers, cache headers) and emit the right helper files into `dist/`. Some adapters also run the upload + invalidation step (`s3-cloudfront`); others run in **Git-driven** mode where the host runs the build itself (`vercel`, `cloudflare-pages`, `netlify`, `github-pages`).

Configure the destination in `deploy.yml`, a sibling of `site.yml`:

```yaml
# site/deploy.yml — safe to commit
default: production
targets:
  production:
    host: cloudflare-pages   # or vercel, netlify, github-pages, s3-cloudfront, generic-static, uniweb
```

Then deploy:

```bash
cd site && uniweb deploy
```

`--host=<adapter>` on the command line overrides the resolved target's host for one-off experiments (no save). `--target=<name>` selects a non-default target.

Built-in adapters:

| Adapter | Lifecycle | What the adapter handles |
|---|---|---|
| `vercel` | Git-driven | No helper files needed (Vercel handles directory-index + caching natively). The build's CI-context detection picks this automatically when `VERCEL=1`. |
| `cloudflare-pages` | Git-driven | Emits `_redirects` for `redirect:` / `rewrite:` directives. Auto-detected when `CF_PAGES=1`. |
| `netlify` | Git-driven | Alias of `cloudflare-pages` (same `_redirects` format). The deploy manifest still records `host: netlify`. Auto-detected when `NETLIFY=true`. |
| `github-pages` | Git-driven (Actions) | Emits `.nojekyll` so directories starting with `_` aren't silently stripped. |
| `s3-cloudfront` | CLI-push | Emits a CloudFront Function (URI rewrite for directory-index) plus a deploy manifest. Runs `aws s3 sync` and `aws cloudfront create-invalidation` — requires the `aws` CLI on PATH and standard AWS credentials. Configure `bucket`, `distributionId`, `region` under the target. |
| `generic-static` | — | No host-specific output. Use when the host needs nothing extra. |

For hosts not in the built-in list, use `uniweb export` to produce `dist/` and upload manually:

```bash
cd site
uniweb export
# Output: site/dist/

# Then upload with the host's own tooling, e.g.:
vercel --prod                              # Vercel
aws s3 sync dist/ s3://your-bucket --delete  # plain S3 (no CloudFront)
```

The artifact is self-contained; the host doesn't need to know anything about Uniweb. See [Static hosting](../reference/deployment.md) for per-host notes on subdirectory base paths, SPA fallback for unknown routes, and other rare cases.

### CI-context auto-detection

When `uniweb build` runs in a CI environment owned by a known static host, the build reads the host's well-known env vars and picks the matching adapter automatically. No `--host` flag is needed when the CI host *is* the deploy target:

| Detected env | Adapter selected | Branch / SHA / URL captured |
|---|---|---|
| `VERCEL=1` | `vercel` | `VERCEL_GIT_COMMIT_REF`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_URL`, `VERCEL_ENV` |
| `CF_PAGES=1` | `cloudflare-pages` | `CF_PAGES_BRANCH`, `CF_PAGES_COMMIT_SHA`, `CF_PAGES_URL` |
| `NETLIFY=true` | `netlify` | `BRANCH`, `COMMIT_REF`, `DEPLOY_PRIME_URL`, `CONTEXT` |
| `GITHUB_ACTIONS=true` | (none — see below) | `GITHUB_REF_NAME`, `GITHUB_SHA` |

GitHub Actions is treated as a runner, not a host. A GHA workflow can deploy anywhere — the framework records the runner metadata but won't default `--host` from `GITHUB_ACTIONS=true`. If your GHA workflow is deploying to GitHub Pages, set `host: github-pages` in `deploy.yml` (or pass `--host=github-pages` to the build step).

Provenance from the detected context is recorded into the deploy manifest (e.g., `dist/.uniweb-deploy-manifest.json` for `s3-cloudfront`) so the on-disk artifact is honest about where it was built.

### Foundation on GitHub Pages

A foundation builds to a directory; GitHub Pages serves directories. Pair them with a CI workflow.

The unipress project does exactly this. Its open-source foundations build and publish on every push to `main`, ending up at:

```
https://uniweb.github.io/unipress/foundations/<name>/<version>/entry.js
```

A consuming site references the foundation by URL:

```yaml
# site/site.yml
foundation: https://uniweb.github.io/your-org/your-repo/foundations/marketing/1.4.7/entry.js
```

The pattern any CI workflow needs to follow:

```yaml
# .github/workflows/deploy-foundation.yml
name: Deploy Foundation

on:
  push:
    branches: [main]

permissions:
  contents: write   # writes to gh-pages

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }

      - run: pnpm install
      - run: pnpm --filter src build

      - name: Stage under foundations/<name>/<version>/
        shell: bash
        run: |
          version=$(jq -r '.version' src/package.json)
          mkdir -p _staging/foundations/marketing/$version
          cp -R src/dist/. _staging/foundations/marketing/$version/

      - name: Publish to gh-pages
        # Layer staging onto the gh-pages branch and push.
        # See unipress's .github/workflows/deploy-foundations.yml for a complete working example.
```

A few things worth knowing:

- **Versions accumulate at stable URLs forever.** Every previous version stays reachable; sites pinning an older URL keep working.
- **Pinning is the URL itself.** Sites move forward by editing the URL in `site.yml`, not through a registry-driven propagation walk.
- **Add a `.nojekyll` marker** to the gh-pages branch root. Without it, GitHub Pages's Jekyll processing silently 404s any file or directory starting with an underscore — including the foundation's generated entry chunks.

The trade-off versus the Uniweb registry: no automatic propagation, no gated rollout, no per-site trust grants. You get permanent stable URLs and a free CDN; you give up coordinated rollouts.

### Foundation anywhere else

A foundation is a static directory of files. Anywhere that serves static directories over HTTPS works:

- Cloudflare R2 or S3 + CloudFront with a custom domain.
- A self-hosted nginx or Caddy server.
- An npm package whose `dist/entry.js` you reference via `https://unpkg.com/...` (the URL is the contract; how the file got there isn't).

The site doesn't care where the foundation lives — it follows the URL.

### Combining hosts

The two destinations don't have to be the same provider. Realistic combinations:

| Foundation | Site | Notes |
|---|---|---|
| Uniweb registry | Uniweb hosting | Easiest. Propagation, gated rollouts, edge SSR. |
| Uniweb registry | Vercel / Netlify / GH Pages | Linked mode against the registry URL; the site is a generic static deploy. No platform-driven propagation, but the foundation URL's version is fixed in the site's `site.yml`. |
| GH Pages / S3 / etc. | Vercel / Netlify / GH Pages | Fully self-hosted. No platform dependencies. Move forward by editing the foundation URL in `site.yml` and redeploying. |
| (none — standalone) | Anywhere static | Standalone mode. Foundation source is in the site bundle. |

Uniweb hosting is currently optimized for foundations served from the Uniweb registry — that's the path the propagation system and edge SSR are built around. Sites hosted on Uniweb but pointing at an external foundation URL fall outside the propagation system. Sites hosted elsewhere can point anywhere.

---

## Publishing and deploying are different concepts

A foundation is **published**. A site is **deployed**. They answer different questions:

| Question | Answer |
|---|---|
| Where does this code live so other sites can use it? | A registry, or any HTTPS URL. `uniweb publish` writes here. |
| Where does this site live so visitors can read it? | A host — Uniweb hosting, or any static host. `uniweb deploy` writes here. |

In standalone mode, the two collapse — the site bundle contains the foundation's code, so deploying the site is the only step. There is no separate "where does the foundation live?" because the answer is "inside the site."

In linked mode, the two are explicit and ordered. Publish the foundation first; deploy the site that references it. They can run on different schedules, in different repos, by different people. A foundation can serve sites on multiple hosts at once. A site can switch foundations without changing where it's hosted. A team can update the foundation without touching any site, and have the change reach existing sites through propagation (on the Uniweb platform) or through a one-line edit in `site.yml` (everywhere else).

The CLI lets you blend the two when convenient — `uniweb deploy` will auto-publish a workspace foundation site-bound when it hasn't been deployed yet — but it does not erase the distinction. The framework knows about both verbs, in both orders, against both kinds of destinations. That awareness is what lets you start with the standalone-mode default and grow into linked mode without restructuring the project, or run a foundation as a product across many sites without funneling everything through one repo.

You don't have to pick upfront. Most projects start standalone — that's what `pnpm create uniweb` produces — and many stay standalone forever. The ones that need to share a foundation, or want propagation, get linked mode by changing one line in `site.yml`. The build, the runtime, and the CLI already know how to handle both.

---

## See also

- **[Building with Uniweb](./building-with-uniweb.md)** — The two-package model and how content connects to components.
- **[Project Structures](./project-structures.md)** — Workspace layouts: single, segregated, co-located, extensions.
- **[Foundation Categories](./foundation-categories.md)** — Bundled vs portable on the foundation-design axis (orthogonal to standalone vs linked deployment).
- **[Publishing and Clients](./publishing-and-clients.md)** — Invite and handoff workflows for getting a site into a content author's hands.
- **[CLI Commands](../reference/cli-commands.md)** — Full reference for `uniweb publish`, `uniweb deploy`, runtime policy, and propagation flags.
- **[Static Hosting](../reference/deployment.md)** — Per-host recipes for Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3, and self-hosted servers.
