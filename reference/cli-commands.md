# CLI Commands Reference

The Uniweb CLI (`uniweb`) scaffolds projects, builds foundations and sites, generates documentation, diagnoses issues, and manages translations.

## Quick Reference

```bash
uniweb create [name]           # Create a new project
uniweb add <type> [name]       # Add a foundation, site, or extension
uniweb build                   # Build the current project
uniweb docs                    # Generate component documentation
uniweb doctor                  # Diagnose project configuration
uniweb i18n <command>          # Manage translations
```

---

## uniweb create

Create a new Uniweb project.

```bash
uniweb create [name] [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `name` | Project directory name (prompted if omitted) |

### Options

| Option | Description |
|--------|-------------|
| `--template <type>` | Template to use (see below) |
| `--name <name>` | Project display name (for package.json) |
| `--no-git` | Skip git repository initialization |

### Default Behavior

With no `--template`, the CLI creates a workspace with a foundation, a site, and starter content — a working project you can run immediately with `pnpm dev`.

### Templates

**Built-in:**

| Template | Description |
|----------|-------------|
| *(none)* | Foundation + site + starter content (default) |
| `blank` | Empty workspace — grow incrementally with `uniweb add` |

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
# Interactive (prompts for name)
uniweb create

# Quick start with defaults
uniweb create my-site

# Use official marketing template
uniweb create my-site --template marketing

# Blank workspace (grow with add)
uniweb create my-site --template blank

# Use npm package template
uniweb create my-site --template @acme/corporate-template

# Use GitHub template
uniweb create my-site --template github:myorg/custom-template

# Use local template
uniweb create my-site --template ./my-template
```

### Troubleshooting Template Downloads

Official templates are fetched from GitHub Releases. If download fails:

1. **Check network access** — Corporate networks may block GitHub API
2. **Use the default** — Run `uniweb create my-site` (no `--template`) to use the built-in starter
3. **Check rate limits** — GitHub API has rate limits for unauthenticated requests

---

## uniweb add

Add a foundation, site, or extension to an existing workspace.

```bash
uniweb add foundation [name] [options]
uniweb add site [name] [options]
uniweb add extension <name> [options]
```

Run this from a workspace root (a directory with `pnpm-workspace.yaml`). If there's no workspace yet, create one with `uniweb create --template blank`.

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

The CLI chooses a sensible directory based on what exists. `--path` overrides the default.

**Foundation placement:**

| Scenario | Command | Location |
|----------|---------|----------|
| No foundations exist | `add foundation` | `foundation/` |
| No foundations exist | `add foundation marketing` | `foundations/marketing/` |
| One foundation exists | `add foundation blog` | `foundations/blog/` |
| Co-located | `add foundation --project docs` | `docs/foundation/` |

**Site placement:**

| Scenario | Command | Location |
|----------|---------|----------|
| No sites exist | `add site` | `site/` |
| No sites exist | `add site blog` | `sites/blog/` |
| One site exists | `add site blog` | `sites/blog/` |
| Co-located | `add site --project docs` | `docs/site/` |

**Extension placement:**

Extensions always go in `extensions/{name}/` and require a name.

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
# Add a foundation (no content, just scaffolding)
uniweb add foundation

# Add a named foundation with template content
uniweb add foundation marketing --from marketing

# Add a site wired to a specific foundation
uniweb add site blog --foundation marketing

# Add an extension and wire it to a site
uniweb add extension effects --site site

# Co-located layout: foundation + site under one project
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
| `src/sections/`, `src/components/`, or `src/foundation.js` | Foundation |
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
- Declares `extension: true` in `foundation.js`
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

## Project Structure

The CLI produces these workspace layouts:

### Default (create)

```
my-project/
├── foundation/          # React components
│   ├── src/
│   │   ├── foundation.js
│   │   ├── styles.css
│   │   └── sections/
│   ├── package.json
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
├── foundation/             # Original foundation
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

### Co-located Layout (--project)

```
my-workspace/
├── marketing/
│   ├── foundation/
│   └── site/
├── docs/
│   ├── foundation/
│   └── site/
├── package.json
└── pnpm-workspace.yaml
```

---

## Environment Detection

The CLI auto-detects context:

| Directory Contains | Detected As |
|-------------------|-------------|
| `src/sections/`, `src/components/`, or `src/foundation.js` | Foundation |
| `site.yml` or `pages/` | Site |
| `pnpm-workspace.yaml` | Workspace (builds all) |

Workspace builds discover foundations in `foundation/` and `foundations/*/`, extensions in `extensions/*/`, and sites in `site/` and `sites/*/`.

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
