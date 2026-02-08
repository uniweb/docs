# Extensions and the Portability Paradox

## The tension

A portable foundation is valuable because it's general-purpose. A marketing foundation that handles hero sections, feature grids, CTAs, and testimonials can serve dozens of sites. Its portability comes from not containing anything site-specific.

But real sites need specialized things. A 3D product viewer for an e-commerce launch. A particle animation for a creative agency. A custom data visualization for a research group. These components are too specific for a general-purpose foundation — including them would make it less portable. But leaving them out means the site has no CCA-aware way to add them.

This is the portability paradox: the more portable a foundation becomes, the less it can serve any particular site's specialized needs. And the more specialized it becomes, the less it can serve multiple sites.

Extensions resolve the paradox by changing where specialization lives. Instead of putting specialized components inside the portable foundation (destroying its portability) or outside the CCA system entirely (losing theming, context, and composition), extensions place them in secondary foundations that run alongside the primary one.

## Foundations, not plugins

The most consequential design decision is what extensions *are*: they're foundations. Not a new package type, not a plugin format, not an addon system. An extension is built with the same tools, follows the same conventions, and produces the same output as a primary foundation. The difference is in role, not structure.

| Concern | Primary foundation | Extension |
|---------|-------------------|-----------|
| Section types | Yes | Yes |
| Layout component | Yes | No — ignored if present |
| Theme variables | Declares and customizes | Uses only |
| Semantic tokens | Defines via theme | Uses via standard tokens |
| Build tooling | Standard foundation build | Same |

A separate plugin system would mean a new build pipeline, new APIs for plugin authors, new integration points that could break, and new testing infrastructure. By making extensions structurally identical to foundations, everything that already works — the build, the sandbox, the testing tools, the developer's existing knowledge — works for extensions without modification.

The same principle that makes CCA a protocol rather than a vocabulary applies here. The framework provides the resolution and loading machinery. The foundation — whether primary or extension — provides section types. The framework doesn't distinguish between them at the component level. A `ParticleEffect` from an extension is resolved, rendered, and themed exactly like a `Hero` from the primary foundation.

## Additive only

Extensions are purely additive. They bring more section types. They don't override the primary foundation's layout, redefine theme variables, provide middleware, or intercept lifecycle hooks. If an extension and the primary foundation both define a `Hero`, the primary wins. Extensions complement the primary foundation — they don't compete with it.

This constraint is what makes the system predictable. Adding an extension can't break existing pages — it can only make new section types available. Removing one might leave some sections without a matching type, but it won't change how existing types render.

The rule also keeps the mental model simple for content authors. There's one theme, one layout system, one set of design tokens. Extensions add capabilities within that system. They don't alter the system itself.

## Sites without a local foundation

To understand why extensions are always runtime-loaded, it helps to consider the workspace they serve.

A Uniweb workspace doesn't need to contain a foundation. A workspace can be just a site — markdown content, configuration, pages — with its primary foundation delivered at runtime from an npm package or a URL. This is the natural shape of a project where the site author isn't a component developer: they write content and configure the site, but they don't build or modify components.

```
workspace/
└── site/
    ├── site.yml          # Foundation + extensions by URL
    ├── theme.yml          # Colors, fonts, scheme
    └── pages/
        └── home/
            ├── 1-hero.md
            ├── 2-features.md
            └── 3-effects.md   # type: ParticleEffect — from extension
```

Without extensions, this setup works for everything the portable foundation provides. But the moment the site needs a specialized component, the author hits a wall. Their options are to fork the foundation (becoming responsible for its build and maintenance), create a local foundation in their workspace (requiring a component development workflow they may not have), or step outside CCA entirely (losing theming, context, and composition). None of these preserves the simplicity of the content-only workspace.

Extensions close this gap. The site author adds a URL to `site.yml`, and new section types become available — fully themed, context-aware, and composable with the primary foundation's types:

```yaml
# site.yml
foundation: '@starter/marketing'
extensions:
  - https://cdn.example.com/effects/foundation.js
  - https://cdn.example.com/data-viz/foundation.js
```

No local foundation build. No component development environment. The workspace stays content-only, and the content author has access to Hero, Features, and Grid from the primary foundation alongside ParticleEffect, AnimatedCounter, Chart, and Dashboard from extensions — all resolved, themed, and composed through the same system.

This is the deeper reason extensions are runtime-loaded. They serve a use case where there is no local build pipeline for components — where the entire component layer arrives pre-built from external sources. The build system has nothing to build on the component side, and nothing about extensions needs it to.

Extensions are also URLs, not package references. At runtime in the browser, everything is a URL — npm is a development-time concept. Keeping extensions as URLs means no package resolution logic in the runtime, no import map manipulation at build time, and no Vite aliases. The configuration is explicit: the URL is the identity.

For projects that *do* have a local foundation, extensions are unnecessary for local components. If you're already building a foundation, you add specialized section types to it directly. Extensions matter when the foundation comes from somewhere else — an npm package, a CDN, another team's repository. The separation exists at the boundary where the site author's control ends and someone else's component code begins.

## Composition across foundations

Extensions become powerful when they compose with the primary foundation's types. The content author can use extension types as standalone sections — writing `type: FancyHero` exactly as they'd write `type: Hero` — or nest them as child blocks inside primary foundation sections.

A generic Hero designed to render child blocks in a media slot can host a `ParticleEffect` from an extension, without the Hero knowing anything about particles:

```markdown
<!-- hero.md — primary foundation type -->
---
type: Hero
---
# Welcome to Acme

Building the future.
```

```markdown
<!-- hero/1-particle.md — extension type, nested as child block -->
---
type: ParticleEffect
params:
  density: high
---
```

The Hero renders its child blocks. The extension provides the type. The content model handles the composition. Neither component knows about the other.

This works because CCA's composition model is type-agnostic. Child blocks are resolved by `type:` regardless of which foundation provides them. The content author composes freely across foundation boundaries without knowing those boundaries exist.

## The design system contract

Extensions participate in the primary foundation's design system without modifying it. Extension components use semantic tokens — `text-heading`, `bg-card`, `border-border` — the same tokens any CCA component uses. They adapt automatically to whatever theme the site applies. A `ParticleEffect` rendered in a dark section gets dark-context colors; in a light section, light-context colors. The extension author writes the component once, and the context system handles the rest.

The contract is asymmetric: extensions *use* the design system, they don't *define* it. The primary foundation establishes the theme tokens, the neutral palette, the font families. Extensions consume those choices. If an extension needs CSS variables beyond the standard semantic tokens, it namespaces them to avoid collisions — `--effects-particle-speed` rather than `--particle-speed`. Standard tokens are shared vocabulary; extension-specific variables are private.

## What extensions reveal about CCA

Extensions are a small feature in implementation — a few dozen lines across a handful of files. But they reveal something about the architecture: CCA is designed so that adding capabilities doesn't require modifying the system that orchestrates them.

The runtime already resolves section types by name. Extensions give it more names to resolve. The context system already adapts components to visual environments. Extensions give it more components to adapt. The composition model already nests child blocks by type. Extensions give it more types to nest. Nothing in the orchestration layer changes. It just has more material to work with.

This is the architectural payoff of building CCA as a protocol. The framework defines how resolution, loading, theming, and composition work. It doesn't define what section types exist, what they're called, or how many foundations provide them. Extensions add providers without touching the protocol. The system scales in capability without scaling in complexity.

For the content author working in a site-only workspace — assembling a site from a portable foundation and a handful of extensions, all delivered pre-built — none of this machinery is visible. They write `type:` in frontmatter. The right component renders. The theme adapts. The composition works. Where the component came from is an implementation detail they never encounter.
