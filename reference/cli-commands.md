# CLI Commands Reference

The Uniweb CLI (`uniweb`) scaffolds projects, builds foundations and sites, generates documentation, diagnoses issues, and manages translations.

## Quick Reference

```bash
uniweb create [name]           # Create a new project (default: starter)
uniweb add <type> [name]       # Add a project, foundation, site, or extension
uniweb dev                     # Start a dev server for a site
uniweb build                   # Build the current project
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
uniweb clone <site-uuid>       # Start a local project from a backend site
uniweb status                  # Show a site's sync state (unpushed content)
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

**Naming.** The project name comes from the cwd basename, slugified to a valid npm name (`MyProject` → `myproject`, `my_site` → `my-site`). If the slug is empty, the verb errors and asks you to pass `--name=<slug>` explicitly.

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
| `international` | Multilingual site with i18n, blog, and collections |
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

The package name equals the name you provide (or the default `src` for foundations, `site` for sites). For `add project`, names are suffixed for workspace uniqueness: `{name}-src` and `{name}-site`. If a package name already exists in the workspace, the CLI stops with guidance instead of auto-renaming.

### The `--from` Flag

The `--from` flag applies content from a template after scaffolding structure. Structural files (`package.json`, `vite.config.js`, `main.js`) come from the CLI; content (section types, pages, theme) comes from the template.

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
| `--shell` | Build site without embedded content (for dynamic backend serving) |

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

### Shell Mode

The `--shell` flag builds a site without embedded content — no `__SITE_CONTENT__`, no `__FOUNDATION_CONFIG__`, no theme CSS in HTML. This produces a shell that a dynamic backend can populate at request time.

```bash
UNIWEB_BASE=/sites/marketing/ uniweb build --shell
```

Shell mode forces runtime foundation linking (import maps) and skips prerender.

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

# Build shell for dynamic backend
uniweb build --shell
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
- Category and purpose
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

Where `doctor` checks your project against framework conventions, `validate` checks your *data* against the contracts you declared in `meta.js` (`data: { … }`) — "does my content match what I said it should be?" It warns by default and never blocks a build on its own: the live render path stays tolerant (applies field defaults, ignores the rest), so this is a pre-ship / CI gate you run on purpose.

### What It Checks

For each section with a file-based data input, it resolves the schema bound to that input and checks every record for:

- Missing **required** fields
- **Type** mismatches against the field's declared type
- Values outside an **enum**
- **Format** violations (`url`, `email`)
- Nested object and array fields, recursively

It does not flag unknown or extra fields, and it does not flag an absent optional field that has a default — the runtime fills those.

### Deferred

Inputs that can't be resolved from static files are reported as **deferred**, never silently skipped: remote (`url:`) sources, entity references (`ref` / `options`), and rich `sections`-form schemas. Validate these by pointing the source at live data.

### Options

| Option | Description |
|--------|-------------|
| `--strict` | Treat findings as errors (non-zero exit) — for CI |
| `--json` | Machine-readable output for CI annotations |
| `--site <name>` | Check one site in a multi-site workspace |

Exit codes: `0` clean (or warnings only), `1` violations under `--strict`, `2` setup error (e.g. not in a workspace).

### It also runs when you ship

`uniweb publish`, `uniweb push` and `uniweb deploy` run the same check and print a short summary if anything doesn't conform. **They warn and carry on** — the ship is never blocked, and the full report stays here.

That split is deliberate. A schema can be newer than the content that was valid when it was authored, so a finding means the two disagree, not that your content is wrong; refusing to publish over that would make your site hostage to a schema release. The gate is `--strict`, and CI is where it belongs.

The check is silent when everything conforms, and also when there's nothing to check against — a site whose `foundation:` is a registry ref or a URL has no schemas on disk. Pass `--no-validate` to any of those commands to skip it.

### Examples

```bash
# Check every site in the workspace
uniweb validate

# Fail (exit 1) on any violation — wire into CI
uniweb validate --strict

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

Authenticate with the Uniweb platform. Stores credentials at `~/.uniweb/auth.json`.

```bash
uniweb login [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--token-paste` | Skip browser, paste token manually |

### How It Works

The CLI uses a browser-based login flow:

