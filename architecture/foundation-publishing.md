# Foundation Publishing Architecture

How foundations are built, published, and served in the Uniweb platform.

## Overview

```
Developer Machine                    Cloudflare Edge
┌──────────────────────┐            ┌──────────────────────────┐
│  uniweb build        │            │  Worker (site-router)    │
│    ↓                 │            │    ├─ POST /foundations   │
│  dist/               │  publish   │    │   (upload API)       │
│    ├─ foundation.js  │ ────────►  │    └─ GET /foundations/*  │
│    ├─ foundation.    │            │        (serving)          │
│    │  worker.cjs     │            │                          │
│    ├─ meta/          │            │  R2 Bucket (uniweb)      │
│    │  schema.json    │            │    ├─ foundations/        │
│    └─ assets/        │            │    │  name@version/       │
│                      │            │    └─ registry/           │
└──────────────────────┘            │       foundations/        │
                                    │       index.json          │
                                    └──────────────────────────┘
```

## Build Step

### Command

```bash
cd foundation/
pnpm build          # or: uniweb build
```

### What Happens

The `@uniweb/build` Vite plugin (`build/src/vite-foundation-plugin.js`) runs these steps in the `writeBundle()` hook after Vite finishes the primary build:

1. **Primary Vite build** — produces `dist/foundation.js` (ES module) with React, `@uniweb/core`, and other shared deps as externals
2. **Schema generation** — scans `src/` for component meta files, builds `dist/meta/schema.json` with component definitions and preview images
3. **Worker bundle generation** — runs a secondary Vite build that takes the ESM `foundation.js` as input and produces `dist/foundation.worker.cjs` (CommonJS)

### Build Output

```
dist/
├── foundation.js              # ESM bundle (browser) — ~128 KB
├── foundation.js.map          # Source map
├── foundation.worker.cjs      # CJS bundle (edge SSR) — ~130 KB
├── meta/
│   └── schema.json            # Component definitions, version, name
└── assets/
    ├── foundation.css          # Combined stylesheet
    └── previews/               # Component preview images (if any)
```

### Why Two Bundles?

| Bundle | Format | Used by | How it's loaded |
|--------|--------|---------|-----------------|
| `foundation.js` | ES module | Browser runtime | `<script type="module">` / dynamic `import()` |
| `foundation.worker.cjs` | CommonJS | Cloudflare Worker SSR | `new Function()` with custom `require()` |

Cloudflare Workers can't use ES module `import()` for dynamic code. The Worker evaluates foundation code using `new Function()` and provides a custom `require()` that maps externals (React, `@uniweb/core`) to its bundled copies. This requires CJS format.

### Worker Bundle Externals

These packages are provided by the Worker runtime and excluded from the CJS bundle:

```
react, react-dom, react-dom/server,
react/jsx-runtime, react/jsx-dev-runtime,
@uniweb/core
```

### Re-entrancy Guard

The secondary Vite build can trigger the foundation plugin's `writeBundle()` hook recursively. A module-level flag (`_buildingWorkerBundle`) prevents infinite recursion.

## Publish Step

### Command

```bash
uniweb publish                                          # Publish to default registry
uniweb publish --local                                  # Publish to local .unicloud/registry/
uniweb publish --registry https://custom-worker.dev     # Publish to a specific registry
uniweb publish --dry-run                                # Preview without publishing
```

### Authentication

Publishing requires a JWT token obtained via `uniweb login`. See [CLI Authentication Architecture](cli-auth.md) for the full login flow.

Credentials are stored at `~/.uniweb/auth.json`:

```json
{
  "token": "eyJhbGci...",
  "email": "developer@example.com",
  "expiresAt": "2026-04-23T17:13:35.521Z"
}
```

### Publish Flow

```
uniweb publish
  │
  ├─ 1. Resolve foundation directory
  │    (current dir, or prompt if workspace has multiple)
  │
  ├─ 2. Auto-build if dist/ is missing
  │    (runs `npx uniweb build --target foundation`)
  │
  ├─ 3. Read name + version from dist/meta/schema.json
  │
  ├─ 4. Authenticate
  │    (reads ~/.uniweb/auth.json, prompts login if expired)
  │
  ├─ 5. Check for duplicate versions on the registry
  │
  ├─ 6. Collect all files from dist/
  │    ├─ foundation.js
  │    ├─ foundation.worker.cjs
  │    ├─ meta/schema.json
  │    ├─ assets/foundation.css
  │    └─ (any other files in dist/)
  │
  ├─ 7. Base64-encode each file
  │
  └─ 8. POST to {registryUrl}/foundations
       Headers:
         Authorization: Bearer {jwt}
         Content-Type: application/json
       Body:
         {
           "name": "foundation",
           "version": "0.1.18",
           "files": {
             "foundation.js": "base64...",
             "foundation.worker.cjs": "base64...",
             "meta/schema.json": "base64...",
             "assets/foundation.css": "base64..."
           },
           "metadata": { "publishedBy": "developer@example.com" }
         }
```

### Registry Targets

| Target | URL | Storage | Auth |
|--------|-----|---------|------|
| Local | `http://localhost:4001` (unicloud dev) | `.unicloud/registry/` on disk | Dev JWT or none |
| Production | `https://site-router.uniweb-edge.workers.dev` | R2 bucket `uniweb` | Production JWT |

URL resolution priority: `--registry` flag > `UNIWEB_REGISTRY_URL` env var > `~/.uniweb/config.json` > production default.

