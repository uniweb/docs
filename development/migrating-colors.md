# Theming and Color Migration

This is the complete reference for Uniweb's theming system and for translating color systems from existing React projects. It's written so that a developer or AI agent reading only this document can correctly theme a foundation and migrate any codebase without creating parallel color systems.

---

## How Theming Works

Uniweb's theming is built on two ideas: **semantic tokens** resolve per section, and the **runtime handles backgrounds**. Understanding both is essential before touching any color.

### Sections and contexts

A Uniweb page is divided into sections. Each section is a component rendered inside a wrapper that the runtime controls:

```html
<section class="context-light" id="section-hero">
  <!-- Your component renders here -->
</section>

<section class="context-dark" id="section-features">
  <!-- Different component, different context -->
</section>
```

The `context-*` class determines how every color token resolves in that section. Content authors set it in frontmatter:

```yaml
---
type: Features
theme: dark
---
```

Three contexts exist: `light`, `medium`, `dark`. They represent **legibility environments**, not brand preferences. A section is dark because there's a dark photo behind the content, or a dark gradient, or a brand-colored background. The content author chooses the context; the component adapts automatically.

### What the runtime does

For each section, the runtime:

1. Reads `theme:` and `background:` from the section's frontmatter
2. Renders any background layer — image, video, gradient, solid color — behind the component
3. Renders any overlay (e.g., a semi-transparent gradient for legibility)
4. Applies the context class (`.context-light`, `.context-medium`, `.context-dark`)
5. Sets `background-color: var(--section)` on the wrapper

The component inside the wrapper doesn't touch any of this. It never sets a section background. It doesn't know whether it's on top of a photo or a solid color. It uses semantic tokens and they resolve correctly.

Components can opt out of the runtime-rendered background by declaring `background: 'self'` in their `meta.js` — but this is rare and only for components that create their own visual environment (like a hero with a built-in gradient).

### Context vs scheme

These are two independent concepts:

**Section context** (light/medium/dark) answers: "what's behind the content in this section?" It's about legibility. A dark photo needs light text. A light card needs dark text. Each section has its own context.

**Site-level scheme** (light/dark/system) answers: "does this site prefer a light or dark overall appearance?" When the scheme is dark, sections with no explicit `theme:` frontmatter default to dark context instead of light. The page background darkens. Browser chrome adapts.

They compose independently. A dark-scheme site can have a bright white CTA section (`theme: light`). A light-scheme site can have a dramatic dark hero (`theme: dark`). Components don't need to know about either — they use tokens.

---

## The Token System

### Naming convention

Every semantic token follows one rule: **CSS variable name = Tailwind class suffix.**

`--heading` → `text-heading`
`--card` → `bg-card`
`--primary` → `bg-primary`
`--border` → `border-border`

No translation table between the variable and the class. See the variable name, know the class.

### Semantic tokens (24 total)

These resolve differently per context class. Components use them and get the right color automatically.

**Surfaces:**

| CSS Variable | Tailwind Class | Purpose |
|---|---|---|
| `--section` | `bg-section` | Section background (auto-applied by context class) |
| `--card` | `bg-card` | Cards, panels, elevated surfaces |
| `--muted` | `bg-muted` | Hover states, zebra rows, code blocks, input fields |

**Text:**

| CSS Variable | Tailwind Class | Purpose |
|---|---|---|
| `--body` | `text-body` | Body text, default text |
| `--heading` | `text-heading` | Headings, high-emphasis text |
| `--subtle` | `text-subtle` | Captions, timestamps, metadata, fine print |
| `--link` | `text-link` | Link text |
| `--link-hover` | `hover:text-link-hover` | Link hover |

**Interactive:**

| CSS Variable | Tailwind Class | Purpose |
|---|---|---|
| `--border` | `border-border` | Dividers, card edges, form borders |
| `--ring` | `ring-ring` | Focus rings |

**Actions:**

