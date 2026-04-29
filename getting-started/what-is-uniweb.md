# What is Uniweb

Uniweb is a framework for building websites where content and code are cleanly separated. Content authors write markdown. Developers build React components. Neither can break the other's work.

## The idea

Most React sites tangle content into JSX — strings in components, data in state, layout assumptions everywhere. Changing a heading means editing code. Adding a section means touching a build. This works until someone who isn't a developer needs to update the site.

Uniweb solves this with a **Component Content Architecture** (CCA). Content lives in markdown files. Components live in a React project. A thin runtime connects them: markdown frontmatter names a component, the component receives parsed content as props.

```
site/pages/home/hero.md          src/sections/Hero/index.jsx
┌────────────────────────┐       ┌──────────────────────────────────┐
│ ---                    │       │ function Hero({ content }) {     │
│ type: Hero             │──────▶│   return (                       │
│ theme: dark            │       │     <h1>{content.title}</h1>     │
│ ---                    │       │     <p>{content.subtitle}</p>    │
│ # Welcome to Our Site  │       │   )                              │
│ ## Build something     │       │ }                                │
│ great today            │       │                                  │
└────────────────────────┘       └──────────────────────────────────┘
```

The content author controls *what* appears. The developer controls *how* it looks. They work in separate files, in separate packages, with a clear interface between them.

## Two packages, two audiences

A Uniweb project is a workspace — a directory that contains two packages:

- **Foundation** — React components that render the content. This is where developers work.
- **Site** — content, configuration, and pages. Written in markdown and YAML. This is where content authors work.

```
my-project/
├── site/                # Content (markdown, YAML)
│   ├── pages/           # Each folder is a page
│   ├── layout/          # Header, footer, sidebar
│   ├── site.yml         # Site configuration
│   └── theme.yml        # Colors, fonts, appearance
└── src/                 # Code (React, JSX) — the foundation
    └── sections/        # Components that render content
```

A site is pure content; a foundation is the site's source code — that's why it lives in `src/`.

The site and foundation are independent. The same foundation can serve multiple sites with different content and branding. A site can swap foundations without touching its content.

## What content authors do

Authors write markdown files. Each file is a section on a page. Headings, paragraphs, images, and links become structured content that components receive as props.

```markdown
# Features

## Everything you need

### Fast builds
Vite-powered development with hot reload.

### Simple content
Write markdown, see it rendered.

### Clean separation
Content and code never tangle.
```

The H1 becomes the title, H2 the subtitle, and H3s become repeating items — a features grid, a FAQ, a team list. The component decides the visual treatment. The author decides the content.

Authors also control theming (`theme.yml`), page structure (`site.yml`), and layout — all without touching code.

## What developers do

Developers build React components in the foundation's `src/sections/` directory. Each component is a **section type** that content authors can reference from markdown.

```jsx
function Features({ content }) {
  const { title, subtitle, items } = content

  return (
    <section>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div className="grid grid-cols-3 gap-8">
        {items.map((item, i) => (
          <div key={i}>
            <h3>{item.title}</h3>
            <p>{item.paragraphs[0]}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

Components receive guaranteed content structures — `title` is always a string, `items` is always an array. No null checks needed. The framework handles parsing, defaults, and content validation.

Beyond components, developers can customize layouts, theming, data fetching, and search — all through standard React and Vite patterns.

## Where to go from here

**Want to build a site?** Start with the [Quickstart](quickstart) — you'll have a running project in minutes.

**Writing content for an existing site?** Go to [Writing Content](../authoring/writing-content) for the complete guide to markdown authoring.

**Building components?** After the Quickstart, head to [Building with Uniweb](../development/building-with-uniweb) for the developer perspective.

**Looking up a specific feature?** The [Reference](../reference/site-configuration) section has configuration details, API docs, and feature specifications.

**Unfamiliar term?** Check the [Glossary](../reference/glossary) for quick definitions of workspace, foundation, section type, and other Uniweb concepts.
