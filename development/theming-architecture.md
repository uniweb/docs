# Theming Architecture

Internal reference for the Uniweb theming system. Covers the two-axis model (context × scheme), the Auto context, section-level overrides, and how it all flows from editor to runtime.

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

Section `color_context` field:

| Value | Meaning |
|-------|---------|
| `""` / `null` / unset | Auto — follow site appearance |
| `"light"` | Pinned to Light |
| `"medium"` | Pinned to Dim |
| `"dark"` | Pinned to Dark |

Empty string is the default. No backend change required.

In `core/src/block.js`, `block.themeName` maps from this:

```js
this.themeName = rawTheme || ''  // '' = Auto
```

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

### Dual CSS rules (Auto + toggle + overrides)

When an Auto section has overrides AND the site has toggle enabled, two CSS rules are generated:

```css
/* Light scheme overrides */
#section-hero { --heading: rgba(var(--primary-900) / 1.00); }

/* Dark scheme overrides */
.scheme-dark #section-hero { --heading: rgba(var(--primary-200) / 1.00); }
```

This ensures the correct overrides apply as the scheme toggles. When Auto without toggle, or when pinned, only a single rule is generated (one context).

---

## Section-Level Overrides — Storage Model

### Format

Section overrides are stored in `standard_options` (JSON string on the section record):

```js
{
  colors: {
    colors: {                              // Base palette — context-independent
      light: { "--primary-500": "...", ... }  // Always under 'light' key by convention
    },
    elements: {                            // Semantic tokens — context-dependent
      light: { heading: "rgba(var(--primary-900) / 1.00)", ... },
      dark:  { heading: "rgba(var(--primary-200) / 1.00)", ... }
    }
  },
  foundationStyles: {
    "field-id": "value"                    // Foundation-specific style overrides
  }
}
```

**Base palette** (`colors.colors`): Always stored under the `light` key. Context-independent — the palette shade `primary-500` is the same blue in light and dark. Both `appendStyle()` in `theme.js:63` and `buildColorStyles()` in `sectionStyleManager.js:49` always read from `vars["light"]` regardless of active context.

**Element tokens** (`colors.elements`): Keyed by context name. Genuinely context-dependent — `heading` in light might be `var(--primary-900)` while in dark it's `var(--primary-100)`.

### What gets populated per scenario

| Scenario | `color_context` | `elements` keys populated | CSS output |
|---|---|---|---|
| No overrides | `""` | (empty) | No rules generated |
| Pinned to Light | `"light"` | `elements.light` | `#section-{id} { ... }` |
| Pinned to Dim | `"medium"` | `elements.medium` | `#section-{id} { ... }` |
| Pinned to Dark | `"dark"` | `elements.dark` | `#section-{id} { ... }` |
| Auto + no toggle | `""` | `elements[default]` | `#section-{id} { ... }` |
| Auto + toggle | `""` | `elements.light` AND `elements.dark` | Dual rules with `.scheme-dark` |

### Sample data

#### No overrides (default section)

```js
color_context: ""
standard_options: {}
```

#### Pinned to Dark with overrides

```js
color_context: "dark"
standard_options: {
  colors: {
    colors: {
      light: {
        "--primary-500": "59 130 246",
        "--primary-600": "37 99 235"
      }
    },
    elements: {
      dark: {
        "heading": "rgba(var(--primary-200) / 1.00)",
        "section": "rgba(var(--neutral-950) / 1.00)",
        "body": "rgba(var(--neutral-300) / 1.00)"
      }
    }
  }
}
// CSS: context-dark class + #section-{id} { vars from elements.dark }
```

#### Pinned to Light with overrides

```js
color_context: "light"
standard_options: {
  colors: {
    colors: {
      light: {
        "--primary-500": "59 130 246"
      }
    },
    elements: {
      light: {
        "heading": "rgba(var(--primary-900) / 1.00)",
        "section": "rgba(var(--neutral-50) / 1.00)"
      }
    }
  }
}
// CSS: context-light class + #section-{id} { vars from elements.light }
```

#### Auto + no toggle (site default = light)

```js
color_context: ""
standard_options: {
  colors: {
    colors: {
      light: {
        "--primary-500": "59 130 246"
      }
    },
    elements: {
      light: {
        "heading": "rgba(var(--primary-900) / 1.00)",
        "section": "rgba(var(--neutral-50) / 1.00)"
      }
    }
  }
}
// CSS: NO context class + #section-{id} { vars from elements[appearance.default] }
// Same storage shape as "pinned to light" — only color_context differs
```

#### Auto + toggle (both contexts customized)