| CSS Variable | Tailwind Class | Purpose |
|---|---|---|
| `--primary` | `bg-primary` | Primary button/action background |
| `--primary-foreground` | `text-primary-foreground` | Text on primary buttons |
| `--primary-hover` | `hover:bg-primary-hover` | Primary button hover |
| `--secondary` | `bg-secondary` | Secondary button background |
| `--secondary-foreground` | `text-secondary-foreground` | Text on secondary buttons |
| `--secondary-hover` | `hover:bg-secondary-hover` | Secondary button hover |

**Status:**

| CSS Variable | Tailwind Class | Purpose |
|---|---|---|
| `--success` | `text-success`, `border-success` | Positive outcomes |
| `--success-subtle` | `bg-success-subtle` | Success background tint |
| `--warning` | `text-warning`, `border-warning` | Cautions |
| `--warning-subtle` | `bg-warning-subtle` | Warning background tint |
| `--error` | `text-error`, `border-error` | Errors, destructive actions |
| `--error-subtle` | `bg-error-subtle` | Error background tint |
| `--info` | `text-info`, `border-info` | Information, tips |
| `--info-subtle` | `bg-info-subtle` | Info background tint |

Status colors have fixed hues (green, amber, red, blue) that don't come from the brand palette. Their shade adjusts per context for legibility, but the hue stays recognizable.

### What tokens resolve to

In **light** context (the default):

| Token | Value | Visual |
|---|---|---|
| `--section` | `neutral-50` | Warm off-white |
| `--card` | `neutral-100` | Light warm gray |
| `--muted` | `neutral-200` | Lighter gray |
| `--body` | `neutral-950` | Near-black |
| `--heading` | `neutral-900` | Dark gray (slightly lighter than body) |
| `--subtle` | `neutral-600` | Medium gray |
| `--border` | `neutral-200` | Light gray |
| `--link` | `primary-600` | Brand color, medium shade |
| `--primary` | `primary-600` | Brand color, medium shade |
| `--primary-foreground` | white | White text on brand buttons |

In **dark** context:

| Token | Value | Visual |
|---|---|---|
| `--section` | `neutral-900` | Dark surface |
| `--card` | `neutral-800` | Slightly lighter dark |
| `--muted` | `neutral-700` | Medium dark |
| `--body` | `neutral-50` | Near-white |
| `--heading` | white | Pure white |
| `--subtle` | `neutral-400` | Light gray |
| `--border` | `neutral-700` | Dark gray |
| `--link` | `primary-400` | Brand color, lighter shade |
| `--primary` | `primary-500` | Brand color, slightly lighter |
| `--primary-foreground` | white | White |

In **medium** context, values sit between light and dark — slightly shifted from light. `--section` is `neutral-100` instead of `neutral-50`, `--subtle` is `neutral-700` instead of `neutral-600`, etc.

### Palette tokens (global, not context-aware)

Four color palettes with shades 50–950, set in `theme.yml`:

```
--primary-{50,100,200,300,400,500,600,700,800,900,950}
--secondary-{50,100,200,300,400,500,600,700,800,900,950}
--accent-{50,100,200,300,400,500,600,700,800,900,950}
--neutral-{50,100,200,300,400,500,600,700,800,900,950}
```

Palette colors are **fixed** — they don't change with context. Use them for intentional brand touches where you want a specific shade regardless of the section's visual environment:

```jsx
{/* Brand badge — always a primary tint */}
<span className="bg-primary-50 text-primary-700 rounded px-2 py-1">{tag}</span>

{/* Accent callout — always accent-tinted */}
<div className="bg-accent-50 border border-accent-200 p-4">{callout}</div>
```

**`bg-primary` vs `bg-primary-600`:** Both exist as separate Tailwind classes. `bg-primary` is the semantic token (context-aware, used for buttons). `bg-primary-600` is the palette shade (fixed, used for brand touches). In light context they're often the same value, but `bg-primary` shifts in dark context while `bg-primary-600` doesn't.

