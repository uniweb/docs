# Framework Versions

How Uniweb's own packages are numbered — the `uniweb` CLI and the `@uniweb/*` packages your project depends on — and how your project moves from one version to the next. (Versioning the content of a documentation site is a different subject: see [Documentation Versioning](./versioning.md).)

## Reading a version

| Part | What it carries | In your project |
|------|-----------------|-----------------|
| Patch — 1.0.**1** | Fixes and new features | Installs by itself |
| Minor — 1.**1**.0 | Changes you may need to act on | Arrives through `uniweb update`, which lists it |
| Major — **2**.0.0 | Something really big | Rare |

A breaking change is one your project may need to act on: a renamed option, a removed export, a `site.yml` key spelled differently. Uniweb releases them as **minor** versions — below 1.0 and above it — so a new minor version is the one to read before shipping. Most of them ask nothing of most projects, and when one does, the build or the CLI says what to change.

## What 1.x means

A package at 1.x has left its experimental phase: you can build on it with production confidence. It does not mean the package stops changing. Breaking changes keep arriving as minor versions, listed by `uniweb update`, and a 2.0 is kept for something really big.

## Your project's version ranges

`uniweb create` writes each `@uniweb/*` dependency, and `uniweb` itself, as a tilde range:

```json
{
  "devDependencies": {
    "uniweb": "~0.89.4"
  }
}
```

A tilde range accepts patches — `0.89.x` here — and nothing past them. So `pnpm install` and `pnpm update` bring fixes and features, never a minor version.

Projects created earlier have caret ranges (`^0.89.4`). Below 1.0 a caret behaves the same way, and `uniweb update` writes a tilde the next time it moves that package.

## Moving to a new version

```bash
npx uniweb@latest update --dry-run   # what would change
npx uniweb@latest update             # change it
```

`@latest` is the part that matters: it runs the newest CLI, which aligns every `@uniweb/*` package — and `uniweb` itself — to the versions released with it, lists each package that crosses a minor version, and refreshes `AGENTS.md`. A bare `uniweb update` runs the copy in your project, which aligns to what it already knows. See [`uniweb update`](./cli-commands.md#uniweb-update) for every option.

Keep the `@uniweb/*` packages at the versions `update` sets. They are released together, so moving one on its own — `pnpm add @uniweb/kit@latest`, say — can pair it with a version of another package it was not released with.

## `uniweb@1.0.0` on npm

The npm registry lists a `uniweb@1.0.0` published in 2017. It is a placeholder npm itself published before the name was ours, not the Uniweb CLI. Use `npx uniweb@latest`.

---

## See Also

- [CLI Commands](./cli-commands.md#uniweb-update) — `uniweb update` and its options
- [Documentation Versioning](./versioning.md) — versioning a documentation site's content