1. Starts a temporary HTTP server on a random localhost port
2. Opens your browser to the Uniweb login page
3. You log in using any method (email/password, Google, or Microsoft)
4. After login, the browser redirects to the CLI's localhost callback with a JWT
5. The CLI stores the token at `~/.uniweb/auth.json`

If the browser can't open, falls back to manual token paste. Tokens are valid for 30 days.

### Examples

```bash
# Log in via browser (default)
uniweb login

# Fall back to manual token paste
uniweb login --token-paste
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
| `--scope @org` | Register under organization `@org` (resolves `@/x` → `@org/x`). Default: `package.json::uniweb.scope`. |
| `--schema-only` | Register the data schemas only; skip the foundation code delivery. |
| `--dry-run` | Print the `.uwx` (and the code-file plan); submit nothing. |
| `-o <file>` | Write the `.uwx` to a file; submit nothing. |
| `--json` | Porcelain: one compact JSON line on stdout (`{ok,scope,origin,entities:[{name,uuid,version,unchanged}]}`); human output to stderr. |
| `--registry <url>` (alias `--backend`) | Submit to a specific registry origin. |
| `--token <bearer>` | Submit with this bearer; skips `uniweb login`. |

> Note: foundation **propagation** controls (`--propagate`) and **access policy** (`--edit-access`) from the legacy `publish` aren't wired into `register` yet — see [Propagation](#propagation-currently-silent) below. The retired `--local` flag is gone; target a local registry with `--registry <url>` or `UNIWEB_REGISTER_URL`.

### Identity (scope + id)

A registered foundation has two identity pieces — a **scope** (the org it's registered under) and an **id** (its name). They resolve independently.

#### Scope

`register` catalogs the foundation under an **organization scope** (`@org/`) you belong to:

1. **`--scope @org` flag** — explicit.
2. **`package.json::uniweb.scope`** — the persisted default.
3. *(real submit only)* derived from your login membership.

A foundation with no resolvable scope is rejected — bare `@/…` names can't be registered. Set `uniweb.scope`, pass `--scope @org`, or use a scoped `package.json::name`.

#### ID

The id is the bare name segment — what comes after the slash in `@org/<id>`. It is the **sigil-stripped `package.json::name`**: a scoped name like `@acme/marketing` carries both id and scope; a bare name like the scaffold default `src` gets the chosen scope prepended. `package.json::uniweb.id` records the registered id when you want it to differ from the workspace name.

There is **no interactive name prompt and no `--name` flag** — the id follows `package.json`.

#### Renaming

A registered version is immutable, so there is **no registry-rename flag**. To rename:

- The **workspace package** (pnpm links, `file:` deps, `site.yml::foundation` refs) → `uniweb rename foundation <old> <new>`.
- The **registered identity** → register under the new name; consuming sites repoint their `foundation:` ref, and the old versions stay reachable.

`package.json::name` is a workspace concern; the registered id is a registry concern — keeping them separate (via `uniweb.id`) means a workspace rename never disturbs the registry, and vice versa.

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

1. Builds-if-stale, then reads `dist/meta/schema.json` for the foundation version and the data schemas it declares.
2. Resolves the scope (`--scope` → `uniweb.scope` → login membership) and the id (the scoped `package.json::name`).
3. Submits a names-only `.uwx`; the registry authorizes the org scope against your membership.
4. A version already registered is **immutable** — the schema submit no-ops (the CLI resumes any unfinished code delivery; completed files are idempotent).
5. Delivers the foundation's `dist/` code (skipped by `--schema-only`).

### Examples

```bash
# Register the foundation + its data schemas under an org you belong to
uniweb register --scope @myorg

# With "@myorg/marketing" as package.json::name (or uniweb.scope set), no flag is needed
uniweb register

# Register just the data schemas (from a foundation or a schemas-only package)
uniweb register --schema-only

# Preview the .uwx (and the code-file plan); submit nothing
uniweb register --dry-run

# Submit to a specific registry origin
uniweb register --registry http://localhost:8080
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

Push a site's content to the Uniweb backend — the **local → backend** direction of the git-style site-content sync. It sends two lanes: the static half (pages, sections, layout, theme, foundation ref) and the dynamic half (collections).

```bash
uniweb login
uniweb push
```

