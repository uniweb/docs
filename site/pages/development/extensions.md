# Extensions: Secondary Foundations

Design document for loading multiple foundations in a single site — a primary foundation that owns layout and theming, plus optional extensions that contribute additional section types.

---

## Problem

A portable foundation is general-purpose by design. But real sites need specialized components — a 3D product viewer, a particle animation, a custom data visualization. Putting these in the primary foundation makes it less portable. Not putting them there means the site owner has no CCA-aware way to add them.

The question is: where do specialized section types live when you don't want them in your portable foundation?

## Use Cases

Extension section types are used like any other section type. The content author writes `type: FancyHero` or `type: ParticleEffect` in frontmatter, and the runtime resolves it — regardless of which foundation provides it. This opens several patterns:

### Standalone section types

An extension provides complete section types that the content author uses directly. A `FancyHero` with built-in animations, a `Chart` that renders data visualizations, a `Map` with interactive markers. These are top-level sections — they don't need a parent from the primary foundation.

```markdown
---
type: FancyHero
params:
  animation: particles
---
# Welcome to Acme

Building the future.
```

This is the simplest case. The extension brings a section type that does something the primary foundation doesn't. The content author uses it exactly like any other type.

### Composition with primary foundation types

A section type from the primary foundation can accept child blocks from an extension. A generic Hero designed to render `block.childBlocks` in its media slot can host a `ParticleEffect` from an extension — without the Hero knowing anything about particles.

```yaml
# page.yml — nest an extension type under a primary type
sections:
  - hero:
      - particle-effect
```

```markdown
<!-- particle-effect.md -->
---
type: ParticleEffect
params:
  density: high
---
```

The Hero checks `block.childBlocks` and renders the child in its media slot. The content model handles the composition. This pattern keeps the primary foundation generic while letting extensions provide specialized decorative or interactive elements.

### Mixing approaches

A site might use both patterns. The primary foundation provides `Hero`, `Features`, `Grid`. An extension provides `FancyHero` (standalone replacement for specific pages), `ParticleEffect` (composed as a child of Hero), and `AnimatedCounter` (composed as a child of Grid). The content author picks whichever approach suits each page.

## Solution

A site can load one primary foundation and zero or more **extensions**. Extensions are URLs to pre-built foundation modules that contribute additional section types.

```yaml
# site.yml
extensions:
  - https://cdn.example.com/effects/foundation.js
  - https://cdn.example.com/data-viz/foundation.js
```

The runtime loads the primary foundation (as it does today), then loads extensions in parallel via `import()`, then merges the component registries. Content authors write `type: ParticleEffect` and nest it under whatever parent section they want — they don't know or care which foundation provides it.

## Design Decisions

### Extensions are runtime-loaded, always

The primary foundation can be bundled (built into the site via Vite) or runtime-linked (loaded via import map). Extensions are always runtime-linked — loaded via `import()` from a URL.

**Why:** The use case for extensions is adding specialized components to a portable foundation you didn't write. If your foundation is bundled — coupled to your site, one unit — you'd just put the specialized components in the foundation directly. There's no reason to separate them. Extensions exist precisely because the primary foundation is independent and you don't want to fork it.

Since extensions serve the portable/runtime-linked use case, they follow the same loading model. The primary foundation is loaded at runtime via import map; extensions are loaded the same way. Both share React and `@uniweb/core` through the import map. The site build doesn't need to know anything about extensions — it just passes the URL list through to the runtime.

### Extensions are URLs, not packages

At runtime in the browser, everything is a URL. npm is a development-time concept — the npm registry doesn't serve ES modules to browsers. If someone publishes an extension to npm, they still need to host the built `foundation.js` somewhere accessible by URL — a CDN, GitHub Pages, their own server.

Keeping extensions as URLs means:
- No npm resolution logic in the runtime or build
- No import map manipulation at build time
- No Vite aliases or local path resolution
- The site build is completely untouched
- Configuration is explicit — the URL is the identity

### Extensions are foundations (structurally)

An extension is not a new package type. It's a foundation — same build (`@uniweb/build` Vite plugin), same output (`foundation.js` + `schema.json`), same `src/sections/` discovery. The difference is in role, not structure.

| Concern | Primary Foundation | Extension |
|---------|-------------------|-----------|
| Section types | Yes | Yes |
| Layout component | Yes (exports via `foundation.js`) | No — ignored if present |
| Theme variables (`vars:`) | Yes (declares customizable vars) | No — should not declare |
| CSS semantic tokens | Defines and uses | Uses only |
| `styles.css` base styles | Yes | Scoped to own components only |

