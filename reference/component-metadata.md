# Component Metadata Guide

This guide explains how to write `meta.js` files for Uniweb components.

## Overview

A `meta.js` file declares a section type's content interface:
- What the component does (for documentation and editor UI)
- What content it expects from markdown
- What parameters content authors can configure
- What presets are available for quick setup

**In `src/sections/`**, `meta.js` is optional at the root level. A bare file (`Hero.jsx`) or folder (`Hero/Hero.jsx`) is automatically an addressable section type with an implicit empty content interface. Add `meta.js` when you need params, content expectations, or presets. Deeper nesting within `src/sections/` requires `meta.js` for a component to be addressable.

Components without `meta.js` (outside of `src/sections/` root) are ordinary React components — not selectable by content authors, but the foundation's actual rendering workhorses.

---

## Minimal Examples

The simplest section type — no `meta.js` at all:

```
src/sections/TextSection.jsx    ← addressable, title inferred as "Text Section"
```

When you need params or content expectations, add a `meta.js`:

```javascript
export default {
  title: 'Text Section',    // Optional — inferred from component name if omitted
  category: 'structure',
}
```

---

## What's Required vs Optional

When `meta.js` is present:

| Field | Required | Default |
|-------|----------|---------|
| `title` | No | Inferred from component name (`TeamRoster` → "Team Roster") |
| `category` | No | — |
| `description` | No | — |
| `purpose` | No | — |
| `hidden` | No | `false` |
| `background` | No | `false` |
| `inset` | No | `false` |
| `visuals` | No | — |
| `children` | No | — |
| `data` | No | — |
| `content` | No | — |
| `params` | No | — |
| `presets` | No | — |
| `vars` | No | — |
| `context` | No | — |
| `initialState` | No | — |

When `meta.js` is absent (only at root of `src/sections/`), the section type has no params, no content expectations, and a title inferred from the file or folder name.

---

## Full Example

```javascript
// sections/Hero/meta.js
export default {
  title: 'Hero Banner',
  description: 'Bold hero section with headline and call-to-action',
  category: 'impact',
  purpose: 'Impress',
  background: true,

  data: {
    entity: 'events:1',  // optional: dynamic data from CMS
  },

  content: {
    title: 'Headline',
    pretitle: 'Eyebrow',
    paragraphs: 'Description [1-2]',
    links: 'CTA buttons [1-2]',
    image: 'Hero image [1]',
  },

  params: {
    theme: {
      type: 'select',
      label: 'Theme',
      options: ['gradient', 'glass', 'dark', 'light'],
      default: 'gradient',
    },
    layout: {
      type: 'select',
      label: 'Layout',
      options: [
        'center',
        'left',
        { value: 'split-right', label: 'Split (image right)' },
        { value: 'split-left', label: 'Split (image left)' },
      ],
      default: 'center',
    },
  },

  vars: {
    'content-gap': {
      default: '2rem',
      label: 'Content Gap',
      type: 'select',
      options: ['1rem', '1.5rem', '2rem', '3rem'],
      group: 'Layout',
    },
  },

  presets: {
    default: {
      label: 'Centered Hero',
      params: { theme: 'gradient', layout: 'center' },
    },
    split: {
      label: 'Split Layout',
      params: { theme: 'gradient', layout: 'split-right' },
    },
  },

  // Static — neighbors read via getNextBlockInfo().context
  context: {
    allowTranslucentTop: true,
  },

  // Dynamic — neighbors read via getNextBlockInfo().state
  // Component can update with useBlockState()
  initialState: {
    allowTranslucentTop: true,
  },
}
```

---

## How Data Flows to Your Component

The meta.js describes the contract. Here's what your component actually receives:

