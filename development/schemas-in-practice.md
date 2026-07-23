# Schemas in Practice

[Data Schemas](./data-schemas.md) covers how to write a schema — fields, types, sections. This guide covers everything after that: where the schema file lives, how a second project uses it, and whether any of it requires an account.

The short version: a schema has to be **on disk where the build can find it**, always. Registering it with the Uniweb registry is a *separate* thing you do for a *separate* reason. Most confusion in this area comes from treating those as one decision.

---

## Two questions, not one

When you reference `@acme/person` from a section type's `meta.js`, two independent questions apply:

| Question | Answer decides | When it matters |
|---|---|---|
| **Where does the build find the definition?** | whether `uniweb build` succeeds | every single build, always |
| **Is the schema registered?** | whether authors can create records of this type in the Uniweb app | only when you work with app authors |

They don't substitute for each other. Registering a schema does **not** put it where the build can find it, and having it on disk does **not** register it.

That first question has no network in it at all. Schema references resolve from local files — a folder in your foundation, a folder you point at, or an installed package. If you never touch the second question, you never need an account, and your site builds and deploys to any static host.

---

## `@acme/person` is not an npm package

This trips people up, and the shape is genuinely misleading: a schema ref looks exactly like an npm scoped package.

**They are different namespaces that happen to share a syntax.** A schema ref's `@scope` is an **organization in the Uniweb registry**. An npm scope is an organization on npm. Nothing connects them.

The clearest proof is the standard schemas:

```yaml
# You write this ref:
data: { people: '@std/person' }
```

`@std` is an org in the Uniweb registry. But the file it resolves to ships in an npm package named **`@uniweb/schemas`**. The ref scope and the package scope aren't even spelled the same.

For every other org, the two *coincide by convention* — `@acme/person` looks for a package named `@acme/schemas` — but that's a default lookup rule, not an identity. And the moment you use a routed directory (below), npm leaves the picture entirely while the ref stays `@acme/person`.

So: **`@acme` in a ref names who owns the schema, not how it's delivered.** Delivery is a separate choice you make.

---

## The namespaces

| Ref | Who owns it | Where the build looks |
|---|---|---|
| `@/product` | this foundation | `<foundation>/schemas/product.{js,json,yml,yaml}` |
| `@std/person` | the Uniweb standards | the `@uniweb/schemas` package |
| `@acme/person` | an org — yours or someone else's | a routed directory, else an `@acme/schemas` package |
| `@uniweb/person` | — | rejected; `@uniweb` is reserved |

Worth noticing: **your own org and a third party's org resolve identically.** There is no build-time distinction between `@acme/person` when you're an Acme member and when you aren't. The difference only appears when you *register* — membership over a scope is what authorizes registering into it.

`@/` is the odd one out in a useful way. It means "whoever ends up owning this," so the same foundation can be registered under any org without editing a single ref. Registering resolves `@/product` into `@acme/product` at submit time.

---

## Three ways to put a schema where the build can find it

### 1. In the foundation itself — `@/`

A `schemas/` folder at the foundation root, beside `main.js`:

```text
foundation/
├── main.js
├── schemas/
│   └── product.yml        →  referenced as '@/product'
└── sections/
```

No configuration. This is the right default for a schema that belongs to one foundation.

### 2. A folder anywhere — routed with `schemas.config.js`

Point a scope at a directory of schema files. No package, no install, no npm:

```js
// foundation/schemas.config.js
export default {
  '@acme': '../shared/acme-schemas',
  '@brand': process.env.BRAND_SCHEMAS,   // unset → falls back to the package rule
}
```

`@acme/person` then resolves to `../shared/acme-schemas/person.yml`. Relative paths resolve against the foundation root.

Because it's plain JS, the directory can be anything you can compute — which makes this the natural fit for a **shared git repo**. A submodule, a sibling clone, or a folder in the same monorepo all work the same way:

```text
workspace/
├── acme-schemas/          # a plain git repo — no npm, no package.json needed
│   └── person.yml
└── foundation/
    └── schemas.config.js  # { '@acme': '../acme-schemas' }
```

Three constraints we've hit in practice, none of them obvious from the config shape:

- **Keys are scopes only.** `'@acme'` is valid; `'@acme/person'` is rejected — you can't route a single schema. One bad key fails the whole config, not just that entry.
- **Values are directories, never files.** The schema name is appended to whatever you give it.
- **A routed scope has no fallback.** If `@acme` is routed and `person.yml` isn't in that directory, the build fails — it will not then try the `@acme/schemas` package.

### 3. An installed package — `@acme/schemas`

The convention lookup: `@acme/person` → the `@acme/schemas` package, resolved from the **foundation's** `node_modules`. A pnpm workspace package, a private npm package, and a public one all behave identically.

Resolving from the foundation (rather than from the build tool) means each foundation can pin its own version of a shared catalog.

### Choosing between them

