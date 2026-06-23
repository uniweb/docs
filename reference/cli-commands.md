# CLI Commands Reference

The Uniweb CLI (`uniweb`) scaffolds projects, builds foundations and sites, generates documentation, diagnoses issues, and manages translations.

## Quick Reference

```bash
uniweb create [name]           # Create a new project (default: starter)
uniweb add <type> [name]       # Add a project, foundation, site, or extension
uniweb build                   # Build the current project
uniweb docs                    # Generate component documentation
uniweb doctor                  # Diagnose project configuration
uniweb validate                # Check content against the data schemas your foundation declares
uniweb update                  # Reconcile workspace state with the running CLI
uniweb i18n <command>          # Manage translations
uniweb login                   # Authenticate with Uniweb platform
uniweb publish                 # Publish foundation to Uniweb registry
uniweb invite <email>          # Invite a client to use your foundation
uniweb handoff <email>         # Create a site and transfer to a client
uniweb deploy                  # Deploy a built site to Uniweb hosting
uniweb push                    # Push local site content to the Uniweb backend
uniweb pull                    # Pull backend site content to local files
uniweb clone <site-uuid>       # Start a local project from a backend site
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
5. Generates `schema.json` with full metadata

**Output:**

```
dist/
├── foundation.js       # Bundled components
├── foundation.js.map   # Source map
├── schema.json         # Component metadata
└── assets/
    ├── style.css       # Compiled CSS
    └── [Component]/    # Preview images
        └── [preset].webp
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
- Foundation is built (`dist/foundation.js` exists)

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

Reconcile a workspace's state with the running CLI. Three convergence steps:

1. **Self-update** the global CLI install via the package manager that owns it (auto-detected: npm, pnpm, yarn).
2. **Align workspace deps** — edit every `package.json` so `@uniweb/*` and `uniweb` versions match the CLI's bundled matrix, then run the workspace's package manager (auto-detected from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm).
3. **Refresh `AGENTS.md`** from the CLI's bundled partial.

```bash
uniweb update [options]
```

### Why all three together

`AGENTS.md` is regenerated from the CLI's current partials and stamped with the CLI version. Refreshing it while the workspace's declared `@uniweb/*` deps lag the CLI silently produces a doc that documents features the installed code doesn't have. The verb's drift gate refuses that combination unless you pass `--allow-mismatch`.

### Options

| Option | Description |
|--------|-------------|
| `--deps-only` | Skip self-update and `AGENTS.md`; only align deps. |
| `--agents-only` | Skip self-update and deps; only refresh `AGENTS.md`. |
| `--no-deps` | Skip the deps-alignment step. |
| `--no-agents` | Skip the `AGENTS.md` step. |
| `--dry-run` | Print the survey and would-be writes; make no changes. |
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

Each row is one declared dep in one workspace `package.json`, marked `aligned`, `behind` (the CLI ships a newer version), or `ahead of CLI` (left untouched — `update` never downgrades).

After the survey, each step prompts in TTY; `--yes` accepts the defaults; non-interactive prints the plan without mutating.

### Install failures

If the package manager's install step fails after `package.json` edits succeed, the edits are **kept**. The verb prints a `git checkout --` revert command and the install command to retry. There's no automatic rollback — install failures usually need human attention (peer-dep conflicts, lockfile contention) that hiding the diff would only obscure.

### Project-local installs

When the running CLI lives in `node_modules` (project-local), self-update is a no-op — the version is pinned by your project's `package.json`. The deps and `AGENTS.md` steps still run.

### Examples

```bash
# Full reconcile (typical TTY use)
uniweb update

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

See [CLI Authentication Architecture](../architecture/cli-auth.md) for the full technical flow.

### Examples

```bash
# Log in via browser (default)
uniweb login

