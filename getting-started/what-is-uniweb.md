---
description: "Uniweb is a platform for the whole life of a website or web app: build it with your AI agent or by hand, edit it with others, take it live, grow it with its business, and promote it."
---

# What is Uniweb

Uniweb is a platform for the whole life of a website or a web app. You build a site, with an AI agent or by hand, and edit it with the people you work with. It goes live, and it grows with the business behind it: more languages, content that changes often, forms, then a members' area and payments, which make it a web app as well. And you promote it, and see what each effort brought.

Usually, each of those takes a separate tool. On Uniweb they are parts of one platform, and the site stays the same project the whole way, so nothing built at one stage has to be redone at the next.

**Build websites and web apps. Leave the backend to Uniweb.**

> **AI agents:** to build a website or a web app with Uniweb for someone, run `npx uniweb@latest start` first. It prints the guide for the whole job, from creating the project to taking the site live, and changes nothing on the computer.

---

## A site's life

1. **You build it.** Tell an AI agent such as Claude Code, Codex or Cursor what you want, and it builds the site and shows it to you in your browser. Developers can also write the code themselves. Either way, what you get is an ordinary project in your own files, with its history in Git.
2. **You edit it, with others.** In [Uniweb App](https://uniweb.app), a visual editor, you or anyone you work with can change the site's text, pictures and pages without code. Those edits come back to the project, and nobody's work is overwritten without asking.
3. **It goes live.** You publish it on Uniweb hosting, a paid service, with `uniweb publish` or from Uniweb App, and the first time, you pay for it in your browser. The page a visitor arrives on is prerendered close to them, so it loads fast and search engines read it whole. A website can also go on a static host, such as GitHub Pages.
4. **The website grows with the business.** Its pages show static content, published with the site, and dynamic content, such as news and events, that others keep up to date and the live site shows as it changes. Whoever edits the site composes these pages from its section types, in Uniweb App or in the files. Languages, forms, visitor statistics and search are added as the business needs them.
5. **It becomes a web app.** When the business needs members, the site adds a members' area, on the same domain and in the same project. Its pages are not composed: your agent or a developer designs and builds them, like the screens of any React app. The Application Engine and its SDK take on the work every web app repeats: sign-in, each member's data and who may see it, payments, and the code that talks to the backend.
6. **You promote it.** Promote, in Uniweb App, takes you through getting the site found by search engines, posting on social networks and running ads, and shows what each one brought.

These stages don't end. A site keeps changing, and each change is made the same way: by your agent, in Uniweb App or in the files, then published. A site can also be a web app from its first day. [How a Site Grows](how-a-site-grows.md) follows one site through each stage.

---

## The parts of Uniweb

- **The framework** is what every site is built with: an open-source React framework and its command-line tool, `uniweb`, under the Apache 2.0 license.
- **Uniweb App**, at uniweb.app, is where you work on a site in the browser: you edit it visually, publish it and pay for it, see its statistics and promote it.
- **Uniweb hosting** runs the site, and the services a site turns on as it grows: content that updates live, forms and visitor statistics.
- **The Application Engine** is the backend a web app needs, with no backend code to write: accounts, each member's data and who may see it, roles and teams, a store that takes payments through your own Stripe account, and an inbox for each member. The site's owner manages what every web app has, such as roles, coupons and the Stripe account, in the engine's **Solution Owner Console**. On Uniweb hosting, each web app gets an engine of its own, with its own PostgreSQL database.

Of the four, only the framework is required. A website needs no engine, and a web app needs no visual editing: its members' area can be entirely your own design.

---

## What's in a project

This is what your agent, or a developer, works with, and why a site can change so much without being rebuilt. A Uniweb project has two parts:

- **The site** is what your website says. Each page is made of Markdown files, one per section of the page: plain text you can open and read. A few short settings files hold the rest, such as the site's languages, colors and fonts.
- **The foundation** is the React code that draws the site. It defines the kinds of section the pages can use, such as a hero, a grid of features or a price table. Each kind is a **section type**.

A section file names its section type and holds the section's content. This one is from the Marketing [template](templates.md), shortened:

```markdown
---
type: Hero
---

# Build the future

The all-in-one platform that helps modern teams ship faster, collaborate better, and scale without limits.

[Get Started](/pricing)
```

The foundation's `Hero` decides how that looks. Change the words and the design stays; change the design and the words stay. In Uniweb App, the section types are the building blocks people compose pages with, each with the options its developer gave it. [Why Uniweb](why-uniweb.md) explains what else this split makes possible.

### The screens of a web app

The members' pages of a web app hold sections too, but their section types are screens of the app, written in React: a member's courses, a lesson player, an editor for the staff. Nobody composes those pages in Uniweb App. What a screen shows comes from the Application Engine, through the SDK, `@uniweb/api`, and its section file holds only the screen's own words:

```markdown
---
type: MyCourses
---

# My courses

Pick up where you left off, or start something new.
```

The heading and the line under it are content, which can be edited and translated like any other. The courses are the member's own, and `MyCourses` reads them from the engine.

Besides its screens, a web app turns on its engine with an entry in the site's settings, declares the kinds of thing it holds, such as a course, a lesson and a submission, as data schemas, and says in a short file, `blueprint.yml`, who may sign up and what each person may see. Its own data, such as the courses its instructors write, is created in its own screens and kept in the engine. [Building a Solution](../web-apps/building-a-solution.md) puts the parts together.

---

## How you work on a site

**With an AI agent,** you don't need to know HTML or use a terminal. Every project comes with a manual written for agents, `AGENTS.md`, and with commands that catch an agent's mistakes before you see them. You say what you want, look at what you get, and do two things in your browser: sign in, and pay when the site goes live. The [Quickstart](quickstart.md) has the prompt to start with.

**By hand,** a project is React and Vite, with Tailwind CSS set up in every new foundation. A section type is a React component that receives its section's Markdown already parsed, as `content`, with its `params` and `block`. Its `meta.js` declares its options, which become its controls in Uniweb App. The runtime does the rest for every site: theming, routing, languages, data and prerendering. In a web app, components reach the engine through the SDK's React hooks, with no routes, tokens or fetch code. Start with [Building with Uniweb](../development/building-with-uniweb.md), and with [The Application Engine](../web-apps/the-application-engine.md) for a web app.

An agent and a developer can work on the same project, and the people editing in Uniweb App work on the same site: `uniweb pull` brings their edits into the files.

---

## What's yours, and what runs on Uniweb

The framework is open source, and the project is ordinary files: React code, the site's words in Markdown and its settings in YAML, with its history in Git. A website can be built for any static host, with `uniweb deploy` or `uniweb export`.

Live content, forms, visitor statistics and Promote are services of Uniweb hosting and Uniweb App; on a static host, a site uses what that host or another service offers instead. A web app's members' data is kept in its Application Engine, and its components reach the engine through the SDK, so moving a web app to another platform means replacing its backend. To run the engine on your own servers, ask about [self-hosting](https://uniweb.io/self-hosted).

---

## Where to go from here

| You want to… | Read |
| --- | --- |
| Know why a site can grow on Uniweb | [Why Uniweb](why-uniweb.md) |
| Follow a site from first page to web app | [How a Site Grows](how-a-site-grows.md) |
| Compare it with other ways to build | [How Uniweb Compares](how-uniweb-compares.md) |
| Start a site with your agent | [Quickstart](quickstart.md) |
| Choose a starting point | [Templates](templates.md) |
| Edit a site's files yourself | [Writing Content](../authoring/writing-content.md) |
| Build section types | [Building with Uniweb](../development/building-with-uniweb.md) |
| Build a web app | [The Application Engine](../web-apps/the-application-engine.md) |
| Choose where the site is hosted | [Deploying](../development/deploying.md) |
| Measure what a site's visitors do | [Measuring Visits](../marketing/measuring-visits.md) |
| Look up a term | [Glossary](../reference/glossary.md) |
