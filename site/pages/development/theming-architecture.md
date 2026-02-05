# Theming Architecture

How the theming system works end-to-end, why it exists, and how to build CCA-proper foundations that embrace it.

## The Philosophy

Uniweb's Component Content Architecture (CCA) separates two worlds:

- **Site** — content, branding, and theming decisions. Managed by content authors and designers who don't write code.
- **Foundation** — component structure and behavior. Managed by developers who write React components.

The theming system is the bridge between them. It lets **sites control appearance** while **foundations provide structure**. The same foundation can look completely different across sites — different colors, different fonts, different section backgrounds — without any code changes.

This is possible because the runtime generates CSS custom properties from the site's `theme.yml` and applies them through a context class system. Components that use these variables adapt automatically. Components that hardcode colors don't — and that defeats the architecture.

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  SITE AUTHOR (theme.yml)                                        │
│                                                                 │
│  colors:                    contexts:          fonts:            │
│    primary: "#3b82f6"         dark:              body: Inter     │
│    neutral: "#71717a"           bg: ...           heading: ...   │
│                                 text: ...                       │
│                                                                 │
│  Section frontmatter:                                           │
│    theme: dark              (per-section override)              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  BUILD (packages/build/src/theme/)                              │
│                                                                 │
│  1. processor.js:                                               │
│     - Reads theme.yml                                           │
│     - Validates colors, contexts, fonts, appearance             │
│     - Generates palettes (11 shades per color, OKLCH)           │
│     - Merges foundation variables with site overrides            │
│                                                                 │
│  2. css-generator.js:                                           │
│     - Generates complete CSS string:                            │
│       :root { --primary-50: oklch(...); ... }                   │
│       :root { --bg: ...; --text: ...; --link: ... }  (defaults) │
│       .context-light { --bg: ...; --text: ...; }                │
│       .context-medium { --bg: ...; --text: ...; }               │
│       .context-dark { --bg: ...; --text: ...; }                 │
│       :root { --header-height: 4rem; }  (foundation vars)       │
│                                                                 │
│  3. Output → site-content.json:                                 │
│     { theme: { palettes, contexts, fonts, css, ... } }          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  RUNTIME                                                        │
│                                                                 │
│  1. ThemeProvider.jsx:                                           │
│     Injects pre-generated CSS into <head> as <style> tag        │
│     (SSG: already in HTML at build time — zero FOUC)            │
│                                                                 │
│  2. Block class (core):                                         │
│     block.themeName = params.theme || 'light'                   │
│                                                                 │
│  3. BlockRenderer.jsx:                                          │
│     Applies context class to section wrapper:                   │
│     <section class="context-dark" id="section-hero">            │
│       <Component content={...} params={...} block={...} />      │
│     </section>                                                  │
│                                                                 │
│  4. CSS cascade:                                                │
│     .context-dark { --bg: var(--neutral-900); --text: ... }     │
│     All descendant elements inherit these variables              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT                                                      │
│                                                                 │
│  Uses CSS variables — adapts to any context automatically:      │
│  <h2 style={{ color: 'var(--heading)' }}>{title}</h2>           │
│  <p style={{ color: 'var(--text-muted)' }}>{description}</p>    │
│  <a style={{ color: 'var(--link)' }}>{label}</a>                │
└─────────────────────────────────────────────────────────────────┘
```

## Semantic Token System

The build generates **semantic tokens** — abstract names for colors that resolve differently depending on context. This is the key mechanism that makes section-level theming work.

### Available Tokens

Every context class (`.context-light`, `.context-medium`, `.context-dark`) defines these CSS variables:

| Token | Purpose | Light | Medium | Dark |
|-------|---------|-------|--------|------|
| `--bg` | Section background | neutral-50 | neutral-100 | neutral-900 |
| `--bg-subtle` | Cards, wells | neutral-100 | neutral-200 | neutral-800 |
| `--bg-muted` | Hover states, zebra | neutral-200 | neutral-300 | neutral-700 |
| `--text` | Primary text | neutral-950 | neutral-950 | neutral-50 |
| `--text-muted` | Secondary text | neutral-600 | neutral-700 | neutral-300 |
| `--text-subtle` | Tertiary/hint text | neutral-500 | neutral-600 | neutral-400 |
| `--heading` | Heading text | neutral-900 | neutral-900 | white |
| `--link` | Link text | primary-600 | primary-600 | primary-400 |
| `--link-hover` | Link hover state | primary-700 | primary-700 | primary-300 |
| `--border` | Primary borders | neutral-200 | neutral-300 | neutral-700 |
| `--border-muted` | Subtle borders | neutral-100 | neutral-200 | neutral-800 |
| `--ring` | Focus rings | primary-500 | primary-500 | primary-500 |
| `--btn-primary-bg` | Primary button bg | primary-600 | primary-600 | primary-500 |
| `--btn-primary-text` | Primary button text | white | white | white |
| `--btn-primary-hover` | Primary button hover | primary-700 | primary-700 | primary-400 |
| `--btn-secondary-bg` | Secondary button bg | neutral-100 | neutral-200 | neutral-800 |
| `--btn-secondary-text` | Secondary button text | neutral-900 | neutral-900 | neutral-100 |
| `--btn-secondary-hover` | Secondary button hover | neutral-200 | neutral-300 | neutral-700 |

### How Context Propagation Works

When a content author writes:

```yaml
---
type: Hero
theme: dark
---
# Welcome
```

The runtime produces:

```html
<section class="context-dark" id="section-hero">
  <!-- Component content here -->
