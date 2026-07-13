# Site Theming

Customize your site's colors, typography, and appearance through a `theme.yml` file. The theming system generates CSS custom properties at build time, enabling consistent branding across all components.

## Quick Start

Create `site/theme.yml`:

```yaml
colors:
  primary: "#3b82f6"
  secondary: "#64748b"
```

That's it. Your site now has a complete color palette with 11 shades for each color, semantic tokens that adapt per-section, and Tailwind utility classes like `bg-primary-500` and `text-heading` ready to use.

## How It Works

1. **You define colors** in `theme.yml` (one hex value per palette)
2. **Build generates CSS** — 11 perceptually-uniform shades per color (OKLCH), semantic tokens for light/medium/dark contexts, font variables
3. **CSS is injected** into `<head>` at runtime (works with SSG — zero FOUC)
4. **Content authors control sections** — `theme: dark` in frontmatter applies a context class, and all semantic tokens resolve accordingly

The key insight: **components don't manage their own colors**. They use semantic tokens (`text-heading`, `bg-section`, `border-border`) that resolve differently depending on the section's context. A content author writes `theme: dark` on a hero section, and every component inside it automatically gets light text on a dark background — no conditional logic in the component.

## What You Author vs What the Build Derives

`theme.yml` holds only **authored** values — your inputs. Everything else (the 11-shade
palettes, the full semantic-token set per context, the generated CSS) is **derived** by the
build from those inputs. You never write shade ramps or CSS variables by hand, and you never
need to store them anywhere — they're recomputed on every build.

This distinction matters if you ever read or generate a theme programmatically (a theme editor,
a migration script, a preview tool): **persist only the authored keys; recompute the rest.**
Storing derived shades or CSS variables alongside the authored values is redundant and drifts
the moment a color changes.

### Authored keys (what lives in `theme.yml`)

Every key is optional — an empty `theme.yml` (or none) yields an all-defaults theme.

| Key | Shape | Notes |
|-----|-------|-------|
| `colors` | **Flat** — `{ primary, secondary, accent, neutral }` | **One set for the whole site**, not per-context. A hex string, a `{ base, mode }` object, a full shade object, or (for `neutral`) a preset name. |
| `contexts` | **Sparse** — `{ light?, medium?, dark? }` | Semantic-**token** overrides only (e.g. `link: primary-500`), never base colors. Omit entirely to accept all defaults; list only the tokens you change. |
| `fonts` | `{ body?, heading?, mono?, import? }` | Font-family strings + optional `import` list. |
| `appearance` | string or `{ default, allowToggle, respectSystemPreference, schemes? }` | Site-wide light/dark scheme. |
| `inline` | `{ accent?, callout?, muted?, … }` | Inline text-style definitions; merged over framework defaults. |
| `vars` | `{ <name>: value \| { light, dark } }` | **Foundation** variable overrides (e.g. `header-height`) — a separate concept from color palettes. |
| `code` | `{ background, foreground, keyword, … }` | Syntax-highlighting colors. |
| `background` | CSS value string | Site-level page background. |

### Derived at build time (never authored, never stored)

| Derived output | Computed from | Where it appears |
|----------------|---------------|------------------|
| **Palette shades** — `--primary-50 … --primary-950` (× every color) | `colors` (11-shade OKLCH generation) | CSS variables + Tailwind classes |
| **Full context token set** — every semantic token per `light`/`medium`/`dark` | framework defaults ⊕ your sparse `contexts` overrides | `.context-*` CSS classes |
| **The theme CSS string** | all of the above | injected into `<head>` at runtime |

So base `colors` are **flat and global**; `contexts` sit **on top** as token overrides that
reference the palettes (`link: primary-600` → `var(--primary-600)`). There is no per-context
base-color layer, and the palette/CSS variables are outputs, not inputs.

