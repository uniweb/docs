# Custom Layouts

The Layout component is the frame around your content. It controls where the header sits, whether there's a sidebar, how the footer is placed, and how all of that adapts on mobile. Every page on every site renders through a Layout — the only question is whether you use the runtime's default or provide your own.

Most foundations don't need a custom Layout. The default renders header, body, and footer in sequence with semantic HTML wrappers, and that covers marketing sites, landing pages, and blogs. You need a custom Layout when the *arrangement* of areas matters — sidebars, sticky headers, mobile drawers, content that's narrower when there's no right panel.

The docs template ships with a custom Layout that handles all of these. We'll use it as the worked example throughout this guide.

---

## What the Runtime Gives You

When the runtime renders a page, it pre-renders each layout area into React elements and passes them to your Layout as props:

```jsx
// packages/runtime/src/components/Layout.jsx (simplified)
function DefaultLayout({ header, body, footer }) {
  return (
    <>
      {header && <header>{header}</header>}
      {body && <main>{body}</main>}
      {footer && <footer>{footer}</footer>}
    </>
  )
}
```

| Prop | Source | What it contains |
|------|--------|-----------------|
| `header` | `layout/header/` folder | Pre-rendered React elements (or null) |
| `body` | Page content files | Pre-rendered React elements (or null) |
| `footer` | `layout/footer/` folder | Pre-rendered React elements (or null) |
| `left` | `layout/left/` folder | Pre-rendered React elements (or null) |
| `right` | `layout/right/` folder | Pre-rendered React elements (or null) |
| `params` | page.yml `layout.params` + meta.js defaults | Merged layout parameters |
| `page` | Runtime | Current Page instance |
| `website` | Runtime | Website instance |

Area names aren't limited to `header`, `footer`, `left`, `right` — those are conventions. A layout can declare any area names it wants (see [Named Layouts](#named-layouts) below). The runtime passes each area as a prop with the matching name.

The key insight: by the time your Layout receives these props, the sections are already rendered. Your Layout doesn't render content — it *arranges* content. The `header` prop isn't a list of blocks you need to loop through; it's a finished React element tree you place where you want it.

---

## Layout Areas Are Like Pages

Each layout folder can contain multiple sections, just like a regular page folder:

```
site/
├── layout/
│   ├── header/
│   │   ├── page.yml
│   │   ├── 1-topbar.md        ← Announcement bar
│   │   └── 2-navbar.md         ← Main navigation
│   ├── footer/
│   │   ├── page.yml
│   │   ├── 1-footer.md         ← Footer links
│   │   └── 2-copyright.md      ← Copyright bar
│   └── left/
│       ├── page.yml
│       └── sidebar-nav.md      ← Sidebar navigation
├── pages/
│   └── home/
│       ├── page.yml
│       └── hero.md
```

The runtime renders all sections in `layout/header/` into a single React element and passes that as the `header` prop. Your Layout wraps that element in a `<header>` tag — that's where the semantic HTML comes from. Section components themselves render `<div>`s. They don't know whether they'll end up in a header, sidebar, or main content area.

```
┌─────────────────────────────────────┐
│           header                    │
├──────────┬─────────────┬────────────┤
│          │             │            │
│  left    │   Page      │  right     │
│          │   Content   │            │
│          │             │            │
├──────────┴─────────────┴────────────┤
│           footer                    │
└─────────────────────────────────────┘
```

---

## When You Need a Custom Layout

| Use case | Custom Layout? | Why |
|----------|---------------|-----|
| Marketing site (header, sections, footer) | No | Default handles this |
| Blog with sidebar | Maybe | Only if sidebar needs sticky positioning or responsive behavior |
| Documentation with navigation sidebar | Yes | Sticky sidebar, mobile drawer, conditional widths |
| Dashboard with persistent left panel | Yes | Panel positioning, responsive collapse |
| Site where footer is inside the content area | Yes | Default puts footer after main, not inside it |
| Different header height per page | No | Use CSS variables and page-specific classes |

The general rule: if header → body → footer in a single column is enough, you don't need one. If you need areas side-by-side, sticky, or conditionally visible based on viewport — you do.

---

## Building a Custom Layout

### Where Layouts Live

Layouts are discovered from `src/layouts/`, parallel to `src/sections/` and `src/components/`:

```
foundation/src/
├── sections/          # Section types
├── components/        # Internal components
├── layouts/           # Layout components
│   └── DocsLayout/
│       ├── index.jsx  # Layout component
│       └── meta.js    # Optional: declares areas, params
└── foundation.js      # Set defaultLayout here
```

Discovery follows the same relaxed rules as `src/sections/` — root-level files and folders are addressable by default, even without `meta.js`. A bare file like `MarketingLayout.jsx` works too.

### The Minimum

A custom Layout equivalent to the default:

```jsx
// foundation/src/layouts/SimpleLayout/index.jsx
export default function SimpleLayout({ header, body, footer }) {
  return (
    <div className="min-h-screen flex flex-col">
      {header && <header>{header}</header>}

      <main className="flex-1">
        {body}
      </main>

      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

This is already more than the default — it uses a flex column for full-height pages. From here, you add what your design needs.

### Setting the Default Layout

Tell the framework which layout to use by default:

```js
// foundation/src/foundation.js
export default {
  defaultLayout: 'DocsLayout',
}
```

Pages can override this in `page.yml`:

```yaml
layout: MarketingLayout
# or with options:
layout:
  name: MarketingLayout
  hide: [left, right]
```

### Hiding Areas Per Page

Pages can hide specific areas:

```yaml
# site/pages/landing/page.yml
title: Landing Page
layout:
  hide: [header, footer]
```

The runtime skips creating blocks for hidden areas. Your Layout simply won't receive those props (they'll be null). This replaces the old `page.hasHeader()` / `page.hasFooter()` checks — areas are either present or null.

```jsx
export default function DocsLayout({ header, body, footer, left, right }) {
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

Check the prop directly (`{left && ...}`) — if the area has content and isn't hidden, the prop is a React element. Otherwise it's null.

---

## A Real Layout: Documentation Sidebar

The docs template Layout handles sticky header, responsive sidebars, a mobile drawer, and conditional content width. Here's how it's built.

### The Structure

```jsx
// foundation/src/layouts/DocsLayout/index.jsx
export default function DocsLayout({
  page, website, header, body, footer, left, right,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on page navigation
  const activeRoute = page?.route
  useEffect(() => {
    setSidebarOpen(false)
  }, [activeRoute])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 w-full border-b border-gray-200
        bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        {header}
      </header>

      {/* Mobile Sidebar (see next section) */}
      {left && (
        <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          {left}
        </MobileSidebar>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
        <div className="flex">
          {/* Left Sidebar - Desktop */}
          {left && (
            <aside className="hidden md:block sticky top-16 w-64
              flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-r">
              {left}
            </aside>
          )}

          {/* Center Content */}
          <main className="flex-1 min-w-0">
            <div className={cn(
              'px-4 py-8 sm:px-6 lg:px-8',
              !right && 'max-w-3xl mx-auto'
            )}>
              <div className="prose prose-slate max-w-none">
                {body}
              </div>

              {/* Footer inside main (design choice — see below) */}
              {footer && (
                <footer className="mt-12 pt-8 border-t">
                  {footer}
                </footer>
              )}
            </div>
          </main>

          {/* Right Sidebar - Desktop */}
          {right && (
            <aside className="hidden xl:block sticky top-16 w-64
              flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-l">
              {right}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      {left && (
        <MenuButton onClick={() => setSidebarOpen(true)} />
      )}
    </div>
  )
}
```

A few things to notice:

- The header is sticky with `backdrop-blur` for a translucent effect
- Sidebars use `sticky top-16` — they stick below the header (4rem = 16 in Tailwind's spacing)
- `min-w-0` on main prevents flex children from overflowing
- The whole thing is wrapped in `flex flex-col` with `min-h-screen` so the page always fills the viewport

### Mobile Sidebar Drawer

The mobile sidebar is a separate component with a backdrop, slide animation, and scroll lock:

```jsx
function MobileSidebar({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose} />
      )}
      {/* Drawer */}
      <div className={cn(
        'md:hidden fixed top-16 left-0 w-72 h-[calc(100vh-4rem)] bg-white z-50',
        'transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-md"
          aria-label="Close sidebar">
          {/* close icon SVG */}
        </button>
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
```

The drawer is positioned at `top-16` so it sits below the header. It renders the same `left` prop that the desktop sidebar gets — same React element, two placements. On `md:` and wider, the drawer is hidden and the static sidebar takes over.

### Footer Inside Main

In the docs template, the footer sits *inside* the main content area, below the body. This is a deliberate design choice — documentation footers typically show prev/next navigation, which belongs with the content rather than spanning the full page width.

A marketing site would do the opposite: place the footer outside and below the flex container so it spans the full width. There's no right answer — the Layout lets you make this choice.

### Conditional Width

When there's no right sidebar, the content area constrains itself:

```jsx
<div className={cn(
  'px-4 py-8 sm:px-6 lg:px-8',
  !right && 'max-w-3xl mx-auto'
)}>
```

Without this, documentation text would stretch to fill the space where the right sidebar would be. Constraining to `max-w-3xl` keeps prose readable. When the right sidebar is present, the content naturally fills the remaining space between the two sidebars.

---

## Named Layouts

When a foundation needs multiple page structures — a docs layout with sidebars, a marketing layout without, a dashboard layout with a toolbar — each is a separate layout component:

```
foundation/src/layouts/
├── DocsLayout/
│   ├── index.jsx
│   └── meta.js
├── MarketingLayout/
│   └── index.jsx
└── DashboardLayout/
    ├── index.jsx
    └── meta.js
```

Pages select their layout by name:

```yaml
# page.yml
layout: MarketingLayout
```

The foundation sets a default in `foundation.js`:

```js
export default {
  defaultLayout: 'DocsLayout',
}
```

Pages without an explicit `layout:` use the default. The layout name matches the directory name — `DocsLayout/` is referenced as `DocsLayout`.

### Layout meta.js

Layouts can declare metadata — which areas they render, parameters they accept, and (future) view transition participation:

```js
// src/layouts/DocsLayout/meta.js
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

The `areas` array tells the content-collector which layout section files to expect. The `params` work like section type params — defaults are merged with values from `page.yml`.

#### Scroll management

By default, the runtime manages scroll restoration on `window` — saving position per history entry and restoring on back/forward navigation. Layouts can override this with the `scroll` property in meta.js:

```js
// src/layouts/DashboardLayout/meta.js
export default {
  areas: ['header', 'sidebar'],

  // Layout manages its own scrolling (runtime disables scroll management)
  scroll: 'self',
}
```

```js
// src/layouts/DocsLayout/meta.js
export default {
  areas: ['header', 'footer', 'left'],

  // Runtime manages scroll on the <main> element instead of window
  scroll: 'main',
}
```

| Value | Behavior |
|-------|----------|
| Not set | Runtime manages scroll on `window` (default) |
| `'self'` | Layout handles its own scrolling; runtime disables |
| CSS selector (e.g. `'main'`) | Runtime manages scroll on that element |

This follows the same pattern as `background: 'self'` in section types — the layout tells the runtime "I handle this myself."

A foundation-level default can be set in `foundation.js` for all layouts that don't declare their own:

```js
// foundation.js
export default {
  defaultLayout: 'DocsLayout',
  scroll: 'self',
}
```

```yaml
# page.yml — setting layout params
layout:
  name: DocsLayout
  params:
    sidebarWidth: wide
```

The Layout component receives `params` as a prop:

```jsx
function DocsLayout({ body, header, footer, left, right, params }) {
  const sidebarClass = params.sidebarWidth === 'wide' ? 'w-80' : 'w-64'
  // ...
}
```

### General Named Areas

Area names aren't restricted to `header`, `footer`, `left`, `right`. A layout can declare any areas:

```js
// src/layouts/DashboardLayout/meta.js
export default {
  title: 'Dashboard',
  areas: ['topbar', 'sidebar', 'statusbar'],
}
```

The site provides content with matching filenames:

```
layout/dashboard/
├── topbar.md
├── sidebar.md
└── statusbar.md
```

The Layout receives each area as a prop:

```jsx
function DashboardLayout({ topbar, sidebar, body, statusbar }) {
  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto]">
      <div className="col-span-2">{topbar}</div>
      <aside className="w-64">{sidebar}</aside>
      <main>{body}</main>
      {statusbar && <div className="col-span-2">{statusbar}</div>}
    </div>
  )
}
```

`body` is the only special name — it's the page's own sections, always passed to every layout. It doesn't appear in `areas`.

### Named Layout Content

When a site uses named layouts, each layout's area content lives in a subdirectory of `layout/`:

```
site/layout/
├── header.md            ← default layout areas (bare files)
├── footer.md
├── left.md
├── marketing/           ← named layout areas
│   ├── header.md
│   └── footer.md
└── dashboard/           ← named layout areas
    ├── topbar.md
    ├── sidebar.md
    └── statusbar.md