</section>
```

The CSS generated from `theme.yml` includes:

```css
.context-dark {
  --bg: var(--neutral-900);
  --text: var(--neutral-50);
  --heading: white;
  --link: var(--primary-400);
  /* ... all tokens redefined for dark context */
}
```

Any element inside this section that uses `var(--text)` automatically gets the light text color. No conditional logic needed in the component.

### Site-Level Customization

Content authors can override the defaults for any context in `theme.yml`:

```yaml
contexts:
  dark:
    bg: var(--primary-900)      # Use primary color instead of neutral
    link: var(--accent-300)     # Use accent for links in dark sections
```

This changes what `var(--bg)` and `var(--link)` resolve to inside every `.context-dark` section, affecting all components at once.

## Color Palettes

Each color in `theme.yml` generates 11 shades using the OKLCH color space (perceptually uniform):

```yaml
colors:
  primary: "#3b82f6"    # → --primary-50 through --primary-950
  secondary: "#64748b"  # → --secondary-50 through --secondary-950
  accent: "#8b5cf6"     # → --accent-50 through --accent-950
  neutral: "#71717a"    # → --neutral-50 through --neutral-950 (used by contexts)
```

The `neutral` palette is special — it's what the default context tokens reference (`--bg: var(--neutral-50)`, etc.). Changing the neutral color shifts the entire gray scale of the site.

Components can reference palette shades directly for accent elements:

```jsx
<div style={{ background: 'var(--primary-50)', color: 'var(--primary-900)' }}>
  Highlighted callout
</div>
```

But for text, backgrounds, links, and borders, **always prefer semantic tokens** (`--text`, `--bg`, `--link`, `--border`). These adapt to the section context; palette shades don't.

## Foundation Variables

Foundations can declare customizable CSS variables that sites can override:

```js
// foundation/src/foundation.js
export const vars = {
  'header-height': { default: '4rem', description: 'Fixed header height' },
  'max-content-width': { default: '80rem', description: 'Max content width' },
  'section-padding-y': { default: '5rem', description: 'Vertical section padding' },
}
```

Sites override in `theme.yml`:

```yaml
vars:
  header-height: 5rem
  section-padding-y: 6rem
```

Components use them:

```css
.header { height: var(--header-height); }
.container { max-width: var(--max-content-width); }
```

Foundation variables are **layout and spacing concerns**, not color. Colors belong in the context token system.

## Dark Mode (Site-Wide Appearance)

Separate from section-level contexts, the entire site can support dark mode:

```yaml
# theme.yml
appearance:
  default: light
  allowToggle: true
  respectSystemPreference: true
```

When dark mode is active, the class `scheme-dark` is added to `<html>`, which redefines the root-level semantic tokens. This provides a site-wide dark theme that works alongside section-level contexts.

Components use the `useAppearance()` hook for toggle UI:

```jsx
import { useAppearance } from '@uniweb/kit'