> **Reading a theme in code?** Import the same derivation the build uses from `@uniweb/theming`
> (`generatePalettes(colors)` for shade ramps, `buildTheme(themeYml)` for the fully-merged
> config + CSS) rather than re-implementing shade math. That keeps any tool you build in lockstep
> with what the site actually renders.

## Color Palettes

Define brand colors with a single hex value — shades are auto-generated:

```yaml
colors:
  primary: "#3b82f6"      # Main brand color
  secondary: "#64748b"    # Supporting color
  accent: "#8b5cf6"       # Highlight color
  neutral: "#78716c"      # Text, backgrounds, borders
```

### Generated Shades

Each color generates 11 shades as CSS variables (`--primary-50` through `--primary-950`):

| Shade | Lightness | Use Case |
|-------|-----------|----------|
| 50 | 97% | Subtle backgrounds |
| 100 | 93% | Hover backgrounds |
| 200 | 87% | Active backgrounds |
| 300 | 78% | Borders |
| 400 | 68% | Placeholder text |
| 500 | (input) | **Your exact color** (shades redistribute around it) |
| 600 | 48% | **Primary buttons, links** (light context default) |
| 700 | 40% | Pressed states |
| 800 | 32% | Dark accents |
| 900 | 24% | Near-black |
| 950 | 14% | Darkest |

### Generation Modes

Control how shades are generated with the `mode` option:

```yaml
colors:
  primary:
    base: "#3b82f6"
    mode: natural     # 'fixed', 'natural', or 'vivid'
```

| Mode | Hue | Chroma | Best For |
|------|-----|--------|----------|
| `fixed` | Constant | Linear scaling | Design systems, accessibility |
| `natural` | Temperature-aware shifts | Bézier curve (1.1x boost) | Organic, artistic palettes |
| `vivid` | Subtle shifts | High boost (1.4x) | Bold marketing, gaming |

**Fixed (default)**: Predictable results with constant hue across all shades. Best for design systems where consistent contrast ratios matter.

**Natural**: Warmer colors (reds, oranges) shift cooler in light shades and warmer in dark shades. Cool colors do the opposite. Creates more organic-feeling palettes.

**Vivid**: Maximum saturation with dramatic chroma curves. Colors stay vibrant even at light and dark extremes.

See the [color modes visual comparison](./color-modes-example.html) for a side-by-side view.

### Exact Brand Color Matching

By default, shade 500 **is** your exact input color. The build redistributes surrounding shades proportionally to maintain a smooth, monotonic lightness scale.

To opt out and use fixed lightness values instead (shade 500 will be adjusted to lightness 55%, which may differ from your input):

```yaml
colors:
  primary:
    base: "#E35D25"
    exactMatch: false   # Use fixed lightness scale
```

### Using Your Brand Color on Buttons

Buttons and links in light contexts use shade **600** (not 500) for accessibility — shade 600 provides better contrast with white foreground text. To use your exact brand color on buttons, override the primary token:

```yaml
colors:
  primary: "#E35D25"

contexts:
  light:
    primary: primary-500         # Your exact color on buttons
    primary-hover: primary-600   # Darker shade on hover
```

> **Accessibility note:** Bright brand colors (orange, yellow, light green) at shade 500 may not meet WCAG contrast requirements (4.5:1) with white text. Test your buttons for readability.

### Using Colors

Palette colors are available as both CSS variables and Tailwind classes.

**CSS variables** (short names, set by the build):
```css
.my-button {
  background: var(--primary-600);
  color: white;
}
.my-button:hover {
  background: var(--primary-700);
}
```

**Tailwind classes** (via `theme-tokens.css` bridge):
```jsx
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Click me
</button>
```

### Pre-defined Shade Objects

For precise control, provide your own shade values:

```yaml
colors:
  brand:
    50: "#fef2f2"
    100: "#fee2e2"
    200: "#fecaca"
    300: "#fca5a5"
    400: "#f87171"
    500: "#ef4444"
    600: "#dc2626"
    700: "#b91c1c"
    800: "#991b1b"
    900: "#7f1d1d"
    950: "#450a0a"
```