```

The directory name is the layout name, lowercased. If the layout name is `MarketingLayout`, the content directory is `layout/marketing/` (the framework matches case-insensitively and strips the `Layout` suffix).

---

## Semantic HTML

The Layout is responsible for wrapping areas in semantic HTML elements. This is a convention, not a technical requirement — but it matters for accessibility and SEO.

| Area | Semantic wrapper | Why |
|------|-----------------|-----|
| Header sections | `<header>` | Landmark for screen readers, contains site navigation |
| Body sections | `<main>` | The primary content of the page |
| Footer sections | `<footer>` | Site-wide footer information |
| Sidebars | `<aside>` | Complementary content (navigation, table of contents) |

Section components render `<div>`s. They don't add `<header>` or `<main>` wrappers because they don't know where they'll be placed. A navigation component might end up in the header, a sidebar, or the main content area — the Layout decides placement, so the Layout provides the semantic wrappers.

---

## Tips

- **Start without a custom Layout.** The default covers most cases. Add one when you have a specific arrangement need, not preemptively.

- **Keep layout logic in Layout, rendering logic in components.** The Layout controls *where* things go. Components control *what* things look like. If you're styling content inside the Layout, it probably belongs in a component or in CSS.

- **Use CSS variables for dimensions.** Declare `header-height` and `sidebar-width` in `foundation.js` so sites can tune them. Then reference `var(--header-height)` in your Layout. The docs template does this — sticky positioning, sidebar heights, and mobile drawer offsets all reference the same variable.

- **Close mobile drawers on route change.** SPA navigation doesn't trigger a page reload, so drawers stay open unless you close them explicitly. The docs template watches `page.route` in a `useEffect`.

- **Test with and without areas.** Some pages may not have `layout/left/` or `layout/right/` content. Your Layout should handle null gracefully — check before rendering, and consider adjusting the main content width when areas are absent.

---

## See Also

- [Foundation Configuration](../reference/foundation-config.md) — CSS variables, layout defaults, complete reference
- [Layout Areas](../reference/layout-areas.md) — How layout area folders work
- [CCA Component Patterns](./component-patterns.md) — Section type organization and common patterns
