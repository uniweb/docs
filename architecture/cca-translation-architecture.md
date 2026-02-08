# CCA as a Translation Architecture

## More than separating content from code

The Content-Component Architecture is often described as a separation of content and code. That's accurate but incomplete. At a structural level, CCA is a translation architecture: it holds two reasoning languages simultaneously — one for content authors, one for component developers — and ensures that neither leaks into the other.

The distinction between "separation" and "translation" matters. Separation implies two sides that don't touch. Translation implies two sides that describe the same thing differently, with a system that maps between them. CCA does the latter. Authors and developers work with the same pages, sections, and layouts — but they reason about them through different mental models, and the framework handles the mapping.

## Reasoning languages, not just syntax

A syntax is a way of writing things down. A reasoning language is a way of thinking about a problem. CCA doesn't just give authors and developers different file formats — it gives them different mental models for the same underlying system.

The framework's job isn't to expose a single unified API that both audiences learn. It's to let each audience reason naturally about their own concerns, then handle the mapping between those ways of reasoning. The build system and runtime do this mechanically. But the real translation is in the architecture itself — in the decisions about what each audience sees, what they don't see, and where the boundary sits.

### Theming: visual environments and semantic roles

Content authors reason about visual environments. They think in terms of mood, contrast, and imagery — what the section should feel like to a visitor. Their language is frontmatter:

```yaml
---
type: Features
theme: dark
background:
  image: /images/night-skyline.jpg
  overlay: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))
---
```

Component developers reason about semantic roles. They think in terms of what each element is — a heading, a card, a subtle caption — without knowing or caring what visual environment the component will land in. Their language is semantic tokens:

```jsx
<h2 className="text-heading">{title}</h2>
<div className="bg-card border border-border rounded-xl">
  <p className="text-subtle">{description}</p>
</div>
```

Neither audience encounters the other's concerns. The content author doesn't know which component will render their section or what classes it uses. The developer doesn't know whether their component will sit on a photograph, a gradient, or a plain white background. The framework — context classes, token resolution, engine-rendered backgrounds — translates between visual environments and semantic roles.

This translation is what makes per-section context possible. A page can move through light, dark, and colored sections because the author's language and the developer's language never touch directly. The framework holds the mapping, and the mapping can change per section without either audience adjusting anything.

### Layouts: page shapes and structural shells

The same pattern operates at the structural level.

Content authors reason about page shapes. They think "this is a docs page" or "this is a landing page" — a holistic choice about how the page is organized. Their language is a single declaration: `layout: docs`.

Component developers reason about structural shells. They think about named areas, grid regions, and how content flows into slots. Their language is a Layout component that accepts content into named props.

Between these two languages sits a resolution cascade — page frontmatter overrides folder configuration, which overrides site configuration, which falls back to a foundation default. The cascade translates between an author's intent ("this is a docs page") and a developer's implementation (a specific component with specific slot handling). The author never sees the component; the developer never sees the cascade.

### Layout areas: the framework as protocol

Layout area discovery illustrates a broader principle. Area names — `header`, `sidebar`, `toc`, `banner` — are not defined by the framework. The foundation developer defines the structural vocabulary that makes sense for their design. The content author uses those names in filenames and content placement. The framework doesn't know or care what the areas are called. It discovers what areas a layout expects and moves content into named slots.

This reveals a principle that operates throughout CCA: **the framework is a protocol, not a vocabulary.** It defines how discovery, resolution, and adaptation work. The actual terms — the names that authors and developers use daily — belong to the foundation. The framework provides the translation machinery; the foundation provides the languages being translated.

The same principle is at work in theming. The framework provides the context mechanism — context classes, token resolution, background orchestration. The foundation provides the visual vocabulary — which tokens to override, what the default palette feels like, how the design system maps onto semantic roles. The framework doesn't dictate that cards should be warm or that borders should be subtle. It provides the infrastructure for making those choices per context, and lets the foundation fill in the values.

## Levels of composition

The translation architecture handles different levels of composition, and the difficulty of translation increases with each level. This isn't a limitation to be fixed — it's an inherent property of mapping between reasoning languages that diverge more as composition becomes more complex.

### Level 0: Theming

Visual adaptation without structural changes. The context model handles per-section token resolution, the scheme system handles site-level preference, and they compose independently. Components adapt to any visual environment without conditional logic.

The translation at this level is clean because the two languages are fully independent. Nothing the author writes in frontmatter constrains what the developer writes in JSX, and nothing in the component code constrains what the author can do with backgrounds and contexts.