**`accent` is palette-only.** There is no semantic `--accent` token. Use palette shades directly: `bg-accent-100`, `text-accent-700`. This avoids a collision between the `accent` palette namespace and a hypothetical semantic token.

### The dual-role summary

| Need | Use | Type |
|---|---|---|
| Card background that adapts to context | `bg-card` | Semantic token |
| Brand-tinted badge that stays fixed | `bg-primary-50` | Palette shade |
| Button that adapts to context | `bg-primary` | Semantic token |
| Specific brand shade for decoration | `bg-primary-600` | Palette shade |
| Accent-colored callout | `bg-accent-100` | Palette shade |

---

## How theme.yml Controls Everything

The site author writes `theme.yml`. The build generates all CSS from it. Components never read `theme.yml` directly.

```yaml
# theme.yml
colors:
  primary: "#e85d04"          # Orange — generates primary-{50..950}
  secondary: "#2563eb"        # Blue — generates secondary-{50..950}
  accent: "#7c3aed"           # Violet — generates accent-{50..950}
  neutral: stone              # Warm grays — named preset

fonts:
  heading: "'Instrument Sans', system-ui, sans-serif"
  body: "'Source Sans 3', system-ui, sans-serif"

appearance: system            # light | dark | system

background: "#faf9f7"         # Page background (body element)

# Optional: override specific token values per context
contexts:
  light:
    section: "#faf9f7"        # Exact warm paper instead of auto-generated neutral-50
    card: "#f0efed"           # Exact warm card color
  dark:
    section: "#1a1917"        # Custom dark surface
```

**Neutral presets:** Instead of a hex value, `neutral` accepts a preset name: `stone` (warm, default), `zinc` (neutral), `gray` (balanced), `slate` (cool), `neutral` (pure gray). The preset determines the warmth/coolness of all gray shades throughout the site.

**Context overrides** let a site use exact hex values for specific tokens instead of auto-generated shades. The component doesn't know whether `--section` came from auto-generation or a manual override — it uses `bg-section` either way.

### What is NOT a CSS variable

Some theme concepts are site-level configuration, not tokens:

| Concept | Configured in | Why not a variable |
|---|---|---|
| Page background | `theme.yml` → `background:` | No component references it — it's the outermost canvas |
| Color scheme | `theme.yml` → `scheme:` | Browser-level hint for form controls and scrollbars |
| Selection colors | `theme.yml` → `selection:` | Text selection highlight — decorative, never referenced |
| Favicon / meta | `site.yml` | Site metadata, not visual theming |

**The design test:** "Would a section component ever write a Tailwind class that references this?" If yes → CSS variable. If no → configuration.

---

## Foundation Setup

A foundation uses semantic tokens through Tailwind. The required setup:

**`styles.css`** — import the bridge that maps CSS variables to Tailwind's `--color-*` namespace:

```css
@import "tailwindcss";
@import "@uniweb/kit/theme-tokens.css";
```

That's it. `theme-tokens.css` registers all semantic tokens and palette shades as Tailwind colors. You can now write `bg-card`, `text-heading`, `border-border`, `bg-primary-50`, etc.

**Foundation-specific variables** (like `--radius`, `--header-height`) are declared in `main.js` and set by the site in `theme.yml`. These are separate from semantic tokens — they don't change with context:

```js
// src/main.js
export default {
  vars: {
    'radius': { default: '0.5rem' },
    'header-height': { default: '4rem' },
  },
}
```

---

## Translating Legacy React Projects

When migrating an existing React project to a Uniweb foundation, the core insight is: **you write less color code, not more.** The token system provides what you used to hardcode. Custom color variables and theme-switching logic get deleted, not translated.

### The three categories of color

Every color in a React project falls into one of three categories. Recognizing which one determines what you do with it.

**1. Structural colors** — tied to what an element *is*: heading text, body text, card backgrounds, borders, buttons. They're the bulk of any codebase.

