# Foundation Configuration

The `foundation.js` file defines customizable CSS variables and configuration for your foundation. Layout components live in `src/layouts/` and are auto-discovered.

## Overview

Foundations can expose configuration points that sites customize in their `theme.yml`:

```
foundation/
├── src/
│   ├── foundation.js      # Name, description, variables, defaultLayout, props
│   ├── sections/          # Section types
│   ├── components/        # Internal components
│   ├── layouts/           # Layout components (auto-discovered)
│   └── styles.css         # Global styles
├── package.json
└── vite.config.js
```

---

## Identity

By default, the foundation's `name` and `description` come from `package.json`. You can override them in `foundation.js` — useful when the npm package name differs from the display name you want in visual editors:

```js
// foundation/src/foundation.js
export default {
  name: 'Marketing Template',
  description: 'A modern marketing site template with hero, features, and pricing sections.',
}
```

If omitted, the values fall back to `package.json`. The `version` always comes from `package.json`.

---

## CSS Variables (vars)

Most customization is handled by component params. Both section components and layout components declare their own params in `meta.js` — layouts are full components with params, not just structural wrappers. A header height, for example, is typically a layout param, not a foundation var.

Foundation-level CSS variables are for values that must stay consistent **across** multiple components — shared radii, spacing scales, or additional font roles beyond the three the theming system already provides (body, heading, mono). Don't reach for foundation vars when a component or layout param would do.

### Defining Variables

```js
// foundation/src/foundation.js

/**
 * CSS custom properties that sites can override in theme.yml
 */
export const vars = {
  'radius': {
    default: '0.5rem',
    description: 'Default border radius for cards and buttons',
  },
  'radius-lg': {
    default: '1rem',
    description: 'Large border radius for panels and modals',
  },
  'section-padding-y': {
    default: 'clamp(4rem, 6vw, 7rem)',
    description: 'Vertical padding for sections (fluid)',
  },
  'shadow': {
    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    description: 'Default shadow for cards and elevated elements',
  },
}
```

### Variable Schema

Each variable is an object with:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `default` | string | Yes | Default CSS value |
| `description` | string | No | What the variable controls |
| `label` | string | No | Display name in editor (falls back to humanized var name) |
| `type` | string | No | `'select'`, `'color'`, or default text input |
| `options` | array | When `type: 'select'` | Dropdown options |
| `group` | string | No | Visual grouping in editor (e.g. `'Layout'`, `'Visual'`) |
| `globalOnly` | boolean | No | If true, hidden from section-level panel |

When `label` is omitted, the editor generates one from the var name: `radius-lg` → "Radius Lg".

#### Type mapping

| Var type | Editor control | Context-aware? |
| -------- | -------------- | -------------- |
| (default) | Text input with default as placeholder | No |
| `select` | Dropdown with options | No |
| `color` | Color picker | Yes — stored per light/dark context |

Color-type vars are stored separately from non-color vars. The processor routes them to `colorVars` (per-context) rather than `foundationVars` (flat). This means color vars can have different values for light and dark schemes.

