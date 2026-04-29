# CLI Commands Reference

The Uniweb CLI (`uniweb`) scaffolds projects, builds foundations and sites, generates documentation, diagnoses issues, and manages translations.

## Quick Reference

```bash
uniweb create [name]           # Create a new project (default: starter)
uniweb add <type> [name]       # Add a project, foundation, site, or extension
uniweb build                   # Build the current project
uniweb docs                    # Generate component documentation
uniweb doctor                  # Diagnose project configuration
uniweb i18n <command>          # Manage translations
uniweb login                   # Authenticate with Uniweb platform
uniweb publish                 # Publish foundation to Uniweb registry
uniweb invite <email>          # Invite a client to use your foundation
uniweb handoff <email>         # Create a site and transfer to a client
uniweb deploy                  # Deploy a built site to Uniweb hosting
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
| `--template <type>` | Template to use (default: starter) |
| `--blank` | Create an empty workspace (grow with `uniweb add`) |
| `--name <name>` | Project display name (for package.json) |
| `--no-git` | Skip git repository initialization |

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

The name you provide becomes both the directory name and the package name. `--path` overrides the default directory.

**Project placement (`add project`):**

| Command | Location | Package names |
|---------|----------|---------------|
| `add project docs` | `docs/src/` + `docs/site/` | `docs-src`, `docs-site` |

**Foundation placement:**

| Scenario | Command | Location | Package name |
|----------|---------|----------|--------------|
| First foundation | `add foundation` | `src/` | `site-src` |
| First foundation, named | `add foundation ui` | `foundations/ui/` | `ui` |
| Existing co-located (`*/src` glob) | `add foundation blog` | `blog/src/` | `blog-src` |
| Existing co-located (legacy `*/foundation` glob) | `add foundation blog` | `blog/foundation/` | `blog-foundation` |
| Existing segregated layout | `add foundation blog` | `foundations/blog/` | `blog` |
| Explicit co-located | `add foundation --project docs` | `docs/src/` | `docs-src` |

**Site placement:**

| Scenario | Command | Location |
|----------|---------|----------|
| First site | `add site` | `site/` |
| First site, named | `add site blog` | `blog/` |
| Existing co-located layout | `add site blog` | `blog/site/` |
| Existing segregated layout | `add site blog` | `sites/blog/` |
| Explicit co-located | `add site --project docs` | `docs/site/` |

**Extension placement:**

Extensions always go in `extensions/{name}/` and require a name.

### Package Naming

The package name equals the name you provide (or the default `foundation`/`site`). For `add project`, names are prefixed: `{name}-foundation` and `{name}-site`. If a package name already exists in the workspace, the CLI errors with guidance instead of auto-suffixing.

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
| `--namespace <handle>` | Organization namespace to publish under (overrides package.json) |
| `--propagate` | Opt this version into automatic version-update walks for consenting sites. Default is silent — version is published but no site moves until republish. See [Foundation runtime policy](#foundation-runtime-policy) below. |
| `--local` | Publish to local registry (`.unicloud/`) instead of remote |
| `--registry <url>` | Publish to a specific registry URL |
| `--edit-access <policy>` | Set edit access: `open` (anyone) or `restricted` (invite-only, default) |
| `--dry-run` | Show what would be published without publishing |

### Scope (where the foundation is published)

Every published foundation is stored under a scope. The CLI accepts three scope shapes and picks one in this priority order:

1. **`--namespace <handle>` flag** — explicit org override.
2. **Sigil in `package.json::name`**:
   - `"name": "@myorg/foundation"` → org scope `@myorg/`. You must have EDITOR or higher access to the org (the `namespaces` claim in your JWT).
   - `"name": "~me/foundation"` → personal alias scope (opt-in). Authorized when the alias matches your account.
3. **`package.json` → `"uniweb": { "namespace": "myorg" }`** — legacy explicit field; equivalent to a `@myorg/...` scoped name.
4. **Bare name** (e.g. `"name": "site-src"`) → empty scope. The server resolves it to your **personal scope**, anchored to your account's permanent `memberId`. The published name renders as `~<your-handle>/site-src` in the registry; you don't need to type the `~me/` prefix.

The default scaffold uses bare names — `package.json::name: "site-src"` — so a fresh project just publishes under the developer's personal scope without any setup. Switch to an org scope when you're ready to publish under an organization you belong to.

Available org namespaces are listed in your JWT after `uniweb login`.

### Foundation runtime policy

Foundations can declare a `runtimePolicy` field in `package.json` that controls how the runtime version moves forward on already-published sites:

```json
{
  "name": "site-src",
  "version": "1.0.0",
  "uniweb": {
    "runtimePolicy": "auto-minor"
  }
}
```

(The bare `name` publishes under your personal scope by default. Use `"@myorg/foundation"` to publish under an organization. `uniweb.namespace` is the legacy explicit-override field; rarely needed.)

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

1. Reads `dist/meta/schema.json` for the foundation name and version (auto-builds if `dist/` is missing).
2. Resolves the scope per the priority above. For org or `~user/` scopes, attaches the sigil; for empty-scope publishes, sends the bare name to the server.
3. Server authorizes the scope against the JWT (`namespaces[]` for org, `loginName`/`sub` for personal, `sub` for empty).
4. Checks for duplicate versions.
5. Uploads the foundation bundle. Org-scope storage path is `foundations/{org}/{name}/{version}/`; personal-scope storage is anchored on the immutable `memberId` (`foundations/u{sub}/{name}/{version}/`) so the URL renders as `~{handle}/{name}` without the storage moving when a handle changes.

### Examples

```bash
# Empty-scope publish (default for new scaffolds — publishes under your personal scope)
uniweb publish

# Explicit org override
uniweb publish --namespace myorg

# Personal alias scope (set in package.json::name as "~handle/foundation")
# — published the same way as any other; no flag needed.

# Publish to local registry (no auth needed; the local mock synthesizes
# a personal-scope index entry that mirrors what production will write)
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

Deploy a built site to Uniweb hosting.

```bash
uniweb deploy [options]
```

Run from a site directory or workspace root. If the workspace has multiple sites, you're prompted to choose one.

### Options

| Option | Description |
|--------|-------------|
| `--local` | Deploy to local server (no auth required) |
| `--registry <url>` | Deploy to a specific server URL |
| `--dry-run` | Show what would be deployed without deploying |

### What Happens

1. Reads the site's `dist/` directory (auto-builds if missing)
2. Derives a site ID from `package.json` name or directory name
3. Uploads all files to the server
4. The site is served at the deployment URL

### Examples

```bash
# Deploy to Uniweb hosting (requires login)
uniweb deploy

# Deploy to local server
uniweb deploy --local

# Preview what would be deployed
uniweb deploy --dry-run

# Deploy to a custom server
uniweb deploy --registry http://localhost:4001
```

### Static Hosting Alternative

The `dist/` folder is a standard Vite static build. You can also deploy to any static host (Vercel, Netlify, GitHub Pages, etc.) — see [Deployment](./deployment.md) for details.

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
│   ├── package.json     # name: "site-src"
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
├── src/                    # Original foundation (name: "site-src")
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
