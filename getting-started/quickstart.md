# Quickstart

Start a Uniweb site by giving your AI agent one prompt: it builds the site with you and takes it live when you're ready. Developers can also create the project themselves, in a few commands.

---

## With your agent

### What you need

- **An AI agent that can run commands on your computer,** such as Claude Code, Codex or Cursor. An assistant that can only chat can't build the project.
- **A directory for the site,** a folder on your computer. It can be empty, or hold what you already have: your logo, photos, the text of your current site.

Your agent checks for the rest and installs what's missing: Node.js 22.12 or later, and Git. On a Mac, a window may offer to install Apple's developer tools during that check: accept it.

### Give it the prompt

Open your agent in that directory and paste this, with your own description on the last line:

```text
Build me a website with Uniweb.
Start with `npx uniweb@latest start`

The site is for: [describe your site]
```

Describe the site as you would to a person: who it is for, what it should say, which pages you have in mind. To start from one of the [templates](templates.md), name it in the command: `npx uniweb@latest start --template blog`.

### What happens next

1. Your agent runs `uniweb start`, which prints Uniweb's guide for the job and changes nothing.
2. It creates the project, reads the manual that comes with it (`AGENTS.md`), and builds a first version from your description and your files. It says which parts are placeholders rather than inventing facts about you.
3. It shows you the site in your browser. The site runs on your computer, so nobody else can see it.
4. You say what to change. Your agent asks only about what it can't decide, and saves each step that works (a Git commit), so either of you can go back to it.
5. When you want to edit the site yourself or show it to someone, your agent signs you in to Uniweb: your browser opens, and you sign in, or sign up if you're new. Then it sends the site to the [Uniweb app](https://uniweb.app), where you can edit it visually. It isn't public yet.
6. When you say so, your agent takes the site live on Uniweb hosting. The first time, your browser opens to the page where you pay for hosting, and your agent finishes once you have. From then on, every publish also updates the site in the Uniweb app, so you can preview and edit it there at any time, without waiting for your agent.

Your part: say what you want, look at what you get, and do two things in your browser: sign in, and pay when the site goes live.

We recommend Uniweb hosting even for a few pages: that is when it costs the least, and the site is ready to grow with no changes. To host it yourself instead, ask your agent to put it on a static host, such as GitHub Pages or Cloudflare Pages (see [Go live](#go-live)).

### Coming back later

The project stays in its directory. To change the site later, open your agent there and ask, starting with `npx uniweb@latest start` again. In a project, the guide has your agent check first whether the site was changed in the Uniweb app (`uniweb status`), so edits made there are kept. You can also edit the site in the app at any time, and publish it from there.

---

## By hand

The same steps, for developers who want to run them. Your agent runs these commands too.

### Create a project

You need Node.js 22.12 or later. The commands below use pnpm; with npm, run `npm install`, `npm run dev` and `npm run build` instead.

```bash
npx uniweb@latest create my-site --template marketing
cd my-site
pnpm install
pnpm dev
```

`pnpm dev` starts a local server and prints the address to open. You'll see the Marketing template's site, with a home page, a features page and a pricing page.

```
my-site/
├── AGENTS.md         # the project's manual, for agents and for you
├── site/             # what the site says
│   ├── pages/        # each directory a page, each .md file a section
│   ├── layout/       # the header and footer
│   ├── site.yml      # the site's settings
│   └── theme.yml     # colors and fonts
└── src/              # the foundation: React components that draw the site
    └── sections/     # one section type each
```

### How a page is made

A section file names its section type and holds the section's content. Here is the Marketing template's `site/pages/home/hero.md`, shortened:

```markdown
---
type: Hero
theme: dark
---

#> Introducing Acme

# Build the future

The all-in-one platform that helps modern teams ship faster, collaborate better, and scale without limits.

[Get Started](/pricing)
[Learn More](/features)
```

- The frontmatter, between the `---` lines, names the section type, `Hero`, and sets how the section is placed: `theme: dark` gives it the site's dark colors.
- The rest is content. Before any component sees it, it is parsed into fields: the `#>` line becomes `pretitle`, the heading `title`, the paragraph `paragraphs[0]`, and the links `links`.

The `Hero` section type, in `src/sections/Hero/index.jsx`, receives those fields:

```jsx
export default function Hero({ content, block }) {
  const { title, pretitle, paragraphs, links, images } = content
  // …
}
```

To see what any section file parses to, run `npx uniweb inspect site/pages/home/hero.md`.

### Change it

Edit the heading in `hero.md` and save: the page in your browser updates. Change a class in the `Hero` component and save: the page updates again.

### Add a page

Each directory under `site/pages/` is a page: `site/pages/contact/` is the page at `/contact`. Create that directory, with a `page.yml` for its title:

```yaml
title: Contact us
```

Then give the page two sections. `site/pages/contact/1-intro.md`:

```markdown
---
type: Hero
---

# Contact us

We'd love to hear from you.

[Email us](mailto:hello@example.com)
```

`site/pages/contact/2-details.md`:

```markdown
---
type: Features
---

# How to reach us

### Email
hello@example.com

### Office
Monday to Friday, 9 to 5.
```

Open `/contact` on the local server. The number at the start of a file's name orders the sections on a page: `1-` comes before `2-`, and a file without a number comes after the numbered ones. A page with one section needs no number.

### Build

```bash
pnpm build
```

This builds the foundation, then the site. The site lands in `site/dist/`: a static site, with each page prerendered to HTML (`contact/index.html` for `/contact`).

---

## Go live

**On Uniweb hosting, which we recommend.** It is the host with the full set of hosting features: the Uniweb app, where you and others edit the site; pages prerendered with their live data; and forms, analytics and accounts when the site needs them. It is a paid service. A site of static pages costs the least, because each service, live records included, is priced on its own, so we recommend it from the start: every publish also updates the site in the Uniweb app, ready for previewing and editing, and the site can grow with no changes.

```bash
npx uniweb login      # once
npx uniweb publish
```

`publish` brings the foundation along, sends the content and takes the site live. The first time a site goes live, it opens your browser to pay for its hosting. See [Deploying](../development/deploying.md#uniweb-hosting--recommended) for what it includes.

**On a static host.** `npx uniweb deploy` builds the site and uploads it to GitHub Pages, Cloudflare Pages, Netlify, Vercel or S3 + CloudFront, asking where the first time. `npx uniweb export` builds it for any other host, for you to upload. On a static host, edits made in the Uniweb app reach the site through your project: a pull, then a build.

---

## Next steps

| You want to… | Read |
| --- | --- |
| Choose a template | [Templates](templates.md) |
| Understand how Markdown becomes content | [Content Structure](../reference/content-structure.md) |
| Build your own section types | [Building with Uniweb](../development/building-with-uniweb.md) |
| Declare a section type's params and data | [Component Metadata](../reference/component-metadata.md) |
| Configure the site | [Site Configuration](../reference/site-configuration.md) |
| Add languages | [Internationalization](../development/internationalization.md) |
| Load data | [Data Fetching](../reference/data-fetching.md) |
| Make a page for each record | [Parametric Pages](../reference/dynamic-routes.md) |
