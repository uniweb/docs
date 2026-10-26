# What is Uniweb

Uniweb is an open-source React framework and a connected visual authoring platform. Developers build real React components, schemas, and content structures in a normal codebase. Those definitions become the vocabulary authors use, in the Uniweb app, to create pages, manage content, and work with structured data.

**Developers define the vocabulary. Authors compose with it. Uniweb keeps both sides in sync.**

## Two interfaces to the same website

**Traditional**

```text
developer builds → hands off → CMS users edit
```

**Uniweb**

```text
developer project ⇄ Uniweb ⇄ author workspace
       ↑                         ↑
       └──── both keep working ──┘
```

A Uniweb project and the authors' workspace are two interfaces to one website. Developers keep their editor, terminal, git history, and deployment workflow. Authors work in the visual app, where their changes appear live, and never need to think about synchronization. The `uniweb` CLI is the bridge between the two.

| Developers | Authors |
| --- | --- |
| React components | Visual components |
| Schemas and configuration | Forms and structured records |
| Vite and local development | Live visual editing |
| Files and git | Content and composition |
| `push` · `pull` · `sync` · `publish` | Changes appear live |

The author doesn't manipulate JSX, HTML, or arbitrary layout primitives, and the developer doesn't build a separate editing UI for every section of the site. **You build the components. Uniweb builds the authoring experience.**

## The idea: content and code, cleanly separated

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

That separation is also what makes the second interface possible. Because content never lives inside components, authors can edit it visually while developers change the components, and neither breaks the other's work.

## Two packages, two audiences

A Uniweb project is a workspace — a directory that contains two packages:

- **Foundation** — React components that render the content. This is where developers work.
- **Site** — content, configuration, and pages. Written in markdown and YAML. This is where content authors work, in files or in the Uniweb app.

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

In files, authors write markdown. Each file is a section on a page. Headings, paragraphs, images, and links become structured content that components receive as props.

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

In the Uniweb app, authors compose the same sections visually: they pick from the foundation's section types, edit their content, and set the options each section type offers, with a live preview. Either way, authors also control theming (`theme.yml`), page structure (`site.yml`), and layout — all without touching code.

## What developers do

Developers build React components in the foundation's `src/sections/` directory. Each component is a **section type** that content authors can reference from markdown, or pick in the app.

```jsx
function Features({ content }) {
  const { title, subtitle, items } = content

  return (
    <div className="mx-auto max-w-6xl px-6">
      <h2 className="text-3xl font-bold text-heading">{title}</h2>
      <p className="mt-2 text-body">{subtitle}</p>
      <div className="mt-10 grid grid-cols-3 gap-8">
        {items.map((item, i) => (
          <div key={i}>
            <h3 className="font-semibold text-heading">{item.title}</h3>
            <p className="text-body">{item.paragraphs[0]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Components receive a guaranteed content structure — `items` is always an array, and a field the markdown leaves out arrives empty rather than missing. No null checks needed. The runtime also wraps each section in its `<section>` element and applies its theme context, so classes like `text-heading` and `text-body` take their colors from the site's theme.

Beyond components, developers can customize layouts, theming, data fetching, and search — all through standard React and Vite patterns. A section type can also declare the structured data it shows, by schema, and authors then manage those records as forms in the app.

## Connect the authoring app

**Start with a normal project. Connect the authoring environment when you want it.**

```bash
# Create a project
npx uniweb@latest create

# Sign in when you want visual authoring
pnpm uniweb login

# Sync the project with the author workspace
pnpm uniweb sync
```

### The CLI is the bridge between the two workflows

| Command | What it does |
| --- | --- |
| `pnpm uniweb push` | Push local components, schemas, and content to the Uniweb app. |
| `pnpm uniweb pull` | Bring authored content back into the local project, as a git merge. |
| `pnpm uniweb sync` | Synchronize the local project and the app: take the authors' edits and your teammates' commits, then push yours. |
| `pnpm uniweb publish` | Push to the app and take the site live on Uniweb hosting. |

Edits to different sections combine. When the same section changed on both sides, `pull` stops at a git conflict for you to settle, so neither edit is lost.

The framework can also be used on its own: content in markdown, built and deployed like any Vite site, to any static host. Connecting the app doesn't move the project into it — the codebase remains the developer environment, and the app becomes the author environment.

## Where to go from here

**Want to build a site?** Start with the [Quickstart](quickstart) — you'll have a running project in minutes.

**Writing content for an existing site?** Go to [Writing Content](../authoring/writing-content) for the complete guide to markdown authoring.

**Building components?** After the Quickstart, head to [Building with Uniweb](../development/building-with-uniweb) for the developer perspective.

**Looking up a specific feature?** The [Reference](../reference/site-configuration) section has configuration details, API docs, and feature specifications.

**Unfamiliar term?** Check the [Glossary](../reference/glossary) for quick definitions of workspace, foundation, section type, and other Uniweb concepts.
