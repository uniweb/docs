# Quickstart

Create your first Uniweb site in 5 minutes.

## Prerequisites

- **Node.js 20.19** or later
- **pnpm 9+** (recommended) or npm 10+

```bash
# Install pnpm if you don't have it
npm install -g pnpm
```

## Create a Project

```bash
pnpm create uniweb my-site --template marketing
cd my-site
pnpm install
```

This creates a workspace with:

```
my-site/
├── foundation/          # Your React components
│   └── src/sections/
├── site/                # Your content
│   ├── pages/
│   └── site.yml
└── pnpm-workspace.yaml
```

## Start Development

```bash
pnpm dev
```

Open http://localhost:5173. You'll see a working marketing site with Hero, Features, Pricing, and more.

## How It Works

Open `site/pages/home/hero.md`:

```markdown
---
type: Hero
theme: dark
---

# Build Something Great

Create stunning websites with components and markdown.

[Get Started](/docs)
[Learn More](/about)
```

This content renders through the `Hero` component in `foundation/src/sections/Hero/`.

**The pattern:**
- `type: Hero` — Which component renders this section
- `theme: dark` — Configuration passed to the component
- The markdown body — Content the component receives

## Edit Content

Change the headline in `hero.md`:

```markdown
# Your New Headline Here
```

Save. The page updates instantly.

## Edit a Component

Open `foundation/src/sections/Hero.jsx` (or `Hero/Hero.jsx` if the template uses a folder). The component receives:

```jsx
export default function Hero({ content, params }) {
  // content.title = "Your New Headline Here"
  // content.paragraphs = ["Create stunning websites..."]
  // content.links = [{ href: "/docs", label: "Get Started" }, ...]
  // params.theme = "dark"
}
```

Make a change—add a class, tweak the layout. Save. It updates.

## Add a Page

Create a new page folder:

```bash
mkdir -p site/pages/contact
```

Create `site/pages/contact/page.yml`:

```yaml
title: Contact Us
description: Get in touch
```

Create `site/pages/contact/hero.md`:

```markdown
---
type: Hero
theme: light
---

# Contact Us

We'd love to hear from you.

[Email Us](mailto:hello@example.com)
```

Visit http://localhost:5173/contact. Your new page is live.

## Add a Section

Add another section to the contact page. Create `site/pages/contact/2-info.md` (the numeric prefix controls ordering when a page has multiple sections):

```markdown
---
type: Article
---

## Our Office

We're located in downtown San Francisco. Drop by Monday through Friday, 9am to 5pm.

[Get Directions](https://maps.google.com)
```

When a page has multiple sections, they render in order by their numeric prefix (`1-`, `2-`, etc.). Single-section pages don't need a prefix — `hero.md` works fine on its own. You can rename the first section to `1-hero.md` later if you add more.

## Understand the Content Flow

```
Markdown (what you write)
    │
    ▼
┌───────────────────────────┐
│  ---                      │
│  type: Hero               │  ← Which component
│  theme: dark              │  ← Configuration (params)
│  ---                      │
│                           │
│  # Headline               │  ← content.title
│                           │
│  Description paragraph.   │  ← content.paragraphs[0]
│                           │
│  [Button](/path)          │  ← content.links[0]
└───────────────────────────┘
    │
    ▼
Component receives { content, params }
    │
    ▼
React renders the UI
```

Components don't fetch or parse. They receive structured data and render.

## Build for Production

```bash
pnpm build
```

This builds:
1. The foundation → `foundation/dist/`
2. The site → `site/dist/`

With pre-rendering enabled (`build.prerender: true` in `site.yml`), you get static HTML:

```
site/dist/
├── index.html
├── about.html
├── contact.html
└── assets/
```

## Deploy

The `site/dist/` folder is a static site. Deploy anywhere:

**Vercel:**
```bash
cd site && vercel
```

**Netlify:**
```bash
cd site && netlify deploy --prod --dir=dist
```

**Any static host:**
Upload the contents of `site/dist/`.

---

## Next Steps

| Want to... | Read |
|------------|------|
| Understand content structure | [Content Structure](../reference/content-structure) |
| Create custom components | [Component Metadata](../reference/component-metadata) |
| Configure your site | [Site Configuration](../reference/site-configuration) |
| Add multiple languages | [Internationalization](../development/internationalization) |
| Load external data | [Data Fetching](../reference/data-fetching) |
| Generate pages from data | [Dynamic Routes](../reference/dynamic-routes) |

## Common Templates

```bash
# Starter (default) — foundation + site + sample content
pnpm create uniweb my-project

# Documentation site
pnpm create uniweb docs-site --template docs

# Marketing site
pnpm create uniweb landing --template marketing

# Foundation + site with no content
pnpm create uniweb my-project --template none

# Blank workspace — grow with `uniweb add`
pnpm create uniweb my-workspace --blank
```

See [Templates](./templates) for all options.