Run from a site, or a workspace with one site. The **first push creates the site** (the backend mints its id and `uniweb push` writes it into `site.yml::$uuid`); later pushes update it. Push is last-write-wins.

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Report what would be pushed; submit nothing |
| `-o <file>` | Write the `.uwx` package(s) instead of submitting |
| `--as-org @org` | Act as `@org` (membership-gated) |
| `--all` | Send every record (bypass the changed-only cache) |
| `--foundation <dir>` | Use this local foundation for the data-schema shape |
| `--registry <url>` | Override the backend origin |
| `--token <bearer>` | Submit with this bearer (skips `uniweb login`) |
| `--no-validate` | Skip the content-conformance check (it only warns; see below) |

`uniweb push` sends content but does **not** make it live — run `uniweb publish` afterward. (`uniweb publish` can also bring everything along itself — foundation, content, go-live — in one step.)

---

## uniweb pull

Bring the backend's copy of a site back down to local files — the **backend → local** direction, the read-side mirror of `uniweb push`. It projects the returned content to `site.yml`/`theme.yml`, `pages/**`, and the collection files.

```bash
uniweb login
uniweb pull
```

Pull is git-pull-like: it reconciles your working tree to the backend, **deleting** pages and sections that no longer exist there (guarded so an empty payload never wipes the tree). A project that was never pushed has no id to pull by — pull is a no-op with a clear message.

### Options

| Option | Description |
|--------|-------------|
| `--no-delete` | Project, but keep local files that have no backend item |
| `--no-collections` | Pull pages only; skip the collections lane |
| `--dry-run` | Report what it would fetch; write nothing |
| `--registry <url>` | Override the backend origin |
| `--token <bearer>` | Read with this bearer (skips `uniweb login`) |

---

## uniweb clone

Materialize a backend site as a **brand-new local file project** — the "git clone" of the site-content model. Use it to bootstrap a project from a site that already lives on the backend (typically authored in the Uniweb apps).

```bash
uniweb login
uniweb clone <site-uuid> [name|.]
```

`clone` scaffolds a full site package whose foundation is loaded by URL (the site carries its own foundation ref), seeds `site.yml::$uuid`, installs dependencies, and then runs the project-local `uniweb pull` to fill in the content. Sites are private — authenticate with `uniweb login` first.

### Options

| Option | Description |
|--------|-------------|
| `<name>` / `.` | New workspace named `<name>`, or `.` for in-place / the current workspace |
| `--path <dir>` | Place the site under `<dir>/` (segregated layout) |
| `--project <dir>` | Co-locate as `<dir>/site` |
| `--no-collections` | Pull pages only; skip collection records |

---

## uniweb publish

Publish a site to **Uniweb hosting** — the smart path for going live. Run it from a site directory and it resolves which site, **brings the foundation along** (releasing the site's local foundation to the catalog under your `@org` when its code changed), syncs the content, and makes the site live. This is the command to reach for when you mean *"make my site live."*

```bash
uniweb login
uniweb publish
```

`publish` also promotes edits made through the Uniweb apps since your last sync. If you have unpushed local content, it warns and asks before going live; run `uniweb push` first if you want to be explicit about sending local edits. A site that was never synced has no `site.yml::$uuid`, and `publish` says so.

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Resolve everything (runtime, languages); POST nothing. |
| `--no-verify` | Skip the unpushed-content pre-flight prompt (also `--yes` / `--force`). |
| `--backend <url>` | Override the backend origin. |
| `--token <bearer>` | Auth bearer; skips `uniweb login`. |

Interactively, if you have unpushed local content `publish` warns and asks before going live (since it publishes the *backend's* current state, not your local files).

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
| `--registry <url>` | Use a specific registry URL |

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
| `--registry <url>` | Use a specific registry URL |

### What Happens

1. Creates a site record on Unicloud with your foundation
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

Pick a host and it asks *how* — set up a workflow so every push deploys, or upload from this machine now. **Uniweb Cloud** runs [`uniweb publish`](#uniweb-publish); **Somewhere else** runs [`uniweb export`](#uniweb-export). Your answer is recorded in `deploy.yml`, so later runs go straight there.

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
| `--no-save` | Skip the auto-save of `lastDeploy` in `deploy.yml`. |
| `--no-validate` | Skip the content-conformance check (it only warns; see [`uniweb validate`](#uniweb-validate)). |

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

`deploy` also maintains a `lastDeploy:` block recording when each target was last shipped to, and its URL where the host reports one. Turn that off per-run with `--no-save`, or permanently with `autoSave: off`.

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
