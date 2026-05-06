# Deploying

A Uniweb project's deployment shape depends on **who manages the content**. That single question decides where the site lives, what gets deployed, which commands you run, and how collaboration works.

> **In a hurry?** Three commands and your site is live on GitHub Pages with a custom domain — see **[Path 1](#path-1--you-manage-the-content)** below. If you're building a foundation for clients who manage their own content, jump to **[Path 2](#path-2--you-ship-a-foundation-as-a-product)**.

Two paths today:

- **Path 1: You manage the content.** You (or your dev team) write the markdown. Deploy site + foundation together — to GitHub Pages, Cloudflare Pages, Netlify, Vercel, S3 + CloudFront, or Uniweb's paid hosting if you need dynamic-page prerender or version propagation.
- **Path 2: Someone else manages the content.** You publish a foundation; sites built on it are composed by content authors in the Uniweb apps. The repo's `site/` is a test harness, not a deploy target.

A third path is on the **[roadmap](#roadmap--hybrid)** — markdown in git syncing two-way with apps content — but it's not available today.

The same framework powers both paths. The difference is the deployment artifact and who owns the content lifecycle.

---

## Path 1 — You manage the content

You write the markdown, configure the theme, and ship the result. Deploy site and foundation together. Many projects stay here forever.

Five sub-options under this path. They differ in *who builds*, *who uploads*, and *what extras you get*:

| | Builds | Uploads | When to use |
|---|---|---|---|
| **GitHub Pages via `uniweb add ci`** | The host (GH Actions) | The host | Free, one-line scaffold for an Actions workflow |
| **CF Pages, Netlify, Vercel** | The host | The host | Same outcome, dashboard connect instead of a workflow file |
| **CLI-push (`uniweb deploy --host=<adapter>`)** | Your machine | Your machine | One-shot deploy from CLI; required for S3 + CloudFront |
| **Manual export (`uniweb export`)** | Your machine | You, by hand | Any host the framework doesn't have an adapter for |
| **Uniweb hosting (`uniweb deploy`)** | Your machine | The platform | Dynamic-page prerender, version propagation, edge SSR — paid; see [When to choose Uniweb hosting](#when-to-choose-uniweb-hosting) |

### The 3-line recipe — GitHub Pages

```bash
npm create uniweb my-site
cd my-site
uniweb add ci --host=github-pages
# Commit, push to GitHub, enable Pages in repo settings → live site
```

Enable Pages on the repo at *Settings → Pages → Source: "GitHub Actions"*. Every push runs `uniweb build` and publishes the result. Pre-rendering is on by default — your site loads as static HTML, fast first paint, SEO out of the box.

`uniweb add ci` scaffolds a GitHub Actions workflow and host-specific helper files (e.g., `.nojekyll` to keep GH Pages from stripping `_`-prefixed directories like `_pages/`).

**Custom domain.** Add a `CNAME` file at the site's root with your domain (e.g., `mysite.com`), or pass `--domain=<host>` to `uniweb add ci`, which writes the `CNAME` and switches `UNIWEB_BASE` to root for you. GitHub Pages serves custom domains over HTTPS for free.

**Collaboration.** Branches, PRs, reviewers, comments — same as any code project. Treat the site like code: review changes before they ship.

### Other free static hosts — Cloudflare Pages, Netlify, Vercel

These hosts auto-detect Uniweb projects and run the build themselves when you connect the repo through their dashboard. No scaffolded workflow file. The framework reads the host's environment variables and emits the right helper files automatically.

**Setup.** Push your project to a GitHub/GitLab/Bitbucket repo. In the host's dashboard, click *New project → Import from Git* → pick the repo. The host detects the build command (`pnpm build`) and the output directory (`dist/`) automatically.

**CI auto-detection.** When `uniweb build` runs in a known CI environment, the build picks the matching adapter automatically:

| Detected env | Adapter | Notes |
|---|---|---|
| `CF_PAGES=1` | `cloudflare-pages` | Emits `_redirects` for `redirect:` / `rewrite:` directives |
| `NETLIFY=true` | `netlify` | Alias of `cloudflare-pages` — same `_redirects` format |
| `VERCEL=1` | `vercel` | No helper files (Vercel handles directory-index + caching natively) |
| `GITHUB_ACTIONS=true` | (none — see below) | GHA is a runner, not a host |

GitHub Actions is treated as a *runner*, not a host: a GHA workflow can deploy anywhere — to GH Pages, to S3, to Uniweb. The framework records the runner metadata but won't default `--host` from `GITHUB_ACTIONS=true`. For GH Pages specifically, `uniweb add ci --host=github-pages` writes the right workflow with `host: github-pages` in `deploy.yml`.

### CLI-push to a static host — `uniweb deploy --host=<adapter>`

For one-shot deploys from your machine (no Git-driven build), `uniweb deploy --host=<adapter>` builds, uploads, and (for adapters that support it) invalidates the CDN — all in one command.

```bash
cd site
uniweb deploy --host=s3-cloudfront
```

The most common case is **AWS S3 + CloudFront**, which has no Git-driven workflow built in. The `s3-cloudfront` adapter emits a CloudFront Function (URI rewrite for directory-index), runs `aws s3 sync`, and creates a CloudFront invalidation. Requires the `aws` CLI on PATH and standard AWS credentials.

Configure the destination in `deploy.yml`, a sibling of `site.yml`:

```yaml
# site/deploy.yml
default: production
targets:
  production:
    host: s3-cloudfront
    bucket: my-site-assets
    distributionId: E1ABCDEFGH1234
    region: us-east-1
```

`--host=<adapter>` on the command line overrides the resolved target's host for one-off experiments without saving. `--target=<name>` selects a non-default target.

CLI-push works for `cloudflare-pages` too — useful if you'd rather push from your machine than connect a repo.

### Manual export — any static host

`uniweb export` produces a self-contained `dist/` you can upload anywhere. The framework doesn't run the upload; you do.

```bash
cd site
uniweb export
# Output: site/dist/

# Upload with the host's tooling:
netlify deploy --prod --dir=dist
vercel --prod
aws s3 sync dist/ s3://your-bucket --delete
```

`uniweb export --host=<adapter>` emits host-specific helper files into `dist/` so the host serves the result correctly. Default when not specified: `cloudflare-pages`.

The `dist/` artifact is self-contained. The host doesn't need to know anything about Uniweb.

### When to choose Uniweb hosting

Free static hosts cover the typical case — markdown in your repo, push to deploy, static HTML out the other side. **Uniweb hosting** (paid) is a different product. It exists for needs the static-host path can't meet:

| | Free static host | Uniweb hosting |
|---|---|---|
| Static-page prerender | Yes (at build time) | Yes (at build time + JIT at edge) |
| Dynamic-page prerender (collections fetched at runtime) | No — runtime fetches are client-side | Yes — JIT prerender at the edge |
| Foundation/runtime updates without redeploying | No — rebuild on each foundation change | Yes — propagation gated by site policy |
| Edge SSR for SEO on dynamic content | No | Yes |
| Custom domain on free tier | Yes | n/a (always paid) |
| Visual editor for content authors | No | Yes (separate decision — see [Path 2](#path-2--you-ship-a-foundation-as-a-product)) |

If your site's content lives in markdown and updates ship via git, free CI is the right call. Choose Uniweb hosting when:

- Pages are dynamic — content from APIs, large collections updated independently of code, search results that need to be SEO-indexed.
- You want to push foundation or runtime updates without rebuilding every site.
- You need edge SSR for content that doesn't exist at build time.

**Deploy command:**

```bash
uniweb login              # one-time
cd site
uniweb deploy             # default target is Uniweb hosting
```

`uniweb deploy` opens a browser on the very first deploy of a new site to confirm the site name, plan, and (if the site uses paid features such as a custom domain) payment. Subsequent deploys are silent.

End-to-end first run from a fresh project:

```bash
uniweb create acme-com
cd acme-com
pnpm install              # one-time dependency install
uniweb deploy
```

The CLI handles login, foundation publishing (workspace-local foundations get auto-published *site-bound* — see [Site-bound vs cataloged](#site-bound-vs-cataloged-foundations)), site creation, and deployment in a single flow.

---

## Path 2 — You ship a foundation as a product

You're building a foundation for clients, content authors, or any team that won't write markdown. The foundation is your product; the repo's `site/` is a test harness for the code (run `pnpm dev` to preview your components against sample content). You don't deploy a site — you publish a foundation.

The sites that use your foundation are managed in the **Uniweb apps** (web + desktop) — visual editors designed for non-technical authors. They never see git, markdown, yaml, or React. They see *your* components, with live previews and visual controls for the params you defined. The foundation becomes the editor's native vocabulary for that site: you keep creative control of the design system, they get an editor that feels custom-built for them.

This is a paid path (catalog + hosting + apps). The right shape when:

- Site content has a life independent of the foundation's release cycle.
- Content authors are not the same people as the developers — clients, writers, marketing teams.
- The same foundation drives multiple sites with different content and themes.
- Site ownership transfers (developer creates the site, hands it to a client).

### Publishing to the Uniweb registry — `uniweb publish`

The catalog is a **private, access-segregated** inventory of commercial foundation products, organized under organization namespaces (`@org/name`) you own or belong to. It is *not* a public package registry. You only see the foundations you own or are a registered editor of.

```bash
uniweb login              # one-time
cd src                    # the foundation directory
uniweb publish @your-org/foundation-name
```

The first publish under a namespace requires that you own the namespace (or are invited to it). Each subsequent publish bumps the version per the foundation's `package.json::version`.

Consuming sites pin the foundation by name and version:

```yaml
# site.yml in a consumer site
foundation: '@your-org/foundation-name@1.4.7'
```

The platform serves the foundation from the catalog's CDN. Consumer sites pay nothing extra to load it (the foundation owner's plan covers serving); they just need a license to use it.

**License model.** Foundations are licensed per site, not per developer. A site carries the right to use whichever foundation it's configured with. Site ownership can be transferred (developer creates the site, hands it to a client); the license rides with the site.

### Foundation on a third-party URL — GitHub Pages, S3, anywhere

A foundation is a static directory of files. Anywhere that serves static directories over HTTPS works:

- GitHub Pages
- Cloudflare R2 or S3 + CloudFront with a custom domain
- Self-hosted nginx / Caddy
- An npm package whose `dist/entry.js` you reference via `https://unpkg.com/...`

The site doesn't care where the foundation lives — it follows the URL.

Sites reference the foundation by URL in `site.yml`:

```yaml
foundation: 'https://cdn.example.com/foundation/1.4.7/entry.js'
```

**The unipress pattern.** The unipress project ships its open-source foundations on GitHub Pages. Each push to `main` builds and publishes; the result lives at:

```
https://uniweb.github.io/unipress/foundations/<name>/<version>/entry.js
```

A consuming site references the URL:

```yaml
# site/site.yml
foundation: 'https://uniweb.github.io/your-org/your-repo/foundations/marketing/1.4.7/entry.js'
```

The CI workflow that any GH-Pages-served foundation needs to follow:

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

The trade-off versus the Uniweb registry: no automatic propagation, no gated rollout, no per-site trust grants. You get permanent stable URLs and a free CDN; you give up coordinated rollouts and the visual editor / CMS for content authors (those require sites managed on the Uniweb platform).

### Site-bound vs cataloged foundations

Foundations come in two flavours, distinguished by *who owns the foundation* and *where the file is served from*:

| | Site-bound | Cataloged |
|---|---|---|
| `site.yml` | `foundation: ~self/<name>@<version>` | `foundation: '@<org>/<name>@<version>'` |
| Where the foundation is served | The site's own origin (`mysite.com/_module/<name>/<version>/entry.js`) | The catalog's CDN |
| Workflow | `uniweb deploy` builds and uploads everything together | `uniweb publish` (separate, deliberate) → consuming sites pin and deploy |
| Multi-site shareable | No — bound to this site | Yes — license-gated, across whichever sites the foundation owner grants access |
| Discoverable | n/a — it's not a separate object | Yes, to users with access |
| Propagation | Yes — version updates flow without site republishing | Yes — across every licensed site whose policy permits the version jump |
| Live example | [uniweb.io](https://www.uniweb.io/) | [proximify.com](https://www.proximify.com/) |

**Site-bound** is the natural choice when a foundation only powers one site. No publish step, no namespace, no catalog visibility. The foundation rides along with `uniweb deploy`. [uniweb.io](https://www.uniweb.io/) ships exactly this way: one repo, one workflow, `uniweb deploy` from the site's directory and the foundation goes with it.

**Cataloged** is the natural choice when the foundation is a deliberate product across multiple sites. You publish it once with `uniweb publish`; consuming sites pin it by name and version. [proximify.com](https://www.proximify.com/) ships this way — its foundation is a catalog product the site's owner is licensed to use.

You don't have to commit upfront. A foundation that started as site-bound can later become cataloged when a second site wants to use it; the move is a deliberate `uniweb publish` and a one-line edit in each consuming site's `site.yml`.

### Foundation propagation

When you publish a new foundation version, sites that already use it don't move automatically by default. The default classification is *silent*: the version is stored, sites that pin it exactly can resolve to it, but earlier-version sites don't move.

To opt a release into propagation:

```bash
uniweb publish --propagate
```

Sites that aren't pinned and whose foundation update policy permits the version jump pick up the new version through a gated rollout — canary first, then a small percentage, then the full population, with health gates between waves. The site's foundation version moves forward on the platform without redeploying the site.

A site declares its update policy in `site.yml`:

```yaml
# String form (default policy)
foundation: '@acme/marketing@1.4.7'

# Object form with explicit policy
foundation:
  ref: '@acme/marketing@1.4.7'
  policy: auto-minor   # exact | auto-patch | auto-minor
  pinned: false
```

A foundation can also declare its own policy intent in `package.json::uniweb.runtimePolicy`, which controls how the runtime version moves forward independently of the foundation version. See [CLI Commands → uniweb publish](../reference/cli-commands.md#uniweb-publish) for the full propagation surface.

This is one thing you give up when you don't deploy to the Uniweb platform: propagation is a property of the registry+hosting combination, not of the framework. Sites hosted elsewhere move forward only when you redeploy them.

---

## Roadmap — Hybrid

A future version will let markdown in a git repo and content in the Uniweb apps stay in two-way sync. Authors edit visually, devs edit in their IDE, both surfaces work on the same content. Conflict resolution, branch isolation, and review flows are still being designed.

This isn't available today — no need to plan around it. Mention it here so the framework's eventual shape doesn't surprise you.

---

## Reference

### Commands at a glance

| Command | What it does |
| --- | --- |
| `uniweb add ci --host=<adapter>` | Scaffold a CI workflow in your repo (today: `github-pages`). The host runs `uniweb build` on each push. |
| `uniweb deploy` | Deploy to Uniweb hosting (default). With `--host=<adapter>`, push directly to a static host — builds, uploads, invalidates in one step. |
| `uniweb export` | Produce a self-contained `dist/` for any static host. You upload it yourself. `--host=<adapter>` adds host-specific helper files. |
| `uniweb publish @org/name` | Publish a foundation to the catalog (path 2). |
| `uniweb build` | Inspect a build locally. For shipping, use `deploy` or `export`. |

`--host=<adapter>` is the same option across `deploy`, `export`, and `add ci`. Each adapter implements only the operations it supports — `add ci` is `github-pages`-only today because it's the only host that needs a workflow file in the repo. Cloudflare Pages, Netlify, and Vercel are dashboard-driven; their adapters power the auto-detection used by `build`/`export`/`deploy`.

### Built-in adapters

| Adapter | `add ci` | `deploy --host` | `export --host` | What it does |
|---|:---:|:---:|:---:|---|
| `github-pages` | ✓ | ✓ | ✓ | Emits `.nojekyll` and a GH Actions workflow |
| `cloudflare-pages` | — | ✓ | ✓ | Emits `_redirects` for `redirect:` / `rewrite:` directives |
| `netlify` | — | ✓ | ✓ | Alias of `cloudflare-pages` (same `_redirects` format) |
| `vercel` | — | ✓ | ✓ | No helper files; Vercel handles directory-index natively |
| `s3-cloudfront` | — | ✓ | ✓ | Emits CloudFront Function + deploy manifest; runs `aws s3 sync` and `aws cloudfront create-invalidation` |
| `generic-static` | — | ✓ | ✓ | No host-specific output |

### `deploy.yml` configuration

`deploy.yml` is a sibling of `site.yml`. Safe to commit. Targets are named so a project can have a production target plus staging, preview, etc.

```yaml
# site/deploy.yml
default: production
targets:
  production:
    host: s3-cloudfront
    bucket: acme-com
    distributionId: E1ABCDEFGH1234
    region: us-east-1
    domain: acme.com           # optional, used by some adapters
  staging:
    host: cloudflare-pages
    domain: staging.acme.com
```

`uniweb deploy` resolves the target by precedence: `--target=<name>` flag → `default:` field → first key under `targets:`. `--host=<name>` overrides the resolved target's host for one-off experiments (no save). `--no-save` skips the auto-save of `lastDeploy` provenance.

### Combining hosts

The two destinations (foundation + site) don't have to be the same provider:

| Foundation | Site | Notes |
|---|---|---|
| Uniweb registry | Uniweb hosting | Easiest. Propagation, gated rollouts, edge SSR. |
| Uniweb registry | Vercel / Netlify / GH Pages | Linked mode against the registry URL; the site is a generic static deploy. No platform-driven propagation. |
| GH Pages / S3 / etc. | Vercel / Netlify / GH Pages | Fully self-hosted. No platform dependencies. Move forward by editing the foundation URL in `site.yml` and redeploying. |
| (none — bundled) | Anywhere static | Foundation source is bundled into the site's `dist/`. No separate foundation step. |

Uniweb hosting is currently optimized for foundations served from the Uniweb registry — that's the path the propagation system and edge SSR are built around. Sites hosted on Uniweb but pointing at an external foundation URL fall outside the propagation system. Sites hosted elsewhere can point anywhere.

---

## The deeper mental model

The path-based recipes above are enough for shipping. The rest of this section explains *why* the framework is shaped the way it is — useful when something doesn't fit cleanly, or when you're deciding between two reasonable options.

### Two artifacts, three verbs

A Uniweb project is a workspace with two kinds of packages:

- **A site** — pure content. Markdown pages, theme settings, locales, configuration. Plus a small bootstrap (`site/entry.js`) that the CLI scaffolds once and you never edit.
- **A foundation** — pure code. React components, layouts, theme variable declarations, content handlers, styles. A vocabulary of section types content authors compose sites from.

Three verbs, three intents:

| | What it sends | Where it goes |
|---|---|---|
| `uniweb deploy` | Built site + (if local) site-bound foundation | Uniweb hosting (default), or any static host via `--host=<adapter>` |
| `uniweb export` | Self-contained `dist/` for any static host | Your filesystem; you upload manually |
| `uniweb publish` | Built foundation as a catalog product | Uniweb registry, named, versioned, discoverable |

`uniweb deploy` and `uniweb publish` are independent operations. They can run on different schedules, by different people, against different destinations. The CLI blends them when convenient (`uniweb deploy` auto-publishes a workspace foundation that hasn't been published yet), but the framework treats them as distinct concepts.

### Why we don't pattern-match on Next.js

Most JavaScript frameworks (Next.js, Remix, Astro, Gatsby, SvelteKit) couple a site and its code into a single deployable unit. You build the app; the build emits HTML and JavaScript; the bundle *is* the site. There is no separate "library of components" that other sites can reuse without forking the repo.

Uniweb supports that mode — when a site references a workspace-local foundation, the foundation is bundled into the site's `dist/`, exactly the way a Vite app bundles its imports. Path 1's free-CI flow uses this mode by default.

But Uniweb also supports a second mode — **linked** — where the foundation lives at one URL (in the catalog, on GH Pages, anywhere) and any number of sites load it from there at runtime. The site bundle is small (just runtime, content, theme); the foundation arrives separately on first page load.

Why this exists:

- **One foundation, many sites.** A marketing foundation built once, used by `acme.com`, `acme.fr`, and `acme.de`, each with its own content team, theme, and deploy cadence.
- **Content authors and component developers don't share a release cycle.** Authors push content changes without touching code. Developers push foundation changes without coordinating with every site that uses them.
- **Foundations as products.** A design studio publishes a portable foundation; clients adopt it. The foundation is the product; the clients' sites are the deliverables.

Once you stop assuming the site and its code have to ship together, deployment options open up that the standalone model can't express. Path 2 is the use case linked mode exists for; path 1 with a registry foundation is a less-common but valid combination.

### Standalone vs linked — under the hood

A site picks its mode from the shape of the `foundation:` field in `site.yml` — there is no `mode:` switch. The CLI auto-detects:

- **Workspace-local source** (`foundation: src` or `foundation: '@your-org/marketing'` with a `file:` package.json dep) → **standalone**: foundation source is bundled into the site's `dist/`.
- **Registry ref** (`foundation: '@acme/marketing@1.4.7'`) or **URL** (`foundation: 'https://...'`) → **linked**: site loads the foundation at runtime via an import map.
- **Site-bound ref** (`foundation: ~self/<name>@<version>`) → **linked**, with the foundation served from the site's own origin.

In linked mode, React, the JSX runtime, and `@uniweb/core` are resolved through a `<script type="importmap">` the site emits, so the foundation borrows the site's copies — no duplicate React, single component identity.

`--link` and `--bundle` are internal CLI vocabulary. You don't pass them; `uniweb deploy` and `uniweb export` pick the right pipeline from the foundation reference shape.

### Publishing and deploying are different concepts

A foundation is **published**. A site is **deployed**. They answer different questions:

| Question | Answer |
|---|---|
| Where does this code live so other sites can use it? | A registry, or any HTTPS URL. `uniweb publish` writes here. |
| Where does this site live so visitors can read it? | A host — Uniweb hosting, or any static host. `uniweb deploy` writes here. |

In standalone mode, the two collapse — the site bundle contains the foundation's code, so deploying the site is the only step. There is no separate "where does the foundation live?" because the answer is "inside the site."

In linked mode, the two are explicit and ordered. Publish the foundation first; deploy the site that references it. They can run on different schedules, in different repos, by different people. A foundation can serve sites on multiple hosts at once. A site can switch foundations without changing where it's hosted. A team can update the foundation without touching any site, and have the change reach existing sites through propagation (on the Uniweb platform) or through a one-line edit in `site.yml` (everywhere else).

The CLI lets you blend the two when convenient — `uniweb deploy` will auto-publish a workspace foundation site-bound when it hasn't been deployed yet — but it does not erase the distinction. The framework knows about both verbs, in both orders, against both kinds of destinations. That awareness is what lets you start with path 1 and grow into path 2 without restructuring the project.

---

## See also

- **[Building with Uniweb](./building-with-uniweb.md)** — The two-package model and how content connects to components.
- **[Project Structures](./project-structures.md)** — Workspace layouts: single, segregated, co-located, extensions; multiple sites sharing one foundation.
- **[Foundation Categories](./foundation-categories.md)** — Bundled vs portable on the foundation-design axis (orthogonal to standalone vs linked deployment).
- **[Publishing and Clients](./publishing-and-clients.md)** — Invite and handoff workflows for getting a site into a content author's hands.
- **[CLI Commands](../reference/cli-commands.md)** — Full reference for `uniweb publish`, `uniweb deploy`, runtime policy, and propagation flags.
- **[Static Hosting](../reference/deployment.md)** — Per-host recipes for Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3, and self-hosted servers.
- **[Deploying to GitHub Pages](./deploy-github-pages.md)** — The full recipe: scaffold, push, custom domain, draft-mode escape hatches, troubleshooting.
