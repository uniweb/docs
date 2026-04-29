# Deploying

A Uniweb project produces two artifacts, not one. Understanding why is the shortcut to understanding every deployment option Uniweb supports — including the ones other frameworks don't.

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

Uniweb supports that mode — we call it **bundled mode**, and it's a perfectly good choice for a single site with a single team. But Uniweb also supports a second mode, **linked mode**, in which the foundation lives at one URL and any number of sites load it from there at runtime. The site bundle is small (just the runtime, content, and theme); the foundation arrives separately on first page load.

The reason this exists:

- **One foundation, many sites.** A marketing foundation built once, used by `acme.com`, `acme.fr`, and `acme.de`, each with its own content team, its own theme overrides, and its own deploy cadence.
- **Content authors and component developers don't share a release cycle.** Authors push content changes without touching code. Developers push foundation changes without coordinating with every site that uses them.
- **Foundations as products.** A design studio publishes a portable foundation; clients adopt it. The foundation is the product; the clients' sites are the deliverables.

Once you stop assuming the site and its code have to ship together, deployment options open up that the bundled model can't express.

---

## Bundled vs linked

A site picks its mode in `site.yml`. The framework auto-detects from the shape of the `foundation:` field — there is no `mode:` switch.

### Bundled mode

The foundation source is bundled into the site at build time, the way any Vite app bundles its imports. One artifact, one deploy.

```
site/dist/
├── index.html
├── assets/
│   ├── index-[hash].js     ← site + foundation, together
│   └── index-[hash].css
└── ...
```

This is what you get when `site.yml` references the foundation by its workspace package name:

```yaml
# site/site.yml
foundation: src
```

**When to use it.** A single site, a single foundation, a single team. You want a self-contained static bundle you can hand to any host. You don't need a visual editor for content authors ([Uniweb App](https://uniweb.app)).

### Linked mode

The foundation lives at one URL. Sites fetch it on first page load and dynamically link it to the runtime JavaScript that ships with the site.

```
                   ┌─────────────────────────────────────┐
                   │  foundation                          │
                   │  ─────────                           │
                   │  https://<registry>/                 │
                   │    @acme/marketing@1.4.7/            │
                   │      foundation.js                   │
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

A site enters linked mode automatically when its `foundation:` field is one of:

- A **registry reference**: `foundation: '@acme/marketing@1.4.7'` — resolved through the configured registry to a CDN URL.
- A **direct URL**: `foundation: 'https://example.com/foundation.js'` — fetched verbatim.
- An **object form**: `foundation: { ref: '@acme/marketing@1.4.7', policy: 'auto-minor' }` — same as the registry form, with optional update-policy metadata.

The browser fetches `foundation.js` once and caches it. React, the JSX runtime, and `@uniweb/core` are resolved through an `<script type="importmap">` the site emits, so the foundation borrows the site's copy of those instead of shipping its own — no duplicate React, single component identity.

**A foundation is not a library.** It has no programmatic API for other developers to consume. It is not on public code. Its audience is licensed content authors, who compose sites by writing `type: Hero` in markdown frontmatter — not developers calling `import { Hero }`. What linked mode delivers is a *dynamically linked module*: an ES module addressed by URL and dynamically linked to a runtime. That is a deployment shape, not a developer-facing API.

**When to use it.** More than one site shares the foundation, or foundation and sites have different release cadences, or you want to offer a visual editor to content authors via the [Uniweb App](https://uniweb.app).

> **Bundled vs linked is about deployment, not foundation design.** A separate axis — whether a foundation hardcodes its data and theme or parameterizes them — is covered in [Foundation Categories](./foundation-categories.md). A foundation can be portable (parameterized) and bundled, or domain-specific and linked. The two choices compose independently.

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

The deployment story doesn't change between layouts. Each site in the workspace deploys independently with `uniweb deploy`. The foundation is published once with `uniweb publish` (in linked mode) or bundled into each site's build (in bundled mode), and the choice is per-site — one site in the workspace can be linked while another is bundled.

---

## Two verbs, in order

In linked mode the foundation has to exist at a URL before a site can reference it. The order is:

```bash
# Linked mode — two artifacts, two destinations
cd src && uniweb publish        # foundation → registry
cd ../site && uniweb deploy     # site → host
```

```bash
# Bundled mode — one artifact, one destination
cd site && uniweb build         # produces a self-contained dist/
# ship dist/ wherever
```

The verbs map to concepts:

| | What it sends | Where it goes |
|---|---|---|
| `uniweb publish` | Built foundation (`dist/foundation.js` + `schema.json`) | A registry — the Uniweb registry by default |
| `uniweb deploy` | Built site (`dist/`) | A host — Uniweb hosting by default |

`uniweb deploy` against a site whose `foundation:` is a workspace reference checks whether the foundation is already published (via its `dist/publish.json` receipt) and runs `uniweb publish` for you when it isn't, before deploying the site against the resulting registry version. The two-step nature is preserved internally; you type one command. If you want full control — to publish under an organization, set propagation flags, or stage a release — run `publish` and `deploy` separately.

---

## Practical: deploying with the Uniweb platform

The shortest path. Uniweb provides:

- A free **registry** for foundation publishing — under your personal scope, an organization you belong to, or a public scope.
- A **hosting platform** that serves sites with edge SSR, locale-aware routing, and automatic propagation of foundation and runtime updates to consenting sites.

```bash
# One-time setup
uniweb login