## Worker Upload API

### Endpoint

```
POST /foundations
POST /api/foundations
```

Both paths are accepted (the CLI uses `/foundations`, matching the unicloud local server).

### Request

```
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "name": "my-foundation",
  "version": "1.0.0",
  "files": {
    "foundation.js": "{base64}",
    "foundation.worker.cjs": "{base64}",
    "meta/schema.json": "{base64}",
    "assets/foundation.css": "{base64}"
  },
  "metadata": {}
}
```

### Processing Steps

1. **Authenticate** — extract Bearer token, verify HS256 JWT signature against `JWT_SECRET`, check expiry
2. **Validate** — name (alphanumeric/hyphens/underscores), version, `foundation.js` required
3. **Read registry** — fetch `registry/foundations/index.json` from R2
4. **Check ownership** — if foundation name exists, caller's email must be in `owners[]`; if new, caller becomes first owner
5. **Check duplicate** — reject if this exact version already exists (409)
6. **Upload files** — base64-decode each file, write to R2 at `foundations/{name}@{version}/{path}` with appropriate content types
7. **Update registry** — add version entry, update `latest`, write `registry/foundations/index.json` back to R2

### Response

```json
{
  "name": "my-foundation",
  "version": "1.0.0",
  "filesCount": 4,
  "message": "Published my-foundation@1.0.0"
}
```

### Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Missing or invalid name/version/files |
| 401 | Missing or invalid JWT |
| 403 | Foundation owned by another user |
| 409 | Version already exists |

## R2 Storage Layout

```
R2 bucket: uniweb
├── foundations/
│   ├── my-foundation@1.0.0/
│   │   ├── foundation.js
│   │   ├── foundation.worker.cjs
│   │   ├── meta/
│   │   │   └── schema.json
│   │   └── assets/
│   │       └── foundation.css
│   └── my-foundation@1.0.1/
│       └── ...
├── registry/
│   └── foundations/
│       └── index.json              # Ownership and version index
├── runtime/
│   └── {version}/                  # Shared runtime assets
└── sites/
    └── {siteId}/                   # Published site content
```

### Registry Index Format

`registry/foundations/index.json`:

```json
{
  "my-foundation": {
    "owners": ["developer@example.com"],
    "latest": "1.0.1",
    "versions": [
      {
        "version": "1.0.0",
        "publishedAt": "2026-03-24T17:00:00.000Z",
        "publishedBy": "developer@example.com",
        "filesCount": 4
      },
      {
        "version": "1.0.1",
        "publishedAt": "2026-03-24T18:00:00.000Z",
        "publishedBy": "developer@example.com",
        "filesCount": 4
      }
    ]
  }
}
```

## Serving Foundations

The Worker serves published foundation files at:

```
GET /foundations/{name}@{version}/{path}
```

Examples:

```
/foundations/my-foundation@1.0.0/foundation.js
/foundations/my-foundation@1.0.0/foundation.worker.cjs
/foundations/my-foundation@1.0.0/meta/schema.json
/foundations/my-foundation@1.0.0/assets/foundation.css
```

All foundation assets are served with `Cache-Control: public, max-age=31536000, immutable` since they're versioned and never change.

## Local Development

### Unicloud (Local Registry)

For local development, `unicloud` (port 4001) acts as the registry. The handler at `unicloud/src/handlers/foundations.js`:

1. Accepts the same upload payload as the Worker
2. Prefers the pre-built `foundation.worker.cjs` from the upload
3. Falls back to building a CJS bundle with esbuild if not present (for older CLIs)
4. Writes files to `.unicloud/registry/packages/{name}/{version}/`

### Local URL Override

Platform developers set `~/.uniweb/config.json` to point to local servers:

```json
{
  "backendUrl": "http://127.0.0.1:8002",
  "registryUrl": "http://localhost:4001"
}
```

### Quick Test

```bash
# 1. Build
cd testproject/foundation && pnpm build

# 2. Publish locally (no auth needed)
uniweb publish --local

# 3. Or publish to local unicloud (needs unicloud running on port 4001)
uniweb publish

# 4. Or publish to production Cloudflare Worker
uniweb publish --registry https://site-router.uniweb-edge.workers.dev
```

## Production Deployment Checklist

- [ ] Set Worker secret: `cd uniweb-edge && npx wrangler secret put JWT_SECRET`
- [ ] Set PHP env var: `UNIWEB_JWT_SECRET` (must match Worker secret)
- [ ] Deploy Worker: `cd uniweb-edge && npx wrangler deploy`
- [ ] Verify production defaults in `cli/src/utils/config.js`

## Files Reference

| File | Description |
|------|-------------|
| `build/src/vite-foundation-plugin.js` | Vite plugin — schema generation and worker bundle build |
| `cli/src/commands/publish.js` | CLI publish command — collects files, uploads to registry |
| `cli/src/utils/registry.js` | `RemoteRegistry` class — HTTP client for registry API |
| `uniweb-edge/src/foundations-api.js` | Worker upload handler — JWT auth, R2 writes, registry index |
| `uniweb-edge/src/jwt.js` | Worker JWT verification — Web Crypto API, HS256 |
| `uniweb-edge/src/index.js` | Worker entry — routes `/foundations` POST and GET |
| `unicloud/src/handlers/foundations.js` | Local dev handler — prefers pre-built worker bundle |
