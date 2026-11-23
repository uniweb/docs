---
description: "Why a Uniweb site can keep changing and growing with its business, from a few pages to a web app, without being rebuilt or pieced together from separate tools."
---

# Why Uniweb

A website's launch is the start of its life, not the end of the work. Its content changes. The business adds a language, a product line, a person who edits pages. Then it needs a form, a place where customers sign in, a way to take payments. And all along, someone has to bring visitors to it.

Each of those changes usually brings another tool: a CMS so others can edit, a plugin for each language, a form service, an analytics script, a separate app with its own backend for the members' area, an ad manager. Each one has to be chosen, connected and kept up to date, and some changes mean rebuilding what was there.

Uniweb is made for the whole of a site's life, and four things make that work.

---

## What a site says is kept apart from the code that draws it

What a site says is content: its words and records, in plain text files, and its pictures. How it looks is code, in React components. Each section of a page names its kind, its **section type**, such as a hero or a price table, and holds its content, and the component for that type decides how it looks.

So the changes a site goes through don't get in each other's way:

- someone edits a headline in Uniweb App, and the design stays as it was;
- your agent reworks the design, and no word is lost;
- a language is added, and no component changes, because components receive their content already translated.

It also makes the site a set of building blocks. In Uniweb App, the people who edit compose pages from the site's section types, each with the options its developer gave it, so they can change the pages without breaking the design. [Component Content Architecture](../architecture/component-content-architecture.md) explains the idea for developers.

## What a site can grow into is already built

Languages, site search and pages that AI assistants can read are part of the framework. Forms, visitor statistics and content that updates live are services of Uniweb hosting. Accounts, members' data, permissions and payments come with the site's own Application Engine, so a web app's developer builds only what is particular to it: its screens and the kinds of thing it holds. Promote is in Uniweb App.

A site turns each one on when it needs it, often with a single entry in its settings. None of them is a plugin to find, install and keep up to date. What grows is the site, by addition: a step may add a section type, such as one that draws a form, but nothing made before has to change.

## A website and a web app are one site

When a site needs members, it doesn't become a second project. The same site, on the same domain, serves its public pages to everyone, and their own pages to members who sign in: their orders, their courses, their bookings. The same code draws both, and the Application Engine behind it keeps accounts, data and permissions, so nobody writes a backend.

The two sides are made differently. The public pages, with their static and dynamic content, are composed from the site's section types by whoever edits the site. The members' pages are designed and built by the developer, like the screens of any React app, and nobody composes them; the SDK does the work every web app repeats, from sign-in to reading and writing each member's data. Even so, the words on those screens, such as a heading, can stay content, edited and translated like the rest.

## One platform, so its parts work together

The tools for building, editing, hosting and promoting a site are one platform, so they work together without being connected by hand:

- Every publish updates the site in Uniweb App, so it is ready to preview and edit at any time, whether or not anyone uses the app yet.
- Edits made in Uniweb App come back to the project as a Git merge, and your agent checks for them before it works.
- Visitor statistics need no tag to install, and Promote counts what each post and campaign brought with those same statistics.
- Uniweb hosting can tell X and Meta which of their ad clicks led to a sign-up, from its servers, with nothing added to your pages.
- Your agent works on all of it with one command-line tool: the site, its publishing and its promotion.

---

## When Uniweb fits

Uniweb fits a site that will keep changing: a business's website, a store, a school, a community, an online course. It can be built by one person with an AI agent, or by a team of developers and editors, and it can start as a few pages or as a web app. Whatever its size, it stays one project, on one platform. [How Uniweb Compares](how-uniweb-compares.md) sets it beside the other ways to build a site, with what each one gives up.

---

## See also

- [What is Uniweb](what-is-uniweb.md): the parts of Uniweb, and what a project holds
- [How a Site Grows](how-a-site-grows.md): one site, from first page to web app
- [Quickstart](quickstart.md): the prompt to start with
- [The Application Engine](../web-apps/the-application-engine.md): the backend a web app gets