> **Foundation vars vs component vars:** Foundation vars are global — they emit on `:root` and apply site-wide. Component vars (declared in `meta.js`) are scoped to `#section-{id}`. See [Component Metadata](./component-metadata.md#vars) for component-level vars.

### Registering Defaults in `styles.css`

The `foundation.js` declaration is metadata — descriptions, types, and editor UI hints that end up in `schema.json`. To ensure the default values are present in the foundation's actual CSS output, register them in `styles.css` via `@theme inline`:

```css
/* foundation/src/styles.css */
@theme inline {
  --radius: 0.5rem;
  --radius-lg: 1rem;
  --section-padding-y: clamp(4rem, 6vw, 7rem);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

This is best practice for two reasons:

1. **Guarantees defaults are available.** The `@theme inline` block compiles into the foundation's CSS, which ships with `foundation.js`. The defaults are present regardless of whether the site's `theme.yml` sets them — important for runtime-loaded foundations where the site build doesn't have access to `schema.json`.

2. **Enables Tailwind shorthand.** With registration, you can use `py-(--section-padding-y)` instead of `py-[var(--section-padding-y)]`.

When a site overrides a variable in `theme.yml`, the site's theme CSS takes priority over the foundation defaults.

### Using Variables in Components

Components reference foundation vars via CSS or Tailwind:

```jsx
function Card({ children }) {
  return (
    <div className="rounded-(--radius) shadow-(--shadow) p-6">
      {children}
    </div>
  )
}
```

Or in CSS:

```css
section {
  padding: var(--section-padding-y) 0;
}
```

The same vars apply consistently across all components that use them. Changing `radius` in `theme.yml` updates every card, button, and panel at once.

### Site Overrides

Sites override variables in `theme.yml`:

```yaml
# site/theme.yml
vars:
  radius: 0.75rem
  radius-lg: 1.25rem
  section-padding-y: clamp(3rem, 5vw, 5rem)   # tighter spacing
```

The build generates theme CSS with the site's values. These override the foundation defaults (from `@theme inline` in `styles.css`) because the site's theme CSS loads with higher priority:

```css
/* Site theme CSS — overrides foundation @theme inline defaults */
:root {
  --radius: 0.75rem;
  --radius-lg: 1.25rem;
  --section-padding-y: clamp(3rem, 5vw, 5rem);
}
/* --shadow keeps its foundation default since the site didn't override it */
```

---

## Default Section Type

When a content section doesn't specify a `type:` in its frontmatter, the runtime needs to know which section type to use. By default it looks for a component called `Section`, but you can change this with `defaultSection`:

```js
// foundation/src/foundation.js
export default {
  defaultSection: 'FeatureGrid',
}
```

This is useful when your foundation has a general-purpose component that should handle untyped content. If not set, the fallback is `'Section'`.

---

## Custom Layout

Foundations can provide custom Layout components that control page structure. Layouts live in `src/layouts/` and are auto-discovered.

### Default Behavior

Without a custom Layout, the runtime uses a simple wrapper:

```jsx
// Default layout
function Layout({ body }) {
  return <>{body}</>
}
```

### Creating a Layout

Place layout components in `src/layouts/`:

```
foundation/src/layouts/
├── DocsLayout/
│   ├── index.jsx
│   └── meta.js        # Optional: declares areas, params
└── MarketingLayout.jsx # Bare file works too
```

Set the default in `foundation.js`:

```js
// foundation/src/foundation.js
export default {
  defaultLayout: 'DocsLayout',
}
```

```jsx
// foundation/src/layouts/DocsLayout/index.jsx
export default function DocsLayout({ header, footer, left, right, body }) {
  return (
    <div className="min-h-screen flex flex-col">
      {header && <header>{header}</header>}

      <div className="flex-1 flex">
        {left && (
          <aside className="w-64 border-r">
            {left}
          </aside>
        )}

        <main className="flex-1">
          {body}
        </main>

        {right && (
          <aside className="w-64 border-l">
            {right}
          </aside>
        )}
      </div>

      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

### Layout Props

| Prop | Type | Description |
|------|------|-------------|
| `header` | ReactNode | Rendered header area (or null) |
| `footer` | ReactNode | Rendered footer area (or null) |
| `left` | ReactNode | Rendered left area (or null) |
| `right` | ReactNode | Rendered right area (or null) |
| `body` | ReactNode | Page content sections |
| `params` | object | Layout parameters (merged with meta.js defaults) |
| `page` | Page | Current page instance |
| `website` | Website | Website instance |

Area names aren't fixed — foundations can declare any areas in `meta.js`. The props above are the conventional names. See [Custom Layouts](../development/custom-layouts.md#general-named-areas) for details.

### Layout meta.js

Layouts can optionally declare which areas they use and what parameters they accept:

```js
// foundation/src/layouts/DocsLayout/meta.js
export default {
  title: 'Documentation',
  description: 'Three-column layout with sidebar navigation',
  areas: ['header', 'footer', 'left', 'right'],
  params: {
    sidebarWidth: {
      type: 'select',
      options: ['narrow', 'wide'],
      default: 'narrow',
    },
  },
}
```

### Per-Page Layout Selection

Pages select a layout and configure it in `page.yml`:

```yaml
layout: MarketingLayout

# Or with options:
layout:
  name: MarketingLayout
  hide: [left, right]
  params:
    sidebarWidth: wide
```

The `hide` array suppresses specific areas on that page. Hidden areas are passed as null to the Layout component — check props directly:

```jsx
export default function DocsLayout({ header, footer, left, right, body }) {
  return (
    <div className="min-h-screen flex flex-col">
      {header && <header>{header}</header>}

      <div className="flex-1 flex">
        {left && <aside className="w-64">{left}</aside>}
        <main className="flex-1">{body}</main>
        {right && <aside className="w-64">{right}</aside>}
      </div>

      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

---

## Common Variable Patterns

### Spacing System

```js
export const vars = {
  'spacing-xs': { default: '0.25rem', description: 'Extra small spacing' },
  'spacing-sm': { default: '0.5rem', description: 'Small spacing' },
  'spacing-md': { default: '1rem', description: 'Medium spacing' },
  'spacing-lg': { default: '2rem', description: 'Large spacing' },
  'spacing-xl': { default: '4rem', description: 'Extra large spacing' },
}
```

### Visual Style

```js
export const vars = {
  'border-radius-sm': { default: '0.25rem', description: 'Small radius' },
  'border-radius': { default: '0.5rem', description: 'Default radius' },
  'border-radius-lg': { default: '1rem', description: 'Large radius' },
  'shadow-sm': { default: '0 1px 2px rgba(0,0,0,0.05)', description: 'Small shadow' },
  'shadow': { default: '0 4px 6px rgba(0,0,0,0.1)', description: 'Default shadow' },
}
```

### Animation

```js
export const vars = {
  'transition-fast': { default: '150ms', description: 'Fast transitions' },
  'transition-normal': { default: '300ms', description: 'Normal transitions' },
  'transition-slow': { default: '500ms', description: 'Slow transitions' },
}
```

---

## Complete Example

```js
// foundation/src/foundation.js

/**
 * Cross-cutting design tokens that sites can override in theme.yml.
 * Values that belong to a specific component (header height, sidebar width)
 * should be params in that component's meta.js instead.
 */
export const vars = {
  // Spacing
  'section-padding-y': {
    default: 'clamp(4rem, 6vw, 7rem)',
    description: 'Vertical padding for sections (fluid)',
  },
  'container-padding-x': {
    default: '1.5rem',
    description: 'Horizontal padding for containers',
  },

  // Visual
  'radius': {
    default: '0.5rem',
    description: 'Default border radius for cards and buttons',
  },
  'radius-lg': {
    default: '1rem',
    description: 'Large border radius for panels and modals',
  },
  'shadow': {
    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    description: 'Default shadow for elevated elements',
  },
}

export default {
  defaultLayout: 'docs',
}
```

Layout dimensions like header height and sidebar width are layout params, not foundation vars — the layout component owns them:

```js
// foundation/src/layouts/docs/meta.js
export default {
  params: {
    headerHeight: { type: 'text', default: '4rem' },
    sidebarWidth: { type: 'text', default: '16rem' },
    maxContentWidth: { type: 'text', default: '80rem' },
  },
}
```

```jsx
// foundation/src/layouts/docs/index.jsx
export default function DocsLayout({ header, footer, left, right, body, params }) {
  // No need for fallback values — meta.js defaults are merged into params
  // before the layout component receives them.
  const { headerHeight, sidebarWidth, maxContentWidth } = params

  return (
    <div className="min-h-screen flex flex-col bg-section">
      {header && (
        <div className="sticky top-0 z-50" style={{ height: headerHeight }}>
          {header}
        </div>
      )}

      <div className="flex-1 flex mx-auto w-full" style={{ maxWidth: maxContentWidth }}>
        {left && (
          <aside className="shrink-0 border-r hidden lg:block" style={{ width: sidebarWidth }}>
            <div className="sticky overflow-y-auto" style={{ top: headerHeight, maxHeight: `calc(100vh - ${headerHeight})` }}>
              {left}
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {body}
        </main>

        {right && (
          <aside className="shrink-0 border-l hidden xl:block" style={{ width: sidebarWidth }}>
            <div className="sticky overflow-y-auto" style={{ top: headerHeight, maxHeight: `calc(100vh - ${headerHeight})` }}>
              {right}
            </div>
          </aside>
        )}
      </div>

      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

---

## Runtime Access

Access foundation variables from components:

```jsx
import { useThemeData } from '@uniweb/kit'

function Component() {
  const theme = useThemeData()

  // Get a foundation variable value
  const radius = theme?.getFoundationVar('radius')

  return <div style={{ borderRadius: radius }}>...</div>
}
```

---

## Best Practices

1. **Use semantic names**: `radius` not `r1` or `size-8`

2. **Only use vars for cross-cutting values**: A header height belongs to the layout component as a param. A border radius used by cards, buttons, and modals belongs as a foundation var. The test: would changing this value need to affect multiple unrelated components simultaneously?

3. **Provide good defaults**: Defaults should work out of the box

4. **Document with descriptions**: The `description` field helps site authors in the visual editor

5. **Register in `styles.css`**: Declare vars in both `foundation.js` (metadata) and `styles.css` via `@theme inline` (actual CSS)

6. **Consider dark mode**: Vars referencing colors should use theme tokens

7. **Test overrides**: Verify vars work when sites customize them in `theme.yml`

---

## Icon Libraries

Foundations can include icon libraries to enable named icon syntax in content. This allows content authors to use icons without managing SVG files.

### Why Include an Icon Library?

Without an icon library, content authors must:
- Provide SVG files for every icon
- Reference icons by file path: `![check](/icons/check.svg){role=icon}`

With an icon library installed, authors can write:
- `![check](lucide:check)` — Named icon from library
- `![arrow](lucide:arrow-right){size=20 color=blue}` — With size and color

### Installing an Icon Library

**1. Add the package:**

```bash
cd foundation
pnpm add lucide-react
```

**2. Create an icon wrapper component:**

```jsx
// foundation/src/components/Icon/index.jsx
import * as LucideIcons from 'lucide-react'

export function Icon({ name, library, size = 24, color, className }) {
  // For lucide library
  if (library === 'lucide' && name) {
    // Convert kebab-case to PascalCase: "arrow-right" → "ArrowRight"
    const pascalName = name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')

    const LucideIcon = LucideIcons[pascalName]
    if (LucideIcon) {
      return <LucideIcon size={size} color={color} className={className} />
    }
  }

  // Fallback: render nothing or a placeholder
  return null
}
```

**3. Use in your render component:**

The `@uniweb/kit` Render component handles named icons automatically when your foundation provides an Icon component. If you're using a custom renderer, check for the `library` and `name` attributes:

```jsx
// In your custom renderer
if (node.attrs?.role === 'icon' && node.attrs?.library) {
  const { library, name, size, color } = node.attrs
  return <Icon library={library} name={name} size={size} color={color} />
}
```

### Supported Libraries

The content parser recognizes these icon library prefixes:

| Prefix | Package | Install Command |
|--------|---------|-----------------|
| `lucide:` | lucide-react | `pnpm add lucide-react` |
| `heroicons:` | @heroicons/react | `pnpm add @heroicons/react` |
| `phosphor:` | @phosphor-icons/react | `pnpm add @phosphor-icons/react` |
| `tabler:` | @tabler/icons-react | `pnpm add @tabler/icons-react` |
| `feather:` | react-feather | `pnpm add react-feather` |

### Example: Multi-Library Support

```jsx
// foundation/src/components/Icon/index.jsx
import * as LucideIcons from 'lucide-react'
import * as HeroIcons from '@heroicons/react/24/outline'

function toPascalCase(str) {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function Icon({ name, library, size = 24, color, className }) {
  if (!name) return null

  const pascalName = toPascalCase(name)

  // Lucide icons
  if (library === 'lucide') {
    const IconComponent = LucideIcons[pascalName]
    if (IconComponent) {
      return <IconComponent size={size} color={color} className={className} />
    }
  }

  // Heroicons
  if (library === 'heroicons') {
    const IconComponent = HeroIcons[`${pascalName}Icon`]
    if (IconComponent) {
      return <IconComponent width={size} height={size} color={color} className={className} />
    }
  }

  console.warn(`[Icon] Unknown icon: ${library}:${name}`)
  return null
}
```

### Bundle Size Considerations

Icon libraries can be large. Consider these strategies:

**1. Tree-shaking (recommended):**

Most bundlers (Vite, webpack) tree-shake unused icons automatically when you import from the main package.

**2. Individual imports:**

Some libraries support individual imports for smaller bundles:

```jsx
import { Check, ArrowRight, Heart } from 'lucide-react'

const iconMap = { check: Check, 'arrow-right': ArrowRight, heart: Heart }

export function Icon({ name, size, color }) {
  const IconComponent = iconMap[name]
  return IconComponent ? <IconComponent size={size} color={color} /> : null
}
```

This limits which icons are available but produces smaller bundles.

**3. URL-based fallback:**

If named icons aren't found, fall back to URL-based icons:

```jsx
export function Icon({ name, library, url, size = 24, color }) {
  // Try named icon first
  if (library && name) {
    const IconComponent = resolveNamedIcon(library, name)
    if (IconComponent) {
      return <IconComponent size={size} color={color} />
    }
  }

  // Fall back to URL-based icon
  if (url) {
    return <img src={url} width={size} height={size} alt="" />
  }

  return null
}
```

### Content Author Usage

Once your foundation includes an icon library, content authors can use named icons:

```markdown
<!-- In section content -->
![](lucide:check) Feature included
![](lucide:x) Feature not included

<!-- With attributes -->
![success](lucide:check-circle){size=32 color=green}

<!-- In a button -->
[Get Started](lucide:arrow-right) [Get Started](/signup){icon=arrow-right}
```

---

## See Also

- [Site Theming](./site-theming.md) — Site-level theme customization
- [Layout Areas](./layout-areas.md) — Header, footer, and sidebar areas
- [Component Metadata](./component-metadata.md) — Component meta.js schema
- [Kit Reference](./kit-reference.md) — Accessing theme data in components
