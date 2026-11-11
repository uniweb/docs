# Deploying

**We recommend Uniweb hosting**, with `uniweb publish`. It is the host with the full set of hosting features: pages prerendered over live data, the Uniweb app where your authors edit the same site, and services a site turns on as it grows — form submissions, analytics, a live database, accounts for members. A site can start as a few static pages and become a complete platform there, without moving. It is a paid service; see **[Uniweb hosting](#uniweb-hosting--recommended)**.

To host a site somewhere else, `uniweb deploy` ships it to a standard host such as Cloudflare Pages, and `uniweb export` builds a folder for any other.

How a project ships also depends on **who manages the content**. That question decides what gets deployed, which commands you run, and how collaboration works.

- **You and your authors — a synced site.** You work in your project, in files and git; authors work in the Uniweb app, composing pages from your section types. The CLI keeps the two in sync, and `uniweb publish` takes the site live on Uniweb hosting. See **[Synced](#synced--you-in-files-authors-in-the-app)**.
- **Path 1: You manage the content.** You (or your dev team) write the markdown. Publish the site to Uniweb hosting, or deploy it to a static host: GitHub Pages, Cloudflare Pages, Netlify, Vercel, S3 + CloudFront.
- **Path 2: Someone else manages the content.** You register a foundation; sites built on it are composed by content authors in the Uniweb app. The repo's `site/` is a test harness, not a deploy target.

> **In a hurry?** `uniweb publish` takes your site live on Uniweb hosting — see **[Uniweb hosting](#uniweb-hosting--recommended)**. On GitHub Pages it takes three commands — see **[The 3-line recipe](#the-3-line-recipe--github-pages)**. If you're building a foundation for clients who manage their own content, jump to **[Path 2](#path-2--you-ship-a-foundation-as-a-product)**.

The same framework powers all three. The difference is the deployment artifact and who owns the content lifecycle.

---

## Synced — you in files, authors in the app

A synced site has two interfaces. You keep working in your project, in files and git. Authors work in the Uniweb app, where they compose pages from your section types, set the options each one declares in its `meta.js`, and manage records through your schemas, with live previews. Both edit the same site: its content lives on the Uniweb backend as well as in your files, and the CLI keeps the two in step with **git-style sync verbs**.

Start from a normal project:

```bash
uniweb login              # one-time
uniweb sync               # the first sync creates the site in the app, with its foundation
```

Or start from a site that already lives in the app: `uniweb site list` shows your sites with their uuids, and `uniweb clone <site-uuid>` makes a local project from one.

From then on:

- `uniweb clone <site-uuid>` — start a local file project, under git, from a site that already lives on the backend (often authored in the app).
- `uniweb pull` — bring the backend's current content into your files. In a git repository it merges, like `git pull`: the backend's content is committed and merged into your branch, so your work — committed or not — is kept, and pages and sections removed on the backend are removed here too unless you changed them. Outside git it rewrites your files to match the backend (`--no-delete` keeps what the backend removed), asking first.
- `uniweb push` — send your local edits back up (first push creates the site and mints its id). In a git repository it sends what you have committed; `--commit` commits the site's content first.
- `uniweb refresh` — catch up in one step: `git pull` for your teammates' commits, then `uniweb pull` for the authors' edits. Never pushes.
- `uniweb sync` — `refresh`, then `push`.
- `uniweb publish` — `push`, then make the backend's current state **live** on Uniweb hosting (see [Uniweb hosting](#uniweb-hosting--recommended)).

**Nobody's work is overwritten without asking.** A push that would overwrite changes made in the app since your last pull is refused before anything is written; merge them in with `uniweb pull` (or `uniweb refresh`) and push again. Edits to different sections never collide, and where the same text changed on both sides you resolve the conflict markers in git, like any merge, then `git commit`. `--force` is the deliberate overwrite in either direction: on `push` it replaces the backend's changes, on `pull` it discards your local ones.

**A pushed site is a draft.** Authors see it in the app as soon as you push; visitors see nothing until the site goes live, with `uniweb publish` or from the app.

**Collaboration happens on both sides at once:** teammates through git, authors through the app. `uniweb refresh` takes both kinds of change into your project.

---

## Path 1 — You manage the content

You write the markdown, configure the theme, and ship the result: the site and its foundation go together.

Five ways to ship under this path. They differ in *who builds*, *who uploads*, and *what extras you get*:

| | Builds | Uploads | When to use |
|---|---|---|---|
| **Uniweb Cloud (`uniweb publish`)** — recommended | No site build: the host renders your content (your machine builds the foundation it releases) | Your machine | The full set of hosting features: pages over live data, the Uniweb app for authors, forms, analytics and accounts. Paid — see [Uniweb hosting](#uniweb-hosting--recommended) |
| **CI via `uniweb add ci --host=<adapter>`** | GitHub Actions | The host | A free static host, from a one-line scaffold. Set up once, every push deploys. Adds PR previews on CF Pages / Netlify / Vercel |
| **Dashboard connect (CF Pages, Netlify, Vercel)** | The host | The host | Same outcome, no workflow file and no secrets |
| **CLI-push (`uniweb deploy --host=<adapter>`)** | Your machine | Your machine | One-shot deploy from the CLI; the only path for S3 + CloudFront |
| **Manual export (`uniweb export`)** | Your machine | You, by hand | Any host the framework doesn't have an adapter for |

Not sure? `uniweb publish` is the one we recommend, and **`uniweb deploy`** with nothing configured walks you through every choice.

### Uniweb hosting — recommended

`uniweb publish` takes the site live on Uniweb hosting (**Uniweb Cloud**). We recommend it because it is the host with the full set of hosting features:

- **Pages over live data.** Records with a data schema reach published pages live, and the host prerenders each page a visit starts on with its data, so search engines and link previews read the finished page.
- **The Uniweb app.** Your authors can edit the same site visually, composing pages from your section types and managing records through your schemas, while you keep working in files — see [Synced](#synced--you-in-files-authors-in-the-app). Every publish updates the site in the app, whether or not anyone uses it yet, so it is ready for previewing and editing at any time.
- **Payments.** A site's own backend, the `backend` service, takes payments through the site owner's own Stripe account. [Sites with Accounts](./sites-with-accounts.md) covers the `backend` service.
- **Services a site turns on as it grows.** Form submissions, analytics, a live database of records, accounts for members: each is an entry under `services:` in `site.yml` that asks the host for it — see [Site Services](../reference/site-services.md).
- **No site build.** `publish` sends your content and brings the foundation along, and the host renders the site with the framework's runtime and your foundation.

So a site can start as a few static pages and grow into a complete platform — records, forms, members — on the same host, without moving.

| | Uniweb hosting | A static host |
|---|---|---|
| Pages | Prerendered by the host as a visit starts, with their live data | Prerendered at build time, with the data the build had |
| Records | Delivered live to published pages (`records: true` under `services:`) | Compiled into the build; a change ships with the next build |
| Authors in the Uniweb app | Edit the site and take it live from the app | Their edits reach the site through your project: a pull, then a build |
| Forms, accounts, analytics | Services you ask the host for in `site.yml` | An address of your own, or a third-party service |
| To ship a change | `uniweb publish`, with no site build | A build, in CI or on your machine |
| Cost | Paid. A site of static pages costs the least: each service, live records included, is priced on its own | Free tiers on GitHub Pages, Cloudflare Pages, Netlify and Vercel |

We recommend starting on Uniweb hosting even for a site of static pages whose content changes only through git: it costs the least then, its pages are prerendered at the edge, every publish keeps it ready for editing in the app, and it can grow on the same host with no changes. A static host serves what a build makes, and the same project builds for one with `uniweb deploy` or `uniweb export`, as the rest of this path shows; such a site can move to Uniweb hosting at any time with `uniweb publish`.

**Publish command:**

```bash
uniweb login              # one-time
cd site
uniweb publish            # go live on Uniweb hosting
```

When going live needs payment — the very first go-live of a new site, or a change that adds a paid feature such as a custom domain — `uniweb publish` opens a browser to settle it. An already-paid site just goes live.

End-to-end first run from a fresh project:

```bash
uniweb create acme-com
cd acme-com
pnpm install              # one-time dependency install
uniweb publish
```

`uniweb publish` handles login, **brings the foundation along** (releasing the site's local foundation to the catalog under your `@org` when its code changed — see [How a foundation reaches the catalog](#how-a-foundation-reaches-the-catalog)), pushes the content, and goes live — all in one flow. It doesn't take authors' edits first: when they changed what you're pushing, it stops before anything goes live. Merge their edits in with `uniweb pull` (or `uniweb sync`), then publish again.

**Local media.** Images, video, and PDFs you reference by a site-root path (`/images/hero.jpg`, with the file under `public/`) are uploaded to the platform's CDN and rewritten to durable serve URLs automatically — no manual asset step. On the Uniweb-hosting path, reference local media by a site-root path rather than a path relative to the markdown file (`./hero.jpg`). Media already hosted elsewhere — a full `https://…` URL — is left untouched and loaded from its source.

### The 3-line recipe — GitHub Pages

```bash
# A) From a freshly-cloned GitHub repo (recommended):
npm create uniweb@latest . -- --template starter
uniweb add ci --host=github-pages
# Commit, push, enable Pages in repo settings → live site

# B) Starting locally, then pushing to a new GitHub repo:
npm create uniweb my-site
cd my-site
uniweb add ci --host=github-pages
# Create the GitHub repo, push, enable Pages → live site
```

Enable Pages on the repo at *Settings → Pages → Source: "GitHub Actions"*. Every push runs `uniweb build` and publishes the result. Pre-rendering is on by default — your site loads as static HTML, fast first paint, SEO out of the box.

`uniweb add ci` scaffolds a GitHub Actions workflow and host-specific helper files (e.g., `.nojekyll` to keep GH Pages from stripping `_`-prefixed directories like `_pages/`).

**Your package manager is detected, not assumed.** The workflow installs the way your project installs — read from the lockfile in your repo, not from how you happened to invoke the CLI. A `pnpm-lock.yaml` gets `pnpm/action-setup` plus `pnpm install --frozen-lockfile`; a `package-lock.json` gets `npm ci`; a `yarn.lock` gets `yarn install --frozen-lockfile`. npm, pnpm, and yarn are all supported, and the Node version follows your `engines.node` (raised if the pinned pnpm needs more).

**Custom domain.** Add a `CNAME` file at the site's root with your domain (e.g., `mysite.com`), or pass `--domain=<host>` to `uniweb add ci`, which writes the `CNAME` and builds the site for the domain's root, stating its URLs there. GitHub Pages serves custom domains over HTTPS for free.

**Collaboration.** Branches, PRs, reviewers, comments — same as any code project. Treat the site like code: review changes before they ship.

### Other free static hosts — Cloudflare Pages, Netlify, Vercel

Three ways to ship to these, and they all work:

| | Command | Who builds | Notes |
|---|---|---|---|
| Scaffold a workflow | `uniweb add ci --host=<name>` | GitHub Actions | Reproducible — same toolchain versions as your machine. Adds PR previews. |
| Connect the repo | (dashboard) | The host | Zero config, zero secrets. No workflow file. |
| Push from your machine | `uniweb deploy --host=<name>` | You | One-shot, no Git trigger. |

**Scaffolded workflow.** `uniweb add ci --host=cloudflare-pages` (or `netlify` / `vercel`) writes two workflows: a production deploy on every push to the default branch, and a **per-PR preview deploy** that comments the preview URL on the pull request. Each needs host credentials as repository secrets — the command prints exactly which ones. Skip the preview workflow with `--no-previews`.

**Dashboard connect.** Push your project to a GitHub/GitLab/Bitbucket repo. In the host's dashboard, click *New project → Import from Git* → pick the repo. The host detects the build command (`pnpm build`) and the output directory (`dist/`) automatically. Nothing to scaffold, no secrets to manage — and Vercel/Netlify give you previews natively. If you connect the repo, delete the scaffolded workflows rather than running both.

**CI auto-detection.** When `uniweb build` runs in a known CI environment, the build picks the matching adapter automatically:

| Detected env | Adapter | Notes |
|---|---|---|
| `CF_PAGES=1` | `cloudflare-pages` | Emits `_redirects` for `redirect:` / `rewrite:` directives |
| `NETLIFY=true` | `netlify` | Alias of `cloudflare-pages` — same `_redirects` format |
| `VERCEL=1` | `vercel` | No helper files (Vercel handles directory-index + caching natively) |
| `GITHUB_ACTIONS=true` | (none — see below) | GHA is a runner, not a host |

GitHub Actions is treated as a *runner*, not a host: a GHA workflow can deploy anywhere — to GH Pages, to S3, to Uniweb. The framework records the runner metadata but won't default `--host` from `GITHUB_ACTIONS=true`. For GH Pages specifically, `uniweb add ci --host=github-pages` writes the right workflow with `host: github-pages` in `deploy.yml`.

### The deploy wizard — `uniweb deploy`

Run `uniweb deploy` with no destination configured and it asks:

```
? Where should this site go?
❯   Uniweb Cloud · recommended · paid, live data + visual editing
    GitHub Pages · free, CI on push
    Cloudflare Pages · free, CI on push
    Netlify · free, CI on push
    Vercel · free tier, CI on push
    S3 + CloudFront · your AWS account
    Somewhere else · export a folder
```

Picking **Uniweb Cloud** runs `uniweb publish`. Pick a static host and it asks *how* — set up a workflow so every push deploys (recommended for the free hosts), or upload from this machine now. Picking **Somewhere else** runs `uniweb export`.

Your answer is recorded in `deploy.yml`, so later runs of `uniweb deploy` go straight there without asking again.

### CLI-push to a static host — `uniweb deploy --host=<adapter>`

For one-shot deploys from your machine (no Git-driven build), `uniweb deploy --host=<adapter>` builds, uploads, and (for adapters that support it) invalidates the CDN — all in one command.

```bash
cd site
uniweb deploy --host=s3-cloudfront      # aws s3 sync + CloudFront invalidation
uniweb deploy --host=cloudflare-pages   # wrangler pages deploy
uniweb deploy --host=netlify            # netlify deploy --prod
uniweb deploy --host=vercel             # vercel deploy --prod
uniweb deploy --host=github-pages       # commits dist/ to the gh-pages branch
```

Each adapter drives that host's own CLI, so you authenticate the way that host expects (`wrangler login`, `netlify login`, `vercel login`, `aws configure`) or via environment variables. If a required tool or credential is missing, the command says which one and how to get it — nothing is attempted half-way.

`github-pages` is the odd one: there is no upload API, so the deploy commits `dist/` to the `gh-pages` branch using a detached worktree (your working tree is never touched) and a normal non-force commit (so a bad deploy is one `git revert` away). The CI path is still the better default for GitHub Pages.

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

`--host=<adapter>` on the command line overrides the resolved target's host for one-off experiments without saving. `--target=<name>` selects a non-default target. Each adapter reads its own keys from the target — `bucket` / `distributionId` / `region` for `s3-cloudfront`, `projectName` for `cloudflare-pages`, `siteId` for `netlify`, `branch` for `github-pages`. Credentials are read from the environment, never from `deploy.yml`, which is committed.

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

---

## Path 2 — You ship a foundation as a product

You're building a foundation for clients, content authors, or any team that won't write markdown. The foundation is your product; the repo's `site/` is a test harness for the code (run `pnpm dev` to preview your components against sample content). You don't deploy a site — you register a foundation.

The sites that use your foundation are managed in the **Uniweb app** — a visual editor designed for non-technical authors. They never see git, markdown, yaml, or React. They see *your* components, with live previews and visual controls for the params you defined. The foundation becomes the editor's native vocabulary for that site: you keep creative control of the design system, they get an editor that feels custom-built for them.

This is a paid path (catalog + hosting + the app). The right shape when:

- Site content has a life independent of the foundation's release cycle.
- Content authors are not the same people as the developers — clients, writers, marketing teams.
- The same foundation drives multiple sites with different content and themes.
- Site ownership transfers (developer creates the site, hands it to a client).

### Registering to the Uniweb registry — `uniweb register`

The catalog is a **private, access-segregated** inventory of commercial foundation products, organized under organization namespaces (`@org/name`) you own or belong to. It is *not* a public package registry. You only see the foundations you own or are a registered editor of.

```bash
uniweb login              # one-time
cd src                    # the foundation directory
uniweb register --scope @your-org
```

The first registration under a scope requires that you own the org scope (or are invited to it). Each subsequent `register` bumps the version per the foundation's `package.json::version`. `register` submits the foundation together with the data schemas it renders.

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

**Publishing a foundation to GitHub Pages — one command.**

```bash
uniweb add ci --target foundation
```

This scaffolds `.github/workflows/publish-foundations.yml`. On every push to the default branch it builds each foundation in the workspace and publishes it at a permanent versioned URL:

```
https://<user>.github.io/<repo>/foundations/<name>/<version>/entry.js
```

A consuming site references that URL:

```yaml
# site/site.yml
foundation: 'https://your-org.github.io/your-repo/foundations/marketing/1.4.7/entry.js'
```

Bump the foundation's `package.json` version and push — the new version appears alongside the old ones, which keep resolving. Use `--foundation <name>` to publish just one foundation from a workspace that holds several.

The command prints the exact URLs it will produce, so you can paste one into `site.yml` before the first run completes.

A few things worth knowing:

- **Versions accumulate at stable URLs forever.** Every previous version stays reachable; sites pinning an older URL keep working.
- **Pinning is the URL itself.** Sites move forward by editing the URL in `site.yml`, not through a registry-driven propagation walk.
- **Add a `.nojekyll` marker** to the gh-pages branch root. Without it, GitHub Pages's Jekyll processing silently 404s any file or directory starting with an underscore — including the foundation's generated entry chunks.

The trade-off versus the Uniweb registry: no per-site trust grants, and no part in [propagation](#foundation-propagation) once the registry has it. You get permanent stable URLs and a free CDN; you give up the visual editor / CMS for content authors (it requires sites managed on the Uniweb platform).

### How a foundation reaches the catalog

On Uniweb hosting a foundation always lives in the catalog as `@org/name@version`, served from the catalog's CDN and licensed to the sites that use it. There are two ways to get it there — they differ in *who initiates the release*, not in where the foundation ends up:

| | Brought along by `uniweb publish` | Registered deliberately |
|---|---|---|
| Workflow | `uniweb publish` from the site releases the local foundation, then goes live | `uniweb register` from the foundation (separate, deliberate) → consuming sites pin and publish |
| `site.yml` | `foundation: src` (a workspace-local ref) | `foundation: '@<org>/<name>@<version>'` |
| Best when | A foundation powers one site | The foundation is a product across multiple sites |
| Catalog visibility | Released under your `@org`, not surfaced as a separate product | Yes — a listed, license-gated product |
| Multi-site shareable | Promote it later with a deliberate `uniweb register` | Yes — across whichever sites the foundation owner grants access |
| Propagation | Not yet — [every registration is silent today](#foundation-propagation) | Same |
| Live example | [uniweb.io](https://uniweb.io/) | [proximify.com](https://www.proximify.com/) |

**Brought along by `uniweb publish`** is the natural choice when a foundation only powers one site. No separate register step, no naming ceremony — `uniweb publish` from the site directory releases the foundation (when its code changed) and takes it live with the content. [uniweb.io](https://uniweb.io/) ships exactly this way: one repo, one command.

**Registered deliberately** is the natural choice when the foundation is a product across multiple sites. You register it once with `uniweb register`; consuming sites pin it by name and version. [proximify.com](https://www.proximify.com/) ships this way — its foundation is a catalog product the site's owner is licensed to use.

You don't have to commit upfront. A single-site foundation can become a shared product when a second site wants it; the move is a deliberate `uniweb register` and a one-line edit in each consuming site's `site.yml`.

### Foundation propagation

When you register a new foundation version, sites that already use it don't move automatically by default — registration is *silent*: the version is stored, sites that pin it exactly can resolve to it, but earlier-version sites don't move.

Opting a release into automatic **propagation** — a gated rollout to consenting sites (canary → a small percentage → the full population, with health gates between waves) — is a registry capability being brought to `register`; today every registration is silent. Once it lands, a site that isn't pinned and whose foundation update policy permits the version jump picks up the new version on the platform without redeploying the site.

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

A foundation can also declare a policy *intent* in `package.json::uniweb.runtimePolicy` — how far past the runtime version it built against a host may move a site. It is a declaration recorded in `dist/runtime-pin.json`, not a mechanism: `uniweb register` doesn't send it, the framework doesn't act on it, and the runtime a site runs is the host's to select. See [CLI Commands](../reference/cli-commands.md#the-pin-is-a-compatibility-floor-not-a-selector).

This is one thing you give up when you don't deploy to the Uniweb platform: propagation is a property of the registry+hosting combination, not of the framework. Sites hosted elsewhere move forward only when you redeploy them.

---

## Reference

### Commands at a glance

| Command | What it does |
| --- | --- |
| `uniweb publish` | Go live on Uniweb Cloud, the host we recommend — brings the foundation along, pushes the content, goes live. Paid. |
| `uniweb deploy` | The wizard — asks where the site should go, then does it. Remembers your answer in `deploy.yml`. |
| `uniweb add ci --host=<adapter>` | Scaffold a CI workflow (+ PR previews) in your repo. The host runs `uniweb build` on each push. |
| `uniweb add ci --target foundation` | Scaffold the workflow that publishes foundations at permanent versioned GitHub Pages URLs. |
| `uniweb deploy --host=<adapter>` | Push to a third-party static host — builds, uploads, invalidates in one step. |
| `uniweb export` | Produce a self-contained `dist/` for any static host. You upload it yourself. `--host=<adapter>` adds host-specific helper files. |
| `uniweb register --scope @org` | Register a foundation + its data schemas to the registry (path 2). |
| `uniweb push` / `pull` / `refresh` / `sync` / `clone` | Git-style content sync with the Uniweb backend, and so with the app — see [Synced](#synced--you-in-files-authors-in-the-app). |
| `uniweb build` | Inspect a build locally. For shipping, use `deploy`, `publish`, or `export`. |

`--host=<adapter>` is the same option across `deploy`, `export`, and `add ci`. Each adapter implements only the operations it supports, and the CLI only ever offers you the ones that will work — see the adapter table below for who does what.

**`add ci` options:** `--host=<adapter>`, `--target=<site|foundation>`, `--domain=<host>` (GitHub Pages custom domain), `--project-name=<name>` (the name to register under on the host), `--no-previews` (skip the PR-preview workflow), `--site=<name>` / `--foundation=<name>` (pick one from a multi-package workspace), `--force` (overwrite an existing workflow).

### Built-in adapters

| Adapter | `add ci` | PR previews | `deploy --host` | `export --host` | Uploads with | What it does |
|---|:---:|:---:|:---:|:---:|---|---|
| `github-pages` | ✓ | — | ✓ | ✓ | `git` | Emits `.nojekyll`; CLI-push commits `dist/` to the `gh-pages` branch |
| `cloudflare-pages` | ✓ | ✓ | ✓ | ✓ | `wrangler` | Emits `_redirects` for `redirect:` / `rewrite:` directives |
| `netlify` | ✓ | ✓ | ✓ | ✓ | `netlify` | Same `_redirects` format as Cloudflare Pages; own deploy + CI |
| `vercel` | ✓ | ✓ | ✓ | ✓ | `vercel` | No helper files; Vercel handles directory-index natively |
| `s3-cloudfront` | — | — | ✓ | ✓ | `aws` | Emits CloudFront Function + deploy manifest; runs `aws s3 sync` and `aws cloudfront create-invalidation` |
| `generic-static` | — | — | — | ✓ | — | No host-specific output. An artifact *shape* for `export`, not a destination |

Each adapter implements only the operations it supports, and the CLI never offers one it can't perform: `uniweb deploy`'s wizard lists only destinations that have a deploy hook or a CI scaffold, and `uniweb add ci` lists only hosts that can scaffold a workflow.

**`redirect:` travels; `rewrite:` does not.** A page's `redirect:` works on **every** host — the
prerender writes a meta-refresh document for it, so it needs nothing from the host. A `rewrite:` is a
**proxy**: the URL stays put and the body is served from an upstream, which is why the hosts that
support it spell it `200` rather than `302` in `_redirects`. That needs a server, so `rewrite:` works
on `cloudflare-pages` and `netlify` and nowhere else — on `github-pages`, `vercel`, `s3-cloudfront`
and `generic-static` the prerender writes nothing for such a page and the route is simply **absent**,
not degraded. If you need a rewrite on one of those: **Vercel supports rewrites natively** — commit your own
`vercel.json` beside `site.yml` and the build leaves it alone. Elsewhere, put a proxy in front of
the site yourself, or use `redirect:` when a visible URL change is acceptable.

**GitHub Pages has no PR previews** because the platform has no preview environment — a repo has one Pages site. Use Cloudflare Pages, Netlify, or Vercel if per-PR preview URLs matter.

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

`uniweb deploy` resolves the target by precedence: `--target=<name>` flag → `default:` field → first key under `targets:`. `--host=<name>` overrides the resolved target's host for one-off experiments (no save). `--no-save` skips recording the deploy under `deploys:`.

### Combining hosts

The two destinations (foundation + site) don't have to be the same provider:

| Foundation | Site | Notes |
|---|---|---|
| Uniweb registry | Uniweb hosting | Easiest. Pages prerendered at the edge over live data; propagation once the registry has it. |
| Uniweb registry | Vercel / Netlify / GH Pages | Linked mode against the registry URL; the site is a generic static deploy. No platform-driven propagation. |
| GH Pages / S3 / etc. | Vercel / Netlify / GH Pages | Fully self-hosted. No platform dependencies. Move forward by editing the foundation URL in `site.yml` and redeploying. |
| (none — bundled) | Anywhere static | Foundation source is bundled into the site's `dist/`. No separate foundation step. |

Uniweb hosting is currently optimized for foundations served from the Uniweb registry — that's the path its edge prerendering is built around, and propagation will be. Sites hosted on Uniweb but pointing at an external foundation URL fall outside the propagation system. Sites hosted elsewhere can point anywhere.

---

## The deeper mental model

The path-based recipes above are enough for shipping. The rest of this section explains *why* the framework is shaped the way it is — useful when something doesn't fit cleanly, or when you're deciding between two reasonable options.

### Two artifacts, and the verbs that ship them

A Uniweb project is a workspace with two kinds of packages:

- **A site** — pure content. Markdown pages, theme settings, locales, configuration. Plus a small bootstrap (`site/entry.js`) that the CLI scaffolds once and you never edit.
- **A foundation** — pure code. React components, layouts, theme variable declarations, content handlers, styles. A vocabulary of section types content authors compose sites from.

**The foundation goes to the registry** with one verb:

| | What it sends | Where it goes |
|---|---|---|
| `uniweb register` | Built foundation + the data schemas it renders | Uniweb registry — named, versioned, discoverable |

**The site goes live**, three ways depending on the host:

| | What it does |
|---|---|
| `uniweb publish` | Go live on Uniweb hosting: bring the foundation along (release if its code changed), push the content, go live |
| `uniweb deploy --host=<adapter>` | Ship to a third-party static host: build → upload (the foundation is bundled into the site) |
| `uniweb export` | Build a self-contained `dist/` for any static host; you upload it yourself |

On Uniweb hosting a site's content also lives on the backend, with **git-style primitives** that `publish` builds on: `uniweb push` (local → backend), `uniweb pull` (backend → local), `uniweb clone` (a backend site → a new project).

**Two things worth stating plainly:**

- **`uniweb publish` brings the foundation along.** When the site's local foundation changed, `publish` releases the new version to the catalog under your `@org` first — there is no separate auto-publish step, and `deploy` ships no foundation code.
- **`publish` pushes, then promotes the backend's current state.** It sends your local content the way `uniweb push` does — a push that is refused stops the publish before anything goes live — and the site goes live with edits made in the app as well as yours.

Going live on Uniweb hosting (`uniweb publish`) and cataloging a foundation as a standalone product (`uniweb register`) are independent operations — different schedules, people, intents. `publish` brings a single site's foundation along for you; `register` is the deliberate "this foundation is a multi-site product" step.

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

- **Workspace-local source** (`foundation: src` or `foundation: '@your-org/marketing'` with a `file:` package.json dep) → **standalone**: foundation source is bundled into the site's `dist/`. This is the shape `uniweb export` and `uniweb deploy --host` use for a self-contained third-party deploy.
- **Registry ref** (`foundation: '@acme/marketing@1.4.7'`) or **URL** (`foundation: 'https://...'`) → **linked**: site loads the foundation at runtime via an import map.

(On Uniweb hosting, `uniweb publish` always catalogs the foundation as `@org/name@version` and serves it linked — bringing a workspace-local foundation along by releasing it first.)

In linked mode, React, the JSX runtime, and `@uniweb/core` are resolved through a `<script type="importmap">` the site emits, so the foundation borrows the site's copies — no duplicate React, single component identity.

`--link` and `--bundle` are internal CLI vocabulary. You don't pass them; the verb (`publish`, `deploy`, `export`) picks the right pipeline from the foundation reference shape.

### Registering and deploying are different concepts

A foundation is **registered**. A site is **deployed**. They answer different questions:

| Question | Answer |
|---|---|
| Where does this code live so other sites can use it? | A registry, or any HTTPS URL. `uniweb register` writes here. |
| Where does this site live so visitors can read it? | A host — Uniweb hosting (`uniweb publish`), or any static host (`uniweb deploy --host` / `uniweb export`). |

In standalone mode, the two collapse — the site bundle contains the foundation's code, so shipping the site is the only step. There is no separate "where does the foundation live?" because the answer is "inside the site." This is the third-party static-host path.

In linked mode, the two are explicit. On Uniweb hosting, `uniweb publish` handles both for a single site — it brings the foundation along (releasing it to the catalog) and takes the site live in one flow. For a multi-site product they run separately: register the foundation, then publish each site that references it — on different schedules, in different repos, by different people. A foundation can serve sites on multiple hosts at once. A site can switch foundations without changing where it's hosted. A team can update the foundation without touching any site, and have the change reach existing sites through a one-line edit in `site.yml` — and on Uniweb hosting, through [propagation](#foundation-propagation) once the registry has it.

The framework knows both verbs, in both orders, against both kinds of destinations. That awareness is what lets you start with path 1 and grow into path 2 without restructuring the project.

---

## See also

- **[Building with Uniweb](./building-with-uniweb.md)** — The two-package model and how content connects to components.
- **[Project Structures](./project-structures.md)** — Workspace layouts: single, segregated, co-located, extensions; multiple sites sharing one foundation.
- **[Foundation Categories](./foundation-categories.md)** — Bundled vs portable on the foundation-design axis (orthogonal to standalone vs linked deployment).
- **[Registering a Foundation](./publishing-and-clients.md)** — Making a foundation a catalog product that other sites can use.
- **[CLI Commands](../reference/cli-commands.md)** — Full reference for `uniweb publish`, `uniweb register`, `uniweb deploy`, `uniweb push`/`pull`, runtime policy, and propagation.
- **[Static Hosting](../reference/deployment.md)** — Per-host recipes for Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3, and self-hosted servers.
- **[Deploying to GitHub Pages](./deploy-github-pages.md)** — The full recipe: scaffold, push, custom domain, draft-mode escape hatches, troubleshooting.
