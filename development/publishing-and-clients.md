# Registering a Foundation

This page covers **catalog registration** — making a foundation available as a product that other developers can use across their sites. If your foundation only powers one specific site, you don't need to register it as a deliberate, separate step: just run `uniweb publish` from the site directory and the CLI brings the foundation along — releasing it to the catalog under its scope automatically when its code changed. See [Deploying](./deploying.md) for the publish flow.

## Prerequisites

### Authenticate

All platform commands require authentication:

```bash
uniweb login
```

It signs you in — in the browser, with a password, or with a token — and works in one workspace: your personal one, or an organization's (`uniweb login --org @your-org`). See [`uniweb login`](../reference/cli-commands.md#uniweb-login).

### Build Your Foundation

Your foundation must be built before registering:

```bash
cd foundation
uniweb build
```

This produces `dist/entry.js` and `dist/meta/schema.json`. If you skip this step, `uniweb register` will build automatically.

## Registering

Register your foundation on the Uniweb catalog:

```bash
uniweb register
```

A foundation's scope is part of its name in `main.js` (`@your-org/marketing`). A name with no scope yet registers under the workspace you work in — an organization's scope, or your personal one — or under `--scope @your-org`, and the scope is written into the name. See [Identity](../reference/cli-commands.md#identity-scope--name). If you only mean to ship a single site, you don't need to call `register` yourself — `uniweb publish` brings the site's local foundation along.

Registering makes your foundation available for sites to consume — either through the web app (uniweb.app) or the desktop app (Uniweb Studio). The version comes from `package.json::version`.

Each version can only be registered once. To register an update, bump the version in `package.json`:

```json
{ "name": "src", "version": "1.0.1" }
```

When a site's `uniweb push` or `uniweb publish` brings the foundation along, it does this for you: changed code is released under the next version above the registered one, and that version is written into `package.json`.

## Publishing

To publish a site of your own to Uniweb hosting:

```bash
uniweb publish
```

`uniweb publish` brings the site's local foundation along, syncs the content, and goes live. To ship to a third-party static host instead, build `dist/` with `uniweb export` (or `uniweb deploy --host=<adapter>`) and upload it anywhere — see [Deployment](../reference/deployment.md).

## See Also

- [CLI Commands](../reference/cli-commands.md) — Full command reference for all CLI commands
- [Deployment](../reference/deployment.md) — Static hosting options
- [Foundation Categories](./foundation-categories.md) — Bundled vs portable foundations
