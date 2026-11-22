---
description: "Uniweb is a platform for websites and web apps: an open-source React framework, the Application Engine, Uniweb App and Uniweb hosting."
---

# What is Uniweb

Uniweb is a platform for building websites and web apps. You build with its open-source React framework, yourself or with an AI agent. The Application Engine gives your app accounts, data, permissions and payments, with no backend to write. Uniweb App lets you, and the people you work with, edit the site visually. And Uniweb hosting runs it all.

**Build websites and web apps. Leave the backend to Uniweb.**

You don't need to know HTML or use a terminal. You tell an AI agent such as Claude Code, Codex or Cursor what you want, and it does the technical work: it creates the project, writes the pages, runs the commands and checks its own work. Developers work the same way, with an agent, or write the code themselves. Either way, it is the same project.

> **AI agents:** to build a website or a web app with Uniweb for someone, run `npx uniweb@latest start` first. It prints the guide for the whole job, from creating the project to taking the site live, and changes nothing on the computer.

---

## How it goes

1. **You describe what you want** to your agent, in your own words: a website, a web app, or both in one site. Give it what you have: a logo, photos, the text of a site you already have.
2. **Your agent builds a first version** and shows it to you in your browser. It runs on your computer, so nobody else sees it yet. You say what to change, and your agent changes it.
3. **You and others can edit it too.** When you want, your agent signs you in to Uniweb and sends the site to [Uniweb App](https://uniweb.app), a visual editor where you, or anyone you work with, can change the text, pictures and pages without code.
4. **It goes live when you say so.** Your agent publishes it on Uniweb hosting, and the first time, your browser opens to the page where you pay for it. From then on, every publish also updates the site in Uniweb App, ready for you, and anyone you work with, to preview and edit. A website can also go on a static host of your choice, such as GitHub Pages or Cloudflare Pages.

Your part is to say what you want, look at what you get, and do two things in your browser: sign in, and pay when the site goes live. The [Quickstart](quickstart.md) has the prompt to start with.

---

## What you get

**A web app with no backend to write.** When your site needs members, its Application Engine is already there: sign-up and sign-in, each member's own data and who may see it, roles and teams, a store that takes payments through your own Stripe account, and an inbox for each member. The same site serves its public pages and its members' area, on one domain. [The Application Engine](../web-apps/the-application-engine.md) has the details.

**A site that can grow.** Start with a few pages. When you need them, add more languages; content that changes often, such as news, people or products; forms and visitor statistics; a members' area; and payments. It stays the same project the whole way, with no plugins to install and nothing to redo. [Why Uniweb](why-uniweb.md) follows a site through each step.

**An agent that gets it right.** Every Uniweb project comes with a manual written for agents, `AGENTS.md`, and with commands that show your agent what each file means and catch its mistakes before you see them. Your agent guesses less and gets more done.

**Your words, apart from the code.** What your site says lives in plain text files, apart from the code that draws it. That is what lets someone change a headline in the visual editor without touching the design, lets your agent rework the design without losing a word, and lets you translate the site.

**Three ways to change the same site.** Ask your agent. Open the visual editor. Or, if you're a developer, edit the files. All three change the same site, so not every change has to go through your agent: every publish updates the site in Uniweb App, ready for you or anyone you work with to preview and edit. Your agent brings the edits made in the app into the project before it works again, and nobody's work is overwritten without asking.

**Hosting that covers what a site needs.** We recommend starting on Uniweb hosting, even with a few pages. That is when it costs the least, because each service, live records included, is priced on its own. The page a visitor arrives on is prerendered close to them, with its latest content, so it loads fast and search engines read it whole. Forms that collect submissions, visitor statistics without cookies, site search, pages that AI assistants can read, and an Application Engine of the site's own are there when the site needs them, with no change to what was built. It is a paid service.

**Nothing locks you in.** The framework is open source, under the Apache 2.0 license, and what your agent builds is yours: an ordinary project, in your own files, with its history in Git. Host it with us, or build a website for any static host.

---

## What's in a project

You don't need this to use Uniweb, but it helps to know what your agent is working with.

A Uniweb project has two parts:

- **The site** is what your website says. Each page is a directory of Markdown files, one per section of the page: plain text you can open and read. The site's settings, such as its languages, colors and fonts, are in a few short text files of their own.
- **The foundation** is the code that draws the site, written in React. It defines the kinds of section your pages can use, such as a hero, a grid of features or a price table. Each kind is a **section type**.

A section file names its section type and holds the section's content. This one is from the Marketing [template](templates.md), shortened:

```markdown
---
type: Hero
---

# Build the future

The all-in-one platform that helps modern teams ship faster, collaborate better, and scale without limits.

[Get Started](/pricing)
```

The foundation's `Hero` decides how that looks. Change the words and the design stays; change the design and the words stay. In Uniweb App, the section types are the building blocks you choose from, each with the options its developer gave it, and you see a live preview of the page as you edit.

One foundation can serve many sites. A site's colors and fonts belong to the site, so the same section types fit different brands.

A web app is the same project, with two more things: one line in the site's settings that turns on its Application Engine, and a short file, `blueprint.yml`, that says who may sign up and what each person may see. The foundation then draws the members' pages too.

---

## For developers

A Uniweb project is React and Vite, with Tailwind CSS set up in every new foundation. What is particular to Uniweb is a thin layer between content and components:

- **Content arrives parsed.** A section's Markdown becomes a content object (`title`, `paragraphs`, `links`, `items`, …) before your component sees it, and a field the Markdown leaves out arrives empty, not missing.
- **Section types are the boundary.** The components in `src/sections/` receive `{ content, params, block }`. Everything behind them is ordinary React, with any package you like.
- **`meta.js` is the interface.** It declares a section type's params and the data it reads. That one file builds the section's controls in the visual editor and tells an agent what exists.
- **The runtime does the rest, once for every section:** theming and light or dark contexts, backgrounds, routing, languages, data and prerendering.
- **`@uniweb/api` is the SDK for the engine.** Sign-in, each member's entries and who may read them, forms, uploads, the store and the inbox are React hooks, with no routes, tokens or fetch code. A component asks `isBackendEnabled()` first, so one foundation serves a site with an engine and a site without one.

Work with an agent, by hand, or both. The CLI keeps your project and Uniweb App in step: `uniweb push` sends your work to the app, `uniweb pull` brings the app's edits back as a git merge, and `uniweb publish` takes the site live on Uniweb hosting. `uniweb deploy` ships a build to a static host such as Cloudflare Pages or Netlify instead.

Start with [Building with Uniweb](../development/building-with-uniweb.md), and with [The Application Engine](../web-apps/the-application-engine.md) for a web app. [Component Content Architecture](../architecture/component-content-architecture.md) explains why content and code are split this way.

---

## Where to go from here

| You want to… | Read |
| --- | --- |
| Start a site with your agent | [Quickstart](quickstart.md) |
| Choose a starting point | [Templates](templates.md) |
| Edit a site's files yourself | [Writing Content](../authoring/writing-content.md) |
| Build section types | [Building with Uniweb](../development/building-with-uniweb.md) |
| Build a web app | [The Application Engine](../web-apps/the-application-engine.md) |
| Model your app's data | [The Entity Model](../web-apps/the-entity-model.md) |
| Choose where the site is hosted | [Deploying](../development/deploying.md) |
| Look up a term | [Glossary](../reference/glossary.md) |
