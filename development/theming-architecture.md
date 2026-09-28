# Theming Architecture

Internal reference for the Uniweb theming system. Covers the two-axis model (context × scheme), the Auto context, a section's own theme, and how it reaches the page.

---

## The Two-Axis Model

Uniweb theming has two independent axes: **section context** and **site scheme**. Understanding both is the key to the system.

### Section context: what's behind the content

A section's context answers: **what's behind the content here?**

Three contexts exist: `light`, `medium`, `dark`. They represent legibility environments. A dark photo behind content needs light text. A white card needs dark text. The context sets every semantic token for that section:

```html
<section class="context-light" id="section-hero">
  <!-- tokens resolve for light background -->
</section>

<section class="context-dark" id="section-features">
  <!-- tokens resolve for dark background -->
</section>
```

The runtime reads `theme:` from frontmatter, renders the background, and applies the matching context class. Components use semantic tokens (`text-heading`, `bg-card`) and adapt without conditional logic.

### Site scheme: the global preference

A site's scheme answers: **does this site prefer a light or dark overall appearance?**

This is the traditional light/dark mode — a global preference that affects defaults. Configured in `theme.yml`:

```yaml
appearance:
  default: light              # 'light' or 'dark'
  allowToggle: true           # Let visitors switch
  respectSystemPreference: true
  schemes: [light, dark]
```

When the scheme is dark, sections that don't declare an explicit context get dark tokens instead of light ones.

### Composition: context × scheme

|                              | Light scheme | Dark scheme |
|------------------------------|-------------|-------------|
| Section with `theme: light`  | Light tokens (typical) | Light tokens — bright section on dark site |
| Section with `theme: dark`   | Dark tokens — dramatic section on light site | Dark tokens (typical) |
| Section with no `theme:`     | Light tokens (default) | Dark tokens (follows scheme) |

A dark-scheme site can have a bright CTA. A light-scheme site can have a dramatic dark hero. Context and scheme are independent.

---

## Auto Context

The unified model adds one concept: **sections default to Auto** (follow the site's appearance). A section can be **pinned** to a fixed context to override.

### What Auto means

- **Auto** = no explicit context. The section inherits from the site.
  - Without toggle: Auto = always the site's `appearance.default` (fixed)
  - With toggle: Auto = follows the toggle (switches between light/dark)
- **Pinned** (Light/Dim/Dark) = fixed context regardless of scheme or toggle.

### Data model

A section's `theme:` sets its mode — `theme: dark`, or `mode` in the object form (see [A section's theme](#a-sections-theme), below):

| Mode | Meaning |
|-------|---------|
| unset / `""` | Auto — follow site appearance |
| `light` | Pinned to Light |
| `medium` | Pinned to Dim |
| `dark` | Pinned to Dark |

In `core/src/block.js`, `Block.normalizeSectionTheme` reads it, and `block.themeName` holds the mode — `''` for Auto.

### Composition with Auto

| Section context | Light scheme | Dark scheme |
|-----------------|-------------|-------------|
| Auto | Light tokens | Dark tokens (follows scheme) |
| Pinned: Light | Light tokens | Light tokens (stays) |
| Pinned: Dim | Medium tokens | Medium tokens (stays) |
| Pinned: Dark | Dark tokens | Dark tokens (stays) |

### How Auto interacts with toggle

| Site config | Auto behavior |
|---|---|
| `allowToggle: false`, `default: light` | Auto section always uses light context |
| `allowToggle: false`, `default: dark` | Auto section always uses dark context |
| `allowToggle: true` | Auto section follows the toggle — switches between light and dark |

Pinned sections are unaffected by toggle in all cases.

---

## CSS Mechanism

### Context classes

Each context has a CSS class that sets semantic token values on the element:

```css
.context-light { --heading: var(--neutral-900); --body: var(--neutral-950); --section: var(--neutral-50); ... }
.context-medium { --heading: var(--neutral-900); --body: var(--neutral-950); --section: var(--neutral-100); ... }
.context-dark { --heading: white; --body: var(--neutral-50); --section: var(--neutral-900); ... }
```

### Scheme class on :root

When the site scheme is dark, a class is applied to the document root:

```css
.scheme-dark { --heading: white; --body: var(--neutral-50); --section: var(--neutral-900); ... }
```

This shifts the `:root` defaults. Elements that don't have a context class inherit these shifted values.

### Auto section (no context class)

An Auto section has no context class on its `<section>` element. It inherits tokens from `:root`. When `:root` shifts with `.scheme-dark`, the section shifts too:

```html
<!-- Auto section — inherits from :root -->
<section id="section-hero">
  <!-- In light scheme: gets light tokens from :root -->
  <!-- In dark scheme: gets dark tokens from .scheme-dark on :root -->
</section>
```

### Pinned section (context class)

A pinned section has a `context-{theme}` class that sets tokens directly on the `<section>`. This overrides `:root` inheritance — the section stays fixed:

```html
<!-- Pinned to dark — stays dark regardless of scheme -->
<section class="context-dark" id="section-cta">
  <!-- Always has dark tokens, even on a light-scheme site -->
</section>
```

### Two rules for an Auto section

An Auto section's values for each scheme go in two rules, so it follows the site whether or not visitors can switch:

```css
/* light scheme */
:root:not(.scheme-dark) #section-hero { --link: var(--primary-700); }

/* dark scheme */
.scheme-dark #section-hero { --link: var(--primary-300); }
```

A site whose `appearance.default` is `system` goes dark through a media query before any class is set, so the dark values are repeated under `@media (prefers-color-scheme: dark)` for `:root:not(.scheme-light) #section-hero`. A pinned section needs one rule: its own context never changes.

---

## A section's theme

A section's `theme:` is `theme.yml` for that section — the same keys, scoped to it — plus `mode`, the context it pins ([Site Theming](../reference/site-theming.md)):

```yaml
theme:
  mode: dark                 # left out: the section follows the site (Auto)
  colors:                    # a palette — shades are generated, as for the site's
    primary: '#8b5cf6'
  contexts:                  # tokens per color context
    dark:
      link: var(--primary-300)
  vars:                      # the foundation's variables
    header-height: 5rem
  heading: var(--primary-100)   # a token beside `mode` — any context
```

`theme: dark` is the shorthand for `{ mode: dark }`. It is stored in the section's params as written, and a component never receives it — it reads the result through kit's `useColorContext`.

### What core makes of it

`Block.normalizeSectionTheme` (`core/src/block.js`) turns it into:

| on the block | holds |
|---|---|
| `themeName` | the mode — `''` for Auto |
| `themeOverrides` | `{ colors, contexts, vars, tokens }` — the palette, tokens per context, the variables, and the tokens written beside `mode` |
| `contextOverrides` | the tokens in effect whatever the scheme — for a pinned section, its tokens and its own context's (the context's win); for an Auto section, the tokens set in no context |

