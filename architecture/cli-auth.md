# CLI Authentication Architecture

How `uniweb login` authenticates developers and how `uniweb publish` uses the resulting JWT to upload foundations.

## Login Flow

```
CLI (uniweb login)
  │
  ├─ Starts temp HTTP server on random port (e.g. 51577)
  ├─ Opens browser to:
  │    {backendUrl}/cli-auth.php?action=login&callback=http://localhost:51577/callback
  │
  ▼
PHP (CliAuthController)
  │
  ├─ User NOT authenticated?
  │    → Redirect to /login?returnTo=/cli-auth.php?action=login&callback=...
  │
  ▼
React Login Page (App.jsx)
  │
  ├─ Reads ?returnTo= from URL
  ├─ User logs in via email/password, Google, or Microsoft
  ├─ After success → window.location.replace("/cli-auth.php?action=login&callback=...")
  │    (instead of the usual "/" redirect)
  │
  ▼
PHP (CliAuthController) — now authenticated
  │
  ├─ Signs HS256 JWT with user's email, memberId, loginName
  ├─ Redirects to http://localhost:51577/callback?token={jwt}&email={email}
  │
  ▼
CLI receives token
  ├─ Stores at ~/.uniweb/auth.json
  └─ Shows "✓ Logged in as user@email.com"
```

## Components Involved

### CLI (`cli/src/commands/login.js`)

- Starts a `node:http` server on `127.0.0.1` with port `0` (OS picks a random available port)
- Opens the browser using `open` (macOS), `start` (Windows), or `xdg-open` (Linux)
- Waits up to 120 seconds for the callback, then falls back to token-paste
- The `--token-paste` flag skips the browser flow entirely

### PHP (`bundles/account/src/CliAuthController.php`)

- Route: `/cli-auth.php` (registered in `apps/uniweb-v2/src/routes.php`)
- If user has a valid PHP session → signs JWT immediately and redirects
- If not → redirects to `/login?returnTo=...` so the React app handles login
- Validates the `callback` URL is `localhost` / `127.0.0.1` / `::1` (prevents open redirect)
- JWT signing uses `hash_hmac('sha256', ...)` — native PHP, no external library

### React Login Page (`uniweb-js/src/pages/Login/src/components/App.jsx`)

- Reads `?returnTo=` query parameter from the URL
- After successful login (any method), redirects to `returnTo` via `window.location.replace()`
- The `returnTo` prop is also passed to `Google.jsx` and `Microsoft.jsx` components

## JWT Structure

The JWT is signed with HS256 using a shared secret between PHP and the Worker.

### Header

```json
{ "alg": "HS256", "typ": "JWT" }
```

### Payload

```json
{
  "sub": "42",
  "email": "developer@example.com",
  "loginName": "developer",
  "type": "cli",
  "iat": 1711300000,
  "exp": 1713892000
}
```

- `sub` — member ID from the `Members` table
- `email` — from `signup_email` in the PHP session
- `loginName` — from `login_name` in the PHP session
- `type` — always `"cli"` (distinguishes from other token types)
- Token lifetime: 30 days

### Shared Secret

| Environment | PHP | Worker |
|-------------|-----|--------|
| Development | Falls back to `uniweb-dev-secret-do-not-use-in-production` | `.dev.vars` file: `JWT_SECRET=uniweb-dev-secret-do-not-use-in-production` |
| Production | `UNIWEB_JWT_SECRET` env var | `JWT_SECRET` wrangler secret (`npx wrangler secret put JWT_SECRET`) |

The same secret value must be used on both sides.

## Credential Storage

Credentials are stored at `~/.uniweb/auth.json`:

```json
{
  "token": "eyJhbGci...",
  "email": "developer@example.com",
  "expiresAt": "2026-04-23T17:13:35.521Z"
}
```

This file is user-global (not workspace-local) — you publish as yourself, not as a project.

## URL Configuration

The CLI needs to know the backend URL (for login) and registry URL (for publish).

**Priority order** (highest to lowest):

1. Environment variables: `UNIWEB_BACKEND_URL`, `UNIWEB_REGISTRY_URL`
2. Config file: `~/.uniweb/config.json`
3. Defaults: `https://uniweb.app`, `https://site-router.uniweb-edge.workers.dev`

Platform developers create `~/.uniweb/config.json` to point to local servers:

```json
{
  "backendUrl": "http://127.0.0.1:8002",
  "registryUrl": "http://localhost:4001"
}
```

## Publish Flow

After login, `uniweb publish` uses the stored JWT to upload foundations:

```
uniweb publish
  │
  ├─ Reads ~/.uniweb/auth.json → Bearer token
  ├─ Collects all files from dist/ (foundation.js, foundation.worker.cjs, meta/schema.json, assets/...)
  ├─ Base64-encodes each file
  │
  ├─ POSTs to {registryUrl}/foundations
  │    Headers: Authorization: Bearer {jwt}, Content-Type: application/json
  │    Body: { name, version, files: { "foundation.js": "base64...", ... }, metadata }
  │
  ▼
Registry (unicloud local or Worker production)
  ├─ Verifies JWT signature
  ├─ Checks ownership (new foundation → caller becomes owner)
  ├─ Checks for duplicate version
  ├─ Writes files to storage (local filesystem or R2)
  └─ Updates registry index
```

## Worker JWT Verification (`uniweb-edge/src/jwt.js`)

The Cloudflare Worker verifies JWTs using the Web Crypto API (no external dependencies):

1. `crypto.subtle.importKey()` — imports the shared secret as an HMAC key
2. `crypto.subtle.verify()` — verifies the HMAC-SHA256 signature
3. Checks `exp` claim against current time
4. Returns `{ userId, email, claims }` on success

## Security Considerations

- **Callback URL validation**: PHP only redirects to `localhost` / `127.0.0.1` / `::1` — prevents open redirect attacks
- **Temp server binding**: CLI's HTTP server listens on `127.0.0.1` only — not exposed to the network
- **Token transport**: JWT travels over localhost (CLI callback) and HTTPS (production API calls) — never over unencrypted remote connections
- **Foundation ownership**: First publisher of a name becomes the owner. Subsequent publishes require the same email in the JWT's `email` claim
