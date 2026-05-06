# Deploying to GitHub Pages

GitHub Pages is the lowest-friction way to put a Uniweb site on the public web for free. You already have a GitHub account; the framework ships an adapter that knows GH Pages's quirks; one command scaffolds a workflow that builds and publishes on every push to your default branch. No accounts to create, no DNS to wire up (unless you want a custom domain).

This page walks through the full recipe — create a project, push it to GitHub, deploy. If you're already comfortable with the deploy story and just want the host overview, see [Deploying](deploying.md). For the "two artifacts" mental model that explains *why* the framework ships these adapters, the same page covers it up front.

> **What it's good for.** Marketing sites, documentation, blogs, portfolios — anything that fits in a static-host artifact. GitHub Pages serves prerendered HTML + static assets; if your site needs server-side data fetching at request time or platform features (visual editing, foundation propagation), [Uniweb hosting](deploying.md#when-to-choose-uniweb-hosting) is the better fit.

---

## The recipe

### 1. Create a project

If you don't already have one:

```bash
npx uniweb create mysite --template marketing
cd mysite
```

Any template works — `marketing`, `docs`, `cv-loom`, etc. See [the template tour](template-tour.md) for the full list.

### 2. Put the project on GitHub

Create a repository on GitHub (the website's "New repository" button) and push:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:<your-user>/mysite.git
git push -u origin main
```

The repo can be public or private — GitHub Pages works either way on free accounts.

### 3. Add the deploy workflow

```bash
uniweb add ci
```

This command:

- Writes `.github/workflows/deploy-github-pages.yml` — the workflow GitHub runs on every push.
- Writes `site/deploy.yml` — records `github-pages` as the deploy target so re-running `add ci` later remembers your choices.

Multi-site workspaces? `add ci` will prompt for which site the workflow should build, or pass `--site <name>` directly.

### 4. Push the workflow and enable Pages

```bash
git add .github site/deploy.yml
git commit -m "Add GitHub Pages deploy workflow"
git push
```

Then on GitHub:

1. Open your repository's **Settings** → **Pages**.
2. Under **Source**, pick **GitHub Actions**.

That's the only one-time setup. From now on, every push to `main` (or `master` — the workflow listens to both) triggers a deploy. If your default branch is something else, edit the `branches:` line in the workflow.

### 5. Wait ~90 seconds for the first build

Watch progress in your repository's **Actions** tab. When the run finishes, the deployed URL appears at the bottom of the run summary — typically `https://<your-user>.github.io/<repo>/`.

That's it. The site is live.

---

## Custom domain

If you own `mysite.com` and want to use it instead of the `*.github.io` URL:

```bash
uniweb add ci --domain mysite.com --force
```

(`--force` because `add ci` won't overwrite the workflow you committed earlier.)

This adjusts a few things:

- Writes `site/public/CNAME` containing `mysite.com`. Vite copies this into `dist/` on every build, so GitHub Pages keeps the custom-domain setting across deploys.
- Bakes `UNIWEB_BASE: /` into the workflow (custom domains serve at the domain root, no `/repo/` prefix).
- Records the domain in `site/deploy.yml` so a later `uniweb add ci` (no flag) remembers it.

After committing and pushing:

1. Point your DNS at GitHub. The simplest setup is a `CNAME` record from `mysite.com` (or `www.mysite.com`) to `<your-user>.github.io`. For an apex domain, GitHub publishes the A records you'll need — see [GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
2. The next push triggers a deploy that picks up the CNAME. GitHub usually issues a Let's Encrypt certificate for the domain within a few minutes.

To switch back from a custom domain to the `*.github.io` URL: delete `site/public/CNAME`, re-run `uniweb add ci --force`, and push.

---

## What got created

| File | Purpose | Edit by hand? |
|---|---|---|
| `.github/workflows/deploy-github-pages.yml` | Builds on push to `main` or `master`, uploads `dist/` to GitHub Pages. | Yes — it's plain GHA YAML. Re-running `add ci` will refresh it (use `--force`). |
| `site/deploy.yml` | Records the deploy target so `add ci` can read back the domain on re-runs. | Yes — comments and other targets are preserved through CLI updates. |
| `site/public/CNAME` (custom domain only) | Tells GitHub Pages to serve at `mysite.com` instead of `*.github.io`. | The CLI manages it through `--domain`; no need to hand-edit. |

The workflow is intentionally readable. Open it and skim — there's no magic, just standard GitHub Actions.

---

## Working in draft mode

The default workflow publishes on every push to `main` or `master`. That's the right shape for the "I want to ship now" case, but it's not the right shape for "I want to work on a draft for a few days." Three escape hatches, in order of how often you'll want them:

### Draft branch (recommended)

Do your work on a non-default branch — `dev`, `drafts`, `wip`, whatever you like. Push freely; the workflow only fires on the default branch. When you're ready to publish, merge there:

```bash
git checkout -b drafts
# ... edits, commits, pushes — none of these deploy ...
git checkout main
git merge drafts
git push   # ← this is the publish gesture
```

This is just standard git. Nothing Uniweb-specific to learn.

### Skip a single build

GitHub Actions honors `[skip ci]` in commit messages natively. Add it to any commit you don't want to publish:

```bash
git commit -m "Fix typo in README [skip ci]"
git push
```

The push lands on `main`, but the workflow doesn't run. Useful for README/docs commits that don't affect the site.

### Manual publish

The generated workflow includes `workflow_dispatch`, which adds a **Run workflow** button in the GitHub Actions tab. Clicking it triggers a deploy on demand without needing a commit.

Useful for re-deploying to pick up a foundation update, or just to test that the pipeline works.

---

## Re-running `uniweb add ci`

`add ci` is idempotent and safe to re-run. The most common reasons:

- **Refresh the workflow after a CLI upgrade** — newer versions may emit a slightly different YAML (better cache config, new actions versions). Re-run with `--force` to pick up the latest.
- **Toggle custom domain on/off** — `--domain mysite.com --force` to switch on; delete `site/public/CNAME` and re-run with `--force` (no flag) to switch off.
- **Switch to a different site in a multi-site workspace** — `--site <name> --force`.

Without `--domain`, the CLI reads `site/deploy.yml`'s `targets.github-pages.domain` and uses it. You only re-type the domain when you want to change it.

---

## When GitHub Pages isn't the right fit

A few cases where another path is better:

| Need | Better fit |
|---|---|
| Visual editing for content authors | [Uniweb hosting](deploying.md#when-to-choose-uniweb-hosting) |
| Server-side data fetching at request time | Uniweb hosting (edge SSR) |
| Branch deploy previews automatically | Cloudflare Pages or Vercel via their native git integrations (no GHA workflow needed) |
| Foundation that other people's sites consume | Publish the foundation separately. See [Foundation on GitHub Pages](deploying.md#foundation-on-a-third-party-url--github-pages-s3-anywhere) for the version-pinned URL pattern, or the Uniweb registry for managed propagation. |
| Multi-locale with per-domain routing (`mysite.com` → English, `monsite.fr` → French) | Uniweb hosting (Cloudflare-for-SaaS-backed custom domains) |

For everything else — most marketing sites, docs, blogs, portfolios — GitHub Pages is a fine permanent home, not just a "test it out" choice.

---

## Troubleshooting

**The workflow ran but the page is 404.** The first deploy can take a minute or two after the workflow finishes — GitHub propagates the new artifact across its CDN. If it persists, check **Settings → Pages**: the source must be **GitHub Actions** (not "Deploy from a branch").

**Asset paths look wrong (`/foo` instead of `/repo/foo`).** The workflow derives `UNIWEB_BASE` from your repo name automatically, but the value only takes effect during the GHA build. If you previewed `dist/` locally with `pnpm exec uniweb build` (no env var), the build used `/`. That's expected — the deployed build is the source of truth.

**Custom domain shows "Not properly configured" in GitHub settings.** DNS is still propagating, or the `CNAME` file is missing from the deployed `dist/`. Confirm `site/public/CNAME` is committed and that the latest Actions run finished successfully.

**`uniweb add ci` says "No site found in this workspace."** Run from the workspace root (the directory containing `pnpm-workspace.yaml`), not from inside `site/`. If your project has multiple sites, pass `--site <name>`.
