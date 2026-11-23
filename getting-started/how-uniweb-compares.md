---
description: "How Uniweb compares with the usual ways to build a website or web app: separate tools put together, a backend-as-a-service, a full-stack framework, and a site builder."
---

# How Uniweb Compares

If you have built a website or a web app before, you probably used one of four approaches: separate tools put together, a backend-as-a-service, a full-stack framework, or a site builder. Uniweb borrows from each. Like a full-stack framework, it keeps the whole site in one project. Like a backend-as-a-service, it gives a web app its backend with no server to run. Like a site builder, it lets people edit the pages in the browser.

This page sets Uniweb beside each approach: what is the same, what is different, and what you gain. Products change, so it compares approaches, and the products it names are only examples of each, as of November 2026.

---

## Separate tools, put together

A common way to build a site today is to assemble it: a front-end framework such as Next.js, a headless CMS for the people who edit, a backend service for accounts and data, a host that builds the site, an analytics script and an ad manager. Each part can be the best of its kind, and any of them can be replaced.

The work is in the joins. The CMS's content model and the components that draw it are defined in two places and kept in step by hand. Accounts and data are wired between the front end and the backend. And each part has its own account, bill and updates.

| | separate tools | Uniweb |
| --- | --- | --- |
| Editing | a content model defined in the CMS, kept in step with the components | each section type's `meta.js` declares its options, and Uniweb App builds its controls from it |
| Where content lives | usually the CMS's own store, apart from the code | the project's files, with edits made in Uniweb App merged back into Git |
| Accounts and data | a backend service, connected by your code | the Application Engine, reached through the SDK's React hooks |
| Going live | a build and deploy, run by the host or a pipeline you set up | `uniweb publish`, with no site build |
| Statistics and ads | scripts and dashboards of their own | statistics from the site itself, and Promote in Uniweb App |

**What you gain:** no joins to build or keep. The editor works from the same section types the site is drawn with, the content stays in your project, and the site is published, edited and paid for in one place, Uniweb App.

---

## A backend-as-a-service

A backend-as-a-service, such as Firebase or Supabase, gives an app a database, sign-in and an API with no servers to run. It is general-purpose: you design the tables or collections, and write the rules that protect them.

The Application Engine works at the level of the app's domain. You declare the kinds of thing the app holds, such as a course, a lesson and a submission, as data schemas. The engine keeps each entry with its owner and the people it is shared with, checks the type's rules on every write, and keeps a history that can't be rewritten where you ask for one. It also has what most web apps need besides data: roles and teams, a store that takes payments through the owner's own Stripe account, an inbox for each member, integrations with other systems, and the Solution Owner Console, where the owner sets roles, coupons and the Stripe account. On Uniweb hosting, each web app gets a dedicated engine with its own PostgreSQL database.

| | backend-as-a-service | the Application Engine |
| --- | --- | --- |
| What you define | tables or collections, and the rules that guard them | data schemas, and a `blueprint.yml` that says who may sign up and what each person may see |
| Who may see what | rules you write for each table or collection | each entry's owner and the people it is shared with, checked by the engine |
| Payments and messages | other services, extensions or code of your own | the engine's store and inbox |
| From the front end | a client library and the queries you write | the SDK's React hooks, with no routes, tokens or fetch code |

**What you gain:** a backend that already has what most web apps need, so you write no tables, access rules, queries or server routes. Logic of your own goes where it fits: in the browser, in a [compute function](../web-apps/compute-functions.md) the platform runs, or in an outside service through an integration.

---

## A full-stack framework

Full-stack frameworks such as Rails, Laravel or Django keep the front end and the back end in one codebase, which is much of why they are productive. You write the models, the migrations, the routes and the access checks, and you run the servers or choose a host that runs them.

Uniweb keeps the single project and leaves out the server code. The public pages and the members' area are one React project, and the backend is the Application Engine, which needs no models, migrations or routes of yours: only data schemas and a blueprint. The public pages can also be edited in Uniweb App, which a framework doesn't come with.

| | full-stack framework | Uniweb |
| --- | --- | --- |
| Back end | models, migrations, routes and access checks you write | data schemas and a blueprint; the engine does the rest |
| Front end | server templates, or a front-end framework added on top | React section types, for the public pages and the members' screens alike |
| Page editing | a CMS you add | Uniweb App, on the section types you built |
| Servers | yours, or a host's | none of yours: Uniweb hosting and the engine run the site |

**What you gain:** one project, as with a framework, without the backend code every app repeats or servers to run, and with public pages your authors edit in Uniweb App. What is particular to your app stays code of your own, in its section types and [wherever its logic fits](../web-apps/the-application-engine.md#where-your-logic-runs).

---

## A site builder

Site builders and CMSs such as WordPress, Wix, Squarespace or Webflow let people make and edit pages in the browser, and add features through plugins, apps or the tool's own options. The site is kept in the tool's database, in its format.

In Uniweb App, people edit pages too, but they compose them from section types that an agent or a developer made in code, so every page keeps the site's design. The site itself is your project, in files you own, and what it grows into, from more languages to a members' area with payments, is part of the platform rather than a plugin.

| | site builder | Uniweb |
| --- | --- | --- |
| Who makes the design | whoever edits, from the tool's blocks or a theme | your agent or a developer, as section types that others compose with |
| Where the site is kept | the tool's database | your project: Markdown, YAML and React, in Git |
| Adding features | plugins, apps or the tool's options | services and the engine, turned on in the site's settings |
| Members and payments | what the tool or its plugins provide | a web app of your own, on the Application Engine |

**What you gain:** pages that keep the site's design whoever edits them, a site kept in your own files, and room to become a web app without moving. When the site needs a new kind of section, your agent or a developer adds it in code.

---

## See also

- [What is Uniweb](what-is-uniweb.md): the parts of Uniweb, and what a project holds
- [Why Uniweb](why-uniweb.md): why a site can grow without being rebuilt
- [The Application Engine](../web-apps/the-application-engine.md): the backend a web app gets
- [Deploying](../development/deploying.md): Uniweb hosting and static hosts, side by side
