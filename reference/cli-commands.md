# CLI Commands Reference

The Uniweb CLI (`uniweb`) scaffolds projects, builds foundations and sites, generates documentation, diagnoses issues, and manages translations.

## Quick Reference

```bash
uniweb create [name]           # Create a new project (default: starter)
uniweb add <type> [name]       # Add a project, foundation, site, or extension
uniweb dev                     # Start a dev server for a site
uniweb build                   # Build the current project
uniweb snapshot                # Compose a preview image of a site (its site.yml preview:)
uniweb export                  # Build dist/ for any static host (no Uniweb account)
uniweb inspect <path>          # Show the parsed content shape of a section or page
uniweb rename <type> <old> <new>  # Rename a foundation, site, or extension workspace-wide
uniweb docs                    # Generate component documentation
uniweb doctor                  # Diagnose project configuration
uniweb validate                # Check content against the data schemas your foundation declares
uniweb update                  # Reconcile workspace state with the running CLI
uniweb i18n <command>          # Manage translations
uniweb login                   # Authenticate with Uniweb platform
uniweb register                # Register a foundation + its data schemas
uniweb invite <email>          # Invite a client to use your foundation
uniweb handoff <email>         # Create a site and transfer to a client
uniweb publish                 # Publish a site to Uniweb hosting (brings the foundation along)
uniweb deploy                  # Ship a site to a host (asks where, if not yet configured)
uniweb add ci --host=<adapter>  # Set up CI so every push deploys (+ PR previews)
uniweb push                    # Push local site content to the Uniweb backend
uniweb pull                    # Pull backend site content to local files
uniweb refresh                 # Catch up with the git remote and the backend (never pushes)
uniweb sync                    # Catch up, then push (refresh + push)
uniweb clone <site-uuid>       # Start a local project from a backend site
uniweb status                  # Show a site's sync state (unpushed content)
uniweb forget --backend <url>  # Forget one backend (--all: make a copied project a new one)
```

---

## uniweb create

Create a new Uniweb project.

```bash
uniweb create [name] [options]
uniweb create .                  # Scaffold into the current directory
```

### Arguments

| Argument | Description |
|----------|-------------|
| `name` | Project directory name (prompted if omitted), or `.` to scaffold into the current directory |

### Options

| Option | Description |
|--------|-------------|
| `--template <type>` | Template to use (default: starter) |
| `--blank` | Create an empty workspace (grow with `uniweb add`) |
| `--name <name>` | Project name (overrides slugified basename when used with `.`) |
| `--no-git` | Skip git repository initialization |

### In-place mode (`uniweb create .`)

Scaffolds into the current directory instead of creating a new one. Pairs with the GitHub-first workflow — create the repo on GitHub, clone it locally, then run `uniweb create .` inside the clone:

```bash
gh repo create my-site --public --clone
cd my-site
uniweb create . --template marketing
uniweb add ci --host=github-pages   # Optional: add CI for GitHub Pages
```

**Naming.** The project name comes from the cwd basename, slugified to a valid npm name (`MyProject` → `myproject`, `my_site` → `my-site`). If the slug is empty, the verb errors and asks you to pass `--name=<slug>` explicitly. The *site* is named after the project too, unless the template gives its site a name of its own in `site.yml` — the official templates do, so a site made from `marketing` starts as `Product Launch`.

**Conflict handling.** Pre-existing `README.md` and `.gitignore` are overwritten — the scaffold's versions (project-shaped README, Vite/Node-aware ignores) are more useful than what `gh repo create` puts in a fresh repo. Any other collision aborts with the list of conflicting files; move or remove them and re-run. Files outside the scaffold's write set (e.g. `LICENSE`) are left alone.

**Git.** `git init` is skipped when a `.git/` directory already exists.

### Default Behavior

Without `--template` or `--blank`, the CLI scaffolds a working project with foundation + site + starter content. In interactive mode, you're prompted to choose a template. In non-interactive mode (CI, scripts, agents), it defaults to starter.

### Templates

**Built-in:**

| Template | Description |
|----------|-------------|
| `starter` | Foundation + site + starter content (default) |
| `none` | Foundation + site with no content |

**Official templates:**

| Template | Description |
|----------|-------------|
| `marketing` | Landing page, features, pricing, testimonials |
| `docs` | Documentation site with sidebar, search, versioning |
| `academic` | Research site with publications, team, timeline |
| `dynamic` | Live API data fetching with loading states and transforms |
| `international` | Multilingual site with i18n, a blog, and records |
| `store` | E-commerce with product grid and Shopify integration |
| `extensions` | Multi-foundation demo with a visual effects extension |

**External templates:**

| Format | Example |
|--------|---------|
| Local directory | `./path/to/template` |
| npm package | `@myorg/uniweb-template` |
| GitHub repo | `github:user/repo` |
| GitHub URL | `https://github.com/user/repo` |

### Examples

```bash
# Foundation + site + starter content (default)
uniweb create my-site

# Interactive (prompts for template)
uniweb create

# Foundation + site with no content
uniweb create my-site --template none

# Empty workspace (grow with add)
uniweb create my-workspace --blank

# Use official marketing template
uniweb create my-site --template marketing

# Use npm package template
uniweb create my-site --template @acme/corporate-template

# Use GitHub template
uniweb create my-site --template github:myorg/custom-template

# Use local template
uniweb create my-site --template ./my-template

# Scaffold into the current directory (e.g., a freshly-cloned GitHub repo)
uniweb create .
uniweb create . --template docs
uniweb create . --name=my-app
```

> **Backward compatibility:** `--template blank` still works as an alias for `--blank`.

### Troubleshooting Template Downloads

Official templates are fetched from GitHub Releases. If download fails:

1. **Check network access** — Corporate networks may block GitHub API
2. **Use the starter** — Run `uniweb create my-site --template starter` to use the built-in starter
3. **Check rate limits** — GitHub API has rate limits for unauthenticated requests

---

## uniweb add

Add a project, foundation, site, or extension to an existing workspace.

```bash
uniweb add project [name] [options]
uniweb add foundation [name] [options]
uniweb add site [name] [options]
uniweb add extension <name> [options]
uniweb add section <Name> [options]
uniweb add ci [options]
```

Run this from a workspace root (a directory with `pnpm-workspace.yaml`). If there's no workspace yet, create one with `uniweb create --blank`.

### Common Options

| Option | Description |
|--------|-------------|
| `--from <template>` | Apply content from a template after scaffolding |
| `--path <dir>` | Custom directory for the package |

### Foundation Options

| Option | Description |
|--------|-------------|
| `--project <name>` | Group under a project directory (co-located layout) |

### Site Options

| Option | Description |
|--------|-------------|
| `--foundation <name>` | Foundation to wire to (prompted if multiple exist) |
| `--project <name>` | Group under a project directory (co-located layout) |

### Extension Options

| Option | Description |
|--------|-------------|
| `--site <name>` | Site to wire the extension URL into |

### Section Options

Adds a section type to a foundation — a component file and a `meta.js` beside it.

| Option | Description |
|--------|-------------|
| `--foundation <name>` | Foundation to add the section to (prompted if several exist) |
| `--starter` | Generate starter content for the section type from its `content:` declaration — what an author would begin editing |
| `--preset <name>` | With `--starter`: use that preset's params as the frontmatter |
| `--write <file>` | With `--starter`: write the markdown to a file instead of printing it |
| `--json` | With `--starter`: emit the parsed declaration, the content structure and the ProseMirror document |

`--starter` works two ways. On a section type that **already exists** it generates content
from that section's real declaration and writes nothing. On a **new** one it scaffolds the
section and gives its `meta.js` a `content:` declaration derived from the family the name
resolves to, so the three pieces agree: a declaration, a component, and content that fills it.

```bash
uniweb add section Hero --starter          # an existing section — nothing is written
uniweb add section Pricing --starter       # scaffold it, plus content that fills it
uniweb add section Hero --starter --json   # the declaration and the content, pipeable
```