### Level 1: Section composition

Choosing section types and their relative order on a page. A page is a vertical stack of sections. The author writes one markdown file per section, names them with ordering prefixes, picks a `type:` in frontmatter. The developer provides section types. The page directory *is* the composition — visible in the filesystem.

The translation at this level is one-to-one. The author thinks "hero, then features, then CTA." The developer thinks "Hero component, Features component, CTA component." Each section is a self-contained unit with a clear boundary. The author's reasoning (files in a directory) maps directly to the developer's reasoning (a sequence of component renders).

### Level 2: Nesting

Sections containing other sections. This is where the translation architecture faces its deepest challenge — not because the runtime model is inadequate, but because the two reasoning languages begin to converge.

File-based children work when the children are peers — a grid of feature cards, a list of team members. The author reasons about the children as content items, and the section type arranges them. The translation is still clean: the author thinks "these are my team members," the developer thinks "these are child blocks rendered in a grid."

Inline component references (the `@Component` syntax) handle the case where the child isn't content but a capability — an illustration, a chart, an interactive widget. Both kinds of children are the same runtime concept (child blocks), which is architecturally correct. But it introduces a shift in what the author is doing: they are now selecting components, not just writing content.

When an author writes `![](@NetworkDiagram){variant=compact}`, they're making a developer-like decision (which component, with what parameters) using author-like syntax (markdown image notation). The `@` prefix signals that this is a reference to code, not to a file. But the author now needs to know the component's name and its available parameters — information that, at levels 0 and 1, is entirely hidden from them.

The challenge intensifies with mixed composition. A Tabs section where each tab has authored text content and an inline component reference for its visual. An Accordion where some items are written content and others are interactive widgets. These are expressible in the runtime model — child blocks can contain both file-based and inline children, and ordering is preserved. But the authoring experience involves managing two different kinds of children through two different mechanisms. The author is doing layout composition in markdown.

This is where the clean separation between author reasoning and developer reasoning becomes hardest to maintain. The runtime can handle the mechanics. The architectural question is whether the authoring language can make mixed composition feel natural rather than technical.

### The metaphor gap

The difficulty at level 2 has a specific shape: a clash of metaphors.

When authors place sections on a page, they think spatially — hero at the top, features in the middle, CTA at the bottom. When they write content within a section, they think narratively — title, then explanation, then call to action. An inline component reference asks them to shift mid-narrative into a composition metaphor: title, then explanation, then *this component here*, then conclusion.

Developers make this shift unconsciously — component nesting is their native reasoning mode. For authors, the shift needs support. In markdown, the `@Component` syntax with image notation is probably close to the natural limit of what text-based authoring can offer. But a visual editor can present the same operation as a content workflow — "Add a visual → What kind? → Illustration → Pick one → Configure it" — letting the author reason about what they want to show rather than which component implements it.

Two authoring surfaces for the same underlying concept: the syntax serves authors who think in text, the palette serves authors who think in intent. Both produce the same child block in the runtime model. This is the CCA pattern applied to its own authoring experience — different reasoning languages for different audiences, with the framework translating between them.

## What's architecturally distinctive

Three aspects of CCA don't have clear equivalents in the current ecosystem.

**Per-section context.** Every major design system — Material Design, shadcn/ui, Radix — operates at the page level: one dark-mode toggle, one set of tokens. CCA starts from a different assumption: a page is a sequence of visual environments, each with its own context, composed by the content author. The framework orchestrates backgrounds, overlays, and token resolution independently per section. This isn't a feature added on top of a page-level system — it's a different foundation.

**Structural vocabulary as a foundation concern.** Most frameworks either hardcode their structural concepts (Next.js layouts, Astro slots) or leave them entirely to the developer (plain React). CCA provides the discovery and resolution machinery while leaving the vocabulary — area names, layout patterns, structural conventions — to the foundation. The framework is infrastructure for structural languages, not a structural language itself. Different foundations can have entirely different structural vocabularies, and the framework handles all of them through the same protocol.

**Designing for a portability spectrum.** Most frameworks assume a single deployment model. CCA acknowledges that foundations range from bundled (tightly coupled to one site) to portable (published as packages, used by many sites), and designs every feature to work across that spectrum. A framework that only designs for the portable case forces unnecessary abstraction on single-site projects. A framework that only designs for the bundled case can't support shared component ecosystems. Designing for the spectrum produces more resilient abstractions than designing for either end alone.