# Fall back to manual token paste
uniweb login --token-paste
```

### When It's Needed

Login is required for `publish`, `invite`, `handoff`, and `deploy` (remote). The CLI prompts you to log in automatically if you run one of these commands without credentials.

---

## uniweb publish

Publish a foundation to the Uniweb registry.

```bash
uniweb publish [options]
```

Run from a foundation directory or workspace root. If the workspace has multiple foundations, you're prompted to choose one.

### Options

| Option | Description |
|--------|-------------|
| `--name <id>` | Foundation id (the bare name segment, e.g. `marketing` in `~alice/marketing@1.0.0`). Overrides `package.json::uniweb.id`. Persisted to `uniweb.id` after a successful publish, so passing it once is enough. |
| `--namespace <handle>` | Organization namespace to publish under (overrides package.json) |
| `--propagate` | Opt this version into automatic version-update walks for consenting sites. Default is silent — version is published but no site moves until republish. See [Foundation runtime policy](#foundation-runtime-policy) below. |
| `--local` | Publish to local registry (`.unicloud/`) instead of remote |
| `--registry <url>` | Publish to a specific registry URL |
| `--edit-access <policy>` | Set edit access: `open` (anyone) or `restricted` (invite-only, default) |
| `--dry-run` | Show what would be published without publishing |

### Identity (scope + id)

A published foundation has two identity pieces — a **scope** (where it's published) and an **id** (what it's called). They live in different places and resolve independently.

#### Scope

`uniweb publish` catalogs a foundation as a product, so it publishes under an **organization scope** (`@org/`) you belong to. The CLI resolves the scope in this priority order:

1. **`--namespace <handle>` flag** — explicit org override.
2. **Scoped `package.json::name`** — `"name": "@myorg/foundation"` → org scope `@myorg/`. You must have EDITOR or higher access to the org (the `namespaces` claim in your JWT).
3. **`package.json::uniweb.namespace`** — legacy explicit org-namespace field; equivalent to a `@myorg/…` scoped name. Rarely needed.

A foundation with no org scope — a bare name like the scaffold default `src`, or no name at all — is **not** cataloged. `uniweb publish` stops and points you to the right path:

- If the foundation powers a **single site**, run `uniweb deploy` instead — it uploads the foundation alongside the site's assets, with no naming ceremony.
- If you're cataloging a **reusable product**, give it an org name: `uniweb publish @your-org/foundation-name`.

Available org namespaces are listed in your JWT after `uniweb login`.

#### ID

The id is the bare name segment — what comes after the slash in `@org/<id>`. The CLI resolves it like this:

1. **`--name <id>` flag** — overrides everything for this publish, and persists to `package.json::uniweb.id` so future publishes don't need it. Use this to rename your foundation (one-shot rename: `uniweb publish --name new-name`).
2. **Scoped `package.json::name`** — `@org/<id>` carries the id alongside the scope.
3. **`package.json::uniweb.id`** — the persisted publish-id. Set automatically on first publish via the prompt.
4. **Interactive prompt** — first publish only. The CLI asks "Foundation name?" with a sensible default (the workspace folder name, with `-src` suffix stripped), then writes the answer to `package.json::uniweb.id`.
5. **Non-interactive without a usable id** → fail with guidance.

#### Why two storage locations for the id?

`package.json::name` is a **workspace concern** — pnpm uses it to link packages, sites reference it in their `file:` deps and `site.yml::foundation`. Renaming `package.json::name` cascades through several files and is a real edit operation.

`package.json::uniweb.id` is a **publish concern** — only the registry sees it. Renaming it affects the foundation's identity on the registry but doesn't move any workspace files. Most users benefit from leaving `package.json::name` as the scaffold default (`src`) forever and using `uniweb.id` to express the foundation's published identity.

If you want both to be the same — for example, a portable foundation that's `@myorg/marketing` in npm and on the registry — set `"name": "@myorg/marketing"` directly. The id falls out of the sigil-stripped form and you don't need `uniweb.id`.

### Foundation runtime policy

Foundations can declare a `runtimePolicy` field in `package.json` that controls how the runtime version moves forward on already-published sites:

```json
{
  "name": "src",
  "version": "1.0.0",
  "uniweb": {
    "runtimePolicy": "auto-minor"
  }
}
```

(`name` here is the scaffold default. Cataloging a foundation needs an org scope — `"@myorg/foundation"`, or `--namespace myorg` — see [Identity](#identity-scope--id) above.)

| Value | Meaning |
|-------|---------|
| `exact` | Sites stay on exactly the runtime version this foundation built against. Newer runtime versions are not auto-applied. |
| `auto-patch` | Sites auto-update within the same `MAJOR.MINOR.x` (e.g. `0.8.9` → `0.8.10`). Conservative; matches typical npm patch semantics. |
| `auto-minor` | Sites auto-update within the same `MAJOR.x.y` (e.g. `0.8.9` → `0.9.0`). |

**Default when unset:** `auto-minor`. Most foundations don't need to set this field — the platform's runtime is internally backwards-compatible at the minor level by convention, and `auto-minor` lets sites pick up bug fixes and additive features without rebuilding the foundation.

Set `exact` if your foundation depends on undocumented runtime internals or has been audited against one specific runtime release and you don't want to allow drift.

The field is read at build time and emitted into `dist/runtime-pin.json` alongside the resolved runtime version:

```json
// dist/runtime-pin.json (auto-generated)
{ "runtime": "0.8.9", "policy": "auto-minor" }
```

Sites cannot override this policy — it's the foundation author's contract with the platform.

#### What happens when fields aren't set

The system has multi-layer fallbacks so missing or partial information is always handled gracefully:

| Scenario | What happens |
|----------|--------------|
| `uniweb.runtimePolicy` not set in `package.json` | `dist/runtime-pin.json` is emitted with the runtime version but no `policy` field. At serve time the platform applies `auto-minor` as the implicit default. Most foundations don't need to set `runtimePolicy` — leaving it unset is the correct choice when you want default behavior. |
| `@uniweb/runtime` not resolvable at build time | The build silently skips emitting `runtime-pin.json`. New foundations created with `npx uniweb create` always have `@uniweb/runtime` as a dependency, so this only affects unusual workspace setups. |
| `runtime-pin.json` is missing or malformed | The platform's serving infrastructure detects the absence and serves the foundation through the legacy bundling path. Sites still work; they just don't participate in runtime propagation. |
| `runtime-pin.json` has a `runtime` version that's not actually deployed | The site publish flow rejects the publish with a clear error asking you to deploy the pinned runtime version first. This is caught at publish time, not at serve time. |
| Policy permits a newer version but none is published | The site stays on the version it pinned. The resolver only moves forward when a newer version satisfying the policy is actually available. |

Bottom line: a foundation that doesn't set `runtimePolicy` gets `auto-minor` behavior automatically. A foundation that doesn't ship `runtime-pin.json` at all (e.g. a legacy build) still serves correctly through the platform's compatibility path — you just don't get the propagation benefits. Set `runtimePolicy` explicitly only when you want to override the default (typically to `exact` for stability-critical builds).

### `--propagate` and `silent` defaults

`uniweb publish` defaults to `silent` classification: the artifact is uploaded and stored in the registry, sites that pin exactly that version can resolve to it, but sites using earlier versions don't move. This is the conservative default — newly-published versions don't reach existing sites until those sites explicitly opt in (republish, manual refresh, or an explicit `--propagate` push).

`uniweb publish --propagate` opts this version into the platform's gated rollout. Eligible sites — sites referencing your foundation that aren't pinned and whose policy permits the version jump — pick up the new version automatically through the platform's wave-based rollout (canary → small percentage → larger percentage → full population, with health gates between waves).

Use `silent` for:
- Internal refactors / no-op patches
- Pre-staging a release before flipping the propagation switch
- Versions you want available but not pushed to consenting sites yet

Use `--propagate` for:
- Security or correctness fixes you want to reach existing sites
- New features you want consenting sites to receive automatically

### What Happens

1. Reads `dist/meta/schema.json` for the foundation version (auto-builds if `dist/` is missing).
2. Resolves the scope and id per the priorities above. On a first publish without `--name` or `uniweb.id`, prompts interactively for the foundation name and persists the answer to `package.json::uniweb.id`.
3. Server authorizes the org scope against the JWT (`namespaces[]`).
4. Checks for duplicate versions.
5. Uploads the foundation bundle to `foundations/{org}/{name}/{version}/`.

### Examples

```bash
# Catalog a foundation under an org you belong to (first publish confirms)
uniweb publish @myorg/marketing

