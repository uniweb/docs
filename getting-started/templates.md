# Templates

Uniweb projects are created from templates using `uniweb create`. Templates provide the initial project structure, components, and sample content.

---

## Built-in Templates

Built-in templates ship with the CLI and work offline.

### Starter (Default)

A workspace with a foundation, site, and sample content. The recommended starting point — two commands to a dev server.

```
my-project/
├── package.json              # Workspace root
├── pnpm-workspace.yaml
├── src/                      # The foundation package (name: "src")
│   ├── package.json
│   ├── vite.config.js
│   ├── main.js
│   └── sections/
└── site/
    ├── package.json
    ├── vite.config.js
    ├── site.yml              # foundation: src
    ├── entry.js
    └── pages/
```

```bash
pnpm create uniweb my-site
```

### None

A workspace with a foundation and site but no content. Use this when you're migrating an existing project or want to start from scratch without starter content.

```bash
pnpm create uniweb my-site --template none
```

### Blank Workspace

An empty workspace with no packages. Use `uniweb add` to grow it incrementally — add projects, foundations, sites, and extensions one at a time.

```bash
pnpm create uniweb my-workspace --blank
```

This is the starting point for multi-site workspaces, co-located projects, and any layout that doesn't fit the default single foundation + site structure. See [Project Structures](../development/project-structures) for the layout recipes, and [CLI Commands](../reference/cli-commands) for the `add` command.

> **Backward compatibility:** `--template blank` still works as an alias for `--blank`.

---

## Official Templates

Feature-rich templates with real components and sample content. **[View all demos](https://uniweb.github.io/templates/)**

### Marketing

[**Live Demo**](https://uniweb.github.io/templates/marketing/) · `pnpm create uniweb my-site --template marketing`

**Includes:** Hero, Features, Pricing, Testimonials, CTA, FAQ, Stats, LogoCloud, Video, Gallery, Team

Perfect for product launches, SaaS websites, and business landing pages.

**Tailwind v3 variant:** Use `--variant tailwind3` if your project requires Tailwind CSS v3 instead of v4:

```bash
pnpm create uniweb my-site --template marketing --variant tailwind3
```

### Academic

[**Live Demo**](https://uniweb.github.io/templates/academic/) · `pnpm create uniweb my-site --template academic`

**Includes:** ProfileHero, PublicationList, ResearchAreas, TeamGrid, Timeline, ContactCard, Navbar, Footer

Perfect for researcher portfolios, lab websites, and academic department sites.

### Docs

[**Live Demo**](https://uniweb.github.io/templates/docs/) · `pnpm create uniweb my-site --template docs`

**Includes:** Header, LeftPanel, DocSection, CodeBlock, Footer

Perfect for technical documentation, guides, and API references.

### International

[**Live Demo**](https://uniweb.github.io/templates/international/) · `pnpm create uniweb my-site --template international`

**Includes:** Hero, Features, Team, CTA, Header (with language switcher), Footer (with language links)

**Languages:** English (default), Spanish, French

A multilingual business site demonstrating Uniweb's i18n capabilities. Includes pre-configured translation files and a complete localization workflow:

```bash
uniweb i18n extract   # Extract translatable strings
uniweb i18n status    # Check translation coverage
uniweb build          # Generates dist/es/, dist/fr/
```

Perfect for international businesses and learning the i18n workflow.

---

## External Templates

Use templates from npm or GitHub:

```bash
# npm package
pnpm create uniweb my-site --template @myorg/template-name

# GitHub repository
pnpm create uniweb my-site --template github:user/repo

# GitHub with specific branch/tag
pnpm create uniweb my-site --template github:user/repo#v1.0.0

# Full GitHub URL
pnpm create uniweb my-site --template https://github.com/user/repo
```

---

## See Also

- [CLI Commands](../reference/cli-commands) — Full `create` command reference
- [Quickstart](./quickstart) — Create your first site step by step