function DarkModeToggle() {
  const { scheme, toggle, canToggle } = useAppearance()
  if (!canToggle) return null
  return <button onClick={toggle}>{scheme === 'dark' ? 'Light' : 'Dark'}</button>
}
```

### Context vs Appearance

These are distinct concepts:

| Concept | Scope | Set By | Purpose |
|---------|-------|--------|---------|
| **Context** (`theme: dark`) | Per-section | Content author (frontmatter) | A dark-background section on a light-mode site |
| **Appearance** (`scheme-dark`) | Entire site | User preference | The whole site in dark mode |

A site can have `appearance: light` (no dark mode) but still have sections with `theme: dark` — those sections just have dark backgrounds.

## What CCA-Proper Components Look Like

### The Anti-Pattern

Every current template does this:

```jsx
// ❌ Anti-pattern: hardcoded colors, inline theme objects
function Features({ content, params }) {
  const themes = {
    light: { section: 'bg-white', title: 'text-gray-900', text: 'text-gray-600' },
    gray: { section: 'bg-gray-50', title: 'text-gray-900', text: 'text-gray-600' },
    dark: { section: 'bg-gray-900', title: 'text-white', text: 'text-gray-300' },
  }
  const t = themes[params.theme] || themes.light

  return (
    <section className={cn('py-20 px-6', t.section)}>
      <h2 className={cn('text-3xl font-bold', t.title)}>{content.title}</h2>
      <p className={cn('text-lg', t.text)}>{content.paragraphs[0]}</p>
    </section>
  )
}
```

Problems:
1. The component invents its own theme system instead of using the one the engine provides
2. Colors are hardcoded Tailwind classes — changing them requires editing code
3. The context class the runtime applies (`context-light`, `context-dark`) has no effect
4. A site author who changes `primary: "#e11d48"` in `theme.yml` sees no change in this component
5. Theme names and available values are inconsistent across components (`light/gray/dark` vs `light/dark/gradient`)
6. `bg-gray-900` is always that exact gray regardless of the site's neutral color

### The CCA Pattern

```jsx
// ✅ CCA-proper: uses semantic tokens, context-aware
function Features({ content, params }) {
  return (
    <div className="py-20 px-6">
      <h2 className="text-3xl font-bold" style={{ color: 'var(--heading)' }}>
        {content.title}
      </h2>
      <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
        {content.paragraphs[0]}
      </p>

      <div className="grid grid-cols-3 gap-6 mt-10">
        {content.items.map((item, i) => (
          <div key={i} className="p-6 rounded-xl" style={{
            background: 'var(--bg-subtle)',
            borderColor: 'var(--border-muted)',
            borderWidth: '1px',
          }}>
            <h3 className="font-bold" style={{ color: 'var(--heading)' }}>
              {item.title}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>{item.paragraphs[0]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Why this is better:
1. **No theme object needed** — the runtime already applied `context-light` or `context-dark` to the wrapper
2. **Colors adapt automatically** — a content author sets `theme: dark` in frontmatter and everything inverts
3. **Site branding flows through** — changing `neutral` in `theme.yml` changes all grays site-wide
4. **Reusable across sites** — the same foundation works for a blue brand, a red brand, or any brand
5. **Consistent behavior** — every component responds to context the same way

### What About the Section Background?

The CCA component doesn't set its own section background color. That's handled by the engine through two mechanisms:

1. **Context CSS** — `.context-dark { --bg: var(--neutral-900) }` sets the background semantically. But note: the context class doesn't automatically set `background-color` on the element. The component needs to apply `var(--bg)` if it wants a visible background.

2. **Engine backgrounds** — Content authors can set `background: /images/hero.jpg` in frontmatter, and the runtime renders it as an absolute-positioned layer behind the component content. The runtime sets `block.hasBackground` to true when this happens, signaling the component should avoid rendering an opaque background that would occlude the image.

A well-designed component handles both cases:

```jsx
function Hero({ content, params, block }) {
  // If the engine rendered a background image, don't add our own opaque bg
  // The context class on the wrapper still provides semantic tokens
  const sectionStyle = block.hasBackground
    ? {}  // transparent — let engine background show through
    : { background: 'var(--bg)' }  // opaque — use context background color

  return (
    <div className="py-20 px-6" style={sectionStyle}>
      <h1 className="text-5xl font-bold" style={{ color: 'var(--heading)' }}>
        {content.title}
      </h1>
    </div>
  )
}
```

### Using Tailwind with CSS Variables

You can bridge CSS variables into Tailwind if the foundation's Tailwind config maps them:

```css
/* foundation/src/styles.css */
@theme {
  --color-surface: var(--bg);
  --color-surface-subtle: var(--bg-subtle);
  --color-on-surface: var(--text);
  --color-on-surface-muted: var(--text-muted);
  --color-on-surface-heading: var(--heading);
}
```

Then in components:

```jsx
<h2 className="text-3xl font-bold text-on-surface-heading">{title}</h2>
<p className="text-on-surface-muted">{description}</p>
<div className="bg-surface-subtle border border-border-muted rounded-xl p-6">
  ...
</div>
```

This gives you Tailwind's ergonomics while keeping colors context-aware.

### What Components Can Still Hardcode

CCA doesn't forbid hardcoding. Foundations can do whatever they want. The question is: does a hardcoded value make the component less reusable across sites?

**OK to hardcode:**
- Layout structure (grid columns, padding, max-width, flex direction)
- Spacing and sizing (gap, margin, border-radius)
- Typography scale (text-xl, font-bold)
- Animations and transitions
- Structural Tailwind utilities (flex, grid, relative, overflow-hidden)

**Should use CSS variables:**
- Text colors → `var(--text)`, `var(--heading)`, `var(--text-muted)`
- Background colors → `var(--bg)`, `var(--bg-subtle)`
- Link colors → `var(--link)`, `var(--link-hover)`
- Border colors → `var(--border)`, `var(--border-muted)`
- Button colors → `var(--btn-primary-bg)`, `var(--btn-primary-text)`
- Brand accent colors → `var(--primary-500)`, `var(--accent-600)`

**Foundation-specific hardcoded colors** (like a green tag badge) should use the palette system:

```jsx
// ❌ Hardcoded green that ignores site branding
<span className="bg-green-100 text-green-800">Tag</span>

// ✅ Uses site's primary color
<span style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>Tag</span>

// ✅ Or uses a foundation variable for tag color
<span style={{ background: 'var(--tag-bg, var(--primary-50))', color: 'var(--tag-text, var(--primary-700))' }}>Tag</span>
```

## Header and Footer: Special Cases

Header and Footer are typically rendered outside the section/block system. They're not wrapped in context classes by BlockRenderer — they manage their own appearance.

**Best practices for Header/Footer:**

1. Use `var(--primary-*)` shades for brand elements (logo color, active nav links)
2. For the header background, either:
   - Use `var(--bg)` for a context-matching header
   - Hardcode a specific background (common for fixed headers with blur)
3. For footer, use explicit `context-dark` class if it should always be dark:
   ```jsx
   <footer className="context-dark" style={{ background: 'var(--bg)' }}>
     <p style={{ color: 'var(--text-muted)' }}>© 2025</p>
   </footer>
   ```
   This way the footer respects the site's neutral palette even when hardcoded to dark context.

## Runtime API for Components

Kit provides hooks for components that need programmatic access to theme data:

```jsx
import { useThemeData, useThemeColor, useThemeColorVar, useColorContext, useAppearance } from '@uniweb/kit'

// Full theme object
const theme = useThemeData()
const palette = theme?.getPalette('primary')  // { 50: '...', 100: '...', ... }
const names = theme?.getPaletteNames()        // ['primary', 'secondary', ...]

// Single color value
const primaryColor = useThemeColor('primary', 600)  // 'oklch(55% 0.19 260)'

// CSS variable reference
const primaryVar = useThemeColorVar('primary', 500)  // 'var(--primary-500)'

// Current section's context
const context = useColorContext(block)  // 'light', 'medium', or 'dark'

// Site-wide appearance
const { scheme, toggle, canToggle } = useAppearance()
```

Most components don't need these hooks — CSS variables cover the common cases. Use hooks for:
- Dynamic style computation based on theme colors
- Color pickers or theme preview UIs
- Components that need to know the exact context programmatically (rare)

## Key Files

| File | Role |
|------|------|
| `packages/build/src/theme/processor.js` | Validates and processes `theme.yml` |
| `packages/build/src/theme/css-generator.js` | Generates complete CSS with context classes |
| `packages/build/src/theme/shade-generator.js` | OKLCH palette generation algorithm |
| `packages/core/src/theme.js` | Theme class for runtime access |
| `packages/core/src/block.js` | Extracts `themeName` from section params (line 46) |
| `packages/runtime/src/components/ThemeProvider.jsx` | Injects theme CSS into `<head>` |
| `packages/runtime/src/components/BlockRenderer.jsx` | Applies `context-{theme}` class to section wrapper |
| `packages/kit/src/hooks/useThemeData.js` | Component hooks for theme access |

## Related Documentation

| Document | Audience | Content |
|----------|----------|---------|
| `packages/cli/docs/site-theming.md` | Foundation developers | Configuration reference for `theme.yml` |
| `packages/cli/docs/guides/theming.md` | Content authors | User-friendly guide for non-coders |
| `docs/internal/color-shade-generation.md` | Internal | OKLCH algorithm details |
| `docs/internal/css-loading-architecture.md` | Internal | How CSS is injected in SSG vs federated mode |