```jsx
function Hero({ content, params, block, website }) {
  // ─── From markdown (content) ────────────────────────
  // Runtime guarantees all fields exist - no defensive checks needed
  const { title, pretitle, subtitle, paragraphs, links, images, items } = content

  // ─── From frontmatter (params) ──────────────────────
  const { theme, layout } = params

  // ─── From CMS (data) ────────────────────────────────
  const events = content.data?.events || []

  // ─── From structured author data (tagged blocks or form UI) ──
  const navLinks = content.data?.['nav-links'] || []

  return (
    <section className={theme}>
      {pretitle && <span className="eyebrow">{pretitle}</span>}
      {title && <H1>{title}</H1>}
      {paragraphs.map((p, i) => <P key={i}>{p}</P>)}
    </section>
  )
}
```

**Runtime guarantees**: The runtime ensures all content fields exist with sensible defaults (empty strings/arrays). You don't need defensive null checks—content structure is guaranteed.

| Source | Declared in | Accessed via |
|--------|-------------|--------------|
| Markdown content | `content: { ... }` | `content.title`, `content.paragraphs`, `content.items` |
| Frontmatter params | `params: { ... }` | `params.paramName` |
| CMS entities | `data: { entity: 'events:5' }` | `content.data.events` |
| Structured author data | `data: { schemas: { ... } }` | `content.data['schema-name']` |

> **Note:** `block.data` and `content.data` point at the same object at
> runtime. Use `content.data.*` in components — it matches how the rest of
> the framework surfaces the content tree.

---

## Schema Reference

### Identity Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display name in the editor. If omitted, inferred from component name (`TeamRoster` → "Team Roster") |
| `description` | string | What the component does |
| `category` | string | Grouping: `impact`, `showcase`, or `structure` |
| `purpose` | string | Single verb: Introduce, Express, Explain, etc. |
| `hidden` | boolean | If true, component is excluded from export entirely (internal helpers, not-yet-ready components) |
| `inset` | boolean | If true, available for `@ComponentName` references in markdown |

#### Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `impact` | High-impact elements to introduce and express ideas | Hero, CTA, Statement |
| `showcase` | Explain value, provide evidence, answer questions | Features, Pricing, FAQ, Testimonials |
| `structure` | Flexible functional elements for layouts | Header, Footer, Grid, Section, Gallery |

---

### Content

The `content` object describes what markdown content the component uses.

```javascript
content: {
  // String: label only, any count
  title: 'Headline',

  // String with count: label [count]
  paragraphs: 'Description [1-2]',
  links: 'CTA buttons [1-2]',
  image: 'Hero image [1]',

  // Object form: when you need a hint
  items: {
    label: 'Feature cards [3-6]',
    hint: 'Each H3 becomes a card',
  },
}
```

#### Count Syntax

Append count in brackets at the end of the label:

| Syntax | Meaning |
|--------|---------|
| `'Label'` | Any count (default) |
| `'Label [1]'` | Exactly 1 |
| `'Label [1-3]'` | 1 to 3 |
| `'Label [2+]'` | 2 or more |

This is guidance for content authors, not validation.

#### Standard Content Elements

These names are a **fixed vocabulary**—they map to what the semantic parser extracts from markdown:

| Element | Source | Description |
|---------|--------|-------------|
| `title` | H1 | Main headline |
| `pretitle` | Heading before title | Eyebrow/kicker text |
| `subtitle` | Heading after title | Secondary headline |
| `paragraphs` | Body text | Description paragraphs |
| `links` | `[text](url)` | Markdown links (become buttons/links) |
| `lists` | `- item` | Bullet or numbered lists |
| `items` | Subsequent headings | Content groups within the markdown |
| `insets` | `@Component` refs | Inline component references |
| `subsections` | Child files | Nested section files (for composition) |

Use these exact names. The meta.js describes which of these your component uses—you're not inventing new names, you're declaring which parsed elements you consume.

#### Image Roles

Instead of generic `images`, use role-specific element names:

| Element | Role | Description |
|---------|------|-------------|
| `image` | Content image | Photos, graphics alongside content |
| `icon` | Small graphic | Icons, logos, avatars |
| `thumbnail` | Preview | Small preview images |
| `background` | Background | Handled by engine (see below) |

```javascript
content: {
  image: 'Hero image [1]',
  icon: 'Feature icon [1]',
}
```

#### Background Media

