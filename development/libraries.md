# Libraries: Code Several Foundations Share

When two foundations need the same pricing card, the same sign-up form or the same footer, a copy in each means every fix is made twice, and the copies drift apart the first time someone forgets. A **library** holds that code once. Each foundation imports it as from any package and keeps its own section types, layouts and look, and a fix in the library reaches every site that uses it at its next build.

A section type is a front desk: it faces authors, reads their content and params, and hands ordinary props to the components that do the work. A library is the back office several foundations share: those components, the hooks and logic behind them, and the data types their records follow. It has no section type of its own to offer.

This page covers when a second foundation is worth it, how to make a library, how to move copies you already have into one, how to split shared code between libraries, data types, how a change reaches a site, a library kept outside the workspace, and what the build says when something is off.

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

The fourth row is the one to reach for before the fifth. A second foundation is for a different vocabulary; it is never a way to make a bundle smaller, since each foundation bundles only what it imports anyway.

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
| Another repository | `uniweb add library ../acme-shared`, a folder beside the workspace | code several workspaces share ([below](#a-library-outside-the-workspace)) |

**A library is any local package a foundation depends on.** Nothing else marks one, so a package made by hand, cloned, kept as a git submodule, or in a folder beside the workspace is a library as soon as a foundation depends on it: `uniweb add library <its folder> --foundation <name>` wires it without changing what is there. A library with no stylesheet of its own is wired with a `@source` line to its folder instead.

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

A file can also be imported by its path in the library, which suits code moved from a foundation that imported it by path (below): `import Button from 'ui/components/Button.jsx'`, with `"./components/*": "./components/*"` in the library's `exports`, as `uniweb add library` writes it.

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

### Section types

Authors choose a section type from a foundation's own `sections/`, so a type stays each foundation's to offer even when its code is the library's. Which of three cases a type is decides what the library holds:

- **The same type in each foundation**, the same component and the same `meta.js`: the library holds it whole, and each foundation keeps two lines that pass it on.

  ```js
  // foundations/classic/sections/Banner/index.jsx
  export { default } from 'ui/sections/Banner/index.jsx'
  ```

  ```js
  // foundations/classic/sections/Banner/meta.js
  export { default } from 'ui/sections/Banner/meta.js'
  ```

  The foundation's editor schema carries the library's `meta.js`, so authors see the same title, params and presets in each.

  `uniweb add section Banner --library ui` writes all of it: the type in `ui/sections/Banner/`, and the two lines in each foundation that depends on `ui`. With `--foundation classic,modern` it names the foundations instead, and wires any that doesn't depend on the library yet. Run it again with another foundation to offer the type there too.

- **The same component, offered differently:** another title, other params or presets in each `meta.js`. The library holds the component (`index.jsx`, and the files it imports); each foundation keeps its own `meta.js` and passes on only `index.jsx`.

- **Different components:** the type stays each foundation's, even when its `meta.js` is the same file. Sharing the `meta.js` alone would tie two editor interfaces to code that doesn't share them: a param one foundation's component adds would show in the other's editor, unread.

---

## Moving copies into a library

Foundations often begin as copies of one another, and much of their code is still the same file in each. Moving it into a library is mechanical, and you can show it changed nothing.

1. **Find what is still the same.** List the files identical in two foundations, path by path:

   ```bash
   cd foundations
   for f in $(cd classic && find components sections layouts utils -type f ! -name '.*' 2>/dev/null); do
     cmp -s "classic/$f" "modern/$f" && echo "$f"
   done
   ```

   Look at the ones that differ too: a file whose only difference is a comment's example is the same code, and one copy with both examples serves both.

2. **Move a file with what it imports.** A file can move only when every file it imports by path (`./`, `../`, or an alias such as `#components/`) moves too, and is the same in every foundation that holds it. We've found this is where most of the work is: a component that looks shared but imports its foundation's own `Button` renders that foundation's button, and stays until `Button` moves.

3. **Point the foundations at it.** In the library the file keeps its path, and a foundation imports it by the library's name and that path: `#components/Button.jsx`, or `../../components/Button.jsx`, becomes `ui/components/Button.jsx`. When the moved files name each other through subpath aliases, give the library the same `imports` map the foundations have, so they still do:

   ```json
   {
     "name": "ui",
     "imports": { "#components/*": "./components/*", "#utils/*": "./utils/*" },
     "exports": {
       ".": "./index.js",
       "./styles.css": "./styles.css",
       "./components/*": "./components/*",
       "./sections/*": "./sections/*",
       "./utils/*": "./utils/*"
     }
   }
   ```

   A section type moves by the case it is ([above](#section-types)).

4. **Check that it changed nothing.** Build the workspace before the move and after, and compare what came out:

   ```bash
   npx uniweb build
   cp -R sites/main/dist /tmp/main-before && cp -R foundations/classic/dist /tmp/classic-before
   # … the move, then: pnpm install
   npx uniweb build
   diff -r -x '*.map' /tmp/main-before sites/main/dist && diff -r -x '*.map' /tmp/classic-before foundations/classic/dist && echo "the same"
   ```

   The same files mean the move changed nothing a visitor sees, and nothing a publish sends: each foundation builds to the code it built to before, so the move alone gives a synced site nothing new to release. Sourcemaps are left out because they name each file's source path, which the move changes; no visitor loads one, and a publish doesn't send them.

---

## Splitting shared code by who uses it

Each foundation bundles only the code it imports, but its `@import "ui/styles.css"` has Tailwind read every file of the library. A library that holds what several foundations share in different combinations therefore gives each foundation the classes of components it never draws. Measured on three foundations sharing 89 files: one library for all of them put 229 more selectors, 3 KB gzipped, into the CSS of a foundation that used none of the components behind them.

So split shared files by the foundations that use them, a library per group:

| Used by | Library |
|---|---|
| `store`, `blog` and `portal` | `libraries/ui`: buttons, form controls, the footer |
| `store` and `portal` | `libraries/commerce`: the cart, the price table |
| `blog` and `portal` | `libraries/articles`: the article card, the author page |

```bash
uniweb add library libraries/ui --foundation store,blog,portal
uniweb add library libraries/commerce --foundation store,portal
uniweb add library libraries/articles --foundation blog,portal
```

A library that uses another names it in its own dependencies, `"ui": "file:../ui"` in `libraries/commerce/package.json`, written by hand since `add library` wires foundations, and imports it by name. Each foundation imports the stylesheet of every library it uses, as `add library` wires it, so each foundation's CSS holds what it held when it had the copies.

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

Nothing else is configured: the build reads the type from the library the foundation depends on, wherever it is. Without `--scope`, `add library --schemas` takes the scope the wired foundations' names share.

**On a site synced with a Uniweb backend:**

- `uniweb register` in a foundation registers each type it names that a library defines, from the library, before the foundation itself: a backend takes a foundation only once the types it names are registered. `uniweb push` and `uniweb publish` release a site's foundation through `register`, so they register the types too, with nothing to run first.
- A change to one of those types changes every foundation that names it, so the next push or publish of any of their sites releases its foundation and registers the change. Every site that names the type then reads the new definition. A backend that holds records of a type refuses a change those records can't take, and says what it is ([Data Schemas](./data-schemas.md#a-schema-repo-on-its-own)).
- A library's types register under its scope, which takes a member of that scope. A library from an organization you aren't a member of is used as that organization registered it.
- `uniweb register` run in the library registers its types alone.

A copy of a type's file in a foundation would be a second definition of one type, which stops the build when both are read, and which `uniweb doctor` points out. See [Data Schemas](./data-schemas.md#sharing-schemas-across-projects) and [Schemas in Practice](./schemas-in-practice.md).

## Mappings in a library

A mapping says how a vendor's file translates to and from one of your types, such as a catalog feed's CSV from a vehicle ([Blueprint → Integrations](../reference/blueprint.md#integrations)). One that several foundations use belongs beside its type, in the library's `mappings/`, one per file, named in full by the library's scope: `mappings/vehicle-to-meta.yml` is `@acme/vehicle-to-meta`. A library may hold mappings alone.

```yaml
# libraries/data/mappings/vehicle-to-meta.yml
label: Meta catalog
model: '@/vehicle'            # the library's own type, or any other named in full
direction: out
shape: list
format: { type: csv }
fields:
  - { title: listing.title }
```

A mapping's `@/x` names are the library's, so `@/vehicle` here is `@acme/vehicle`, and a `keys_from` names another of the library's mappings.

A foundation carries a library's mapping by naming it in its `main.js`:

```js
// foundations/classic/src/main.js
export default {
  name: '@shop/classic',
  mappings: ['@acme/vehicle-to-meta'],
}
```

The build reads each one from the library that defines it, and stops on one it can't carry: a name not in full, one in the foundation's own scope (its own mappings are files in its `src/mappings/`), one two packages define, or one that names a type or a mapping the library doesn't define. A name no package of the workspace defines only warns, because it may already be registered. A site's `blueprint.yml` then names it in full: `mapping: '@acme/vehicle-to-meta'`.

**On a site synced with a Uniweb backend:**

- `uniweb register` in a foundation registers each mapping it carries from a library, from the library, after the library's types and before the foundation. It also sends the mapping its `keys_from` names and the library types it names. So do `uniweb push` and `uniweb publish`.
- A backend keeps, for each mapping a foundation names, the version it held when that foundation version registered, and a site's backend uses that version. A change to the library's mapping reaches a site when its foundation releases a new version and the site moves to it, as a change to the library's code does.
- `uniweb register` run in the library registers its types and mappings.

---

## How a change reaches a site

Each foundation's build bundles the library, so the library's code ships inside each foundation that uses it.

- **Building.** A site build rebuilds its foundation when a file of a library it bundles changed, and says which library. So do `uniweb export` and `uniweb deploy --host`, and `uniweb register` before it uploads.
- **Developing.** `uniweb dev` serves the library, and an edit to one of its components updates the open page, as an edit to the foundation's own code does.
- **Seeing what it reaches.** `uniweb status`, run in a library inside the workspace's folder, names the foundations that bundle it and the sites each one serves; a site's status names the libraries its foundation bundles, one beside the workspace included.
- **A registered foundation.** A registered foundation version keeps the library as it was when that version was built, the way it keeps kit. A fix in the library reaches a hosted site when the site's foundation releases a new version and the site moves to it, which `uniweb publish` from the site does: it rebuilds the foundation, and releases a new version when the build changed.

---

## A library outside the workspace

A library can also live in a folder beside the workspace, in a repository of its own say, which several workspaces share. `uniweb add library ../acme-shared --foundation classic` makes it there, or wires the package already there, and each foundation depends on it by its path:

```jsonc
// foundations/classic/package.json
"dependencies": { "acme-shared": "file:../../../acme-shared" }
```

The workspace lists it by that path, as it lists a library inside it:

```yaml
# pnpm-workspace.yaml
packages:
  - foundations/*
  - sites/*
  - '../acme-shared'
```

So the package manager links its folder: a new file or an edit reaches the next build and the open page, as in a library inside the workspace, and `uniweb update` moves its ranges with the rest. pnpm installs the library's own dependencies in its folder. npm installs them at the workspace's root, where the library's own files can't reach them, so the build resolves what the library imports as the foundation's code would: its peer dependencies, such as React and `@uniweb/kit`, from the foundation, and the rest from the workspace's install. Its data types resolve from its `schemas/` too.

Depend on it with `file:`, as `uniweb add library` writes it. A library wired by hand and not listed in the workspace is one pnpm installs as a copy, which a change to its folder reaches only after the next install: the build says so, and names the line that lists it.

A git submodule or a clone inside the workspace works the same way, as a package the workspace lists.

---

## When the build says something

| What you see | What it means | What to do |
|---|---|---|
| `[uniweb] The foundation bundles ui, and its styles.css reads no classes from it, so any class only it writes is missing from …` | Tailwind never reads the library's files for this foundation, so classes only the library uses are in no CSS | add the line it names to the foundation's `styles.css`, `@import "ui/styles.css";` |
| `ui, a library it bundles, changed — rebuilding classic` | a site build found a library file newer than the foundation's build | nothing: the rebuild is the fix |
| `Data schema '@acme/plan' is defined by 2 packages this foundation reads: …` | a type's file is in two packages, a library and a copy in a foundation say | keep one file, and name the type in full elsewhere; `uniweb doctor` lists each such type |
| `Data schema '@acme/plan' is defined nowhere this foundation can read: …` | no package the foundation reads defines that type under that scope | check the library's `uniweb.scope` and its `schemas/`, and that the foundation depends on it |
| `@acme/member is defined in foundations/hub/, which has not registered it` | a push or publish names a type another *foundation* defines, and that foundation was never registered on this backend | register that foundation first, with the command the message prints |
| `This uniweb (…) needs a newer @uniweb/build than the one installed …` | the project's framework packages are older than the CLI | `npx uniweb@latest update --yes` |
| `[uniweb] acme-shared is installed as a copy, so a change to its folder reaches a build only after the next install …` | pnpm copied a library the workspace doesn't list, so the build reads code you've already changed | list its folder in the workspace, the line it names: `uniweb add library <folder>` does |
| `Failed to resolve entry for package "classic"`, under pnpm | a library outside the workspace, not listed in it, is linked with `link:`, which gives each site a copy of its foundation | list the library in the workspace and depend on it with `file:` |

---

## Wiring one by hand

`uniweb add library` writes nothing a developer can't. For a package you make or keep yourself:

1. List its folder in `pnpm-workspace.yaml` and in `package.json` `workspaces`, unless it is outside the workspace.
2. Give it a `styles.css` holding `@source "./**/*.{js,jsx}";`, and `"./styles.css"` in its `exports` if it has an `exports` map.
3. In each foundation: `"<name>": "file:<path to it>"` in `dependencies`, and `@import "<name>/styles.css";` in `styles.css`.
4. For data types: `"uniweb": { "scope": "@acme" }` in its `package.json`, and the types in its `schemas/`.

---

## See Also

- **[Component Patterns](./component-patterns.md)**: the front desk, and the components behind it
- **[Project Structures](./project-structures.md)**: the layouts, and where a library goes in each
- **[Data Schemas](./data-schemas.md)**: writing a type
- **[Schemas in Practice](./schemas-in-practice.md)**: where the build finds a type, and when to register one
- **[CLI Commands](../reference/cli-commands.md)**: `uniweb add library`, `uniweb status` and `uniweb register`