# Each foundation release
cd src
uniweb publish

# Each site deploy
cd ../site
uniweb deploy
```

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
- Deploy a site to any static host (bundled or linked).
- Mix providers — host the foundation in one place, the site in another.

### Site on a generic static host (bundled mode)

A built bundled-mode site is a standard Vite output. It deploys to any static host:

```bash
cd site
uniweb build
# Output: site/dist/

# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist

# Cloudflare Pages
wrangler pages deploy dist

# GitHub Pages
npx gh-pages -d dist

# AWS S3
aws s3 sync dist/ s3://your-bucket --delete
```

The bundle is self-contained; the host doesn't need to know anything about Uniweb. See [Static hosting](../reference/deployment.md) for per-host configuration: base paths under subdirectories, SPA fallback for unknown routes, GitHub Pages routing rules.

### Foundation on GitHub Pages

A foundation builds to a directory; GitHub Pages serves directories. Pair them with a CI workflow.

The unipress project does exactly this. Its open-source foundations build and publish on every push to `main`, ending up at:

```
https://uniweb.github.io/unipress/foundations/<name>/<version>/foundation.js
```

A consuming site references the foundation by URL:

```yaml
# site/site.yml
foundation: https://uniweb.github.io/your-org/your-repo/foundations/marketing/1.4.7/foundation.js
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
- An npm package whose `dist/foundation.js` you reference via `https://unpkg.com/...` (the URL is the contract; how the file got there isn't).

The site doesn't care where the foundation lives — it follows the URL.

### Combining hosts

The two destinations don't have to be the same provider. Realistic combinations:

| Foundation | Site | Notes |
|---|---|---|
| Uniweb registry | Uniweb hosting | Easiest. Propagation, gated rollouts, edge SSR. |
| Uniweb registry | Vercel / Netlify / GH Pages | Linked mode against the registry URL; the site is a generic static deploy. No platform-driven propagation, but the foundation URL's version is fixed in the site's `site.yml`. |
| GH Pages / S3 / etc. | Vercel / Netlify / GH Pages | Fully self-hosted. No platform dependencies. Move forward by editing the foundation URL in `site.yml` and redeploying. |
| (none — bundled) | Anywhere static | Bundled mode. Foundation source is in the site bundle. |

Uniweb hosting is currently optimized for foundations served from the Uniweb registry — that's the path the propagation system and edge SSR are built around. Sites hosted on Uniweb but pointing at an external foundation URL fall outside the propagation system. Sites hosted elsewhere can point anywhere.

---

## Publishing and deploying are different concepts

A foundation is **published**. A site is **deployed**. They answer different questions:

| Question | Answer |
|---|---|
| Where does this code live so other sites can use it? | A registry, or any HTTPS URL. `uniweb publish` writes here. |
| Where does this site live so visitors can read it? | A host — Uniweb hosting, or any static host. `uniweb deploy` writes here. |

In bundled mode, the two collapse — the site bundle contains the foundation's code, so deploying the site is the only step. There is no separate "where does the foundation live?" because the answer is "inside the site."

In linked mode, the two are explicit and ordered. Publish the foundation first; deploy the site that references it. They can run on different schedules, in different repos, by different people. A foundation can serve sites on multiple hosts at once. A site can switch foundations without changing where it's hosted. A team can update the foundation without touching any site, and have the change reach existing sites through propagation (on the Uniweb platform) or through a one-line edit in `site.yml` (everywhere else).

The CLI lets you blend the two when convenient — `uniweb deploy` will auto-publish a workspace foundation that hasn't been published yet — but it does not erase the distinction. The framework knows about both verbs, in both orders, against both kinds of destinations. That awareness is what lets you start with the bundled-mode default and grow into linked mode without restructuring the project, or run a foundation as a product across many sites without funneling everything through one repo.

You don't have to pick upfront. Most projects start bundled — that's what `pnpm create uniweb` produces — and many stay bundled forever. The ones that need to share a foundation, or want propagation, get linked mode by changing one line in `site.yml`. The build, the runtime, and the CLI already know how to handle both.

---

## See also

- **[Building with Uniweb](./building-with-uniweb.md)** — The two-package model and how content connects to components.
- **[Project Structures](./project-structures.md)** — Workspace layouts: single, segregated, co-located, extensions.
- **[Foundation Categories](./foundation-categories.md)** — Bundled vs portable on the foundation-design axis (orthogonal to bundled vs linked deployment).
- **[Publishing and Clients](./publishing-and-clients.md)** — Invite and handoff workflows for getting a site into a content author's hands.
- **[CLI Commands](../reference/cli-commands.md)** — Full reference for `uniweb publish`, `uniweb deploy`, runtime policy, and propagation flags.
- **[Static Hosting](../reference/deployment.md)** — Per-host recipes for Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3, and self-hosted servers.