## Color Contexts

Contexts define semantic color tokens for different section backgrounds. Content authors apply them via the `theme` frontmatter parameter:

```markdown
---
type: Hero
theme: dark
---
```

### Default Contexts

Three contexts are available by default:

| Context | Background | Text | Use Case |
|---------|------------|------|----------|
| `light` | White | Dark gray | Default sections |
| `medium` | Light gray | Dark gray | Alternating sections |
| `dark` | Dark gray | White | Hero sections, footers |

### Semantic Tokens

Each context defines CSS variables that components use instead of hardcoded colors. Components using these tokens adapt automatically when a content author changes the section's `theme:` in frontmatter — no conditional logic needed.

**Text:**

| Token | Purpose | Tailwind Class |
|-------|---------|---------------|
| `--heading` | Heading text | `text-heading` |
| `--body` | Body text | `text-body` |
| `--subtle` | Secondary/hint text | `text-subtle` |

**Surfaces:**

| Token | Purpose | Tailwind Class |
|-------|---------|---------------|
| `--section` | Section background | `bg-section` |
| `--card` | Card/well background | `bg-card` |
| `--muted` | Hover/zebra background | `bg-muted` |

**Borders:**

| Token | Purpose | Tailwind Class |
|-------|---------|---------------|
| `--border` | Primary borders | `border-border` |
| `--border` + opacity | Subtle borders | `border-border/50` |
| `--ring` | Focus rings | `ring-ring` |

**Links:**

| Token | Purpose | Tailwind Class |
|-------|---------|---------------|
| `--link` | Link text | `text-link` |
| `--link-hover` | Link hover | `hover:text-link-hover` |

**Buttons:**

| Token | Purpose | Tailwind Class |
|-------|---------|---------------|
| `--primary` | Primary button background | `bg-primary` |
| `--primary-foreground` | Primary button text | `text-primary-foreground` |
| `--primary-hover` | Primary button hover | `hover:bg-primary-hover` |
| `--primary-border` | Primary button border | `border-primary-border` |
| `--secondary` | Secondary button background | `bg-secondary` |
| `--secondary-foreground` | Secondary button text | `text-secondary-foreground` |
| `--secondary-hover` | Secondary button hover | `hover:bg-secondary-hover` |
| `--secondary-border` | Secondary button border | `border-secondary-border` |

### Customizing Contexts

Override semantic tokens per context:

```yaml
contexts:
  light:
    section: white
    link: primary-600
    border: neutral-200

  dark:
    section: primary-900           # Use primary color instead of neutral
    link: accent-300               # Use accent for links in dark sections
```

Palette references like `primary-600` resolve to `var(--primary-600)` automatically. Plain CSS values (`white`, `#hex`, `rgb(...)`, `var(...)`) pass through as-is.

### Context Value Mappings

The following table shows how each semantic token resolves in each context. These defaults derive from the neutral and primary palettes set in `theme.yml`:

| Token | `context-light` | `context-medium` | `context-dark` |
|-------|-----------------|-------------------|----------------|
| `--section` | neutral-50 | neutral-100 | neutral-900 |
| `--card` | neutral-100 | neutral-200 | neutral-800 |
| `--body` | neutral-950 | neutral-950 | neutral-50 |
| `--subtle` | neutral-600 | neutral-700 | neutral-300 |
| `--heading` | neutral-900 | neutral-900 | white |
| `--link` | primary-600 | primary-600 | primary-400 |
| `--border` | neutral-200 | neutral-300 | neutral-700 |
| `--primary` | primary-600 | primary-600 | primary-500 |
| `--primary-foreground` | white | white | white |
| `--primary-hover` | primary-700 | primary-700 | primary-400 |
| `--primary-border` | transparent | transparent | transparent |
| `--secondary` | white | white | neutral-800 |
| `--secondary-foreground` | neutral-900 | neutral-900 | neutral-100 |
| `--secondary-hover` | neutral-100 | neutral-100 | neutral-700 |
| `--secondary-border` | neutral-300 | neutral-300 | neutral-600 |

