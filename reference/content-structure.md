# Content Structure

This guide explains how markdown content is parsed and delivered to your components.

## The Basics

When you write markdown in a section file, the parser extracts semantic elements and organizes them into a structured object your component receives:

```markdown
---
type: Features
---

# Our Features

We built this for you.

### Fast

Lightning quick response times.

### Secure

Enterprise-grade security.

### Simple

No configuration required.
```

Your component receives:

```js
{
  title: "Our Features",
  paragraphs: ["We built this for you."],
  items: [
    { title: "Fast", paragraphs: ["Lightning quick response times."] },
    { title: "Secure", paragraphs: ["Enterprise-grade security."] },
    { title: "Simple", paragraphs: ["No configuration required."] }
  ]
}
```

## Ignored Files and Folders

The content collector skips certain files and folders by convention:

| Pattern | Example | Purpose |
|---------|---------|---------|
| `README.md` | `pages/README.md` | Repository documentation (for GitHub), not site content |
| `_*` files | `_draft-hero.md` | Draft or private content not ready for publishing |
| `_*` folders | `_drafts/`, `_archive/` | Entire folders of draft or archived content |

This lets you keep repository documentation and work-in-progress content alongside published pages without them appearing on your site.

## Content Fields

All content fields are available at the top level:

| Field        | Source                 | Description                                |
| ------------ | ---------------------- | ------------------------------------------ |
| `title`      | First heading          | Main headline (`string` or `string[]` for multi-line) |
| `pretitle`   | Heading before title   | Eyebrow/kicker text                        |
| `subtitle`   | Heading after title    | Secondary headline (`string` or `string[]`) |
| `paragraphs` | Body text              | Array of paragraph strings                 |
| `links`      | `[text](url)`          | Array of link objects (see below)          |
| `images`       | `![alt](url)`          | Array of image objects                     |
| `icons`      | `![](icon:url)`        | Array of icon objects                      |
| `videos`     | `![](url){role=video}` | Array of video objects                     |
| `insets`     | `![](@Component)` or a ` ```@Component ` fence | Component references — inline, or wrapping a body |
| `lists`      | `- item`               | Bullet or numbered lists                   |
| `quotes`     | `> text`               | Blockquote content                         |
| `snippets`   | Fenced code            | Code snippets — `[{ language, code }]`     |
| `data`       | Tagged blocks          | `yaml:`/`json:` give the parsed value; `md:` gives `{ items, sequence }` (see below) |
| `tables`     | Markdown tables        | Present only when the content has one — `[{ rows }]` |
| `headings`   | Additional headings    | Headings after subtitle, in document order |
| `items`      | Subsequent headings    | Child content groups                       |
| `sequence`   | All elements           | Ordered array for document-order rendering |

## Attribute Syntax

Both links and media (images, videos, icons) support attributes using curly braces after the element:

```markdown
[text](url){attributes}
![alt](url){attributes}
```

### Attribute Types

| Syntax        | Result                       | Example          |
| ------------- | ---------------------------- | ---------------- |
| `key=value`   | Named attribute              | `width=800`      |
| `key:value`   | Same — `:` is an alias for `=` | `width:800`    |
| `key="value"` | Quoted value (allows spaces) | `alt="My image"` |
| `#idName`     | Cross-reference / anchor id   | `#fig-cells`     |
| `booleanKey`  | Boolean true                 | `autoplay`       |

```markdown
![Hero](./hero.jpg){role=banner width=1200 #main-hero loading=lazy}
```

Attributes can appear in any order.

### There is no CSS-class syntax

A leading dot is an ordinary **name** character, not a class marker:
`{.featured}` is the boolean attribute `".featured"`, and `{.one.two}` is the
boolean attribute `".one.two"`.

Author-supplied CSS classes were the one place markdown was taken *literally*.
Everywhere else the foundation interprets what you write — `#` is not `<h1>`,
`**bold**` is not `font-weight: 700`, `{accent}` is not a color. `class="featured"`
was the exception, and it let content dictate presentation.

Nothing is lost, because the better spelling already existed. **A bare name is an
open, multi-valued label set**, and it renders as a semantic attribute rather than
a class:

```markdown
[Ships today]{accent}          <!-- <span accent="true">   -->
[Ships today]{accent urgent}   <!-- two labels, both applied -->
```

Sites declare what those names mean under `theme.yml`'s `inline:` key. Write
`{featured}` where you would once have written `{.featured}`.

`#idName` is unaffected — it is *identity*, not presentation, and it is how a
figure becomes a cross-reference target (see Cross-references).

### Separators

Pairs are separated by whitespace, a comma, or both. These are the same:

```markdown
{role=banner width=1200}
{role=banner, width=1200}
{role:banner, width:1200}
```

`:` and `,` are accepted because they are what most people reach for out of
habit, and getting them wrong used to fail quietly rather than loudly. They add
no capability — `=` and spaces remain the canonical form, and that is what the
editor writes back when it saves a file.

Two rules keep the syntax unambiguous:

- **The separator must touch the key.** `{note:warning}` is one pair;
  `{note : warning}` is two boolean flags. Spaces around `:` or `=` are never
  part of an assignment.
- **A value containing a comma must be quoted** — `{style="a, b"}`. An unquoted
  comma always ends the value. A value containing a *colon* needs no quoting;
  only the first colon separates, so `{href:https://example.com}` and
  `{style=color:red}` work as written.

## Asset Paths

Assets (images, videos, PDFs) can be referenced using several path formats:

### Relative Paths