```jsx
<h2 className="text-gray-900">...</h2>          // heading
<p className="text-gray-600">...</p>             // secondary text
<div className="bg-white border border-gray-200"> // card
```

These translate to semantic tokens:

| What the element is | Legacy example | Semantic token |
|---|---|---|
| Heading text | `text-gray-900`, `text-white` | `text-heading` |
| Body text | `text-gray-700`, `text-gray-300` | `text-body` |
| Secondary/caption text | `text-gray-500`, `text-gray-600` | `text-subtle` |
| Link text | `text-blue-600` | `text-link` |
| Card/panel background | `bg-white`, `bg-gray-50`, `bg-gray-800` | `bg-card` |
| Hover/zebra background | `bg-gray-100`, `bg-gray-700` | `bg-muted` |
| Border/divider | `border-gray-200`, `border-gray-700` | `border-border` |
| Primary button | `bg-blue-600 text-white` | `bg-primary text-primary-foreground` |
| Primary hover | `hover:bg-blue-700` | `hover:bg-primary-hover` |
| Secondary button | `bg-gray-100 text-gray-900` | `bg-secondary text-secondary-foreground` |

**2. Brand touches** — intentional fixed-shade brand references. These don't change with context.

```jsx
<span className="bg-blue-50 text-blue-700">{tag}</span>     // brand badge
<div className="bg-violet-100 border border-violet-200">     // accent callout
```

These translate to palette shades. Map the original hue to the right palette based on the design's intent:

```jsx
<span className="bg-primary-50 text-primary-700">{tag}</span>
<div className="bg-accent-100 border border-accent-200">
```

**3. Section backgrounds** — the outermost wrapper color on a component. **Delete these.** The runtime handles section backgrounds through context classes and frontmatter.

```jsx
// BEFORE
function Features({ content }) {
  return (
    <div className="bg-white py-16 px-6">          {/* ← delete bg-white */}
      <div className="max-w-6xl mx-auto">...</div>
    </div>
  )
}

// AFTER
function Features({ content }) {
  return (
    <div className="max-w-6xl mx-auto px-6">       {/* ← just content */}
      ...
    </div>
  )
}
Features.className = 'py-16'                         // ← padding on the wrapper
```

### Step-by-step migration

For each component:

**1. Remove the section background.** Find the outermost background color. Delete it. Move section-level padding (vertical) to `Component.className`. This single change enables the context system.

**2. Classify each remaining color.** Ask for each Tailwind color class: structural (heading, text, border, card), brand touch (badge, accent), or status (error, success)?

**3. Replace structural colors with semantic tokens.** Ask: "what is this element's *role*?" A caption is `text-subtle`. A card is `bg-card`. A divider is `border-border`.

**4. Replace brand hues with palette references.** `bg-blue-600` on a button → `bg-primary`. `bg-violet-50` on a callout → `bg-accent-50`. `bg-green-50 border-green-200 text-green-800` on a success alert → `bg-success-subtle border-success text-success`.

**5. Delete all theme-switching code.** Theme maps, `isDark` conditionals, variant-based color objects, custom CSS variables — all replaced by the context system.

### Recognizing common legacy patterns

**Theme maps** — the most common pattern in projects that support dark mode:

```jsx
const themes = {
  light: { bg: 'bg-white', title: 'text-gray-900', text: 'text-gray-600' },
  dark:  { bg: 'bg-gray-900', title: 'text-white', text: 'text-gray-300' },
}
```

Delete the entire object. `t.bg` → removed (engine handles it). `t.title` → `text-heading`. `t.text` → `text-body` or `text-subtle`.

**Tone/color systems** — colored section backgrounds as a component param:

```jsx
const tones = { neutral: 'bg-gray-50', blue: 'bg-blue-50', violet: 'bg-violet-50' }
```

Delete it. Colored backgrounds are content, not code. Move to frontmatter:

```yaml
---
type: Features
theme: light
background:
  color: var(--secondary-50)
---
```

**Dark mode conditionals:**