Sites can override any of these mappings under the `contexts:` key (see above).

### Per-Section Token Overrides

The `theme:` frontmatter supports an extended object format that lets content authors override specific tokens for a single section. Use `mode` to set the context (light/medium/dark), and add any token names alongside it:

```yaml
---
type: Header
theme:
  mode: light
  primary: neutral-900
  primary-hover: neutral-800
---
```

This keeps the light context for text and backgrounds, but gives the primary button a dark appearance — just for this section. Any token from the semantic token table above can be overridden this way.

The overrides are applied as inline CSS custom properties on the section wrapper, so they take precedence over the context class values. Components don't need to know about the overrides — they just use `bg-primary` and get the overridden value.

For simple string usage, `theme: dark` is equivalent to `theme: { mode: dark }`.

### Section Backgrounds

Sections can also declare a background in frontmatter, independent of the theme context:

```yaml
---
type: CTA
theme: dark
background:
  color: var(--primary-600)
---
```

This gives the section a branded background with all the dark context's text and link colors. The runtime renders the background behind the component — the component doesn't need to know about it.

Background accepts several formats:

```yaml
# Solid color
background:
  color: var(--primary-600)

# Gradient
background:
  gradient: linear-gradient(135deg, var(--primary-600), var(--primary-800))

# Image (shorthand — a path or URL is treated as an image)
background: /images/hero.jpg

# Image with overlay
background:
  image: /images/hero.jpg
  overlay: 0.5

# Video (autoplays muted, loops)
background:
  video: /videos/hero.mp4
```

Video backgrounds autoplay muted and loop. If you provide an `.mp4`, the runtime also tries `.webm` for better compression where supported.

## Typography

Configure font families and imports:

```yaml
fonts:
  body: "Inter, system-ui, sans-serif"
  heading: "Poppins, system-ui, sans-serif"
  mono: "Fira Code, monospace"

  import:
    - url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700"
    - url: "https://fonts.googleapis.com/css2?family=Poppins:wght@600;700"
```

When font imports are present, the build automatically injects `<link rel="preconnect">` tags for each import origin. For Google Fonts specifically, it also preconnects to `fonts.gstatic.com` (where font files are served from, separate from the CSS endpoint). This eliminates the DNS/TLS round-trip delay that would otherwise occur when the browser first encounters the `@import` in the theme CSS.

Generated CSS variables:

```css
:root {
  --font-body: Inter, system-ui, sans-serif;
  --font-heading: Poppins, system-ui, sans-serif;
  --font-mono: Fira Code, monospace;
}
```

## Code Block Syntax Highlighting