An extension built as a foundation means:
- No new build pipeline to create or maintain
- Foundation developers already know how to build one
- Existing tooling (sandbox, testing) works as-is
- Can be hosted anywhere that serves static files

### The site build doesn't change

Extensions don't add complexity to the build. The content collector reads the `extensions` list from `site.yml` and passes it through in site content. The runtime reads the list at initialization and loads each URL. The Vite config, foundation build, content collection, and template generation are all untouched.

This is intentional. The build is the most complex part of the system. Every feature that can be handled at runtime instead of build time should be — it keeps the build simple and keeps extensions decoupled from the site's build pipeline.

### Why not local extensions?

A local extension (`./effects` in the same workspace) would need build orchestration — the site build would need to build the extension first, resolve its output path, and set up Vite aliases. This adds complexity to the build for a case that doesn't strongly need it:

- If you're developing an extension locally, you can run its foundation build separately and point the site at the local dev server URL (the same workflow as developing a runtime-linked foundation).
- If your foundation and site are in the same workspace and you want more components, just add them to the foundation. The separation only matters when the foundation is independent.

Local development of extensions can use the same dev workflow as runtime-linked foundations — the extension runs its own dev server, and the site references it by localhost URL during development.

## Extension Package Structure

An extension is built and hosted independently. It's a standard foundation project:

```
effects/
├── src/
│   └── sections/
│       ├── ParticleEffect/
│       │   ├── meta.js
│       │   └── ParticleEffect.jsx
│       └── AnimatedCounter/
│           ├── meta.js
│           └── AnimatedCounter.jsx
├── package.json
└── vite.config.js           # Standard foundation build
```

After building, the `dist/` folder is hosted somewhere accessible:

```
https://cdn.example.com/effects/
├── foundation.js            # ES module, externals: react, core
├── schema.json              # Section type metadata
└── assets/
    └── style.css            # Component styles (if any)
```

## Dependency Architecture

The existing externalization model already handles multiple foundations cleanly.

**Externalized (shared via import map — one instance):**
- `react`, `react-dom`
- `@uniweb/core`

**Bundled into each foundation (tree-shaken independently):**
- `@uniweb/kit` — each foundation bundles only the kit code its components use

Kit duplication across bundles is the accepted tradeoff. If both the primary foundation and an extension use `<Icon>` or `useWebsite()`, that code exists in both bundles. The kit wrappers are small; the heavy shared logic lives in core, which is shared. Tree-shaking per foundation means each bundle stays minimal — an extension with two section types bundles only the kit code those two components need.

```
Browser
├── Import Map (shared)
│   ├── react → single instance
│   ├── react-dom → single instance
│   └── @uniweb/core → single instance
│
├── Primary Foundation Bundle
│   ├── Section types (Hero, Features, Header, Footer, ...)
│   └── Kit code used by those types (tree-shaken)
│
├── Extension Bundle: effects
│   ├── Section types (ParticleEffect, AnimatedCounter)
│   └── Kit code used by those types (tree-shaken)
│
└── Extension Bundle: data-viz
    ├── Section types (Chart, Map, Dashboard)
    └── Kit code used by those types (tree-shaken)
```

## Component Resolution

When the runtime encounters `type: ParticleEffect`, it looks up the component across all loaded registries.

**Resolution order:**
1. Primary foundation (checked first)
2. Extensions in declared order (from `site.yml`)

**Collision rule:** Primary wins. If the primary foundation and an extension both define `Hero`, the primary's `Hero` is used. This is intentional — extensions add section types, they don't override the primary foundation's.

**Schema merging:** Each foundation produces a `schema.json`. The runtime (or build) merges them for the visual editor (uniweb.app), using the same precedence rule. The merged schema gives content authors a single palette of available section types.

## CSS Conventions

Extensions must coexist with the primary foundation's design system without interference.

### Use semantic tokens, don't define them

Extension components use `var(--heading)`, `var(--text)`, `var(--link)` — the same semantic tokens any CCA-proper component uses. This means they automatically adapt to whatever theme the site applies. An extension that hardcodes colors breaks across sites.

```jsx
// Extension component — uses site's semantic tokens
export default function ParticleEffect({ content, params }) {
  return (
    <div style={{ color: 'var(--text)', background: 'var(--bg-subtle)' }}>
      {/* ... */}
    </div>
  )
}
```