Background images and videos are handled at the engine level so components don't repeat this logic. Use the top-level `background` field:

```javascript
export default {
  title: 'Hero',
  background: true,  // Engine renders background media

  content: {
    title: 'Headline',
    image: 'Hero image [1]',
  },
}
```

| Value | Behavior |
|-------|----------|
| `true` or `'auto'` | Engine handles background |
| `'manual'` | Component handles its own background |
| `false` | No background support |

**Frontmatter Background Options**

When a component has `background: true`, authors can configure backgrounds in section frontmatter:

```yaml
---
type: Hero
background:
  # Image background
  image: /images/hero.jpg
  position: center          # CSS background-position
  size: cover               # CSS background-size

  # Video background (falls back to image on mobile or reduced-motion)
  video: /videos/hero.mp4   # Auto-detects webm fallback if available
  poster: /images/hero.jpg  # Shown while video loads

  # Or provide explicit video sources
  sources:
    - src: /videos/hero.webm
      type: video/webm
    - src: /videos/hero.mp4
      type: video/mp4

  # Overlay on top of background
  overlay:
    enabled: true
    type: dark              # 'dark' or 'light'
    opacity: 0.5
    # Or gradient overlay
    gradient:
      start: 'rgba(0,0,0,0.7)'
      end: 'rgba(0,0,0,0)'
      angle: 180
---
```

**Accessibility**: Video backgrounds automatically respect `prefers-reduced-motion`. When users have reduced motion enabled, the poster image is shown instead of video.

**Format Fallback**: When you provide a `.mp4` video, the engine automatically tries a `.webm` version first (better compression). Just ensure both formats exist at the same path.

---

### Data

Data delivery is **default-on**. A block on a page with a `data:` or `fetch:` declaration automatically receives `content.data.{schema}` — no `meta.js` opt-in required. The `data` field is therefore optional in most components. When present, it provides declarative hints that drive the editor, `schema.json`, and `prepare-props` shape guarantees.

```javascript
data: {
  entity: 'events:6',           // entity-type declaration (hint, not gate)
  schemas: { ... },             // structure / defaults for tagged blocks and entity data
}
```

All subfields are optional — include only what your component needs.

**Opt-out:** a component that should not receive any ambient data declares `data: false`. Rare — used only for pure layout primitives or debug components.

```javascript
export default {
  data: false,
}
```

