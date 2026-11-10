# Libraries: Code Several Foundations Share

A section type is a front desk: it faces authors, reads their content and params, and hands ordinary props to the components that do the work. A **library** is the back office several foundations share: those components, the hooks and logic behind them, and the data types their records follow. It has no section type of its own. Each foundation keeps its own section types, layouts and look, and calls on the same library.

This page covers when a second foundation is worth it, how to make and wire a library, what goes in one, and how a change in it reaches a site.

---

## When two sites need two foundations

A foundation is the vocabulary a kind of site is made with. Two sites that differ only in how they look, or in how a section lays out, share one. Take the first of these that holds what differs:

| What differs | Where it lives | What it costs |
|---|---|---|
| Colors, fonts, light and dark | each site's `theme.yml` | nothing: one foundation |
| Corner radius, shadow depth, density: what makes a design classic or modern | foundation vars (`main.js` `vars`), set per site in `theme.yml` | a var per decision, read by every component |
| How a section lays out, within one vocabulary | a param (`variant`) and the components it picks | a control in the editor per choice |
| The vocabulary itself: other section types, layouts, structure | a second foundation, sharing a library with the first | a package to keep |
| Everything | two foundations that share nothing | the code written twice |

The fourth row is the one to reach for before the fifth. A second foundation is for a different vocabulary; it is never a way to make a bundle smaller.

---

## Making one

```bash
uniweb add library libraries/ui --foundation classic,modern
pnpm install
```

This creates `libraries/ui/`, lists it in `pnpm-workspace.yaml` and `package.json` `workspaces`, and wires each foundation named:

```text
libraries/ui/
├── package.json     # "name": "ui", private, React and @uniweb/kit as peer dependencies
├── index.js         # what it exports
├── components/
└── styles.css       # @source "./**/*.{js,jsx}";
```

```jsonc
// foundations/classic/package.json
"dependencies": { "ui": "file:../../libraries/ui" }
```

```css
/* foundations/classic/styles.css */
@import "tailwindcss" source("./");
@import "@uniweb/kit/theme-tokens.css";
@import "ui/styles.css";
```

The library's stylesheet tells Tailwind to read the library's own files, relative to the stylesheet, the way kit's does, so its classes reach each foundation's CSS wherever the package manager installed it. Without that import they are in no CSS at all: not the foundation's, and not a site's. The build says so, and names the line to add.

Run the command again with another `--foundation` to wire one more; with no `--foundation`, it wires the workspace's foundation when there is only one. The package is named for its folder, as a foundation is.

**Where it goes.** The folder you name is the folder created, as for every `uniweb add`:

| Layout | Command | Why |
|---|---|---|
| Single (`src/` and `site/`) | `uniweb add library ui` | a second foundation, or code another repository shares, is when one appears |
| Segregated (`foundations/`, `sites/`) | `uniweb add library libraries/ui` | beside the other kinds; a `libraries/*` pattern covers every one |
| Co-located projects | `uniweb add library libraries/ui`, at the workspace root | how projects share code while each keeps its own foundation |

**A library is any local package a foundation depends on.** Nothing else marks one, so a package made by hand, cloned or kept as a git submodule inside the workspace is a library as soon as a foundation depends on it: `uniweb add library <its folder> --foundation <name>` wires it without changing what is there. A library with no stylesheet of its own is wired with a `@source` line to its folder instead.

---

## What goes in

Export what the library shares from its `index.js`, and import it in a foundation as from any package:

```js
// libraries/ui/index.js
export { default as PlanCard } from './components/PlanCard.jsx'
```

```jsx
// foundations/classic/sections/Pricing/index.jsx
import { PlanCard } from 'ui'

export default function Pricing({ content }) {
  return <div className="grid gap-6 md:grid-cols-3">{content.data.plans.map((p) => <PlanCard key={p.$name} {...p} />)}</div>
}
```

A component in a library takes ordinary props and never fixes a design decision itself. It reads each one from a foundation var or a theme token:

```jsx
// libraries/ui/components/PlanCard.jsx
export default function PlanCard({ name, price }) {
  return (
    <div className="bg-card text-body p-6" style={{ borderRadius: 'var(--card-radius)', boxShadow: 'var(--card-shadow)' }}>
      <h3 className="text-heading text-xl font-semibold">{name}</h3>
      <p className="mt-2 text-3xl font-bold">{price}</p>
    </div>
  )
}
```

Each foundation declares the vars in its `main.js` (`classic` with a 2px radius and no shadow, `modern` with 1.25rem and a deep one), and each site can set them again in `theme.yml`. The same component then looks classic in one foundation and modern in the other.