```jsx
const isDark = params.theme === 'dark'
<h2 className={isDark ? 'text-white' : 'text-gray-900'}>...</h2>
```

Delete the conditional. Replace with `text-heading`. The context class handles the inversion.

**Custom CSS variables:**

```css
:root {
  --ink: #1a1a1a;
  --paper: #faf9f7;
  --warm: #f0efed;
  --signal: #e85d04;
  --stroke: #d6d3d1;
}
```

Delete the variables. Each one maps to a token or to `theme.yml`:

| Custom variable | Destination |
|---|---|
| `--ink` (heading/body text) | `text-heading` / `text-body` (tokens in JSX) |
| `--paper` (section/page bg) | `contexts.light.section: "#faf9f7"` in theme.yml |
| `--warm` (card surfaces) | `contexts.light.card: "#f0efed"` in theme.yml |
| `--signal` (primary brand) | `colors.primary: "#e85d04"` in theme.yml |
| `--stroke` (borders) | `border-border` (token, auto-derived from neutral) |

Exact values go to `theme.yml`. Component code uses semantic tokens. Custom variables disappear.

**Hardcoded white/black:**

```jsx
<h1 className="text-white">...</h1>          // in a dark section
<div className="bg-black/80">...</div>         // overlay
```

`text-white` inside a dark section → `text-heading` (resolves to white in dark context). `bg-black/80` as a section overlay → frontmatter `background.overlay`. If it's a card-level overlay, consider `bg-section/80` which adapts to context.

---

## The Parallel System Trap

The most common migration mistake — and the hardest to undo — is copying the original project's color system into the foundation's `styles.css`:

```css
/* DON'T DO THIS */
@theme inline {
  --color-ink: #1a1a1a;
  --color-paper: #faf9f7;
  --color-warm: #f0efed;
  --color-signal: #e85d04;
}
```

This creates a parallel color system. The CCA tokens (`--heading`, `--card`, `--primary`) still exist — the build generates them from `theme.yml` — but no component uses them. The foundation becomes a sealed unit that ignores the site's theme.

**Symptoms:**
- Changing colors in `theme.yml` does nothing visible
- `theme: dark` in frontmatter has no effect or breaks the layout
- The foundation only works with one specific `theme.yml`
- Deploying the foundation to a different site requires editing component code

**The fix** is always the same: delete the custom variables, use semantic tokens in components, move the exact color values to `theme.yml`.

### When bridge aliases are justified

During a large migration, temporary aliases avoid rewriting every component at once:

```css
/* Temporary bridge — delete after migration is complete */
@theme inline {
  --color-ink: var(--body);
  --color-paper: var(--section);
  --color-warm: var(--card);
  --color-signal: var(--primary);
}
```

These map **to semantic tokens**, not to fixed colors. `text-ink` now resolves through `var(--body)`, which changes with context. The bridge lets existing component code work while you replace `text-ink` with `text-body` one file at a time.

Delete the bridge when migration is complete. New components should always use the standard names.

---

## Worked Example: Before and After

A features component from a typical React project:

```jsx
// BEFORE: hardcoded colors, theme map, section background
const themes = {
  light: { card: 'bg-white', title: 'text-gray-900', text: 'text-gray-600', border: 'border-gray-200' },
  dark:  { card: 'bg-gray-800', title: 'text-white', text: 'text-gray-300', border: 'border-gray-700' },
}

function Features({ items, theme = 'light' }) {
  const t = themes[theme]
  return (
    <section className={`py-16 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <h2 className={`text-3xl font-bold ${t.title}`}>Features</h2>
        <div className="grid md:grid-cols-3 gap-8 mt-10">
          {items.map((item, i) => (
            <div key={i} className={`p-6 rounded-xl ${t.card} ${t.border} border`}>
              <h3 className={`text-xl font-semibold ${t.title}`}>{item.title}</h3>
              <p className={`mt-2 ${t.text}`}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

```jsx
// AFTER: semantic tokens, no theme logic, no section background
function Features({ content }) {
  const { title, items } = content

  return (
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-3xl font-bold text-heading">{title}</h2>
      <div className="grid md:grid-cols-3 gap-8 mt-10">
        {items.map((item, i) => (
          <div key={i} className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-heading">{item.title}</h3>
            <p className="mt-2 text-subtle">{item.paragraphs?.[0]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

Features.className = 'py-16'
```

What happened:
- The `themes` object and `theme` param → deleted (context system replaces them)
- Section background (`bg-gray-900` / `bg-gray-50`) → deleted (runtime handles it)
- `t.title` → `text-heading`
- `t.text` → `text-subtle`
- `t.card` → `bg-card`
- `t.border` → `border-border`
- Vertical padding → moved to `Features.className`
- Props → `{ content }` (text comes from markdown)
- 25 fewer lines, zero color decisions in the component

Content author controls the visual environment:

```yaml
---
type: Features
theme: dark
---
```

One line in frontmatter replaces 8 lines of theme-switching code. And it works with any site's color palette, because the component never mentions a specific color.

---

## Button Example

Buttons are a good test of whether the migration is right, because they combine background, text, and hover in a tight space:

```jsx
// BEFORE
<button className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg">
  Get Started
</button>
<button className="bg-gray-100 text-gray-900 hover:bg-gray-200 px-4 py-2 rounded-lg">
  Learn More
</button>

// AFTER
<button className="bg-primary text-primary-foreground hover:bg-primary-hover px-4 py-2 rounded-lg">
  {links[0]?.label}
</button>
<button className="bg-secondary text-secondary-foreground hover:bg-secondary-hover px-4 py-2 rounded-lg">
  {links[1]?.label}
</button>
```

The `primary` and `secondary` action tokens adapt to context. In a dark section, the primary button shifts shade for contrast. In a different site with red branding, it's red. The component doesn't know.

A ghost/outline button variant:

```jsx
// Ghost: transparent background, hover uses muted surface
<button className="text-body hover:bg-muted px-4 py-2 rounded-lg">
  Cancel
</button>
```

---

## What Stays, What Goes, What Moves

| Category | Stays in JSX | Deleted | Moves to theme.yml / frontmatter |
|---|---|---|---|
| **Layout** | `grid`, `flex`, `max-w-6xl`, `gap-8`, `rounded-xl` | | |
| **Spacing** | `p-6`, `mt-4`, `space-y-2`, `py-16` (on wrapper) | | |
| **Typography scale** | `text-3xl`, `font-bold`, `leading-relaxed` | | |
| **Animations** | `transition-colors`, `hover:scale-105` | | |
| **Section bg** | | `bg-white`, `bg-gray-900` | Frontmatter `background:` |
| **Text colors** | | `text-gray-900`, `text-gray-600`, `text-white` | Tokens: `text-heading`, `text-body`, `text-subtle` |
| **Card bg** | | `bg-white`, `bg-gray-50`, `bg-gray-800` | Token: `bg-card` |
| **Borders** | | `border-gray-200`, `border-gray-700` | Token: `border-border` |
| **Button colors** | | `bg-blue-600 text-white` | Tokens: `bg-primary text-primary-foreground` |
| **Brand hex values** | | `#e85d04`, `#2563eb` | `colors.primary`, `colors.secondary` |
| **Theme maps** | | `const themes = {...}` | Context system replaces |
| **Dark conditionals** | | `isDark ? ... : ...` | Context system replaces |
| **Custom CSS vars** | | `--ink`, `--paper`, etc. | Values → theme.yml; refs → tokens |

---

## Exceptions

Two patterns legitimately use hardcoded colors.

**Headers** float across contexts — transparent over a dark hero, opaque when scrolled. They manage their own background and may use hardcoded colors for the transparent state. Even so, nav links can use `text-subtle` and `hover:text-body` when the header is in a normal state:

```jsx
function Header({ content, block }) {
  const [scrolled, setScrolled] = useState(false)
  return (
    <header className={cn(
      'sticky top-0 z-50 backdrop-blur-md transition-shadow',
      scrolled ? 'bg-section/80 shadow-sm' : 'bg-transparent'
    )}>
      <nav className="text-subtle">
        <a className="hover:text-body transition-colors">{label}</a>
      </nav>
    </header>
  )
}
```

**Self-managing components** render their own background and set their own context class, overriding the wrapper's context:

```jsx
<div className="bg-gradient-to-br from-primary-700 to-primary-950 context-dark">
  <h1 className="text-heading">{title}</h1>       {/* resolves to white */}
</div>
```

These should declare `background: 'self'` in `meta.js` so the runtime doesn't render an occluded background layer behind the component.

For most components, neither exception applies. Use semantic tokens.

---

## Verification Checklist

After migrating a component or foundation:

1. **Change `colors.primary` in `theme.yml`.** Every button, link, and brand accent should shift. If something keeps the old color, you missed a hardcoded reference.

2. **Set `theme: dark` on a section.** All text should be light, cards should be dark, borders should adapt. If something is invisible or shows the wrong color, there's a hardcoded class.

3. **Set `theme: medium` on a section.** Surfaces should be slightly darker than light context. If nothing changes from `theme: light`, the component is using hardcoded grays.

4. **Search for hardcoded color classes:**
   ```
   grep -r 'text-gray\|text-white\|text-black\|bg-white\|bg-gray\|bg-black\|border-gray' src/sections/
   ```
   Any matches outside of Header are candidates for token replacement.

5. **Search for custom CSS variables.** Any `--color-` definition in `styles.css` that maps to a fixed hex value (not `var(--heading)` etc.) is a parallel system.

6. **Verify `styles.css` imports the bridge:**
   ```css
   @import "tailwindcss";
   @import "@uniweb/kit/theme-tokens.css";
   ```

7. **Verify no component sets its own section background.** Search for `bg-white`, `bg-gray-50`, `bg-gray-900` etc. on the outermost wrapper element. These should be removed — the runtime handles section backgrounds.

---

## Quick Reference: Legacy → Token Translation

For fast lookup during migration:

```
text-gray-900, text-slate-900, text-black    →  text-heading  (or text-body)
text-gray-700, text-gray-600                 →  text-body
text-gray-500, text-gray-400                 →  text-subtle
text-blue-600, text-indigo-600               →  text-link
text-white (in dark sections)                →  text-heading

bg-white, bg-gray-50 (section wrapper)       →  REMOVE (runtime handles it)
bg-white, bg-gray-50 (card/panel)            →  bg-card
bg-gray-100 (hover/zebra/code)               →  bg-muted
bg-gray-900 (section wrapper)                →  REMOVE (use theme: dark in frontmatter)

border-gray-200, border-gray-300             →  border-border
border-gray-700 (dark)                       →  border-border (auto-adapts)
border-gray-200/50 (lighter)                 →  border-border/50

bg-blue-600 text-white (button)              →  bg-primary text-primary-foreground
hover:bg-blue-700 (button)                   →  hover:bg-primary-hover
bg-gray-100 text-gray-900 (sec. button)      →  bg-secondary text-secondary-foreground

bg-red-50 border-red-200 text-red-800        →  bg-error-subtle border-error text-error
bg-green-50 border-green-200 text-green-800  →  bg-success-subtle border-success text-success
bg-amber-50 border-amber-200 text-amber-800  →  bg-warning-subtle border-warning text-warning
bg-blue-50 border-blue-200 text-blue-800     →  bg-info-subtle border-info text-info

bg-blue-50, text-blue-700 (brand badge)      →  bg-primary-50, text-primary-700
bg-violet-100 (accent decoration)            →  bg-accent-100

isDark ? 'text-white' : 'text-gray-900'     →  text-heading (delete conditional)
themes[theme].title                          →  text-heading (delete theme map)
```
