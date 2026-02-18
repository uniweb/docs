# Project Structures

A Uniweb project is a pnpm workspace. [Building with Uniweb](./building-with-uniweb.md) introduces the two-package setup — foundation and site, side by side. That's the starting point for most projects. But as a workspace grows — a second site sharing the same foundation, an extension adding specialized section types, multiple brands under one repo — the layout matters.

This guide covers the workspace structures we've found work well, when to use each, and the concrete wiring that connects the pieces.

> **Terminology note:** "Workspace" means the top-level directory created by `uniweb create` — the pnpm monorepo root. In co-located layouts, each subdirectory (e.g., `marketing/`, `docs/`) is called a **project** — a self-contained group of foundation + site. Use `uniweb add project` to create this structure in one step, or the `--project` flag on individual `add foundation`/`add site` commands.

---

## How the Pieces Connect

Every Uniweb workspace uses three wiring mechanisms. Understanding them makes all the recipes below predictable.

### 1. Workspace packages

`pnpm-workspace.yaml` declares which directories are packages. The default globs cover both the single and segregated layouts:

```yaml
# pnpm-workspace.yaml
packages:
  - foundation
  - site
  - foundations/*
  - sites/*
```

`foundation` and `site` match sibling packages. `foundations/*` and `sites/*` match segregated directories. Both sets can coexist — pnpm ignores globs that match nothing.

### 2. `file:` dependency

The site's `package.json` references its foundation as a local dependency:

```json
{
  "dependencies": {
    "foundation": "file:../foundation"
  }
}
```

The key name (`"foundation"`) becomes the package name used everywhere else. The path is relative to the site's `package.json`. When packages move, this path changes — that's the main wiring adjustment between layouts.

### 3. `foundation:` in site.yml

The site needs to know which package provides the foundation. `site.yml` declares this:

```yaml
foundation: foundation
```

The value matches the package name from `package.json`. The build resolves the package through pnpm's workspace linking — the name just has to match.

That's the complete wiring. Workspace globs tell pnpm what's a package, `file:` tells the site where the foundation lives on disk, and `foundation:` tells the build which package it is. Everything else — directory names, nesting depth, number of packages — is convention.

---

## Recipes

Each recipe shows a workspace layout with its wiring. Pick the one that matches your situation, or combine pieces from several.

### Single (siblings)

The default when you run `pnpm create uniweb`. Foundation and site are siblings at the workspace root.

```
my-project/
├── foundation/
│   ├── package.json          ← name: "foundation"
│   └── src/sections/
├── site/
│   ├── package.json          ← "foundation": "file:../foundation"
│   └── site.yml              ← foundation: foundation
├── pnpm-workspace.yaml
└── package.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - foundation
  - site
  - foundations/*
  - sites/*
```

**When to use it:** One foundation, one site. The workspace root stays clean. Most projects start here and many never need more.

**Trade-off:** Adding a second foundation or site puts it next to the first at the root level. That works for two or three packages, but gets noisy beyond that.

### Segregated

Foundations and sites in separate directories. Create a `blank` workspace and use `uniweb add` with named packages to build this layout.

```
my-project/
├── foundations/
│   ├── default/
│   │   ├── package.json      ← name: "default"
│   │   └── src/sections/
│   └── blog/
│       ├── package.json      ← name: "blog"
│       └── src/sections/
├── sites/
│   ├── main/
│   │   ├── package.json      ← "default": "file:../../foundations/default"
│   │   └── site.yml          ← foundation: default
│   └── marketing/
│       ├── package.json      ← "default": "file:../../foundations/default"
│       └── site.yml          ← foundation: default
├── pnpm-workspace.yaml
└── package.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - foundations/*
  - sites/*
```

The `file:` path goes up two levels from `sites/main/` to the workspace root, then down into `foundations/default/`.

**When to use it:** Multiple sites sharing a foundation, or multiple foundations with clear separation. The foundation is often the primary deliverable — published to the Uniweb registry and delivered via CDN to sites. The site packages serve as development harnesses for testing the foundation.

**Trade-off:** Deeper nesting means longer `file:` paths. A single-foundation project doesn't benefit from the extra directories.

**Root scripts with build order:**

Foundations must build before sites (prerender needs the built `foundation.js`). Root scripts enforce this:

```json
{
  "scripts": {
    "dev": "pnpm --filter main dev",
    "build": "pnpm --filter default build && pnpm --filter main build",
    "build:all": "pnpm -r build"
  }
}
```

`pnpm -r build` respects dependency order — if `main` depends on `default` via `file:`, pnpm builds `default` first. Explicit ordering in scripts is only needed when you want to build a subset.

### Co-located projects

Each project is a self-contained directory with its own foundation and site. This is the pattern we used for all of our company sites.