Paths relative to the markdown file:

```markdown
![Photo](./photo.jpg) <!-- Same folder as the markdown file -->
![Logo](../shared/logo.svg) <!-- Parent folder -->
![Team](./images/team.jpg) <!-- Subfolder -->
```

### Absolute Paths (Site Root)

Paths starting with `/` are resolved from the site's `public/` or `assets/` folder:

```markdown
![Hero](/images/hero.jpg) <!-- public/images/hero.jpg or assets/images/hero.jpg -->
![Logo](/brand/logo.svg) <!-- public/brand/logo.svg -->
```

The build system checks `public/` first, then `assets/`.

### External URLs

External URLs are passed through unchanged:

```markdown
![External](https://example.com/image.jpg)
```

## Build Optimizations

During build, local assets are automatically processed:

### Image Optimization

- **PNG, JPG, JPEG, GIF** → Converted to WebP for smaller file sizes
- **SVG, WebP, AVIF** → Passed through unchanged
- All images get content-hashed filenames for cache busting

```markdown
![Photo](./photo.jpg)

<!-- Output: /assets/photo-a1b2c3d4.webp -->
```

### Automatic Poster Generation

Videos without an explicit `poster` attribute get an auto-generated poster image (requires ffmpeg on your system):

```markdown
![Demo](./demo.mp4){role=video}

<!-- Auto-generates: /assets/demo-poster-a1b2c3d4.webp -->
```

To use your own poster, specify it explicitly:

```markdown
![Demo](./demo.mp4){role=video poster=./custom-poster.jpg}
```

### Automatic PDF Previews

PDFs without an explicit `preview` attribute get an auto-generated preview thumbnail (requires pdf-lib):

```markdown
![Report](./report.pdf)

<!-- Auto-generates: /assets/report-thumb-a1b2c3d4.webp -->
```

To use your own preview, specify it explicitly:

```markdown
![Report](./report.pdf){preview=./report-cover.jpg}
```

## Media Assets: Images, Videos, and Icons

Media uses the standard image syntax `![alt](url)` but the `role` attribute determines which content array it goes into:

| Role              | Output Array | Use Case                 |
| ----------------- | ------------ | ------------------------ |
| `image` (default) | `images`       | Content images           |
| `banner`          | `images`       | Hero/banner images       |
| `gallery`         | `images`       | Gallery images           |
| `background`      | `images`       | Background images        |
| `icon`            | `icons`      | Icons and small graphics |
| `video`           | `videos`     | Video content            |
| `pdf`             | `images`       | Documents — adds `preview`, `author`, `description` |

The roles above are **conventions, not a fixed set.** `role` rides through verbatim, so
`{role=wibble}` reaches your component as `role: "wibble"`; it simply lands in `images`
like any role that isn't `icon` or `video`. Only those two select a different array.

### Setting the Role

There are two ways to set the role:

**1. Prefix syntax (legacy):**

```markdown
![Logo](icon:./logo.svg)
![Demo](video:./demo.mp4)
```

**2. Attribute syntax (recommended):**

```markdown
![Logo](./logo.svg){role=icon}
![Demo](./demo.mp4){role=video}
![Hero](./hero.jpg){role=banner}
```

The attribute syntax is more flexible—it allows combining role with other attributes:

```markdown
![Demo](./demo.mp4){role=video autoplay muted loop poster=./poster.jpg}
```

### Image Attributes

```markdown
![Alt text](./image.jpg){width=800 height=600 loading=lazy fit=cover}
```

| Attribute  | Description                              |
| ---------- | ---------------------------------------- |
| `width`    | Image width                              |
| `height`   | Image height                             |
| `loading`  | `lazy` or `eager`                        |
| `fit`      | CSS object-fit: `cover`, `contain`, etc. |
| `position` | CSS object-position                      |

### Video Attributes

```markdown
![Demo](./video.mp4){role=video autoplay muted loop controls poster=./thumb.jpg}
```

| Attribute  | Description            |
| ---------- | ---------------------- |
| `autoplay` | Auto-play on load      |
| `muted`    | Start muted            |
| `loop`     | Loop playback          |
| `controls` | Show video controls    |
| `poster`   | Poster/thumbnail image |

### Icons

Icons can be referenced in three ways:

**1. URL-based icons (any SVG file):**

```markdown
![Logo](./logo.svg){role=icon}
![Logo](icon:./logo.svg)
```

**2. Named icons from icon libraries:**

```markdown
![check](lucide:check)
![arrow](lucide:arrow-right){size=20}
![heart](lucide:heart){size=24 color=red}
```