# With "@myorg/marketing" set as package.json::name, no argument is needed
uniweb publish

# Provide just the org scope; the CLI resolves (or prompts for) the id
uniweb publish --namespace myorg

# Rename on the registry: one-shot, persists the new id to uniweb.id
uniweb publish --name marketing-pro

# Site-bound foundation? Don't publish — deploy uploads it automatically
uniweb deploy

# Publish to a local registry for development (skips the org-scope gate; no auth)
uniweb publish --local

# Preview what would be published
uniweb publish --dry-run

# Publish to a custom registry
uniweb publish --registry http://localhost:4001
```

### After Publishing

The CLI shows next steps for working with clients:

```
✓ Published @myorg/foundation@1.0.0

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

`uniweb push` sends content but does **not** make it live — run `uniweb publish` afterward, or use `uniweb deploy` (which pushes *and* publishes in one step).

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

Deploy a site. The destination depends on `deploy.host:` in the site's `site.yml` (default: `uniweb` — Uniweb hosting).

```bash
uniweb deploy [options]
```

Run from a site directory or workspace root. If the workspace has multiple sites, you're prompted to choose one.

### Options

| Option | Description |
|--------|-------------|
| `--host <adapter>` | Override `deploy.host:` in site.yml. Built-in adapters: `uniweb` (default), `cloudflare-pages`, `github-pages`, `s3-cloudfront`, `generic-static`. |
| `--dry-run` | Show what would be deployed without deploying. |
| `--no-auto-publish` | Don't auto-publish a workspace-local foundation as part of the deploy. (Default behavior is to auto-publish site-bound.) |

