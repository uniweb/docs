# Thinking in Contexts

Most frameworks give you a dark mode toggle. Flip it, and the entire page switches between light and dark. It works — until your page has more than one visual mood.

A typical marketing page might have a clean white hero, a slightly tinted features section, a dramatic dark call-to-action over a photograph, and a light footer. That's four different visual environments on one page. A global toggle can't express this. So developers write conditional logic: `isDark ? 'text-white' : 'text-gray-900'`, repeated across every component, for every color, in every section that deviates from the norm.

Uniweb takes a different approach. Instead of one concept (dark mode), it has two independent concepts: **section context** and **site scheme**. Understanding how they work together is the key to Uniweb's theming system.

## Section context: what's behind the content

A section's context answers one question: **what's behind the content here?**

The background might be a light neutral, a dark photograph with an overlay, a brand-colored gradient, or a video. The content author controls this visual environment through frontmatter — they don't need to touch component code:

```yaml
---
type: Features
theme: dark
background:
  image: /images/night-skyline.jpg
  overlay: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))
---
```

When the runtime encounters this section, it does two things. First, it renders the background image and overlay behind the component. Second, it applies a context class — in this case, `context-dark` — which sets every semantic color token for legibility on a dark surface. Headings become light. Body text becomes light. Borders, links, card backgrounds — everything adjusts.

The component rendering inside this section doesn't know it's sitting on top of a photograph. It doesn't know the overlay exists. It uses `text-heading` and gets white. It uses `bg-card` and gets a dark translucent surface. Everything is legible, automatically.

This works because the runtime orchestrates backgrounds and contexts together. The content author declares the visual environment. The runtime renders it and applies the right context. The component uses semantic tokens and adapts without any conditional logic.

A single page commonly uses multiple contexts. A marketing page might flow through:

- A light hero — clean and spacious
- A medium features section — subtle contrast from the hero
- A dark CTA — dramatic, high-contrast, maybe over a photo
- A light footer

Each section independently resolves its own set of semantic tokens. Components don't change between them.

## Site scheme: the global preference

A site's scheme answers a different question: **does this site prefer a light or dark overall appearance?**

This is the traditional light/dark mode — a global preference that affects the page as a whole. It might be set in the site's configuration, or it might follow the visitor's operating system preference:

```yaml
# theme.yml
appearance: system  # Follows OS preference
```

When the scheme is dark, the defaults shift. Sections that don't declare an explicit context get dark tokens instead of light ones. The page background darkens. Browser controls and scrollbars adapt.

## Two axes, not one

Context and scheme are independent. They compose freely:

|                              | Light scheme | Dark scheme |
|------------------------------|-------------|-------------|
| **Section with `theme: light`** | Light tokens (typical) | Light tokens — a bright section on an otherwise dark site |
| **Section with `theme: dark`**  | Dark tokens — a dramatic section on a light site | Dark tokens (typical) |
| **Section with no `theme:`**    | Light tokens (default) | Dark tokens (default follows scheme) |

A dark-scheme site can still have a bright white CTA section. A light-scheme site can have a dramatic dark hero. The content author controls per-section context; the site configuration controls the global default. Neither overrides the other.

## What this means for content authors

If you're writing content, contexts give you direct control over the visual character of each section — without writing code or asking a developer for help.

Want a section with a dark, cinematic feel?

```yaml
---
type: Hero
theme: dark
background:
  image: /images/city-at-night.jpg
  overlay: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))
---
```

Want a branded section with your primary color?

```yaml
---
type: CTA
theme: dark
background:
  color: var(--primary-600)
---
```

Want a subtle tinted section to break up a long page?

```yaml
---
type: Features
theme: light
background:
  color: var(--secondary-50)
---
```

In each case, the component adapts. You choose the environment; the theming system handles legibility.

## What this means for developers

If you're building components, contexts mean you write less code, not more. You never manage colors directly. You never write conditional logic for light and dark variants. You use semantic tokens, and the context resolves them.

Here's a features component:

```jsx
export default function Features({ content }) {
  const { title, items } = content

  return (
    <div className="py-16 px-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-heading">{title}</h2>
      <div className="grid md:grid-cols-3 gap-8 mt-10">
        {items.map((item, i) => (
          <div key={i} className="p-6 bg-card border border-border rounded-xl">
            <h3 className="text-xl font-semibold text-heading">{item.title}</h3>
            <p className="text-subtle mt-2">{item.paragraphs?.[0]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

There's no theme map. No `isDark` check. No color constants file. The content author writes `theme: dark` in frontmatter and every color in this component inverts. Change `primary` in `theme.yml` and links and buttons update site-wide. The component doesn't know and doesn't care.

The semantic tokens you'll use most often:

| Token | What it's for |
|-------|--------------|
| `text-heading` | Headings and high-emphasis text |
| `text-body` | Body text and default content |
| `text-subtle` | De-emphasized text — captions, timestamps, metadata |
| `text-link` | Links and interactive text |
| `bg-section` | Section background (usually handled by the runtime) |
| `bg-card` | Cards, panels, elevated surfaces |
| `bg-muted` | Hover states, zebra rows, subtle emphasis |
| `border-border` | Dividers and card edges |

These tokens resolve differently inside each context class, but your component uses them the same way everywhere.

## Why other frameworks can't do this

Traditional frameworks offer a global dark-mode toggle because they don't have the pieces needed for per-section adaptation:

**A runtime that wraps every section.** Uniweb's runtime renders each section inside a wrapper with the appropriate context class and background layer. This isn't something the component does — it happens at a level above individual components.

**Content-author control via frontmatter.** Authors set `theme:` and `background:` per section without touching code. The visual environment is a content decision, not a development decision.

**Engine-rendered backgrounds.** Image, video, gradient, color, and overlay rendering is handled once by the runtime. Components don't implement background logic — they receive a visual environment and adapt to it.

The elevation-based surface model from Material Design assumes one global mode with surfaces stacking within it: base surface, raised surface, overlay surface. Uniweb's context model is more flexible. It independently adapts every token — text, borders, links, buttons, surfaces — per section. A card component doesn't need a separate "raised surface" token; it uses `bg-card`, and the context class determines whether that's a light card or a dark card.

This is why surfaces are named for what the container *is* — `section`, `card`, `muted` — rather than for an elevation level. The container's identity doesn't change between contexts. Only the colors do.

## The full picture

When a page renders, the chain works like this:

1. The site's theme defines colors, fonts, and a default scheme
2. The build system generates semantic tokens for each context — light, medium, dark
3. For each section, the content author's frontmatter declares the visual environment
4. The runtime renders the background and applies the matching context class
5. Every semantic token in that section resolves for legibility in that environment
6. Components use tokens via Tailwind classes and adapt without any awareness of which context they're in

The result is a system where visual variety is a content decision. A page can move through light, dark, and colored sections — each with its own background treatment — and every component remains legible without a single line of conditional color logic.

The content author controls the mood. The theme controls the palette. The context system connects them. And the component just works.