```js
color_context: ""
standard_options: {
  colors: {
    colors: {
      light: {
        "--primary-500": "59 130 246"
      }
    },
    elements: {
      light: {
        "heading": "rgba(var(--primary-900) / 1.00)",
        "section": "rgba(var(--neutral-50) / 1.00)",
        "body": "rgba(var(--neutral-800) / 1.00)"
      },
      dark: {
        "heading": "rgba(var(--primary-200) / 1.00)",
        "section": "rgba(var(--neutral-950) / 1.00)",
        "body": "rgba(var(--neutral-300) / 1.00)"
      }
    }
  }
}
// CSS: NO context class + dual rules:
//   #section-{id} { light vars }
//   .scheme-dark #section-{id} { dark vars }
```

#### Auto + toggle (only light customized)

```js
color_context: ""
standard_options: {
  colors: {
    elements: {
      light: {
        "heading": "rgba(var(--primary-900) / 1.00)"
      }
      // dark: not present — user hasn't edited the Dark tab yet
    }
  }
}
// CSS: dual rules — light rule has overrides, dark rule is empty (theme defaults)
```

### Edge cases

**Site enables toggle on existing Auto section with only `elements.light` overrides:**
Light scheme applies the overrides. Dark scheme has no `elements.dark` — falls back to theme defaults. User opens Dark tab to customize if needed.

**Site changes default from light to dark (no toggle):**
Auto sections now read from `elements[dark]` — which may be empty. The old `elements.light` data sits dormant (not lost). If default switches back, the light overrides return.

**Section changes from Auto to Pinned:**
If it had `elements.light` and `elements.dark`, runtime now only uses the pinned context's key. The other key stays dormant.

**Section changes from Pinned to Auto:**
The pinned context's overrides still work for that scheme. The other tab starts empty.

### Dormant data policy

Unused context keys are left in storage when switching modes. They're harmless and preserve customizations if the user switches back. No cleanup on mode change.

---

## Editor Panel Consumption

### Context initialization

When `SectionColors` opens, it determines the editing context:

| Section mode | `settings.context` init value | Context tabs |
|---|---|---|
| Pinned to Light | `"light"` | None |
| Pinned to Dim | `"medium"` | None |
| Pinned to Dark | `"dark"` | None |
| Auto + no toggle | `appearance.default` (e.g., `"light"`) | None |
| Auto + toggle | Current scheme (from iframe DOM) | Light / Dark |

```js
const sectionContext = activeSection?.color_context || ""
const isAutoSection = !sectionContext
const showContextTabs = isAutoSection && isToggleEnabled
```

### How overrides are saved

The `updateCustom(category, context, name, value)` function writes to `elements[context][name]`. The `context` argument comes from `settings.context`, which is:

- The pinned context (for pinned sections)
- The site's default appearance (for Auto + no toggle)
- The currently active tab (for Auto + toggle)

This means the storage key is always determined by the active editing context — no special logic needed.

### Syncing to preview

When element overrides are saved, `SectionColors` sends them through the `updateParams` pipeline — the same flow used for all section edits:

```js
sendToPreview("updateParams", {
  pageRoute,
  sectionId,
  params: { standardOptions: nextOptions }
})
```

The iframe receives `updateParams` → updates the block's `standardOptions` → `rebuildWebsite()` → `setVersion(v+1)` → React re-renders → `<SectionOverrideStyles>` rebuilds the page-level CSS. No separate message type needed.

---

## Runtime Rendering

### Architecture: pre-built page-level CSS

Section overrides follow the same pattern as global theme CSS. Just as `buildTheme()` produces a `<style id="uniweb-theme">` tag for the global palette and context tokens, section overrides are pre-built into a single `<style id="uniweb-page-overrides">` tag per page.

This keeps the DOM clean — no inline styles on section elements, no scattered per-section `<style>` tags.

### buildSectionOverrides(blocks, appearance)

New utility in `theming/src/section-overrides.js`. Takes all blocks on a page + appearance config, returns a CSS string:

```js
export function buildSectionOverrides(blocks, appearance) {
  let css = ''
  for (const block of blocks) {
    const { colors, foundationStyles } = block.standardOptions || {}
    if (!hasOverrides(colors, foundationStyles)) continue

    const id = `#section-${block.stableId || block.id}`
    const isAuto = !block.themeName
    const hasToggle = appearance.allowToggle

    if (isAuto && hasToggle) {
      // Dual rules — light and dark overrides in separate selectors
      css += `${id} { ${buildVarsCSS(colors, 'light', foundationStyles)} }\n`
      css += `.scheme-dark ${id} { ${buildVarsCSS(colors, 'dark')} }\n`
    } else {
      // Single context — pinned context or site default
      const ctx = block.themeName || appearance.default || 'light'
      css += `${id} { ${buildVarsCSS(colors, ctx, foundationStyles)} }\n`
    }
  }
  return css
}
```

`buildVarsCSS()` is a helper that reads base palette from `colors.colors.light` (context-independent) and element tokens from `colors.elements[ctx]`, and returns a CSS declaration string.

### BlockRenderer.jsx — context class only

`BlockRenderer.jsx` handles context class assignment. No inline styles for section overrides — those come from the page-level `<style>` tag:

```js
// Empty themeName = Auto → no context class → inherits from :root
// Non-empty themeName in VALID_CONTEXTS → pinned
if (theme && VALID_CONTEXTS.includes(theme)) {
  contextClass = `context-${theme}`
}
```

Frontmatter-level `contextOverrides` (from `theme: { mode: dark, heading: neutral-900 }`) are still applied as inline CSS vars — these are content-author overrides, separate from editor UI overrides.

### SectionOverrideStyles component

A React component renders the page-level `<style>` tag in the website renderer:

```jsx
function SectionOverrideStyles({ blocks, appearance }) {
  const css = useMemo(
    () => buildSectionOverrides(blocks, appearance),
    [blocks, appearance]
  )
  if (!css) return null
  return <style id="uniweb-page-overrides">{css}</style>
}
```

React manages the tag lifecycle. When blocks change (via `updateParams` → `rebuildWebsite()` → `setVersion(v+1)`), the component re-renders and CSS updates naturally.

### Editor preview (DynamicApp.jsx)

The dynamic runtime uses the same `<SectionOverrideStyles>` component. Editor updates flow through the existing `updateParams` pipeline:

1. Editor: `sendToPreview("updateParams", { pageRoute, sectionId, params: { standardOptions } })`
2. Iframe: `updateParams` handler → `rebuildWebsite()` → `setVersion(v+1)` → React re-render
3. `<SectionOverrideStyles>` re-renders with updated CSS

No `updateSectionTheme` message type needed. Same data flow as other section edits.

### Published site (unicloud)

`buildSectionOverrides()` is called during prerender and injected into the HTML alongside the global theme CSS:

```js
const sectionCSS = buildSectionOverrides(page.blocks, appearance)
// → <style id="uniweb-page-overrides">{sectionCSS}</style>
```

### Legacy runtime (reference only)

`uniweb-js/src/core/theme.js` and `sectionStyleManager.js` contain the legacy rendering logic. Key patterns used as reference:

- `appendStyle(style, colors, context)` — reads vars from `light` key, elements from `[context]` key
- `getStyleContent(colors)` — generates dual CSS rules for toggle-enabled sites
- `buildColorStyles({ vars, elements }, context)` — builds CSS variable map for a single context

These files are **not modified** in this project. The modern runtime replaces their functionality.

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
| `theming/src/normalize.js` | **NEW** — `normalizeTokenValue()` — single source of truth |
| `theming/src/section-overrides.js` | **NEW** — `buildSectionOverrides()` utility |
| `theming/src/index.js` | Exports for the theming package |
| `runtime/src/components/BlockRenderer.jsx` | Context class logic (no inline override styles) |
| `runtime/src/components/WebsiteRenderer.jsx` | Renders `<SectionOverrideStyles>` component |
| `core/src/block.js` | Block class — `themeName` defaults to `''` (Auto) |
| `core/src/theme.js` | Theme class — `hasSchemeToggle()`, `getAppearance()` |
| `theming/src/css-generator.js` | Global theme CSS generation |
| `theming/src/processor.js` | Theme validation, `DEFAULT_APPEARANCE` |
| `uniweb-editor/dynamic-runtime/src/DynamicApp.jsx` | Editor preview — `updateParams` handler |
| `uniweb-js/src/.../SectionColors.jsx` | Section color editor — uses `updateParams` |
| `uniweb-js/src/.../ContextSelect.jsx` | Context picker — adds Auto option |
| `uniweb-js/src/.../SectionStyle.jsx` | Section appearance panel |
| `unicloud/src/renderer/assembler.js` | Inject section override CSS into HTML |

## Utilities

| Function | File | Purpose |
|---|---|---|
| `normalizeTokenValue()` | `theming/src/normalize.js` | Normalize any stored token value to valid CSS |
| `buildSectionOverrides()` | `theming/src/section-overrides.js` | Build page-level section override CSS |
| `Theme.hasSchemeToggle()` | `core/src/theme.js` | Check if toggle enabled |
| `Theme.getAppearance()` | `core/src/theme.js` | Get appearance config |
| `Theme.getContextTokens()` | `core/src/theme.js` | Get token values for a context |
