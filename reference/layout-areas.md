# Layout Areas

Layout areas render on every page. They provide site-wide navigation, branding, and persistent UI elements like sidebars.

## Overview

Layout areas live in the `layout/` directory, parallel to `pages/`:

```
site/
├── layout/
│   ├── header/               # Renders at top of every page
│   │   └── header.md
│   ├── footer/               # Renders at bottom of every page
│   │   └── footer.md
│   ├── left/                 # Left sidebar (if layout supports)
│   │   └── sidebar.md
│   └── right/                # Right sidebar (if layout supports)
│       └── sidebar.md
├── pages/
│   └── home/                 # Regular page
│       └── hero.md
```

Unlike regular pages, layout areas:
- Don't create navigable routes
- Render on all pages automatically
- Can be hidden per-page via `layout.hide`

The conventional area names are `header`, `footer`, `left`, and `right`. These are promoted by templates and documentation, but foundations can define any area names they need — `topbar`, `sidebar`, `statusbar`, or anything else. See [Custom Layouts](../development/custom-layouts.md#general-named-areas) for details.

---

## How They Work

### Rendering Order

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

The foundation's Layout component controls where areas appear:

```jsx
// src/layouts/DocsLayout/index.jsx
export default function DocsLayout({ header, footer, left, right, body }) {
  return (
    <div className="layout">
      {header}
      <div className="main">
        {left && <aside className="left">{left}</aside>}
        <main>{body}</main>
        {right && <aside className="right">{right}</aside>}
      </div>
      {footer}
    </div>
  )
}
```

### Content Flow

1. Site build collects layout areas from `layout/`
2. Runtime loads them alongside the active page
3. Foundation Layout receives them as props
4. Each page's `layout.hide` controls which areas are suppressed

---

## Area Content

### header

Renders at the top of every page, typically containing:
- Logo and site name
- Main navigation
- Search button
- Language switcher
- Dark mode toggle

```markdown
<!-- layout/header/header.md -->
---
type: Header
sticky: true
---

![Logo](/logo.svg){role=icon}

- [Home](/)
- [Products](/products)
- [About](/about)
- [Contact](/contact)
```

### footer

Renders at the bottom of every page, typically containing:
- Site links organized by category
- Legal links (privacy, terms)
- Social media links
- Copyright notice

```markdown
<!-- layout/footer/footer.md -->
---
type: Footer
---

## Company

- [About](/about)
- [Careers](/careers)
- [Contact](/contact)

## Legal

- [Privacy](/privacy)
- [Terms](/terms)

---

© 2025 Acme Corp. All rights reserved.
```

### left / right

Side areas for documentation sites, dashboards, or complex layouts:

```markdown
<!-- layout/left/sidebar.md -->
---
type: Sidebar
---

```yaml:nav
- label: Getting Started
  children:
    - label: Installation
      href: /docs/install
    - label: Quick Start
      href: /docs/quickstart
- label: Guides
  children:
    - label: Components
      href: /docs/components
```
```

---

## Multiple Sections

Area folders can contain multiple `.md` files:

```
layout/header/
├── 1-topbar.md       # Announcement bar
└── 2-navbar.md       # Main navigation
```

Both render in order, giving you flexibility for complex headers:

```jsx
// 1-topbar.md
---
type: TopBar
---
New feature released! [Learn more](/blog/new-feature)

// 2-navbar.md
---
type: Navbar
sticky: true
---
<!-- Main navigation -->
```

---

## Per-Page Layout Control

Pages can hide areas via `layout.hide` in `page.yml`:

```yaml
# pages/landing/page.yml
title: Landing Page
layout:
  hide: [header, footer]
```

This is useful for:
- Full-screen landing pages
- Print layouts
- Embedded content
- Admin interfaces

You can also select a different layout and hide specific areas:

```yaml
# pages/reference/page.yml
title: Quick Reference
layout:
  name: DocsLayout
  hide: [left, right]
```

---

## Named Layout Areas

When a foundation provides multiple layouts, each layout's area content lives in a subdirectory of `layout/`:

```
site/layout/
├── header.md            ← default layout areas
├── footer.md
├── left.md
├── marketing/           ← areas for MarketingLayout
│   ├── header.md
│   └── footer.md
└── dashboard/           ← areas for DashboardLayout
    ├── topbar.md
    ├── sidebar.md
    └── statusbar.md
```

The directory name matches the layout name (case-insensitive, `Layout` suffix stripped). See [Custom Layouts](../development/custom-layouts.md#named-layouts) for the full guide.

---

## Navigation Visibility

Layout areas often build navigation from the page hierarchy. Pages can opt out of nav
while staying reachable:

```yaml
# pages/admin/page.yml
title: Admin Dashboard
hideIn: ['*']          # Reachable by URL, but shown in no nav menu
```

```yaml
# pages/legal/page.yml
title: Privacy Policy
hideIn: [header]       # Hide from the header nav (still shown in footer)
```

> `hideIn` is nav-only — the page stays published and routed. To exclude a page (and its
> subtree) from the published site entirely — e.g. a draft — use `hidden: true` instead.

See [Page Configuration](./page-configuration.md) for all visibility options.

---

## Component Patterns

### Header with Automatic Navigation

```jsx
// src/sections/Header/index.jsx
import { useWebsite } from '@uniweb/kit'

export default function Header({ content }) {
  const { website } = useWebsite()

  // Manual nav from content (if provided)
  const manualNav = content.data?.nav

  // Automatic nav from page structure
  const autoNav = website.getPageHierarchy({ for: 'header' })

  const navItems = manualNav || autoNav.map(p => ({
    label: p.label || p.title,
    href: p.route,
    children: p.children?.map(c => ({
      label: c.label || c.title,
      href: c.route
    }))
  }))

  return (
    <header>
      <nav>
        {navItems.map(item => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>
    </header>
  )
}
```

### Footer with Locale Switcher

```jsx
// src/sections/Footer/index.jsx
import { useWebsite, Link, getLocaleLabel } from '@uniweb/kit'

export default function Footer({ content }) {
  const { website } = useWebsite()

  return (
    <footer>
      {/* Footer content */}

      {website.hasMultipleLocales() && (
        <div className="locale-switcher">
          {website.getLocales().map(locale => (
            // `reload` is required: getLocaleUrl() omits the deployment base
            // path, and switching language needs a full page load.
            <Link
              reload
              key={locale.code}
              href={website.getLocaleUrl(locale.code)}
              className={locale.code === website.getActiveLocale() ? 'active' : ''}
            >
              {getLocaleLabel(locale)}
            </Link>
          ))}
        </div>
      )}

      <p>{content.paragraphs[0]}</p>
    </footer>
  )
}
```

### Sidebar with Version Awareness

```jsx
// src/sections/Sidebar/index.jsx
import { useVersion } from '@uniweb/kit'

export default function Sidebar({ content }) {
  const { isVersioned, currentVersion, isDeprecatedVersion } = useVersion()

  return (
    <aside>
      {isVersioned && (
        <div className="version-badge">
          {currentVersion?.label}
          {isDeprecatedVersion && <span className="deprecated">Legacy</span>}
        </div>
      )}

      <nav>
        {/* Sidebar navigation */}
      </nav>
    </aside>
  )
}
```

---

## Sticky Headers

For headers that stick to the top while scrolling:

```markdown
---
type: Header
sticky: true
---
```

The foundation component handles the sticky behavior:

```jsx
export default function Header({ content, params }) {
  const { sticky = false } = params

  return (
    <header className={sticky ? 'sticky top-0 z-50' : ''}>
      {/* header content */}
    </header>
  )
}
```

And define the param in meta.js:

```js
export default {
  title: 'Header',
  params: {
    sticky: {
      type: 'boolean',
      label: 'Sticky Header',
      default: false
    }
  }
}
```

---

## Best Practices

1. **Keep content minimal**: Layout areas render on every page — keep them lightweight

2. **Support both modes**: Allow both automatic (from page hierarchy) and manual (from content) navigation

3. **Handle empty states**: Layout areas might not exist in all sites — check props before rendering

4. **Consider mobile**: Layout areas often need responsive behavior (hamburger menus, collapsible sidebars)

5. **Version awareness**: In docs sites, show version context in headers/sidebars

---

## See Also

- [Page Configuration](./page-configuration.md) — Layout hide options
- [Navigation Patterns](./navigation-patterns.md) — Building menus and navigation
- [Custom Layouts](../development/custom-layouts.md) — Building custom Layout components
- [Kit Reference](./kit-reference.md) — Hooks for accessing page/website data