| | Routed directory | Package |
|---|---|---|
| **Setup** | one config line | a package + a dependency entry |
| **Versioning** | whatever git gives you | real semver, pinned per foundation |
| **Sharing across machines** | path must exist on each one | `pnpm install` |
| **Good for** | a team's shared repo, active co-development | a stable catalog many projects consume |

---

## Do you need to register?

Registering submits your schemas to the Uniweb registry so they become content types authors can create records against.

| You're doing this | Register? |
|---|---|
| Static site, content in markdown and YAML files, deployed to GitHub Pages or any static host | No |
| Running `uniweb validate` against your file-based data | No |
| Sharing schemas across your own foundations | No — put them on disk (above) |
| Content authors creating and editing records in the Uniweb app | Yes |
| Syncing site content to Uniweb hosting | Yes |

What registering does **not** do, and this is the part worth internalizing: it does not make a schema resolvable for someone else's build. If a teammate's foundation binds `@acme/person`, registration doesn't help them — they still need the file on disk, via a routed directory or a package. Registration and delivery are genuinely separate pipes.

This is a deliberate consequence of the framework being usable with no backend: builds don't reach the network, so a registry can't be a build dependency. The cost is that a shared catalog needs *both* — registered for the app, distributed for the build.

---

## Four scenarios

### Solo project, static host

You write schemas in `foundation/schemas/`, reference them as `@/product`, keep content in `collections/`, and deploy the built site anywhere. Standards like `@std/person` work too — add `@uniweb/schemas` as a foundation dependency. No account, no registration, no network.

### An agency catalog reused across client projects

Keep one catalog, reference it from every foundation. Either delivery works; pick by how the projects are laid out.

If clients live in one workspace, a package is tidy:

```text
workspace/
├── acme-schemas/          # { "name": "@acme/schemas" }
│   └── schemas/person.yml
├── client-a/foundation/   # depends on @acme/schemas
└── client-b/foundation/   # depends on @acme/schemas
```

If they're separate clones, route a directory instead — each foundation's `schemas.config.js` points at wherever that machine keeps the catalog repo, with the path from an env var if it varies.

Either way you fix `person` once and every project picks it up. Nothing here is registered yet, and nothing needs to be.

### Bringing app authors into an existing project

Now the schemas need to exist as content types. Register the catalog under your org:

```bash
uniweb login
cd acme-schemas
uniweb register --scope @acme
```

Your foundations are unchanged — they still resolve `@acme/person` from disk exactly as before. You've added a capability, not migrated anything. Re-registering an unchanged schema is a no-op, so this is safe to re-run.

### Consuming someone else's schemas

You need their definitions on disk. Two paths, and it's their choice which they offer:

- **They publish an npm package** named `@theirorg/schemas` — install it, reference `@theirorg/person`.
- **They publish a public git repo** — clone or submodule it, route the scope at that folder. No npm involved.

If they've only registered with the Uniweb registry and published nothing, you can't build against their schemas today. That's a real gap, not a configuration you're missing.

---

## Publishing a catalog for others

A schemas catalog is recognized two ways, and you can use whichever fits:

**A package that exports schemas** — the same contract `@uniweb/schemas` uses:

```js
// index.js
export const schemas = { person, project }
export const getSchema = (name) => schemas[name]
export const getSchemaNames = () => Object.keys(schemas)
```

**A folder of schema files** — no index, no exports, and no `package.json` required:

```text
acme-schemas/
└── schemas/
    ├── person.yml
    └── project.yml
```

Either can be registered on its own, with no foundation involved:

```bash
cd acme-schemas
uniweb register --scope @acme
```

Set `"uniweb": { "scope": "@acme" }` in `package.json` to drop the flag on later runs. A bare folder with no `package.json` can't record it, so pass `--scope` each time. Preview the exact submission without authenticating using `--dry-run`.

---

## When it fails

| Message | Cause | Fix |
|---|---|---|
| `'@acme/schemas' is not installed in this foundation` | ref resolves by the package rule; nothing routed, nothing installed | install the package, or route `@acme` in `schemas.config.js` |
| `Data schema '@acme/person' not found in the directory '@acme' is aliased to (…)` | scope routed, file missing there | add the file, or fix the path — routing has no package fallback |
| `alias key '@acme/person' must be a scope like '@agency'` | per-schema key in `schemas.config.js` | route the scope; per-schema routing isn't supported |
| `'@uniweb' is the reserved platform system namespace` | used `@uniweb/person` for a standard | use `@std/person` |
| `Data schema '@/product' not found. Expected one of: schemas/product.js, …` | `@/` ref with no matching file | add `schemas/product.yml` at the foundation root |

---

## See Also

- [Data Schemas](./data-schemas.md) — writing the schema: fields, types, sections, registering
- [Designing Data Schemas](./designing-data-schemas.md) — modeling decisions across a set of related types
- [Working with Data](./working-with-data.md) — how data is fetched and delivered at runtime
- [Component Metadata → Data](../reference/component-metadata.md#data) — the `data:` binding reference
- [CLI Commands](../reference/cli-commands.md) — `register`, `validate`, and the rest