```
my-workspace/
├── marketing/
│   ├── foundation/
│   │   └── package.json      ← name: "marketing"
│   └── site/
│       ├── package.json      ← "marketing": "file:../foundation"
│       └── site.yml          ← foundation: marketing
├── docs/
│   ├── foundation/
│   │   └── package.json      ← name: "docs-foundation"
│   └── site/
│       ├── package.json      ← "docs-foundation": "file:../foundation"
│       └── site.yml          ← foundation: docs-foundation
├── pnpm-workspace.yaml
└── package.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - "*/foundation"
  - "*/site"
```

The `*/foundation` and `*/site` globs discover every project's packages automatically. Adding a new project means creating a new directory — no workspace config changes.

**When to use it:** Multiple independent brands or products that share a repo for convenience but don't share foundations. Each project has its own build, its own foundation, its own site. Teams can work in their own directory without stepping on each other.

**Trade-off:** Foundation package names must be globally unique in the workspace — pnpm needs to distinguish them. If two projects both name their foundation `"foundation"`, pnpm can't link them correctly. Use project-scoped names (`"marketing"`, `"docs-foundation"`) or scoped packages (`"@acme/marketing"`).

**One foundation can't be shared** across projects in this layout without reaching across directory boundaries (a `file:../../other/foundation` path, which defeats the co-location purpose). If two projects need the same foundation, the segregated layout is a better fit.

### Extensions as siblings

An extension adds specialized section types without modifying the primary foundation. It's a separate foundation loaded at runtime via URL. The `extensions` template creates this layout.

```
my-project/
├── foundation/
│   ├── package.json          ← name: "foundation"
│   └── src/sections/         ← Header, Hero, Features, Footer
├── effects/
│   ├── package.json          ← name: "effects"
│   └── src/sections/         ← ParticleHero, AnimatedCounter
├── site/
│   ├── package.json          ← "foundation": "file:../foundation"
│   └── site.yml              ← see below
├── pnpm-workspace.yaml
└── package.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - foundation
  - effects
  - site
  - foundations/*
  - sites/*
```

The extension isn't a `file:` dependency of the site — it's loaded by URL at runtime. `site.yml` declares it:

```yaml
# site/site.yml
foundation: foundation

extensions:
  - /effects/foundation.js
```

The URL `/effects/foundation.js` works in both dev and production:

- **Dev:** A custom Vite plugin in `site/vite.config.js` serves `/effects/*` from `../effects/dist/`
- **Production:** The root build script copies `effects/dist/` into `site/dist/effects/`

```json
{
  "scripts": {
    "dev": "pnpm --filter effects build && pnpm --filter site dev",
    "build": "pnpm --filter foundation build && pnpm --filter effects build && pnpm --filter site build && cp -r effects/dist site/dist/effects"
  }
}
```

An extension builds like any foundation — same Vite plugin, same output. The difference is in role: it contributes section types but doesn't provide Layout or theme variables. Its `foundation.js` declares `extension: true`:

```js
// effects/src/foundation.js
export default {
  extension: true
}
```

This causes the build to write `role: "extension"` to the extension's `schema.json`, and to warn if the extension declares `vars` or layouts (which belong to the primary foundation).

Content authors use section types from extensions the same way — `type: ParticleHero` in frontmatter. The runtime resolves the type from whichever foundation provides it. Primary foundation wins if both define the same name; extensions are checked in declared order.

**When to use it:** Adding specialized capabilities (visual effects, data visualization, interactive widgets) that don't belong in a general-purpose foundation. The extension can be developed, tested, and published independently.

**Trade-off:** Extensions are always runtime-loaded, which means an additional network request on first page load. The custom Vite plugin for dev serving is small but manual — each extension needs its route served.

See [Extending Your Site](./extending-your-site.md) for the broader extensibility model, including Vite plugins and `head.html` scripts.

### Extensions in segregated layout

When extensions are shared across multiple sites, the segregated layout accommodates them naturally:

```
my-project/
├── foundations/
│   └── default/
│       └── package.json      ← name: "default"
├── extensions/
│   ├── effects/
│   │   └── package.json      ← name: "effects"
│   └── data-viz/
│       └── package.json      ← name: "data-viz"
├── sites/
│   ├── marketing/
│   │   └── site.yml          ← extensions: [/effects/foundation.js]
│   └── analytics/
│       └── site.yml          ← extensions: [/effects/foundation.js, /data-viz/foundation.js]
├── pnpm-workspace.yaml
└── package.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - foundations/*
  - extensions/*
  - sites/*
```

The wiring is the same as the sibling extension recipe, but organized for scale. Each site declares which extensions it needs. The root build script handles the copy step for each extension into each site's `dist/`.

**When to use it:** Multiple extensions shared across multiple sites — typically a larger project with a team maintaining the extension library.

**Trade-off:** Build orchestration gets more involved. Each `site × extension` combination needs its copy step in the build. For a single extension used by one site, the sibling layout is less ceremony.

---

## Choosing a Layout