### What Happens

The default flow (`uniweb` host):

1. Reads `site.yml`. Validates the `foundation:` declaration.
2. Detects whether the foundation is workspace-local or a registry ref. If local, prepares to auto-publish it site-bound.
3. Authenticates with the platform (`uniweb login` if needed). First deploy of a new site opens a browser to confirm name, plan, and (if applicable) payment.
4. Builds `dist/` (link mode — emits content + assets only, no JS bundle).
5. Uploads content + assets + (if applicable) the local foundation, all addressed under the site's per-site storage.

The static-host flow (`--host=<adapter>` other than `uniweb`):

1. Reads `site.yml` and `deploy:` block; validates the adapter and its required config.
2. Builds `dist/` in bundle mode (`uniweb build --bundle`) with the adapter's `postBuild` hook (e.g., `_redirects`, `.nojekyll`, `cloudfront-function.js`).
3. Hands `dist/` to the adapter's `deploy` hook for upload + invalidation. Errors from the adapter (missing AWS CLI, expired credentials, missing config, etc.) surface as friendly messages with hints.

### Examples

```bash
# Deploy to Uniweb hosting (default; requires `uniweb login`)
uniweb deploy

# Static-host deploy to S3 + CloudFront (configure deploy: in site.yml)
uniweb deploy --host=s3-cloudfront

# Static-host deploy to Cloudflare Pages
uniweb deploy --host=cloudflare-pages

# Preview what would be deployed
uniweb deploy --dry-run

# Skip auto-publishing the workspace-local foundation
uniweb deploy --no-auto-publish
```

### Configuring the destination in `site.yml`

```yaml
# site.yml
deploy:
  host: s3-cloudfront
  bucket: my-bucket
  distributionId: E1ABC...
  region: us-east-1
  profile: my-aws-profile    # optional; sets AWS_PROFILE for the subprocess
```

The `--host=<adapter>` flag on the command line overrides `deploy.host:`. Adapter-specific fields (`bucket`, `distributionId`, etc.) live under `deploy:` in `site.yml`.

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
- [Internationalization](./internationalization.md) — Translation workflow
- [Publishing and Clients](../development/publishing-and-clients.md) — Full developer-to-client workflow
- [Deployment](./deployment.md) — Static hosting and platform deployment