The content is derived from what the component says it expects — there is no key to author
it in. See [Component Metadata → Content](./component-metadata.md#content).

### CI Options

`uniweb add ci` scaffolds a deploy workflow for a host, and PR-preview workflows where the
host supports them. Its options are listed by `uniweb add --help`; the deployment guides
cover the hosts themselves — [Deploying](../development/deploying.md).

### Placement

The CLI creates exactly the folder you ask for. The name argument is taken verbatim as the folder name (and the package name) — no silent nesting under `foundations/` or `sites/`. Pass a slash-bearing argument or `--path <parent>` when you want the foundation or site to live under a parent directory.

**Resolution rules** (foundation example; same shape for site):

| Input | Folder | Package name |
|-------|--------|--------------|
| `add foundation` (no name) | `src/` | `src` (folder name = package name) |
| `add foundation ui` | `ui/` | `ui` |
| `add foundation foundations/ui` | `foundations/ui/` | `ui` (last segment of the path) |
| `add foundation ui --path libs` | `libs/ui/` | `ui` |
| `add foundation --path foundations/effects` | `foundations/effects/` | `effects` (last segment of `--path`) |
| `add foundation --project docs` | `docs/src/` | `docs-src` (co-located convention) |

Same shape for `add site` (default folder `site/`, default package `site`, co-located `<project>/site/` with package name `<project>-site`).

**Collision handling.** Before scaffolding, the CLI checks two things:

1. **The target folder doesn't exist.** If it does, the command stops with the suggested alternatives (different name, or `--path` to a different parent).
2. **The package name isn't already in use.** Detection uses `classifyPackage` from `@uniweb/build`, so a foundation and a site can't collide on the same name even if they live in different folders. If the name is taken, the command stops and suggests picking a different one.

**Why no silent nesting?** The framework classifies packages by their *contents* (presence of `package.json::main` matching `_entry.generated.js`, presence of `site.yml`, etc.) — not by their location. So the folder name is purely organizational; no specific layout is required. The CLI honors that: if you write `add foundation ui`, you get `ui/`. If you want it under `foundations/`, ask for it explicitly with `add foundation foundations/ui`.

**Extension placement:**

Extensions always go in `extensions/{name}/` and require a name.

### Package Naming

The package name equals the name you provide (or the default `src` for foundations, `site` for sites). For `add project`, names are suffixed for workspace uniqueness: `{name}-src` and `{name}-site`. A foundation whose name a site already uses becomes `{name}-src`, and an extension whose name is taken becomes `{name}-ext`; any other collision stops the command with guidance.

A package name is a workspace name. What a foundation or extension **registers as** is `name` in its `main.js`, which `add` writes too: the name you gave, before any suffix — or, for `add foundation` with no name, the workspace's. If another foundation in the workspace already registers as that, it gets the suffixed package name instead, so no two register as one. See [`uniweb register` → Identity](#identity-scope--name).

### The `--from` Flag

The `--from` flag applies content from a template after scaffolding structure. Structural files (`package.json`, `vite.config.js`) come from the CLI; content (section types, pages, theme, and a foundation's `main.js`) comes from the template. A template's `main.js` that names no foundation is given the name `add` would have written.

```bash
# Scaffold a foundation with marketing sections
uniweb add foundation marketing --from marketing

# Scaffold a site with docs pages
uniweb add site blog --from docs --foundation marketing
```

When applying site content, the CLI reports which section types the template expects. If your foundation doesn't provide them, you'll get a build error — a clear signal of what to add.

### Examples

```bash
# Add a co-located foundation + site pair
uniweb add project docs
uniweb add project docs --from academic

# Add a foundation (first goes to root)
uniweb add foundation
uniweb add foundation ui

# Add a site wired to a specific foundation
uniweb add site blog --foundation marketing

# Add an extension and wire it to a site
uniweb add extension effects --site site

# Co-located layout via --project flag
uniweb add foundation --project docs
uniweb add site --project docs
```

### Workspace Config

The `add` command automatically updates `pnpm-workspace.yaml` with appropriate globs and updates root `package.json` scripts (`dev`, `build`, `preview`). You don't need to manage these manually.

---

## uniweb dev

Start a development server for a site.

```bash
uniweb dev                  # the workspace's single site
uniweb dev <site>           # a specific site by package name
uniweb dev --site <name>    # same, explicit flag form
```

A thin wrapper around the package manager's workspace-filtered `dev` script
(`pnpm --filter <site> dev`, or `npm -w <site> run dev`). It picks the single
site automatically. In a multi-site workspace the first site runs by default,
with a notice pointing at `--site` for explicit selection.

Markdown, `theme.yml`, and component edits hot-reload. New section types are
picked up without restarting.

---

## uniweb inspect

Print the parsed content shape of a markdown file or folder — the
`{ content, params, … }` object components actually receive. This is the fastest
way to answer "why isn't my section getting X?" without reasoning through the
parsing rules.

```bash
uniweb inspect pages/home/hero.md              # one section
uniweb inspect pages/home/                     # every section on the page
uniweb inspect pages/home/hero.md --full       # include empty fields (matches runtime)
uniweb inspect pages/home/hero.md --sequence   # include the sequence array
uniweb inspect pages/home/hero.md --raw        # the ProseMirror AST instead
```

| Option | Description |
|--------|-------------|
| `--full` | Include empty fields, matching exactly what the runtime hands the component |
| `--sequence` | Include the `sequence` array (all elements in document order) |
| `--raw` | Print the ProseMirror AST rather than the flat shape |

Paths resolve against the current working directory, so run it from the site
package (the one containing `pages/`).

---

## uniweb build

Build the current project (foundation, site, or workspace).

```bash
uniweb build [options]
```

The CLI auto-detects the project type:

| Indicator | Type |
|-----------|------|
| `src/sections/`, `src/components/`, or `src/main.js` | Foundation |
| `site.yml` or `pages/` | Site |
| `pnpm-workspace.yaml` | Workspace (builds all) |

When run at workspace root, builds all foundations first, then extensions, then sites.

### Options

| Option | Description |
|--------|-------------|
| `--target <type>` | Force build type: `foundation` or `site` |
| `--prerender` | Force static HTML generation (overrides site.yml) |
| `--no-prerender` | Skip static HTML generation (overrides site.yml) |
| `--foundation-dir <path>` | Path to foundation (for site prerendering) |
| `--platform <name>` | Deployment platform (e.g., `vercel`) |

### Foundation Build

When run in a foundation directory:

1. Discovers section types from `src/sections/` and `src/components/` (with `meta.js`)
2. Generates entry point (`_entry.generated.js`)
3. Runs Vite build
4. Processes preview images (converts to WebP)
5. Generates `meta/schema.json` with full metadata

**Output:**

```
dist/
├── entry.js            # Bundled components
├── entry.js.map        # Source map
├── meta/
│   ├── schema.json     # Component metadata
│   └── previews/       # Preview images
│       └── [Component]/
│           └── [preset].webp
└── assets/
    └── style.css       # Compiled CSS
```

```bash
cd foundation
uniweb build
```

### Site Build

When run in a site directory:

1. Runs Vite build for the site
2. If `build.prerender: true` in `site.yml`, generates static HTML for all pages

```bash
cd site
uniweb build
```

### Pre-rendering (SSG)

Pre-rendering generates static HTML at build time for fast loads and SEO.

**Enable in site.yml:**
```yaml
build:
  prerender: true
```

**Or via CLI:**
```bash
uniweb build --prerender
```

**Output:**
```
dist/
├── index.html          # Homepage
├── about.html          # /about page
├── docs/
│   └── getting-started.html
└── assets/
```

### Examples

```bash
# Build entire workspace (from root)
uniweb build

# Build foundation only
cd foundation && uniweb build

# Build site with prerendering
cd site && uniweb build --prerender

# Build for Vercel deployment
uniweb build --platform vercel
```

---

## uniweb snapshot

Compose a preview image of a site from the site itself. It opens the site in a headless browser, captures what a visitor sees, and arranges the captures on a background in the site's theme colors.

```bash
uniweb snapshot                     # build, capture, write site/public/preview.webp
uniweb snapshot --dev               # capture the dev server instead (no build)
uniweb snapshot --url https://example.com --out card.webp   # a site that is already running
```

By default the image becomes the site's card image. The command writes `site/public/preview.webp` and sets `preview: /preview.webp` in `site.yml` ([Site Configuration](site-configuration.md#identity)). It sets `preview` when `site.yml` has none, or has only the value the app records for a card image it generated. A URL or image path you wrote stays, and the command says so. `--no-set-preview` leaves `site.yml` alone.

### Requirements

The command uses the `@uniweb/snapshot` package, which a new project doesn't include. Add it once:

```bash
pnpm add -D -w @uniweb/snapshot
```

It drives a browser that is already installed, Google Chrome or Microsoft Edge, and downloads nothing. To use another Chromium, set `UNIWEB_SNAPSHOT_BROWSER` to its executable, or install one with `npx playwright-core install chromium --only-shell`.

### Layouts

| Layout | For | Shows |
|--------|-----|-------|
| `split` | pages that scroll | The first view in a browser window, beside a long strip of the page |
| `device` | pages that don't scroll as a page, such as a docs shell or an app | The page in a desktop browser window, with a phone showing it in front |

With `--layout auto` (the default), a page at least 1.6 viewports tall gets `split` and anything shorter gets `device`. With `--tone auto`, a light page goes on a deep background and a dark page on a light one.

### The look

How the two frames sit together. Lengths are pixels on a 1600×1000 image, and scale with it.

| Option | Default | Description |
|--------|---------|-------------|
| `--gap <px>` | `48` for `split` | Space between the two frames |
| `--overlap <px>` | `31` for `device` | How far they overlap instead; use `--gap` or `--overlap`, not both |
| `--strip <width>` | `fit` | `split` only: `fit`, or `1:N` for a strip one wide by N tall. A narrower strip shows more of a long page, and a short page as a smaller card |
| `--side <side>` | `right` | Where the strip or the phone goes: `right`, `left` |
| `--frame <style>` | `browser` | `browser`, a window with a title bar, or `plain` |
| `--tone <name>` | `auto` | The background: `auto`, `light`, `deep` |

### Choosing a look

What looks best depends on the site, so compare before you choose:

```bash
uniweb snapshot --compare
```

This captures the site once and puts several looks on one sheet: the current look, then one change each (spacing, strip width, side, frame, tone, and the other layout). Each look is captioned with the flags that produce it. The sheet goes to `site/.uniweb/snapshot/compare.webp`, which a new project already ignores. `site.yml` isn't touched.

Take the look you like with its flags, and add `--save` to keep it:

```bash
uniweb snapshot --strip 1:2.5 --save
```

`--save` writes this run's flags into `site/snapshot.yml`. Later runs start from that file, and flags still override it. Keep the file with the site, and anyone who runs `uniweb snapshot` gets the same look.

```yaml
# site/snapshot.yml
route: /research
strip: '1:2.5'
side: left
```

It takes the same settings as the flags, without the dashes: `route`, `layout`, `tone`, `gap`, `overlap`, `strip`, `side`, `frame`, `size`, `scale`, `quality`, `hide` (a list), and `out` (relative to the site folder). Nothing else reads this file: building and publishing the site leave it alone.

### Options

| Option | Description |
|--------|-------------|
| `<site>`, `--site <name>` | The site (default: the one you're in, or the only one) |
| `--dev` | Capture the site's dev server instead of a build |
| `--url <address>` | Capture a site that is already running |
| `--no-build` | Capture the existing `dist/` without rebuilding |
| `--route <path>` | The page to capture (default: the home page) |
| `--layout <name>` | `auto` (default), `split`, `device` |
| `--gap`, `--overlap`, `--strip`, `--side`, `--frame`, `--tone` | [The look](#the-look) |
| `--compare` | Put several looks on one sheet instead of writing the image |
| `--save` | Keep this run's flags in `site/snapshot.yml` |
| `--size <WxH>` | Image size (default `1600x1000`; `1200x630` suits social cards) |
| `--scale <n>` | `1` (default), or `2` for a double-density image |
| `--quality <n>` | Encoder quality, 1–100 (default 82) |
| `--out <file>` | Where to write the image, or with `--compare` the sheet: `.webp`, `.png`, `.jpg` or `.avif` |
| `--hide <selector>` | Hide matching elements before capturing, such as a cookie banner (repeatable) |
| `--no-set-preview` | Write the image without changing `site.yml` |

### Examples

```bash
# The card from a specific page
uniweb snapshot --route /pricing

# A narrower strip on the left, kept for next time
uniweb snapshot --strip 1:3 --side left --save

# A social image, leaving site.yml alone
uniweb snapshot --size 1200x630 --out site/public/og.png --no-set-preview

# Without the chat widget
uniweb snapshot --hide '#chat-launcher'
```

---

## uniweb docs

Generate documentation from your foundation's component schemas.

```bash
uniweb docs [subcommand] [options]
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| *(none)* | Generate `COMPONENTS.md` from foundation schema |
| `site` | Show `site.yml` configuration reference |
| `page` | Show `page.yml` configuration reference |
| `meta` | Show component `meta.js` reference |

### Options

| Option | Description |
|--------|-------------|
| `--output <file>` | Output filename (default: `COMPONENTS.md`) |
| `--from-source` | Read `meta.js` files directly instead of `schema.json` |
| `--target <path>` | Specify foundation directory |

### Generated Documentation

The `COMPONENTS.md` file includes for each component:

- Title and description
- Family (the standard section type it claims, when declared)
- Content expectations (what markdown elements it uses)
- Parameters with types, options, and defaults
- Available presets

### Examples

```bash
# Generate COMPONENTS.md in current foundation
cd foundation
uniweb docs

# Generate with custom filename
uniweb docs --output REFERENCE.md

# Generate from source (no build required)
uniweb docs --from-source

# Show site.yml reference
uniweb docs site

# Show page.yml reference
uniweb docs page

# Show meta.js reference
uniweb docs meta
```

---

## uniweb doctor

Diagnose project configuration issues.

```bash
uniweb doctor
```

The doctor command checks your workspace and reports errors and warnings. Run it from the workspace root or from any site/foundation directory.

### What It Checks

**Workspace structure:**
- Discovers all foundations, extensions, and sites

**For each site:**
- `site.yml` exists and references a valid foundation
- Foundation dependency in `package.json` (correct `file:` path)
- The installed foundation is the one in your workspace, and resolves the `@uniweb/*` versions it declares — a `file:` dependency satisfied by a copy rather than a link leaves the dev server serving code your builds never see
- Foundation is built (`dist/entry.js` exists)

**For each extension:**
- Declares `extension: true` in `main.js`
- Doesn't declare theme variables (`vars`) or layouts
- Extension is built
- Extension URLs in `site.yml` resolve to built extensions

**Cross-references:**
- Warns if a foundation with `extension: true` is wired as a primary foundation instead of listed under `extensions:` in `site.yml`

### Examples

```bash
# From workspace root
uniweb doctor

# From a site directory (finds workspace root automatically)
cd site && uniweb doctor
```

---

## uniweb validate

Check a project's file-based data against the data schemas your foundation declares for the sections that consume it.

```bash
uniweb validate [path]
```

Where `doctor` checks your project against framework conventions, `validate` checks your *data* against the contracts you declared in `meta.js` (`data: { … }`) — "does my content match what I said it should be?" A violation fails it (exit `1`); `--lax` reports without failing. It never blocks a build: the live render path stays tolerant (applies field defaults, ignores the rest), so this is a pre-ship / CI gate you run on purpose — and the one `uniweb push` and `uniweb publish` run before they send anything.

### What It Checks

For each section with a file-based data input, it resolves the schema bound to that input and checks every record — and it checks **every record file in `records/`** against the schema its folder names (`records/member/` → `@/member`), whether or not a section reads it, since a push sends them all. Each record is checked for:

- Missing **required** fields
- **Type** mismatches against the field's declared type
- Values outside an **enum**
- **Format** violations (`url`, `email`, and a `date` that is not a real `YYYY-MM-DD` day or a `datetime` that is not a day and a time)
- Nested object and array fields, recursively

A record of a `sections:` schema is checked in either shape a file can hold it: **flat** — its single sections' fields at the top of the file, the brief's first — or **written by section**, each section under its own key, a list section as a list of records and child sections included.

It does not flag unknown or extra fields, and it does not flag an absent optional field that has a default — the runtime fills those.

### Deferred

Data that isn't in your project is reported as **deferred**, never silently skipped: a remote (`url:`) source, fetched where the page renders. Validate it by pointing the source at live data. A data block whose component declares its schema inline is reported as deferred too.

Everything else with a schema is checked — a schema whose root is a list, like `@std/nav`, as the list: the records a query delivers, a data block's array, or the list a record file holds under its section's key. A reference field (`ref`) must name a record of its schema — by its file's name or `slug:` — and one that names none is reported; an `options` value is not checked against the list it names.

### Options

| Option | Description |
|--------|-------------|
| `--lax` | Report violations without failing (exit `0`) |
| `--json` | Machine-readable output for CI annotations |
| `--site <name>` | Check one site in a multi-site workspace |

Exit codes: `0` clean (or `--lax`), `1` violations, `2` setup error (e.g. not in a workspace).

### It also runs when you ship

`uniweb push` and `uniweb publish` run the same check first and **stop before sending anything** if a record doesn't conform. They register your foundation before sending content, so the backend checks the records against the very schemas checked here — a record that does not conform would be refused on arrival, or lose a value on the way. They also refuse what a push cannot carry: a field the record's schema does not declare, a markdown body with no field in the schema to hold it, and a record written by section.

`uniweb deploy` to a static host runs the check too, and **warns and carries on**. Nothing downstream enforces a schema there, and a schema can be newer than the content that was valid when it was authored — refusing to deploy over that would make your site hostage to a schema release.

The check is silent when everything conforms, and also when there's nothing to check against — a site whose `foundation:` is a registry ref or a URL has no schemas on disk. Pass `--no-validate` to any of those commands to skip it; on `push` and `publish` that leaves the records to the backend to accept or refuse.

### Examples

```bash
# Check every site in the workspace — fails (exit 1) on any violation; wire into CI
uniweb validate

# Report violations without failing
uniweb validate --lax

# Machine-readable output
uniweb validate --json

# One site in a multi-site workspace
uniweb validate --site blog
```

---

## uniweb update

Reconcile a workspace's state with the running CLI. Two convergence steps:

1. **Align workspace deps** — edit every `package.json` so `@uniweb/*` and `uniweb` versions match the CLI's bundled matrix, then run the workspace's package manager (auto-detected from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm).
2. **Refresh `AGENTS.md`** from the CLI's bundled partial.

```bash
uniweb update [options]
```

### It does not update the CLI itself

This is the part worth reading twice, because the name suggests otherwise.

`uniweb update` reconciles a project against **the version matrix of the CLI that runs it**. It never upgrades that CLI. So if the CLI is out of date, the command is a no-op that reports everything aligned — correctly, because the project matches the matrix it was asked about.

That matters most when the CLI is project-local, which is the usual case: `pnpm uniweb update` runs the copy in your `node_modules`, pinned by your own `package.json`, and that copy has no way to know a newer release exists.

To move forward:

```bash
npx uniweb@latest update    # fetch the latest CLI, align the project, and bump the pin
```

npx runs the newest published CLI, which carries its own matrix — and because the project's `uniweb` dependency is one of the deps it aligns, the pin moves too. A globally installed CLI is upgraded through its package manager instead (`npm i -g uniweb@latest`, `pnpm add -g uniweb@latest`).

When a newer CLI exists, `update` says so at the end of the run and names the command for your situation.

### Why both steps together

`AGENTS.md` is regenerated from the CLI's current partials and stamped with the CLI version. Refreshing it while the workspace's declared `@uniweb/*` deps lag the CLI silently produces a doc that documents features the installed code doesn't have. The verb's drift gate refuses that combination unless you pass `--allow-mismatch`.

### Options

| Option | Description |
|--------|-------------|
| `--deps-only` | Only align deps; skip `AGENTS.md`. |
| `--agents-only` | Only refresh `AGENTS.md`; skip deps. |
| `--no-deps` | Skip the deps-alignment step. |
| `--no-agents` | Skip the `AGENTS.md` step. |
| `--dry-run` | Print the survey and would-be writes; make no changes. |
| `--verbose` | List every surveyed dep. By default only those needing attention are listed, with the aligned ones collapsed to a count. |
| `--allow-mismatch` | Allow `AGENTS.md` to refresh even when declared deps lag. |
| `--yes` | Skip confirmation prompts. |
| `--non-interactive` | Auto-detected; never auto-installs from a script. |

### What you see

The verb prints a version survey first, regardless of flags:

```
uniweb CLI:             v0.12.15
AGENTS.md stamp:        v0.9.5

Workspace deps (declared):
  (root)/
    ✗ uniweb           ^0.9.5     → ^0.12.15    behind
  foundation/
    ✗ @uniweb/core     ^0.6.1     → ^0.7.11     behind
    ✗ @uniweb/kit      ^0.8.2     → ^0.9.11     behind
    ✗ @uniweb/build    ^0.9.4     → ^0.14.3     behind
  site/
    ✗ @uniweb/runtime  ^0.7.4     → ^0.8.13     behind
    ✗ @uniweb/build    ^0.9.4     → ^0.14.3     behind
```

Each row is one declared dep in one workspace `package.json` that needs attention — `behind` (the CLI ships a newer version) or `ahead of CLI` (left untouched, since `update` never downgrades). Deps already aligned are collapsed to a count rather than listed, because on the command's most common outcome — a no-op — every row would otherwise read `0.9.11 → 0.9.11 aligned` and bury the lines that matter. `--verbose` lists them all.

After the survey, each step prompts in TTY; `--yes` accepts the defaults; non-interactive prints the plan without mutating.

### Install failures

If the package manager's install step fails after `package.json` edits succeed, the edits are **kept**. The verb prints a `git checkout --` revert command and the install command to retry. There's no automatic rollback — install failures usually need human attention (peer-dep conflicts, lockfile contention) that hiding the diff would only obscure.

### Project-local installs

When the running CLI lives in `node_modules` (project-local), its version is pinned by your project's `package.json` — so it aligns the project to whatever matrix that pinned version carries, which may be an old one. Both steps still run; they just answer about the pinned release. `npx uniweb@latest update` is how you move off it.

### Examples

```bash
# Reconcile against the CLI you already have
uniweb update

# Reconcile against the LATEST release, and move the project's pin with it
npx uniweb@latest update

# Just align workspace deps and run install
uniweb update --deps-only

# CI: print plan without mutating, exit non-zero on drift
uniweb update --dry-run --non-interactive

# CI: align deps and refresh AGENTS.md without prompts
uniweb update --yes --non-interactive
```

---

## uniweb i18n

Manage internationalization and translations.

```bash
uniweb i18n <command> [options]
```

### Commands

| Command | Description |
|---------|-------------|
| `extract` | Extract translatable strings to manifest |
| `sync` | Update manifest with content changes |
| `status` | Show translation coverage per locale |

### Options

| Option | Description |
|--------|-------------|
| `--target <path>` | Specify site directory |
| `--verbose` | Show detailed output |
| `--dry-run` | Show changes without writing (sync only) |
| `--locale <code>` | Filter to specific locale (status only) |

### Workflow

**1. Extract strings:**
```bash
uniweb i18n extract
```

Parses all content and generates `locales/manifest.json` with translatable strings keyed by content hash.

**2. Provide translations:**

Create `locales/{locale}.json` with translations:

```json
{
  "a1b2c3d4": "Translated text here"
}
```

**3. Check coverage:**
```bash
uniweb i18n status
```

Shows which strings are translated per locale.

**4. After content changes:**
```bash
uniweb i18n sync
```

Detects changes, updates manifest, flags strings needing re-translation.

### Examples

```bash
# Extract all translatable strings
uniweb i18n extract

# Check translation status
uniweb i18n status

# Status for specific locale
uniweb i18n status --locale es

# Sync after content changes (dry run)
uniweb i18n sync --dry-run

# Sync and update manifest
uniweb i18n sync
```

---

## uniweb login

Log in to a Uniweb backend. **You are logged in to one backend at a time:** logging in to another logs you out of the first, once the new login succeeds — a cancelled or failed login leaves you where you were. The session is stored in `~/.uniweb/registry-auth.json`; `uniweb logout` removes it.

```bash
uniweb login [options]
```

### Which backend

`--backend <url>` names it. Without the flag, `login` logs in to **https://uniweb.app** (or `UNIWEB_REGISTER_URL`, when set) — to work with any other backend, name it.

⭐ **The backend you are logged in to is where the backend commands go** — `push`, `pull`, [`publish`](#uniweb-publish), `status`, `register`, `clone` — so logging in is how you switch between backends. Logging in to the backend you are already on does nothing; add `--password`, `--browser`, `--token-paste` or `--token` to log in again. No command talks to a backend you are not logged in to. A script can aim a single run elsewhere with `UNIWEB_REGISTER_URL`, without touching the login.

### Which workspace

A login works in **one workspace** — your personal one, or an organization you belong to — and every push, pull and publish works in it: a site it creates is created there, and a site kept in another workspace is refused. If you belong to no organization, it is your personal workspace. Otherwise `login` asks, or you name it with `--org @acme` or `--personal`. Already logged in, `uniweb login --org @other` switches workspace without logging in again.

### Options

| Option | Description |
|--------|-------------|
| `--backend <url>` | The backend to log in to |
| `--org @org` | Work in `@org`, an organization you belong to |
| `--personal` | Work in your personal workspace |
| `--browser` | Log in through the browser |
| `--password` | Log in with a username and password |
| `--token-paste` | Paste a token instead of opening a browser |
| `--token <bearer>` | Store this token, after the backend confirms it |

Without a method flag, `login` asks which one to use. Without a terminal it needs `UNIWEB_USERNAME` and `UNIWEB_PASSWORD`, or `--token`.

**Without a terminal** — an agent, a script — sign in with `uniweb login --backend <url> --token $TOKEN --org @acme` (or `--personal`): the token is checked against that backend before it is stored, and a login that belongs to organizations must name its workspace. To authenticate a single process without storing anything, set `UNIWEB_TOKEN` instead — with `UNIWEB_REGISTER_URL` for a backend other than the default, and `UNIWEB_WORKSPACE=@acme` (or `personal`) for its workspace. The backend commands themselves take no `--backend` or `--token`.

### Examples

```bash
# Log in to the default backend, https://uniweb.app
uniweb login

# Log in to a local development server — push, pull and publish now go there
uniweb login --backend http://localhost:8080

# Work in an organization's workspace (switches without logging in again)
uniweb login --org @acme

# Switch back to the default backend (this logs you out of the local server)
uniweb login

# Log out — of the one backend you are logged in to
uniweb logout
```

### When It's Needed

Login is required for `publish`, `register`, `push`, `pull`, `invite`, and `handoff`. The CLI prompts you to log in automatically if you run one of these commands without credentials. (`uniweb deploy --host=<adapter>` authenticates with the third-party host, not with Uniweb.)

---

## uniweb register

Register a foundation — together with the data schemas it renders — to the Uniweb registry. Re-registering ships a **new version**; a registered version is immutable.

```bash
uniweb register [options]
```

Run from a foundation directory, a workspace root (you're prompted if there are several foundations), or a **schemas-only package** — a package that exports schemas, or a bare `schemas/*.yml` folder — which registers just the data schemas (no foundation).

### Options

| Option | Description |
|--------|-------------|
| `--scope @scope` | A foundation whose name has no scope yet: register it under `@scope` — your personal scope or an organization's (resolves `@/x` → `@scope/x`) — and write the scope into its name in `main.js`. Refused when the name already carries a different scope. A schemas-only package: publish under `@scope`; default `package.json::uniweb.scope`. |
| `--schema-only` | Register the data schemas only; skip the foundation code delivery. |
| `--dry-run` | Print the `.uwx` (and the code-file plan); submit nothing. |
| `-o <file>` | Write the `.uwx` to a file; submit nothing. |
| `--json` | Porcelain: one compact JSON line on stdout (`{ok,scope,origin,entities:[{name,uuid,version,unchanged}]}`); human output to stderr. |

> Note: foundation **propagation** controls (`--propagate`) and **access policy** (`--edit-access`) from the legacy `publish` aren't wired into `register` yet — see [Propagation](#propagation-currently-silent) below. The retired `--local` flag is gone; to register on a local backend, log in to it (`uniweb login --backend <url>`).

### Identity (scope + name)

A registered foundation's name has two pieces — a **scope** (the org it's registered under) and its **name**: `@acme/marketing`. Sites pin it by that name.

#### Name

The name is **`name` in the foundation's `main.js`**, else `package.json`'s `name`:

```js
// src/main.js
export default {
  name: 'marketing',
}
```

`uniweb create` and `uniweb add` write one — the project's name, or the name you gave `add`. Lowercase letters, digits and hyphens, and — once it has one — the organization it registers under: `@acme/marketing` (see [Scope](#scope)).

**`src` and `foundation` are refused** — they name the folder the code lives in, and every project in an org would register the same one. A foundation with no other name (a project scaffolded before names moved to `main.js` has `package.json` name `src`) is asked for one the first time you register, with a suggestion made from its folder; the answer is written to `main.js`, so it is asked once. Non-interactively (`--non-interactive`, CI, `--json`) and in a preview (`--dry-run`, `-o`), `register` refuses before anything is built or sent, and prints the line to add. The same holds when `uniweb push` or `uniweb publish` releases a local foundation, since they release through `register`.

`package.json::uniweb.id` and `uniweb.scope`, which used to set the name and the scope, are no longer read for a foundation: `register` refuses them and prints the `main.js` line that replaces them.

#### Scope

A **scope** is a namespace, and **it is part of the name**: a foundation named `@acme/marketing` registers under `@acme`. So do the data schemas it defines — `@/article` registers as `@acme/article` — which is the name a site's records and queries use for them. A scope is either **your personal scope**, `@<your handle>`, which needs no organization and only you can publish into, or an **organization's**, which its members can publish into.

A name with no scope has not been registered yet. The first `register` chooses one:

1. **`--scope @scope` flag** — explicit.
2. *(real submit only)* derived from your login: your personal scope when you belong to no organization — without asking, in CI too — else a choice between it and your organizations (in CI, your personal scope, said).

…and writes it into the name in `main.js` (`name: '@acme/marketing'`), so it is chosen once and later runs need no flag. A `--scope` that names a different scope than the name's is refused; to move a foundation to another scope, change its name and register it there. A preview (`--dry-run`, `-o`) writes nothing: a name with no scope previews under `--scope`, or unscoped.

A foundation with no resolvable scope is rejected — bare `@/…` names can't be registered.

A **schemas-only package** has no `main.js` to carry a scope: it registers under `--scope @scope`, else `package.json::uniweb.scope`, else one derived from your login as above, which is then saved to `uniweb.scope`.

#### Renaming

A registered version is immutable, so there is **no registry-rename flag**. To rename:

- The **workspace package** (pnpm links, `file:` deps, `site.yml::foundation` refs) → `uniweb rename foundation <old> <new>`. It does not change what the foundation registers as, once `main.js` names it.
- The **registered name** → change `name` in `main.js` and register again; consuming sites repoint their `foundation:` ref, and the old versions stay reachable under the old name. Moving a foundation to another organization is the same act — its scope is part of its name.

### Foundation runtime policy

A foundation's build records the `@uniweb/runtime` version it actually linked against — read from `node_modules`, not chosen — into `dist/runtime-pin.json`, and `uniweb register` sends it with the foundation, so the version it built against travels with it. (What consumes that is covered below: today it is carried, not enforced.)

**There is nothing to declare for this.** Whether two runtime versions are compatible is determined by the framework, not by a per-foundation setting: a foundation author has no way to evaluate whether anything their code can reach has changed between two runtime releases.

**The escape hatch.** For the one case only a foundation author can know — the foundation reaches into undocumented runtime internals, or has been audited against exactly one runtime build and must not move — declare:

```json
{
  "name": "@myorg/foundation",
  "version": "1.0.0",
  "uniweb": {
    "runtimePolicy": "exact"
  }
}
```

That freezes sites using the foundation on the recorded version. Use it only when one of those two things is true: a frozen foundation stops receiving runtime fixes, including security ones. Sites cannot override the choice.

The field is emitted into `dist/runtime-pin.json` alongside the resolved runtime version:

```json
// dist/runtime-pin.json (auto-generated)
{ "runtime": "0.11.4", "policy": "exact" }
```

`policy` appears only when set.

> **`auto-patch` and `auto-minor` are no longer recommended.** Earlier releases documented them here, which asked foundation authors to infer a compatibility rule from framework version numbers — not a judgement they are positioned to make, and not one the version numbers reliably carried. Both values are still accepted so existing foundations keep working; neither is worth setting on a new one.

#### The pin is a compatibility floor, not a selector

This is the part that is easy to read backwards, so it is worth stating plainly.

`runtime-pin.json` **records what your build binds to**. It does not choose the runtime a site runs, and structurally it cannot: a site loads a primary foundation **plus any extensions**, and each of those emits its own pin — while a site has exactly **one** runtime. **Pins are plural; the choice is singular.** The runtime a site runs is selected by `site.yml::runtime`.

The pin's use is **validation**: checking that a site's chosen runtime satisfies the floor of *every* foundation that site loads. That is `max()` over the primary foundation's floor and each extension's — so only something holding all of them can compute it, which is why it is not done at build time.

`uniweb register` reads the pin and carries it with the foundation, so a floor stated at build time reaches whatever resolves the site later. ⚠️ **The check itself is not implemented anywhere yet** — today the floor is stated and carried, not enforced. Declare `runtimePolicy` for when it lands; don't design around it having an effect now.

#### What happens when fields aren't set

| Scenario | What happens |
|----------|--------------|
| `uniweb.runtimePolicy` not set in `package.json` | `dist/runtime-pin.json` is emitted with the runtime version and no `policy` field. This is the normal case. |
| `@uniweb/runtime` not resolvable at build time | The build skips emitting `runtime-pin.json` and succeeds. The runtime arrives transitively through `@uniweb/build`, so this only affects unusual workspace setups. |
| `runtime-pin.json` missing from a built foundation | `register` sends no floor for it. ⚠️ That means **unknown, not unconstrained** — a foundation whose floor nobody stated cannot be shown compatible with any runtime, so a validator should treat it as blocking rather than skip it. |

*(An earlier version of this page described a resolver that applied `runtimePolicy` at serve time, a publish step that rejected a foundation whose pinned runtime wasn't deployed, and a legacy fallback path for a missing pin. None of those existed. They were removed on 2026-08-06 after the pin's consumers were checked directly and found to be none.)*

### Propagation (currently silent)

Today every `register` is **silent**: the version is uploaded and stored, sites that pin it exactly resolve to it, but sites on earlier versions don't move until they re-pin.

Automatic **propagation** — a gated rollout that moves consenting sites forward (canary → a percentage → the full population, with health gates between waves) — is a registry capability being brought to `register`; the explicit opt-in control (the legacy `--propagate`) isn't wired yet. Until it lands, sites move forward by re-pinning their `foundation:` version.

*(Not via `runtimePolicy` — that governs the **runtime**, not the foundation, and as noted above it is recorded rather than consumed today. Two different artifacts, two different versions.)*

### What Happens

1. Settles the name and its scope — the scope in `main.js`'s name, else `--scope`, else one derived from your login membership, written into the name — before anything is built, so the build carries the name the foundation registers as.
2. Builds-if-stale, then reads `dist/meta/schema.json` for the foundation version and the data schemas it declares.
3. Submits a names-only `.uwx`; the registry authorizes the org scope against your membership.
4. A version already registered is **immutable** — the schema submit no-ops (the CLI resumes any unfinished code delivery; completed files are idempotent).
5. Delivers the foundation's `dist/` code (skipped by `--schema-only`).

### Examples

```bash
# Register the foundation + its data schemas under an org you belong to
uniweb register --scope @myorg

# Once main.js names it '@myorg/marketing' — the first register writes that — no flag is needed
uniweb register

# Register just the data schemas (from a foundation or a schemas-only package)
uniweb register --schema-only

# Preview the .uwx (and the code-file plan); submit nothing
uniweb register --dry-run

# Register on a local backend: log in there first
uniweb login --backend http://localhost:8080
uniweb register
```

### After Registering

```
✓ Registered @myorg/marketing@1.0.0 + 2 data schema(s)

  Working with clients:
    uniweb invite <email>    Client creates their own site with your foundation
    uniweb handoff <email>   Create a web or local site and hand it off to a client
```

---

## uniweb push

Push a site's content to the Uniweb backend — the **local → backend** direction of the git-style site-content sync. It sends two lanes: the static half (pages, sections, layout, theme, foundation ref) and the dynamic half (records).

```bash
uniweb login
uniweb push
```

Run from a site, or a workspace with one site. The **first push creates the site** (the backend mints its id and `uniweb push` records it in [`sync.json`](#which-site-this-is--syncjson)); later pushes update it.

**A push never overwrites someone else's work blind.** If the site changed on the backend since your last pull — typically an author editing in the Uniweb apps — the push is refused before anything is written, and it reports which files changed. Edits to different sections do not collide. Combine the changes with `uniweb pull --merge` (or `uniweb refresh`), then push again; `--force` overwrites the backend's changes deliberately.

When the site uses a local foundation whose code changed since its last release, push brings it along the way `publish` does — it releases the code before the content goes up, because the Uniweb apps can only open a site against a released foundation. `--no-release` sends the content against the version already released.

A registered version never changes, so changed code is released under a new one: when the foundation's `package.json` still names the registered version, push releases the change as the next version (`1.4.2` → `1.4.3`) and writes that version into `package.json` — commit it. Unchanged code is not released again. The version picked is always the next patch (a pre-release gets its next pre-release); for a change that is not backwards compatible, set a higher minor or major version in `package.json` yourself before you push.

If the registry holds a version *newer* than yours — released from another copy of the project — push stops before sending anything, since your copy may not have that release's code. Pull the change first, or pass `--bump` to release yours above it.

### The workspace you work in — and who owns a new site

Every push, pull and publish works in **one workspace**: your personal one, or an organization's. It is chosen when you log in (see [`uniweb login`](#uniweb-login)), and it decides two things:

- **A site a push or publish creates is created there** — owned by it, with its storage billed to it — and that is not editable from the CLI afterwards. The command says where before it creates anything.
- **A site kept in another workspace stops the command**, which names that workspace and how to switch — rather than acting in the wrong one.

To work in another workspace for a single command, name it:

```bash
uniweb push --org @acme     # work in @acme for this push
uniweb push --personal      # work in your personal workspace for this push
```

### Which site this is — `sync.json`

The first push to a backend records what that backend assigned — the site's id, its owner, the ids of its records and uploaded files — in `sync.json`, beside `site.yml`. **Commit it**: it is how a teammate's clone reaches the same site instead of creating a second one. The CLI writes it; you never edit it.

A project can sync with more than one backend — say, a local development server and production. Each gets its own section of `sync.json`, so the two sites never mix. **`push`, `pull` and `publish` go to the backend you are logged in to** — see [`uniweb login`](#uniweb-login); a script can aim a single run with `UNIWEB_REGISTER_URL`. They never talk to a backend you are not logged in to: logged in nowhere, they ask you to log in first, to https://uniweb.app unless you name another. If the backend they go to has no site for this project while it has one elsewhere, `push` and `publish` say so before creating a new site there.

Record files keep their own `$uuid`. It is the record's id in your project, not any backend's, and `sync.json` maps it to each backend's id for the same record.

### Copying a project

A copy made with `cp -r` carries the original's `sync.json`, so its first push would update the **original's** site. To start a new site from a copy, run [`uniweb forget --all`](#uniweb-forget) in the copy first.

Until you do, a push or publish from either of the two is refused when both are in the same workspace:

```
✗ Another project in this workspace holds the same site on https://uniweb.app:
    ../my-site
  One of them is a copy of the other, so a push from either one updates that site.
  In the copy, run:  uniweb forget --all
```

A copy placed outside the workspace cannot be told apart from a teammate's clone — both hold the same site, and for the clone that is correct — so there, running the command is up to you. `uniweb create --template` never copies a template's `sync.json` or `deploy.yml`: a project made from a template always starts as a new site.

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Report what would be pushed; submit nothing |
| `-o <file>` | Write the `.uwx` package(s) instead of submitting |
| `--org @org` | Work in `@org` for this push, instead of your login's workspace — see [the workspace you work in](#the-workspace-you-work-in--and-who-owns-a-new-site) |
| `--personal` | Work in your personal workspace for this push |
| `--all` | Send every record (bypass the changed-only cache) |
| `--force` | Overwrite changes made on the backend since your last pull, instead of refusing |
| `--no-release` | Send the content against the foundation version already released; release nothing |
| `--bump` | When the registry holds a newer version of the foundation than yours, release yours above it instead of stopping |
| `--foundation <dir>` | Use this local foundation for the data-schema shape |
| `--no-validate` | Skip the content-conformance check, which stops a push whose records do not conform — see [`uniweb validate`](#uniweb-validate) |

`uniweb push` sends content but does **not** make it live — run `uniweb publish` afterward. (`uniweb publish` can also bring everything along itself — foundation, content, go-live — in one step.)

---

## uniweb pull

Bring the backend's copy of a site back down to local files — the **backend → local** direction, the read-side mirror of `uniweb push`. It projects the returned content to `site.yml`/`theme.yml`, `pages/**`, and the record files.

```bash
uniweb login
uniweb pull
```

Pull is a checkout, not a merge: it rewrites your files to match the backend, **deleting** pages and sections that no longer exist there (guarded so an empty payload never wipes the tree). A project that was never pushed has no id to pull by — pull is a no-op with a clear message.

Because it overwrites, **pull refuses while you have uncommitted changes** under the files it rewrites. Commit or stash them first — then your work is in git either way. Outside a git repository, pull asks before overwriting, and refuses when it cannot ask.

To keep your local work instead, use `--merge`. It three-way merges your changes with the backend's, using the committed version of each file as the common ancestor: edits to different parts of a file combine silently, and only a genuine overlap gets conflict markers — in which case pull exits non-zero, so `uniweb pull --merge && uniweb push` never pushes conflict markers. `--merge` needs a git repository.

### Options

| Option | Description |
|--------|-------------|
| `--merge` | Three-way merge your uncommitted changes with the backend's, instead of refusing |
| `--force` | Discard your uncommitted changes and take the backend's version |
| `--no-delete` | Project, but keep local files that have no backend item |
| `--no-records` | Pull pages only; skip the records lane |
| `--no-assets` | Don't download media files the project doesn't have yet; the content keeps their URLs. `assets.download: false` in `site.yml` makes this the project's default |
| `--dry-run` | Report what it would fetch; write nothing |
| `--org @org` | Work in `@org` for this pull, instead of your login's workspace |

---

## uniweb refresh

Catch up with everything outside your working copy: your teammates' commits on the git remote **and** content authors' edits on the backend. Running only `git pull` misses every edit made in the Uniweb apps; running only `uniweb pull` misses your teammates.

```bash
uniweb refresh
```

It runs `git pull` first, then `uniweb pull --merge`, and ends by reporting what it checked, what it skipped, and whether you have unpushed changes. It **never pushes** — it cannot ship anything, so it is safe to run at the start of every working session. It stops if `git pull` fails, and exits non-zero if the merge leaves conflicts.

### Options

| Option | Description |
|--------|-------------|
| `--no-git` | Skip the git remote; backend only |
| `--no-backend` | Skip the backend; git only |

---

## uniweb sync

Catch up, then share: `uniweb refresh` followed by `uniweb push`, and nothing more — `uniweb refresh && uniweb push` behaves identically. If the refresh leaves conflicts, sync stops before pushing.

```bash
uniweb sync
```

It does **not** publish: your changes reach the backend's draft, and going live stays a separate step (`uniweb publish`). Not to be confused with `uniweb i18n sync`, which updates the translation manifest.

### Options

`sync` accepts the options of both halves. The common ones:

| Option | Description |
|--------|-------------|
| `--no-git` | Skip the git remote half of the refresh |
| `--force` | Passed to the push only: overwrite changes made on the backend since your last pull |

---

## uniweb clone

Materialize a backend site as a **brand-new local file project** — the "git clone" of the site-content model. Use it to bootstrap a project from a site that already lives on the backend (typically authored in the Uniweb apps).

```bash
uniweb login
uniweb clone <site-uuid> [name|.]
```

`clone` scaffolds a full site package whose foundation is loaded by URL (the site carries its own foundation ref), records the site's id in `sync.json`, installs dependencies, and then runs the project-local `uniweb pull` to fill in the content. Sites are private — authenticate with `uniweb login` first.

### Options

| Option | Description |
|--------|-------------|
| `<name>` / `.` | New workspace named `<name>`, or `.` for in-place / the current workspace |
| `--path <dir>` | Place the site under `<dir>/` (segregated layout) |
| `--project <dir>` | Co-locate as `<dir>/site` |
| `--no-records` | Pull pages only; skip records |
| `--org @org` | Work in `@org` for this clone, instead of your login's workspace |

---

## uniweb publish

Publish a site to **Uniweb hosting** — the smart path for going live. Run it from a site directory and it resolves which site, **brings the foundation along** (releasing the site's local foundation to the catalog under your `@org` when its code changed), syncs the content, and makes the site live. This is the command to reach for when you mean *"make my site live."*

```bash
uniweb login
uniweb publish
```

`publish` pushes your local content first — the same push as `uniweb push`, refused the same way if the site changed on the backend since your last pull — and then makes the backend's current version live, including edits made in the Uniweb apps. What goes live is always the backend's copy of the site, whether the publish comes from the CLI or from the apps.

The **first** publish of a site also creates it on the backend, in the workspace you work in — see [the workspace you work in](#the-workspace-you-work-in--and-who-owns-a-new-site) under `uniweb push`.

### Where it goes: the backend you are logged in to

`uniweb publish` goes live on **the backend you are logged in to** — the one you last chose with [`uniweb login`](#uniweb-login), as `push` and `pull` do. To go live somewhere else, log in there (`uniweb login --backend <url>`); a script can aim a single run with `UNIWEB_REGISTER_URL`. Not logged in, it asks you to log in first — to https://uniweb.app unless you pass `--backend`.

The publish is recorded in `deploy.yml` under the target for that backend. If no target names it, one is added, named after the backend (`localhost:8080`, say); your `default:` and other targets are left alone. `uniweb deploy --host=uniweb` is `uniweb publish`, so it goes to the same place. A Uniweb target's `backend:` in `deploy.yml` records where that target's publishes went; it does not route. Naming one whose backend is not the one you are logged in to (`uniweb deploy --target staging`) is refused — log in there first.

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Resolve everything; release, sync and publish nothing. |
| `--yes` | Skip confirmations (CI); never block on a prompt. |
| `--force` | Overwrite changes made on the backend since your last pull, instead of refusing — as `uniweb push --force`. |
| `--no-release` | Ship the content against the foundation version already released; release nothing. Refused if the foundation was never released. |
| `--bump` | When the registry holds a newer version of the foundation than yours, release yours above it instead of stopping — as [`uniweb push --bump`](#uniweb-push). |
| `--no-save` | Skip recording this publish in `deploy.yml`. |
| `--no-validate` | Skip the content-conformance check, which stops a publish whose records do not conform — see [`uniweb validate`](#uniweb-validate). |
| `--org @org` | Work in `@org` for this publish, instead of your login's workspace. |
| `--personal` | Work in your personal workspace for this publish. |

> **Unknown flags are rejected.** `uniweb publish`, `push`, `pull`, `refresh`, `sync`, `clone`, `register`, `status`, and `forget` exit with an error on a flag they do not recognize, rather than ignoring it. `--backend` and `--token` are not flags of these commands: they go to the backend you are logged in to, with that login's session, and passing either is rejected with a pointer to `uniweb login`.

---

## uniweb status

Show how a site's local files compare to the Uniweb backend — its **sync identity**, **unpushed content**, and the **foundation** it references. Local and offline by default: it runs the same emit + diff as `push`, with no backend round-trip.

```bash
uniweb status
uniweb status --json     # { synced, uuid, foundation, changed, unchanged }
```

Run from a site, or a workspace with one site. The content diff is exactly what `uniweb push` would send — so `changed: 0` means a `push` would be a no-op.

*(Richer signals — whether a newer foundation version is registered, and whether the synced draft differs from what's live — are added as the backend exposes them.)*

---

## uniweb forget

Remove what this project recorded about where it synced — **local files only**. Every site stays where it is on its backend.

```bash
uniweb forget --backend <url>    # one backend
uniweb forget --all              # everything — for a copy that should become a new project
```

**`--backend <url>`** removes that backend's section of `sync.json` and of the local cache, and the records of past publishes to it in `deploy.yml`. Its targets in `deploy.yml` stay — a target is where you chose to ship — so the next push or publish there creates a new site. Other backends are untouched. Use it when you are done with a backend: a scratch server you pushed a template to, or one you will start over on.

**`--all`** deletes `sync.json`, `deploy.yml` and the local cache: everything that names the sites and destinations of the project this one was copied from. `deploy.yml` goes whole, targets included, because a copy's targets are the original's destinations. To duplicate a project:

```bash
cp -r my-site my-site-2
cd my-site-2
uniweb forget --all
```

The next push from the copy creates a new site. Neither form touches `site.yml` or your record files — a record's `$uuid` is its own id, not a backend's.

`--backend` is required even when the project has synced with only one backend: forgetting a backend you still use means its next push creates a second site there, so you name it. Both forms are safe to repeat; nothing recorded means nothing to do.

⚠️ `sync.json` and `deploy.yml` are committed files. If you run `--all` in the original by mistake, restore them from git.

---

## uniweb invite

Create, list, revoke, and resend foundation invites.

```bash
uniweb invite <email> [options]
uniweb invite --list
uniweb invite --revoke <inviteId>
uniweb invite --resend <inviteId>
```

Invites let you authorize a client to create sites with your foundation. When the client creates a site using your foundation, their license is granted automatically.

Run from a foundation directory or workspace root.

### Options

| Option | Description |
|--------|-------------|
| `--uses <n>` | Maximum number of times the invite can be used (default: 1) |
| `--expires <days>` | Days until the invite expires (default: 30) |
| `--version <n>` | Major version to authorize (default: current) |
| `--list` | List all invites for your foundation |
| `--revoke <id>` | Revoke an invite by ID |
| `--resend <id>` | Resend an invite by ID |
| `--backend <url>` | Use a specific backend origin |

### Examples

```bash
# Create a single-use invite (default)
uniweb invite client@example.com

# Create a multi-use invite (e.g., for a team)
uniweb invite team@company.com --uses 5

# Create an invite that expires in 60 days
uniweb invite client@example.com --expires 60

# List all invites
uniweb invite --list

# Revoke an invite
uniweb invite --revoke abc-123

# Resend an invite
uniweb invite --resend abc-123
```

### Output

```
✓ Invite created

  ID:       abc-123
  To:       client@example.com
  For:      my-foundation v1
  Uses:     1
  Expires:  2025-03-15
  Link:     https://hub.uniweb.app/invite/abc-123

  When client@example.com creates a site with my-foundation
  on hub.uniweb.app or Studio, it will be authorized automatically.
```

The link opens a landing page where the client can create their site using the web app or download Uniweb Studio.

---

## uniweb handoff

Create a site record and transfer ownership to a client.

```bash
uniweb handoff <email> [options]
```

Use this when you build a site for a client and want to hand it off — the client receives a licensed, registered site ready to use.

Run from a foundation directory or workspace root.

### Options

| Option | Description |
|--------|-------------|
| `--site <id>` | Specify a site ID (default: auto-generated) |
| `--web` | Show web-based handoff instructions instead of running the API flow |
| `--backend <url>` | Use a specific backend origin |

### What Happens

1. Creates a site record on the backend with your foundation
2. Auto-grants a license (you own the foundation)
3. Transfers ownership to the client's email
4. Shows next steps for sharing the site files

### Examples

```bash
# Hand off to a client (auto-generates site ID)
uniweb handoff client@example.com

# Hand off with a specific site ID
uniweb handoff client@example.com --site acme-corp

# Show web-based handoff instructions
uniweb handoff client@example.com --web
```

### Output

```
✓ Site created and transferred

  Site:        my-foundation-a1b2c3
  Foundation:  my-foundation v1
  Owner:       client@example.com
  License:     ✓ granted

  Next steps:
    1. Add id: my-foundation-a1b2c3 to your site.yml
    2. Share the site files with client@example.com
       (git repo, zip, shared drive — any method works)
    3. Client opens the project in Uniweb Studio
```

### Invite vs Handoff

| | Invite | Handoff |
|---|---|---|
| **Who creates the site** | Client | Developer |
| **Client starts with** | A blank site with the foundation | A populated site with content |
| **When to use** | Client wants to build their own content | Developer builds the site for the client |

---

## uniweb deploy

Ship a site to a host. Run it with no destination configured and it asks:

```
? Where should this site go?
❯   GitHub Pages · free, CI on push
    Cloudflare Pages · free, CI on push
    Netlify · free, CI on push
    Vercel · free tier, CI on push
    S3 + CloudFront · your AWS account
    Uniweb Cloud · paid, dynamic + visual editing
    Somewhere else · export a folder
```

Pick a host and it asks *how* — set up a workflow so every push deploys, or upload from this machine now. **Uniweb Cloud** runs [`uniweb publish`](#uniweb-publish); **Somewhere else** runs [`uniweb export`](./deployment.md). Your answer is recorded in `deploy.yml`, so later runs go straight there.

```bash
uniweb deploy [options]
```

Run from a site directory or workspace root. If the workspace has multiple sites, you're prompted to choose one.

### Options

| Option | Description |
|--------|-------------|
| `--host <adapter>` | The host to ship to: `github-pages`, `cloudflare-pages`, `netlify`, `vercel`, `s3-cloudfront`. `--host=uniweb` delegates to [`uniweb publish`](#uniweb-publish). Overrides the target in `deploy.yml`. |
| `--host` (no value) | Open the wizard, even when `deploy.yml` records a target. |
| `--target <name>` | Pick a named target from `deploy.yml` (default: its `default:` field). |
| `--dry-run` | Show what would be deployed without deploying. |
| `--no-save` | Skip recording this deploy under `deploys:` in `deploy.yml`. |
| `--no-validate` | Skip the content-conformance check. For a static host it only warns; `--host=uniweb` is `uniweb publish`, which stops on it — see [`uniweb validate`](#uniweb-validate). |

### How the destination is resolved

First match wins, and nothing is assumed when they all miss:

1. `--host <name>` — explicit.
2. `--host` with no value — an explicit "ask me"; opens the wizard even if `deploy.yml` has a target.
3. `--target <name>` — a named target from `deploy.yml`.
4. `deploy.yml`'s `default:` target.
5. Nothing configured — the wizard asks. Non-interactively, `deploy` exits with the list of real options rather than picking one for you.

### What Happens

1. Resolves the destination (above) and validates the adapter and its required config.
2. Builds a self-contained `dist/` with the adapter's `postBuild` hook (e.g. `_redirects`, `.nojekyll`, `cloudfront-function.js`). The foundation is bundled into the site's `dist/` — there is no separate foundation step.
3. Hands `dist/` to the adapter's `deploy` hook, which drives that host's own CLI — `wrangler`, `netlify`, `vercel`, `aws`, or `git` for GitHub Pages. A missing tool or credential surfaces as a message naming exactly what to install or export.

### Examples

```bash
# Ask where this site should go
uniweb deploy

# Push straight to a host
uniweb deploy --host=cloudflare-pages
uniweb deploy --host=s3-cloudfront

# Preview what would be deployed
uniweb deploy --host=cloudflare-pages --dry-run

# Set it up to deploy on every push instead
uniweb add ci --host=cloudflare-pages
```

### Configuring the destination in `deploy.yml`

Destination config lives in **`deploy.yml`, a sibling of `site.yml`** — not in `site.yml` itself. Safe to commit.

```yaml
# site/deploy.yml
default: production
targets:
  production:
    host: s3-cloudfront
    bucket: my-bucket
    distributionId: E1ABC...
    region: us-east-1
    profile: my-aws-profile    # optional; sets AWS_PROFILE for the subprocess
  preview:
    host: cloudflare-pages
    projectName: my-site-preview
```

Each adapter reads its own keys: `bucket` / `distributionId` / `region` for `s3-cloudfront`, `projectName` for `cloudflare-pages`, `siteId` for `netlify`, `branch` for `github-pages`.

**Credentials are never read from `deploy.yml`** — it's a committed file. Host tokens come from the environment (`CLOUDFLARE_API_TOKEN`, `NETLIFY_AUTH_TOKEN`, `VERCEL_TOKEN`, the AWS credential chain) or from that host's own login session.

`deploy` also maintains a `deploys:` block recording when each target was last shipped to, and its URL where the host reports one. Turn that off per-run with `--no-save`, or permanently with `saveDeploys: false`.

### Static Hosting Alternative

For hosts not covered by a built-in adapter, use `uniweb export` to produce `dist/` and upload manually — see [Deployment](./deployment.md) for per-host recipes.

---

## Project Structure

The CLI produces these workspace layouts:

### Default (create)

```
my-project/
├── src/                 # React components — the foundation package
│   ├── main.js          # Foundation declarations (vars, defaultLayout, props, …)
│   ├── styles.css
│   ├── sections/
│   ├── components/
│   ├── package.json     # name: "src"
│   └── vite.config.js
├── site/                # Content and configuration
│   ├── pages/
│   ├── layout/
│   ├── site.yml
│   ├── theme.yml
│   └── package.json
├── package.json
└── pnpm-workspace.yaml
```

### After Growing with `add`

```
my-project/
├── src/                    # Original foundation (name: "src")
├── site/                   # Original site
├── foundations/
│   └── blog/               # Added: uniweb add foundation blog
├── sites/
│   └── docs/               # Added: uniweb add site docs
├── extensions/
│   └── effects/            # Added: uniweb add extension effects
├── package.json
└── pnpm-workspace.yaml
```

### Co-located Layout (add project)

```
my-workspace/
├── marketing/
│   ├── src/                # name: "marketing-src"
│   └── site/               # name: "marketing-site"
├── docs/
│   ├── src/                # name: "docs-src"
│   └── site/               # name: "docs-site"
├── package.json
└── pnpm-workspace.yaml
```

Created with `uniweb add project marketing` and `uniweb add project docs`, or equivalently with `--project` flags on individual `add foundation`/`add site` commands.

---

## Environment Detection

The CLI auto-detects context:

| Directory Contains | Detected As |
|-------------------|-------------|
| `src/sections/`, `src/components/`, or `src/main.js` | Foundation |
| `site.yml` or `pages/` | Site |
| `pnpm-workspace.yaml` | Workspace (builds all) |

Workspace builds discover foundations, extensions, and sites by scanning the glob patterns in `pnpm-workspace.yaml`. Standard patterns (`foundation`, `foundations/*`, `*/foundation`, etc.) are all supported — the build checks each matched directory for foundation or site markers.

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (invalid arguments, build failure, etc.) |

---

## See Also

- [Site Configuration](./site-configuration.md) — `site.yml` reference
- [Page Configuration](./page-configuration.md) — `page.yml` reference
- [Component Metadata](./component-metadata.md) — `meta.js` reference
- [Internationalization](../development/internationalization.md) — Translation workflow
- [Publishing and Clients](../development/publishing-and-clients.md) — Full developer-to-client workflow
- [Deployment](./deployment.md) — Static hosting and platform deployment
