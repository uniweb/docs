# About This Documentation

This documentation site is built with Uniweb. That might sound obvious, but the way it's built demonstrates several patterns worth understanding — patterns you can apply to your own projects.

## Content lives in its own repository

The markdown files you're reading exist in a standalone Git repository with nothing else in it — no build configuration, no React components, no package.json. Just folders and markdown files.

```
uniweb/docs/                  # Public repo — content only
├── getting-started/
│   ├── folder.yml
│   ├── what-is-uniweb.md
│   ├── quickstart.md
│   └── about-this-docs.md   # ← This file
├── authoring/
├── development/
├── reference/
└── folder.yml
```

The site that renders this content lives elsewhere — in a private monorepo that contains the foundation (React components), the site configuration (theming, layout), and other Proximify projects.

## Why separate content from code?

This separation has practical benefits:

**Different access levels.** The content repository is public, so anyone can read the raw markdown, suggest improvements, or reference specific files. The code repository stays private, containing proprietary components and internal configuration.

**AI-friendly references.** Files like `CLAUDE.md` and `AGENTS.md` can link directly to documentation pages in the public repo. AI assistants can read the source markdown without needing access to the build system or rendered site.

**Independent versioning.** Content changes don't require code deployments. Typo fixes, new pages, and reorganizations happen in the docs repo alone. The site rebuilds automatically.

**Cleaner collaboration.** Content authors work in a minimal environment — just markdown and folder structure. No risk of breaking builds or touching code they don't understand.

## How it connects

The site's `site.yml` points to the content repository using the `paths.pages` setting:

```yaml
# site.yml (in the private web repo)
foundation: docs
paths:
  pages: ../../../docs    # Points to the public docs repo
```

This path resolution is relative to the site directory. The site reads pages from one location while the foundation renders them from another. From the user's perspective, it's one coherent website.

## The foundation provides the look

The docs foundation — the React components that render these pages — knows nothing about the actual content. It provides:

- A `DocPage` section type for article-style content
- Navigation components for the sidebar
- Code syntax highlighting via Shiki
- Search functionality
- Responsive layout and theming

The same foundation could render entirely different documentation — a different product, a different company, different content structure — just by pointing to a different `paths.pages` location.

## What you don't see

This documentation uses the simplest Uniweb mode: each markdown file becomes one section on one page, rendered by the default section type. No frontmatter needed beyond folder configuration.

But the full capability is available when needed:

**Multi-section pages.** Any page can include multiple markdown files, each rendered by a different section type. A landing page might combine a Hero, Features, Testimonials, and CTA — all from separate markdown files, all rendered by specialized components.

**Custom section types.** The `type:` frontmatter can specify any section type the foundation provides. A complex interactive component is just a frontmatter change away from a simple prose article.

**Component composition.** Foundations can define child section types that compose within parent sections. Tabs containing Tab sections, Accordions containing Accordion items — the full React composition model, driven by content structure.

We don't use these features heavily in this documentation because prose articles don't need them. The point is that the same architecture scales from simple to complex without changing tools or mental models.

## Internationalization

The content repository contains source language only (English). Translations would live in a separate `locales/` directory in the site, keyed to content hashes. This means:

- Translators work with extracted strings, not raw markdown
- Source content can change without invalidating all translations
- Different languages can have different completeness levels
- The same translations apply if we reorganize or rename files

We haven't translated this documentation yet. But the architecture supports it without restructuring anything.

## Less structure, not more

A common instinct when organizing documentation is to add infrastructure: build scripts, validation, schema files, elaborate folder hierarchies. This documentation goes the other direction.

The content repo has **no build step**. No dependencies. No configuration beyond folder titles and ordering. You can read the raw markdown in any text editor, GitHub's web interface, or AI chat contexts.

The complexity lives in the foundation, where it belongs. Components handle syntax highlighting, navigation generation, responsive design. Content stays simple. Code absorbs the complexity.

This is the CCA pattern in practice: clear separation of concerns, with each layer doing what it's good at.
