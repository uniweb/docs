# AGENTS.md and the Guides

Every Uniweb project has an `AGENTS.md` at its root: the manual for that project and its version of Uniweb, for developers and for AI agents. It holds what someone arriving from React, Next or Astro would otherwise get wrong, and a numbered procedure for any task. The rest is in guides, one subject at a time, one command away.

## In a project

```bash
uniweb guide               # list the guides
uniweb guide content       # print one
uniweb guide theme --path  # print where its file is, for a tool that cuts long output
```

Without a global install, run it in the project as `npx uniweb guide`. The guides ship with the CLI, so in a project they describe the version the project pins, and [`uniweb update`](./cli-commands.md#uniweb-update) moves them forward along with `AGENTS.md`.

`AGENTS.md` tries to fit the limits tools set on instruction files, such as Codex's `project_doc_max_bytes`, but a tool may still cut it. Near its top it says how to tell: it ends with the line `End of AGENTS.md`, and an agent that can't see that line should read the rest of the file itself.

## With no project in front of you

`npx uniweb@latest guide <name>` works in an empty folder, and writes nothing. With no shell at all, read the files from the latest published package:

| Read | When you… |
|---|---|
| [`AGENTS.md`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/agents.md) | want what every project starts from |
| [`content`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/content.md) | write or restructure content, nav, layout files, SEO, math, icons, doc versions |
| [`foundation`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/foundation.md) | build a section type, layout or inset |
| [`theme`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/theme.md) | change colors, fonts, light/dark, tokens, `styles.css` |
| [`start`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/start.md) | start a project, grow the workspace, learn from a template |
| [`data`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/data.md) | work with records, queries, `[slug]` pages, external APIs, schemas, Loom |
| [`services`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/services.md) | add search, forms, tracking, Google Analytics or Tag Manager, an assistant |
| [`backend`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/backend.md) | have a site with accounts or member data |
| [`i18n`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/i18n.md) | add a language |
| [`ship`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/ship.md) | publish, deploy, push/pull, register, set up CI, update |
| [`migrate`](https://cdn.jsdelivr.net/npm/uniweb@latest/partials/guides/migrate.md) | port a React, Next or generated design |

These pages and those files describe the latest release. A project that is behind should move forward with `npx uniweb@latest update --yes`, rather than look for older documentation.