Code blocks in markdown content are automatically syntax-highlighted using [Shiki](https://shiki.style). Customize the colors via the `code` section:

```yaml
code:
  background: "#1e1e2e"     # Code block background
  foreground: "#cdd6f4"     # Default text color

  # Syntax highlighting colors
  keyword: "#cba6f7"        # Keywords (if, else, function)
  string: "#a6e3a1"         # String literals
  number: "#fab387"         # Numbers
  comment: "#6c7086"        # Comments
  function: "#89b4fa"       # Function names
  variable: "#f5e0dc"       # Variables
  operator: "#89dceb"       # Operators
  type: "#f9e2af"           # Type names
  constant: "#f38ba8"       # Constants
  property: "#94e2d5"       # Object properties
  tag: "#89b4fa"            # HTML/JSX tags
  attribute: "#f9e2af"      # HTML attributes
```

If you don't customize `code`, Uniweb uses a dark theme inspired by Catppuccin Mocha. Shiki is lazy-loaded — only downloaded when a page contains code blocks.

## Appearance (Light/Dark Mode)

Control site-wide color scheme preferences:

```yaml
appearance:
  default: light              # 'light', 'dark', or 'system'
  allowToggle: true           # Let visitors switch modes
  respectSystemPreference: true
  schemes: [light, dark]      # Available schemes
```

### Simple Shorthand

For simple cases, use a string:

```yaml
appearance: light    # Fixed light mode, no toggle
appearance: dark     # Fixed dark mode, no toggle
appearance: system   # Follow system preference
```

Components use the `useAppearance()` hook if they need to render a toggle:

```jsx
import { useAppearance } from '@uniweb/kit'

function DarkModeToggle() {
  const { scheme, toggle, canToggle } = useAppearance()
  if (!canToggle) return null
  return <button onClick={toggle}>{scheme === 'dark' ? 'Light' : 'Dark'}</button>
}
```

## Foundation Variables

Foundations can define customizable CSS variables that sites override:

### Foundation Definition

In `src/main.js`:

```js
export const vars = {
  'header-height': {
    default: '4rem',
    description: 'Fixed header height',
  },
  'max-content-width': {
    default: '80rem',
    description: 'Maximum content width',
  },
}
```

### Site Override

In `site/theme.yml`:

```yaml
vars:
  header-height: 5rem
  max-content-width: 72rem
```

## Tailwind Integration

Foundations using Tailwind CSS v4 import a bridge file that maps theme variables to Tailwind's namespace:

```css
@import "tailwindcss";
@import "@uniweb/kit/theme-tokens.css";
```

This single import registers both semantic tokens and palette shades as Tailwind utilities. The build system generates short CSS variable names (`--primary-600`, `--heading`, `--section`), and `theme-tokens.css` bridges them to Tailwind's `--color-*` namespace so that classes like `bg-primary-600`, `text-heading`, and `bg-section` work.

**Why is this bridge needed?** Tailwind v4 builds at compile time, but theme values arrive at runtime (from `theme.yml`). The bridge file registers variable names with fallback defaults so Tailwind can generate the utility classes. At runtime, the real values from the theme CSS override the fallbacks.

Foundations that want different Tailwind names can skip the import and declare their own `@theme inline` block.

## Programmatic Access

Kit provides hooks for rare cases where components need runtime access to theme data — color pickers, theme previews, or dynamic style computation:

```jsx
import { useThemeData, useThemeColor, useThemeColorVar, useColorContext, useAppearance } from '@uniweb/kit'

const theme = useThemeData()                    // Full Theme object
const primaryColor = useThemeColor('primary', 600) // Actual oklch value
const primaryVar = useThemeColorVar('primary', 500) // 'var(--primary-500)'
const context = useColorContext(block)             // 'light', 'medium', or 'dark'
```

Most components don't need these hooks. Semantic tokens and Tailwind classes cover the common cases.

## Complete Example

```yaml
# site/theme.yml

# Brand colors
colors:
  primary: "#0066cc"
  secondary: "#475569"
  accent: "#dc2626"
  neutral: "#78716c"

# Section contexts
contexts:
  light:
    section: white
    link: primary-600
  dark:
    section: primary-900
    link: primary-300

# Typography
fonts:
  body: "Inter, sans-serif"
  heading: "Inter, sans-serif"
  import:
    - url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700"

# Dark mode support
appearance:
  default: light
  allowToggle: true
  respectSystemPreference: true
  schemes: [light, dark]

# Foundation overrides
vars:
  header-height: 4.5rem
  max-content-width: 76rem
```

## Section Wrapper

The runtime wraps each component in a `<section>` element with context classes. Components don't render their own `<section>` — they render the inner content:

```html
<!-- Runtime output -->
<section class="context-dark py-16 md:py-24" id="section-cta">
  <!-- Your component renders here -->
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-heading">...</h2>
  </div>
</section>
```

Section-level styles — vertical padding, borders — go on the wrapper via `Component.className`. The component's JSX only needs a content-constraint div:

```jsx
function CTA({ content }) {
  return (
    <div className="max-w-6xl mx-auto px-6 text-center">
      <h2 className="text-heading text-3xl font-bold">{content.title}</h2>
      <p className="text-subtle mt-4">{content.paragraphs[0]}</p>
    </div>
  )
}

CTA.className = 'py-16 md:py-24 border-b border-border'

export default CTA
```

You can also change the wrapper element with `Component.as`:

```jsx
Header.as = 'nav'      // <nav> instead of <section>
```

If your component also renders `<section>`, you get nested sections — semantically wrong and potentially competing for background/padding control.

## Advanced Patterns

Most components should use semantic tokens exclusively. Two patterns legitimately need to step outside the context system.

### Floating overlays

A Header doesn't live *inside* a context — it floats *across* them. When it's transparent over a dark hero, the text must be white. When the user scrolls and it gets a white background, the text must be dark. When a dropdown opens, the panel is always light.

These are absolute visual requirements, not contextual ones:

```jsx
// Floating header — defines its own visual context
const getHeaderStyles = () => {
  if (isFloating && !scrolled && isDarkBackground) {
    return 'bg-transparent text-white'
  }
  return 'bg-white shadow-sm text-gray-900'
}

// Dropdown — always its own light panel
<div className="bg-white rounded-lg shadow-lg border border-gray-100">
```

Even in the Header, normal-state nav links can use semantic tokens:

```jsx
// Non-floating nav links — these DO live in a context
return 'text-subtle hover:text-body'
```

The principle: use semantic tokens for elements that inherit from their surroundings. Use hardcoded colors for elements that *define* their surroundings.

### Self-contexting components

A component that renders its own background — like a Hero with a gradient variant — creates a dark visual context that the runtime doesn't know about. The solution is to set the context directly:

```jsx
const isGradient = variant === 'gradient' && !block.hasBackground

return (
  <div className={cn(
    'relative py-20 px-6',
    isGradient && 'bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 context-dark'
  )}>
    <h1 className="text-heading">{title}</h1>
    <p className="text-subtle">{description}</p>
  </div>
)
```

Adding `context-dark` on the component's own root element overrides the wrapper's context class via CSS proximity. This is justified but exceptional — most components should never set their own context. When the content author sets a background via frontmatter, `block.hasBackground` is true and the runtime handles it normally.

## Developing with Semantic Tokens

Components use tokens like `text-heading` and `bg-card`, and those tokens need a site to activate the theming pipeline:

```
site/theme.yml  →  build generates palette + context CSS  →  tokens resolve  →  components have colors
```

No site, no `theme.yml`, no colors. This is why even the simplest project starts with two packages — a site and a foundation. The site might be purely a testbed — throwaway content, a quick `theme.yml` with a single primary color. Its job during development is to give the build system something to generate CSS from.

To verify your components truly adapt, change the primary color in `theme.yml` and rebuild. Everything branded — buttons, links, accents, badges — should shift without touching any component code. If something doesn't change, you've found a hardcoded color that should be a token.

## Best Practices

1. **Start with primary**: Define at least a `primary` color — it's the foundation of your palette

2. **Use semantic tokens**: Reference context tokens (`text-heading`, `bg-section`, `border-border`) in components instead of hardcoded colors. They adapt automatically to section themes and site-wide appearance.

3. **Leverage frontmatter**: Section appearance is controlled by content authors through `theme:` and `background:` in frontmatter, not by component params. Components render; the runtime applies context.

4. **Keep fonts minimal**: Load only weights you actually use to optimize performance

## See Also

- [Site Configuration](./site-configuration.md) — Full site.yml reference
- [Page Configuration](./page-configuration.md) — Section theme parameter
- [Thinking in Contexts](../development/thinking-in-contexts.md) — How section contexts and site schemes work together
- [Component Metadata](./component-metadata.md) — Full meta.js schema