> Component-side `inherit` (`data: { inherit: true }` / `inherit: [...]`) has been removed as a delivery gate — delivery is default-on. The block-frontmatter form `fetch: { inherit: true, detail: false, limit: 3 }` in a `.md` file is a different mechanism (per-instance override of the parent's query) and is retained. See [Data Fetching](./data-fetching.md) for details.

#### Entity binding

Declares what CMS entity types the component works with:

```javascript
data: { entity: 'events' }       // unlimited events
data: { entity: 'articles:5' }   // up to 5 articles
data: { entity: 'project:1' }    // exactly 1 project
```

#### Standard Entity Types

| Type | Description |
|------|-------------|
| `articles` | Blog posts, news items |
| `events` | Calendar events |
| `projects` | Portfolio/case studies |
| `publications` | Academic papers, research |
| `opportunities` | Jobs, grants, calls |
| `team` | Team members, people |
| `products` | E-commerce products |

#### Example: Event Listing

```javascript
export default {
  title: 'Event Grid',
  category: 'showcase',

  data: {
    entity: 'events:6',
  },

  content: {
    title: 'Section title',
    paragraphs: 'Intro text [1]',
  },

  params: {
    layout: {
      type: 'select',
      options: ['grid', 'list', 'calendar'],
      default: 'grid',
    },
  },
}
```

The component receives entities via props and renders them alongside markdown content.

#### Loading states

When a data fetch runs at runtime (`prerender: false`), the component renders immediately — static content (title, paragraphs, items) is available on first render, while `content.data` populates when the fetch completes.

The component checks `block.dataLoading` to know whether a fetch is still in progress:

```jsx
function ArticleList({ content, block }) {
  if (block.dataLoading) {
    return <DataPlaceholder lines={4} />
  }

  const articles = content.data.articles || []
  return <ArticleGrid articles={articles} />
}
```

This prevents layout shifts — instead of the page collapsing while data loads, the component holds its space with a placeholder. See [Kit Reference](./kit-reference.md) for `block.dataLoading` and `DataPlaceholder`.

---

### Params

Parameters are configurable options set in frontmatter:

```yaml
---
type: Hero
theme: glass
layout: split-right
---
```

Define them in `params`:

```javascript
params: {
  theme: {
    type: 'select',
    label: 'Theme',
    hint: 'Affects background and text colors',  // optional guidance
    options: ['gradient', 'glass', 'dark', 'light'],
    default: 'gradient',
  },
  showPattern: {
    type: 'boolean',
    label: 'Show background pattern',
    default: true,
  },
  maxItems: {
    type: 'number',
    label: 'Maximum items to display',
    default: 6,
  },
  customClass: {
    type: 'string',
    label: 'Custom CSS class',
    hint: 'Added to the section wrapper element',
  },
}
```

**Runtime guarantees**: Param defaults from meta.js are automatically applied by the runtime. Your component receives `params` with defaults already merged in—no need for `theme || 'gradient'` fallbacks.

#### Param Types

| Type | Editor UI | Value |
|------|-----------|-------|
| `select` | Dropdown | String from options |
| `boolean` | Toggle | true/false |
| `string` | Text input | Any string |
| `number` | Number input | Numeric value |

#### Options Shorthand

When option value equals label, use strings:

```javascript
// Full form
options: [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

// Shorthand (value === label)
options: ['dark', 'light']

// Mixed
options: [
  'dark',
  'light',
  { value: 'glass', label: 'Glassmorphism' },
]
```

---

### Vars

Component-level CSS custom properties, scoped to `#section-{id}`. These are distinct from params — vars become CSS variables that your component's styles can reference, while params are JS values passed as props.

```javascript
vars: {
  'card-gap': {
    default: '1.5rem',
    label: 'Card Gap',
    type: 'select',
    options: ['1rem', '1.5rem', '2rem'],
    group: 'Layout',
  },
  'card-radius': {
    default: 'var(--radius-md)',
    description: 'Inherits from foundation var by default',
  },
}
```

The var schema is the same as [foundation vars](./foundation-config.md#variable-schema) — `default`, `label`, `type`, `options`, `group`, `description` all work the same way.

#### CSS output

Component vars emit on the section's CSS selector:

```css
#section-42 {
  --card-gap: 1.5rem;
  --card-radius: var(--radius-md);
}
```

Use them in your component's CSS or Tailwind classes:

```jsx
function PricingTable({ content }) {
  return (
    <div className="grid gap-[var(--card-gap)]">
      {content.items.map((item, i) => (
        <div key={i} className="rounded-[var(--card-radius)]">
          {/* ... */}
        </div>
      ))}
    </div>
  )
}
```

#### Frontmatter overrides

Content authors override component vars in section frontmatter:

```yaml
---
type: PricingTable
vars:
  card-gap: 2rem
---
```

Only vars declared in `meta.js` are emitted — unknown var names in frontmatter are ignored.

#### Foundation vars vs component vars

| | Foundation vars | Component vars |
| - | --------------- | -------------- |
| Declared in | `foundation.js` | `meta.js` |
| CSS scope | `:root` (global) | `#section-{id}` (scoped) |
| Overridden by | `theme.yml` (`vars:`) | Section frontmatter (`vars:`) |
| Context-aware types | Yes (`color`, `gradient`) | No (always context-independent) |

---

### Presets

Presets are pre-configured parameter combinations:

```javascript
presets: {
  default: {
    label: 'Centered Hero',
    params: { theme: 'gradient', layout: 'center' },
  },
  glass: {
    label: 'Glassmorphism',
    params: { theme: 'glass', layout: 'center' },
  },
  minimal: {
    label: 'Minimal Light',
    params: { theme: 'light', layout: 'left', showPattern: false },
  },
}
```

The preset name (key) is used in frontmatter:

```yaml
---
type: Hero
preset: glass
---
```

---

### Schemas (Structured Author Data)

`data.schemas` declares shapes of structured data the component accepts from
authors. A single registry, two input paths that converge on the same
`content.data[schema-id]` key:

1. **Tagged markdown blocks** — authors write YAML/JSON in a fenced block
   prefixed with the schema id. Great for filesystem-edited projects.
2. **Form UI** — the Uniweb editor renders a form from the schema. Great
   for non-technical authors editing a published site.

Both produce the same shape at `content.data[schema-id]`, so components are
agnostic to how the data was entered.

#### Simple schemas — flat key/value maps

Use a simple schema for flat row-like data (e.g. nav links). Fields are
declared as a keyed object:

````markdown
```yaml:nav-links
- label: Home
  href: /
- label: About
  href: /about
  type: button
```
````

```javascript
// meta.js
data: {
  schemas: {
    'nav-links': {
      label: { type: 'string' },
      href: { type: 'string' },
      type: {
        type: 'select',
        options: ['plain', 'button', 'dropdown'],
        default: 'plain',
      },
      icon: 'string',  // Shorthand for { type: 'string' }
      children: { type: 'array', of: 'nav-links' },  // Recursive
    },
  },
}
```

```jsx
function Header({ content }) {
  const navLinks = content.data['nav-links'] || []
}
```

#### Rich schemas — ordered fields with labels, options, conditions

Use a rich schema when the data has an ordered field list (labels,
required markers, conditional visibility, nested arrays). Rich schemas
drive both tagged-block authoring *and* the FormBlock editor widget. The
distinguishing marker is a `fields` **array** (instead of a keyed object),
or any of `isComposite` / `childSchema`.

```javascript
// meta.js
data: {
  schemas: {
    stats: {
      name: { en: 'Stats', fr: 'Statistiques' },     // shown in editor
      isComposite: true,                              // value is an array
      childSchema: {
        name: { en: 'Stat', fr: 'Statistique' },
        fields: [
          {
            id: 'number',
            type: 'text',
            label: { en: 'Number', fr: 'Nombre' },
            required: true,
          },
          {
            id: 'text',
            type: 'text',
            label: 'Label',
            default: 'metric',
          },
        ],
      },
    },

    'side-content': {
      name: 'Side Content',
      fields: [
        {
          id: 'for',
          type: 'select',
          options: [
            { label: 'Scholar', value: 'scholar' },
            { label: 'News',    value: 'news' },
          ],
        },
        {
          id: 'department',
          type: 'text',
          condition: { for: 'scholar' },              // only when for=scholar
        },
        {
          id: 'headline',
          type: 'text',
          condition: { for: { $in: ['news', 'feature'] } },
        },
      ],
    },
  },
}
```

Components read the filled data by schema id:

```jsx
function Hero({ content }) {
  const stats = content.data.stats || []
  // [{ number: '42', text: 'users' }, { number: '1M', text: 'queries' }, ...]
}
```

#### Rich schema — field properties

| Property | Type | Notes |
|---|---|---|
| `id` | string (required) | field identifier (data key) |
| `type` | string (required) | see field types below |
| `label` | string or `{en,fr}` | shown in editor |
| `description` | string or `{en,fr}` | editor tooltip |
| `placeholder` | string or `{en,fr}` | input placeholder |
| `required` | boolean | editor validation |
| `default` | any | applied at runtime when missing |
| `options` | `[{label, value}]` or `[string]` | for `select` |
| `min` / `max` | number | for `number` |
| `condition` | object | visibility predicate — see below |
| `fields` | array | for `type: nestedObject` (inline nested fields) |
| `childSchema` | object | for `type: form` (nested composite array) |

#### Rich schema — field types

- `text`, `email`, `textarea`, `number`, `checkbox`, `select` — primitives
- `form` — nested composite array; requires `childSchema: { fields: [...] }`
- `nestedObject` — single nested object; requires `fields: [...]`

#### Rich schema — composite (`isComposite: true`)

The stored value is an **array** of rows; each row matches
`childSchema.fields`. Add/remove rows in the editor, or author the array
directly in a tagged markdown block.

#### Rich schema — conditions

Any field (root or nested) can declare a `condition` that controls
visibility:

```javascript
{ id: 'department', type: 'text', condition: { for: 'scholar' } }
{ id: 'label',      type: 'text', condition: { for: { $in: ['a','b'] } } }
```

Supported operators: `$eq`, `$neq`, `$in`, `$nin`, `$truthy`, `$falsy`.
Shorthand `{ key: value }` is implicit `$eq`. Multiple keys are AND'd.

At runtime, fields whose conditions don't hold are **stripped from
`content.data[id]`** before the component sees it — components don't
need to check conditions themselves. The editor keeps hidden values in
storage so authors can toggle back.

#### Localized labels

Anywhere a `label`, `name`, or `description` is accepted (on schemas,
child schemas, fields, and option entries), you may pass either a plain
string or an `{en, fr, ...}` object. The editor renders the user's
active locale.

#### Simple-schema field types (keyed-object form)

```javascript
// Full form
field: { type: 'string', default: 'value' }

// Shorthand
field: 'string'
field: 'number'
field: 'boolean'

// Select
field: {
  type: 'select',
  options: ['a', 'b', 'c'],
  default: 'a',
}

// Nested object
field: {
  type: 'object',
  schema: { name: 'string', value: 'number' },
}

// Array
field: { type: 'array', of: 'string' }
field: { type: 'array', of: 'other-schema-name' }
field: { type: 'array', of: { name: 'string' } }
```

---

## Insets

The `inset` flag declares that a component is available for inline `@ComponentName` references in markdown. Content authors can place it within another section's content:

```markdown
![Architecture diagram](@NetworkDiagram){variant=compact}
```

```javascript
// sections/insets/NetworkDiagram/meta.js
export default {
  title: 'Network Diagram',
  category: 'visualization',
  inset: true,
  params: {
    variant: {
      type: 'select',
      options: ['full', 'compact'],
      default: 'full',
    },
  },
}
```

Whether an inset appears in a section palette is a concern of the parent component (via its `children`/`insets` declarations), not a property of the inset itself. Don't use `hidden` on insets — `hidden` means "exclude from export entirely" (for internal helpers or work-in-progress components).

A component can be both a standalone section and an inset:

```javascript
// sections/Testimonial/meta.js
export default {
  category: 'showcase',
  inset: true,               // also available for @ references
}
```

Inset components receive `content.title` (from the `[description]` text) and `params` (from `{key=value}` attributes). At runtime, the parent section accesses insets via `block.insets` (separate from `block.childBlocks`).

---

## Visual Expectations

The `visuals` field declares what visual content a section type expects. This is editor metadata — it helps the visual editor present the right insertion UI. The runtime stays permissive.

| Form | Meaning | Example |
|------|---------|---------|
| Number | Count, any type (image/video/inset) | `visuals: 1` |
| `'many'` | Multiple, any type | `visuals: 'many'` |
| String subtype | One of a specific type | `visuals: 'image'` |
| Array | One of the listed types | `visuals: ['image', 'video']` |
| Object | Full spec with count + types | `visuals: { types: ['image'], count: 'many' }` |

Subtypes: `'image'`, `'video'`, `'inset'`. Without a subtype, the editor offers all types including inset components.

```javascript
// SplitContent — one visual slot, anything goes
export default { visuals: 1 }

// Gallery — many images only
export default { visuals: { types: ['image'], count: 'many' } }

// VideoPlayer — one video
export default { visuals: 'video' }
```

Section types with unqualified `visuals` (any type) use the `<Visual>` component from kit. Those narrowed to media subtypes use `<Media>` or `<Image>` directly.

---

## Children (Composition)

The `children` field declares that a section type accepts file-based child sections. Like `visuals`, this is editor metadata — at runtime, `block.childBlocks` is always available regardless of whether `children` is declared.

```javascript
// sections/Grid/meta.js
export default {
  title: 'Grid',
  description: 'Arrange components in a responsive layout',
  category: 'structure',
  purpose: 'Arrange',
  children: {
    label: 'Grid items',
    hint: 'Each child section becomes a grid cell. Use any component type.',
  },

  params: {
    columns: {
      type: 'select',
      label: 'Columns',
      options: ['2', '3', '4', 'auto'],
      default: 'auto',
    },
  },
}
```

In markdown, child sections use the `@` prefix and `nest:` in page.yml:

```
pages/home/
├── page.yml
├── 1-intro.md          # type: Grid (parent)
├── 2-features.md       # type: Features
├── @text.md            # type: TextBox (child of intro)
└── @media.md           # type: Media (child of intro)
```

```yaml
# page.yml
nest:
  intro: [text, media]
```

Or using inline nesting in `sections:`:

```yaml
sections:
  - intro:              # Grid
      - text            # Resolves to @text.md
      - media           # Resolves to @media.md
  - features            # Features
```

---

## Cross-Block Communication

Section types sometimes need to coordinate with their neighbors. The typical case: a Header needs to know whether the section below it supports a floating translucent overlay. A Hero with a full-bleed background does; a plain text section doesn't.

The section that **owns the capability declares it** in its `meta.js`. The section that **needs to adapt reads it** via `getNextBlockInfo()`, `getPrevBlockInfo()`, or `getFirstBodyBlockInfo()`.

### context (static)

Declares permanent facts about the component type. Never changes at runtime.

```javascript
// Hero/meta.js — "I always support a translucent header over me"
export default {
  context: {
    allowTranslucentTop: true,
  },
}
```

```jsx
// Header/index.jsx — adapts based on what's below
const nextBlockInfo = block.getNextBlockInfo()
// nextBlockInfo.context  → static (meta.js)
const isFloating = nextBlockInfo?.context?.allowTranslucentTop || false
```

Use `context` when the capability is inherent to the component type — every instance of Hero always supports translucent headers, regardless of its content or state.

### initialState (dynamic)

Declares an initial value that the component can change at runtime via `useBlockState()`. Neighbors see changes immediately.

```javascript
// Hero/meta.js — starts translucent-ready, but component logic may disable it
export default {
  initialState: {
    allowTranslucentTop: true,
  },
}
```

```jsx
// Hero/index.jsx — updates state based on runtime conditions
function Hero({ content, block }) {
  const [state, setState] = block.useBlockState(useState)
  // state.allowTranslucentTop is true initially (from meta.js)
  // Component logic can change it: setState({ allowTranslucentTop: false })
}
```

```jsx
// Header/index.jsx — reads dynamic state, falls back to static context
const nextBlockInfo = block.getNextBlockInfo()
// nextBlockInfo.state    → dynamic (useBlockState)
const isFloating = nextBlockInfo?.state?.allowTranslucentTop
  ?? nextBlockInfo?.context?.allowTranslucentTop
  ?? false
```

Use `initialState` when the capability depends on runtime conditions — a Hero might disable the translucent overlay after a user interaction or based on loaded data.

### Key names are yours to design

`allowTranslucentTop`, `expanded`, `playing` — these are not framework fields. Design whatever protocol your foundation's sections need to coordinate.

---

## Design Principles

1. **Graceful degradation** — Components handle missing content without errors
2. **Sensible defaults** — Every param should have a good default
3. **Intent over implementation** — Params describe purpose (`theme: dark`) not CSS (`background: #1a1a1a`)
4. **Minimal metadata** — Only include what the editor needs; implementation details stay in code
5. **Composition over configuration** — Use Grid + simple components instead of mega-components with many options

---

## See Also

- [Content Structure](./content-structure.md) — How content is parsed and structured
- [Kit Reference](./kit-reference.md) — Hooks, components, and utilities from @uniweb/kit
- [Foundation Configuration](./foundation-configuration.md) — CSS variables and custom Layout
- [Data Fetching](./data-fetching.md) — Loading external data into components