| Situation | Layout |
|-----------|--------|
| One foundation, one site | Single |
| Publishing a portable foundation | Segregated (site is the dev harness) |
| Multiple sites sharing a foundation | Segregated |
| Multiple independent brands | Co-located |
| Adding specialized section types | Extensions as siblings |
| Extensions shared across sites | Extensions segregated |

These are starting points. The patterns compose — a co-located project can have a sibling extension, a segregated layout can mount external content with `paths:`. Start with the pattern that matches your primary need, and adjust as the project grows.

---

## Growing a Project

Projects evolve. The `uniweb add` command handles scaffolding, workspace globs, and root scripts — you don't wire things manually.

> **Running the CLI:** After `pnpm create uniweb`, you need to install dependencies before `pnpm uniweb` works. For a blank workspace where you want to add packages *before* installing, use `npx uniweb add` instead. Once you've run `pnpm install`, `pnpm uniweb` works for all subsequent commands.

### Starting from blank

When you know you need a non-default layout — co-located projects, multiple foundations, or a segregated structure — start with a blank workspace and build it up:

```bash
pnpm create uniweb my-workspace --blank
cd my-workspace

# Add a co-located project (npx because we haven't installed yet)
npx uniweb add project main

# Now install and run
pnpm install
pnpm dev
```

The `add project` command creates a co-located foundation + site pair in one step. The same flow works for any layout:

```bash
# Co-located: grouped by project (preferred for multiple projects)
npx uniweb add project marketing
npx uniweb add project docs

# Segregated: named foundations and sites
npx uniweb add foundation marketing
npx uniweb add foundation blog
npx uniweb add site main --foundation marketing
npx uniweb add site docs --foundation blog
```

The CLI creates the directories, writes `package.json` and config files, updates `pnpm-workspace.yaml` globs, wires the `file:` dependency from site to foundation, and updates root scripts. Run `pnpm install` once after adding all packages.

### Adding to an existing workspace

After `pnpm install`, the CLI is available as `pnpm uniweb`:

```bash
# Add a second site sharing the existing foundation
pnpm uniweb add site blog
pnpm install
```

This creates `sites/blog/`, adds the `sites/*` glob to `pnpm-workspace.yaml`, and wires the site to the existing foundation. The original site at `site/` stays where it is.

```
my-project/
├── foundation/
├── site/                         ← original
├── sites/
│   └── blog/                     ← new, wired to foundation
└── pnpm-workspace.yaml
```

Adding a named foundation works the same way — it goes into `foundations/{name}/`.

### Adding a co-located project

If you started with a single layout and now need independent projects:

```bash
pnpm uniweb add project docs
pnpm install
```

This creates `docs/foundation/` and `docs/site/`, adds `*/foundation` and `*/site` globs. Package names are `docs-foundation` and `docs-site`. Use `--from` to apply template content: `add project docs --from academic`.

Your original `foundation/` and `site/` still work — they match their existing globs. You can keep the hybrid layout or move them into a project directory when you're ready.

### Adding an extension

```bash
pnpm uniweb add extension effects --site site
pnpm install
```

This creates `extensions/effects/`, adds the `extensions/*` glob, and wires the extension URL into the specified site's `site.yml`. The extension builds like a foundation — run `pnpm uniweb build` from the workspace root to build everything in order.

Extensions are always runtime-loaded (via URL, not `file:` dependency). In dev, a Vite plugin serves the extension. In production, the build copies the extension's output into the site's `dist/`. See [Extending Your Site](./extending-your-site.md) for the full setup.

---

## Working with External Content

A site can mount content from outside its own `pages/` directory using `paths:` in `site.yml`. This is useful when content lives in a separate repository, a shared directory, or a submodule.

```yaml
# site/site.yml
paths:
  pages/docs: ../../../docs
```

This mounts the `docs/` directory as if it were `pages/docs/` inside the site. Pages, collections, and library files in the external directory are discovered normally.

The path is relative to the site directory. `defineSiteConfig()` in the site's `vite.config.js` reads `paths:` and auto-computes `server.fs.allow` so Vite can serve files from outside the project root — no manual `server.fs.allow` configuration needed.

**When to use it:** Documentation content shared across sites, content maintained by a separate team, or submodule-based content repositories. The Uniweb site itself uses this pattern to mount `packages/docs/` into its page tree.

---

## See Also

- **[Building with Uniweb](./building-with-uniweb.md)** — The two-package model and how CCA works
- **[Templates](../getting-started/templates)** — Built-in and official templates
- **[Extending Your Site](./extending-your-site.md)** — Vite plugins, `head.html`, and the full extensibility model
- **[Foundation Categories](./foundation-categories.md)** — Bundled vs portable foundations and when portability matters
- **[Site Configuration](../reference/site-configuration.md)** — Full `site.yml` reference including `paths:`, `extensions:`, and `foundation:`