Import `@uniweb/core` by its bare name only, as kit does. A subpath import bundles a second copy of it into the foundation.

### A section type both foundations offer

A section type stays each foundation's to offer: authors choose from a foundation's own `sections/`. When two vocabularies offer the same type, with the same content and params, the library can hold it and each foundation passes it on:

```js
// foundations/classic/sections/Banner/index.jsx
export { default } from 'ui/sections/Banner/index.jsx'
```

```js
// foundations/classic/sections/Banner/meta.js
export { default } from 'ui/sections/Banner/meta.js'
```

The foundation's editor schema carries the library's `meta.js`. When the two vocabularies differ, each foundation writes its own section type over the same components instead.

---

## Data types in a library

```bash
uniweb add library libraries/data --schemas --scope @acme
```

This gives the library a `schemas/` folder and its scope, in its `package.json`:

```json
{ "name": "data", "uniweb": { "scope": "@acme" } }
```

Each file in `schemas/` is a type named in full: `schemas/plan.yml` is `@acme/plan`. A foundation names it in a section's `meta.js`, and a site keeps its records under the scope's folder:

```js
// foundations/classic/sections/Pricing/meta.js
export default { data: { plans: '@acme/plan' } }
```

```text
sites/main/records/acme/plan/basic.yml
```

Nothing else is configured: the build reads the type from the library the foundation depends on, wherever it is.

On a site synced with a Uniweb backend, the library's types are registered from the library: run `uniweb register` in its folder before the first push of a foundation that names them. A foundation is released only once the types it names are registered, and `uniweb push` and `uniweb publish` release the site's foundation, not its library. A push that finds a type missing says which library defines it and the command to run there. A copy of the file in a foundation would be a second definition of one type, which stops the build when both are read and which `uniweb doctor` points out. Without `--scope`, the command takes the scope the wired foundations' names share. See [Data Schemas](./data-schemas.md#sharing-schemas-across-projects) and [Schemas in Practice](./schemas-in-practice.md).

---

## How a change reaches a site

Each foundation's build bundles the library, so the library's code ships inside each foundation that uses it.

- **Building.** A site build rebuilds its foundation when a file of a library it bundles changed, and says which library. So do `uniweb export` and `uniweb deploy --host`, and `uniweb register` before it uploads.
- **Developing.** `uniweb dev` serves the library, and an edit to one of its components updates the open page, as an edit to the foundation's own code does.
- **Seeing what it reaches.** `uniweb status`, run in the library, names the foundations that bundle it and the sites each one serves; a site's status names the libraries its foundation bundles.
- **A registered foundation.** A registered foundation version keeps the library as it was when that version was built, the way it keeps kit. A fix in the library reaches a hosted site when the site's foundation releases a new version and the site moves to it, which `uniweb publish` from the site does: it rebuilds the foundation, and releases a new version when the build changed.

---

## Keep it in the workspace

A library is a package of the workspace: inside it, as a folder the workspace lists. Code from another repository belongs there too, as a git submodule or a clone, and `uniweb add library <its folder>` lists and wires it.

A library outside the workspace, linked by a path, does not work the same way, and is not a layout to use:

- under npm, the build cannot resolve the packages the library's own code imports, such as `@uniweb/kit`, since none are installed beside it;
- under pnpm, a `file:` library is copied into the store, so a new file in it reaches a build only after `pnpm install`, and with `link:` the site loads a copy of the foundation.

Its data types do resolve from wherever it is, as long as the foundation depends on it.

---

## Wiring one by hand

`uniweb add library` writes nothing a developer can't. For a package you make or keep yourself:

1. List its folder in `pnpm-workspace.yaml` and in `package.json` `workspaces`.
2. Give it a `styles.css` holding `@source "./**/*.{js,jsx}";`, and `"./styles.css"` in its `exports` if it has an `exports` map.
3. In each foundation: `"<name>": "file:<path to it>"` in `dependencies`, and `@import "<name>/styles.css";` in `styles.css`.
4. For data types: `"uniweb": { "scope": "@acme" }` in its `package.json`, and the types in its `schemas/`.

---

## See Also

- **[Component Patterns](./component-patterns.md)**: the front desk, and the components behind it
- **[Project Structures](./project-structures.md)**: the layouts, and where a library goes in each
- **[Data Schemas](./data-schemas.md)**: writing a type
- **[Schemas in Practice](./schemas-in-practice.md)**: where the build finds a type, and when to register one