### No global CSS resets or base styles

The primary foundation's `styles.css` sets the baseline. An extension that resets `box-sizing`, `body` margins, or font defaults fights the primary foundation. Extension CSS should be scoped to its own components.

### Namespace custom CSS variables

If an extension needs CSS variables beyond the standard semantic tokens, it should prefix them to avoid collisions with the primary foundation or other extensions:

```css
/* Extension: @acme/effects */
.particle-canvas {
  --effects-particle-speed: 2s;
  --effects-particle-count: 50;
}
```

Standard semantic tokens (`--heading`, `--text`, `--bg`, etc.) are unprefixed because they're site-level, owned by the primary foundation. Extension-specific variables are namespaced because they're component-level.

### No Tailwind config overrides

If the primary foundation uses Tailwind, its config defines the design system. An extension that extends or overrides the Tailwind config creates unpredictable results. Extensions should use the existing config (which they get for free if built in the same workspace) or use inline styles and semantic tokens.

## What Extensions Don't Do

Extensions are purely additive — they bring more section types. They don't:

- **Override the primary foundation's Layout.** The primary foundation controls page structure (header/main/footer, sidebars). Extensions that export a Layout are ignored.
- **Redefine theme variables.** The primary foundation declares customizable vars in `foundation.js`; the site sets values in `theme.yml`. Extensions don't participate in this flow.
- **Provide middleware or lifecycle hooks.** Extensions don't wrap the React tree, intercept routing, or modify initialization. They're component registries, not plugins.
- **Replace existing section types.** Primary foundation's types always take precedence over extension types of the same name.

## Relationship to Existing Patterns

### ChildBlocks composition

The primary use case — specialized decorative or interactive components nested inside generic section types — already works via CCA's ChildBlocks pattern. A Hero designed to render child blocks doesn't need to know what the child is. The extension just provides the `type:` that the child block references.

### Dispatcher pattern

Within a foundation, the Dispatcher pattern handles variants of a single section type (Grid → Grid, Masonry, Carousel). Extensions handle a different need: entirely new section types that don't fit the primary foundation's scope. If a variant makes sense (it's a rendering strategy for the same content), use the Dispatcher. If it's a genuinely different component with its own content interface, it belongs in an extension.

### Runtime linking

The [runtime linking](../../packages/uniweb/docs/sites/runtime-linking.md) doc already describes loading multiple foundations via import maps. Extensions use the same mechanism — each extension is a separate ES module loaded via `import()`, sharing React and core through the import map.

## Loading Flow

```
Site boots
  → Primary foundation loads (bundled or runtime, as today)
  → Runtime reads extensions list from site content
  → Extensions load in parallel via import()
  → All component registries merge into Uniweb instance
  → BlockRenderer resolves types across all sources
```

Extensions load after the primary foundation but before first render. Since extensions are independent URLs, they load in parallel via `Promise.all` — adding extensions doesn't serialize the loading chain.

For prerender (SSG), the same pattern applies: the prerender script loads extension modules via `import()` and registers them on the Uniweb instance before rendering pages.

## Implementation Scope

The changes are concentrated in a few files:

| File | Change | Size |
|------|--------|------|
| `packages/core/src/uniweb.js` | Multi-source `getComponent()` and `getComponentMeta()` | Small (~20 lines) |
| `packages/runtime/src/index.jsx` | Load extension URLs after primary foundation | Small |
| `packages/build/src/prerender.js` | Load extension modules for SSG | Small |
| `packages/build/src/site/content-collector.js` | Pass `extensions` list through from site config | Trivial |

**What doesn't change:** BlockRenderer, Block class, foundation build, Vite config, template generation, content collection, theme processing.

## Future Considerations

- **Lazy loading:** Load extension bundles only when a page actually uses one of their section types, rather than upfront.
- **Schema discovery:** Convention for locating an extension's `schema.json` from its URL (e.g., sibling file), so the visual editor can discover available types.
- **Extension registry:** A directory of published extensions discoverable by URL.

---

## See Also

- [Core Architecture Philosophy](../internal/core-architecture-philosophy.md) — Layered architecture (core, kit, foundation)
- [Runtime Linking](../../packages/uniweb/docs/sites/runtime-linking.md) — How foundations are loaded via import maps
- [Component Patterns: Building Blocks](../../packages/cli/guides/developers/component-patterns.md#building-blocks) — ChildBlocks composition pattern
- [Theming Architecture](../internal/theming-architecture.md) — Semantic tokens and theme flow
