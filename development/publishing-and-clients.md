# Publishing and Working with Clients

This page covers **catalog registration** — making a foundation available as a product that other developers can use across their sites. If your foundation only powers one specific site, you don't need to register it manually: just run `uniweb deploy` from the site directory and the CLI will auto-register your foundation under a site-scoped slot as part of the deploy. See [Deploying](./deploying.md) for the site-bound flow.

After building a foundation that you do want to catalog, you have two paths to get clients started: **invite** them to create their own site, or **hand off** a populated site you built for them.

## Prerequisites

### Authenticate

All platform commands require authentication:

```bash
uniweb login
```

You'll be prompted for your email and an API token from uniweb.app/cli-login. Tokens are valid for 30 days and are stored at `~/.uniweb/auth.json`.

### Build Your Foundation

Your foundation must be built before registering:

```bash
cd foundation
uniweb build
```

This produces `dist/foundation.js` and `dist/meta/schema.json`. If you skip this step, `uniweb register` will build automatically.

## Registering

Register your foundation on the Uniweb catalog:

```bash
uniweb register --scope @your-org
```

The org scope is required — `uniweb register` is the deliberate "this foundation is a catalog product" command. Bare `uniweb register` (with no org scope) errors out and points you at `uniweb deploy` for site-bound foundations.

In CI, you also need `--catalog` to confirm the public-catalog registration:

```bash
uniweb register --scope @your-org --catalog
```

Interactive runs prompt for confirmation instead of requiring the flag.

Registering makes your foundation available for sites to consume — either through the web app (uniweb.app) or the desktop app (Uniweb Studio). The version comes from `package.json::version`.

Each version can only be registered once. To register an update, bump the version in `package.json`:

```json
{ "name": "src", "version": "1.0.1" }
```

### Edit Access

By default, only clients you explicitly invite can create sites with your foundation (`restricted` access). To allow anyone to use it:

```bash
uniweb register --edit-access open
```

## Invite Path

Use invites when the client will create and manage their own site.

### Create an Invite

```bash
uniweb invite client@example.com
```

The CLI creates an invite and returns a link:

```
✓ Invite created

  ID:       abc-123
  To:       client@example.com
  For:      my-foundation v1
  Uses:     1
  Expires:  2025-03-15
  Link:     https://uniweb.app/invite/abc-123
```

Send the link to your client however you prefer — email, Slack, text.

### What the Client Sees

The client clicks the link and lands on a page that lets them:

1. Enter their email and choose a site name
2. Pick how they want to work — **Web** (edit in browser) or **Studio** (desktop app)
3. Click "Create" to set up their site

The invite is redeemed when the client creates the site — a license is granted automatically. No extra setup on your part.

If the client chooses Studio, the page attempts to open `uniweb://invite/...` as a deep link. The desktop app launches with the project pre-filled. If Studio isn't installed, a download link appears after 2 seconds.

### Multi-Use Invites

For teams, create invites that can be used multiple times:

```bash
uniweb invite team@company.com --uses 5
```

### Managing Invites

```bash
# List all invites for your foundation
uniweb invite --list

# Revoke an invite
uniweb invite --revoke abc-123

# Resend an invite
uniweb invite --resend abc-123
```

## Handoff Path

Use handoff when you build a populated site for the client.

### Create and Transfer

```bash
uniweb handoff client@example.com
```

This creates a site record on the platform, auto-grants a license (you own the foundation), and transfers ownership to the client.

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

### Sharing Site Files

After the handoff, share the site content with your client. The site is just content files — markdown, YAML configuration, and theme settings. Any sharing method works:

- **Git repository** — most natural for developers
- **Zip file** — simple, no git knowledge required
- **Shared drive** — Google Drive, Dropbox, etc.

### Web-Based Handoff

If you prefer to build the site in the web app instead:

```bash
uniweb handoff client@example.com --web
```

This shows step-by-step guidance for creating the site on uniweb.app and transferring ownership through the UI.

## Deploying

For a conventional static deployment (no client workflow):

```bash
uniweb deploy
```

This uploads your built `dist/` to Uniweb hosting. The `dist/` folder is a standard Vite build, so you can also deploy to any static host — see [Deployment](../reference/deployment.md).

## Choosing a Path

| | Invite | Handoff | Deploy |
|---|---|---|---|
| **Who creates the site** | Client | Developer | Developer |
| **Client gets** | Blank site with your foundation | Populated site with content | A live website |
| **Editing capability** | Yes (web or Studio) | Yes (web or Studio) | No |
| **When to use** | Client wants to build their own content | Developer builds it for the client | Client just needs a website |

## See Also

- [CLI Commands](../reference/cli-commands.md) — Full command reference for all CLI commands
- [Deployment](../reference/deployment.md) — Static hosting options
- [Foundation Categories](./foundation-categories.md) — Bundled vs portable foundations
