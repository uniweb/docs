# Project Structures

A Uniweb project is a pnpm workspace. [Building with Uniweb](./building-with-uniweb.md) introduces the two-package setup — foundation and site, side by side. That's the starting point for most projects. But as a project grows — a second site sharing the same foundation, an extension adding specialized section types, multiple brands under one repo — the workspace layout matters.

This guide covers the workspace structures we've found work well, when to use each, and the concrete wiring that connects the pieces.

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

Foundations and sites in separate directories. The `multi` template creates this layout.

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

**When to use it:** Multiple sites sharing a foundation, or multiple foundations with clear separation. The foundation is often the primary deliverable — published to npm, used by external sites. The site package becomes a development harness and documentation site in one.

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

Each project is a self-contained directory with its own foundation and site. This is the pattern used in `packages/web/` for the Uniweb site itself.

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

An extension builds like any foundation — same Vite plugin, same output. The difference is in role: it contributes section types but doesn't provide Layout or theme variables. Its `foundation.js` config is typically an empty export:

```js
// effects/src/foundation.js
export default {}
```

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

Projects evolve. A project that starts with the single layout doesn't need to be restructured as it grows — the wiring adjustments are small and mechanical.

### Adding a second site

Start with a single layout and add a second site that shares the same foundation:

```
my-project/
├── foundation/
├── site/                         ← original site
├── sites/
│   └── blog/                     ← new site
│       ├── package.json          ← "foundation": "file:../../foundation"
│       └── site.yml              ← foundation: foundation
└── pnpm-workspace.yaml
```

No workspace config changes — the default `sites/*` glob already matches. The `file:` path is two levels up because the blog site is nested under `sites/`. The original site stays where it is.

### Single to co-located

When a project needs its own foundation and site as a self-contained unit, update the workspace globs:

```yaml
# pnpm-workspace.yaml — before
packages:
  - foundation
  - site

# pnpm-workspace.yaml — after
packages:
  - "*/foundation"
  - "*/site"
```

Then move the packages into a project directory. The `file:` path from site to foundation stays `file:../foundation` because the relative position doesn't change — they move together.

### Adding an extension to any layout

An extension is a foundation that's loaded by URL instead of `file:` dependency. Adding one to an existing project:

1. Create the extension directory with the same structure as a foundation
2. Add it to `pnpm-workspace.yaml`
3. Add its URL to `extensions:` in `site.yml`
4. Add the dev-serving Vite plugin to the site's `vite.config.js`
5. Update root build scripts to build the extension and copy its output

The extension doesn't affect any existing wiring — it's additive.

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
- **[Templates](../getting-started/templates.md)** — Official templates including `single`, `multi`, and `extensions`
- **[Extending Your Site](./extending-your-site.md)** — Vite plugins, `head.html`, and the full extensibility model
- **[Foundation Categories](./foundation-categories.md)** — Bundled vs portable foundations and when portability matters
- **[Site Configuration](../reference/site-configuration.md)** — Full `site.yml` reference including `paths:`, `extensions:`, and `foundation:`