### Which values apply

| Section | Rule(s) in the page stylesheet |
|---|---|
| No `theme:` values | none |
| Pinned (`light` / `medium` / `dark`) | one rule: the palette, the variables, the tokens beside `mode`, then its own context's tokens and variables — the context's win |
| Auto | the palette, the variables and the tokens beside `mode` in one rule; `contexts.light` under a light scheme, `contexts.dark` under `.scheme-dark` (and the system's dark query, above) |

A context the section's mode does not use stays in the file and applies again if the mode changes back — nothing is cleaned up.

⛔ **An editor's older envelope is no longer read** (2026-09-28). A section's colors were once sent as `params.standardOptions` — `{ colors: { colors, elements }, foundationStyles }` — with its own rules, and component params could arrive nested under `params.properties`. An editor writes the section's `theme` instead, and core reads neither name; either is an ordinary param now.

### Updating a preview

An editor sends a section's params as stored, through the `updateParams` message: the iframe updates the block, rebuilds the website and re-renders, and the page stylesheet is rebuilt with it. There is no message of its own for a section's theme.

---

## Runtime Rendering

### Architecture: pre-built page-level CSS

A section's theme follows the same pattern as the global theme CSS. Just as `buildTheme()` produces a `<style id="uniweb-theme">` tag for the global palette and context tokens, the sections' values are pre-built into a single `<style id="uniweb-page-overrides">` tag per page. Only the tokens in effect whatever the scheme (`contextOverrides`) go inline on the section wrapper, so a section renders right before the stylesheet arrives.

### buildSectionOverrides(blocks, appearance)

`theming/src/section-overrides.js`. Takes every block a page renders — each layout area's too (`page.getAllBlocks()`) — and returns a CSS string. It reads, per block:

- `stableId || id` — the selector, `#section-{id}`
- `themeName` and `themeOverrides` — the section's theme, as above
- `componentVars` — the variables the component declares in `meta.js`, with the section's values over them
- `childBlocks` — child sections get their own rules, at any depth

### BlockRenderer.jsx — context class

`BlockRenderer.jsx` assigns the context class, and puts `contextOverrides` inline:

```js
// Empty themeName = Auto → no context class → inherits from :root
// Non-empty themeName in VALID_CONTEXTS → pinned
if (theme && VALID_CONTEXTS.includes(theme)) {
  contextClass = `context-${theme}`
}
```

### SectionOverrideStyles component

`runtime/src/components/PageRenderer.jsx` builds the page-level stylesheet and keeps it in the document head:

```jsx
function SectionOverrideStyles({ page, appearance }) {
  const css = useMemo(
    () => (page ? buildSectionOverrides(page.getAllBlocks(), appearance) : ''),
    [page, appearance]
  )
  // …writes `css` into <style id="uniweb-page-overrides"> in the head, removing it when empty
}
```

When blocks change (via `updateParams` → `rebuildWebsite()` → `setVersion(v+1)`), the component re-renders and the CSS updates with it. The server-side twin is `ssr-renderer.js`, which passes the same blocks.

### Published site (rendered server-side)

`renderPage` returns the same stylesheet as `sectionOverrideCSS`, and `injectPageContent` places it beside the global theme CSS:

```js
const sectionCSS = buildSectionOverrides(page.getAllBlocks(), appearance)
// → <style id="uniweb-page-overrides">{sectionCSS}</style>
```

---

## Component-Level CSS Variables

Components can declare scoped CSS custom properties in `meta.js`. These are distinct from foundation vars (which are global on `:root`) — component vars are scoped to `#section-{id}`.

### Declaration

```js
// sections/PricingTable/meta.js
export default {
  title: 'Pricing Table',
  vars: {
    'card-gap': { default: '1.5rem', type: 'select', options: ['1rem', '1.5rem', '2rem'] },
    'card-radius': { default: 'var(--radius-md)' },
  },
}
```

### Frontmatter override

```yaml
---
type: PricingTable
vars:
  card-gap: 2rem
---
```

### CSS emission

Component vars are **context-independent** — they emit in the shared rule alongside palette and foundation vars, not inside context-scoped rules.

```css
#section-42 {
  --card-gap: 2rem;
  --card-radius: var(--radius-md);
}
```

### Data flow

1. **Build time**: `meta.js` `vars` field is included in `schema.json` (auto-spread)
2. **Runtime**: `Block.initComponent()` merges meta.js defaults with frontmatter `vars:` overrides via `Block.mergeComponentVars()`, storing the result as `block.componentVars`
3. **CSS generation**: `buildSectionOverrides()` reads `block.componentVars` and emits them in the shared (context-independent) CSS rule for the section

### Specificity

Component vars emit on `#section-{id}`, which has higher specificity than foundation vars on `:root`. This means a component can reference a foundation var as its default (`var(--radius-md)`) and the value resolves correctly.

---

## Token Reference

### Semantic tokens (24 total)

Resolve differently per context class. Components use these and adapt automatically.

**Surfaces:**

| CSS Variable | Tailwind | Light | Dark |
|---|---|---|---|
| `--section` | `bg-section` | neutral-50 | neutral-900 |
| `--card` | `bg-card` | neutral-100 | neutral-800 |
| `--muted` | `bg-muted` | neutral-200 | neutral-700 |

**Text:**

| CSS Variable | Tailwind | Light | Dark |
|---|---|---|---|
| `--heading` | `text-heading` | neutral-900 | white |
| `--body` | `text-body` | neutral-950 | neutral-50 |
| `--subtle` | `text-subtle` | neutral-600 | neutral-300 |
| `--link` | `text-link` | primary-600 | primary-400 |
| `--link-hover` | `hover:text-link-hover` | primary-700 | primary-300 |

**Interactive:**

| CSS Variable | Tailwind | Light | Dark |
|---|---|---|---|
| `--border` | `border-border` | neutral-200 | neutral-700 |
| `--ring` | `ring-ring` | primary-500 | primary-400 |

**Actions:**

| CSS Variable | Tailwind | Light | Dark |
|---|---|---|---|
| `--primary` | `bg-primary` | primary-600 | primary-500 |
| `--primary-foreground` | `text-primary-foreground` | white | white |
| `--primary-hover` | `hover:bg-primary-hover` | primary-700 | primary-400 |
| `--primary-border` | `border-primary-border` | transparent | transparent |
| `--secondary` | `bg-secondary` | white | neutral-800 |
| `--secondary-foreground` | `text-secondary-foreground` | neutral-900 | neutral-100 |
| `--secondary-hover` | `hover:bg-secondary-hover` | neutral-100 | neutral-700 |
| `--secondary-border` | `border-secondary-border` | neutral-300 | neutral-600 |

**Status:**

| CSS Variable | Tailwind | Purpose |
|---|---|---|
| `--success` / `--success-subtle` | `text-success` / `bg-success-subtle` | Positive outcomes |
| `--warning` / `--warning-subtle` | `text-warning` / `bg-warning-subtle` | Cautions |
| `--error` / `--error-subtle` | `text-error` / `bg-error-subtle` | Errors |
| `--info` / `--info-subtle` | `text-info` / `bg-info-subtle` | Information |

Status colors have fixed hues (green, amber, red, blue). Shade adjusts per context for legibility.

### Palette tokens (global, not context-aware)

Four color palettes with shades 50–950, set in `theme.yml`:

```
--primary-{50..950}
--secondary-{50..950}
--accent-{50..950}
--neutral-{50..950}
```

Palette colors are fixed — they don't change with context. Use for intentional brand touches:

```jsx
<span className="bg-primary-50 text-primary-700">{tag}</span>
```

**`bg-primary` vs `bg-primary-600`:** `bg-primary` is the semantic token (context-aware, shifts in dark). `bg-primary-600` is the palette shade (fixed). Both exist as separate classes.

---

## Translating Legacy Colors

### Three categories

Every color in a legacy React project falls into one of three categories:

**1. Structural colors** → semantic tokens

```
text-gray-900      → text-heading
text-gray-600      → text-body or text-subtle
bg-white (card)    → bg-card
border-gray-200    → border-border
bg-blue-600        → bg-primary
```

**2. Brand touches** → palette shades

```
bg-blue-50 text-blue-700 (badge)    → bg-primary-50 text-primary-700
bg-violet-100 (accent decoration)   → bg-accent-100
```

**3. Section backgrounds** → delete (runtime handles)

```
bg-white (section wrapper)     → REMOVE
bg-gray-900 (section wrapper)  → REMOVE, use theme: dark in frontmatter
```

### Quick reference

```
text-gray-900, text-white (dark)      →  text-heading
text-gray-700, text-gray-600          →  text-body
text-gray-500, text-gray-400          →  text-subtle
text-blue-600                          →  text-link
bg-white (card), bg-gray-50 (card)    →  bg-card
bg-gray-100 (hover/zebra)             →  bg-muted
border-gray-200                        →  border-border
bg-blue-600 text-white (button)       →  bg-primary text-primary-foreground
hover:bg-blue-700                      →  hover:bg-primary-hover
bg-gray-100 text-gray-900 (sec btn)   →  bg-secondary text-secondary-foreground
isDark ? 'text-white' : 'text-gray'   →  text-heading (delete conditional)
const themes = {...}                   →  DELETE (context system replaces)
```

### Delete patterns

- **Theme maps:** `const themes = { light: {...}, dark: {...} }` → delete entirely
- **Dark conditionals:** `isDark ? ... : ...` → replace with semantic token
- **Custom CSS variables:** `--ink`, `--paper` → values go to `theme.yml`, refs become tokens
- **Tone systems:** `const tones = { neutral: 'bg-gray-50' }` → move to frontmatter `background:`

---

## Key Files

| File | Role |
|---|---|
| `theming/src/normalize.js` | `normalizeTokenValue()` — single source of truth |
| `theming/src/section-overrides.js` | `buildSectionOverrides()` — the page stylesheet for sections' themes |
| `theming/src/index.js` | Exports for the theming package |
| `runtime/src/components/BlockRenderer.jsx` | Context class, and the section's `contextOverrides` inline |
| `runtime/src/components/PageRenderer.jsx` | `<SectionOverrideStyles>` — the page stylesheet |
| `core/src/block.js` | Block class — `normalizeSectionTheme()`, `themeName` (`''` = Auto), `componentVars` merging |
| `core/src/theme.js` | Theme class — `hasSchemeToggle()`, `getAppearance()` |
| `theming/src/css-generator.js` | Global theme CSS generation |
| `theming/src/processor.js` | Theme validation, `DEFAULT_APPEARANCE` |

## Utilities

| Function | File | Purpose |
|---|---|---|
| `normalizeTokenValue()` | `theming/src/normalize.js` | Normalize any stored token value to valid CSS |
| `buildSectionOverrides()` | `theming/src/section-overrides.js` | Build page-level section override CSS |
| `Theme.hasSchemeToggle()` | `core/src/theme.js` | Check if toggle enabled |
| `Theme.getAppearance()` | `core/src/theme.js` | Get appearance config |
| `getComputedStyle(el).getPropertyValue('--heading')` | the browser | A token's **actual** value at an element |

> `Theme.getContextTokens()` was removed in 2026-07-28. It reported what a
> `.context-*` class sets by default, which is not what a component needs to
> know: the value in force at an element also depends on that section's own
> `theme:` overrides and on the active light/dark scheme, neither of which a
> context lookup can see. Read the CSS variable instead — it resolves all three.
> For the defaults table itself (tooling, a theme editor), use
> `getDefaultContextTokens()` from `@uniweb/theming`, which owns it.