Supported icon library prefixes (browse icons visually at [react-icons.github.io/react-icons](https://react-icons.github.io/react-icons/)):

| Prefix (friendly name) | Short code | Library |
| ---------------------- | ---------- | ------- |
| `lucide:` | `lu` | [Lucide](https://lucide.dev) |
| `heroicons:` | `hi` | [Heroicons v1](https://heroicons.com) |
| `heroicons2:` | `hi2` | [Heroicons v2](https://heroicons.com) |
| `feather:` | `fi` | [Feather](https://feathericons.com) |
| `phosphor:` | `pi` | [Phosphor](https://phosphoricons.com) |
| `tabler:` | `tb` | [Tabler Icons](https://tabler-icons.io) |
| `bootstrap:` | `bs` | [Bootstrap Icons](https://icons.getbootstrap.com) |
| `material-design:` | `md` | [Material Design](https://fonts.google.com/icons) |
| `ant-design:` | `ai` | [Ant Design Icons](https://ant.design/components/icon/) |
| `remix:` | `ri` | [Remix Icon](https://remixicon.com) |
| `simple-icons:` | `si` | [Simple Icons](https://simpleicons.org) |
| `ionicons:` | `io5` | [Ionicons 5](https://ionicons.com) |
| `boxicons:` | `bi` | [Boxicons](https://boxicons.com) |
| `vscode:` | `vsc` | [VS Code Codicons](https://github.com/microsoft/vscode-codicons) |
| `weather:` | `wi` | [Weather Icons](https://erikflowers.github.io/weather-icons/) |
| `game:` | `gi` | [Game Icons](https://game-icons.net) |
| `fa:` / `fa6:` | `fa` / `fa6` | [Font Awesome 5 & 6](https://fontawesome.com) |

**Icon attributes:**

| Attribute | Description |
| --------- | ----------- |
| `size` | Icon size in pixels (default: 24) |
| `color` | Icon color (CSS color value) |

**Important:** Named icons require foundation support. The foundation must include the icon library to render named icons. See [Foundation Configuration](./foundation-config.md#icon-libraries) for setup instructions.

If your foundation doesn't include an icon library, use URL-based icons instead:

```markdown
![check](/icons/check.svg){role=icon}
```

### Clickable Images and Videos

Images and videos can be links—clicking them navigates to the specified URL:

```markdown
![Product Screenshot](./screenshot.jpg){href=/products/details}
![Demo Video](./demo.mp4){role=video href=/demo target=\_blank}
```

```js
images: [
  {
    url: './screenshot.jpg',
    alt: 'Product Screenshot',
    href: '/products/details',
  },
]
videos: [{ src: './demo.mp4', href: '/demo', target: '_blank' }]
```

Components can wrap the media in a link element when `href` is present:

```jsx
function Image({ src, alt, href, target }) {
  const img = <img src={src} alt={alt} />
  return href ? (
    <a href={href} target={target}>
      {img}
    </a>
  ) : (
    img
  )
}
```

## Insets (Inline Component References)

Use image syntax with an `@` prefix to place a foundation component inline within content:

```markdown
![description](@ComponentName){param=value}
```

The parts carry distinct information:
- `[description]` — text passed to the component as `block.content.title`
- `(@Name)` — foundation component to render (must have `inset: true` in meta.js)
- `{params}` — configuration attributes passed as component params

```markdown
![Architecture diagram](@NetworkDiagram){variant=compact}
![Cache metrics](@PerformanceChart){period=30d}
![](@GradientBlob){position=top-right}
```

Insets appear in `content.insets[]` as `{ refId }` entries (parallel to `content.images[]`). They also appear in `content.sequence[]` as `{ type: "inset", refId }` entries for positional rendering.

At runtime, inset Block instances are available via `block.insets` (separate from `block.childBlocks`). Kit's `Render` component handles `inset_placeholder` nodes in the content flow automatically, rendering the corresponding component at the author's chosen position.

Components that need a visual slot (image, video, or inset) can use `<Visual>` from `@uniweb/kit` — pass the candidates you want considered (`inset`, `video`, `image`) and it renders the first non-empty one.

## Block Insets (Component Containers)

An inset written with image syntax is a **leaf** — it takes params but no body.
When the component should wrap authored content, use the fenced form: a code
fence whose info string is `@ComponentName` plus optional params.

```markdown
```@Alert{type=warning}
Back up your database **before** running this.

- The migration is not reversible
- Allow ten minutes of downtime
```
```

The two forms are the same mechanism at different scales:

| | Leaf inset | Block inset |
|---|---|---|
| Written | `![alt](@Name){params}` | ` ```@Name{params} ` … ` ``` ` |
| Position | Anywhere, including mid-sentence | Block level only |
| Body | None — `alt` becomes the title | Markdown, parsed as blocks |

**The body is ordinary content, not text.** It is parsed exactly like the rest of
the page, so everything works inside a container: headings, lists, tables, links,
icons, inline styling, leaf insets, and other containers. Params use the same
attribute syntax as everywhere else.

**Nesting needs a wider fence.** To put a code block — or another container —
inside one, open the outer fence with more backticks than the inner one:

````markdown
````@Details
How do I undo this?

```bash
uniweb rollback --to previous
```
````
````

**The component comes from your foundation.** `@Alert` names a component the
foundation provides, exactly as `![](@NetworkDiagram)` does — both resolve
through the same lookup. A name the foundation does not define renders as a
plain bordered container that still shows its body; content is never dropped for
the sake of an unknown component.

The component receives `{ content, params, block }` like any section type, and
its `content` is the parsed body — `title`, `paragraphs`, `items`, `sequence`.
Render it with kit's `<Prose content={content} block={block} />`, or reach into
the parsed fields directly:

```jsx
export default function Alert({ content, params }) {
  return (
    <aside className={`alert alert-${params.type || 'info'}`}>
      <Prose content={content} />
    </aside>
  )
}
```

Declare it with `inset: true` in `meta.js`, the same as a leaf inset.

## Inline Text Styling

Style inline text using bracketed spans with named attributes—Pandoc-style syntax that works in both markdown files and the visual editor.

### Basic Syntax

```markdown
[text]{name}
[text]{name key=value}
```

The framework provides two default styles: `accent` (colored + bold) and `muted` (subtle). Sites can define additional styles in `theme.yml`'s `inline:` section.

### Common Styles

```markdown
Build [faster]{accent} with structure.

Here's a [side note]{muted} that's less prominent.
```

Your component receives these as `<span>` elements in paragraph text:

```js
paragraphs: [
  'Build <span accent="true">faster</span> with structure.',
]
```

The CSS is generated from `theme.yml` using attribute selectors (`span[accent] { ... }`), so the boolean flag syntax maps directly to styling.

### Inline Style Escape Hatches

For one-off styling without defining a named style:

```markdown
[red text]{color=red}
[highlighted]{bg=yellow}
```

These render as inline styles: `<span style="color: red">red text</span>`.

### Combining with Other Formatting

Spans work with bold, italic, and other inline formatting:

```markdown
This is [**bold and accented**]{accent} text.
Check the [_italicized note_]{muted} below.
```

### Defining Custom Styles

Add named styles in `theme.yml`:

```yaml
inline:
  accent:
    color: var(--link)
    font-weight: '600'
  muted:
    color: var(--subtle)
  highlight:
    background: var(--accent-100)
    color: var(--accent-900)
```

These generate `span[name] { ... }` CSS rules. Content authors write `[text]{name}` — no CSS knowledge needed. Styles that reference semantic tokens (like `var(--link)`) adapt to context automatically.

## Math (LaTeX)

LaTeX math in markdown is compiled to MathML Core at build time and rendered natively by the browser. No runtime math library, no KaTeX CSS, no CDN — the MathML ships inside the page HTML.

Three forms (Pandoc / GitHub / VS Code / Jupyter / Obsidian convention):

| Form | Mode | Example |
|---|---|---|
| `$x$` | Inline | `The identity $e^{i\pi} + 1 = 0$ is Euler's.` |
| `$$x$$` | Display on its own line; inline display mid-paragraph | `$$\int_0^\infty e^{-x^2}\,dx = \tfrac{\sqrt{\pi}}{2}$$` |
| ` ```math ` fence | Display (multi-line friendly) | see below |
| `\$` | Literal `$` | `The price is \$20.` |

Multi-line display math is easier to read with a fence:

````markdown
```math
\begin{aligned}
  f(x) &= \sum_{n=0}^\infty a_n x^n \\
       &= a_0 + a_1 x + a_2 x^2 + \cdots
\end{aligned}
```
````

### What it looks like

Everything below this line is live — it is authored in this page's markdown exactly as shown above, so what you see is what the pipeline produces.

**Inline, in running prose.** A sentence can carry math without breaking its line: the Gaussian integral $\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}$ sits in the paragraph, and so does a rate like $O(n \log n)$ or a threshold of $p < 0.05$. Symbols work the same way — $\alpha$, $\beta$, $\sigma^2$ — as do fractions such as $\tfrac{3}{4}$.

**Display, on its own line.** A formula the reader is meant to stop at goes on its own:

$$\sum_{k=1}^{n} k = \frac{n(n+1)}{2}$$

**Fenced, for anything multi-line.** Alignment survives, which is what makes derivations readable:

```math
\begin{aligned}
  (a + b)^2 &= (a + b)(a + b) \\
            &= a^2 + ab + ba + b^2 \\
            &= a^2 + 2ab + b^2
\end{aligned}
```

Matrices and cases work too:

$$
A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}
\qquad
|x| = \begin{cases} x & x \ge 0 \\ -x & x < 0 \end{cases}
$$

**Disambiguating `$...$`.** Dollar-delimited inline math requires (1) no whitespace next to either delimiter and (2) no digit immediately after the closing `$`. Currency sentences therefore stay prose without any escaping, and this one is live: it costs $5 and $10 total, with a budget of $200.

For a literal dollar the rules cannot save — a lone `$` that happens to pair with another one later in the same paragraph — escape it as `\$`. That is worth knowing precisely because it is easy to trip: an earlier draft of the paragraph above ran on past its last figure and picked up a `$` further down the line, turning the sentence that claims currency stays prose into rendered math.

Math flows through the same pipeline as the rest of content — it appears in prerendered HTML, survives EPUB and Paged.js compilation, and roundtrips cleanly through the editor. Malformed LaTeX renders as an inline `<span class="temml-error">` containing the source, so authors see that something is wrong without breaking the page. Foundations can style `.temml-error` in their theme CSS if they want visible error feedback.

## Links and Buttons

Links are collected in the `links` array. Attributes control behavior and styling.

### Basic Links

```markdown
[Learn more](/about)
[External](https://example.com){target=\_blank}
[Download](./report.pdf){download}
[Download as](./report.pdf){download="annual-report.pdf"}
```

| Attribute  | Description                    |
| ---------- | ------------------------------ |
| `target`   | `_blank`, `_self`, etc.        |
| `rel`      | `noopener`, `noreferrer`, etc. |
| `download` | Make it a download link        |

### Link Detection

The parser intelligently handles links based on context:

**Links in text** stay as paragraphs with inline HTML:

```markdown
Visit our [about page](/about) to learn more.
```

```js
paragraphs: ['Visit our <a href="/about">about page</a> to learn more.']
```

**Link-only paragraphs** become link objects—useful for CTAs and navigation:

```markdown
[Get Started](/signup)
```

```js
links: [{ href: '/signup', label: 'Get Started' }]
```

**Multiple links on consecutive lines** split into separate link objects:

```markdown
[Home](/)
[About](/about)
[Contact](/contact)
```

```js
links: [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]
```

This makes it easy to create button groups or nav links without special syntax.

### Links with Icons

When a link-only paragraph contains an adjacent icon, the parser associates them:

```markdown
![](/icons/home.svg){role=icon} [Home](/)
```

```js
links: [
  {
    href: '/',
    label: 'Home',
    iconBefore: { url: '/icons/home.svg' },
    iconAfter: null,
  },
]
```

Icons can appear before or after the link text:

```markdown
[External Link](https://example.com) ![](/icons/external.svg){role=icon}
```

```js
links: [
  {
    href: 'https://example.com',
    label: 'External Link',
    iconBefore: null,
    iconAfter: { url: '/icons/external.svg' },
  },
]
```

**Note:** Icon association only works for single-link paragraphs where the relationship is unambiguous. In paragraphs with multiple links, icons are collected separately in the `icons` array.

### Clickable Icons

Icons can be links themselves—useful for social media buttons and icon-only navigation:

```markdown
![Twitter](/icons/twitter.svg){role=icon href="https://twitter.com/example" target=\_blank}
![GitHub](/icons/github.svg){role=icon href="https://github.com/example" target=\_blank}
```

```js
icons: [
  {
    url: '/icons/twitter.svg',
    href: 'https://twitter.com/example',
    target: '_blank',
  },
  {
    url: '/icons/github.svg',
    href: 'https://github.com/example',
    target: '_blank',
  },
]
```

Components can check `icon.href` to render clickable icons differently from decorative ones.

### Link Attributes

Links can include optional attributes that components may use as rendering hints:

```markdown
[Get Started](/signup){variant=primary size=lg}
[Learn More](/docs){target=_blank}
[Download PDF](/file.pdf)
```

**Available attributes:**

| Attribute | Values                                     | Description                |
| --------- | ------------------------------------------ | -------------------------- |
| `role`    | Any string (e.g., `button`, `nav`)         | Hint for component styling |
| `variant` | `primary`, `secondary`, `outline`, `ghost` | Visual style hint          |
| `size`    | `sm`, `md`, `lg`                           | Size hint                  |
| `target`  | `_blank`, `_self`, etc.                    | Link target                |

**Important:** These attributes are hints—components decide how to render links. A Hero component might render all links as buttons regardless of attributes, while a Footer component might render them as plain links.

### Link Types

Components receive all links in the `content.links` array:

```js
const { links } = content

links.forEach((link) => {
  console.log(link.href)
  console.log(link.label)
  console.log(link.role)     // Optional hint from author
  console.log(link.variant)  // Optional styling hint
  console.log(link.target)   // Link target
})
```

File links (`.pdf`, `.doc`, etc.) automatically include `download: true` for browser handling.

## Document-Order Rendering with Sequence

While most components use the semantic fields (`title`, `paragraphs`, `items`), some components need to render content in exact document order—like an Article or Blog Post component.

The `sequence` array provides all elements in their original order:

```js
const { sequence } = content

sequence.forEach((element) => {
  switch (element.type) {
    case 'heading':
      return <Heading level={element.level}>{element.text}</Heading>
    case 'paragraph':
      return <Paragraph html={element.text} />
    case 'image':
      return <Image src={element.attrs.src} alt={element.attrs.alt} />
    case 'list':
      return <List items={element.children} style={element.style} />
    case 'blockquote':
      return <Blockquote>{element.children}</Blockquote>
    case 'codeBlock':
      return (
        <CodeBlock language={element.attrs.language}>{element.text}</CodeBlock>
      )
    case 'inset':
      // Rendered automatically by kit's Render component
      return <InsetRenderer refId={element.refId} block={block} />
    // ... other types
  }
})
```

**When to use which:**

| Approach        | Use Case                               | Example Components                |
| --------------- | -------------------------------------- | --------------------------------- |
| Semantic fields | Structured layouts with specific slots | Hero, Features, Pricing, Team     |
| `sequence`      | Document-order flow                    | Article, Blog Post, Documentation |

You can also combine both—use semantic fields for the header area and sequence for the body.

## Semantic Heading Interpretation

**Important:** Heading levels in markdown are _relative_, not absolute. A `#` (H1) in your markdown doesn't necessarily become an `<h1>` in the final HTML.

The parser interprets headings based on their _relationship_ to each other:

```markdown
## Welcome ← This becomes `title` (it's the first/main heading)

### Getting Started ← This becomes `subtitle` (it's after the title)

Some content here.

### Features ← This starts an `item` (heading after content)
```

The same semantic structure can be expressed with different heading levels:

```markdown
# Welcome ← title

## Getting Started ← subtitle
```

or:

```markdown
### Welcome ← title

#### Getting Started ← subtitle
```

Both produce the same `content.title` and `content.subtitle`. The component decides what HTML elements to use. A hero component might render `title` as `<h1>`, while a card component might render it as `<h3>`.

### Adjacent Levels Only

A heading groups with the previous heading only when it is **exactly one level deeper**. Skipping levels breaks the group:

```markdown
# Features        ← title
## Our key areas  ← subtitle (one level deeper — groups with title)
```

```markdown
# Features        ← title (alone — H3 is two levels deeper, not grouped)

### Speed         ← starts a new group → item
### Security      ← starts a new group → item
```

The level gap signals a structural tier change: `### Speed` is an item under `# Features`, not a subtitle of it. If you want a subtitle, use the adjacent level (`##`).

### Pretitle Detection

Any heading followed by a _more important_ heading automatically becomes a pretitle:

```markdown
### Welcome to ← pretitle (H3 before H1)

# Acme Corp ← title

## Build faster ← subtitle
```

This works at any level:

- H3 → H1 = pretitle
- H2 → H1 = pretitle
- H4 → H2 = pretitle
- H6 → H5 = pretitle

No special syntax needed—the parser detects it automatically.

### Multi-Line Headings

Consecutive headings at the same level merge into a title array — perfect for dramatic, multi-line hero headlines:

```markdown
# Build the future
# with confidence
```

```js
content.title // ["Build the future", "with confidence"]
```

Kit's text components (`<H1>`, `<H2>`, etc.) render arrays as a single HTML element with visual line breaks.

**With accent styling** — the classic hero pattern:

```markdown
# Build the future
# [with confidence]{accent}
```

```js
content.title // ["Build the future", "<span accent=\"true\">with confidence</span>"]
```

**With pretitle and subtitle:**

```markdown
### Our Mission
# Build the future
# with confidence
## The platform for modern teams
```

```js
content.pretitle  // "Our Mission"
content.title     // ["Build the future", "with confidence"]
content.subtitle  // "The platform for modern teams"
```

**Important:** Same-level merging only applies within the heading group at the top of a section. Once body content begins and items start, same-level headings create separate items instead of merging. Use `---` to force a split when needed:

```markdown
# Line one
---
# Line two
```

Here, `---` separates the two headings into different groups rather than merging them.

## Items: Child Content Groups

The `items` array contains child content groups. A new item starts whenever a heading appears after other content (paragraphs, images, etc.). Each item has the same field structure as the main content.

Use items when your component displays repeating content—feature cards, pricing tiers, team members, FAQ questions.

**Convention:** Use a higher-level heading for the main title and lower-level headings for items. This makes the structure clear, but the parser is flexible—any heading after content starts a new item.

```markdown
# Pricing

Choose your plan.

### Starter

$9/month

Perfect for individuals.

[Get Started](/signup?plan=starter){button}

### Pro

$29/month

For growing teams.

[Get Started](/signup?plan=pro){.button variant=primary}
```

```js
// In your Pricing component
const { title, paragraphs, items } = content

items.forEach((tier) => {
  console.log(tier.title) // "Starter", "Pro"
  console.log(tier.paragraphs) // ["$9/month", "Perfect for..."], ...
  console.log(tier.links) // [{ href: "/signup?plan=starter", role: "button", ... }]
})
```

## Lists

The `lists` field contains markdown bullet or numbered lists. Each list is an array of list items, and each list item has the same structure as content (paragraphs, links, nested lists, etc.):

```markdown
- First item with **bold** text
- Second item with a [link](/path)
  - Nested item
- Third item
```

```js
// lists is an array of lists (usually just one)
// Each list is an array of list items
// Each list item has: paragraphs, links, lists (nested), etc.

const { lists } = content

lists[0].forEach((item) => {
  console.log(item.paragraphs) // ["First item with <strong>bold</strong> text"]
  console.log(item.links) // [{ href: "/path", label: "link" }] for second item
  console.log(item.lists) // Nested lists array (for items with sub-lists)
})
```

**Structure:**

```
lists: [                           // Array of lists in the content
  [                                // First list (array of list items)
    {                              // First list item
      paragraphs: string[],
      links: Link[],
      lists: [...],                // Nested sub-lists
      ...                          // Same fields as content
    },
    ...
  ]
]
```

**Important:** List items are _not_ plain strings. They're objects with the same structure as content, allowing rich formatting, links, and nested lists within each item.

## Fenced Code in Content

Fenced code in markdown serves three distinct purposes, decided by its info string:

| Info string | What it is |
|---|---|
| ` ```yaml:tag ` / ` ```json:tag ` | **Data** — parsed into a value at `content.data[tag]` |
| ` ```md:tag ` | **A concept block** — prose under a name, at `content.data[tag]` |
| ` ```js `, ` ```sh `, … | **A code sample**, in `content.snippets` |

### Tagged Data Blocks

A tagged data block is structured data that gets parsed into a JS object. The format (`yaml` or `json`) tells the parser how to deserialize — it's a serialization format, not a display language. The tag is the key in `content.data`:

````markdown
```yaml:form
fields:
  - name: email
    type: email
    required: true
  - name: message
    type: textarea
submitLabel: Send Message
```
````

```js
const formConfig = content.data?.form
// { fields: [...], submitLabel: "Send Message" }
```

**Supported formats:** `yaml` (or `yml`) and `json`. The tag name is yours to choose — `yaml:pricing`, `json:config`, `yaml:speakers` — whatever describes the data.

### Code Snippets

Fenced code without a tag is a code snippet — display content with a language for syntax highlighting. Snippets are collected in `content.snippets`:

````markdown
```jsx
function Hello() {
  return <h1>Hello world</h1>
}
```
````

```js
content.snippets[0]
// { language: 'jsx', code: 'function Hello() {\n  return <h1>Hello world</h1>\n}' }
```

The `language` attribute is a display hint for syntax highlighting renderers, not a parsing format. Filter by language when needed: `content.snippets.filter(s => s.language === 'css')`.

### The Distinction

| | Tagged data blocks | Code snippets |
|---|---|---|
| **Syntax** | `` ```yaml:tagname `` | `` ```javascript `` |
| **Purpose** | Structured data for the component | Display content |
| **Language means** | Serialization format (how to parse) | Display hint (how to highlight) |
| **Destination** | `content.data.tagName` (JS object) | `content.snippets` (array of `{ language, code }`) |
| **Formats** | `yaml`, `json` | Any language identifier |

Both also appear in `content.sequence` for document-order rendering.

For structured data served as JSON collections (blog posts, team members, events), see [Content Collections](./content-collections.md). That guide covers markdown collections (`.md` for rich content, `.yml` for pure data), static JSON files, and runtime data — including how to choose the right approach for i18n.

### Concept Blocks

A ` ```md:<tag> ` fence marks a run of prose as a named *kind* of content. The author writes ordinary markdown; the tag says what it is.

````markdown
```md:faq
# What plans do you have?
Three — Starter, Team and Enterprise.

# Can I change later?
Any time, and we prorate the difference.
```
````

Each `#` heading starts an item, so this reaches a component as `content.data.faq`:

```js
{
  items:    [{ title, paragraphs, links, ... }, ...],  // one per heading
  sequence: [...]                                      // the same content, in document order
}
```

**The shape comes from the fence, not the tag.** Any tag works and none is special — no schema is consulted, and nothing in the framework learns what `faq` means. A body with no headings is the same block holding one titleless item, which is what a callout is:

````markdown
```md:warning
Back up your database **before** running this. It is not reversible.
```
````

**Why not a component reference.** ` ```@Alert ` names *which component renders this* — a rendering decision living in content. `md:warning` names *what the content is* and leaves rendering to the foundation, so the same content survives a change of foundation, and an editor can recognize the concept and offer a surface suited to it.

Read `items` for anything row-shaped, and `sequence` when you do not recognize the tag and want to render it faithfully in order. Both are derived on demand; what gets stored is the prose.

A warning and a note are different concepts, so they are `md:warning` and `md:note` — the fence takes no parameters.

### GitHub alert syntax

The five GitHub alert kinds are a second spelling of the same thing. Authors already know it, so it is accepted as written:

````markdown
> [!NOTE]
> Useful information a reader should notice even when skimming.
````

`NOTE`, `TIP`, `IMPORTANT`, `WARNING` and `CAUTION` become `content.data.note`, `.tip`, `.important`, `.warning` and `.caution` — the same node a ` ```md:<tag> ` fence produces, with the same `{ items, sequence }`. A marker outside that set is left alone and stays an ordinary blockquote.

**Whichever spelling you write is the one you get back.** The two are interchangeable going in and preserved going out, so an editor round trip never rewrites your file into the other form.

Live, so you can see what a foundation does with them:

> [!NOTE]
> This block is authored as a GitHub alert in this page's markdown.

> [!WARNING]
> Rendering is the foundation's decision. Out of the box a concept block is a plain bordered box carrying `data-concept="warning"`; importing `@uniweb/kit/callout-tokens.css` gives the five standard kinds the look above, coloured from the site's own `theme.yml`.

## Dividers as Separators

You can also use horizontal rules (`---`) to separate items instead of headings:

```markdown
# Team

---

![](/sarah.jpg)

**Sarah Chen**

Lead Engineer

---

![](/alex.jpg)

**Alex Rivera**

Designer
```

This creates two items without requiring headings for each.

## Runtime Guarantees

The runtime guarantees all fields exist—you don't need defensive null checks:

```js
// These are always defined (empty string/array if not in content)
const { title, paragraphs, links, images, items, data } = content

// Safe to use directly
paragraphs.forEach((p) => console.log(p))
items.map((item) => <Card {...item} />)
```

## Nesting: Items, Insets, Subsections, and Child Pages

There are four ways to create nested content, each for a different purpose:

| Approach        | What it is                                     | When to use                                                 |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| **Items**       | Headings in one markdown file                  | Repeating content within a single section (cards, features) |
| **Insets**      | `@Component` references in markdown            | Illustrations, charts, widgets placed inline in content     |
| **Block insets** | ` ```@Component ` fences wrapping markdown     | A component that wraps authored content: callouts, disclosures |
| **Subsections** | Separate section files in the same page folder | Complex sections needing their own component type           |
| **Child pages** | Subfolders in `pages/`                         | Separate pages with their own routes                        |

### Items (same section)

Use items for repeating content that shares the same component—feature cards, pricing tiers, FAQ questions. Just use headings after content in your markdown file.

### Section nesting (child sections)

Use section nesting when a parent section type needs children — a Grid arranging cards, a TabGroup holding panels. Mark child files with the `@` prefix and declare relationships with `nest:`:

```
pages/home/
├── page.yml
├── 1-hero.md              # Top-level section
├── 2-features.md          # Parent section (type: Grid)
├── 3-cta.md               # Top-level section
├── @card-speed.md         # Child of features (@ = not top-level)
├── @card-security.md      # Child of features
└── @card-scale.md         # Child of features
```

```yaml
# page.yml
nest:
  features: [card-speed, card-security, card-scale]
```

**Rules:**
- `@`-prefixed files are excluded from the top-level section list
- `nest:` declares parent-child relationships (parent stable name → array of child names)
- Child files **must** use the `@` prefix — the filename and YAML must agree
- `@@` prefix signals deeper nesting (e.g., `@@sub-item.md` for grandchildren)
- Children are ordered by their position in the `nest:` array
- The parent component receives children via `block.childBlocks`

Each child file can specify its own `type:` in frontmatter. Alternatively, `sections:` also supports inline nesting with the same `@` prefix convention (see [page configuration](page-configuration.md)).

### Child pages (separate routes)

Subfolders create entirely separate pages with their own routes:

```
pages/
├── docs/            → /docs
│   ├── page.yml
│   ├── intro.md
│   ├── getting-started/   → /docs/getting-started
│   │   └── ...
│   └── api/               → /docs/api
│       └── ...
└── about/           → /about
```

**Key point:** Each folder is its own page with its own route. Parent and child folders don't conflict—`/docs` and `/docs/getting-started` are separate pages that both exist.

The `index:` setting in `site.yml` only controls which page becomes the root `/` route—it doesn't affect other pages or create any "container" behavior.

> **Note for developers coming from other site frameworks:**
> Uniweb treats every page folder as a distinct route. Nested pages do **not** replace or "take over" their parent folder.
>
> - `/docs` builds to `dist/docs/index.html` _(when prerendering is enabled)_
> - `/docs/getting-started` builds to `dist/docs/getting-started/index.html`
>
> Both pages exist independently—no conflict, no overwriting.

## How Attributes Reach Components

Attributes written in markdown flow through the entire pipeline without filtering. Understanding how they arrive helps you decide what to use and what to ignore.

### Two Channels

Attributes reach components through two distinct channels depending on the content type:

**1. Object properties** — on `images[]`, `links[]`, `icons[]`

When a content author writes `![Logo](./logo.svg){role=icon color=red}`, the parser extracts attributes into an object. Your component receives:

```js
content.icons[0]
// { library: undefined, name: undefined, src: './logo.svg', role: 'icon', color: 'red' }
```

Kit components like `<Icon>`, `<Link>`, and `<Image>` destructure the properties they understand and spread the rest onto the DOM element via `...props`. So `color=red` becomes an HTML attribute on the `<svg>`.

**2. Inline HTML** — in `title`, `paragraphs[]`, `items[].title`, etc.

When attributes appear on inline text or within paragraph content, they're serialized as HTML before reaching the component. For example:

```markdown
This has [important]{.callout color=red} information.
```

Your component receives:

```js
content.paragraphs[0]
// 'This has <span class="callout" style="color: red;">important</span> information.'
```

Kit's `<Text>`, `<H1>`, `<H2>`, and `<P>` components render these strings with `dangerouslySetInnerHTML`, so the span and its attributes appear in the DOM as-is.

### What Survives the Pipeline

Nothing is filtered. Every attribute the content author writes reaches the component:

| Stage | What happens |
|-------|-------------|
| **Markdown** | `{key=value .class #id}` parsed into object |
| **Content reader** | Stored in ProseMirror node attrs |
| **Semantic parser** | Spread onto content objects (images, links) or serialized as HTML (text) |
| **prepare-props** | Passed through — only guarantees structure, doesn't filter |
| **Component** | Receives everything — decides what to use |

Known attributes like `width`, `height`, `loading`, `target`, `role` are extracted by name during parsing and placed in predictable fields. Unknown attributes are preserved alongside them — nothing is discarded.

### The Foundation as Gatekeeper

This creates a deliberate design choice for foundations: how much control do you give content authors?

**Permissive** — spread everything onto the DOM:

```jsx
function FeatureCard({ icon, title, paragraphs }) {
  return (
    <div>
      <Icon {...icon} />  {/* All icon attributes reach the <svg> */}
      <H1 text={title} /> {/* Inline HTML rendered as-is */}
    </div>
  )
}
```

This is what Kit components do by default. Content authors can add `color`, `class`, `data-*`, `aria-*` attributes and they all work. It's a useful escape hatch — a content author can write `![](lu-star){color=var(--primary-600)}` to tint an icon without the foundation needing a `color` param.

**Restrictive** — pick only what you support:

```jsx
function FeatureCard({ icon, title, paragraphs }) {
  // Only pass the attributes this foundation supports
  const { library, name, size } = icon
  return (
    <div>
      <Icon library={library} name={name} size={size} />
      <H1 text={title} />
    </div>
  )
}
```

Here, `color=red` on an icon is silently ignored. The foundation preserves its branding because it controls exactly which properties reach the DOM.

Both are valid. A design-system foundation serving multiple sites might be strict to enforce brand consistency. A personal site foundation might be permissive because the content author and developer are the same person.

### Transforming Inline HTML

Since text fields (`paragraphs`, `title`, etc.) arrive as HTML strings, a foundation that wants to intercept inline attributes needs to parse the HTML. `DOMParser` works for this:

```jsx
function StyledParagraph({ text }) {
  // Transform inline attributes before rendering
  const transformed = useMemo(() => {
    const doc = new DOMParser().parseFromString(text, 'text/html')

    // Example: remap color values to design tokens
    doc.querySelectorAll('span[style]').forEach(span => {
      const color = span.style.color
      if (color && !color.startsWith('var(')) {
        // Replace raw colors with the nearest design token
        span.style.color = `var(--primary-600)`
      }
    })

    // Example: strip classes the foundation doesn't support
    doc.querySelectorAll('[class]').forEach(el => {
      const allowed = ['highlight', 'muted', 'callout']
      el.className = [...el.classList].filter(c => allowed.includes(c)).join(' ')
    })

    return doc.body.innerHTML
  }, [text])

  return <p dangerouslySetInnerHTML={{ __html: transformed }} />
}
```

This is an advanced technique — most foundations won't need it. But it's available when a foundation needs to enforce constraints on inline styling while still allowing authors to use the attribute syntax.

## See Also

- [Page Configuration](./page-configuration.md) — page.yml options for sections and ordering
- [Navigation Patterns](./navigation-patterns.md) — Building navbars, menus, and sidebars
- [Linking](../authoring/linking.md) — The `page:` protocol for stable internal links
- [Component Metadata](./component-metadata.md) — Documenting what content your component expects
